import {
  ensureDatabaseSchema,
  type D1Database,
} from "./database";

interface ApiEnv {
  ACCOUNT_HASH_SECRET?: string;
  ANALYTICS_ADMIN_USER_ID?: string;
  DB?: D1Database;
}

interface AccountUser {
  displayName: string;
  userId: string;
}

type JsonRecord = Record<string, unknown>;

const AUTH_EMAIL_HEADER = "oai-authenticated-user-email";
const AUTH_NAME_HEADER = "oai-authenticated-user-full-name";
const AUTH_NAME_ENCODING_HEADER = "oai-authenticated-user-full-name-encoding";
const AUTH_NAME_ENCODING = "percent-encoded-utf-8";
const MAX_REQUEST_BYTES = 128_000;
const REPORT_PRIVACY_THRESHOLD = 5;
const LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const LESSON_SUFFIXES = ["clarify", "limit", "engineer", "assess", "refine"];
const COURSE_MODULE_IDS = new Set(
  [...LEVELS].flatMap((level) =>
    LESSON_SUFFIXES.map((suffix) => `${level}-${suffix}`),
  ),
);
const CAPSTONE_IDS = new Set([...LEVELS].map((level) => `${level}-capstone`));
const STUDIO_PROGRESS_IDS = new Set([
  "model-selector",
  "custom-gpt",
  "chatgpt-skills",
  "chatgpt-skills-beginner",
  "chatgpt-skills-intermediate",
  "chatgpt-skills-advanced",
  "codex-skills",
  "image-prompts",
  "role-use-cases",
  "template-library",
  "safe-data",
  "ai-updates",
  "knowledge-check",
]);
const ROLE_VALUES = new Set([
  "Systems Engineering & Integration",
  "Software, Data, AI & Information Technology",
  "Cybersecurity & Information Assurance",
  "Test, Evaluation, Training, Quality & Safety",
  "Program & Project Management",
  "Acquisition, Contracts & Subcontracts",
  "Business Development, Capture & Proposals",
  "Solutions Architecture & Technical Strategy",
  "Mission Support, Logistics & Sustainment",
  "Space, UxS & Mission Technology",
  "Analysis, Configuration & Technical Services",
  "Legal, Ethics, Compliance & Corporate Security",
  "Finance, Accounting, Pricing & Procurement",
  "Human Resources, Talent & Workforce Development",
  "Communications, Marketing & Business Operations",
  "Defense-contractor mission and business teams",
]);
const ANALYTICS_EVENTS = new Set([
  "onboarding_completed",
  "lesson_started",
  "lesson_abandoned",
  "quiz_retried",
  "studio_opened",
  "studio_activity_completed",
]);
const LESSON_CONTEXT = /^(?:beginner|intermediate|advanced)-(?:clarify|limit|engineer|assess|refine)$/;
const STUDIO_CONTEXTS = new Set([
  "model-selector",
  "custom-gpt",
  "chatgpt-skills",
  "chatgpt-skills-beginner",
  "chatgpt-skills-intermediate",
  "chatgpt-skills-advanced",
  "image-prompts",
  "role-use-cases",
  "template-library",
  "safe-data",
  "ai-updates",
  "knowledge-check",
]);
const BOOKMARK_IDENTIFIER = /^(?:(?:template|use-case):)?[a-z0-9][a-z0-9-]{0,99}$/;

function json(payload: unknown, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function readJson(request: Request): Promise<JsonRecord | null> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return null;
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) return null;
  try {
    const source = await request.text();
    if (new TextEncoder().encode(source).byteLength > MAX_REQUEST_BYTES) return null;
    const value = JSON.parse(source) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as JsonRecord;
  } catch {
    return null;
  }
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function accountUser(
  request: Request,
  identitySecret: string,
): Promise<AccountUser | null> {
  const email = request.headers.get(AUTH_EMAIL_HEADER)?.trim().toLowerCase();
  if (!email) return null;
  const encodedName = request.headers.get(AUTH_NAME_HEADER);
  const fullName =
    encodedName &&
    request.headers.get(AUTH_NAME_ENCODING_HEADER)?.toLowerCase() ===
      AUTH_NAME_ENCODING
      ? safeDecode(encodedName)
      : null;
  return {
    displayName: fullName?.trim().slice(0, 80) || "Signed-in learner",
    userId: await hmacSha256(`v1:${email}`, identitySecret),
  };
}

