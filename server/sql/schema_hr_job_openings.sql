-- Schema: RH Job Openings (MySQL 8)
-- Charset padrão do projeto
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Drops (ordem: filhos -> pais)
DROP TABLE IF EXISTS hr_job_benefits;
DROP TABLE IF EXISTS hr_job_nice_to_have;
DROP TABLE IF EXISTS hr_job_requirements;
DROP TABLE IF EXISTS hr_job_responsibilities;
DROP TABLE IF EXISTS hr_job_postings;
DROP TABLE IF EXISTS hr_contract_types;
DROP TABLE IF EXISTS hr_levels;
DROP TABLE IF EXISTS hr_modalities;
DROP TABLE IF EXISTS hr_locations;
DROP TABLE IF EXISTS hr_departments;

SET FOREIGN_KEY_CHECKS = 1;

-- Tabela de Departamentos
CREATE TABLE IF NOT EXISTS hr_departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hr_departments_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Localizações (texto livre para cidade/estado/país conforme uso atual)
CREATE TABLE IF NOT EXISTS hr_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hr_locations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Modalidades (Presencial/Remoto/Híbrido)
CREATE TABLE IF NOT EXISTS hr_modalities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hr_modalities_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Níveis (Estágio/Júnior/Pleno/Sênior/etc.)
CREATE TABLE IF NOT EXISTS hr_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hr_levels_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Tipos de Contrato (Integral/Parcial/CLT/PJ/Estágio/Temporário)
CREATE TABLE IF NOT EXISTS hr_contract_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hr_contract_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Principal de Vagas
CREATE TABLE IF NOT EXISTS hr_job_postings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(100) NOT NULL COMMENT 'Identificador público/slug ex: dev-backend-pleno-ia',
    title VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    location_id INT NOT NULL,
    modality_id INT NOT NULL,
    level_id INT NOT NULL,
    contract_type_id INT NOT NULL,
    openings INT NOT NULL DEFAULT 1,
    posted_at DATE NOT NULL,
    description TEXT,
    application_url VARCHAR(500) NULL,
    status ENUM('Draft','Published','Closed','Archived') NOT NULL DEFAULT 'Published',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_hr_job_postings_public_id UNIQUE (public_id),
    INDEX idx_hr_job_postings_department (department_id),
    INDEX idx_hr_job_postings_location (location_id),
    INDEX idx_hr_job_postings_modality (modality_id),
    INDEX idx_hr_job_postings_level (level_id),
    INDEX idx_hr_job_postings_contract (contract_type_id),
    INDEX idx_hr_job_postings_status (status),
    INDEX idx_hr_job_postings_posted_at (posted_at),
    CONSTRAINT fk_hr_job_postings_department FOREIGN KEY (department_id) REFERENCES hr_departments(id),
    CONSTRAINT fk_hr_job_postings_location FOREIGN KEY (location_id) REFERENCES hr_locations(id),
    CONSTRAINT fk_hr_job_postings_modality FOREIGN KEY (modality_id) REFERENCES hr_modalities(id),
    CONSTRAINT fk_hr_job_postings_level FOREIGN KEY (level_id) REFERENCES hr_levels(id),
    CONSTRAINT fk_hr_job_postings_contract FOREIGN KEY (contract_type_id) REFERENCES hr_contract_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Itens de vaga (listas)
