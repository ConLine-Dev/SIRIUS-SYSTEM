-- Schema para sistema de solicitação de acesso
-- Tabela para armazenar solicitações de acesso de clientes

CREATE TABLE IF NOT EXISTS access_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL,
    message TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    admin_id INT,
    client_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_cnpj (cnpj),
    INDEX idx_admin_id (admin_id),
    INDEX idx_client_id (client_id)
);

-- Tabela para armazenar histórico de ações administrativas
CREATE TABLE IF NOT EXISTS access_request_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    admin_id INT NOT NULL,
    action ENUM('created', 'approved', 'rejected', 'linked_client', 'created_client') NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES access_requests(id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id),
    INDEX idx_admin_id (admin_id)
); 