function stringArray(value: unknown, maximum = 100): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 100))
        .filter((item) => /^[a-z0-9-]{1,100}$/.test(item))
        .slice(0, maximum),
    ),
  ];
}

function allowlistedArray(
  value: unknown,
  allowed: Set<string>,
  maximum = 100,
): string[] {
  return stringArray(value, maximum).filter((item) => allowed.has(item));
}

function bookmarkArray(value: unknown, maximum = 100): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => BOOKMARK_IDENTIFIER.test(item))
        .slice(0, maximum),
    ),
  ];
}

export interface BookmarkChanges {
  added: string[];
  removed: string[];
}

export function bookmarkChangesRecord(value: unknown): BookmarkChanges | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as JsonRecord;
  if (!Array.isArray(source.added) || !Array.isArray(source.removed)) return null;
  const added = bookmarkArray(source.added);
  const removedSet = new Set(bookmarkArray(source.removed));
  return {
    added: added.filter((bookmark) => !removedSet.has(bookmark)),
    removed: [...removedSet],
  };
}

export function progressRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as JsonRecord;
  const selectedLevel = LEVELS.has(String(source.selectedLevel))
    ? String(source.selectedLevel)
    : "beginner";
  const profileSource =
    source.profile && typeof source.profile === "object" && !Array.isArray(source.profile)
      ? (source.profile as JsonRecord)
      : null;
  const profile = profileSource
    ? {
        name: "Learner",
        role:
          typeof profileSource.role === "string" &&
          ROLE_VALUES.has(profileSource.role.trim())
            ? profileSource.role.trim()
            : "Defense-contractor mission and business teams",
        confidence:
          typeof profileSource.confidence === "number" &&
          Number.isFinite(profileSource.confidence)
            ? Math.max(1, Math.min(5, Math.round(profileSource.confidence)))
            : 3,
        tasks: [],
      }
    : null;
  const rawScores =
    source.quizScores &&
    typeof source.quizScores === "object" &&
    !Array.isArray(source.quizScores)
      ? (source.quizScores as JsonRecord)
      : {};
  const quizScores = Object.fromEntries(
    Object.entries(rawScores)
      .filter(
        ([key, score]) =>
          COURSE_MODULE_IDS.has(key) &&
          typeof score === "number" &&
          Number.isFinite(score),
      )
      .slice(0, 100)
      .map(([key, score]) => [key, Math.max(0, Math.min(3, Math.floor(score as number)))]),
  );
  const currentTarget =
    typeof source.currentTarget === "string" &&
    (COURSE_MODULE_IDS.has(source.currentTarget) ||
      CAPSTONE_IDS.has(source.currentTarget))
      ? source.currentTarget
      : null;
  return {
    version: 2,
    profile,
    selectedLevel,
    completedModules: allowlistedArray(source.completedModules, COURSE_MODULE_IDS),
    completedCapstones: allowlistedArray(
      source.completedCapstones,
      CAPSTONE_IDS,
      20,
    ),
    quizScores,
    studioCompleted: allowlistedArray(source.studioCompleted, STUDIO_PROGRESS_IDS),
    bookmarks: bookmarkArray(source.bookmarks),
    currentTarget,
    currentStage:
      typeof source.currentStage === "number" && Number.isFinite(source.currentStage)
        ? Math.max(0, Math.min(3, Math.floor(source.currentStage)))
        : 0,
    resetEpoch:
      typeof source.resetEpoch === "number" && Number.isFinite(source.resetEpoch)
        ? Math.max(0, Math.floor(source.resetEpoch))
        : 0,
    lastVisitedAt:
      typeof source.lastVisitedAt === "string"
        ? source.lastVisitedAt.slice(0, 40)
        : null,
  };
}

