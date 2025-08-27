-- Adicionar colunas para armazenar o snapshot completo do procedimento na tabela de versões.
-- Isso permitirá a funcionalidade de reverter para uma versão anterior com todos os seus dados.

-- Script para adicionar colunas de snapshot à tabela proc_versions de forma idempotente.
-- Ele verifica se cada coluna já existe antes de tentar adicioná-la, evitando erros
-- caso o script seja executado mais de uma vez.

DELIMITER $$

CREATE PROCEDURE AddSnapshotColumnsToProcVersions()
BEGIN
    -- Adiciona a coluna 'title' se ela não existir.
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proc_versions' AND COLUMN_NAME = 'title') THEN
        ALTER TABLE `proc_versions` ADD COLUMN `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Snapshot do título no momento da versão' AFTER `content`;
    END IF;

    -- Adiciona a coluna 'department_id' se ela não existir.
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proc_versions' AND COLUMN_NAME = 'department_id') THEN
        ALTER TABLE `proc_versions` ADD COLUMN `department_id` INT(11) NULL DEFAULT NULL COMMENT 'Snapshot do ID do departamento no momento da versão' AFTER `title`;
    END IF;

    -- Adiciona a coluna 'role' se ela não existir.
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proc_versions' AND COLUMN_NAME = 'role') THEN
        ALTER TABLE `proc_versions` ADD COLUMN `role` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Snapshot do cargo no momento da versão' AFTER `department_id`;
    END IF;

    -- Adiciona a coluna 'type_id' se ela não existir.
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proc_versions' AND COLUMN_NAME = 'type_id') THEN
        ALTER TABLE `proc_versions` ADD COLUMN `type_id` INT(11) NULL DEFAULT NULL COMMENT 'Snapshot do ID do tipo no momento da versão' AFTER `role`;
    END IF;

    -- Adiciona a coluna 'responsible_id' se ela não existir.
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proc_versions' AND COLUMN_NAME = 'responsible_id') THEN
        ALTER TABLE `proc_versions` ADD COLUMN `responsible_id` INT(11) NULL DEFAULT NULL COMMENT 'Snapshot do ID do responsável no momento da versão' AFTER `type_id`;
    END IF;

    -- Adiciona a coluna 'tags' se ela não existir.
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proc_versions' AND COLUMN_NAME = 'tags') THEN
        ALTER TABLE `proc_versions` ADD COLUMN `tags` JSON NULL DEFAULT NULL COMMENT 'Snapshot das tags (em formato JSON) no momento da versão' AFTER `responsible_id`;
    END IF;

    -- Adiciona a coluna 'attachments' se ela não existir.
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proc_versions' AND COLUMN_NAME = 'attachments') THEN
        ALTER TABLE `proc_versions` ADD COLUMN `attachments` JSON NULL DEFAULT NULL COMMENT 'Snapshot dos anexos (em formato JSON) no momento da versão' AFTER `tags`;
    END IF;
END$$

DELIMITER ;

-- Executa o procedimento para adicionar as colunas
CALL AddSnapshotColumnsToProcVersions();

-- Remove o procedimento, pois ele não é mais necessário
DROP PROCEDURE AddSnapshotColumnsToProcVersions;

-- Comentário final: A partir desta alteração, as novas versões salvas conterão
-- um registro completo do estado do procedimento. Versões antigas terão esses campos como nulos.
-- A lógica da aplicação deverá ser capaz de lidar com essa diferença. 