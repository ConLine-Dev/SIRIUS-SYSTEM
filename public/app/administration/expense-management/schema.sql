-- Expense Management Module Database Schema

CREATE TABLE expense_management (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    department_id INT NOT NULL,
    payment_date DATE NOT NULL,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    frequency ENUM('single', 'monthly') DEFAULT 'single',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Sample expenses for testing
INSERT INTO expense_management (name, description, amount, department_id, payment_date, status, frequency) VALUES
('Licença de Software', 'Renovação de licença de software de gestão', 5000.00, 1, '2025-02-15', 'pending', 'monthly'),
('Material de Escritório', 'Compra de suprimentos para o escritório', 1500.50, 2, '2025-01-30', 'paid', 'single'),
('Campanha Publicitária', 'Investimento em campanha de marketing digital', 10000.00, 4, '2025-03-01', 'pending', 'single');


CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `iddept_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `departments_relations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `collaborator_id` int NOT NULL,
  PRIMARY KEY (`id`,`department_id`,`collaborator_id`),
  KEY `departaments_foreKey_idx` (`department_id`),
  KEY `fk_user_idx` (`collaborator_id`),
  KEY `idx_department_id` (`department_id`),
  KEY `idx_collaborator_id` (`collaborator_id`),
  KEY `idx_department_collaborator` (`department_id`,`collaborator_id`),
  KEY `idx_departments_relations_collaborator_id` (`collaborator_id`),
  CONSTRAINT `fk_departaments` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `fk_user` FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=185 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
