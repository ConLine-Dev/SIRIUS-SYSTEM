-- Tabela de planos de PDI
CREATE TABLE IF NOT EXISTS `pdi_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `collaborator_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `academic_summary` text,
  `who_are_you` text,
  `strengths` text,
  `improvement_points` text,
  `development_goals` text,
  `profile_type` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Ativo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_collaborator_id` (`collaborator_id`),
  KEY `idx_supervisor_id` (`supervisor_id`),
  CONSTRAINT `fk_pdi_collaborator` FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators` (`id`),
  CONSTRAINT `fk_pdi_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `collaborators` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela de ações do PDI
CREATE TABLE IF NOT EXISTS `pdi_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pdi_id` int NOT NULL,
  `description` text NOT NULL,
  `deadline` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pendente',
  `completion_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pdi_id` (`pdi_id`),
  CONSTRAINT `fk_pdi_actions` FOREIGN KEY (`pdi_id`) REFERENCES `pdi_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 