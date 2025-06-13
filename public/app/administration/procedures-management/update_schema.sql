-- 1. Cria a nova tabela para os tipos de procedimento.
CREATE TABLE IF NOT EXISTS `proc_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Adiciona alguns tipos padrão para começar.
INSERT IGNORE INTO `proc_types` (name) VALUES 
('Padrão'),
('Instrução de Trabalho'),
('Política'),
('Tutorial'),
('Checklist');

-- 3. Altera a tabela 'proc_main' para usar IDs para departamento e tipo.
-- Primeiro, renomeamos as colunas antigas para não perder dados, caso seja necessário migrar.
ALTER TABLE `proc_main` 
CHANGE COLUMN `department` `department_old_text` VARCHAR(100),
CHANGE COLUMN `type` `type_old_text` VARCHAR(100);

-- Em seguida, adicionamos as novas colunas de chave estrangeira.
ALTER TABLE `proc_main`
ADD COLUMN `department_id` INT NULL AFTER `summary`,
ADD COLUMN `type_id` INT NULL AFTER `department_id`;

-- Adiciona os índices para as novas colunas.
ALTER TABLE `proc_main`
ADD INDEX `idx_department_id` (`department_id`),
ADD INDEX `idx_type_id` (`type_id`);

-- Adiciona as restrições de chave estrangeira.
-- A restrição para 'departments' pode falhar se a tabela 'departments' não existir ou não tiver os dados corretos.
-- A restrição para 'proc_types' deve funcionar, pois acabamos de criar a tabela.
ALTER TABLE `proc_main`
ADD CONSTRAINT `fk_proc_main_department`
  FOREIGN KEY (`department_id`)
  REFERENCES `departments`(`id`)
  ON DELETE SET NULL;

ALTER TABLE `proc_main`
ADD CONSTRAINT `fk_proc_main_type`
  FOREIGN KEY (`type_id`)
  REFERENCES `proc_types`(`id`)
  ON DELETE SET NULL;

-- OBSERVAÇÃO:
-- O script não migra os dados antigos (department_old_text, type_old_text) para as novas colunas (department_id, type_id).
-- Isso precisaria de um script de migração de dados mais complexo para mapear os textos antigos para os novos IDs.
-- Para novos procedimentos, o sistema já usará as novas colunas. 