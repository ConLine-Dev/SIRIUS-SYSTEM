-- Adiciona a coluna 'deleted_at' para permitir a exclusão lógica (soft delete) de procedimentos.
-- Quando 'deleted_at' é NULL, o procedimento está ativo.
-- Quando 'deleted_at' tem um valor, o procedimento é considerado excluído.
ALTER TABLE `proc_main` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL;

-- Adiciona um índice na nova coluna para otimizar consultas que filtram por procedimentos excluídos.
ALTER TABLE `proc_main` ADD INDEX `idx_deleted_at` (`deleted_at`); 