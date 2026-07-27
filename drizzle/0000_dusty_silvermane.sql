CREATE TABLE `demo_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evidence_aggregates` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`aspect` text NOT NULL,
	`evidence_type` text NOT NULL,
	`positive_count` integer NOT NULL,
	`neutral_count` integer NOT NULL,
	`negative_count` integer NOT NULL,
	`disputed_count` integer DEFAULT 0 NOT NULL,
	`source_layer` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`price` real NOT NULL,
	`is_trial` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`hero_dish` text NOT NULL,
	`hero_image` text NOT NULL,
	`distance_meters` integer NOT NULL,
	`delivery_minutes` integer NOT NULL,
	`average_price` real NOT NULL,
	`evidence_state` text NOT NULL,
	`depth` text NOT NULL,
	`sandbox` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stores_slug_unique` ON `stores` (`slug`);--> statement-breakpoint
CREATE TABLE `trial_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`title` text NOT NULL,
	`benefit_label` text NOT NULL,
	`daily_quota` integer NOT NULL,
	`remaining_quota` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
