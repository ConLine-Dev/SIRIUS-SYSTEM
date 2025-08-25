-- Script para atualizar status das vagas para teste
-- Atualizar todas as vagas para status Published (para teste de remanejamento)

UPDATE hr_job_postings 
SET status = 'Published' 
WHERE is_active = 1;

-- Verificar resultado
SELECT id, title, status, is_active 
FROM hr_job_postings 
WHERE is_active = 1; 