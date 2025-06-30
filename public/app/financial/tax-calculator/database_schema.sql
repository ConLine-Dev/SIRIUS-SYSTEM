-- SQL para criar a tabela de histórico da Calculadora de Impostos

-- Certifique-se de que o banco de dados 'sirius' exista.
-- CREATE DATABASE IF NOT EXISTS sirius;
-- USE sirius;

-- Tabela para armazenar o histórico de cálculos de impostos
CREATE TABLE IF NOT EXISTS `tax_calc_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `collaborator_id` INT NOT NULL COMMENT 'ID do colaborador que salvou o cálculo',
  `reference_name` VARCHAR(255) NULL COMMENT 'Nome/referência personalizada para facilitar identificação',
  `type` VARCHAR(50) NOT NULL COMMENT 'Tipo de imposto calculado (ex: Ad Valorem, ICMS)',
  `productValue` DECIMAL(15, 2) NOT NULL COMMENT 'Valor base do produto/mercadoria',
  `rate` DECIMAL(10, 4) NOT NULL COMMENT 'Alíquota aplicada no cálculo (%)',
  `reducedBase` DECIMAL(10, 4) NULL COMMENT 'Percentual da base de cálculo reduzida (aplicável ao ICMS)',
  `taxAmount` DECIMAL(15, 2) NOT NULL COMMENT 'Valor do imposto calculado',
  `totalAmount` DECIMAL(15, 2) NOT NULL COMMENT 'Valor total (produto + imposto)',
  `notes` TEXT COMMENT 'Notas geradas automaticamente resumindo o cálculo',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora do salvamento do cálculo',
  INDEX `idx_collaborator_id` (`collaborator_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_createdAt` (`createdAt`),
  FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Histórico de cálculos da Calculadora de Impostos Simplificada';

-- Tabela para armazenar as configurações padrão da calculadora para cada usuário
CREATE TABLE IF NOT EXISTS `tax_calc_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `collaborator_id` INT NOT NULL UNIQUE COMMENT 'ID do colaborador ao qual a configuração pertence',
  `defaultAdValoremRate` DECIMAL(10, 4) NOT NULL DEFAULT 1.00 COMMENT 'Alíquota padrão para Ad Valorem',
  `defaultIcmsRate` DECIMAL(10, 4) NOT NULL DEFAULT 18.00 COMMENT 'Alíquota padrão para ICMS',
  `defaultIcmsReducedBase` DECIMAL(10, 4) NOT NULL DEFAULT 100.00 COMMENT 'Base de cálculo reduzida padrão para ICMS',
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurações da Calculadora de Impostos por colaborador'; 