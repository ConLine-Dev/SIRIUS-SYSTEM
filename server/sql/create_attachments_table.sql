-- Script para criar a tabela de anexos dos candidatos
-- Execute este script no seu banco de dados

-- Anexos dos candidatos
CREATE TABLE IF NOT EXISTS hr_applicant_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    applicant_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    description VARCHAR(255),
    is_resume TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES hr_applicants(id) ON DELETE CASCADE,
    INDEX idx_hr_applicant_attachments_applicant (applicant_id),
    INDEX idx_hr_applicant_attachments_resume (is_resume)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seeds de anexos dos candidatos (exemplos)
INSERT INTO hr_applicant_attachments (applicant_id, file_name, file_url, file_type, file_size, description, is_resume) VALUES
    ((SELECT id FROM hr_applicants WHERE email = 'joao.silva@example.com'), 'Joao_Silva_CV.pdf', 'https://example.com/cv/joao-silva.pdf', 'application/pdf', 1024000, 'Currículo João Silva', 1),
    ((SELECT id FROM hr_applicants WHERE email = 'joao.silva@example.com'), 'Joao_Silva_Portfolio.pdf', 'https://example.com/portfolio/joao-silva.pdf', 'application/pdf', 2048000, 'Portfólio de projetos', 0),
    ((SELECT id FROM hr_applicants WHERE email = 'maria.oliveira@example.com'), 'Maria_Oliveira_CV.pdf', 'https://example.com/cv/maria-oliveira.pdf', 'application/pdf', 1536000, 'Currículo Maria Oliveira', 1),
    ((SELECT id FROM hr_applicants WHERE email = 'maria.oliveira@example.com'), 'Maria_Oliveira_Certificados.pdf', 'https://example.com/certificates/maria-oliveira.pdf', 'application/pdf', 512000, 'Certificados profissionais', 0),
    ((SELECT id FROM hr_applicants WHERE email = 'paulo.souza@example.com'), 'Paulo_Souza_CV.pdf', 'https://example.com/cv/paulo-souza.pdf', 'application/pdf', 1280000, 'Currículo Paulo Souza', 1)
ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_url = VALUES(file_url), file_type = VALUES(file_type), file_size = VALUES(file_size), description = VALUES(description), is_resume = VALUES(is_resume); 