CREATE TABLE `sync_deletions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`reset_epoch` integer DEFAULT 1 NOT NULL,
	`deleted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
