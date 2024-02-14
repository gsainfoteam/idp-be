-- CreateTable
CREATE TABLE `user_tb` (
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(11) NOT NULL,
    `accessLevel` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',

    UNIQUE INDEX `user_tb_email_key`(`email`),
    UNIQUE INDEX `user_tb_student_id_key`(`student_id`),
    UNIQUE INDEX `user_tb_phone_number_key`(`phone_number`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_tb` (
    `uuid` VARCHAR(191) NOT NULL,
    `id` INTEGER NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `urls` JSON NOT NULL,
    `role` ENUM('DISALLOW', 'ALLOW') NOT NULL DEFAULT 'DISALLOW',

    UNIQUE INDEX `client_tb_id_key`(`id`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshToken` (
    `token` VARCHAR(191) NOT NULL,
    `scopes` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `clientUuid` VARCHAR(191) NOT NULL,
    `userUuid` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consent_tb` (
    `clientUuid` VARCHAR(191) NOT NULL,
    `userUuid` VARCHAR(191) NOT NULL,
    `scopes` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`clientUuid`, `userUuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ClientToUser` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ClientToUser_AB_unique`(`A`, `B`),
    INDEX `_ClientToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_clientUuid_userUuid_fkey` FOREIGN KEY (`clientUuid`, `userUuid`) REFERENCES `consent_tb`(`clientUuid`, `userUuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consent_tb` ADD CONSTRAINT `consent_tb_clientUuid_fkey` FOREIGN KEY (`clientUuid`) REFERENCES `client_tb`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consent_tb` ADD CONSTRAINT `consent_tb_userUuid_fkey` FOREIGN KEY (`userUuid`) REFERENCES `user_tb`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClientToUser` ADD CONSTRAINT `_ClientToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `client_tb`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClientToUser` ADD CONSTRAINT `_ClientToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `user_tb`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;
