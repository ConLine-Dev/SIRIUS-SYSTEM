-- Script para corrigir problemas de duplicação no sistema de emails de entrevista
-- Data: Dezembro 2024

-- 1. Remover duplicatas mantendo apenas o email mais recente com status 'sent'
DELETE e1 FROM hr_interview_email_logs e1
INNER JOIN hr_interview_email_logs e2 
WHERE 
    e1.id < e2.id 
    AND e1.application_id = e2.application_id 
    AND e1.email_type = e2.email_type
    AND e1.interview_date = e2.interview_date
    AND e2.status = 'sent';

-- 2. Remover duplicatas pendentes se já existe um enviado
DELETE FROM hr_interview_email_logs 
WHERE status = 'pending' 
AND EXISTS (
    SELECT 1 FROM (
        SELECT * FROM hr_interview_email_logs
    ) AS temp
    WHERE temp.application_id = hr_interview_email_logs.application_id
    AND temp.email_type = hr_interview_email_logs.email_type
    AND temp.interview_date = hr_interview_email_logs.interview_date
    AND temp.status = 'sent'
    AND temp.id != hr_interview_email_logs.id
);

-- 3. Adicionar índice único para prevenir futuras duplicatas
-- Primeiro, verificar se o índice já existe
SELECT COUNT(*) INTO @index_exists
FROM information_schema.statistics
WHERE table_schema = DATABASE()
AND table_name = 'hr_interview_email_logs'
AND index_name = 'unique_interview_email';

-- Criar o índice apenas se não existir
SET @sql = IF(@index_exists = 0,
    'ALTER TABLE hr_interview_email_logs 
     ADD UNIQUE INDEX unique_interview_email (
         application_id, 
         email_type, 
         interview_date, 
         status
     )',
    'SELECT "Index already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Atualizar emails com status incorreto
UPDATE hr_interview_email_logs 
SET status = 'sent', 
    sent_at = NOW(),
    updated_at = NOW()
WHERE status = 'pending' 
AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
AND error_message IS NULL;

-- 5. Limpar emails antigos que falharam
DELETE FROM hr_interview_email_logs 
WHERE status = 'failed' 
AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 6. Relatório de limpeza
SELECT 
    'Limpeza concluída!' as message,
    (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'sent' AND DATE(created_at) = CURDATE()) as emails_enviados_hoje,
    (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'pending') as emails_pendentes,
    (SELECT COUNT(DISTINCT application_id) FROM hr_interview_email_logs WHERE email_type IN ('reminder_15min', 'reminder_past')) as total_entrevistas_com_email; 