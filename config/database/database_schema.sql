CREATE TABLE IF NOT EXISTS `tax_calc_history` (
    `id` INT AUTO_INCREMENT,
    `collaborator_id` INT,
    `type` VARCHAR(20) NOT NULL,
    `productValue` DECIMAL(15, 2) NOT NULL,
    `rate` DECIMAL(10, 2) NOT NULL,
    `reducedBase` DECIMAL(10, 2),
    `taxAmount` DECIMAL(15, 2) NOT NULL,
    `totalAmount` DECIMAL(15, 2) NOT NULL,
    `notes` TEXT,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tax_calc_settings` (
    `id` INT AUTO_INCREMENT,
    `collaborator_id` INT NOT NULL,
    `defaultAdValoremRate` DECIMAL(10, 2) DEFAULT 1.00,
    `defaultIcmsRate` DECIMAL(10, 2) DEFAULT 18.00,
    `defaultIcmsReducedBase` DECIMAL(10, 2) DEFAULT 100.00,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_collaborator_id` (`collaborator_id`),
    FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 