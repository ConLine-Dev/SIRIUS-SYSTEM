-- Tabela para Localizações (Origens e Destinos)
CREATE TABLE ft_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('Origem', 'Destino', 'Ambos') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Agentes/Armadores
CREATE TABLE ft_agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Modalidades de Transporte
CREATE TABLE ft_modalities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Tabela para Tipos de Container/Carga
CREATE TABLE ft_container_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    -- Armazena os IDs das modalidades aplicáveis como uma string separada por vírgulas, ex: "1,3"
    applicable_modalities VARCHAR(255) 
);

-- Tabela Principal de Tarifas
CREATE TABLE ft_tariffs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origin_id INT NOT NULL,
    destination_id INT NOT NULL,
    modality_id INT NOT NULL,
    container_type_id INT,
    agent_id INT NOT NULL,
    validity_start_date DATE NOT NULL,
    validity_end_date DATE NOT NULL,
    freight_cost DECIMAL(10, 2) NOT NULL,
    freight_currency VARCHAR(10) NOT NULL,
    transit_time VARCHAR(100),
    route_type VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (origin_id) REFERENCES ft_locations(id),
    FOREIGN KEY (destination_id) REFERENCES ft_locations(id),
    FOREIGN KEY (modality_id) REFERENCES ft_modalities(id),
    FOREIGN KEY (container_type_id) REFERENCES ft_container_types(id),
    FOREIGN KEY (agent_id) REFERENCES ft_agents(id)
);

-- Tabela para Surcharges (Sobretaxas)
CREATE TABLE ft_tariffs_surcharges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tariff_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    FOREIGN KEY (tariff_id) REFERENCES ft_tariffs(id) ON DELETE CASCADE
);

-- Tabela para Moedas
CREATE TABLE ft_currencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL
); 