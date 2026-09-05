-- Report Review & Correction Workflow schema
-- Adds version history (snapshots on each submit) and review comments
-- Applied via: node sql/run-migrations.mjs
-- NOTE: run-migrations.mjs disables foreign key checks while applying files,
-- so these tables are safely dropped here regardless of the 002 drop order.

DROP TABLE IF EXISTS `ReportReview`;
DROP TABLE IF EXISTS `ReportVersion`;

CREATE TABLE `ReportVersion` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reportId` BIGINT UNSIGNED NOT NULL,
    `versionNumber` INT NOT NULL,
    `projectId` BIGINT UNSIGNED NULL,
    `weekStartDate` DATE NOT NULL,
    `weekEndDate` DATE NOT NULL,
    `notes` TEXT NULL,
    `tasks` JSON NULL,
    `nextWeekTasks` JSON NULL,
    `blockers` JSON NULL,
    `achievements` JSON NULL,
    `hoursWorked` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReportVersion_reportId_idx`(`reportId`),
    UNIQUE INDEX `ReportVersion_report_version_key`(`reportId`, `versionNumber`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReportVersion_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `WeeklyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReportReview` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reportId` BIGINT UNSIGNED NOT NULL,
    `reviewerId` BIGINT UNSIGNED NOT NULL,
    `versionId` BIGINT UNSIGNED NOT NULL,
    `action` ENUM('approved', 'request_correction') NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReportReview_reportId_idx`(`reportId`),
    INDEX `ReportReview_versionId_idx`(`versionId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReportReview_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `WeeklyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ReportReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ReportReview_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `ReportVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;