ALTER TABLE `pricing_rules` ADD `description` varchar(280) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `pricing_rules` ADD `sortOrder` int DEFAULT 0 NOT NULL;