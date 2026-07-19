import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import {
  accountUser,
  aggregateProgressSummaries,
  analyticsRecord,
  bookmarkChangesRecord,
  cleanupExpiredAnalytics,
  escapeCsvCell,
  handleApiRequest,
  mergeProgress,
  progressRecord,
  summarizeProgress,
} from "./api";
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from "./database";

class SqliteStatement implements D1PreparedStatement {
  constructor(
    private readonly database: DatabaseSync,
    private readonly query: string,
    private readonly values: SQLInputValue[] = [],
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    const sqlValues = values.map((value) => {
      if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "bigint" ||
        ArrayBuffer.isView(value)
      ) {
        return value as SQLInputValue;
      }
      throw new TypeError("The SQLite test adapter received an invalid value.");
    });
    return new SqliteStatement(this.database, this.query, sqlValues);
  }

  async first<T>(): Promise<T | null> {
    return (this.database.prepare(this.query).get(...this.values) as T) ?? null;
  }

  async all<T>(): Promise<D1Result<T>> {
    return {
      success: true,
      results: this.database.prepare(this.query).all(...this.values) as T[],
    };
  }

  async run<T>(): Promise<D1Result<T>> {
    const result = this.database.prepare(this.query).run(...this.values);
    return { success: true, meta: { changes: Number(result.changes) } };
  }
}

class SqliteD1 implements D1Database {
  readonly database = new DatabaseSync(":memory:");

  constructor() {
    for (const migration of [
      "0000_tiny_mandrill.sql",
      "0001_clever_goblin_queen.sql",
      "0002_petite_jubilee.sql",
    ]) {
      const sql = readFileSync(
        new URL(`../drizzle/${migration}`, import.meta.url),
        "utf8",
      ).replaceAll("--> statement-breakpoint", "");
      this.database.exec(sql);
    }
  }

  prepare(query: string): D1PreparedStatement {
    return new SqliteStatement(this.database, query);
  }

