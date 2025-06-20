-- Atualização v6: Otimização de performance para consultas de versões
-- Adiciona índices otimizados para melhorar a performance e evitar erros de memória de ordenação

-- Remover índices existentes se existirem (usando sintaxe compatível)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() 
     AND table_name = 'proc_versions' 
     AND index_name = 'idx_procedure_version_optimized') > 0,
    'DROP INDEX idx_procedure_version_optimized ON proc_versions',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() 
     AND table_name = 'proc_versions' 
     AND index_name = 'idx_author_id') > 0,
    'DROP INDEX idx_author_id ON proc_versions',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() 
     AND table_name = 'proc_versions' 
     AND index_name = 'idx_procedure_author') > 0,
    'DROP INDEX idx_procedure_author ON proc_versions',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar índices otimizados
-- Índice composto otimizado para a consulta de versões por procedure_id ordenado por version_number
-- Este índice permite ao MySQL realizar a ordenação de forma eficiente sem usar memória adicional
CREATE INDEX idx_procedure_version_optimized ON proc_versions (procedure_id, version_number DESC);

-- Índice adicional para author_id para otimizar o JOIN com collaborators
CREATE INDEX idx_author_id ON proc_versions (author_id);

-- Índice composto para consultas que podem filtrar por procedure_id e author_id
CREATE INDEX idx_procedure_author ON proc_versions (procedure_id, author_id);

-- Analisar tabela para otimizar estatísticas do MySQL
ANALYZE TABLE proc_versions;

-- Comentário sobre otimização:
-- - O índice idx_procedure_version_optimized é o mais importante pois permite
--   ao MySQL evitar o uso de filesort ao ordenar por version_number DESC
-- - O uso de LIMIT nas consultas também ajuda a reduzir o uso de memória
-- - A ordenação descendente no índice permite que o MySQL leia os dados
--   já na ordem correta, eliminando a necessidade de ordenação em memória 