CREATE TABLE `disputes` (
	`id` text PRIMARY KEY NOT NULL,
	`verification_id` text NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`verification_id`) REFERENCES `verifications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`menu_item_id` text NOT NULL,
	`name_snapshot` text NOT NULL,
	`unit_price_snapshot` real NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_promise_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`aspect` text NOT NULL,
	`version` integer NOT NULL,
	`merchant_confirmed_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`store_id` text NOT NULL,
	`status` text NOT NULL,
	`total_amount` real NOT NULL,
	`sandbox` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `demo_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`objective_result` text NOT NULL,
	`taste_result` text NOT NULL,
	`repurchase_intent` text NOT NULL,
	`note` text,
	`image_path` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_order_unique` ON `verifications` (`order_id`);