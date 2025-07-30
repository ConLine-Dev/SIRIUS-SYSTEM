# 🔧 Guia de Troubleshooting: Lock Wait Timeout Exceeded

## 🚨 **DIAGNÓSTICO RÁPIDO**

### 1. **Verificar se o problema está ativo**

```sql
-- Verificar locks em espera
SELECT 
    r.trx_id waiting_trx_id,
    r.trx_mysql_thread_id waiting_thread,
    r.trx_query waiting_query,
    b.trx_id blocking_trx_id,
    b.trx_mysql_thread_id blocking_thread,
    b.trx_query blocking_query
FROM information_schema.innodb_lock_waits w
INNER JOIN information_schema.innodb_trx b ON b.trx_id = w.blocking_trx_id
INNER JOIN information_schema.innodb_trx r ON r.trx_id = w.requesting_trx_id;
```

### 2. **Verificar transações ativas**

```sql
-- Verificar transações que podem estar causando locks
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
```

### 3. **Verificar processos lentos**

```sql
-- Verificar processos que podem estar travando
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
WHERE command != 'Sleep'
AND time > 30
ORDER BY time DESC;
```

## ⚡ **SOLUÇÕES IMEDIATAS**

### 1. **Matar Processos Problemáticos**

```sql
-- Listar processos ativos
SHOW PROCESSLIST;

-- Matar processo específico (substitua ID pelo número do processo)
KILL [ID];

-- Matar todos os processos de um usuário específico
SELECT CONCAT('KILL ', id, ';') 
FROM information_schema.processlist 
WHERE user = '[USUARIO]' AND command != 'Sleep';
```

### 2. **Forçar Rollback de Transações**

```sql
-- Verificar transações ativas
SELECT * FROM information_schema.innodb_trx;

-- Forçar rollback (se necessário)
-- ATENÇÃO: Use com cuidado, pode causar perda de dados
```

### 3. **Reiniciar Conexões**

```javascript
// No código da aplicação
const { executeQuery } = require('./server/connect/mysql');

// Forçar nova conexão
try {
    await executeQuery('SELECT 1');
} catch (error) {
    console.error('Erro de conexão:', error);
    // Reconectar automaticamente
}
```

## 🔧 **CORREÇÕES PERMANENTES**

### 1. **Aplicar Índices de Performance**

Execute o script `PERFORMANCE_INDEXES.sql`:

```bash
mysql -u [usuario] -p [database] < PERFORMANCE_INDEXES.sql
```

### 2. **Configurar MySQL Adequadamente**

Adicione ao arquivo `my.cnf`:

```ini
[mysqld]
# Timeouts
innodb_lock_wait_timeout = 30
lock_wait_timeout = 30
wait_timeout = 3600
interactive_timeout = 3600

# Pool de conexões
max_connections = 200
max_connect_errors = 1000000

# InnoDB
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
innodb_log_buffer_size = 64M
innodb_flush_log_at_trx_commit = 2

# Performance
query_cache_size = 128M
query_cache_type = 1
```

### 3. **Otimizar Código da Aplicação**

#### **Problema**: Transações muito longas

```javascript
// ❌ PROBLEMA
await executeQuery('START TRANSACTION');
// Muitas operações...
await executeQuery('COMMIT');

// ✅ SOLUÇÃO
const { executeTransaction } = require('./server/connect/mysql');

await executeTransaction(async (connection) => {
    // Operações da transação
    return result;
}, 30000); // 30 segundos timeout
```

#### **Problema**: Loops com múltiplas queries

```javascript
// ❌ PROBLEMA
for (const item of items) {
    await executeQuery('INSERT INTO table VALUES (?)', [item]);
}

// ✅ SOLUÇÃO
const values = items.map(item => [item]);
await executeQuery('INSERT INTO table VALUES ?', [values]);
```

## 📊 **MONITORAMENTO CONTÍNUO**

### 1. **Script de Monitoramento**

Execute o script `LOCK_MONITORING.js`:

```bash
node LOCK_MONITORING.js
```

### 2. **Alertas Automáticos**

Configure alertas para:

- Transações com mais de 30 segundos
- Locks em espera por mais de 10 segundos
- Processos com mais de 60 segundos

### 3. **Logs de Performance**

```sql
-- Habilitar logs de queries lentas
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL log_queries_not_using_indexes = 'ON';
```

## 🔍 **ANÁLISE DETALHADA**

### 1. **Identificar Queries Problemáticas**

```sql
-- Verificar queries mais lentas
SELECT 
    sql_text, 
    exec_count, 
    avg_timer_wait/1000000000 as avg_time_sec,
    sum_timer_wait/1000000000 as total_time_sec
FROM performance_schema.events_statements_summary_by_digest 
ORDER BY avg_timer_wait DESC 
LIMIT 10;
```

### 2. **Verificar Uso de Índices**

```sql
-- Verificar queries sem índices
SELECT 
    sql_text,
    exec_count,
    no_index_used_count
FROM performance_schema.events_statements_summary_by_digest 
WHERE no_index_used_count > 0
ORDER BY no_index_used_count DESC;
```

### 3. **Analisar Padrões de Lock**

```sql
-- Verificar tabelas mais bloqueadas
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
```

## 🚀 **PREVENÇÃO**

### 1. **Checklist de Prevenção**

- [ ] Aplicar todos os índices de performance
- [ ] Configurar timeouts adequados
- [ ] Implementar monitoramento contínuo
- [ ] Otimizar queries críticas
- [ ] Implementar retry logic
- [ ] Configurar alertas automáticos

### 2. **Boas Práticas**

#### **Transações**
- Mantenha transações curtas
- Use timeouts adequados
- Implemente rollback automático
- Evite operações em loop dentro de transações

#### **Queries**
- Use índices adequados
- Evite SELECT *
- Implemente paginação
- Use LIMIT em queries grandes

#### **Conexões**
- Configure pool adequadamente
- Libere conexões corretamente
- Implemente health checks
- Monitore uso de conexões

### 3. **Configurações Recomendadas**

#### **MySQL**
```ini
innodb_lock_wait_timeout = 30
lock_wait_timeout = 30
max_connections = 200
innodb_buffer_pool_size = 2G
```

#### **Aplicação**
```javascript
// Timeouts
const queryTimeout = 30000; // 30s
const transactionTimeout = 60000; // 60s

// Pool
const connectionLimit = 30;
const acquireTimeout = 60000;
```

## 📞 **SUPORTE**

### **Quando Contatar Suporte**

- Locks persistentes por mais de 5 minutos
- Múltiplos erros de timeout simultâneos
- Degradação significativa de performance
- Falhas em produção

### **Informações para Suporte**

- Logs de erro completos
- Resultado das queries de diagnóstico
- Configurações atuais do MySQL
- Código das transações problemáticas
- Métricas de performance

---

**⚠️ IMPORTANTE**: Sempre teste as soluções em ambiente de desenvolvimento antes de aplicar em produção. 