-- Migração para adicionar coluna reference_name na tabela tax_calc_history
-- Data: 2024-12-19
-- Descrição: Permite salvar um nome/referência personalizada para os cálculos no histórico

-- Adicionar coluna reference_name caso ela não exista
ALTER TABLE `tax_calc_history` 
ADD COLUMN IF NOT EXISTS `reference_name` VARCHAR(255) NULL COMMENT 'Nome/referência personalizada para facilitar identificação' 
AFTER `collaborator_id`;

-- Adicionar índice para otimizar buscas por nome/referência
CREATE INDEX IF NOT EXISTS `idx_reference_name` ON `tax_calc_history` (`reference_name`); 