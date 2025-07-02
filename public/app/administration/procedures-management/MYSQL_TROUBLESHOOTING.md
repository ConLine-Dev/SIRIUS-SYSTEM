# Guia de Troubleshooting - Conexão Perdida MySQL

## 🚨 Problema: "Lost connection to MySQL server during query"

### Causa
Você configurou o `max_allowed_packet` no **servidor**, mas o **cliente** ainda está usando o limite padrão (16MB). Quando a query retorna dados grandes, o cliente não consegue receber e a conexão é perdida.

## ✅ Soluções Imediatas

### 1. Configurar Cliente MySQL Workbench/Terminal

**No MySQL Workbench:**
```sql
-- Execute antes de qualquer query grande
SET SESSION max_allowed_packet = 134217728;

-- Ou configure nas preferências:
-- Edit > Preferences > SQL Editor > MySQL Session > INIT_COMMAND
-- Adicione: SET SESSION max_allowed_packet = 134217728;
```

**No Terminal MySQL:**
```bash
# Conectar com limite aumentado
mysql --max_allowed_packet=128M -u username -p

# Ou dentro da sessão:
mysql> SET SESSION max_allowed_packet = 134217728;
```

### 2. Query Segura para Verificar Tamanhos

**Query otimizada que não retorna conteúdo grande:**
```sql
-- Verificar configurações atuais
SHOW VARIABLES LIKE 'max_allowed_packet';
SHOW SESSION VARIABLES LIKE 'max_allowed_packet';

-- Verificar tamanhos sem retornar conteúdo
SELECT 
    p.id,
    p.title,
    v.version_number,
    LENGTH(v.content) as content_size_bytes,
    ROUND(LENGTH(v.content) / 1024 / 1024, 2) as content_size_mb,
    CASE 
        WHEN v.content LIKE '%data:image%' THEN 'SIM'
        ELSE 'NÃO'
    END as has_base64_images,
    v.created_at
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE LENGTH(v.content) > 1048576  -- Maior que 1MB
ORDER BY content_size_bytes DESC
LIMIT 20;
```

### 3. Verificar Acesso à Tabela proc_main

```sql
-- Teste básico de acesso
SELECT COUNT(*) FROM proc_main;

-- Se funcionar, teste com mais dados
SELECT id, title, created_at, updated_at 
FROM proc_main 
ORDER BY updated_at DESC 
LIMIT 10;

-- Verificar se há procedimentos com summary muito grande
SELECT 
    id, 
    title,
    LENGTH(summary) as summary_size,
    SUBSTRING(summary, 1, 100) as summary_preview
FROM proc_main 
WHERE LENGTH(summary) > 1000
ORDER BY summary_size DESC;
```

## 🔧 Configurações Persistentes

### 1. Arquivo de Configuração MySQL (.my.cnf)

**Criar/editar arquivo na home do usuário:**
```bash
# Linux/Mac
nano ~/.my.cnf

# Windows
# Criar arquivo C:\Users\[username]\.my.cnf
```

**Conteúdo do arquivo:**
```ini
[mysql]
max_allowed_packet = 128M

[mysqldump]
max_allowed_packet = 128M

[client]
max_allowed_packet = 128M
```

### 2. Verificar se Configuração Persiste

```sql
-- Verificar configurações globais
SHOW GLOBAL VARIABLES LIKE 'max_allowed_packet';

-- Verificar configurações da sessão
SHOW SESSION VARIABLES LIKE 'max_allowed_packet';

-- Se diferentes, configurar sessão:
SET SESSION max_allowed_packet = 134217728;
```

## 📊 Queries de Diagnóstico Seguras

### 1. Identificar Procedimentos Problemáticos

```sql
-- Top 10 maiores procedimentos (sem retornar conteúdo)
SELECT 
    p.id,
    p.title,
    MAX(LENGTH(v.content)) as max_content_size,
    ROUND(MAX(LENGTH(v.content)) / 1024 / 1024, 2) as max_size_mb,
    COUNT(v.id) as total_versions
FROM proc_main p
LEFT JOIN proc_versions v ON p.id = v.procedure_id
GROUP BY p.id, p.title
HAVING max_content_size > 0
ORDER BY max_content_size DESC
LIMIT 10;
```

### 2. Verificar Integridade dos Dados

```sql
-- Verificar versões com conteúdo nulo ou inválido
SELECT 
    p.id,
    p.title,
    v.version_number,
    CASE 
        WHEN v.content IS NULL THEN 'NULL'
        WHEN v.content = '' THEN 'EMPTY'
        WHEN JSON_VALID(v.content) = 1 THEN 'VALID JSON'
        ELSE 'INVALID JSON'
    END as content_status,
    LENGTH(v.content) as content_size
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.content IS NULL 
   OR v.content = ''
   OR JSON_VALID(v.content) = 0
ORDER BY p.id, v.version_number;
```

### 3. Estatísticas Gerais

```sql
-- Estatísticas dos procedimentos
SELECT 
    COUNT(DISTINCT p.id) as total_procedures,
    COUNT(v.id) as total_versions,
    ROUND(AVG(LENGTH(v.content)) / 1024, 2) as avg_size_kb,
    ROUND(MAX(LENGTH(v.content)) / 1024 / 1024, 2) as max_size_mb,
    SUM(CASE WHEN LENGTH(v.content) > 5242880 THEN 1 ELSE 0 END) as large_versions_5mb,
    SUM(CASE WHEN LENGTH(v.content) > 10485760 THEN 1 ELSE 0 END) as large_versions_10mb
FROM proc_main p
LEFT JOIN proc_versions v ON p.id = v.procedure_id;
```

## 🛠️ Soluções para Aplicação Node.js

### Configurar Conexão MySQL na Aplicação

```javascript
// No arquivo de conexão MySQL
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'username',
    password: 'password',
    database: 'database_name',
    acquireTimeout: 60000,
    timeout: 60000,
    // Configurações críticas para conteúdos grandes
    maxAllowedPacket: 134217728, // 128MB
    connectTimeout: 60000,
    maxIdle: 10,
    // Configurações adicionais
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true
});

// Configurar na primeira conexão
connection.query('SET SESSION max_allowed_packet = 134217728', (err) => {
    if (err) console.error('Erro ao configurar max_allowed_packet:', err);
    else console.log('max_allowed_packet configurado com sucesso');
});
```

## 🔍 Comandos de Verificação Rápida

```bash
# Verificar se MySQL está funcionando
mysql -e "SELECT 'MySQL OK' as status;"

# Verificar configurações sem conectar ao banco
mysql --help | grep max_allowed_packet

# Verificar logs de erro do MySQL
tail -f /var/log/mysql/error.log

# No Windows, verificar Event Viewer ou logs do XAMPP/WAMP
```

## ⚠️ Próximos Passos

1. **Execute primeiro:** `SET SESSION max_allowed_packet = 134217728;`
2. **Teste acesso:** `SELECT COUNT(*) FROM proc_main;`
3. **Use queries seguras** fornecidas acima
4. **Configure .my.cnf** para tornar permanente
5. **Teste salvamento** de procedimento com imagem pequena

## 🆘 Se Ainda Houver Problemas

```sql
-- Restart do MySQL (se tiver permissão)
-- Linux: sudo systemctl restart mysql
-- Windows: restart do serviço MySQL

-- Verificar se há procedimentos corrompidos
SELECT p.id, p.title 
FROM proc_main p
LEFT JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.id IS NULL;

-- Limpar cache de query (se necessário)
RESET QUERY CACHE;
``` 