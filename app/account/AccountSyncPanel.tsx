"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TrainingProgress } from "../training-progress";
import {
  ANALYTICS_CONSENT_KEY,
  analyticsConsentEnabled,
  setAnalyticsConsent,
} from "../privacy-analytics";
import "./account-sync.css";

const SYNC_MODE_KEY = "ai-practice-lab-sync-mode";
const SYNC_PENDING_KEY = "ai-practice-lab-sync-sign-in-pending";

interface AccountState {
  checked: boolean;
  signedIn: boolean;
  displayName: string;
  signInPath: string;
  cloudProgress: TrainingProgress | null;
  revision: number;
  syncEnabled: boolean;
}

interface CohortReport {
  memberCount: number;
  syncedMemberCount: number;
  minimumGroupSize: number;
  available: boolean;
  averages: {
    completedModules: number;
    completedCapstones: number;
    studioCompleted: number;
    quizScore: number | null;
  } | null;
}

interface OwnedCohort {
  id: string;
  name: string;
  report: CohortReport;
}

interface Membership {
  id: string;
  name: string;
}

interface AnalyticsRow {
  eventDate: string;
  eventName: string;
  context: string;
  eventCount: number;
}

interface ApiErrorPayload {
  error?: string;
  syncDisabled?: boolean;
  progress?: TrainingProgress;
}

