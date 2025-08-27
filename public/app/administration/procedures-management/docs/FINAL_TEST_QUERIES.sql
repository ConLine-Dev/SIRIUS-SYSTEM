-- ===============================
-- TESTE FINAL - Verificar se Problemas foram Resolvidos
-- ===============================

-- 1. TESTE BÁSICO: Verificar se as tabelas respondem
SELECT 
    'TESTE BÁSICO' as status,
    'Tabelas acessíveis' as resultado;

SELECT 'proc_main' as tabela, COUNT(*) as total FROM proc_main
UNION ALL
SELECT 'proc_versions' as tabela, COUNT(*) as total FROM proc_versions
UNION ALL
SELECT 'proc_attachments' as tabela, COUNT(*) as total FROM proc_attachments;

-- 2. VERIFICAR CONFIGURAÇÕES ATUAIS
SELECT 
    'CONFIGURAÇÕES' as status,
    @@GLOBAL.max_allowed_packet as global_max_packet,
    ROUND(@@GLOBAL.max_allowed_packet / 1024 / 1024, 2) as global_mb,
    @@SESSION.wait_timeout as session_wait_timeout,
    @@SESSION.interactive_timeout as session_interactive_timeout;

-- 3. DIAGNÓSTICO SEGURO: Verificar tamanhos dos procedimentos
SELECT 
    'DIAGNÓSTICO TAMANHOS' as status,
    'Procedimentos por tamanho' as resultado;

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

-- 4. VERIFICAR IMAGENS BASE64 (sem retornar conteúdo)
SELECT 
    'ANÁLISE IMAGENS' as status,
    'Procedimentos com imagens base64' as resultado;

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
LIMIT 15;

-- 5. ESTATÍSTICAS COMPLETAS DO SISTEMA
SELECT 
    'ESTATÍSTICAS GERAIS' as status,
    'Resumo do sistema' as resultado;

SELECT 
    'Procedimentos Totais' as metrica,
    COUNT(DISTINCT p.id) as valor,
    'procedimentos' as unidade
FROM proc_main p
UNION ALL
SELECT 
    'Versões Totais' as metrica,
    COUNT(*) as valor,
    'versões' as unidade
FROM proc_versions
UNION ALL
SELECT 
    'Conteúdo > 1MB' as metrica,
    COUNT(DISTINCT p.id) as valor,
    'procedimentos' as unidade
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE LENGTH(v.content) > 1048576
UNION ALL
SELECT 
    'Conteúdo > 5MB' as metrica,
    COUNT(DISTINCT p.id) as valor,
    'procedimentos' as unidade
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE LENGTH(v.content) > 5242880
UNION ALL
SELECT 
    'Conteúdo > 10MB' as metrica,
    COUNT(DISTINCT p.id) as valor,
    'procedimentos' as unidade
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE LENGTH(v.content) > 10485760
UNION ALL
SELECT 
    'Com Imagens Base64' as metrica,
    COUNT(DISTINCT p.id) as valor,
    'procedimentos' as unidade
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.content LIKE '%data:image%';

-- 6. IDENTIFICAR MAIOR PROCEDIMENTO
SELECT 
    'MAIOR PROCEDIMENTO' as status,
    'Identificação do maior conteúdo' as resultado;

SELECT 
    p.id,
    p.title,
    (SELECT MAX(LENGTH(v.content)) 
     FROM proc_versions v 
     WHERE v.procedure_id = p.id) as max_content_size,
    ROUND((SELECT MAX(LENGTH(v.content)) 
           FROM proc_versions v 
           WHERE v.procedure_id = p.id) / 1024 / 1024, 2) as max_content_mb,
    p.updated_at
FROM proc_main p
ORDER BY max_content_size DESC
LIMIT 5;

-- 7. VERIFICAR INTEGRIDADE DOS DADOS
SELECT 
    'VERIFICAÇÃO INTEGRIDADE' as status,
    'Possíveis problemas encontrados' as resultado;

SELECT 
    'Procedimentos sem versões' as problema,
    COUNT(*) as quantidade,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️ ATENÇÃO'
        ELSE '✅ OK'
    END as status_problema
FROM proc_main p
LEFT JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.id IS NULL
UNION ALL
SELECT 
    'Versões com conteúdo NULL' as problema,
    COUNT(*) as quantidade,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️ ATENÇÃO'
        ELSE '✅ OK'
    END as status_problema
FROM proc_versions
WHERE content IS NULL
UNION ALL
SELECT 
    'Versões com JSON inválido' as problema,
    COUNT(*) as quantidade,
    CASE 
        WHEN COUNT(*) > 0 THEN '🚨 CRÍTICO'
        ELSE '✅ OK'
    END as status_problema
FROM proc_versions
WHERE content IS NOT NULL 
  AND content != ''
  AND JSON_VALID(content) = 0;

-- 8. TESTE DE PERFORMANCE: Medir tempo de execução
SELECT 
    'TESTE PERFORMANCE' as status,
    'Medição de velocidade das queries' as resultado,
    NOW() as inicio_teste;

-- Query que exercita o sistema sem retornar dados grandes
SELECT 
    COUNT(*) as total_operacoes,
    SUM(LENGTH(content)) as total_bytes,
    ROUND(SUM(LENGTH(content)) / 1024 / 1024, 2) as total_mb,
    AVG(LENGTH(content)) as avg_bytes,
    ROUND(AVG(LENGTH(content)) / 1024, 2) as avg_kb
FROM proc_versions
WHERE content IS NOT NULL;

SELECT 
    'FIM TESTE PERFORMANCE' as status,
    NOW() as fim_teste;

-- 9. VERIFICAÇÃO FINAL
SELECT 
    '🎯 TESTE CONCLUÍDO' as status,
    CASE 
        WHEN @@GLOBAL.max_allowed_packet >= 134217728 THEN '✅ SISTEMA CONFIGURADO CORRETAMENTE'
        ELSE '❌ NECESSÁRIA CONFIGURAÇÃO ADICIONAL'
    END as resultado_final,
    CONCAT(ROUND(@@GLOBAL.max_allowed_packet / 1024 / 1024, 2), 'MB') as max_packet_atual,
    NOW() as timestamp_teste;

-- 10. PRÓXIMOS PASSOS (informativo)
SELECT 
    'PRÓXIMOS PASSOS' as orientacao,
    'Se todos os testes passaram, o sistema está pronto para:' as acao,
    '1. Salvar procedimentos grandes na aplicação' as passo_1,
    '2. Versionamento funcionará corretamente' as passo_2,
    '3. Logs detalhados estarão disponíveis' as passo_3; 