  async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    this.database.exec("BEGIN");
    try {
      const results: D1Result<T>[] = [];
      for (const statement of statements) {
        results.push(await statement.run<T>());
      }
      this.database.exec("COMMIT");
      return results;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  close(): void {
    this.database.close();
  }
}

const BASE_PROGRESS = {
  version: 2,
  profile: {
    name: "Learner",
    role: "Cybersecurity & Information Assurance",
    confidence: 2,
    tasks: [],
  },
  selectedLevel: "beginner",
  completedModules: ["beginner-clarify"],
  completedCapstones: [],
  quizScores: { "beginner-clarify": 2 },
  studioCompleted: [],
  bookmarks: [],
  currentTarget: null,
  currentStage: 0,
  resetEpoch: 0,
  lastVisitedAt: null,
};

describe("account progress API normalization", () => {
  it("keeps only bounded, recognized progress fields", () => {
    const normalized = progressRecord({
      ...BASE_PROGRESS,
      selectedLevel: "unknown",
      completedModules: [
        "beginner-clarify",
        "beginner-clarify",
        "invented-module",
        42,
      ],
      studioCompleted: ["ai-updates", "invented-studio-tool"],
      bookmarks: [
        "safe-data",
        "template:decision-brief",
        "use-case:proposal-review",
        "private free text",
      ],
      currentStage: 99,
      quizScores: {
        "beginner-clarify": 99,
        "bad key": 2,
      },
      injected: "not retained",
      profile: {
        name: "Private certificate name",
        role: "Cybersecurity & Information Assurance",
        confidence: 2,
        tasks: ["Private free-text task"],
      },
    });

    expect(normalized?.selectedLevel).toBe("beginner");
    expect(normalized?.completedModules).toEqual(["beginner-clarify"]);
    expect(normalized?.currentStage).toBe(3);
    expect(normalized?.studioCompleted).toEqual(["ai-updates"]);
    expect(normalized?.quizScores).toEqual({ "beginner-clarify": 3 });
    expect(normalized?.bookmarks).toEqual([
      "safe-data",
      "template:decision-brief",
      "use-case:proposal-review",
    ]);
    expect(normalized?.profile).toMatchObject({ name: "Learner", tasks: [] });
    expect(normalized).not.toHaveProperty("injected");
  });

  it("merges devices without losing completions or best quiz scores", () => {
    const server = progressRecord(BASE_PROGRESS);
    const client = progressRecord({
      ...BASE_PROGRESS,
      completedModules: ["beginner-limit"],
      quizScores: { "beginner-clarify": 3, "beginner-limit": 2 },
      bookmarks: ["safe-data"],
    });

    expect(server).not.toBeNull();
    expect(client).not.toBeNull();
    const merged = mergeProgress(server, client as Record<string, unknown>);
    expect(merged.completedModules).toEqual([
      "beginner-clarify",
      "beginner-limit",
    ]);
    expect(merged.quizScores).toEqual({
      "beginner-clarify": 3,
      "beginner-limit": 2,
    });
    expect(merged.bookmarks).toEqual(["safe-data"]);
  });

  it("creates aggregate-ready summaries without profile information", () => {
    expect(summarizeProgress(BASE_PROGRESS)).toEqual({
      completedModules: 1,
      completedCapstones: 0,
      studioCompleted: 0,
      quizAverage: 67,
    });
  });

  it("uses reset epochs so an older device cannot resurrect cleared progress", () => {
    const cleared = progressRecord({
      ...BASE_PROGRESS,
      completedModules: [],
      quizScores: {},
      resetEpoch: 2,
    });
    const staleDevice = progressRecord({
      ...BASE_PROGRESS,
      resetEpoch: 1,
    });

    expect(mergeProgress(cleared, staleDevice as Record<string, unknown>)).toEqual(
      cleared,
    );
  });

  it("applies explicit bookmark removals without resurrecting unrelated state", () => {
    const server = progressRecord({
      ...BASE_PROGRESS,
      bookmarks: ["template:decision-brief", "use-case:proposal-review"],
    });
    const client = progressRecord({
      ...BASE_PROGRESS,
      bookmarks: ["use-case:proposal-review"],
    });
    const changes = bookmarkChangesRecord({
      added: [],
      removed: ["template:decision-brief", "private free text"],
    });

    expect(changes).toEqual({
      added: [],
      removed: ["template:decision-brief"],
    });
    expect(
      mergeProgress(
        server,
        client as Record<string, unknown>,
        changes ?? undefined,
      ).bookmarks,
    ).toEqual(["use-case:proposal-review"]);
  });
});

describe("account identity and privacy aggregation", () => {
  it("normalizes identity into a keyed digest and decodes the display name", async () => {
    const identity = await accountUser(
      new Request("https://example.test/api/account-sync", {
        headers: {
          "oai-authenticated-user-email": "  LEARNER@Example.com ",
          "oai-authenticated-user-full-name": "Ren%C3%A9e%20Learner",
        },
      }),
      "unit-test-only-secret",
    );

    expect(identity?.displayName).toBe("Renée Learner");
    expect(identity?.userId).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(identity)).not.toContain("learner@example.com");
  });

  it("suppresses reports until five learners have synced", () => {
    const summaries = Array.from({ length: 5 }, () => ({
      completedModules: 3,
      completedCapstones: 1,
      studioCompleted: 2,
      quizAverage: 80,
    }));

    expect(aggregateProgressSummaries(summaries.slice(0, 4), 4)).toMatchObject({
      available: false,
      averages: null,
    });
    expect(aggregateProgressSummaries(summaries, 6)).toMatchObject({
      memberCount: 6,
      syncedMemberCount: 5,
      available: true,
      averages: {
        completedModules: 4,
        completedCapstones: 1,
        studioCompleted: 2,
        quizScore: 80,
      },
    });
  });

  it("allows only coarse analytics dimensions", () => {
    expect(
      analyticsRecord({ event: "quiz_retried", context: "beginner-clarify" }),
    ).toEqual({ eventName: "quiz_retried", context: "beginner-clarify" });
    expect(
      analyticsRecord({ event: "lesson_started", context: "private free text" }),
    ).toBeNull();
    expect(
      analyticsRecord({
        event: "studio_activity_completed",
        context: "template-library",
      }),
    ).toEqual({
      eventName: "studio_activity_completed",
      context: "template-library",
    });
    expect(
      analyticsRecord({
        event: "studio_activity_completed",
        context: "made-up-cardinality-key",
      }),
    ).toBeNull();
    expect(analyticsRecord({ event: "prompt_copied", context: "secret" })).toBeNull();
  });
});