class ApiResponseError extends Error {
  constructor(
    message: string,
    readonly payload: ApiErrorPayload,
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

const INITIAL_ACCOUNT: AccountState = {
  checked: false,
  signedIn: false,
  displayName: "",
  signInPath: "/signin-with-chatgpt?return_to=%2F",
  cloudProgress: null,
  revision: 0,
  syncEnabled: true,
};

const SIMPLE_IDENTIFIER = /^[a-z0-9-]{1,100}$/;
const BOOKMARK_IDENTIFIER = /^(?:(?:template|use-case):)?[a-z0-9][a-z0-9-]{0,99}$/;

function identifiers(
  values: string[],
  maximum = 100,
  pattern = SIMPLE_IDENTIFIER,
): string[] {
  return [...new Set(values)]
    .filter((value) => pattern.test(value))
    .slice(0, maximum);
}

async function responseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ApiErrorPayload;
  if (!response.ok) {
    throw new ApiResponseError(
      payload.error || "The request could not be completed.",
      payload,
    );
  }
  return payload;
}

export function minimizeProgressForSync(
  progress: TrainingProgress,
): TrainingProgress {
  return {
    ...progress,
    profile: progress.profile
      ? {
          name: "Learner",
          role: progress.profile.role,
          confidence: progress.profile.confidence,
          tasks: [],
        }
      : null,
    completedModules: identifiers(progress.completedModules),
    completedCapstones: identifiers(progress.completedCapstones, 20),
    quizScores: Object.fromEntries(
      Object.entries(progress.quizScores)
        .filter(([id, score]) =>
          /^[a-z0-9-]{1,100}$/.test(id) && Number.isFinite(score),
        )
        .slice(0, 100),
    ),
    studioCompleted: identifiers(progress.studioCompleted),
    bookmarks: identifiers(progress.bookmarks, 100, BOOKMARK_IDENTIFIER),
    currentTarget:
      progress.currentTarget && /^[a-z0-9-]{1,100}$/.test(progress.currentTarget)
        ? progress.currentTarget
        : null,
  };
}

export function mergeCloudProgress(
  local: TrainingProgress,
  cloud: TrainingProgress,
  requestSnapshot?: TrainingProgress,
): TrainingProgress {
  if (local.resetEpoch > cloud.resetEpoch) return local;

  const cloudProfile = cloud.profile;
  const localProfile = local.profile;
  const roleChangedDuringRequest = Boolean(
    requestSnapshot && localProfile?.role !== requestSnapshot.profile?.role,
  );
  const confidenceChangedDuringRequest = Boolean(
    requestSnapshot &&
      localProfile?.confidence !== requestSnapshot.profile?.confidence,
  );
  const selectedLevelChangedDuringRequest = Boolean(
    requestSnapshot && local.selectedLevel !== requestSnapshot.selectedLevel,
  );
  const positionChangedDuringRequest = Boolean(
    requestSnapshot &&
      (local.currentTarget !== requestSnapshot.currentTarget ||
        local.currentStage !== requestSnapshot.currentStage),
  );
  const reconciledBookmarks = new Set(cloud.bookmarks);
  if (requestSnapshot) {
    const requestedBookmarks = new Set(requestSnapshot.bookmarks);
    const localBookmarks = new Set(local.bookmarks);
    for (const bookmark of localBookmarks) {
      if (!requestedBookmarks.has(bookmark)) reconciledBookmarks.add(bookmark);
    }
    for (const bookmark of requestedBookmarks) {
      if (!localBookmarks.has(bookmark)) reconciledBookmarks.delete(bookmark);
    }
  }

  const profile = cloudProfile
    ? {
        ...cloudProfile,
        role:
          roleChangedDuringRequest && localProfile
            ? localProfile.role
            : cloudProfile.role,
        confidence:
          confidenceChangedDuringRequest && localProfile
            ? localProfile.confidence
            : cloudProfile.confidence,
        name: localProfile?.name ?? "Learner",
        tasks: localProfile?.tasks ?? [],
      }
    : localProfile;

  if (cloud.resetEpoch > local.resetEpoch) {
    return {
      ...cloud,
      profile,
    };
  }

  const quizScores = { ...cloud.quizScores };
  for (const [id, score] of Object.entries(local.quizScores)) {
    quizScores[id] = Math.max(quizScores[id] ?? 0, score);
  }

  return {
    ...cloud,
    profile,
    selectedLevel: selectedLevelChangedDuringRequest
      ? local.selectedLevel
      : cloud.selectedLevel,
    completedModules: identifiers([
      ...cloud.completedModules,
      ...local.completedModules,
    ]),
    completedCapstones: identifiers(
      [...cloud.completedCapstones, ...local.completedCapstones],
      20,
    ),
    quizScores,
    studioCompleted: identifiers([
      ...cloud.studioCompleted,
      ...local.studioCompleted,
    ]),
    bookmarks: [...reconciledBookmarks],
    currentTarget: positionChangedDuringRequest
      ? local.currentTarget
      : cloud.currentTarget,
    currentStage: positionChangedDuringRequest
      ? local.currentStage
      : cloud.currentStage,
    lastVisitedAt: local.lastVisitedAt ?? cloud.lastVisitedAt,
  };
}

export function AccountSyncPanel({
  progress,
  onApplyProgress,
}: {
  progress: TrainingProgress;
  onApplyProgress: (
    updater: (current: TrainingProgress) => TrainingProgress,
  ) => void;
}) {
  const [account, setAccount] = useState<AccountState>(INITIAL_ACCOUNT);
  const [syncMode, setSyncMode] = useState<"local" | "account">("local");
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [cohortName, setCohortName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [newAccessCode, setNewAccessCode] = useState("");
  const [ownedCohorts, setOwnedCohorts] = useState<OwnedCohort[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [analyticsRows, setAnalyticsRows] = useState<AnalyticsRow[]>([]);
  const lastSyncedPayloadRef = useRef("");
  const onApplyProgressRef = useRef(onApplyProgress);
  const syncableProgress = useMemo(
    () => minimizeProgressForSync(progress),
    [progress],
  );
  const progressPayload = useMemo(
    () => JSON.stringify(syncableProgress),
    [syncableProgress],
  );

  useEffect(() => {
    onApplyProgressRef.current = onApplyProgress;
  }, [onApplyProgress]);

  const loadCohorts = useCallback(async () => {
    const response = await fetch("/api/cohorts", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await responseJson<{
      owned: OwnedCohort[];
      memberships: Membership[];
    }>(response);
    setOwnedCohorts(payload.owned);
    setMemberships(payload.memberships);
    const analyticsResponse = await fetch("/api/analytics", { cache: "no-store" });
    if (analyticsResponse.ok) {
      const analytics = await responseJson<{ rows: AnalyticsRow[] }>(analyticsResponse);
      setAnalyticsRows(analytics.rows);
    }
  }, []);

  useEffect(() => {
    const storedMode =
      window.localStorage.getItem(SYNC_MODE_KEY) === "account"
        ? "account"
        : "local";
    const signInPending =
      window.localStorage.getItem(SYNC_PENDING_KEY) === "pending";
    // These values intentionally hydrate external, device-local preferences.
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setSyncMode(storedMode);
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setAnalyticsEnabled(analyticsConsentEnabled());
    if (storedMode === "local" && !signInPending) {
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setAccount((current) => ({ ...current, checked: true }));
      return;
    }
    const controller = new AbortController();
    void fetch("/api/account-sync", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          signedIn: boolean;
          displayName?: string;
          signInPath?: string;
          progress?: TrainingProgress | null;
          revision?: number;
          syncEnabled?: boolean;
        };
        const serverSyncEnabled = payload.syncEnabled !== false;
        setAccount({
          checked: true,
          signedIn: payload.signedIn,
          displayName: payload.displayName ?? "",
          signInPath: payload.signInPath ?? INITIAL_ACCOUNT.signInPath,
          cloudProgress: payload.progress ?? null,
          revision: payload.revision ?? 0,
          syncEnabled: serverSyncEnabled,
        });
        window.localStorage.removeItem(SYNC_PENDING_KEY);
        if (payload.signedIn && !serverSyncEnabled) {
          window.localStorage.setItem(SYNC_MODE_KEY, "local");
          setSyncMode("local");
          if (payload.progress) {
            onApplyProgressRef.current((current) => ({
              ...current,
              resetEpoch: Math.max(
                current.resetEpoch,
                payload.progress?.resetEpoch ?? 0,
              ),
            }));
          }
          setStatus(
            "Cloud sync was deleted on an account device. This device remains local-only unless you enable sync again.",
          );
        } else if (payload.signedIn && storedMode === "account") {
          void loadCohorts().catch(() => undefined);
        }
      })
      .catch((error: unknown) => {
        window.localStorage.removeItem(SYNC_PENDING_KEY);
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAccount((current) => ({ ...current, checked: true }));
      });
    return () => controller.abort();
  }, [loadCohorts]);

  const syncProgress = useCallback(
    async (announce: boolean, enableSync = false) => {
      if (!account.signedIn) return;
      const requestProgress =
        enableSync && !account.syncEnabled && account.cloudProgress
          ? {
              ...syncableProgress,
              resetEpoch: Math.max(
                syncableProgress.resetEpoch,
                account.cloudProgress.resetEpoch,
              ),
            }
          : syncableProgress;
      const cloudBookmarks = account.cloudProgress?.bookmarks ?? [];
      const localBookmarks = requestProgress.bookmarks;
      setBusy(true);
      try {
        const response = await fetch("/api/account-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progress: requestProgress,
            revision: account.revision,
            enableSync,
            bookmarkChanges: {
              added: localBookmarks.filter(
                (bookmark) => !cloudBookmarks.includes(bookmark),
              ),
              removed: cloudBookmarks.filter(
                (bookmark) => !localBookmarks.includes(bookmark),
              ),
            },
          }),
        });
        const payload = await responseJson<{
          progress: TrainingProgress;
          revision: number;
          syncEnabled?: boolean;
        }>(response);
        lastSyncedPayloadRef.current = JSON.stringify(payload.progress);
        setAccount((current) => ({
          ...current,
          cloudProgress: payload.progress,
          revision: payload.revision,
          syncEnabled: payload.syncEnabled !== false,
        }));
        if (JSON.stringify(payload.progress) !== progressPayload) {
          onApplyProgress((current) =>
            mergeCloudProgress(current, payload.progress, requestProgress),
          );
        }
        if (announce) setStatus("Account progress is up to date.");
      } catch (error) {
        if (error instanceof ApiResponseError && error.payload.syncDisabled) {
          const tombstone = error.payload.progress ?? null;
          setSyncMode("local");
          window.localStorage.setItem(SYNC_MODE_KEY, "local");
          setAccount((current) => ({
            ...current,
            cloudProgress: tombstone,
            revision: 0,
            syncEnabled: false,
          }));
          if (tombstone) {
            onApplyProgress((current) => ({
              ...current,
              resetEpoch: Math.max(
                current.resetEpoch,
                tombstone.resetEpoch,
              ),
            }));
          }
          setStatus(
            `${error.message} This device remains local-only until you choose sync again.`,
          );
          return;
        }
        setStatus(
          navigator.onLine
            ? error instanceof Error
              ? error.message
              : "Sync did not finish."
            : "Offline. Progress is saved on this device and will sync when you reconnect.",
        );
      } finally {
        setBusy(false);
      }
    }, [
      account.revision,
      account.signedIn,
      account.cloudProgress,
      account.syncEnabled,
      onApplyProgress,
      progressPayload,
      syncableProgress,
    ],
  );

  useEffect(() => {
    if (
      syncMode !== "account" ||
      !account.signedIn ||
      progressPayload === lastSyncedPayloadRef.current
    ) {
      return;
    }
    const timer = window.setTimeout(() => void syncProgress(false), 900);
    return () => window.clearTimeout(timer);
  }, [account.signedIn, progressPayload, syncMode, syncProgress]);

  useEffect(() => {
    if (syncMode !== "account" || !account.signedIn) return;
    const resumeSync = () => {
      setStatus("Back online. Syncing progress saved on this device.");
      void syncProgress(false);
    };
    window.addEventListener("online", resumeSync);
    return () => window.removeEventListener("online", resumeSync);
  }, [account.signedIn, syncMode, syncProgress]);

  function chooseSyncMode(mode: "local" | "account") {
    setSyncMode(mode);
    window.localStorage.setItem(SYNC_MODE_KEY, mode);
    if (mode === "account") {
      setStatus("Account sync enabled. Merging this device with your saved progress.");
      void syncProgress(true, true);
      void loadCohorts().catch(() => undefined);
    } else {
      setStatus("This device is now private and local-only. Your cloud copy was not deleted.");
    }
  }

  async function cohortAction(body: Record<string, string>) {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await responseJson<{ accessCode?: string }>(response);
      if (payload.accessCode) setNewAccessCode(payload.accessCode);
      setCohortName("");
      setJoinCode("");
      await loadCohorts();
      setStatus(body.action === "create" ? "Cohort created." : "Cohort sharing updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The cohort could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCloudCopy() {
    if (!window.confirm("Delete your account progress copy, owned cohorts, and all cohort sharing? Device progress will remain.")) {
      return;
    }
    setBusy(true);
    try {
      const deletion = await responseJson<{
        deleted: boolean;
        resetEpoch: number;
      }>(
        await fetch("/api/account-sync", { method: "DELETE" }),
      );
      onApplyProgress((current) => ({
        ...current,
        resetEpoch: Math.max(current.resetEpoch, deletion.resetEpoch),
      }));
      chooseSyncMode("local");
      setAccount((current) => ({
        ...current,
        cloudProgress: null,
        revision: 0,
        syncEnabled: false,
      }));
      setMemberships([]);
      setStatus("Cloud progress, owned cohorts, and cohort sharing were deleted. Device progress remains private on this device.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Cloud progress could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-sync-panel no-print" aria-labelledby="account-sync-title">
      <header>
        <div>
          <p className="eyebrow">PRIVACY &amp; PORTABILITY</p>
          <h2 id="account-sync-title">Choose where progress lives</h2>
          <p>
            Device-only is the default. Account sync and anonymous usage counters
            stay off until you turn them on.
          </p>
        </div>
        <span className={`sync-status ${syncMode}`}>{syncMode === "local" ? "Local only" : "Account sync"}</span>
      </header>

      <div className="sync-choice-grid" role="group" aria-label="Progress storage mode">
        <button
          type="button"
          className={syncMode === "local" ? "is-active" : ""}
          onClick={() => chooseSyncMode("local")}
        >
          <strong>Use this device only</strong>
          <span>No account copy and no automatic network sync.</span>
        </button>
        {account.signedIn ? (
          <button
            type="button"
            className={syncMode === "account" ? "is-active" : ""}
            onClick={() => chooseSyncMode("account")}
            disabled={busy}
          >
            <strong>Sync with {account.displayName}</strong>
            <span>Merge completion across signed-in devices.</span>
          </button>
        ) : (
          <a
            className="sync-sign-in"
            href={account.signInPath}
            onClick={() =>
              window.localStorage.setItem(SYNC_PENDING_KEY, "pending")
            }
          >
            <strong>Sign in with ChatGPT</strong>
            <span>Optional account sync across devices.</span>
          </a>
        )}
      </div>

      <p className="sync-identity-note">
        ChatGPT verifies your identity only. This site does not persist your
        account email or name; it saves a private account identifier and
        minimized progress only after you enable sync. No chat or model request
        is created, so this does not use ChatGPT messages or model credits.
      </p>

      {account.signedIn ? (
        <div className="sync-actions">
          {syncMode === "account" ? (
            <>
              <button type="button" className="button button-quiet button-small" disabled={busy} onClick={() => void syncProgress(true)}>
                Sync now
              </button>
              {account.cloudProgress ? (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    onApplyProgress((current) =>
                      mergeCloudProgress(
                        current,
                        account.cloudProgress as TrainingProgress,
                      ),
                    );
                    setStatus("Saved account progress restored on this device.");
                  }}
                >
                  Restore account copy
                </button>
              ) : null}
            </>
          ) : null}
          <a className="text-button" href="/signout-with-chatgpt?return_to=%2F">Sign out</a>
          {account.cloudProgress ? (
            <button type="button" className="text-button danger" disabled={busy} onClick={() => void deleteCloudCopy()}>
              Delete cloud copy
            </button>
          ) : null}
        </div>
      ) : null}

      <label className="analytics-consent">
        <input
          type="checkbox"
          checked={analyticsEnabled}
          onChange={(event) => {
            setAnalyticsEnabled(event.target.checked);
            setAnalyticsConsent(event.target.checked);
            setStatus(
              event.target.checked
                ? "Anonymous usage counters enabled. No prompt text or account identity is recorded."
                : "Anonymous usage counters disabled.",
            );
          }}
        />
        <span>
          <strong>Share anonymous usage counters</strong>
          <small>
            Counts onboarding, lesson starts, retries, and Studio usage by day.
            It never includes exercise text, names, email addresses, or browsing history.
          </small>
        </span>
      </label>

      {account.signedIn && syncMode === "account" ? (
        <div className="cohort-tools">
          <div className="cohort-tool">
            <h3>Join a cohort</h3>
            <p>Sharing is explicit and instructors receive aggregate-only statistics.</p>
            <div className="inline-form">
              <label>
                <span>Cohort code</span>
                <input value={joinCode} maxLength={32} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} />
              </label>
              <button type="button" className="button button-dark button-small" disabled={busy || !joinCode.trim()} onClick={() => void cohortAction({ action: "join", accessCode: joinCode, consentVersion: "aggregate-v1" })}>
                Join and share
              </button>
            </div>
            {memberships.map((membership) => (
              <div className="membership-row" key={membership.id}>
                <span>{membership.name}</span>
                <button type="button" className="text-button danger" onClick={() => void cohortAction({ action: "leave", cohortId: membership.id })}>Stop sharing</button>
              </div>
            ))}
          </div>

          <div className="cohort-tool">
            <h3>Create an instructor cohort</h3>
            <p>Reports unlock at five synced members and round results into coarse privacy bands.</p>
            <div className="inline-form">
              <label>
                <span>Cohort name</span>
                <input value={cohortName} maxLength={80} onChange={(event) => setCohortName(event.target.value)} />
              </label>
              <button type="button" className="button button-dark button-small" disabled={busy || !cohortName.trim()} onClick={() => void cohortAction({ action: "create", name: cohortName })}>
                Create cohort
              </button>
            </div>
            {newAccessCode ? (
              <p className="access-code" role="status">Share this private 30-day join code: <strong>{newAccessCode}</strong></p>
            ) : null}
          </div>
        </div>
      ) : null}

      {account.signedIn && syncMode === "account" && ownedCohorts.length ? (
        <div className="cohort-reports" aria-label="Instructor cohort reports">
          {ownedCohorts.map((cohort) => (
            <article key={cohort.id}>
              <div>
                <h3>{cohort.name}</h3>
                <p>{cohort.report.syncedMemberCount} synced members sharing</p>
              </div>
              {cohort.report.available && cohort.report.averages ? (
                <dl>
                  <div><dt>Lessons (rounded)</dt><dd>{cohort.report.averages.completedModules}</dd></div>
                  <div><dt>Quiz band</dt><dd>{cohort.report.averages.quizScore ?? "N/A"}%</dd></div>
                  <div><dt>Studio labs (rounded)</dt><dd>{cohort.report.averages.studioCompleted}</dd></div>
                </dl>
              ) : (
                <p>Aggregate report unlocks at {cohort.report.minimumGroupSize} synced members.</p>
              )}
              <a className="button button-quiet button-small" href={`/api/cohorts/${cohort.id}/report.csv`}>
                Export aggregate CSV
              </a>
            </article>
          ))}
        </div>
      ) : null}

      {account.signedIn && syncMode === "account" && analyticsRows.length ? (
        <div className="analytics-summary" aria-label="Anonymous usage summary">
          <h3>Anonymous usage, last 30 days</h3>
          <p>Daily counters are not linked to accounts, cohorts, or individual sessions.</p>
          <div>
            {analyticsRows.slice(0, 12).map((row) => (
              <span key={`${row.eventDate}-${row.eventName}-${row.context}`}>
                <strong>{row.eventCount}</strong>
                {row.eventName.replaceAll("_", " ")} &middot; {row.context}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {status ? <p className="sync-message" role="status">{status}</p> : null}
      <span className="sr-only">Analytics preference key: {ANALYTICS_CONSENT_KEY}</span>
    </section>
  );
}
