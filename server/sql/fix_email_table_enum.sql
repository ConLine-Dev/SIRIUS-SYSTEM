-- Script para corrigir o ENUM da tabela hr_interview_email_logs
-- Problema: O ENUM não tem 'reminder_past' e outros valores necessários

-- 1. Primeiro, verificar a estrutura atual
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'hr_interview_email_logs' 
AND COLUMN_NAME = 'email_type';

-- 2. Adicionar as colunas que estão faltando
ALTER TABLE hr_interview_email_logs 
ADD COLUMN IF NOT EXISTS recipient_emails TEXT NULL COMMENT 'JSON array de emails destinatários',
ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS email_content TEXT NULL,
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP NULL;

-- 3. Atualizar o ENUM do email_type para incluir todos os tipos
ALTER TABLE hr_interview_email_logs 
MODIFY COLUMN email_type ENUM(
  'daily_alert', 
  'reminder_15min', 
  'reminder_past', 
  'reminder_candidate'
) NOT NULL;

-- 4. Atualizar registros existentes que têm email_type vazio
UPDATE hr_interview_email_logs 
SET email_type = 'reminder_past'
WHERE email_type = '' OR email_type IS NULL;

-- 5. Atualizar status dos registros existentes
UPDATE hr_interview_email_logs 
SET status = 'sent'
WHERE status IS NULL OR status = '';

-- 6. Verificar o resultado
SELECT 
  id,
  email_type,
  status,
  application_id,
  DATE_FORMAT(created_at, '%H:%i:%s') as created_time
FROM hr_interview_email_logs 
ORDER BY created_at DESC 
LIMIT 5; 