CREATE TABLE IF NOT EXISTS hr_job_responsibilities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    text TEXT NOT NULL,
    CONSTRAINT fk_hr_job_responsibilities_job FOREIGN KEY (job_id) REFERENCES hr_job_postings(id) ON DELETE CASCADE,
    INDEX idx_hr_job_responsibilities_job (job_id),
    INDEX idx_hr_job_responsibilities_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hr_job_requirements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    text TEXT NOT NULL,
    CONSTRAINT fk_hr_job_requirements_job FOREIGN KEY (job_id) REFERENCES hr_job_postings(id) ON DELETE CASCADE,
    INDEX idx_hr_job_requirements_job (job_id),
    INDEX idx_hr_job_requirements_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hr_job_nice_to_have (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    text TEXT NOT NULL,
    CONSTRAINT fk_hr_job_nice_to_have_job FOREIGN KEY (job_id) REFERENCES hr_job_postings(id) ON DELETE CASCADE,
    INDEX idx_hr_job_nice_to_have_job (job_id),
    INDEX idx_hr_job_nice_to_have_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hr_job_benefits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    text TEXT NOT NULL,
    CONSTRAINT fk_hr_job_benefits_job FOREIGN KEY (job_id) REFERENCES hr_job_postings(id) ON DELETE CASCADE,
    INDEX idx_hr_job_benefits_job (job_id),
    INDEX idx_hr_job_benefits_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seeds básicos (garantia de domínio mínimo)
INSERT INTO hr_departments (name) VALUES
    ('Tecnologia'), ('Operações'), ('Marketing'), ('Comercial'), ('Recursos Humanos')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO hr_locations (name) VALUES
    ('Itajaí - SC')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO hr_modalities (name) VALUES
    ('Remoto'), ('Presencial'), ('Híbrido')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO hr_levels (name) VALUES
    ('Estágio'), ('Júnior'), ('Pleno'), ('Sênior')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO hr_contract_types (name) VALUES
    ('Integral'), ('Parcial'), ('CLT'), ('PJ'), ('Estágio'), ('Temporário')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Helpers para buscar IDs por nome
-- Obs.: os SELECTs abaixo são utilizados dentro dos INSERTs para amarrar FKs por nome

-- Vagas (baseado no JSON)
-- 1) Desenvolvedor Backend Pleno | Especialização em IA
INSERT INTO hr_job_postings (
    public_id, title, department_id, location_id, modality_id, level_id, contract_type_id,
    openings, posted_at, description, status, is_active
) VALUES (
    'dev-backend-pleno-ia',
    'Desenvolvedor Backend Pleno | Especialização em IA',
    (SELECT id FROM hr_departments WHERE name = 'Tecnologia'),
    (SELECT id FROM hr_locations WHERE name = 'Itajaí - SC'),
    (SELECT id FROM hr_modalities WHERE name = 'Remoto'),
    (SELECT id FROM hr_levels WHERE name = 'Pleno'),
    (SELECT id FROM hr_contract_types WHERE name = 'Integral'),
    1,
    '2025-07-30',
    'Se você é apaixonado por tecnologia, gosta de resolver problemas complexos com soluções inteligentes e quer atuar na construção de sistemas que integram IA, automações e microserviços, essa oportunidade é para você!',
    'Published',
    1
);

-- 2) Assistente Operacional | Importação Marítima
INSERT INTO hr_job_postings (
    public_id, title, department_id, location_id, modality_id, level_id, contract_type_id,
    openings, posted_at, description, status, is_active
) VALUES (
    'assistente-operacional-importacao',
    'Assistente Operacional | Importação Marítima',
    (SELECT id FROM hr_departments WHERE name = 'Operações'),
    (SELECT id FROM hr_locations WHERE name = 'Itajaí - SC'),
    (SELECT id FROM hr_modalities WHERE name = 'Presencial'),
    (SELECT id FROM hr_levels WHERE name = 'Júnior'),
    (SELECT id FROM hr_contract_types WHERE name = 'Integral'),
    1,
    '2025-07-22',
    'Apoio às atividades operacionais de importação marítima, controle de prazos e comunicação com agentes.',
    'Published',
    1
);

-- 3) Analista Operacional | Importação Marítima Sênior
INSERT INTO hr_job_postings (
    public_id, title, department_id, location_id, modality_id, level_id, contract_type_id,
    openings, posted_at, description, status, is_active
) VALUES (
    'analista-operacional-senior',
    'Analista Operacional | Importação Marítima Sênior',
    (SELECT id FROM hr_departments WHERE name = 'Operações'),
    (SELECT id FROM hr_locations WHERE name = 'Itajaí - SC'),
    (SELECT id FROM hr_modalities WHERE name = 'Presencial'),
    (SELECT id FROM hr_levels WHERE name = 'Sênior'),
    (SELECT id FROM hr_contract_types WHERE name = 'Integral'),
    1,
    '2025-06-24',
    'Responsável por processos críticos de importação e relacionamento com terminais e armadores.',
    'Published',
    1
);

