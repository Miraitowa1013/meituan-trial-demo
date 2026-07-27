CREATE TABLE `evidence_records` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`order_id` text,
	`evidence_type` text NOT NULL,
	`aspect` text NOT NULL,
	`result` text NOT NULL,
	`status` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`sandbox` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
