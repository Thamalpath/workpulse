-- Projects / Categories: team member assignment schema
-- Applied via: node sql/run-migrations.mjs

DROP TABLE IF EXISTS `ProjectMember`;

CREATE TABLE `ProjectMember` (
    `projectId` BIGINT UNSIGNED NOT NULL,
    `userId` BIGINT UNSIGNED NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ProjectMember_userId_idx`(`userId`),
    PRIMARY KEY (`projectId`, `userId`),
    CONSTRAINT `ProjectMember_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ProjectMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;