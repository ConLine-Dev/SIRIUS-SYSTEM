# Guia de Configuração MySQL para Procedimentos Grandes

## Problema Identificado

O módulo de gestão de procedimentos está enfrentando problemas com conteúdos grandes, especialmente quando contém imagens base64 convertidas pelo editor Quill. O erro mais comum é relacionado ao `max_allowed_packet` do MySQL.

## Configurações Necessárias no MySQL

### 1. Verificar Configuração Atual

```sql
SHOW VARIABLES LIKE 'max_allowed_packet';
```

### 2. Configurar Valores Recomendados

**Para my.cnf ou my.ini:**

```ini
[mysqld]
# Aumentar limite de pacote para 128MB
max_allowed_packet = 128M

# Otimizações adicionais para conteúdos grandes
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
wait_timeout = 3600
interactive_timeout = 3600

# Configurações específicas para JSON
innodb_strict_mode = 0
sql_mode = ""
```

### 3. Configuração por Sessão (Temporária)

```sql
SET GLOBAL max_allowed_packet = 134217728; -- 128MB
SET SESSION max_allowed_packet = 134217728; -- 128MB
```

### 4. Verificação de Limites

```sql
-- Verificar todas as configurações relacionadas
SHOW VARIABLES WHERE Variable_name IN (
    'max_allowed_packet',
    'innodb_buffer_pool_size',
    'wait_timeout',
    'interactive_timeout'
);

-- Verificar tamanho dos procedimentos existentes
SELECT 
    id,
    title,
    LENGTH(JSON_EXTRACT(v.content, '$')) as content_size_bytes,
    ROUND(LENGTH(JSON_EXTRACT(v.content, '$')) / 1024 / 1024, 2) as content_size_mb
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.version_number = (
    SELECT MAX(version_number) 
    FROM proc_versions v2 
    WHERE v2.procedure_id = p.id
)
ORDER BY content_size_bytes DESC
LIMIT 10;
```

## Configuração no Servidor de Produção

### 1. Localizando o Arquivo de Configuração

```bash
# Localizar my.cnf
mysql --help | grep "Default options" -A 1

# Ou verificar locais comuns
ls -la /etc/mysql/my.cnf
ls -la /etc/my.cnf
ls -la /usr/local/etc/my.cnf
```

### 2. Editando a Configuração

```bash
sudo nano /etc/mysql/my.cnf
```

Adicionar as configurações na seção `[mysqld]`:

```ini
[mysqld]
max_allowed_packet = 128M
innodb_buffer_pool_size = 2G
wait_timeout = 3600
interactive_timeout = 3600
```

### 3. Reiniciar o MySQL

```bash
sudo systemctl restart mysql
# ou
sudo service mysql restart
```

## Verificação Pós-Configuração

1. **Verificar se a configuração foi aplicada:**
   ```sql
   SHOW VARIABLES LIKE 'max_allowed_packet';
   ```

2. **Testar salvamento de procedimento grande**

3. **Monitorar logs de erro:**
   ```bash
   tail -f /var/log/mysql/error.log
   ```

## Configurações Alternativas por Aplicação

Se não for possível alterar a configuração do servidor, configurar na conexão:

### No arquivo de conexão do Node.js:

```javascript
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'username', 
    password: 'password',
    database: 'database_name',
    acquireTimeout: 60000,
    timeout: 60000,
    // Configuração específica para pacotes grandes
    maxAllowedPacket: 134217728 // 128MB
});

// Ou via query após conexão
connection.query('SET SESSION max_allowed_packet = 134217728');
```

## Troubleshooting

### 1. Erro "Packet for query is too large"
- Aumentar `max_allowed_packet`
- Verificar se existe conteúdo base64 muito grande
- Considerar otimização de imagens

### 2. Timeout na Conexão
- Aumentar `wait_timeout` e `interactive_timeout`
- Verificar configuração de timeout na aplicação

### 3. Memory Issues
- Aumentar `innodb_buffer_pool_size`
- Monitorar uso de memória do servidor

## Monitoramento Contínuo

### Query para identificar procedimentos grandes:

```sql
SELECT 
    p.id,
    p.title,
    LENGTH(JSON_EXTRACT(v.content, '$')) as size_bytes,
    ROUND(LENGTH(JSON_EXTRACT(v.content, '$')) / 1024 / 1024, 2) as size_mb,
    (JSON_EXTRACT(v.content, '$') REGEXP 'data:image') as has_base64_images
FROM proc_main p
JOIN proc_versions v ON p.id = v.procedure_id
WHERE v.version_number = (
    SELECT MAX(version_number) 
    FROM proc_versions v2 
    WHERE v2.procedure_id = p.id
)
AND LENGTH(JSON_EXTRACT(v.content, '$')) > 5242880 -- Maior que 5MB
ORDER BY size_bytes DESC;
```

## Recomendações de Desenvolvimento

1. **Implementar compressão de imagens no frontend**
2. **Usar storage externo para imagens grandes**
3. **Implementar paginação para conteúdos muito grandes**
4. **Monitorar tamanho dos procedimentos regularmente**
5. **Implementar sistema de alertas para conteúdos >10MB** 