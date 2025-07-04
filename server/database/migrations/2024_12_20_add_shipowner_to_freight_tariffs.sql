-- Migração para adicionar campo de armador (shipowner) às tarifas de frete
-- Data: 2024-12-20
-- Descrição: Adiciona campo shipowner_id para separar agente e armador nas tarifas

-- Adicionar coluna shipowner_id na tabela ft_tariffs
ALTER TABLE ft_tariffs 
ADD COLUMN shipowner_id INT AFTER agent_id,
ADD CONSTRAINT fk_ft_tariffs_shipowner 
FOREIGN KEY (shipowner_id) REFERENCES ft_agents(id);

-- Fazer uma cópia dos dados existentes de agent_id para shipowner_id
-- (assumindo que os registros atuais representam armadores)
UPDATE ft_tariffs SET shipowner_id = agent_id WHERE shipowner_id IS NULL;

-- Adicionar comentários para documentação
ALTER TABLE ft_tariffs 
MODIFY COLUMN agent_id INT NOT NULL COMMENT 'ID do agente responsável',
MODIFY COLUMN shipowner_id INT COMMENT 'ID do armador/operador'; 