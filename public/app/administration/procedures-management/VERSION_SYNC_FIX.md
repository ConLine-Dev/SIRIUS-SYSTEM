# Correção de Sincronização de Versões - Procedures Management

## Problema Identificado

Após atualizar um procedimento (ex: da versão 24 para 25), ao visualizar o procedimento ele ainda mostrava a versão antiga (24). Somente após várias atualizações da página a versão correta (25) era exibida.

## Causa Raiz

O problema estava relacionado ao **sistema de cache** em múltiplas camadas:

1. **Cache do Backend**: Mantinha dados em cache por 5 minutos
2. **Cache do Frontend**: Também mantinha dados em cache por 5 minutos
3. **Falta de invalidação específica**: Ao atualizar, apenas o cache da lista era invalidado, não o cache individual do procedimento

## Solução Implementada

### 1. Backend - Cache Específico por Procedimento

```javascript
// Adicionado cache individual de procedimentos
const cache = {
    // ... outros caches
    procedureById: {} // Novo cache para procedimentos individuais
};

// Função de invalidação melhorada
function invalidateCache(keys = null, procedureId = null) {
    // ... código existente
    
    // Invalidar cache específico do procedimento
    if (procedureId && cache.procedureById[procedureId]) {
        delete cache.procedureById[procedureId];
        console.log(`🗑️ Cache do procedimento ${procedureId} invalidado`);
    }
}
```

### 2. Backend - Invalidação Após Operações

```javascript
// Em updateProcedure
await executeQuery('COMMIT');
invalidateCache(['procedures'], id); // Invalida cache específico

// Pequeno delay para garantir commit completo
await new Promise(resolve => setTimeout(resolve, 100));
```

### 3. Frontend - Detecção de Atualização

```javascript
// Em edit.js - Após salvar com sucesso
sessionStorage.setItem(`procedure_${procedureData.id}_updated`, 'true');

// Em view.js - Ao carregar
const forceRefresh = urlParams.get('refresh') === 'true' || 
                    sessionStorage.getItem(`procedure_${id}_updated`) === 'true';

if (forceRefresh) {
    console.log('🔄 Forçando refresh dos dados (bypass de cache)');
    sessionStorage.removeItem(`procedure_${id}_updated`);
    clearViewCache();
}
```

### 4. Frontend - WebSocket para Sincronização em Tempo Real

```javascript
// Listeners de websocket para invalidar cache
socket.on('procedure_updated', (data) => {
    if (data.id == procedureId) {
        console.log('🔄 Procedimento atualizado via websocket, limpando cache...');
        clearViewCache();
        forceReloadProcedure();
    }
});
```

### 5. Evitar Cache do Navegador com Timestamp

```javascript
// Ao invés de headers customizados (que causavam erro com makeRequest),
// usar timestamp na URL quando precisar forçar refresh
const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
const data = await makeRequest(`/api/procedures-management/procedures/${id}${timestamp}`);
```

## Erro Adicional Corrigido

### Problema com makeRequest

A função `makeRequest` do `fetchAPI.js` espera:
- 1º parâmetro: URL (string)
- 2º parâmetro: método HTTP (string) - padrão 'GET'
- 3º parâmetro: body (objeto) - opcional

Estava sendo passado incorretamente:
```javascript
// ❌ ERRADO
await makeRequest(url, { headers: { 'Cache-Control': 'no-cache' } });

// ✅ CORRETO
await makeRequest(url); // Para GET
await makeRequest(url, 'POST', data); // Para POST
```

### Solução

Usar timestamp na URL para evitar cache ao invés de headers customizados:
```javascript
const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
const data = await makeRequest(`/api/procedures-management/procedures/${id}${timestamp}`);
```

## Fluxo Completo da Solução

1. **Usuário atualiza procedimento** → Flag é definida no sessionStorage
2. **Backend salva** → Invalida cache específico + delay de 100ms
3. **Usuário visualiza** → Detecta flag e força refresh com timestamp
4. **WebSocket notifica** → Outros usuários também recebem atualização
5. **Cache limpo** → Dados sempre atualizados

## Benefícios

- ✅ Versão correta exibida imediatamente após atualização
- ✅ Sincronização em tempo real entre usuários
- ✅ Performance mantida com cache inteligente
- ✅ Fallback para parâmetro `?refresh=true` na URL
- ✅ Compatibilidade com função makeRequest existente

## Testes Recomendados

1. Atualizar procedimento e verificar se mostra versão correta imediatamente
2. Abrir em duas abas e verificar sincronização via WebSocket
3. Usar parâmetro `?refresh=true` para forçar atualização
4. Verificar que cache ainda funciona para melhorar performance
5. Confirmar que não há mais erros de "invalid HTTP method" 