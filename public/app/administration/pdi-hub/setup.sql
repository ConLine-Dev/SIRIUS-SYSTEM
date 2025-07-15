-- -------------------------------------------------------------------------
-- PDI Hub - Script para criação e atualização das tabelas (Avaliação Dinâmica)
-- -------------------------------------------------------------------------

-- Apagar tabelas antigas se existirem (ordem reversa de dependência)
DROP TABLE IF EXISTS pdi_evaluation_answers;
DROP TABLE IF EXISTS pdi_monthly_evaluations;
DROP TABLE IF EXISTS pdi_performance_levels;
DROP TABLE IF EXISTS pdi_factors;
DROP TABLE IF EXISTS pdi_plan_factors;
DROP TABLE IF EXISTS pdi_actions;
DROP TABLE IF EXISTS pdi_plans;

-- ===============================
-- Tabela de Planos de Desenvolvimento Individual (PDI)
-- ===============================
CREATE TABLE pdi_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    academic_summary TEXT,
    who_are_you TEXT,
    strengths TEXT,
    improvement_points TEXT,
    development_goals TEXT,
    profile_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Ativo',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    start_date DATE NOT NULL, -- Data de início do PDI
    end_date DATE NOT NULL,   -- Data de fim do PDI (1 ano após início)
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id),
    FOREIGN KEY (supervisor_id) REFERENCES collaborators(id)
);

-- ===============================
-- Tabela de Ações do PDI
-- ===============================
CREATE TABLE pdi_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pdi_id INT NOT NULL,
    description TEXT NOT NULL,
    deadline DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pendente',
    completion_date DATE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (pdi_id) REFERENCES pdi_plans(id) ON DELETE CASCADE
);

-- ===============================
-- Tabela de Fatores de Avaliação (perguntas)
-- ===============================
CREATE TABLE pdi_factors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL, -- Nome do fator/pergunta
    description TEXT,
    default_weight DECIMAL(5,2) NOT NULL DEFAULT 1.0, -- Peso padrão do fator
    created_at DATETIME NOT NULL
);

-- ===============================
-- Dados de exemplo para fatores de avaliação
-- ===============================
INSERT INTO pdi_factors (name, description, default_weight, created_at) VALUES
('Assiduidade', 'Frequência e pontualidade no trabalho', 1.5, NOW()),
('Trabalho em Equipe', 'Colaboração e relacionamento com colegas', 1.2, NOW()),
('Criatividade', 'Capacidade de inovação e resolução criativa de problemas', 1.0, NOW()),
('Produtividade', 'Eficiência e qualidade na execução das tarefas', 1.8, NOW()),
('Resolução de Problemas', 'Capacidade de identificar e resolver desafios', 1.3, NOW()),
('Comunicação', 'Clareza e eficácia na comunicação verbal e escrita', 1.1, NOW()),
('Liderança', 'Capacidade de influenciar e motivar outros', 1.0, NOW()),
('Adaptabilidade', 'Flexibilidade para lidar com mudanças', 1.0, NOW());

-- ===============================
-- Associação de Fatores a cada PDI (com peso)
-- ===============================
CREATE TABLE pdi_plan_factors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pdi_id INT NOT NULL,
    factor_id INT NOT NULL,
    weight DECIMAL(5,2) NOT NULL DEFAULT 1.0, -- Peso do fator
    FOREIGN KEY (pdi_id) REFERENCES pdi_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (factor_id) REFERENCES pdi_factors(id) ON DELETE CASCADE
);

-- ===============================
-- Tabela de Configuração dos Níveis de Desempenho por PDI
-- ===============================
CREATE TABLE pdi_performance_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pdi_id INT NOT NULL,
    level_name VARCHAR(50) NOT NULL, -- Ex: Estacionado, Ajustando a Rota, etc
    min_percentage DECIMAL(6,2) NOT NULL, -- Percentual mínimo para o nível
    max_percentage DECIMAL(6,2) NOT NULL, -- Percentual máximo para o nível
    icon VARCHAR(100), -- Caminho do ícone (opcional)
    color VARCHAR(20), -- Cor para barra de progresso (opcional)
    sort_order INT DEFAULT 0, -- Ordem de exibição
    FOREIGN KEY (pdi_id) REFERENCES pdi_plans(id) ON DELETE CASCADE
);

-- ===============================
-- Tabela de Avaliações Mensais
-- ===============================
CREATE TABLE pdi_monthly_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pdi_id INT NOT NULL,
    month INT NOT NULL, -- 1 a 12
    year INT NOT NULL,
    comments TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY unique_monthly (pdi_id, month, year),
    FOREIGN KEY (pdi_id) REFERENCES pdi_plans(id) ON DELETE CASCADE
);

-- ===============================
-- Tabela de Respostas de Avaliação Mensal (por fator)
-- ===============================
CREATE TABLE pdi_evaluation_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluation_id INT NOT NULL,
    factor_id INT NOT NULL,
    score ENUM('Ótimo','Bom','Regular','Ruim','Péssimo') NOT NULL,
    FOREIGN KEY (evaluation_id) REFERENCES pdi_monthly_evaluations(id) ON DELETE CASCADE,
    FOREIGN KEY (factor_id) REFERENCES pdi_factors(id) ON DELETE CASCADE
);

-- ===============================
-- Dados de exemplo para níveis de desempenho (padrão)
-- ===============================
-- Estes dados podem ser inseridos via SQL para cada novo PDI criado
-- Exemplo:
-- INSERT INTO pdi_performance_levels (pdi_id, level_name, min_percentage, max_percentage, icon, color, sort_order) VALUES
--   (1, 'Estacionado', 0, 89.99, 'icon1.png', 'red', 1),
--   (1, 'Ajustando a Rota', 90, 94.99, 'icon2.png', 'orange', 2),
--   (1, 'Na Rota', 95, 99.99, 'icon3.png', 'blue', 3),
--   (1, 'Brilhou na Entrega', 100, 109.99, 'icon4.png', 'green', 4),
--   (1, 'Voando Alto', 110, 999, 'icon5.png', 'gold', 5); 