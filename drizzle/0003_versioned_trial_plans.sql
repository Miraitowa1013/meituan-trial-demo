CREATE TABLE `trial_plan_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`kind` text NOT NULL,
	`content` text NOT NULL,
	`source_text` text NOT NULL,
	`decision` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `trial_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verification_items` (
	`id` text PRIMARY KEY NOT NULL,
	`verification_id` text NOT NULL,
	`promise_snapshot_id` text NOT NULL,
	`result` text NOT NULL,
	FOREIGN KEY (`verification_id`) REFERENCES `verifications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`promise_snapshot_id`) REFERENCES `order_promise_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `order_promise_snapshots` ADD `plan_id` text REFERENCES trial_plans(id);--> statement-breakpoint
ALTER TABLE `order_promise_snapshots` ADD `claim_id` text REFERENCES trial_plan_claims(id);--> statement-breakpoint
ALTER TABLE `order_promise_snapshots` ADD `kind` text;--> statement-breakpoint
ALTER TABLE `trial_plans` ADD `menu_item_id` text REFERENCES menu_items(id);--> statement-breakpoint
ALTER TABLE `trial_plans` ADD `trial_price` real NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `trial_plans` ADD `version` integer NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `trial_plans` ADD `published_at` integer;
