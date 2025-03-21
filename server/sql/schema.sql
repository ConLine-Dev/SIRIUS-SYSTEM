-- Tabela para categorias do Zero-Based Budgeting
CREATE TABLE IF NOT EXISTS `zero_based_budgeting_categories` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados iniciais para categorias
INSERT INTO `zero_based_budgeting_categories` 
    (`name`, `description`, `active`) 
VALUES 
    ('Marketing', 'Despesas relacionadas a publicidade, promoções e marketing', 1),
    ('TI', 'Despesas com tecnologia, software e hardware', 1),
    ('Infraestrutura', 'Despesas relacionadas à infraestrutura física', 1),
    ('RH', 'Despesas relacionadas a recursos humanos', 1),
    ('Viagens', 'Despesas com viagens corporativas', 1),
    ('Treinamento', 'Despesas com treinamento e desenvolvimento', 1),
    ('Administrativo', 'Despesas administrativas gerais', 1);

-- Alteração na tabela de solicitações de despesa para usar a nova tabela de categorias
ALTER TABLE `zero_based_budgeting_expense_requests` 
    ADD COLUMN `category_id` INT NULL AFTER `cost_center_id`,
    ADD CONSTRAINT `fk_expense_request_category` 
    FOREIGN KEY (`category_id`) 
    REFERENCES `zero_based_budgeting_categories` (`id`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE; 