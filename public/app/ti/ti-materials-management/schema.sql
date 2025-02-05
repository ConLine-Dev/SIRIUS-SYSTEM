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
    current_stock INT DEFAULT 0,
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

-- Índices para melhorar performance
CREATE INDEX idx_material_sku ON material_control_materials(sku);
CREATE INDEX idx_movement_material ON material_control_movements(material_id);
CREATE INDEX idx_movement_collaborator ON material_control_movements(collaborator_id);
CREATE INDEX idx_allocation_material ON material_control_allocations(material_id);
CREATE INDEX idx_allocation_collaborator ON material_control_allocations(collaborator_id);
