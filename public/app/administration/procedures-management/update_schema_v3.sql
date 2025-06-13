-- Arquivo SQL para a terceira fase de atualizações do Módulo de Gestão de Procedimentos
-- Foco: Adicionar campos para armazenar snapshot completo de cada versão

-- Adiciona campos para armazenar todos os metadados de cada versão
ALTER TABLE `proc_versions`
ADD COLUMN `title` VARCHAR(255) NULL AFTER `author_id`,
ADD COLUMN `department_id` INT NULL AFTER `title`,
ADD COLUMN `role` VARCHAR(100) NULL AFTER `department_id`,
ADD COLUMN `type_id` INT NULL AFTER `role`,
ADD COLUMN `responsible_id` INT NULL AFTER `type_id`,
ADD COLUMN `tags` JSON NULL AFTER `responsible_id`,
ADD COLUMN `attachments` JSON NULL AFTER `tags`;

-- Adiciona índices para otimizar consultas
ALTER TABLE `proc_versions`
ADD INDEX `idx_version_department_id` (`department_id`),
ADD INDEX `idx_version_type_id` (`type_id`),
ADD INDEX `idx_version_responsible_id` (`responsible_id`);

-- Adiciona restrições de chave estrangeira para os novos campos
ALTER TABLE `proc_versions`
ADD CONSTRAINT `fk_proc_versions_department`
  FOREIGN KEY (`department_id`)
  REFERENCES `departments`(`id`)
  ON DELETE SET NULL;

ALTER TABLE `proc_versions`
ADD CONSTRAINT `fk_proc_versions_type`
  FOREIGN KEY (`type_id`)
  REFERENCES `proc_types`(`id`)
  ON DELETE SET NULL;

ALTER TABLE `proc_versions`
ADD CONSTRAINT `fk_proc_versions_responsible`
  FOREIGN KEY (`responsible_id`)
  REFERENCES `collaborators`(`id`)
  ON DELETE SET NULL;

-- OBSERVAÇÃO:
-- Este script adiciona campos para armazenar um snapshot completo de cada versão.
-- Isso permitirá reverter não apenas o conteúdo, mas todos os metadados do procedimento.
-- As versões existentes terão estes campos como NULL até serem atualizadas.