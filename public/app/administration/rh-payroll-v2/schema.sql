-- Tabela de collaborators
CREATE TABLE `collaborators` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `family_name` varchar(45) DEFAULT NULL,
  `image` varchar(255) DEFAULT 'https://conlinebr.com.br/assets/img/icon-redondo.png',
  `create` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_headcargo` int DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `marital_status` varchar(50) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `rg` varchar(20) DEFAULT NULL,
  `rg_issuer` varchar(50) DEFAULT NULL,
  `rg_issue_date` date DEFAULT NULL,
  `voter_title` varchar(20) DEFAULT NULL,
  `passport_number` varchar(20) DEFAULT NULL,
  `birth_city` varchar(100) DEFAULT NULL,
  `birth_state` varchar(100) DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `job_position` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `resignation_date` date DEFAULT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `salary` varchar(255) DEFAULT NULL,
  `contract_type` int DEFAULT NULL,
  `weekly_hours` int DEFAULT NULL,
  `immediate_supervisor` varchar(100) DEFAULT NULL,
  `pis_pasep_number` varchar(20) DEFAULT NULL,
  `work_card_number` varchar(20) DEFAULT NULL,
  `work_card_series` varchar(20) DEFAULT NULL,
  `education` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `email_personal` varchar(100) DEFAULT NULL,
  `email_business` varchar(100) DEFAULT NULL,
  `companie_id` int DEFAULT NULL,
  `cnpj` varchar(18) DEFAULT NULL,
  `pix` varchar(100) DEFAULT NULL,
  `work_card_issue_date` date DEFAULT NULL,
  `additional_observations` text,
  `languages` longtext,
  `hash_code` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`),
  UNIQUE KEY `rg` (`rg`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `idx_id` (`id`),
  KEY `idx_collaborators_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=211 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela de Categorias de Desconto
CREATE TABLE rh_payroll_discount_categories (
    id int NOT NULL AUTO_INCREMENT,
    name_discount VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);

-- Tabela de Descontos
CREATE TABLE rh_payroll_discount_individual (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
    attachment_path VARCHAR(255),
    processing_date DATE DEFAULT NULL,
    processed_by INT DEFAULT NULL,
    reference_month DATE DEFAULT NULL,
    payment_date DATE DEFAULT NULL,
    discount_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id),
    FOREIGN KEY (category_id) REFERENCES rh_payroll_discount_categories(id),
    FOREIGN KEY (processed_by) REFERENCES collaborators(id)
);

-- Tabela de Descontos em Lote
CREATE TABLE rh_payroll_discount_batch (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
    processing_date DATE DEFAULT NULL,
    processed_by INT DEFAULT NULL,
    reference_month DATE DEFAULT NULL,
    payment_date DATE DEFAULT NULL,
    discount_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES rh_payroll_discount_categories(id),
    FOREIGN KEY (processed_by) REFERENCES collaborators(id)
);

-- Tabela de Relação entre Desconto em Lote e Colaboradores
CREATE TABLE rh_payroll_discount_batch_collaborators (
    batch_discount_id INT,
    collaborator_id INT,
    status ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (batch_discount_id, collaborator_id),
    FOREIGN KEY (batch_discount_id) REFERENCES rh_payroll_discount_batch(id),
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id)
);

-- Tabela de Anexos
CREATE TABLE rh_payroll_discount_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discount_id INT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_id) REFERENCES rh_payroll_discount_individual(id)
);

-- Tabela de Histórico de Processamento
CREATE TABLE rh_payroll_discount_processing_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discount_id INT,
    batch_discount_id INT,
    collaborator_id INT NOT NULL,
    processed_amount DECIMAL(10,2) NOT NULL,
    processing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT,
    status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT,
    reference_month DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_id) REFERENCES rh_payroll_discount_individual(id),
    FOREIGN KEY (batch_discount_id) REFERENCES rh_payroll_discount_batch(id),
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id),
    FOREIGN KEY (processed_by) REFERENCES collaborators(id)
);

-- Índices para melhor performance
CREATE INDEX idx_rh_payroll_discount_individual_status 
ON rh_payroll_discount_individual(status);

CREATE INDEX idx_rh_payroll_discount_batch_status 
ON rh_payroll_discount_batch(status);

CREATE INDEX idx_rh_payroll_discount_date 
ON rh_payroll_discount_individual(created_at);

CREATE INDEX idx_rh_payroll_discount_batch_date 
ON rh_payroll_discount_batch(created_at);

CREATE INDEX idx_discount_reference_month 
ON rh_payroll_discount_individual(reference_month);

CREATE INDEX idx_batch_reference_month 
ON rh_payroll_discount_batch(reference_month);

CREATE INDEX idx_processing_history_date 
ON rh_payroll_discount_processing_history(processing_date);

CREATE INDEX idx_processing_history_reference 
ON rh_payroll_discount_processing_history(reference_month);