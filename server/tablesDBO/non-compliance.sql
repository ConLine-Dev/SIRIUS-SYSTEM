-- Tabela: occurrences
-- Armazena informações básicas sobre as ocorrências.

-- Explicação:
-- company_id: Referencia a empresa associada à ocorrência.
-- origin_id: Referencia a origem da ocorrência.
-- type_id: Referencia o tipo da ocorrência.
-- occurrence_date: Data da ocorrência.
-- description: Descrição detalhada da ocorrência.
-- correction: Ações corretivas tomadas imediatamente.
CREATE TABLE `occurrences` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `company_id` INT NOT NULL,
    `origin_id` INT NOT NULL,
    `type_id` INT NOT NULL,
    `occurrence_date` DATE NOT NULL,
    `description` TEXT NOT NULL,
    `correction` TEXT,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`),
    FOREIGN KEY (`origin_id`) REFERENCES `occurrences_origin`(`id`),
    FOREIGN KEY (`type_id`) REFERENCES `occurrences_type`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




-- Tabela: occurrences_type
-- Armazena os tipos de ocorrências.

-- Explicação:
-- name: Nome do tipo de ocorrência.
CREATE TABLE `occurrences_type` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




-- Tabela: occurrences_corrective_actions
-- Armazena as ações corretivas associadas às ocorrências.

-- Explicação:
-- occurrence_id: Referencia a ocorrência associada.
-- action: Descrição da ação corretiva.
-- responsible_id: Referencia o colaborador responsável pela ação.
-- deadline: Prazo para a ação corretiva.
-- status: Status da ação corretiva.
-- evidence: Evidências associadas à ação corretiva.
CREATE TABLE `occurrences_corrective_actions` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `occurrence_id` INT NOT NULL,
    `action` TEXT NOT NULL,
    `responsible_id` INT NOT NULL,
    `deadline` DATE NOT NULL,
    `status` VARCHAR(50),
    `evidence` TEXT,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`occurrence_id`) REFERENCES `occurrences`(`id`),
    FOREIGN KEY (`responsible_id`) REFERENCES `collaborators`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




-- Tabela: occurrences_effectiveness_evaluation
-- Armazena as avaliações de eficácia após as ações corretivas.

-- Explicação:
-- occurrence_id: Referencia a ocorrência associada.
-- action: Descrição da ação avaliada.
-- responsible_id: Referencia o colaborador responsável pela avaliação.
-- expected_deadline: Prazo esperado para a eficácia.
-- evidence: Evidências associadas à avaliação.
CREATE TABLE `occurrences_effectiveness_evaluation` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `occurrence_id` INT NOT NULL,
    `action` TEXT NOT NULL,
    `responsible_id` INT NOT NULL,
    `expected_deadline` DATE NOT NULL,
    `evidence` TEXT,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`occurrence_id`) REFERENCES `occurrences`(`id`),
    FOREIGN KEY (`responsible_id`) REFERENCES `collaborators`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




-- Tabela: occurrences_ishikawa_analysis
-- Armazena as análises de causa (método Ishikawa) associadas às ocorrências.

-- Explicação:
-- occurrence_id: Referencia a ocorrência associada.
-- manpower: Análise relacionada à mão de obra.
-- method: Análise relacionada ao método.
-- material: Análise relacionada ao material.
-- environment: Análise relacionada ao meio ambiente.
-- machine: Análise relacionada à máquina.
-- root_cause: Descrição da causa raiz identificada.
CREATE TABLE `occurrences_ishikawa_analysis` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `occurrence_id` INT NOT NULL,
    `manpower` TEXT,
    `method` TEXT,
    `material` TEXT,
    `environment` TEXT,
    `machine` TEXT,
    `root_cause` TEXT,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`occurrence_id`) REFERENCES `occurrences`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabela: occurrences_responsibles
-- Armazena a relação entre os colaboradores responsáveis e as ocorrências.

-- Explicação:
-- occurrence_id: Referencia a ocorrência.
-- collaborator_id: Referencia o colaborador responsável pela ocorrência.
-- A chave primária composta (occurrence_id, collaborator_id) garante que cada 
-- combinação de ocorrência e colaborador seja única.
CREATE TABLE `occurrences_responsibles` (
    `occurrence_id` INT NOT NULL,
    `collaborator_id` INT NOT NULL,
    PRIMARY KEY (`occurrence_id`, `collaborator_id`),
    FOREIGN KEY (`occurrence_id`) REFERENCES `occurrences`(`id`),
    FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




