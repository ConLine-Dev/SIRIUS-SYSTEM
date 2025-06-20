# Otimizações de Performance - Módulo Procedures Management

## Problema Identificado

**Erro**: `Out of sort memory, consider increasing server sort buffer size`

**Causa Raiz**: Os campos `content` (JSON do Quill) e `change_summary` na tabela `proc_versions` podem conter dados muito grandes. Quando o MySQL tenta ordenar registros que incluem esses campos, precisa carregar todo o conteúdo na memória, excedendo o buffer de ordenação disponível.

**Exemplo**: Um procedimento com 50 versões, cada uma com 100KB de conteúdo JSON, resultaria em ~5MB de dados para ordenação, facilmente excedendo buffers padrão do MySQL.

## Soluções Implementadas

### 1. **Estratégia de Consulta Robusta**

#### Antes:
```sql
SELECT v.*, c.name as author_name
FROM proc_versions v
LEFT JOIN collaborators c ON v.author_id = c.id
WHERE v.procedure_id = ?
ORDER BY v.version_number DESC
```

#### Depois:
```sql
-- 1. Busca apenas metadados (sem campos grandes)
SELECT 
    v.id, v.procedure_id, v.version_number, 
    v.author_id, v.created_at, c.name as author_name
FROM proc_versions v
LEFT JOIN collaborators c ON v.author_id = c.id
WHERE v.procedure_id = ?
ORDER BY v.version_number DESC
LIMIT 50;

-- 2. Busca campos grandes individualmente quando necessário
SELECT content FROM proc_versions 
WHERE procedure_id = ? AND version_number = ?;

SELECT change_summary FROM proc_versions 
WHERE procedure_id = ? AND version_number = ?;
```

### 2. **Configurações de Performance**

```javascript
const PERFORMANCE_CONFIG = {
    MAX_VERSIONS_DEFAULT: 50,        // Máximo de versões a buscar por padrão
    MAX_VERSIONS_PAGINATED: 20,      // Máximo de versões por página na paginação
    ENABLE_FALLBACK_SORTING: true,   // Habilitar ordenação JavaScript como fallback
    LOG_PERFORMANCE_WARNINGS: true   // Log de avisos de performance
};
```

### 3. **Otimizações de Banco de Dados**

#### Índices Adicionados:
- `idx_procedure_version_optimized`: procedure_id + version_number DESC
- `idx_procedure_author`: procedure_id + author_id

#### Consulta Otimizada:
```sql
ANALYZE TABLE proc_versions;
```

### 4. **Sistema de Fallback**

1. **Estratégia Principal**: Busca apenas a versão mais recente
2. **Estratégia Secundária**: Se solicitado histórico (`includeVersions=true`), busca versões limitadas
3. **Estratégia de Fallback**: Em caso de erro, ordenação JavaScript
4. **Estratégia de Emergência**: Continua sem versões em caso de erro crítico

### 5. **Novas APIs Otimizadas**

#### API de Versões Paginadas
**Endpoint**: `GET /api/procedures/:id/versions?page=1&limit=20&includeContent=false`

Permite carregar versões sob demanda, evitando sobrecarga inicial.

#### API de Conteúdo Específico
**Endpoint**: `GET /api/procedures/:id/versions/:versionNumber/content`

Carrega apenas o conteúdo completo de uma versão específica quando necessário.

## Uso da API Otimizada

### Buscar Procedimento (apenas versão atual)
```javascript
GET /api/procedures/41
```

### Buscar Procedimento com Histórico Limitado
```javascript
GET /api/procedures/41?includeVersions=true
```

### Buscar Versões Paginadas (apenas metadados)
```javascript
GET /api/procedures/41/versions?page=1&limit=20
```

### Buscar Versões com Conteúdo Completo
```javascript
GET /api/procedures/41/versions?page=1&limit=20&includeContent=true
```

### Buscar Conteúdo de Versão Específica
```javascript
GET /api/procedures/41/versions/5/content
```

## Metadados de Versão

A resposta agora inclui metadados úteis:

```json
{
  "versionMetadata": {
    "hasMoreVersions": false,
    "totalVersionsAvailable": 5,
    "currentVersion": 5
  }
}
```

## Configurações MySQL Recomendadas

Para melhor performance, configure no MySQL:

```sql
SET GLOBAL sort_buffer_size = 2097152;      -- 2MB
SET GLOBAL tmp_table_size = 67108864;       -- 64MB  
SET GLOBAL max_heap_table_size = 67108864;  -- 64MB
```

## Monitoramento

O sistema agora inclui logs detalhados:
- ✅ Sucesso na busca de versões
- ⚠️ Avisos de performance (quando habilitado)
- ❌ Erros críticos com fallback

## Compatibilidade

- ✅ Funciona com versões antigas do MySQL (5.7+)
- ✅ Mantém compatibilidade total com API existente
- ✅ Fallback automático em caso de problemas
- ✅ Performance otimizada para procedimentos com muitas versões

## Resumo dos Arquivos Modificados

1. `server/controllers/procedures-management.js` - Lógica principal otimizada com separação de campos grandes
2. `server/routes/api-procedures-management.js` - Novas rotas de versões paginadas e conteúdo específico
3. `public/app/administration/procedures-management/update_schema_v6.sql` - Índices de performance
4. `scripts/optimize-procedures-db.js` - Script de aplicação de otimizações
5. `diagnostic_proc_versions.sql` - Script de diagnóstico para identificar problemas
6. `PERFORMANCE_OPTIMIZATION.md` - Documentação completa das otimizações

## Novos Endpoints Disponíveis

- `GET /api/procedures/:id/versions` - Versões paginadas (metadados apenas)
- `GET /api/procedures/:id/versions?includeContent=true` - Versões com conteúdo completo
- `GET /api/procedures/:id/versions/:versionNumber/content` - Conteúdo específico de uma versão 