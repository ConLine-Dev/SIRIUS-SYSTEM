-- Tabela de Materiais
CREATE TABLE material_control_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    -- Categorias de materiais de TI
    -- hardware: Equipamentos físicos de tecnologia
    -- software: Programas e sistemas
    -- accessory: Periféricos e complementos
    -- consumable: Materiais de uso e consumo
    category ENUM('hardware', 'software', 'accessory', 'consumable') NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    -- Unidades de medida para controle de estoque
    -- unit: Unidade individual
    -- box: Caixa ou conjunto
    -- package: Pacote ou conjunto
    -- liter: Volume em litros
    -- kg: Peso em quilogramas
    unit ENUM('unit', 'box', 'package', 'liter', 'kg') NOT NULL,
    minimum_stock INT DEFAULT 0,
    -- Status do material no inventário
    -- active: Material disponível para uso
    -- inactive: Material fora de uso ou descontinuado
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Movimentações de Materiais
CREATE TABLE material_control_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT,
    -- Tipo de movimentação de estoque
    -- input: Entrada de material no estoque
    -- output: Saída de material do estoque
    movement_type ENUM('input', 'output') NOT NULL,
    quantity INT NOT NULL,
    source VARCHAR(255),
    destination VARCHAR(255),
    -- Razões para movimentação de material
    -- purchase: Compra de novo material
    -- donation: Recebimento de doação
    -- transfer: Transferência entre setores
    -- disposal: Descarte de material
    -- maintenance: Envio para manutenção
    reason ENUM('purchase', 'donation', 'transfer', 'disposal', 'maintenance') NOT NULL,
    invoice_number VARCHAR(100),
    observations TEXT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    collaborator_id INT,
    FOREIGN KEY (material_id) REFERENCES material_control_materials(id),
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id)
);

-- Tabela de Alocação de Materiais
CREATE TABLE material_control_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT,
    collaborator_id INT,
    quantity INT NOT NULL,
    allocation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP NULL,
    -- Status da alocação de material
    -- allocated: Material atualmente alocado para um colaborador
    -- returned: Material devolvido ao estoque
    status ENUM('allocated', 'returned') DEFAULT 'allocated',
    observations TEXT,
    FOREIGN KEY (material_id) REFERENCES material_control_materials(id),
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id)
);

CREATE TABLE material_control_returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    allocation_id INT NOT NULL,
    quantity INT NOT NULL,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    material_condition ENUM('perfeito', 'com_defeito', 'danificado') DEFAULT 'perfeito',
    observations TEXT,
    collaborator_id INT NOT NULL,
    material_id INT NOT NULL,
    FOREIGN KEY (allocation_id) REFERENCES material_control_allocations(id),
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id),
    FOREIGN KEY (material_id) REFERENCES material_control_materials(id)
);

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
) ENGINE=InnoDB AUTO_INCREMENT=214 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- Índices para melhorar performance
CREATE INDEX idx_material_sku ON material_control_materials(sku);
CREATE INDEX idx_movement_material ON material_control_movements(material_id);
CREATE INDEX idx_movement_collaborator ON material_control_movements(collaborator_id);
CREATE INDEX idx_allocation_material ON material_control_allocations(material_id);
CREATE INDEX idx_allocation_collaborator ON material_control_allocations(collaborator_id);