describe("aggregate CSV safety", () => {
  it("quotes Unicode, line breaks, and spreadsheet formulas", () => {
    expect(escapeCsvCell('Team "\u00c1"\nNorth')).toBe(
      '"Team ""\u00c1""\nNorth"',
    );
    expect(escapeCsvCell("=HYPERLINK(\"bad\")")).toBe(
      '"\'=HYPERLINK(""bad"")"',
    );
    expect(escapeCsvCell("+1")).toBe('"\'+1"');
  });
});

describe("D1 account lifecycle", () => {
  it("keeps deletion durable until a device explicitly enables sync again", async () => {
    const database = new SqliteD1();
    const url = (path: string) => `https://example.test${path}`;
    const request = async (
      path: string,
      method = "GET",
      body?: Record<string, unknown>,
    ) => {
      const response = await handleApiRequest(
        new Request(url(path), {
          method,
          headers: {
            "oai-authenticated-user-email": "learner@example.test",
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...(method === "GET" ? {} : { Origin: "https://example.test" }),
          },
          body: body ? JSON.stringify(body) : undefined,
        }),
        { DB: database, ACCOUNT_HASH_SECRET: "integration-test-secret" },
      );
      expect(response).not.toBeNull();
      return response as Response;
    };

    try {
      const originalBody = {
        progress: {
          ...BASE_PROGRESS,
          bookmarks: ["template:decision-brief"],
        },
        revision: 0,
        enableSync: false,
        bookmarkChanges: {
          added: ["template:decision-brief"],
          removed: [],
        },
      };
      expect((await request("/api/account-sync", "POST", originalBody)).status).toBe(
        200,
      );
      expect(
        (
          await request("/api/cohorts", "POST", {
            action: "create",
            name: "Privacy test cohort",
          })
        ).status,
      ).toBe(201);

      const deletion = await request("/api/account-sync", "DELETE");
      expect(deletion.status).toBe(200);
      const deletionPayload = (await deletion.json()) as {
        resetEpoch: number;
      };
      expect(deletionPayload.resetEpoch).toBe(1);

      const staleUpload = await request(
        "/api/account-sync",
        "POST",
        originalBody,
      );
      expect(staleUpload.status).toBe(409);

      const afterDeletion = await request("/api/account-sync");
      const afterDeletionPayload = (await afterDeletion.json()) as {
        syncEnabled: boolean;
        progress: typeof BASE_PROGRESS;
      };
      expect(afterDeletionPayload.syncEnabled).toBe(false);
      expect(afterDeletionPayload.progress).toMatchObject({
        resetEpoch: 1,
        completedModules: [],
        bookmarks: [],
      });

      const cohorts = (await (await request("/api/cohorts")).json()) as {
        owned: unknown[];
      };
      expect(cohorts.owned).toEqual([]);

      const explicitEnable = await request("/api/account-sync", "POST", {
        ...originalBody,
        enableSync: true,
        progress: {
          ...originalBody.progress,
          resetEpoch: deletionPayload.resetEpoch,
        },
      });
      expect(explicitEnable.status).toBe(200);
      expect(await explicitEnable.json()).toMatchObject({
        syncEnabled: true,
        progress: {
          resetEpoch: 1,
          completedModules: ["beginner-clarify"],
          bookmarks: ["template:decision-brief"],
        },
      });

      database.database
        .prepare(
          `INSERT INTO analytics_daily(
             event_date, event_name, context, event_count
           ) VALUES ('2020-01-01', 'lesson_started', 'beginner-clarify', 4)`,
        )
        .run();
      await cleanupExpiredAnalytics(database);
      expect(
        database.database
          .prepare(
            "SELECT COUNT(*) AS count FROM analytics_daily WHERE event_date = '2020-01-01'",
          )
          .get()?.count,
      ).toBe(0);
    } finally {
      database.close();
    }
  });
});
