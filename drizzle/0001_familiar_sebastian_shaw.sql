CREATE TABLE `adherenceLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicationScheduleId` int NOT NULL,
	`patientId` int NOT NULL,
	`scheduledTime` timestamp NOT NULL,
	`confirmedTime` timestamp,
	`status` enum('taken','not_taken','late','pending') NOT NULL DEFAULT 'pending',
	`confirmedBy` enum('patient','caregiver','admin','system'),
	`confirmedByUserId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adherenceLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `callLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adherenceLogId` int NOT NULL,
	`recipientType` enum('patient','caregiver') NOT NULL,
	`recipientId` int NOT NULL,
	`recipientPhoneNumber` varchar(20) NOT NULL,
	`callStatus` enum('initiated','ringing','answered','no_answer','failed','completed') NOT NULL,
	`callStartTime` timestamp,
	`callEndTime` timestamp,
	`durationSeconds` int,
	`dtmfResponse` varchar(10),
	`callAttemptNumber` int NOT NULL DEFAULT 1,
	`nextRetryTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `callLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caregivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int NOT NULL,
	`relationship` varchar(100),
	`priority` int NOT NULL DEFAULT 1,
	`phoneNumber` varchar(20) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caregivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicationSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicationId` int NOT NULL,
	`timeOfDay` varchar(5) NOT NULL,
	`dayOfWeek` varchar(20),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicationSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`dosage` varchar(100) NOT NULL,
	`unit` varchar(50),
	`description` text,
	`imageUrl` text,
	`prescribedBy` varchar(255),
	`startDate` timestamp,
	`endDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pushNotificationsEnabled` boolean NOT NULL DEFAULT true,
	`emailNotificationsEnabled` boolean NOT NULL DEFAULT true,
	`smsNotificationsEnabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dateOfBirth` timestamp,
	`medicalConditions` text,
	`emergencyContact` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','patient','caregiver') NOT NULL DEFAULT 'patient';--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(20);