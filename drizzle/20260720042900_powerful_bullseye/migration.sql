ALTER TABLE `reservations` ADD `branch_address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `capacity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `duration_minutes` integer DEFAULT 120 NOT NULL;