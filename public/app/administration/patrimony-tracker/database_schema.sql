-- Arquivo SQL para a criação da estrutura de tabelas do Módulo de Gerenciamento de Patrimônio
-- As tabelas são prefixadas com 'pat_' para organização e para evitar conflitos de nomes.

-- Tabela Principal: Armazena os metadados de cada item de patrimônio.
CREATE TABLE IF NOT EXISTS `pat_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `status` ENUM('available', 'in_use', 'in_maintenance', 'damaged', 'discarded') NOT NULL DEFAULT 'available',
  `acquisition_date` DATE NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`location`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Atribuições: Armazena o histórico de atribuições de cada item a colaboradores.
CREATE TABLE IF NOT EXISTS `pat_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `employee_name` VARCHAR(150) NOT NULL,
  `employee_department` VARCHAR(100),
  `assignment_date` DATE NOT NULL,
  `return_date` DATE,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `pat_items`(`id`) ON DELETE CASCADE,
  INDEX (`employee_id`),
  INDEX (`assignment_date`),
  INDEX (`return_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Eventos: Armazena o log de todas as ações realizadas em um item
CREATE TABLE IF NOT EXISTS `pat_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `event_type` ENUM('created', 'updated', 'assigned', 'returned', 'sent_to_maintenance', 
                    'returned_from_maintenance', 'marked_damaged', 'discarded', 'audited') NOT NULL,
  `event_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `details` TEXT NOT NULL,
  `old_value` JSON,
  `new_value` JSON,
  `user_id` INT,
  `user_name` VARCHAR(150),
  FOREIGN KEY (`item_id`) REFERENCES `pat_items`(`id`) ON DELETE CASCADE,
  INDEX (`event_type`),
  INDEX (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Auditorias: Armazena resultados de auditorias automáticas/inteligentes
CREATE TABLE IF NOT EXISTS `pat_audits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `audit_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `diagnosis` TEXT,
  `recommendation` TEXT,
  `needs_attention` BOOLEAN DEFAULT FALSE,
  `user_id` INT,
  `user_name` VARCHAR(150),
  FOREIGN KEY (`item_id`) REFERENCES `pat_items`(`id`) ON DELETE CASCADE,
  INDEX (`audit_date`),
  INDEX (`needs_attention`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 