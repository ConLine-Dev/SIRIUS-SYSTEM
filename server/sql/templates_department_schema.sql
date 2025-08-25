-- Schema para templates predefinidos por departamento
-- Este arquivo cria as tabelas necessárias para armazenar templates de responsabilidades,
-- requisitos, benefícios e diferenciais por departamento

-- Tabela para templates de responsabilidades por departamento
CREATE TABLE IF NOT EXISTS hr_department_responsibilities_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    text TEXT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_department_responsibilities_department FOREIGN KEY (department_id) REFERENCES hr_departments(id) ON DELETE CASCADE,
    INDEX idx_hr_department_responsibilities_department (department_id),
    INDEX idx_hr_department_responsibilities_position (position),
    INDEX idx_hr_department_responsibilities_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela para templates de requisitos por departamento
CREATE TABLE IF NOT EXISTS hr_department_requirements_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    text TEXT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_department_requirements_department FOREIGN KEY (department_id) REFERENCES hr_departments(id) ON DELETE CASCADE,
    INDEX idx_hr_department_requirements_department (department_id),
    INDEX idx_hr_department_requirements_position (position),
    INDEX idx_hr_department_requirements_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela para templates de benefícios por departamento
CREATE TABLE IF NOT EXISTS hr_department_benefits_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    text TEXT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_department_benefits_department FOREIGN KEY (department_id) REFERENCES hr_departments(id) ON DELETE CASCADE,
    INDEX idx_hr_department_benefits_department (department_id),
    INDEX idx_hr_department_benefits_position (position),
    INDEX idx_hr_department_benefits_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela para templates de diferenciais por departamento
CREATE TABLE IF NOT EXISTS hr_department_nice_to_have_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    text TEXT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_department_nice_to_have_department FOREIGN KEY (department_id) REFERENCES hr_departments(id) ON DELETE CASCADE,
    INDEX idx_hr_department_nice_to_have_department (department_id),
    INDEX idx_hr_department_nice_to_have_position (position),
    INDEX idx_hr_department_nice_to_have_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir templates de exemplo para o departamento de Tecnologia
INSERT INTO hr_department_responsibilities_templates (department_id, position, text) VALUES
(1, 1, 'Desenvolver e manter aplicações web e mobile'),
(1, 2, 'Participar de code reviews e revisões de arquitetura'),
(1, 3, 'Colaborar com a equipe de produto para definir requisitos'),
(1, 4, 'Implementar testes automatizados'),
(1, 5, 'Documentar APIs e processos técnicos')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_requirements_templates (department_id, position, text) VALUES
(1, 1, 'Experiência com desenvolvimento web (JavaScript/TypeScript)'),
(1, 2, 'Conhecimento em frameworks modernos (React, Vue, Angular)'),
(1, 3, 'Experiência com bancos de dados SQL e NoSQL'),
(1, 4, 'Conhecimento em Git e metodologias ágeis'),
(1, 5, 'Inglês técnico para leitura de documentação')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_benefits_templates (department_id, position, text) VALUES
(1, 1, 'Plano de saúde e odontologia'),
(1, 2, 'Vale refeição/alimentação'),
(1, 3, 'Home office flexível'),
(1, 4, 'Participação em eventos e conferências'),
(1, 5, 'Plano de carreira e desenvolvimento')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_nice_to_have_templates (department_id, position, text) VALUES
(1, 1, 'Experiência com cloud (AWS, Azure, GCP)'),
(1, 2, 'Conhecimento em Docker e Kubernetes'),
(1, 3, 'Experiência com microsserviços'),
(1, 4, 'Contribuições para projetos open source')
ON DUPLICATE KEY UPDATE text = VALUES(text);

-- Inserir templates de exemplo para o departamento de Operações
INSERT INTO hr_department_responsibilities_templates (department_id, position, text) VALUES
(2, 1, 'Gerenciar processos operacionais'),
(2, 2, 'Atender clientes internos e externos'),
(2, 3, 'Controlar indicadores de performance'),
(2, 4, 'Elaborar relatórios operacionais')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_requirements_templates (department_id, position, text) VALUES
(2, 1, 'Experiência em operações logísticas'),
(2, 2, 'Conhecimento em Excel avançado'),
(2, 3, 'Boa comunicação e relacionamento'),
(2, 4, 'Inglês intermediário')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_benefits_templates (department_id, position, text) VALUES
(2, 1, 'Plano de saúde'),
(2, 2, 'Vale refeição'),
(2, 3, 'Bônus por resultados'),
(2, 4, 'Plano de carreira')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_nice_to_have_templates (department_id, position, text) VALUES
(2, 1, 'Conhecimento em sistemas ERP'),
(2, 2, 'Experiência em comércio exterior'),
(2, 3, 'Certificações na área')
ON DUPLICATE KEY UPDATE text = VALUES(text);