export function mergeProgress(
  server: JsonRecord | null,
  client: JsonRecord,
  bookmarkChanges?: BookmarkChanges,
): JsonRecord {
  if (!server) return client;
  const serverResetEpoch = Number(server.resetEpoch ?? 0);
  const clientResetEpoch = Number(client.resetEpoch ?? 0);
  if (clientResetEpoch > serverResetEpoch) return client;
  if (serverResetEpoch > clientResetEpoch) return server;
  const serverScores = (server.quizScores ?? {}) as Record<string, number>;
  const clientScores = (client.quizScores ?? {}) as Record<string, number>;
  const quizScores = { ...serverScores };
  for (const [id, score] of Object.entries(clientScores)) {
    quizScores[id] = Math.max(quizScores[id] ?? 0, score);
  }
  let bookmarks: string[];
  if (bookmarkChanges) {
    const nextBookmarks = new Set(bookmarkArray(server.bookmarks));
    for (const bookmark of bookmarkChanges.added) nextBookmarks.add(bookmark);
    for (const bookmark of bookmarkChanges.removed) nextBookmarks.delete(bookmark);
    bookmarks = [...nextBookmarks];
  } else {
    bookmarks = bookmarkArray([
      ...bookmarkArray(server.bookmarks),
      ...bookmarkArray(client.bookmarks),
    ]);
  }
  return {
    ...server,
    ...client,
    resetEpoch: clientResetEpoch,
    profile: client.profile ?? server.profile ?? null,
    completedModules: allowlistedArray([
      ...allowlistedArray(server.completedModules, COURSE_MODULE_IDS),
      ...allowlistedArray(client.completedModules, COURSE_MODULE_IDS),
    ], COURSE_MODULE_IDS),
    completedCapstones: allowlistedArray([
      ...allowlistedArray(server.completedCapstones, CAPSTONE_IDS),
      ...allowlistedArray(client.completedCapstones, CAPSTONE_IDS),
    ], CAPSTONE_IDS, 20),
    studioCompleted: allowlistedArray([
      ...allowlistedArray(server.studioCompleted, STUDIO_PROGRESS_IDS),
      ...allowlistedArray(client.studioCompleted, STUDIO_PROGRESS_IDS),
    ], STUDIO_PROGRESS_IDS),
    bookmarks,
    quizScores,
  };
}

function emptyProgress(resetEpoch: number): JsonRecord {
  return {
    version: 2,
    profile: null,
    selectedLevel: "beginner",
    completedModules: [],
    completedCapstones: [],
    quizScores: {},
    studioCompleted: [],
    bookmarks: [],
    currentTarget: null,
    currentStage: 0,
    resetEpoch,
    lastVisitedAt: null,
  };
}

function signInPath(): string {
  return "/signin-with-chatgpt?return_to=%2F";
}

