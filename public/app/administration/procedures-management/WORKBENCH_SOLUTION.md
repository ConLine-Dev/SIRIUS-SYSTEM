# Solução para MySQL Workbench - Procedimentos Grandes

## 🚨 **PROBLEMA IDENTIFICADO**

O `max_allowed_packet` não pode ser configurado por sessão - é **read-only**. O problema está no **cliente** (Workbench) que tem limite próprio, independente do servidor.

## ✅ **SOLUÇÕES PARA WORKBENCH**

### **1. Configurar Preferências do Workbench (PRINCIPAL)**

**Passo a Passo:**
1. Abra o MySQL Workbench
2. Vá em **Edit** → **Preferences** (ou **MySQL Workbench** → **Preferences** no Mac)
3. Na lateral esquerda, clique em **SQL Editor**
4. Procure a seção **"MySQL Session"**
5. No campo **"INIT_COMMAND"**, adicione:
   ```sql
   SET SESSION wait_timeout = 3600, interactive_timeout = 3600;
   ```
6. Clique **OK**
7. **Feche TODAS as conexões/abas abertas**
8. **Reconecte** ao banco

### **2. Configurar Timeout da Conexão**

Na mesma tela de Preferências:
1. Procure **"Timeouts"**
2. Aumente os valores:
   - **DBMS connection read time out**: `600` (10 minutos)
   - **DBMS connection time out**: `60` (1 minuto)

### **3. Teste Passo a Passo**

**Execute na ordem:**

```sql
-- 1. Verificar configuração atual
SELECT 
    @@GLOBAL.max_allowed_packet as global_max_packet,
    ROUND(@@GLOBAL.max_allowed_packet / 1024 / 1024, 2) as global_mb;

-- 2. Se o valor global estiver OK (>=128MB), teste básico
SELECT COUNT(*) FROM proc_main;

-- 3. Se funcionou, teste diagnóstico seguro
SELECT 
    p.id,
    p.title,
    COUNT(v.id) as versions,
    MAX(LENGTH(v.content)) as max_size_bytes,
    ROUND(MAX(LENGTH(v.content)) / 1024 / 1024, 2) as max_size_mb
FROM proc_main p
LEFT JOIN proc_versions v ON p.id = v.procedure_id
GROUP BY p.id, p.title
HAVING max_size_bytes > 0
ORDER BY max_size_bytes DESC
LIMIT 5;
```

## 🛠️ **SOLUÇÕES ALTERNATIVAS**

### **Opção A: Query Limitada**

Se ainda houver problemas, use esta versão que não retorna dados grandes:

```sql
-- Verificar apenas tamanhos (sem retornar conteúdo)
SELECT 
    p.id,
    p.title,
    v.version_number,
    LENGTH(v.content) as content_size_bytes,
    ROUND(LENGTH(v.content) / 1024 / 1024, 2) as content_size_mb,
    LEFT(v.content, 100) as content_preview
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE LENGTH(v.content) > 1048576  -- > 1MB
ORDER BY content_size_bytes DESC
LIMIT 10;
```

### **Opção B: Query em Partes**

Se necessário, dividir a análise:

```sql
-- Passo 1: Identificar IDs dos maiores
SELECT 
    p.id,
    p.title,
    MAX(LENGTH(v.content)) as max_size
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
GROUP BY p.id, p.title
HAVING max_size > 5242880  -- > 5MB
ORDER BY max_size DESC
LIMIT 5;

-- Passo 2: Analisar um específico (substitua ID)
SELECT 
    p.id,
    p.title,
    v.version_number,
    LENGTH(v.content) as size_bytes,
    v.created_at
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE p.id = 1  -- SUBSTITUA pelo ID encontrado
ORDER BY v.version_number DESC;
```

## 📊 **DIAGNÓSTICO ESPECÍFICO**

### **Query Super Segura - Apenas Estatísticas**

```sql
-- Esta query é garantida para não causar timeout
SELECT 
    (SELECT COUNT(*) FROM proc_main) as total_procedures,
    (SELECT COUNT(*) FROM proc_versions) as total_versions,
    (SELECT COUNT(*) FROM proc_versions WHERE LENGTH(content) > 1048576) as versions_over_1mb,
    (SELECT COUNT(*) FROM proc_versions WHERE LENGTH(content) > 5242880) as versions_over_5mb,
    (SELECT COUNT(*) FROM proc_versions WHERE content LIKE '%data:image%') as versions_with_images,
    (SELECT MAX(LENGTH(content)) FROM proc_versions) as max_content_size,
    (SELECT ROUND(MAX(LENGTH(content)) / 1024 / 1024, 2) FROM proc_versions) as max_content_mb;
```

### **Identificar Procedimento Problemático**

```sql
-- Encontrar o procedimento com maior conteúdo
SELECT 
    p.id,
    p.title,
    (SELECT MAX(LENGTH(v.content)) 
     FROM proc_versions v 
     WHERE v.procedure_id = p.id) as max_content_size
FROM proc_main p
ORDER BY max_content_size DESC
LIMIT 1;
```

## 🔧 **SE NADA FUNCIONAR**

### **Abordagem de Emergência**

Se nem as queries básicas funcionarem, pode haver um procedimento com conteúdo **extremamente grande** ou corrompido:

```sql
-- 1. Verificar se há procedimentos órfãos
SELECT COUNT(*) FROM proc_main p
LEFT JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.id IS NULL;

-- 2. Verificar integridade JSON
SELECT COUNT(*) FROM proc_versions 
WHERE content IS NOT NULL 
  AND content != ''
  AND JSON_VALID(content) = 0;

-- 3. Se houver dados corrompidos, listar IDs
SELECT id, procedure_id FROM proc_versions 
WHERE content IS NOT NULL 
  AND content != ''
  AND JSON_VALID(content) = 0
LIMIT 5;
```

## ⚡ **TESTE FINAL**

Após configurar o Workbench, teste na ordem:

1. **Feche todas as abas/conexões**
2. **Reconecte** ao banco
3. Execute: `SELECT @@GLOBAL.max_allowed_packet;`
4. Execute: `SELECT COUNT(*) FROM proc_main;`
5. Execute a query de diagnóstico segura
6. **Se tudo funcionar**, teste a aplicação

## 📝 **LOGS IMPORTANTES**

Monitore os logs da aplicação Node.js após reiniciar:
- Deve aparecer: `✅ max_allowed_packet configurado adequadamente`
- E: `📊 Tabelas verificadas: proc_main: X registros`

Se continuar com problemas, me informe o resultado da query super segura! 