-- 4) Estágio em Marketing
INSERT INTO hr_job_postings (
    public_id, title, department_id, location_id, modality_id, level_id, contract_type_id,
    openings, posted_at, description, status, is_active
) VALUES (
    'estagio-marketing',
    'Estágio em Marketing',
    (SELECT id FROM hr_departments WHERE name = 'Marketing'),
    (SELECT id FROM hr_locations WHERE name = 'Itajaí - SC'),
    (SELECT id FROM hr_modalities WHERE name = 'Presencial'),
    (SELECT id FROM hr_levels WHERE name = 'Estágio'),
    (SELECT id FROM hr_contract_types WHERE name = 'Estágio'),
    1,
    '2025-06-10',
    'Apoiar a criação de conteúdo e ações de marca.',
    'Published',
    1
);

-- 5) Sales Executive | Importação Marítima Sênior
INSERT INTO hr_job_postings (
    public_id, title, department_id, location_id, modality_id, level_id, contract_type_id,
    openings, posted_at, description, status, is_active
) VALUES (
    'sales-executive-importacao',
    'Sales Executive | Importação Marítima Sênior',
    (SELECT id FROM hr_departments WHERE name = 'Comercial'),
    (SELECT id FROM hr_locations WHERE name = 'Itajaí - SC'),
    (SELECT id FROM hr_modalities WHERE name = 'Presencial'),
    (SELECT id FROM hr_levels WHERE name = 'Sênior'),
    (SELECT id FROM hr_contract_types WHERE name = 'Integral'),
    1,
    '2025-05-10',
    'Atuação consultiva em vendas de soluções de importação marítima.',
    'Published',
    1
);

-- Inserção dos itens de cada vaga
-- Desenvolvedor Backend Pleno | Especialização em IA
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 1, 'Desenvolver e manter APIs e microserviços escaláveis e performáticos' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 2, 'Criar pipelines de dados que suportem aplicações com IA' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 3, 'Implementar integrações seguras e bem documentadas' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 4, 'Participar de decisões de arquitetura e propor melhorias técnicas' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 5, 'Monitorar, debugar e otimizar sistemas em produção' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';

INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 1, 'Experiência sólida em Node.js e NestJS' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 2, 'Prática com front-end em JavaScript/TypeScript' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 3, 'Conhecimento em SQL Server e Postgres' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 4, 'Experiência com plataformas SaaS como Supabase ou Firebase' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 5, 'Git e metodologias ágeis (Scrum/Kanban)' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';

INSERT INTO hr_job_nice_to_have (job_id, position, text)
SELECT id, 1, 'TensorFlow, PyTorch ou LangChain' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_nice_to_have (job_id, position, text)
SELECT id, 2, 'Experiência com filas e mensageria' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_nice_to_have (job_id, position, text)
SELECT id, 3, 'Docker/Kubernetes' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';

INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 1, 'Plano de saúde e odontologia' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 2, 'Gympass' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 3, 'Inglês in company' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 4, 'Home office 2x por semana' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';
INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 5, 'Parcerias com universidades' FROM hr_job_postings WHERE public_id = 'dev-backend-pleno-ia';

-- Assistente Operacional | Importação Marítima
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 1, 'Acompanhar processos de importação' FROM hr_job_postings WHERE public_id = 'assistente-operacional-importacao';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 2, 'Organizar documentos e prazos' FROM hr_job_postings WHERE public_id = 'assistente-operacional-importacao';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 3, 'Atendimento a clientes internos e externos' FROM hr_job_postings WHERE public_id = 'assistente-operacional-importacao';

INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 1, 'Formação em Comércio Exterior, Logística ou afins' FROM hr_job_postings WHERE public_id = 'assistente-operacional-importacao';
INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 2, 'Pacote Office e boa comunicação' FROM hr_job_postings WHERE public_id = 'assistente-operacional-importacao';

INSERT INTO hr_job_nice_to_have (job_id, position, text)
SELECT id, 1, 'Inglês intermediário' FROM hr_job_postings WHERE public_id = 'assistente-operacional-importacao';

INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 1, 'Plano de saúde' FROM hr_job_postings WHERE public_id = 'assistente-operacional-importacao';
INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 2, 'VR/VA' FROM hr_job_postings WHERE public_id = 'assistente-operacional-importacao';

-- Analista Operacional | Importação Marítima Sênior
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 1, 'Gestão de processos complexos' FROM hr_job_postings WHERE public_id = 'analista-operacional-senior';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 2, 'Interface com clientes e parceiros' FROM hr_job_postings WHERE public_id = 'analista-operacional-senior';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 3, 'Análise de indicadores de operação' FROM hr_job_postings WHERE public_id = 'analista-operacional-senior';

INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 1, 'Experiência em operações marítimas' FROM hr_job_postings WHERE public_id = 'analista-operacional-senior';
INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 2, 'Excel avançado e inglês intermediário' FROM hr_job_postings WHERE public_id = 'analista-operacional-senior';

INSERT INTO hr_job_nice_to_have (job_id, position, text)
SELECT id, 1, 'Conhecimento em sistemas TOS' FROM hr_job_postings WHERE public_id = 'analista-operacional-senior';

INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 1, 'Plano de saúde' FROM hr_job_postings WHERE public_id = 'analista-operacional-senior';
INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 2, 'Bônus por resultados' FROM hr_job_postings WHERE public_id = 'analista-operacional-senior';

-- Estágio em Marketing
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 1, 'Produção de posts' FROM hr_job_postings WHERE public_id = 'estagio-marketing';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 2, 'Apoio em campanhas' FROM hr_job_postings WHERE public_id = 'estagio-marketing';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 3, 'Atualização de site' FROM hr_job_postings WHERE public_id = 'estagio-marketing';

INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 1, 'Cursando Marketing, PP ou afins' FROM hr_job_postings WHERE public_id = 'estagio-marketing';

INSERT INTO hr_job_nice_to_have (job_id, position, text)
SELECT id, 1, 'Noções de design' FROM hr_job_postings WHERE public_id = 'estagio-marketing';

INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 1, 'Bolsa auxílio' FROM hr_job_postings WHERE public_id = 'estagio-marketing';
INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 2, 'VT' FROM hr_job_postings WHERE public_id = 'estagio-marketing';

-- Sales Executive | Importação Marítima Sênior
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 1, 'Prospecção e relacionamento' FROM hr_job_postings WHERE public_id = 'sales-executive-importacao';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 2, 'Elaboração de propostas' FROM hr_job_postings WHERE public_id = 'sales-executive-importacao';
INSERT INTO hr_job_responsibilities (job_id, position, text)
SELECT id, 3, 'Gestão de carteira' FROM hr_job_postings WHERE public_id = 'sales-executive-importacao';

INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 1, 'Experiência em vendas B2B' FROM hr_job_postings WHERE public_id = 'sales-executive-importacao';
INSERT INTO hr_job_requirements (job_id, position, text)
SELECT id, 2, 'Conhecimento em comex' FROM hr_job_postings WHERE public_id = 'sales-executive-importacao';

INSERT INTO hr_job_nice_to_have (job_id, position, text)
SELECT id, 1, 'Inglês avançado' FROM hr_job_postings WHERE public_id = 'sales-executive-importacao';

INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 1, 'Remuneração variável' FROM hr_job_postings WHERE public_id = 'sales-executive-importacao';
INSERT INTO hr_job_benefits (job_id, position, text)
SELECT id, 2, 'Plano de saúde' FROM hr_job_postings WHERE public_id = 'sales-executive-importacao'; 

-- Status de Candidaturas (Kanban)
CREATE TABLE IF NOT EXISTS hr_application_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    position INT NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY uq_hr_application_statuses_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Candidatos
CREATE TABLE IF NOT EXISTS hr_applicants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(60),
    linkedin_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hr_applicants_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

