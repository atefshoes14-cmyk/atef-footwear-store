CREATE TABLE `products` (
	`id` varchar(32) NOT NULL,
	`title` varchar(180) NOT NULL,
	`category` enum('men','women','kids','offers') NOT NULL,
	`price` int NOT NULL,
	`sizes` json NOT NULL,
	`colors` json NOT NULL,
	`stockQuantity` int NOT NULL DEFAULT 0,
	`availability` boolean NOT NULL DEFAULT true,
	`imageUrl` varchar(500) NOT NULL,
	`imageKey` varchar(500),
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
