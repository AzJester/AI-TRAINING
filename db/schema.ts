import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const progressRecords = sqliteTable("progress_records", {
  userId: text("user_id").primaryKey(),
  progressJson: text("progress_json").notNull(),
  revision: integer("revision").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const syncDeletions = sqliteTable("sync_deletions", {
  userId: text("user_id").primaryKey(),
  resetEpoch: integer("reset_epoch").notNull().default(1),
  syncEnabled: integer("sync_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  deletedAt: text("deleted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const cohorts = sqliteTable(
  "cohorts",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ownerUserId: text("owner_user_id").notNull(),
    accessCodeHash: text("access_code_hash").notNull().unique(),
    accessCodeExpiresAt: text("access_code_expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("cohorts_owner_user_id_idx").on(table.ownerUserId)],
);

export const cohortMembers = sqliteTable(
  "cohort_members",
  {
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    sharingEnabled: integer("sharing_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    consentVersion: text("consent_version").notNull().default("aggregate-v1"),
    consentedAt: text("consented_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.cohortId, table.userId] }),
    index("cohort_members_user_id_idx").on(table.userId),
  ],
);

export const analyticsDaily = sqliteTable(
  "analytics_daily",
  {
    eventDate: text("event_date").notNull(),
    eventName: text("event_name").notNull(),
    context: text("context").notNull().default("general"),
    eventCount: integer("event_count").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.eventDate, table.eventName, table.context] }),
  ],
);
