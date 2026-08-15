CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('system','user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskRunId` int NOT NULL,
	`prompt` text NOT NULL,
	`imageUrl` text NOT NULL,
	`model` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generated_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workflowId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`cronExpression` varchar(80) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`isPaused` boolean NOT NULL DEFAULT false,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `scheduled_jobs_task_uid_unique` UNIQUE(`scheduleCronTaskUid`)
);
--> statement-breakpoint
CREATE TABLE `task_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int,
	`workflowId` int,
	`scheduledJobId` int,
	`type` enum('chat','image','workflow') NOT NULL,
	`status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
	`title` varchar(180) NOT NULL,
	`input` text NOT NULL,
	`output` text,
	`metadata` text,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`template` enum('summarize','translate','classify','generate') NOT NULL,
	`instructions` text NOT NULL,
	`latestInput` text,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultModel` varchar(120) DEFAULT 'Default',
	`timeZone` varchar(80) DEFAULT 'UTC',
	`interfaceDensity` enum('comfortable','compact') NOT NULL DEFAULT 'comfortable',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspace_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_preferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `chat_messages_conversation_created_idx` ON `chat_messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `chat_messages_user_created_idx` ON `chat_messages` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `conversations_user_updated_idx` ON `conversations` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `generated_images_user_created_idx` ON `generated_images` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `scheduled_jobs_user_updated_idx` ON `scheduled_jobs` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `task_runs_user_created_idx` ON `task_runs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `task_runs_user_type_status_idx` ON `task_runs` (`userId`,`type`,`status`);--> statement-breakpoint
CREATE INDEX `workflows_user_updated_idx` ON `workflows` (`userId`,`updatedAt`);