CREATE TABLE `sagebin_bin_fcm_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bin_id` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`bin_id`) REFERENCES `sagebin_bins`(`id`) ON UPDATE no action ON DELETE cascade
);
