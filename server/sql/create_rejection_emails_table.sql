-- Script para criar tabela de emails de rejeição
-- Execute este script no banco de dados para criar a tabela

-- Tabela para armazenar emails de rejeição enviados
DROP TABLE IF EXISTS hr_rejection_emails;
CREATE TABLE IF NOT EXISTS hr_rejection_emails (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    applicant_id BIGINT NOT NULL,
    job_posting_id BIGINT NOT NULL,
    email_type ENUM('rejection', 'other') NOT NULL DEFAULT 'rejection',
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_by INT NULL,
    email_content TEXT,
    status ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
    error_message TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hr_rejection_emails_applicant (applicant_id),
    INDEX idx_hr_rejection_emails_job (job_posting_id),
    INDEX idx_hr_rejection_emails_sent_at (sent_at),
    INDEX idx_hr_rejection_emails_type (email_type),
    
    CONSTRAINT fk_hr_rejection_emails_applicant FOREIGN KEY (applicant_id) REFERENCES hr_applicants(id) ON DELETE CASCADE,
    CONSTRAINT fk_hr_rejection_emails_job FOREIGN KEY (job_posting_id) REFERENCES hr_job_postings(id) ON DELETE CASCADE,
    CONSTRAINT fk_hr_rejection_emails_sent_by FOREIGN KEY (sent_by) REFERENCES collaborators(id) ON DELETE SET NULL
);

-- Verificar se a tabela foi criada corretamente
SELECT 'Tabela hr_rejection_emails criada com sucesso!' as status; 