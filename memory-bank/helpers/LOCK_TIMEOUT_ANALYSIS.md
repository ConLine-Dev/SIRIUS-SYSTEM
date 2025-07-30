# 🔍 Análise Completa: Lock Wait Timeout Exceeded

## 🚨 **PROBLEMAS IDENTIFICADOS**

### 1. **Transações Longas sem Timeout**
**Localização**: `server/controllers/procedures-management.js`, `server/controllers/pdi-hub.js`, `server/controllers/material-control.js`

**Problema**: Transações que podem durar muito tempo sem timeout adequado:
- Procedimentos com conteúdo grande (JSON + imagens base64)
- Múltiplas operações em loop dentro de uma transação
- Falta de timeout nas transações

### 2. **Conexões Não Liberadas Adequadamente**
**Localização**: `server/connect/mysql.js`

**Problema**: 
- Conexões podem não ser liberadas em caso de erro
- Pool de conexões pode esgotar
- Falta de tratamento robusto de erros

### 3. **Queries Complexas sem Índices**
**Localização**: Vários controllers

**Problema**:
- Queries com múltiplos JOINs
- Falta de índices em campos frequentemente consultados
- Queries que fazem scan completo de tabelas grandes

### 4. **Operações em Lote sem Otimização**
**Localização**: `server/controllers/procedures-management.js`, `server/controllers/pdi-hub.js`

**Problema**:
- Loops com múltiplas queries dentro de transação
- Inserções individuais em vez de batch
- Falta de commit intermediário para operações longas

## ✅ **SOLUÇÕES IMPLEMENTADAS**

### 1. **Otimização do Pool de Conexões**

```javascript
// server/connect/mysql.js - Melhorias implementadas
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 30,
  // Configurações para evitar timeouts
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: false,
  ssl: false,
  // Timeouts configurados
  acquireTimeout: 60000,
  timeout: 60000,
  connectTimeout: 60000
};
```

### 2. **Configurações de Sessão MySQL**

```javascript
// Configurações aplicadas em cada conexão
connection.query('SET SESSION time_zone = "+00:00"');
connection.query('SET SESSION sql_mode = "NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION"');
connection.query('SET SESSION wait_timeout = 3600, interactive_timeout = 3600');
```

### 3. **Tratamento Robusto de Transações**

```javascript
// Padrão implementado nos controllers
try {
  await executeQuery('START TRANSACTION');
  
  // Operações da transação
  await executeQuery('COMMIT');
  
} catch (error) {
  await executeQuery('ROLLBACK');
  console.error('Erro na transação:', error);
  throw error;
} finally {
  // Garantir que conexão seja liberada
  if (connection) {
    connection.release();
  }
}
```

## 🔧 **CORREÇÕES ESPECÍFICAS NECESSÁRIAS**

### 1. **Procedures Management - Otimização de Transações**

**Problema**: Transações muito longas com conteúdo grande

```javascript
// ❌ PROBLEMA ATUAL
await executeQuery('START TRANSACTION');
// Múltiplas operações com conteúdo grande
await executeQuery('COMMIT');

// ✅ SOLUÇÃO RECOMENDADA
const executeWithTimeout = async (operations, timeoutMs = 30000) => {
  return Promise.race([
    operations(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs)
    )
  ]);
};

await executeWithTimeout(async () => {
  await executeQuery('START TRANSACTION');
  // Operações
  await executeQuery('COMMIT');
});
```

### 2. **PDI Hub - Otimização de Loops**

**Problema**: Loops com múltiplas queries dentro de transação

```javascript
// ❌ PROBLEMA ATUAL
for (const action of form.actions) {
  await executeQuery('INSERT INTO pdi_actions ...');
}

// ✅ SOLUÇÃO RECOMENDADA
const actionValues = form.actions.map(action => 
  [pdiId, action.description, action.deadline, 'Pendente', null, formattedDate, formattedDate]
);

await executeQuery(`
  INSERT INTO pdi_actions 
  (pdi_id, description, deadline, status, completion_date, created_at, updated_at) 
  VALUES ?