-- Tabela de inscrições nas vagas
CREATE TABLE IF NOT EXISTS hr_job_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    applicant_id BIGINT NOT NULL,
    status_id BIGINT NOT NULL,
    cover_letter TEXT,
    interview_date DATETIME NULL,
    offer_date DATETIME NULL,
    board_order INT DEFAULT 0,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES hr_job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES hr_applicants(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES hr_application_statuses(id),
    UNIQUE KEY unique_job_applicant (job_id, applicant_id),
    INDEX idx_hr_job_applications_job (job_id),
    INDEX idx_hr_job_applications_applicant (applicant_id),
    INDEX idx_hr_job_applications_status (status_id),
    INDEX idx_hr_job_applications_board_order (board_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seeds de status padrão
INSERT INTO hr_application_statuses (name, position)
VALUES ('Recebidos', 1), ('Em Triagem', 2), ('Entrevista', 3), ('Oferta', 4), ('Aprovado', 5)
ON DUPLICATE KEY UPDATE position = VALUES(position), is_active = 1; 

-- Notas internas por inscrição
CREATE TABLE IF NOT EXISTS hr_application_internal_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    author_id BIGINT DEFAULT 0,
    note TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES hr_job_applications(id) ON DELETE CASCADE,
    INDEX idx_hr_app_notes_app (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seeds de candidatos (exemplos)
INSERT INTO hr_applicants (name, email, phone, linkedin_url) VALUES
    ('João Silva', 'joao.silva@example.com', '+55 47 99999-1111', 'https://www.linkedin.com/in/joaosilva'),
    ('Maria Oliveira', 'maria.oliveira@example.com', '+55 47 99999-2222', 'https://www.linkedin.com/in/mariaoliveira'),
    ('Paulo Souza', 'paulo.souza@example.com', '+55 47 99999-3333', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url);

-- Seeds de anexos dos candidatos
INSERT INTO hr_applicant_attachments (applicant_id, file_name, file_url, file_type, file_size, description, is_resume) VALUES
    ((SELECT id FROM hr_applicants WHERE email = 'joao.silva@example.com'), 'Joao_Silva_CV.pdf', 'https://example.com/cv/joao-silva.pdf', 'application/pdf', 1024000, 'Currículo João Silva', 1),
    ((SELECT id FROM hr_applicants WHERE email = 'joao.silva@example.com'), 'Joao_Silva_Portfolio.pdf', 'https://example.com/portfolio/joao-silva.pdf', 'application/pdf', 2048000, 'Portfólio de projetos', 0),
    ((SELECT id FROM hr_applicants WHERE email = 'maria.oliveira@example.com'), 'Maria_Oliveira_CV.pdf', 'https://example.com/cv/maria-oliveira.pdf', 'application/pdf', 1536000, 'Currículo Maria Oliveira', 1),
    ((SELECT id FROM hr_applicants WHERE email = 'maria.oliveira@example.com'), 'Maria_Oliveira_Certificados.pdf', 'https://example.com/certificates/maria-oliveira.pdf', 'application/pdf', 512000, 'Certificados profissionais', 0),
    ((SELECT id FROM hr_applicants WHERE email = 'paulo.souza@example.com'), 'Paulo_Souza_CV.pdf', 'https://example.com/cv/paulo-souza.pdf', 'application/pdf', 1280000, 'Currículo Paulo Souza', 1)
ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_url = VALUES(file_url), file_type = VALUES(file_type), file_size = VALUES(file_size), description = VALUES(description), is_resume = VALUES(is_resume);

-- Vincular candidatos às vagas seeded (status inicial: Recebidos)
INSERT INTO hr_job_applications (job_id, applicant_id, status_id, cover_letter, interview_date, offer_date, board_order)
SELECT j.id, a.id, s.id, 'Tenho interesse na posição e cumpro os requisitos listados.', NULL, NULL, 1
FROM hr_job_postings j
JOIN hr_applicants a ON a.email = 'joao.silva@example.com'
JOIN hr_application_statuses s ON s.name = 'Recebidos'
WHERE j.public_id = 'dev-backend-pleno-ia'
ON DUPLICATE KEY UPDATE cover_letter = VALUES(cover_letter);

INSERT INTO hr_job_applications (job_id, applicant_id, status_id, cover_letter, interview_date, offer_date, board_order)
SELECT j.id, a.id, s.id, 'Experiência com operações e foco em resultados.', NULL, NULL, 1
FROM hr_job_postings j
JOIN hr_applicants a ON a.email = 'maria.oliveira@example.com'
JOIN hr_application_statuses s ON s.name = 'Recebidos'
WHERE j.public_id = 'assistente-operacional-importacao'
ON DUPLICATE KEY UPDATE cover_letter = VALUES(cover_letter);

INSERT INTO hr_job_applications (job_id, applicant_id, status_id, cover_letter, interview_date, offer_date, board_order)
SELECT j.id, a.id, s.id, 'Disponível para entrevistas e com histórico sólido.', NULL, NULL, 1
FROM hr_job_postings j
JOIN hr_applicants a ON a.email = 'paulo.souza@example.com'
JOIN hr_application_statuses s ON s.name = 'Recebidos'
WHERE j.public_id = 'sales-executive-importacao'
ON DUPLICATE KEY UPDATE cover_letter = VALUES(cover_letter);

-- Exemplos de candidatos com datas de entrevista e oferta
-- Candidato com entrevista agendada
INSERT INTO hr_job_applications (job_id, applicant_id, status_id, cover_letter, interview_date, offer_date, board_order)
SELECT j.id, a.id, s.id, 'Perfil alinhado com a vaga. Entrevista agendada.', '2025-01-15 14:00:00', NULL, 2
FROM hr_job_postings j
JOIN hr_applicants a ON a.email = 'joao.silva@example.com'
JOIN hr_application_statuses s ON s.name = 'Entrevista'
WHERE j.public_id = 'dev-backend-pleno-ia'
ON DUPLICATE KEY UPDATE interview_date = VALUES(interview_date), status_id = s.id;

-- Candidato com oferta feita
INSERT INTO hr_job_applications (job_id, applicant_id, status_id, cover_letter, interview_date, offer_date, board_order)
SELECT j.id, a.id, s.id, 'Excelente candidato. Oferta enviada.', '2025-01-10 10:00:00', '2025-01-12 16:30:00', 1
FROM hr_job_postings j
JOIN hr_applicants a ON a.email = 'maria.oliveira@example.com'
JOIN hr_application_statuses s ON s.name = 'Oferta'
WHERE j.public_id = 'assistente-operacional-importacao'
ON DUPLICATE KEY UPDATE interview_date = VALUES(interview_date), offer_date = VALUES(offer_date), status_id = s.id;

-- Migração para atualizar estrutura das tabelas existentes
-- Adicionar coluna resume_file na tabela hr_applicants
-- Execute estes comandos manualmente se necessário:
-- ALTER TABLE hr_applicants ADD COLUMN resume_file VARCHAR(500) AFTER linkedin_url;
-- Migrar dados existentes (se houver)
-- UPDATE hr_applicants SET resume_file = resume_url WHERE resume_url IS NOT NULL AND resume_file IS NULL;
-- Remover colunas antigas da tabela hr_applicants
-- ALTER TABLE hr_applicants DROP COLUMN portfolio_url;
-- ALTER TABLE hr_applicants DROP COLUMN resume_url;
-- Remover coluna source da tabela hr_job_applications
-- ALTER TABLE hr_job_applications DROP COLUMN source;

-- Migração para URLs seguras dos anexos (execute após implementar a rota segura)
-- Atualizar URLs dos anexos existentes para usar apenas o nome do arquivo
-- UPDATE hr_applicant_attachments 
-- SET file_url = SUBSTRING_INDEX(file_url, '/', -1) 
-- WHERE file_url LIKE '/storageService/hr-job-openings/%';

-- Verificar se há anexos com URLs antigas
-- SELECT id, file_name, file_url FROM hr_applicant_attachments WHERE file_url LIKE '/storageService/hr-job-openings/%';

-- Migração para adicionar campos de data de entrevista e oferta
-- ALTER TABLE hr_job_applications ADD COLUMN interview_date DATETIME NULL AFTER cover_letter;
-- ALTER TABLE hr_job_applications ADD COLUMN offer_date DATETIME NULL AFTER interview_date; 

-- Inserir candidatos de exemplo com entrevistas agendadas para hoje
INSERT INTO hr_applicants (name, email, phone, linkedin_url) VALUES
('Maria Silva', 'maria.silva@email.com', '(11) 99999-1111', 'https://linkedin.com/in/maria-silva'),
('João Santos', 'joao.santos@email.com', '(11) 99999-2222', 'https://linkedin.com/in/joao-santos'),
('Ana Costa', 'ana.costa@email.com', '(11) 99999-3333', 'https://linkedin.com/in/ana-costa'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '(11) 99999-4444', 'https://linkedin.com/in/pedro-oliveira'),
('Carla Ferreira', 'carla.ferreira@email.com', '(11) 99999-5555', 'https://linkedin.com/in/carla-ferreira');

-- Inserir candidaturas com entrevistas agendadas para hoje
INSERT INTO hr_job_applications (job_id, applicant_id, status_id, cover_letter, interview_date, offer_date, board_order) VALUES
-- Entrevistas para hoje (substitua pela data atual)
(1, 1, 2, 'Tenho grande interesse na vaga de Desenvolvedor Full Stack...', CURDATE() + INTERVAL 9 HOUR, NULL, 0),
(2, 2, 2, 'Sou apaixonado por design e inovação...', CURDATE() + INTERVAL 14 HOUR, NULL, 0),
(3, 3, 2, 'Possuo experiência sólida em gestão de projetos...', CURDATE() + INTERVAL 16 HOUR, NULL, 0),
(1, 4, 2, 'Tenho background em desenvolvimento web...', CURDATE() + INTERVAL 10 HOUR, NULL, 1),
(2, 5, 2, 'Sou designer criativo com foco em UX/UI...', CURDATE() + INTERVAL 15 HOUR, NULL, 1); 

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

-- Tabela para gerenciar emails automáticos de entrevistas
DROP TABLE IF EXISTS hr_interview_email_logs;
CREATE TABLE IF NOT EXISTS hr_interview_email_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email_type ENUM('daily_alert', 'reminder_15min', 'reminder_past', 'reminder_candidate') NOT NULL,
    application_id BIGINT NULL,
    interview_date DATETIME NOT NULL,
    candidate_email VARCHAR(200) NULL,
    recipient_emails TEXT NULL COMMENT 'JSON array de emails destinatários',
    subject VARCHAR(255) NOT NULL,
    email_content TEXT,
    status ENUM('pending', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message TEXT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hr_interview_email_logs_type (email_type),
    INDEX idx_hr_interview_email_logs_status (status),
    INDEX idx_hr_interview_email_logs_interview_date (interview_date),
    INDEX idx_hr_interview_email_logs_application (application_id),
    INDEX idx_hr_interview_email_logs_pending (status, next_retry_at),
    INDEX idx_hr_interview_email_logs_created_at (created_at),
    
    CONSTRAINT fk_hr_interview_email_logs_application FOREIGN KEY (application_id) REFERENCES hr_job_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela para configurações de emails automáticos
DROP TABLE IF EXISTS hr_interview_email_config;
CREATE TABLE IF NOT EXISTS hr_interview_email_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hr_interview_email_config_key (config_key),
    INDEX idx_hr_interview_email_config_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir configurações padrão
INSERT INTO hr_interview_email_config (config_key, config_value, description) VALUES
('daily_alert_enabled', 'true', 'Habilitar email diário de alerta de entrevistas'),
('daily_alert_time', '07:00', 'Horário para envio do email diário (HH:MM)'),
('reminder_15min_enabled', 'true', 'Habilitar lembretes 15 min antes da entrevista'),
('reminder_15min_interval', '15', 'Intervalo em minutos para lembrete antes da entrevista'),
('candidate_reminder_enabled', 'true', 'Habilitar lembretes para candidatos'),
('max_retries', '3', 'Número máximo de tentativas de envio'),
('retry_interval_minutes', '5', 'Intervalo entre tentativas em minutos'),
('recipient_emails', '["rh@conlinebr.com.br"]', 'Emails destinatários para alertas (JSON array)'),
('email_subject_prefix', '[CONLINE]', 'Prefixo para assuntos dos emails')
ON DUPLICATE KEY UPDATE 
    config_value = VALUES(config_value),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP; 