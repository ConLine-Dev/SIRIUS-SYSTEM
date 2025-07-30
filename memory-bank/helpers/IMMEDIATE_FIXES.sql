-- ===============================
-- CORREÇÕES IMEDIATAS PARA PROBLEMAS IDENTIFICADOS
-- ===============================

-- 1. MATAR PROCESSOS PROBLEMÁTICOS
-- ===============================

-- Matar transação longa identificada (ID: 23689813)
-- ATENÇÃO: Execute apenas se tiver certeza de que pode matar esta transação
-- KILL 23689813;

-- Matar processos que estão criando índices e causando metadata locks
-- ATENÇÃO: Execute apenas se os índices não forem críticos
-- KILL 156606;
-- KILL 156644;

-- 2. VERIFICAR E RESOLVER METADATA LOCKS
-- ===============================

-- Verificar processos que estão esperando metadata lock
SELECT 
    id,
    user,
    host,
    db,
    command,
    time,
    state,
    info
FROM information_schema.processlist
WHERE state LIKE '%metadata%'
ORDER BY time DESC;

-- Verificar se há DDL em andamento
SELECT 
    id,
    user,
    command,
    time,
    state,
    info
FROM information_schema.processlist
WHERE info LIKE '%CREATE INDEX%'
   OR info LIKE '%ALTER TABLE%'
   OR info LIKE '%DROP INDEX%'
ORDER BY time DESC;

-- 3. VERIFICAR TRANSAÇÕES ATIVAS
-- ===============================

-- Listar todas as transações ativas
SELECT 
    trx_id, 
    trx_state, 
    trx_started, 
    trx_mysql_thread_id,
    trx_query,
    TIMESTAMPDIFF(SECOND, trx_started, NOW()) as duration_seconds
FROM information_schema.innodb_trx
WHERE trx_state = 'RUNNING'
ORDER BY trx_started ASC;

-- 4. VERIFICAR CONFIGURAÇÕES ATUAIS
-- ===============================

-- Verificar timeouts atuais
SHOW VARIABLES LIKE '%timeout%';
SHOW VARIABLES LIKE '%lock%';

-- Verificar configurações de conexão
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';

-- 5. APLICAR CONFIGURAÇÕES DE EMERGÊNCIA
-- ===============================

-- Aumentar timeouts temporariamente (se necessário)
-- SET GLOBAL innodb_lock_wait_timeout = 60;
-- SET GLOBAL lock_wait_timeout = 60;

-- 6. VERIFICAR ÍNDICES EM ANDAMENTO
-- ===============================

-- Verificar se há criação de índices em andamento
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'proc_main'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 7. SCRIPT DE LIMPEZA SEGURA
-- ===============================

-- Função para matar processos de forma segura
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS KillLongRunningProcesses()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE process_id INT;
    DECLARE process_time INT;
    DECLARE process_state VARCHAR(100);
    DECLARE process_info TEXT;
    
    DECLARE process_cursor CURSOR FOR
        SELECT id, time, state, info
        FROM information_schema.processlist
        WHERE command != 'Sleep'
        AND time > 300  -- Mais de 5 minutos
        AND user != 'system user'  -- Não matar processos do sistema
        AND id != CONNECTION_ID();  -- Não matar a própria conexão
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN process_cursor;
    
    read_loop: LOOP
        FETCH process_cursor INTO process_id, process_time, process_state, process_info;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Log do processo que será morto
        SELECT CONCAT('Matando processo ', process_id, ' que está rodando há ', process_time, 's') as message;
        
        -- Matar o processo
        SET @kill_sql = CONCAT('KILL ', process_id);
        PREPARE stmt FROM @kill_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        
    END LOOP;
    
    CLOSE process_cursor;
END$$

DELIMITER ;

-- 8. VERIFICAR SAÚDE DO SISTEMA
-- ===============================

-- Verificar uso de memória
SELECT 
    variable_name,
    variable_value
FROM performance_schema.global_status
WHERE variable_name IN (
    'Innodb_buffer_pool_pages_total',
    'Innodb_buffer_pool_pages_free',
    'Innodb_buffer_pool_pages_data',
    'Innodb_buffer_pool_pages_dirty'
);

-- Verificar locks ativos
SELECT 
    object_schema,
    object_name,
    index_name,
    lock_type,
    lock_mode,
    lock_status,
    lock_data
FROM performance_schema.data_locks
ORDER BY object_name;

-- 9. SCRIPT DE RECUPERAÇÃO
-- ===============================

-- Verificar se há tabelas corrompidas
SELECT 
    table_schema,
    table_name,
    table_rows,
    data_length,
    index_length
FROM information_schema.tables
WHERE table_schema = DATABASE()
AND table_name IN (
    'proc_main', 'proc_versions', 'proc_tags', 'proc_procedure_tags', 'proc_attachments',
    'pdi_plans', 'pdi_actions', 'pdi_plan_factors', 'pdi_monthly_evaluations', 'pdi_evaluation_answers',
    'material_control_movements', 'material_control_allocations', 'material_control_materials'
)
ORDER BY table_name;

-- 10. CONFIGURAÇÕES RECOMENDADAS PARA EMERGÊNCIA
-- ===============================

-- Aplicar configurações de emergência (execute apenas se necessário)
/*
SET GLOBAL innodb_lock_wait_timeout = 60;
SET GLOBAL lock_wait_timeout = 60;
SET GLOBAL wait_timeout = 7200;
SET GLOBAL interactive_timeout = 7200;
SET GLOBAL max_connections = 300;
*/

-- 11. MONITORAMENTO CONTÍNUO
-- ===============================

-- Query para monitorar continuamente
SELECT 
    NOW() as timestamp,
    COUNT(*) as active_transactions,
    COUNT(CASE WHEN TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 30 THEN 1 END) as long_transactions,
    COUNT(CASE WHEN TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 300 THEN 1 END) as very_long_transactions
FROM information_schema.innodb_trx
WHERE trx_state = 'RUNNING';

-- 12. SCRIPT DE LIMPEZA AUTOMÁTICA
-- ===============================

-- Evento para limpeza automática (opcional)
/*
CREATE EVENT IF NOT EXISTS cleanup_long_processes
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
    CALL KillLongRunningProcesses();
END;
*/

-- 13. VERIFICAÇÃO FINAL
-- ===============================

-- Verificar se os problemas foram resolvidos
SELECT 
    'Transações Ativas' as metric,
    COUNT(*) as value
FROM information_schema.innodb_trx
WHERE trx_state = 'RUNNING'
UNION ALL
SELECT 
    'Processos Lentos (>60s)' as metric,
    COUNT(*) as value
FROM information_schema.processlist
WHERE command != 'Sleep'
AND time > 60
UNION ALL
SELECT 
    'Metadata Locks' as metric,
    COUNT(*) as value
FROM information_schema.processlist
WHERE state LIKE '%metadata%';

-- ===============================
-- INSTRUÇÕES DE USO
-- ===============================

/*
1. PRIMEIRO: Execute as queries de verificação (1-4)
2. IDENTIFIQUE: Os processos problemáticos
3. DECIDA: Se pode matar os processos (use KILL se necessário)
4. APLIQUE: As configurações de emergência se necessário
5. MONITORE: Use as queries de monitoramento contínuo
6. EXECUTE: O script de limpeza se necessário

⚠️ ATENÇÃO: 
- Sempre faça backup antes de matar processos
- Teste em ambiente de desenvolvimento primeiro
- Monitore o sistema após as mudanças
*/ 