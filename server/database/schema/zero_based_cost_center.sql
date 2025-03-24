-- Tabela de Centros de Custo Base Zero
CREATE TABLE IF NOT EXISTS `zero_based_cost_centers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Responsáveis por Centro de Custo
CREATE TABLE IF NOT EXISTS `zero_based_cost_center_responsibles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cost_center_id` int(11) NOT NULL,
  `responsible_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cost_center` (`cost_center_id`),
  KEY `idx_responsible` (`responsible_id`),
  CONSTRAINT `fk_cost_center_responsible` FOREIGN KEY (`cost_center_id`) REFERENCES `zero_based_cost_centers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_responsible_collaborator` FOREIGN KEY (`responsible_id`) REFERENCES `collaborators` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Solicitações de Gastos
CREATE TABLE IF NOT EXISTS `zero_based_expense_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `month` varchar(20) NOT NULL,
  `cost_center_id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `amount` decimal(15,2) NOT NULL,
  `strategic_contribution` text,
  `status` enum('Pendente','Aprovado','Rejeitado','Aprovação Parcial') NOT NULL DEFAULT 'Pendente',
  `requester_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cost_center` (`cost_center_id`),
  KEY `idx_requester` (`requester_id`),
  KEY `idx_status` (`status`),
  KEY `idx_month` (`month`),
  CONSTRAINT `fk_cost_center` FOREIGN KEY (`cost_center_id`) REFERENCES `zero_based_cost_centers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_requester_collaborator` FOREIGN KEY (`requester_id`) REFERENCES `collaborators` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Aprovações de Gastos
CREATE TABLE IF NOT EXISTS `zero_based_expense_approvals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_request_id` int(11) NOT NULL,
  `approver_id` int(11) NOT NULL,
  `status` enum('Pendente','Aprovado','Rejeitado') NOT NULL DEFAULT 'Pendente',
  `comment` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_expense_request` (`expense_request_id`),
  KEY `idx_approver` (`approver_id`),
  CONSTRAINT `fk_expense_request` FOREIGN KEY (`expense_request_id`) REFERENCES `zero_based_expense_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_approver_collaborator` FOREIGN KEY (`approver_id`) REFERENCES `collaborators` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir dados iniciais (opcional - exemplo)
INSERT INTO `zero_based_cost_centers` (`name`, `responsible_id`, `description`, `created_at`, `updated_at`)
VALUES
  ('TECNOLOGIA DA INFORMAÇÃO', 1, 'Centro de custo para despesas relacionadas à área de TI', NOW(), NOW()),
  ('RECURSOS HUMANOS', 2, 'Centro de custo para despesas relacionadas à área de RH', NOW(), NOW()),
  ('COMERCIAL', 3, 'Centro de custo para despesas relacionadas à área Comercial', NOW(), NOW()); 


  CREATE TABLE zero_based_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir categorias iniciais
INSERT INTO zero_based_categories (name, description) VALUES 
('Material de Escritório', 'Itens para uso no escritório como papel, canetas, etc.'),
('Equipamento', 'Computadores, notebooks, monitores e outros equipamentos'),
('Software', 'Licenças de software, serviços de nuvem e assinaturas digitais'),
('Serviço', 'Contratação de serviços externos'),
('Viagem', 'Despesas com viagens a negócio'),
('Treinamento', 'Cursos, workshops e certificações'),
('Marketing', 'Campanhas publicitárias e materiais promocionais'),
('Outro', 'Outros gastos que não se encaixam nas categorias anteriores');