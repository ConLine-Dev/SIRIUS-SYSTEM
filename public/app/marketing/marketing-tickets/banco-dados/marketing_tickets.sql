-- marketing_tickets.sql
CREATE TABLE marketing_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    other_type VARCHAR(100),
    category ENUM('projeto','referencia') NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NULL, -- Opcional - definido pelo time de marketing
    end_date DATE NULL, -- Opcional - definido pelo time de marketing
    dimensions VARCHAR(100),
    links TEXT,
    status ENUM('Novo','Em triagem','Em andamento','Aguardando validação','Aguardando retorno do solicitante','Finalizado') DEFAULT 'Novo',
    requester_id INT NOT NULL,
    responsible_id INT NULL, -- Definido pelo time de marketing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (responsible_id) REFERENCES users(id)
); 