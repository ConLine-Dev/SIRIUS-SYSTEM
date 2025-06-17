-- Schema completo para o Módulo de Gerenciamento de Patrimônio
-- Use este script para criar todas as tabelas necessárias e seus relacionamentos.
-- Versão 2.0: Corrigidas as chaves estrangeiras para referenciar 'collaborators' em vez de 'users'.

CREATE TABLE IF NOT EXISTS `pat_locations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `parent_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_locations_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `pat_locations`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pat_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Se a tabela pat_items já existir com uma estrutura antiga, pode ser necessário
-- fazer um backup dos dados e recriá-la com a estrutura abaixo.
-- Ex: ALTER TABLE `pat_items` ADD COLUMN `category_id` INT, ADD COLUMN `location_id` INT...

CREATE TABLE IF NOT EXISTS `pat_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `category_id` INT,
    `acquisition_date` DATE,
    `acquisition_value` DECIMAL(15,2),
    `current_status` ENUM('available', 'in_use', 'maintenance', 'damaged', 'discarded') DEFAULT 'available',
    `location_id` INT,
    `notes` TEXT,
    `technical_info` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    CONSTRAINT `fk_items_category_id` FOREIGN KEY (`category_id`) REFERENCES `pat_categories`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_items_location_id` FOREIGN KEY (`location_id`) REFERENCES `pat_locations`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pat_assignments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `item_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `start_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `end_date` TIMESTAMP NULL,
    `status` ENUM('active', 'returned', 'expired') DEFAULT 'active',
    `notes` TEXT,
    `created_by` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_assignments_item_id` FOREIGN KEY (`item_id`) REFERENCES `pat_items`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_assignments_user_id` FOREIGN KEY (`user_id`) REFERENCES `collaborators`(`id`),
    CONSTRAINT `fk_assignments_created_by` FOREIGN KEY (`created_by`) REFERENCES `collaborators`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pat_events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `item_id` INT NOT NULL,
    `event_type` ENUM('created', 'updated', 'assigned', 'returned', 'maintenance_start', 'maintenance_end', 'damaged', 'discarded', 'audited') NOT NULL,
    `event_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `user_id` INT NOT NULL,
    `description` TEXT,
    `metadata` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_events_item_id` FOREIGN KEY (`item_id`) REFERENCES `pat_items`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_events_user_id` FOREIGN KEY (`user_id`) REFERENCES `collaborators`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pat_maintenance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `item_id` INT NOT NULL,
    `start_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `end_date` TIMESTAMP NULL,
    `description` TEXT NOT NULL,
    `cost` DECIMAL(15,2),
    `provider` VARCHAR(255),
    `status` ENUM('ongoing', 'completed', 'cancelled') DEFAULT 'ongoing',
    `created_by` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_maintenance_item_id` FOREIGN KEY (`item_id`) REFERENCES `pat_items`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_maintenance_created_by` FOREIGN KEY (`created_by`) REFERENCES `collaborators`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================================
-- INSERÇÃO DE DADOS DE EXEMPLO (SEED DATA)
-- Descomente ou execute essas linhas para popular o banco de dados com dados iniciais.
-- =====================================================================================

INSERT INTO `pat_locations` (`name`, `description`) VALUES
('Sede Principal', 'Edifício Matriz da empresa'),
('Filial São Paulo', 'Escritório localizado na capital paulista'),
('Filial Rio de Janeiro', 'Escritório com foco na área comercial'),
('Centro de Distribuição', 'Galpão principal para armazenamento e logística'),
('Laboratório de P&D', 'Área restrita para pesquisa e desenvolvimento');

INSERT INTO `pat_categories` (`name`, `description`) VALUES
('Eletrônicos', 'Notebooks, monitores, celulares e outros dispositivos.'),
('Mobiliário', 'Cadeiras, mesas, armários e outros móveis de escritório.'),
('Veículos', 'Carros, motos e outros veículos da frota da empresa.'),
('Ferramentas', 'Equipamentos utilizados pela equipe de manutenção.'),
('Equipamentos de Rede', 'Roteadores, switches e servidores.');

-- Inserindo alguns itens de exemplo
-- Note que os IDs de location e category devem corresponder aos inseridos acima
-- (1: Sede, 2: SP, etc. | 1: Eletrônicos, 2: Mobiliário, etc.)

INSERT INTO `pat_items` (`code`, `description`, `category_id`, `acquisition_date`, `acquisition_value`, `current_status`, `location_id`, `notes`) VALUES
('NTB-001', 'Notebook Dell Vostro 15', 1, '2023-01-15', 4500.00, 'available', 1, 'Notebook para novo colaborador.'),
('MON-001', 'Monitor LG UltraWide 29"', 1, '2022-11-20', 1800.50, 'in_use', 2, 'Atribuído a João da Silva no depto de Marketing.'),
('CAD-015', 'Cadeira Presidente Ergonômica', 2, '2021-05-10', 1200.00, 'maintenance', 1, 'Enviada para reparo no estofado.'),
('VEI-003', 'Fiat Strada 2023', 3, '2023-03-01', 85000.00, 'available', 4, 'Veículo de apoio para entregas.'),
('SRV-002', 'Servidor Dell PowerEdge T40', 5, '2022-08-30', 9800.00, 'damaged', 1, 'Fonte queimada. Aguardando substituição.'); 