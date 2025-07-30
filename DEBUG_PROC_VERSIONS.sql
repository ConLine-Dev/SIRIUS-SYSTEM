-- ===============================
-- DEBUG DA TABELA PROC_VERSIONS
-- ===============================

-- 1. Verificar estrutura da tabela
DESCRIBE proc_versions;

-- 2. Verificar se há dados para o procedimento 83
SELECT 
    id,
    procedure_id,
    version_number,
    author_id,
    LENGTH(content) as content_length,
    LEFT(content, 100) as content_preview,
    change_summary,
    title,
    department_id,
    role,
    type_id,
    responsible_id,
    created_at
FROM proc_versions 
WHERE procedure_id = 83
ORDER BY version_number DESC;

-- 3. Verificar se há dados na tabela proc_main
SELECT 
    id,
    title,
    summary,
    department_id,
    role,
    type_id,
    responsible_id,
    created_at,
    updated_at
FROM proc_main 
WHERE id = 83;

-- 4. Verificar se há versões para outros procedimentos
SELECT 
    procedure_id,
    COUNT(*) as version_count,
    MAX(version_number) as max_version,
    MIN(version_number) as min_version
FROM proc_versions 
GROUP BY procedure_id
ORDER BY procedure_id;

-- 5. Verificar se há problemas com conteúdo NULL
SELECT 
    procedure_id,
    version_number,
    content IS NULL as content_is_null,
    content = '' as content_is_empty,
    LENGTH(content) as content_length
FROM proc_versions 
WHERE content IS NULL OR content = ''
ORDER BY procedure_id, version_number;

-- 6. Verificar estrutura completa da tabela
SHOW CREATE TABLE proc_versions; 