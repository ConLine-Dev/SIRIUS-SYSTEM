-- Script de Diagnóstico para proc_versions
-- Identifica problemas de performance e tamanho de dados

-- 1. Verificar estatísticas da tabela
SELECT 
    table_name,
    table_rows,
    data_length,
    index_length,
    (data_length + index_length) as total_size,
    ROUND((data_length + index_length) / 1024 / 1024, 2) as total_size_mb
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'proc_versions';

-- 2. Verificar distribuição de versões por procedimento
SELECT 
    procedure_id,
    COUNT(*) as version_count,
    MIN(version_number) as first_version,
    MAX(version_number) as latest_version
FROM proc_versions 
GROUP BY procedure_id 
ORDER BY version_count DESC 
LIMIT 10;

-- 3. Identificar registros com conteúdo muito grande
SELECT 
    id,
    procedure_id,
    version_number,
    CHAR_LENGTH(JSON_EXTRACT(content, '$')) as content_size,
    CHAR_LENGTH(change_summary) as summary_size,
    created_at
FROM proc_versions 
WHERE CHAR_LENGTH(JSON_EXTRACT(content, '$')) > 50000 
   OR CHAR_LENGTH(change_summary) > 5000
ORDER BY content_size DESC, summary_size DESC
LIMIT 20;

-- 4. Verificar índices existentes
SELECT 
    index_name,
    column_name,
    seq_in_index,
    collation,
    cardinality
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'proc_versions'
ORDER BY index_name, seq_in_index;

-- 5. Verificar performance de query problemática (simulation)
EXPLAIN SELECT 
    v.id,
    v.procedure_id,
    v.version_number,
    v.author_id,
    v.created_at
FROM proc_versions v
WHERE v.procedure_id = 41
ORDER BY v.version_number DESC
LIMIT 50;

-- 6. Estatísticas de tamanho por campo
SELECT 
    'content' as field_name,
    AVG(CHAR_LENGTH(JSON_EXTRACT(content, '$'))) as avg_size,
    MAX(CHAR_LENGTH(JSON_EXTRACT(content, '$'))) as max_size,
    MIN(CHAR_LENGTH(JSON_EXTRACT(content, '$'))) as min_size
FROM proc_versions
WHERE content IS NOT NULL

UNION ALL

SELECT 
    'change_summary' as field_name,
    AVG(CHAR_LENGTH(change_summary)) as avg_size,
    MAX(CHAR_LENGTH(change_summary)) as max_size,
    MIN(CHAR_LENGTH(change_summary)) as min_size
FROM proc_versions
WHERE change_summary IS NOT NULL;

-- 7. Identificar procedimentos com mais problemas potenciais
SELECT 
    v.procedure_id,
    p.title,
    COUNT(*) as total_versions,
    AVG(CHAR_LENGTH(JSON_EXTRACT(v.content, '$'))) as avg_content_size,
    SUM(CHAR_LENGTH(JSON_EXTRACT(v.content, '$'))) as total_content_size
FROM proc_versions v
LEFT JOIN proc_main p ON v.procedure_id = p.id
WHERE v.content IS NOT NULL
GROUP BY v.procedure_id, p.title
HAVING total_versions > 10 OR avg_content_size > 10000
ORDER BY total_content_size DESC, total_versions DESC
LIMIT 15;

-- 8. Recomendações de otimização baseadas nos dados
SELECT 
    'RECOMENDAÇÕES DE OTIMIZAÇÃO' as info,
    CASE 
        WHEN (SELECT COUNT(*) FROM proc_versions WHERE CHAR_LENGTH(JSON_EXTRACT(content, '$')) > 100000) > 0
        THEN 'CRÍTICO: Encontrados registros com conteúdo > 100KB'
        WHEN (SELECT COUNT(*) FROM proc_versions WHERE CHAR_LENGTH(JSON_EXTRACT(content, '$')) > 50000) > 0
        THEN 'AVISO: Encontrados registros com conteúdo > 50KB'
        ELSE 'OK: Tamanhos de conteúdo dentro do normal'
    END as status_content,
    CASE 
        WHEN (SELECT COUNT(*) FROM proc_versions GROUP BY procedure_id ORDER BY COUNT(*) DESC LIMIT 1) > 100
        THEN 'CRÍTICO: Alguns procedimentos têm mais de 100 versões'
        WHEN (SELECT COUNT(*) FROM proc_versions GROUP BY procedure_id ORDER BY COUNT(*) DESC LIMIT 1) > 50
        THEN 'AVISO: Alguns procedimentos têm mais de 50 versões'
        ELSE 'OK: Número de versões por procedimento normal'
    END as status_versions; 