`, [actionValues]);
```

### 3. **Material Control - Verificação de Estoque**

**Problema**: Queries de verificação podem travar

```javascript
// ❌ PROBLEMA ATUAL
const stockQuery = `
  SELECT 
    COALESCE(SUM(CASE WHEN movement_type = 'input' THEN quantity ELSE 0 END), 0) as total_input,
    COALESCE(SUM(CASE WHEN movement_type = 'output' THEN quantity ELSE 0 END), 0) as total_output
  FROM material_control_movements
  WHERE material_id = ?
`;

// ✅ SOLUÇÃO RECOMENDADA
// Adicionar índice na tabela
// CREATE INDEX idx_material_movements_material_id ON material_control_movements(material_id);
// CREATE INDEX idx_material_movements_type ON material_control_movements(movement_type, material_id);
```

## 📊 **MONITORAMENTO E DIAGNÓSTICO**

### 1. **Queries de Diagnóstico**

```sql
-- Verificar transações ativas
SELECT 
  trx_id, 
  trx_state, 
  trx_started, 
  trx_mysql_thread_id,
  trx_query
FROM information_schema.innodb_trx;

-- Verificar locks ativos
SELECT 
  lock_id, 
  lock_trx_id, 
  lock_mode, 
  lock_type, 
  lock_table, 
  lock_index, 
  lock_space, 
  lock_page, 
  lock_rec, 
  lock_data
FROM information_schema.innodb_locks;

-- Verificar processos que estão esperando
SELECT 
  waiting_trx_id, 
  waiting_pid, 
  waiting_query,
  blocking_trx_id, 
  blocking_pid, 
  blocking_query
FROM information_schema.innodb_lock_waits;
```

### 2. **Configurações MySQL Recomendadas**

```ini
[mysqld]
# Timeouts
innodb_lock_wait_timeout = 50
lock_wait_timeout = 50
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

## 🚀 **AÇÕES IMEDIATAS RECOMENDADAS**

### 1. **Aplicar Timeouts nas Transações**
- Implementar timeout de 30 segundos para transações
- Adicionar retry logic para transações que falham
- Implementar rollback automático em caso de timeout

### 2. **Otimizar Queries Críticas**
- Adicionar índices nas tabelas mais consultadas
- Revisar queries com múltiplos JOINs
- Implementar paginação para queries que retornam muitos dados

### 3. **Monitorar Pool de Conexões**
- Implementar alertas quando pool estiver próximo do limite
- Adicionar logs de conexões não liberadas
- Implementar health check do pool

### 4. **Configurar MySQL Adequadamente**
- Aplicar configurações de timeout no servidor MySQL
- Configurar max_allowed_packet adequadamente
- Otimizar configurações do InnoDB

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] Aplicar timeouts nas transações críticas
- [ ] Otimizar queries com múltiplos JOINs
- [ ] Adicionar índices nas tabelas principais
- [ ] Configurar MySQL com timeouts adequados
- [ ] Implementar monitoramento de locks
- [ ] Testar com carga real
- [ ] Documentar procedimentos de troubleshooting

## 🔍 **COMO IDENTIFICAR O PROBLEMA ESPECÍFICO**

### 1. **Verificar Logs do MySQL**
```bash
tail -f /var/log/mysql/error.log | grep -i "lock wait timeout"
```

### 2. **Monitorar Transações Ativas**
```sql
SHOW PROCESSLIST;
SELECT * FROM information_schema.innodb_trx;
```

### 3. **Verificar Configurações Atuais**
```sql
SHOW VARIABLES LIKE '%timeout%';
SHOW VARIABLES LIKE '%lock%';
```

### 4. **Analisar Queries Lentas**
```sql
SELECT 
  sql_text, 
  exec_count, 
  avg_timer_wait/1000000000 as avg_time_sec
FROM performance_schema.events_statements_summary_by_digest 
ORDER BY avg_timer_wait DESC 
LIMIT 10;
```

Este relatório identifica os principais problemas e fornece soluções específicas para resolver o erro "Lock wait timeout exceeded" no projeto. 