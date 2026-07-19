CREATE TABLE `analytics_daily` (
	`event_date` text NOT NULL,
	`event_name` text NOT NULL,
	`context` text DEFAULT 'general' NOT NULL,
	`event_count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`event_date`, `event_name`, `context`)
);
--> statement-breakpoint
CREATE TABLE `cohort_members` (
	`cohort_id` text NOT NULL,
	`user_id` text NOT NULL,
	`sharing_enabled` integer DEFAULT true NOT NULL,
	`consent_version` text DEFAULT 'aggregate-v1' NOT NULL,
	`consented_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`cohort_id`, `user_id`),
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cohort_members_user_id_idx` ON `cohort_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`access_code_hash` text NOT NULL,
	`access_code_expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cohorts_access_code_hash_unique` ON `cohorts` (`access_code_hash`);--> statement-breakpoint
CREATE INDEX `cohorts_owner_user_id_idx` ON `cohorts` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `progress_records` (
	`user_id` text PRIMARY KEY NOT NULL,
	`progress_json` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
