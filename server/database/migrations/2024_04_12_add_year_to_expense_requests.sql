-- Adicionar coluna year à tabela zero_based_expense_requests
ALTER TABLE `zero_based_expense_requests` 
ADD COLUMN `year` varchar(4) NOT NULL DEFAULT '2024' AFTER `month`,
ADD INDEX `idx_year` (`year`);

-- Atualizar registros existentes para o ano atual como padrão (opcional)
-- UPDATE `zero_based_expense_requests` SET `year` = '2024' WHERE `year` = ''; 