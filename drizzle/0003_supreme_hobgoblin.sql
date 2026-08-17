CREATE TABLE `orders` (
	`id` varchar(64) NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`address` text NOT NULL,
	`items` json NOT NULL,
	`totalAmount` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'Pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `id` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `category` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `updatedAt` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` varchar(24) NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `products` ADD `salePrice` int;