async function handleSync(
  request: Request,
  database: D1Database,
  identitySecret: string,
): Promise<Response> {
  const user = await accountUser(request, identitySecret);
  if (!user) {
    return json({ signedIn: false, signInPath: signInPath() }, 401);
  }
  const loadStored = () =>
    database
      .prepare(
        "SELECT progress_json AS progressJson, revision, updated_at AS updatedAt FROM progress_records WHERE user_id = ?",
      )
      .bind(user.userId)
      .first<{ progressJson: string; revision: number; updatedAt: string }>();
  const loadDeletion = () =>
    database
      .prepare(
        `SELECT reset_epoch AS resetEpoch, sync_enabled AS syncEnabled,
                deleted_at AS deletedAt
         FROM sync_deletions WHERE user_id = ?`,
      )
      .bind(user.userId)
      .first<{ resetEpoch: number; syncEnabled: number; deletedAt: string }>();

  if (request.method === "GET") {
    const [stored, deletion] = await Promise.all([loadStored(), loadDeletion()]);
    let cloudProgress: JsonRecord | null = null;
    if (stored) {
      try {
        cloudProgress = progressRecord(JSON.parse(stored.progressJson));
      } catch {
        cloudProgress = null;
      }
    }
    if (
      deletion &&
      deletion.resetEpoch > Number(cloudProgress?.resetEpoch ?? -1)
    ) {
      cloudProgress = emptyProgress(deletion.resetEpoch);
    }
    return json({
      signedIn: true,
      displayName: user.displayName,
      progress: cloudProgress,
      revision: stored?.revision ?? 0,
      updatedAt: stored?.updatedAt ?? null,
      syncEnabled: deletion ? deletion.syncEnabled === 1 : true,
    });
  }

  if (request.method === "DELETE" && sameOrigin(request)) {
    const [stored, deletion] = await Promise.all([loadStored(), loadDeletion()]);
    let storedResetEpoch = 0;
    if (stored) {
      try {
        storedResetEpoch = Number(
          progressRecord(JSON.parse(stored.progressJson))?.resetEpoch ?? 0,
        );
      } catch {
        storedResetEpoch = 0;
      }
    }
    const resetEpoch = Math.max(storedResetEpoch, deletion?.resetEpoch ?? 0) + 1;
    await database.batch([
      database
        .prepare(
          "DELETE FROM cohort_members WHERE cohort_id IN (SELECT id FROM cohorts WHERE owner_user_id = ?)",
        )
        .bind(user.userId),
      database
        .prepare("DELETE FROM cohorts WHERE owner_user_id = ?")
        .bind(user.userId),
      database
        .prepare("DELETE FROM cohort_members WHERE user_id = ?")
        .bind(user.userId),
      database
        .prepare("DELETE FROM progress_records WHERE user_id = ?")
        .bind(user.userId),
      database
        .prepare(
          `INSERT INTO sync_deletions(
             user_id, reset_epoch, sync_enabled, deleted_at
           ) VALUES (?, ?, 0, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id) DO UPDATE SET
             reset_epoch = excluded.reset_epoch,
             sync_enabled = 0,
             deleted_at = CURRENT_TIMESTAMP`,
        )
        .bind(user.userId, resetEpoch),
    ]);
    return json({ deleted: true, resetEpoch });
  }

  if (request.method !== "POST" || !sameOrigin(request)) {
    return json({ error: "Method or origin not allowed." }, 405);
  }
  const body = await readJson(request);
  const clientProgress = progressRecord(body?.progress);
  const bookmarkChanges = bookmarkChangesRecord(body?.bookmarkChanges);
  const enableSync = body?.enableSync === true;
  if (!body || !clientProgress || !bookmarkChanges) {
    return json({ error: "Invalid progress data." }, 400);
  }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const [stored, initialDeletion] = await Promise.all([
      loadStored(),
      loadDeletion(),
    ]);
    let deletion = initialDeletion;
    if (deletion && deletion.syncEnabled !== 1) {
      if (!enableSync) {
        return json(
          {
            error: "Cloud sync was deleted. Enable it again explicitly to upload from this device.",
            syncDisabled: true,
            progress: emptyProgress(deletion.resetEpoch),
          },
          409,
        );
      }
      if (Number(clientProgress.resetEpoch ?? 0) < deletion.resetEpoch) {
        return json(
          {
            error: "This device must acknowledge the cloud deletion before sync can be enabled again.",
            syncDisabled: true,
            progress: emptyProgress(deletion.resetEpoch),
          },
          409,
        );
      }
      await database
        .prepare(
          `UPDATE sync_deletions SET sync_enabled = 1
           WHERE user_id = ? AND reset_epoch = ? AND sync_enabled = 0`,
        )
        .bind(user.userId, deletion.resetEpoch)
        .run();
      deletion = await loadDeletion();
      if (!deletion || deletion.syncEnabled !== 1) continue;
    }
    let serverProgress: JsonRecord | null = null;
    if (stored) {
      try {
        serverProgress = progressRecord(JSON.parse(stored.progressJson));
      } catch {
        serverProgress = null;
      }
    }
    if (
      deletion &&
      deletion.resetEpoch > Number(serverProgress?.resetEpoch ?? -1)
    ) {
      serverProgress = emptyProgress(deletion.resetEpoch);
    }
    if (Number(clientProgress.resetEpoch ?? 0) < Number(serverProgress?.resetEpoch ?? 0)) {
      return json({
        signedIn: true,
        displayName: user.displayName,
        progress: serverProgress,
        revision: stored?.revision ?? 0,
        merged: true,
      });
    }
    const merged = mergeProgress(serverProgress, clientProgress, bookmarkChanges);
    const revision = (stored?.revision ?? 0) + 1;
    const result = stored
      ? await database
          .prepare(
            `UPDATE progress_records
             SET progress_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ? AND revision = ?
               AND NOT EXISTS (
                 SELECT 1 FROM sync_deletions
                 WHERE user_id = ?
                   AND (reset_epoch > ? OR sync_enabled = 0)
               )`,
          )
          .bind(
            JSON.stringify(merged),
            revision,
            user.userId,
            stored.revision,
            user.userId,
            Number(clientProgress.resetEpoch ?? 0),
          )
          .run()
      : await database
          .prepare(
            `INSERT INTO progress_records(user_id, progress_json, revision, updated_at)
             SELECT ?, ?, ?, CURRENT_TIMESTAMP
             WHERE NOT EXISTS (
               SELECT 1 FROM sync_deletions
               WHERE user_id = ?
                 AND (reset_epoch > ? OR sync_enabled = 0)
             )
             ON CONFLICT(user_id) DO NOTHING`,
          )
          .bind(
            user.userId,
            JSON.stringify(merged),
            revision,
            user.userId,
            Number(clientProgress.resetEpoch ?? 0),
          )
          .run();

    // D1 reports zero changes when another device wins the revision race.
    // Older test doubles omit metadata, which represents a successful write.
    if (result.meta?.changes !== 0) {
      return json({
        signedIn: true,
        displayName: user.displayName,
        progress: merged,
        revision,
        merged: Boolean(stored),
        syncEnabled: true,
      });
    }
  }
  return json({ error: "Progress changed on another device. Please retry." }, 409);
}

function randomAccessCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export interface ProgressSummary {
  completedModules: number;
  completedCapstones: number;
  studioCompleted: number;
  quizAverage: number | null;
}

export function summarizeProgress(value: unknown): ProgressSummary | null {
  const progress = progressRecord(value);
  if (!progress) return null;
  const scores = Object.values(progress.quizScores as Record<string, number>);
  return {
    completedModules: stringArray(progress.completedModules).length,
    completedCapstones: stringArray(progress.completedCapstones).length,
    studioCompleted: stringArray(progress.studioCompleted).length,
    quizAverage: scores.length
      ? Math.round((scores.reduce((total, score) => total + score, 0) / (scores.length * 3)) * 100)
      : null,
  };
}

async function cohortReport(database: D1Database, cohortId: string) {
  const members = await database
    .prepare(
      `SELECT cm.user_id AS userId, pr.progress_json AS progressJson
       FROM cohort_members cm
       LEFT JOIN progress_records pr ON pr.user_id = cm.user_id
       WHERE cm.cohort_id = ? AND cm.sharing_enabled = 1`,
    )
    .bind(cohortId)
    .all<{ userId: string; progressJson: string | null }>();
  const rows = members.results ?? [];
  const summaries = rows
    .map((row) => {
      if (!row.progressJson) return null;
      try {
        return summarizeProgress(JSON.parse(row.progressJson));
      } catch {
        return null;
      }
    })
    .filter((summary): summary is ProgressSummary => Boolean(summary));
  return aggregateProgressSummaries(summaries, rows.length);
}

export function aggregateProgressSummaries(
  summaries: ProgressSummary[],
  memberCount = summaries.length,
) {
  const available = summaries.length >= REPORT_PRIVACY_THRESHOLD;
  const roundedAverage = (
    key: keyof Omit<ProgressSummary, "quizAverage">,
    bucketSize: number,
    maximum: number,
  ) =>
    available
      ? Math.min(
          maximum,
          Math.round(
            summaries.reduce((total, summary) => total + summary[key], 0) /
              summaries.length /
              bucketSize,
          ) * bucketSize,
        )
      : null;
  const quizScores = summaries
    .map((summary) => summary.quizAverage)
    .filter((score): score is number => score !== null);
  return {
    memberCount,
    syncedMemberCount: summaries.length,
    minimumGroupSize: REPORT_PRIVACY_THRESHOLD,
    available,
    averages: available
      ? {
          // These are intentionally coarse buckets. Exact small-cohort means
          // make it possible to infer one learner's change between refreshes.
          completedModules: roundedAverage("completedModules", 2, 15) ?? 0,
          completedCapstones:
            roundedAverage("completedCapstones", 1, 3) ?? 0,
          studioCompleted: roundedAverage("studioCompleted", 2, 20) ?? 0,
          quizScore:
            quizScores.length >= REPORT_PRIVACY_THRESHOLD
              ? Math.min(
                  100,
                  Math.round(
                    quizScores.reduce((total, score) => total + score, 0) /
                      quizScores.length /
                      20,
                  ) * 20,
                )
              : null,
        }
      : null,
  };
}

