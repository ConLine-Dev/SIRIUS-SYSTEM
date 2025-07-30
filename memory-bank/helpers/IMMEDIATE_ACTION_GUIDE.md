# 🚨 Guia de Ação Imediata - Problemas Identificados

## 📊 **PROBLEMAS CRÍTICOS DETECTADOS**

### 1. **Transação Extremamente Longa**
- **ID**: 23689813
- **Duração**: 4415+ segundos (mais de 1 hora!)
- **Status**: Rodando
- **Risco**: Bloqueando outras operações

### 2. **Processos de Criação de Índices Travados**
- **IDs**: 156606, 156644
- **Estado**: "Waiting for table metadata lock"
- **Operação**: `CREATE INDEX idx_proc_main_department ON proc_main(department_id)`
- **Duração**: 150+ segundos
- **Problema**: Causando metadata locks

### 3. **Processo do Sistema Travado**
- **ID**: 5
- **Estado**: "Waiting on empty queue"
- **Duração**: 7321536+ segundos (muito tempo!)
- **Risco**: Pode indicar problema no sistema

## ⚡ **AÇÕES IMEDIATAS NECESSÁRIAS**

### **PASSO 1: Matar Processos Problemáticos**

```sql
-- 1. Matar a transação longa (CRÍTICO)
KILL 23689813;

-- 2. Matar processos de criação de índices (se não forem críticos)
KILL 156606;
KILL 156644;

-- 3. Verificar se o processo do sistema pode ser morto
-- ATENÇÃO: Processo ID 5 pode ser crítico do sistema
-- KILL 5; -- Só execute se tiver certeza
```

### **PASSO 2: Verificar e Limpar Metadata Locks**

```sql
-- Verificar metadata locks ativos
SELECT 
    id,
    user,
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
```

### **PASSO 3: Aplicar Configurações de Emergência**

```sql
-- Aumentar timeouts temporariamente
SET GLOBAL innodb_lock_wait_timeout = 60;
SET GLOBAL lock_wait_timeout = 60;
SET GLOBAL wait_timeout = 7200;
SET GLOBAL interactive_timeout = 7200;
```

### **PASSO 4: Verificar Saúde do Sistema**

```sql
-- Verificar transações ativas restantes
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

-- Verificar processos ativos
SELECT 
    id,
    user,
    command,
    time,
    state,
    info
FROM information_schema.processlist
WHERE command != 'Sleep'
AND time > 30
ORDER BY time DESC;
```

## 🔧 **CORREÇÕES ESPECÍFICAS**

### **1. Resolver Problema dos Índices**

O problema principal é que há tentativas de criar o mesmo índice simultaneamente:

```sql
-- Verificar se o índice já existe
SHOW INDEX FROM proc_main WHERE Key_name = 'idx_proc_main_department';

-- Se não existir, criar apenas um por vez
CREATE INDEX idx_proc_main_department ON proc_main(department_id);
```

### **2. Otimizar Criação de Índices**

```sql
-- Criar índices em modo online (se suportado)
ALTER TABLE proc_main ADD INDEX idx_proc_main_department (department_id) ALGORITHM=INPLACE;

-- Ou criar em horário de baixo uso
-- Agendar para execução noturna
```

### **3. Implementar Controle de Concorrência**

```javascript
// No código da aplicação - evitar múltiplas criações simultâneas
const createIndexSafely = async (tableName, indexName, columns) => {
    const lockKey = `index_creation_${tableName}_${indexName}`;
    
    // Verificar se já está sendo criado
    if (global[lockKey]) {
        console.log(`Índice ${indexName} já está sendo criado`);
        return;
    }
    
    global[lockKey] = true;
    
    try {
        await executeQuery(`CREATE INDEX ${indexName} ON ${tableName} (${columns})`);
        console.log(`Índice ${indexName} criado com sucesso`);
    } catch (error) {
        console.error(`Erro ao criar índice ${indexName}:`, error);
    } finally {
        global[lockKey] = false;
    }
};
```

## 📋 **CHECKLIST DE AÇÃO IMEDIATA**

### **✅ Ações Críticas (Execute Agora)**

- [ ] **Matar transação longa** (ID: 23689813)
- [ ] **Matar processos de índice** (IDs: 156606, 156644)
- [ ] **Aplicar configurações de emergência**
- [ ] **Verificar se problemas foram resolvidos**

### **✅ Ações de Prevenção (Execute em Seguida)**

- [ ] **Implementar monitoramento contínuo**
- [ ] **Configurar alertas automáticos**
- [ ] **Otimizar criação de índices**
- [ ] **Implementar timeouts adequados**

### **✅ Ações de Longo Prazo**

- [ ] **Revisar código de transações**
- [ ] **Implementar retry logic**
- [ ] **Configurar backup automático**
- [ ] **Documentar procedimentos de emergência**

## 🚨 **ALERTAS IMPORTANTES**

### **⚠️ Antes de Matar Processos**

1. **Faça backup** do banco de dados
2. **Verifique** se os processos não são críticos
3. **Teste** em ambiente de desenvolvimento primeiro
4. **Monitore** o sistema após as ações

### **⚠️ Processos do Sistema**

- **ID 5**: Pode ser um processo crítico do MySQL
- **Não mate** sem verificar o que é
- **Consulte** logs do MySQL para entender

### **⚠️ Metadata Locks**

- **Causa comum**: Múltiplas tentativas de criar o mesmo índice
- **Solução**: Implementar controle de concorrência
- **Prevenção**: Verificar se índice já existe antes de criar

## 📊 **MONITORAMENTO PÓS-AÇÃO**

### **Queries de Verificação**

```sql
-- Verificar se problemas foram resolvidos
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
```

### **Script de Monitoramento Contínuo**

```bash
# Execute o monitoramento atualizado
node LOCK_MONITORING.js
```

## 🔄 **PROCEDIMENTO DE RECUPERAÇÃO**

### **Se Algo Der Errado**

1. **Restaure** o backup mais recente
2. **Verifique** logs do MySQL
3. **Analise** o que causou o problema
4. **Implemente** correções preventivas

### **Contatos de Emergência**

- **DBA**: [Contato do DBA]
- **Desenvolvedor**: [Seu contato]
- **Suporte MySQL**: [Contato do suporte]

---

**⚠️ IMPORTANTE**: Execute estas ações com cuidado e sempre monitore o sistema após cada mudança. Em caso de dúvida, consulte um DBA experiente. 