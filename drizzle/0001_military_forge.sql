CREATE TABLE `searchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`query` varchar(500) NOT NULL,
	`searchType` varchar(50) NOT NULL,
	`resultsCount` int DEFAULT 0,
	`threatsDetected` int DEFAULT 0,
	`phishingDetected` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tweetUrls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tweetId` int NOT NULL,
	`url` varchar(2000) NOT NULL,
	`expandedUrl` varchar(2000),
	`isPhishing` boolean DEFAULT false,
	`phishTankStatus` varchar(50),
	`threatScore` float,
	`aiThreatAssessment` text,
	`detectedThreats` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tweetUrls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tweets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tweetId` varchar(64) NOT NULL,
	`text` text NOT NULL,
	`author` varchar(255),
	`authorUsername` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	`sentimentScore` float,
	`sentimentLabel` varchar(50),
	`threatLevel` varchar(50),
	`threatScore` float,
	`credibilityScore` float,
	`isPhishing` boolean DEFAULT false,
	`aiExplanation` text,
	`detectedPatterns` text,
	`searchQuery` varchar(500),
	`searchType` varchar(50),
	`userId` int,
	CONSTRAINT `tweets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tweets_tweetId_unique` UNIQUE(`tweetId`)
);