async function handleCohorts(
  request: Request,
  database: D1Database,
  identitySecret: string,
): Promise<Response> {
  const user = await accountUser(request, identitySecret);
  if (!user) return json({ signedIn: false, signInPath: signInPath() }, 401);
  if (request.method === "GET") {
    const ownedResult = await database
      .prepare(
        "SELECT id, name, created_at AS createdAt FROM cohorts WHERE owner_user_id = ? ORDER BY created_at DESC",
      )
      .bind(user.userId)
      .all<{ id: string; name: string; createdAt: string }>();
    const memberships = await database
      .prepare(
        `SELECT c.id, c.name, cm.joined_at AS joinedAt
         FROM cohort_members cm JOIN cohorts c ON c.id = cm.cohort_id
         WHERE cm.user_id = ? ORDER BY cm.joined_at DESC`,
      )
      .bind(user.userId)
      .all<{ id: string; name: string; joinedAt: string }>();
    const owned = await Promise.all(
      (ownedResult.results ?? []).map(async (cohort) => ({
        ...cohort,
        report: await cohortReport(database, cohort.id),
      })),
    );
    return json({ signedIn: true, owned, memberships: memberships.results ?? [] });
  }
  if (request.method !== "POST" || !sameOrigin(request)) {
    return json({ error: "Method or origin not allowed." }, 405);
  }
  const body = await readJson(request);
  if (!body) return json({ error: "Invalid cohort request." }, 400);
  const action = body?.action;
  if (action === "create") {
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
    if (!name) return json({ error: "Enter a cohort name." }, 400);
    const accessCode = randomAccessCode();
    const cohortId = crypto.randomUUID();
    await database
      .prepare(
        `INSERT INTO cohorts(
          id, name, owner_user_id, access_code_hash, access_code_expires_at
        ) VALUES (?, ?, ?, ?, datetime('now', '+30 days'))`,
      )
      .bind(cohortId, name, user.userId, await sha256(accessCode))
      .run();
    return json({ created: true, cohort: { id: cohortId, name }, accessCode }, 201);
  }
  if (action === "join") {
    if (body.consentVersion !== "aggregate-v1") {
      return json({ error: "Confirm aggregate progress sharing to join." }, 400);
    }
    const accessCode =
      typeof body.accessCode === "string"
        ? body.accessCode.trim().toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 32)
        : "";
    if (!accessCode) return json({ error: "Enter a valid cohort code." }, 400);
    const cohort = await database
      .prepare(
        "SELECT id, name FROM cohorts WHERE access_code_hash = ? AND access_code_expires_at > CURRENT_TIMESTAMP",
      )
      .bind(await sha256(accessCode))
      .first<{ id: string; name: string }>();
    if (!cohort) return json({ error: "That cohort code was not found." }, 404);
    await database
      .prepare(
        `INSERT INTO cohort_members(
           cohort_id, user_id, sharing_enabled, consent_version, consented_at
         ) VALUES (?, ?, 1, 'aggregate-v1', CURRENT_TIMESTAMP)
         ON CONFLICT(cohort_id, user_id) DO UPDATE SET
           sharing_enabled = 1,
           consent_version = 'aggregate-v1',
           consented_at = CURRENT_TIMESTAMP`,
      )
      .bind(cohort.id, user.userId)
      .run();
    return json({ joined: true, cohort });
  }
  if (action === "leave") {
    const cohortId = typeof body.cohortId === "string" ? body.cohortId : "";
    await database
      .prepare("DELETE FROM cohort_members WHERE cohort_id = ? AND user_id = ?")
      .bind(cohortId, user.userId)
      .run();
    return json({ left: true });
  }
  return json({ error: "Unknown cohort action." }, 400);
}

