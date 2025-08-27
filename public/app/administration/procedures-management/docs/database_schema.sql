-- Arquivo SQL para a criação da estrutura de tabelas do Módulo de Gestão de Procedimentos
-- As tabelas são prefixadas com 'proc_' para organização e para evitar conflitos de nomes.

-- Tabela Principal: Armazena os metadados de cada procedimento.
CREATE TABLE IF NOT EXISTS `proc_main` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT,
  `department` VARCHAR(100),
  `role` VARCHAR(100),
  `type` VARCHAR(100),
  `responsible` VARCHAR(150),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`department`),
  INDEX (`role`),
  INDEX (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Versões: Armazena o histórico de conteúdo de cada procedimento.
-- O conteúdo do editor Quill (Delta) é armazenado como JSON.
CREATE TABLE IF NOT EXISTS `proc_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `procedure_id` INT NOT NULL,
  `version_number` INT NOT NULL,
  `author` VARCHAR(150),
  `content` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`procedure_id`) REFERENCES `proc_main`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Anexos: Armazena links, vídeos ou imagens associadas a um procedimento.
CREATE TABLE IF NOT EXISTS `proc_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `procedure_id` INT NOT NULL,
  `type` ENUM('link', 'video', 'image') NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `description` VARCHAR(255),
  FOREIGN KEY (`procedure_id`) REFERENCES `proc_main`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Tags: Repositório central para todas as tags, garantindo unicidade.
CREATE TABLE IF NOT EXISTS `proc_tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Junção (Muitos-para-Muitos): Associa tags a procedimentos.
CREATE TABLE IF NOT EXISTS `proc_procedure_tags` (
  `procedure_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  PRIMARY KEY (`procedure_id`, `tag_id`),
  FOREIGN KEY (`procedure_id`) REFERENCES `proc_main`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `proc_tags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 