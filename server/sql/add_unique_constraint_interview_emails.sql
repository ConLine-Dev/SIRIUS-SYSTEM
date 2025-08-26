-- Script para adicionar constraint única e prevenir duplicação de emails de entrevista
-- Data: Dezembro 2024

-- 1. Primeiro, limpar todas as duplicatas existentes
-- Manter apenas o registro mais recente com status 'sent', ou o mais recente se nenhum foi enviado
DELETE e1 FROM hr_interview_email_logs e1
INNER JOIN hr_interview_email_logs e2
WHERE e1.id < e2.id
  AND e1.application_id = e2.application_id
  AND DATE(e1.interview_date) = DATE(e2.interview_date)
  AND e1.email_type IN ('reminder_15min', 'reminder_past')
  AND e2.email_type IN ('reminder_15min', 'reminder_past');

-- 2. Remover índices antigos se existirem
DROP INDEX IF EXISTS unique_interview_email ON hr_interview_email_logs;
DROP INDEX IF EXISTS idx_interview_email_unique ON hr_interview_email_logs;

-- 3. Criar índice único para prevenir duplicatas
-- Usa DATE() para garantir apenas um email por dia por entrevista
ALTER TABLE hr_interview_email_logs 
ADD UNIQUE INDEX idx_interview_email_unique (
    application_id,
    DATE(interview_date),
    email_type
);

-- 4. Adicionar índice para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_interview_email_status_date 
ON hr_interview_email_logs(status, created_at, email_type);

-- 5. Limpar emails pendentes muito antigos
DELETE FROM hr_interview_email_logs 
WHERE status = 'pending' 
  AND created_at < DATE_SUB(NOW(), INTERVAL 3 HOUR)
  AND email_type IN ('reminder_15min', 'reminder_past');

-- 6. Atualizar emails pendentes antigos para 'failed' se não foram enviados
UPDATE hr_interview_email_logs 
SET status = 'failed',
    error_message = 'Timeout - não processado',
    updated_at = NOW()
WHERE status = 'pending' 
  AND created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)
  AND email_type IN ('reminder_15min', 'reminder_past');

-- 7. Verificar resultado
SELECT 
    'Constraint única adicionada!' as message,
    (SELECT COUNT(*) FROM hr_interview_email_logs WHERE DATE(created_at) = CURDATE()) as emails_hoje,
    (SELECT COUNT(DISTINCT CONCAT(application_id, '|', DATE(interview_date))) 
     FROM hr_interview_email_logs 
     WHERE email_type IN ('reminder_15min', 'reminder_past')) as entrevistas_unicas,
    (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'pending') as pendentes,
    (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'sent' AND DATE(created_at) = CURDATE()) as enviados_hoje; 