async function handleCohortCsv(
  request: Request,
  database: D1Database,
  cohortId: string,
  identitySecret: string,
): Promise<Response> {
  const user = await accountUser(request, identitySecret);
  if (!user) return json({ error: "Sign in required." }, 401);
  const cohort = await database
    .prepare("SELECT name FROM cohorts WHERE id = ? AND owner_user_id = ?")
    .bind(cohortId, user.userId)
    .first<{ name: string }>();
  if (!cohort) return json({ error: "Cohort not found." }, 404);
  const report = await cohortReport(database, cohortId);
  const rows: Array<[string, string | number]> = [
    ["Cohort", cohort.name],
    ["Members sharing", report.memberCount],
    ["Members with synced progress", report.syncedMemberCount],
    ["Privacy threshold", report.minimumGroupSize],
    ["Report available", report.available ? "Yes" : "No"],
  ];
  if (report.available && report.averages) {
    rows.push(
      ["Privacy rounding", "Completion counts are rounded to coarse bands"],
      ["Approximate lessons completed", report.averages.completedModules],
      ["Approximate capstones completed", report.averages.completedCapstones],
      ["Approximate Studio labs completed", report.averages.studioCompleted],
      ["Quiz score band percent", report.averages.quizScore ?? ""],
    );
  }
  const csv = [
    "Metric,Value",
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\r\n");
  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${cohortId}-aggregate-report.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  const formulaSafe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

export async function cleanupExpiredAnalytics(
  database: D1Database,
): Promise<void> {
  await ensureDatabaseSchema(database);
  await database
    .prepare(
      "DELETE FROM analytics_daily WHERE event_date < date('now', '-395 days')",
    )
    .run();
}

async function handleAnalytics(
  request: Request,
  database: D1Database,
  identitySecret: string,
  analyticsAdminUserId: string,
): Promise<Response> {
  if (request.method === "GET") {
    if (!identitySecret || !analyticsAdminUserId) {
      return json({ error: "Analytics reporting is not configured." }, 403);
    }
    const user = await accountUser(request, identitySecret);
    if (!user || user.userId !== analyticsAdminUserId) {
      return json({ error: "Analytics reporting is restricted." }, 403);
    }
    await cleanupExpiredAnalytics(database);
    const result = await database
      .prepare(
        `SELECT event_date AS eventDate, event_name AS eventName,
                context, event_count AS eventCount
         FROM analytics_daily
         WHERE event_date >= date('now', '-30 days')
         ORDER BY event_date DESC, event_count DESC`,
      )
      .all<{
        eventDate: string;
        eventName: string;
        context: string;
        eventCount: number;
      }>();
    return json({ windowDays: 30, rows: result.results ?? [] });
  }
  if (request.method !== "POST" || !sameOrigin(request)) {
    return json({ error: "Method or origin not allowed." }, 405);
  }
  const body = await readJson(request);
  const event = analyticsRecord(body);
  if (!event) return json({ error: "Unknown event." }, 400);
  const eventDate = new Date().toISOString().slice(0, 10);
  await cleanupExpiredAnalytics(database);
  await database
    .prepare(
      `INSERT INTO analytics_daily(event_date, event_name, context, event_count)
       VALUES (?, ?, ?, 1)
       ON CONFLICT(event_date, event_name, context)
       DO UPDATE SET event_count = event_count + 1`,
    )
    .bind(eventDate, event.eventName, event.context)
    .run();
  return json({ recorded: true }, 202);
}

export function analyticsRecord(
  value: unknown,
): { eventName: string; context: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as JsonRecord;
  const eventName = typeof body.event === "string" ? body.event : "";
  if (!ANALYTICS_EVENTS.has(eventName)) return null;
  const context = typeof body.context === "string" ? body.context : "general";
  const contextAllowed =
    (eventName === "onboarding_completed" && LEVELS.has(context)) ||
    ((eventName === "lesson_started" ||
      eventName === "lesson_abandoned" ||
      eventName === "quiz_retried") &&
      LESSON_CONTEXT.test(context)) ||
    (eventName === "studio_opened" && context === "general") ||
    (eventName === "studio_activity_completed" &&
      STUDIO_CONTEXTS.has(context));
  if (!contextAllowed) return null;
  return {
    eventName,
    context,
  };
}

export async function handleApiRequest(
  request: Request,
  env: ApiEnv | undefined,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;
  if (!env?.DB) return json({ error: "Cloud features are unavailable." }, 503);
  await ensureDatabaseSchema(env.DB);

  const hostname = url.hostname.toLowerCase();
  const identitySecret =
    env.ACCOUNT_HASH_SECRET?.trim() ||
    (hostname === "localhost" || hostname === "127.0.0.1"
      ? "local-development-account-key-only"
      : "");

  if (url.pathname === "/api/account-sync") {
    if (!identitySecret) return json({ error: "Account sync is not configured." }, 503);
    return handleSync(request, env.DB, identitySecret);
  }
  if (url.pathname === "/api/cohorts") {
    if (!identitySecret) return json({ error: "Account sync is not configured." }, 503);
    return handleCohorts(request, env.DB, identitySecret);
  }
  const reportMatch = url.pathname.match(/^\/api\/cohorts\/([a-z0-9-]+)\/report\.csv$/);
  if (reportMatch && request.method === "GET") {
    if (!identitySecret) return json({ error: "Account sync is not configured." }, 503);
    return handleCohortCsv(request, env.DB, reportMatch[1], identitySecret);
  }
  if (url.pathname === "/api/analytics") {
    return handleAnalytics(
      request,
      env.DB,
      identitySecret,
      env.ANALYTICS_ADMIN_USER_ID?.trim() ?? "",
    );
  }
  return json({ error: "API route not found." }, 404);
}
