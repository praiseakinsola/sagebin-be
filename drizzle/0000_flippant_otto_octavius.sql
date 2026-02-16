CREATE TABLE `sagebin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sagebin_users_email_unique` ON `sagebin_users` (`email`);