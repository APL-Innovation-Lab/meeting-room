CREATE TABLE `branch_coordinates` (
	`branch_name` text PRIMARY KEY,
	`lng` real NOT NULL,
	`lat` real NOT NULL,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `branch_directory` (
	`branch_name` text PRIMARY KEY,
	`address` text,
	`image` text,
	`path` text,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`location_id` text PRIMARY KEY,
	`name` text,
	`path` text,
	`synced_at` text
);
--> statement-breakpoint
CREATE TABLE `operating_hours` (
	`location_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`opening_minute` integer,
	`closing_minute` integer,
	CONSTRAINT `operating_hours_pk` PRIMARY KEY(`location_id`, `weekday`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`room_id` text NOT NULL,
	`room_kind` text NOT NULL,
	`room_name` text NOT NULL,
	`branch_name` text NOT NULL,
	`meeting_topic` text NOT NULL,
	`full_name` text NOT NULL,
	`email_address` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`org_name` text,
	`org_purpose` text,
	`website` text,
	`phone_number` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `room_conflicts` (
	`room_id` text NOT NULL,
	`conflicts_with` text NOT NULL,
	CONSTRAINT `room_conflicts_pk` PRIMARY KEY(`room_id`, `conflicts_with`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`room_id` text PRIMARY KEY,
	`location_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text,
	`capacity` integer,
	`floor` integer,
	`image` text,
	`published` integer DEFAULT false NOT NULL,
	`airplay` integer DEFAULT false NOT NULL,
	`hdmi` integer DEFAULT false NOT NULL,
	`whiteboard` integer DEFAULT false NOT NULL,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `special_dates` (
	`date` text PRIMARY KEY,
	`closed` integer DEFAULT false NOT NULL,
	`early_close_minute` integer,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`source` text PRIMARY KEY,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_active_reservation_slot` ON `reservations` (`room_id`,`date`,`time`) WHERE "reservations"."status" = 'confirmed';--> statement-breakpoint
CREATE INDEX `ix_rooms_kind_location` ON `rooms` (`kind`,`location_id`);