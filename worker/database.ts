export interface D1Result<T = unknown> {
  results?: T[];
  success?: boolean;
  meta?: {
    changes?: number;
  };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS progress_records (
    user_id TEXT PRIMARY KEY NOT NULL,
    progress_json TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sync_deletions (
    user_id TEXT PRIMARY KEY NOT NULL,
    reset_epoch INTEGER NOT NULL DEFAULT 1,
    sync_enabled INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS cohorts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    access_code_hash TEXT NOT NULL UNIQUE,
    access_code_expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE INDEX IF NOT EXISTS cohorts_owner_user_id_idx ON cohorts(owner_user_id)",
  `CREATE TABLE IF NOT EXISTS cohort_members (
    cohort_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    sharing_enabled INTEGER NOT NULL DEFAULT 1,
    consent_version TEXT NOT NULL DEFAULT 'aggregate-v1',
    consented_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(cohort_id, user_id),
    FOREIGN KEY(cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE
  )`,
  "CREATE INDEX IF NOT EXISTS cohort_members_user_id_idx ON cohort_members(user_id)",
  `CREATE TABLE IF NOT EXISTS analytics_daily (
    event_date TEXT NOT NULL,
    event_name TEXT NOT NULL,
    context TEXT NOT NULL DEFAULT 'general',
    event_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(event_date, event_name, context)
  )`,
] as const;

const initializedDatabases = new WeakSet<object>();

export async function ensureDatabaseSchema(database: D1Database): Promise<void> {
  if (initializedDatabases.has(database as object)) return;
  await database.batch(
    SCHEMA_STATEMENTS.map((statement) => database.prepare(statement)),
  );
  initializedDatabases.add(database as object);
}
