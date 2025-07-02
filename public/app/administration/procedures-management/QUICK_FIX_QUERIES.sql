-- ===============================
-- QUICK FIX - Resolver Conexão Perdida MySQL
-- ===============================

-- 1. PRIMEIRO: Configure sua sessão atual
SET SESSION max_allowed_packet = 134217728;
SET SESSION wait_timeout = 3600;
SET SESSION interactive_timeout = 3600;

-- 2. Verificar configurações atuais
SELECT 
    'GLOBAL' as scope,
    variable_name,
    variable_value,
    ROUND(variable_value / 1024 / 1024, 2) as value_mb
FROM performance_schema.global_variables 
WHERE variable_name IN ('max_allowed_packet', 'wait_timeout', 'interactive_timeout')
UNION ALL
SELECT 
    'SESSION' as scope,
    variable_name,
    variable_value,
    ROUND(variable_value / 1024 / 1024, 2) as value_mb
FROM performance_schema.session_variables 
WHERE variable_name IN ('max_allowed_packet', 'wait_timeout', 'interactive_timeout');

-- 3. TESTE BÁSICO: Verificar acesso às tabelas
SELECT 'proc_main' as tabela, COUNT(*) as total FROM proc_main
UNION ALL
SELECT 'proc_versions' as tabela, COUNT(*) as total FROM proc_versions
UNION ALL
SELECT 'proc_attachments' as tabela, COUNT(*) as total FROM proc_attachments;

-- 4. DIAGNÓSTICO SEGURO: Verificar tamanhos sem retornar conteúdo
SELECT 
    p.id,
    p.title,
    COUNT(v.id) as total_versions,
    MAX(LENGTH(v.content)) as max_content_size,
    ROUND(MAX(LENGTH(v.content)) / 1024 / 1024, 2) as max_size_mb,
    ROUND(AVG(LENGTH(v.content)) / 1024, 2) as avg_size_kb,
    MAX(v.created_at) as latest_version_date
FROM proc_main p
LEFT JOIN proc_versions v ON p.id = v.procedure_id
GROUP BY p.id, p.title
HAVING max_content_size > 0
ORDER BY max_content_size DESC
LIMIT 10;

-- 5. IDENTIFICAR PROCEDIMENTOS COM IMAGENS BASE64 (sem retornar o conteúdo)
SELECT 
    p.id,
    p.title,
    v.version_number,
    LENGTH(v.content) as content_size_bytes,
    ROUND(LENGTH(v.content) / 1024 / 1024, 2) as content_size_mb,
    CASE 
        WHEN v.content LIKE '%data:image/jpeg%' THEN 'JPEG'
        WHEN v.content LIKE '%data:image/png%' THEN 'PNG'
        WHEN v.content LIKE '%data:image/gif%' THEN 'GIF'
        WHEN v.content LIKE '%data:image%' THEN 'OUTRAS'
        ELSE 'SEM IMAGENS'
    END as image_type,
    v.created_at
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE LENGTH(v.content) > 1048576  -- Maior que 1MB
ORDER BY content_size_bytes DESC
LIMIT 20;

-- 6. ESTATÍSTICAS GERAIS DO SISTEMA
SELECT 
    'Procedimentos Totais' as metrica,
    COUNT(DISTINCT p.id) as valor
FROM proc_main p
UNION ALL
SELECT 
    'Versões Totais' as metrica,
    COUNT(*) as valor
FROM proc_versions
UNION ALL
SELECT 
    'Procedimentos com Conteúdo > 1MB' as metrica,
    COUNT(DISTINCT p.id) as valor
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE LENGTH(v.content) > 1048576
UNION ALL
SELECT 
    'Procedimentos com Conteúdo > 5MB' as metrica,
    COUNT(DISTINCT p.id) as valor
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE LENGTH(v.content) > 5242880
UNION ALL
SELECT 
    'Procedimentos com Imagens Base64' as metrica,
    COUNT(DISTINCT p.id) as valor
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.content LIKE '%data:image%';

-- 7. VERIFICAR INTEGRIDADE DOS DADOS
SELECT 
    'Procedimentos sem versões' as problema,
    COUNT(*) as quantidade
FROM proc_main p
LEFT JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.id IS NULL
UNION ALL
SELECT 
    'Versões com conteúdo NULL' as problema,
    COUNT(*) as quantidade
FROM proc_versions
WHERE content IS NULL
UNION ALL
SELECT 
    'Versões com JSON inválido' as problema,
    COUNT(*) as quantidade
FROM proc_versions
WHERE content IS NOT NULL 
  AND content != ''
  AND JSON_VALID(content) = 0;

-- 8. PROCEDIMENTOS MAIS RECENTES (teste de acesso)
SELECT 
    id,
    title,
    created_at,
    updated_at,
    CASE 
        WHEN deleted_at IS NULL THEN 'ATIVO'
        ELSE 'EXCLUÍDO'
    END as status
FROM proc_main 
ORDER BY updated_at DESC 
LIMIT 5;

-- 9. SE TUDO FUNCIONOU ATÉ AQUI: Verificar um procedimento específico
-- (Substitua 1 pelo ID de um procedimento que você sabe que existe)
SELECT 
    p.id,
    p.title,
    v.version_number,
    LENGTH(v.content) as content_size,
    SUBSTRING(v.content, 1, 200) as content_preview,
    v.created_at
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE p.id = 1  -- SUBSTITUA pelo ID real
ORDER BY v.version_number DESC
LIMIT 1;

-- 10. LIMPEZA (se necessário) - CUIDADO: Execute apenas se solicitado
-- UNCOMMMENT apenas se você quiser limpar procedimentos problemáticos
/*
-- Deletar versões com JSON inválido (CUIDADO!)
DELETE FROM proc_versions 
WHERE content IS NOT NULL 
  AND content != ''
  AND JSON_VALID(content) = 0;

-- Deletar procedimentos órfãos (sem versões) (CUIDADO!)
DELETE p FROM proc_main p
LEFT JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.id IS NULL;
*/

-- ===============================
-- CONFIGURAÇÕES PERMANENTES (Execute se possível)
-- ===============================

-- Configurar globalmente (se tiver permissão)
-- SET GLOBAL max_allowed_packet = 134217728;
-- SET GLOBAL wait_timeout = 3600;
-- SET GLOBAL interactive_timeout = 3600;

-- ===============================
-- VERIFICAÇÃO FINAL
-- ===============================
SELECT 
    'Configuração atual' as status,
    @@SESSION.max_allowed_packet as session_max_packet,
    @@GLOBAL.max_allowed_packet as global_max_packet,
    CASE 
        WHEN @@SESSION.max_allowed_packet >= 134217728 THEN '✅ OK'
        ELSE '❌ MUITO BAIXO'
    END as session_status,
    CASE 
        WHEN @@GLOBAL.max_allowed_packet >= 134217728 THEN '✅ OK'
        ELSE '❌ MUITO BAIXO'
    END as global_status; 