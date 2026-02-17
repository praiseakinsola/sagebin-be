CREATE TABLE `sagebin_bin_fill_level_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bin_id` integer NOT NULL,
	`fill_level` integer NOT NULL,
	`timestamp` integer,
	FOREIGN KEY (`bin_id`) REFERENCES `sagebin_bins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sagebin_bin_status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bin_id` integer NOT NULL,
	`status` text NOT NULL,
	`timestamp` integer,
	FOREIGN KEY (`bin_id`) REFERENCES `sagebin_bins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sagebin_bins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serial_number` text NOT NULL,
	`fill_level` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`last_updated` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sagebin_bins_serial_number_unique` ON `sagebin_bins` (`serial_number`);