-- Inserir templates de exemplo para o departamento de Marketing
INSERT INTO hr_department_responsibilities_templates (department_id, position, text) VALUES
(3, 1, 'Criar conteúdo para redes sociais'),
(3, 2, 'Desenvolver campanhas de marketing'),
(3, 3, 'Analisar métricas e resultados'),
(3, 4, 'Gerenciar presença digital da empresa')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_requirements_templates (department_id, position, text) VALUES
(3, 1, 'Formação em Marketing, Publicidade ou afins'),
(3, 2, 'Experiência com redes sociais'),
(3, 3, 'Conhecimento em ferramentas de design'),
(3, 4, 'Criatividade e boa comunicação')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_benefits_templates (department_id, position, text) VALUES
(3, 1, 'Plano de saúde'),
(3, 2, 'Vale refeição'),
(3, 3, 'Participação em eventos'),
(3, 4, 'Desenvolvimento criativo')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_nice_to_have_templates (department_id, position, text) VALUES
(3, 1, 'Experiência com Google Ads'),
(3, 2, 'Conhecimento em SEO'),
(3, 3, 'Ferramentas de análise (Google Analytics)')
ON DUPLICATE KEY UPDATE text = VALUES(text);

-- Inserir templates de exemplo para o departamento de Comercial
INSERT INTO hr_department_responsibilities_templates (department_id, position, text) VALUES
(4, 1, 'Prospectar novos clientes'),
(4, 2, 'Gerenciar carteira de clientes'),
(4, 3, 'Elaborar propostas comerciais'),
(4, 4, 'Atingir metas de vendas')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_requirements_templates (department_id, position, text) VALUES
(4, 1, 'Experiência em vendas B2B'),
(4, 2, 'Boa comunicação e persuasão'),
(4, 3, 'Conhecimento do produto/serviço'),
(4, 4, 'Inglês intermediário')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_benefits_templates (department_id, position, text) VALUES
(4, 1, 'Comissão por vendas'),
(4, 2, 'Plano de saúde'),
(4, 3, 'Vale refeição'),
(4, 4, 'Metas desafiadoras')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_nice_to_have_templates (department_id, position, text) VALUES
(4, 1, 'Experiência no setor'),
(4, 2, 'Conhecimento em CRM'),
(4, 3, 'Networking consolidado')
ON DUPLICATE KEY UPDATE text = VALUES(text);

-- Inserir templates de exemplo para o departamento de RH
INSERT INTO hr_department_responsibilities_templates (department_id, position, text) VALUES
(5, 1, 'Recrutar e selecionar candidatos'),
(5, 2, 'Gerenciar processos de onboarding'),
(5, 3, 'Acompanhar desenvolvimento de colaboradores'),
(5, 4, 'Implementar políticas de RH')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_requirements_templates (department_id, position, text) VALUES
(5, 1, 'Formação em Psicologia, Administração ou RH'),
(5, 2, 'Experiência em recrutamento e seleção'),
(5, 3, 'Boa comunicação e empatia'),
(5, 4, 'Conhecimento em legislação trabalhista')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_benefits_templates (department_id, position, text) VALUES
(5, 1, 'Plano de saúde'),
(5, 2, 'Vale refeição'),
(5, 3, 'Desenvolvimento profissional'),
(5, 4, 'Ambiente colaborativo')
ON DUPLICATE KEY UPDATE text = VALUES(text);

INSERT INTO hr_department_nice_to_have_templates (department_id, position, text) VALUES
(5, 1, 'Certificações em RH'),
(5, 2, 'Experiência com sistemas de RH'),
(5, 3, 'Conhecimento em gestão de pessoas')
ON DUPLICATE KEY UPDATE text = VALUES(text); 