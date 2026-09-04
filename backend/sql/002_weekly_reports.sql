-- Weekly Reports schema
-- Applied via: node sql/run-migrations.mjs

DROP TABLE IF EXISTS `ReportHoursWorked`;
DROP TABLE IF EXISTS `ReportAchievement`;
DROP TABLE IF EXISTS `ReportBlocker`;
DROP TABLE IF EXISTS `ReportNextWeekTask`;
DROP TABLE IF EXISTS `ReportTask`;
DROP TABLE IF EXISTS `WeeklyReport`;
DROP TABLE IF EXISTS `Project`;

CREATE TABLE `Project` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `description` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `Project_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WeeklyReport` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` BIGINT UNSIGNED NOT NULL,
    `projectId` BIGINT UNSIGNED NULL,
    `weekStartDate` DATE NOT NULL,
    `weekEndDate` DATE NOT NULL,
    `status` ENUM('draft', 'submitted', 'needs_correction', 'approved') NOT NULL DEFAULT 'draft',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `WeeklyReport_userId_idx`(`userId`),
    INDEX `WeeklyReport_projectId_idx`(`projectId`),
    INDEX `WeeklyReport_weekStartDate_idx`(`weekStartDate`),
    UNIQUE INDEX `WeeklyReport_user_week_unique`(`userId`, `weekStartDate`),
    PRIMARY KEY (`id`),
    CONSTRAINT `WeeklyReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `WeeklyReport_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReportTask` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reportId` BIGINT UNSIGNED NOT NULL,
    `taskName` VARCHAR(500) NOT NULL,
    `priority` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    `plannedPercent` INT NOT NULL DEFAULT 0,
    `actualPercent` INT NOT NULL DEFAULT 0,
    `status` ENUM('not_started', 'in_progress', 'completed', 'blocked') NOT NULL DEFAULT 'not_started',
    `timePlanned` DECIMAL(6,2) NULL,
    `timeSpent` DECIMAL(6,2) NULL,
    `deliverable` VARCHAR(500) NULL,
    `sortOrder` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReportTask_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReportTask_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `WeeklyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReportNextWeekTask` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reportId` BIGINT UNSIGNED NOT NULL,
    `taskName` VARCHAR(500) NOT NULL,
    `priority` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    `status` ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
    `sortOrder` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReportNextWeekTask_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReportNextWeekTask_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `WeeklyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReportBlocker` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reportId` BIGINT UNSIGNED NOT NULL,
    `description` TEXT NOT NULL,
    `isKeyIssue` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReportBlocker_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReportBlocker_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `WeeklyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReportAchievement` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reportId` BIGINT UNSIGNED NOT NULL,
    `description` TEXT NOT NULL,
    `isKeyAchievement` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReportAchievement_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReportAchievement_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `WeeklyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReportHoursWorked` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reportId` BIGINT UNSIGNED NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `hours` DECIMAL(6,2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReportHoursWorked_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReportHoursWorked_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `WeeklyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
