-- Arquivo SQL para a segunda fase de atualizações do Módulo de Gestão de Procedimentos
-- Foco: Melhorar a integridade referencial do autor de cada versão.

-- 4. Altera a tabela 'proc_versions' para usar 'author_id' em vez de um nome de autor em texto.
-- Esta é uma melhor prática para manter a integridade referencial dos dados.

-- Primeiro, renomeamos a coluna antiga para não perder os dados. Pode ser útil para uma migração manual.
ALTER TABLE `proc_versions`
CHANGE COLUMN `author` `author_old_text` VARCHAR(150);

-- Em seguida, adicionamos a nova coluna para a chave estrangeira do autor.
ALTER TABLE `proc_versions`
ADD COLUMN `author_id` INT NULL AFTER `version_number`;

-- Adicionamos um índice para a nova coluna para otimizar as consultas.
ALTER TABLE `proc_versions`
ADD INDEX `idx_author_id` (`author_id`);

-- Adicionamos a restrição de chave estrangeira, ligando à tabela 'collaborators'.
-- ON DELETE SET NULL fará com que o autor da versão seja nulo se o colaborador for excluído do sistema.
ALTER TABLE `proc_versions`
ADD CONSTRAINT `fk_proc_versions_author`
  FOREIGN KEY (`author_id`)
  REFERENCES `collaborators`(`id`)
  ON DELETE SET NULL;

-- OBSERVAÇÃO:
-- Este script não migra os dados do autor. Seria necessário um script de migração para mapear
-- os nomes de 'author_old_text' para os IDs correspondentes em 'collaborators'
-- e preencher a nova coluna 'author_id' para os registros existentes. 