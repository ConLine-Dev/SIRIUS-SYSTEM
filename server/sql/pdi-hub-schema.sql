-- Tabela de planos de PDI
CREATE TABLE `pdi_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `collaborator_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `academic_summary` text COLLATE utf8mb4_general_ci,
  `who_are_you` text COLLATE utf8mb4_general_ci,
  `strengths` text COLLATE utf8mb4_general_ci,
  `improvement_points` text COLLATE utf8mb4_general_ci,
  `development_goals` text COLLATE utf8mb4_general_ci,
  `profile_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('Ativo','Concluído','Cancelado') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Ativo',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pdi_collaborator` (`collaborator_id`),
  KEY `fk_pdi_supervisor` (`supervisor_id`),
  CONSTRAINT `fk_pdi_collaborator` FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pdi_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `collaborators` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

-- Tabela de ações do PDI
CREATE TABLE `pdi_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pdi_id` int NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `deadline` date DEFAULT NULL,
  `status` enum('Pendente','Em Andamento','Concluído') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Pendente',
  `completion_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_action_pdi` (`pdi_id`),
  CONSTRAINT `fk_action_pdi` FOREIGN KEY (`pdi_id`) REFERENCES `pdi_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci


CREATE TABLE `pdi_monthly_evaluations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pdi_id` int NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `attendance` tinyint(1) DEFAULT NULL,
  `punctuality` tinyint(1) DEFAULT NULL,
  `teamwork` tinyint(1) DEFAULT NULL,
  `creativity` tinyint(1) DEFAULT NULL,
  `productivity` tinyint(1) DEFAULT NULL,
  `problem_solving` tinyint(1) DEFAULT NULL,
  `comments` text COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pdi_month_year` (`pdi_id`,`month`,`year`),
  KEY `fk_evaluation_pdi` (`pdi_id`),
  CONSTRAINT `fk_evaluation_pdi` FOREIGN KEY (`pdi_id`) REFERENCES `pdi_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci