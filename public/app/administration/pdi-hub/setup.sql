-- -------------------------------------------------------------------------
-- PDI Hub - Script para criação das tabelas
-- -------------------------------------------------------------------------

-- Tabela de planos de PDI
CREATE TABLE IF NOT EXISTS `pdi_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `collaborator_id` int(11) NOT NULL,
  `supervisor_id` int(11) NOT NULL,
  `academic_summary` text,
  `who_are_you` text,
  `strengths` text,
  `improvement_points` text,
  `development_goals` text,
  `profile_type` varchar(50) DEFAULT NULL,
  `status` enum('Ativo','Concluído','Cancelado') NOT NULL DEFAULT 'Ativo',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pdi_collaborator` (`collaborator_id`),
  KEY `fk_pdi_supervisor` (`supervisor_id`),
  CONSTRAINT `fk_pdi_collaborator` FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pdi_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `collaborators` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabela de ações do PDI
CREATE TABLE IF NOT EXISTS `pdi_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pdi_id` int(11) NOT NULL,
  `description` text NOT NULL,
  `deadline` date DEFAULT NULL,
  `status` enum('Pendente','Em Andamento','Concluído') NOT NULL DEFAULT 'Pendente',
  `completion_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_action_pdi` (`pdi_id`),
  CONSTRAINT `fk_action_pdi` FOREIGN KEY (`pdi_id`) REFERENCES `pdi_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabela de avaliações mensais do gestor
CREATE TABLE IF NOT EXISTS `pdi_monthly_evaluations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pdi_id` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `attendance` tinyint(1) DEFAULT NULL,
  `punctuality` tinyint(1) DEFAULT NULL,
  `teamwork` tinyint(1) DEFAULT NULL,
  `creativity` tinyint(1) DEFAULT NULL,
  `productivity` tinyint(1) DEFAULT NULL,
  `problem_solving` tinyint(1) DEFAULT NULL,
  `comments` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pdi_month_year` (`pdi_id`, `month`, `year`),
  KEY `fk_evaluation_pdi` (`pdi_id`),
  CONSTRAINT `fk_evaluation_pdi` FOREIGN KEY (`pdi_id`) REFERENCES `pdi_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci; 