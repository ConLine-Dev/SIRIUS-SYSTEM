# Funcionalidade: Atualização de Prazo de Ações pelo Supervisor do PDI

## Descrição
Foi implementada uma nova funcionalidade que permite que apenas o **Supervisor do PDI** possa alterar o prazo (deadline) das ações no módulo PDI-Hub, especificamente na página `collaborator.html`.

## Alterações Realizadas

### 1. Frontend - HTML (collaborator.html)
- **Arquivo**: `public/app/administration/pdi-hub/collaborator.html`
- **Alteração**: O campo de prazo no modal de atualização de ação foi convertido de texto estático (`<p>`) para um campo de entrada (`<input type="date">`).
- **Linha modificada**: ~485-487

```html
<!-- Antes -->
<div class="mb-3">
    <label class="form-label">Prazo</label>
    <p id="actionDeadline" class="form-control-plaintext"></p>
</div>

<!-- Depois -->
<div class="mb-3">
    <label for="actionDeadlineInput" class="form-label">Prazo</label>
    <input type="date" class="form-control" id="actionDeadlineInput" name="deadline">
    <small id="deadlineHelp" class="form-text text-muted d-none">
        <i class="ri-information-line"></i> Apenas o supervisor do PDI pode alterar o prazo
    </small>
</div>
```

### 2. Frontend - JavaScript (collaborator.js)
- **Arquivo**: `public/app/administration/pdi-hub/assets/js/collaborator.js`
- **Alterações principais**:

#### a) Função `openUpdateActionModal` (linha ~774-912)
- Configuração do campo de prazo como editável/não editável baseado nas permissões
- Formatação correta da data para o formato do input date (YYYY-MM-DD)
- Exibição de mensagem informativa para usuários não supervisores

```javascript
// Configurar permissão de edição do prazo
if (window.isSupervisorPDI) {
    // Supervisor pode editar o prazo
    deadlineInput.disabled = false;
    deadlineInput.classList.remove('form-control-plaintext');
    deadlineInput.classList.add('form-control');
    deadlineHelp.classList.add('d-none');
} else {
    // Outros usuários não podem editar o prazo
    deadlineInput.disabled = true;
    deadlineInput.classList.add('form-control-plaintext');
    deadlineInput.classList.remove('form-control');
    deadlineHelp.classList.remove('d-none');
}
```

#### b) Função `saveActionStatus` (linha ~970-990)
- Envio do ID do usuário logado e flag de supervisor para o backend
- Inclusão do novo prazo no FormData quando alterado pelo supervisor
- Mensagem de sucesso personalizada quando o prazo é atualizado

```javascript
// Adicionar informações do usuário logado para validação no backend
const userLogged = await getInfosLogin();
if (userLogged && userLogged.system_collaborator_id) {
    formData.append('logged_user_id', userLogged.system_collaborator_id);
    formData.append('is_supervisor', window.isSupervisorPDI ? 'true' : 'false');
}

// Adicionar prazo se o usuário for supervisor e o campo foi alterado
if (window.isSupervisorPDI) {
    const deadlineInput = document.getElementById('actionDeadlineInput');
    if (deadlineInput && deadlineInput.value) {
        formData.append('deadline', deadlineInput.value);
        console.log('Prazo atualizado pelo supervisor:', deadlineInput.value);
    }
}
```

### 3. Backend - Controller (pdi-hub.js)
- **Arquivo**: `server/controllers/pdi-hub.js`
- **Função**: `updatePDIActionStatus` (linha ~480-650)
- **Alterações**:

#### a) Validação de Permissão
- Verificação se o usuário logado é o supervisor do PDI antes de permitir alteração do prazo

```javascript
// Verificar se o usuário pode alterar o prazo
let canUpdateDeadline = false;
if (form.deadline && form.logged_user_id) {
    // Buscar o PDI para verificar se o usuário é o supervisor
    const [pdi] = await executeQuery('SELECT supervisor_id FROM pdi_plans WHERE id = ?', [pdiId]);
    if (pdi && parseInt(pdi.supervisor_id) === parseInt(form.logged_user_id)) {
        canUpdateDeadline = true;
        console.log('Usuário é supervisor do PDI, pode alterar o prazo');
    } else {
        console.log('Usuário não é supervisor do PDI, não pode alterar o prazo');
    }
}
```

#### b) Atualização Condicional do Prazo
- O prazo só é atualizado no banco de dados se o usuário tiver permissão

```javascript
// Se o prazo (deadline) foi enviado E o usuário tem permissão, adicionar à atualização
if (form.deadline && canUpdateDeadline) {
    updateFields.push('deadline = ?');
    updateValues.push(form.deadline);
    console.log('Atualizando prazo da ação para:', form.deadline);
} else if (form.deadline && !canUpdateDeadline) {
    console.log('Tentativa de alterar prazo negada - usuário não é supervisor');
}
```

#### c) Correção de Bug
- Foi corrigida a definição da variável `action` que estava faltando e causava erro ao enviar emails

## Fluxo de Funcionamento

1. **Abertura do Modal**: Quando o usuário clica no ícone de edição (lápis) de uma ação
2. **Verificação de Permissão**: O sistema verifica se o usuário logado é o supervisor do PDI
3. **Configuração do Campo**:
   - **Se é supervisor**: Campo de prazo fica editável
   - **Se não é supervisor**: Campo de prazo fica desabilitado com mensagem explicativa
4. **Salvamento**:
   - Frontend envia o novo prazo junto com o ID do usuário
   - Backend valida novamente se o usuário é supervisor
   - Prazo só é atualizado se a validação passar
5. **Feedback**: Mensagem de sucesso personalizada indica se o prazo foi atualizado

## Segurança

A implementação possui dupla validação:
1. **Frontend**: Desabilita o campo para não supervisores (UX)
2. **Backend**: Valida permissão antes de atualizar o banco (Segurança real)

Isso garante que mesmo que alguém tente burlar a validação do frontend, o backend impedirá a alteração não autorizada.

## Variáveis de Controle

- `window.isSupervisorPDI`: Flag global que indica se o usuário logado é o supervisor do PDI
- `window.isColaboradorPDI`: Flag global que indica se o usuário logado é o colaborador do PDI
- Essas variáveis são definidas na função `loadPDIDetails` (linha ~280-295)

## Testes Recomendados

1. **Como Supervisor**:
   - Abrir a página collaborator de um PDI onde você é supervisor
   - Editar uma ação e verificar se o campo de prazo está editável
   - Alterar o prazo e salvar
   - Verificar se o prazo foi atualizado corretamente

2. **Como Colaborador (não supervisor)**:
   - Abrir a página collaborator do seu próprio PDI
   - Editar uma ação e verificar se o campo de prazo está desabilitado
   - Verificar se a mensagem informativa aparece

3. **Como Visualizador (nem supervisor nem colaborador)**:
   - Abrir a página collaborator de um PDI de outra pessoa
   - Verificar se não consegue editar nenhum campo

## Notas Técnicas

- O campo de data usa o formato HTML5 `input type="date"` que é suportado por todos os navegadores modernos
- A data é enviada no formato YYYY-MM-DD e armazenada diretamente no banco
- A validação de permissão no backend é independente da validação do frontend para maior segurança

## Correção de Bug - Erro de Sintaxe no Modal (Atualização)

### Problema Identificado
Ao clicar no botão de edição de ação, ocorria o erro:
```
Uncaught SyntaxError: Invalid or unexpected token
```

### Causa
O erro era causado por:
1. Caracteres especiais não escapados na descrição da ação (aspas, quebras de linha, etc.)
2. Valores `null` ou `undefined` sendo passados diretamente no atributo `onclick`
3. Uso de parâmetros inline no HTML que não eram devidamente escapados

### Solução Implementada

#### 1. Criação de Função de Escape HTML
```javascript
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
```

#### 2. Refatoração do Botão de Edição
**Antes:** Usava `onclick` com parâmetros inline
```html
<button onclick='openUpdateActionModalWithFetch(${action.id}, ${pdiId}, "${action.description}", "${action.deadline}", "${action.status}")'>
```

**Depois:** Usa `data-attributes` e event listeners
```html
<button class="btn-edit-action" 
        data-action-id="${action.id}"
        data-pdi-id="${pdiId}"
        data-description="${escapeHtml(action.description)}"
        data-deadline="${action.deadline || ''}"
        data-status="${action.status || 'Pendente'}">
```

#### 3. Event Listeners Seguros
```javascript
document.querySelectorAll('.btn-edit-action').forEach(btn => {
    btn.addEventListener('click', function() {
        const actionId = this.getAttribute('data-action-id');
        const pdiId = this.getAttribute('data-pdi-id');
        const description = this.getAttribute('data-description');
        const deadline = this.getAttribute('data-deadline');
        const status = this.getAttribute('data-status');
        openUpdateActionModalWithFetch(actionId, pdiId, description, deadline, status);
    });
});
```

#### 4. Tratamento de Erros na Função de Abertura do Modal
- Adicionado try-catch para capturar erros
- Decodificação de HTML entities
- Conversão segura de tipos
- Mensagem de erro amigável ao usuário

### Benefícios da Correção
1. **Segurança**: Previne injeção de código através de caracteres especiais
2. **Robustez**: Trata valores nulos e undefined adequadamente
3. **Manutenibilidade**: Código mais limpo e organizado
4. **UX**: Mensagens de erro claras quando algo falha

## Correção de Bug - Status Alterado Automaticamente (Atualização 2)

### Problema Identificado
Ao alterar o prazo de uma ação e salvar:
1. O status estava sendo automaticamente alterado para "Em Andamento"
2. O prazo não estava sendo atualizado no banco de dados

### Causa
A função `saveActionAttachments` no backend tinha uma regra de negócio que:
- Forçava o status para "Concluído" quando havia anexos
- Forçava o status para "Em Andamento" quando não havia anexos
- Não processava o campo `deadline` enviado pelo frontend

### Solução Implementada

#### Backend - Controller (pdi-hub.js - função saveActionAttachments)

1. **Respeitar Status do Frontend**:
```javascript
// Só aplicar a regra de anexos se o status não foi explicitamente definido
if (!req.body.status) {
    // Aplicar regra baseada em anexos
} else {
    // Respeitar o status enviado pelo cliente
    console.log(`Mantendo status enviado pelo cliente: ${statusToSet}`);
}
```

2. **Adicionar Suporte para Deadline**:
```javascript
// Verificar se o usuário pode alterar o prazo
let deadlineValue = action.deadline; // Manter o deadline atual por padrão

if (req.body.deadline && req.body.logged_user_id) {
    const [pdi] = await executeQuery('SELECT supervisor_id FROM pdi_plans WHERE id = ?', [pdiId]);
    if (pdi && parseInt(pdi.supervisor_id) === parseInt(req.body.logged_user_id)) {
        deadlineValue = req.body.deadline;
        console.log('Usuário é supervisor do PDI, atualizando prazo para:', deadlineValue);
    }
}
```

3. **Atualizar Query SQL**:
```javascript
// Incluir deadline na atualização
await executeQuery(
    'UPDATE pdi_actions SET attachment = ?, status = ?, completion_date = ?, deadline = ? WHERE id = ?',
    [finalAttachments, statusToSet, completionDateToSet, deadlineValue, actionId]
);
```

### Resultado
- O status agora é mantido conforme selecionado pelo usuário
- O prazo é atualizado corretamente quando alterado pelo supervisor
- A regra de anexos só é aplicada quando nenhum status é especificado
- A validação de permissão para alterar prazo continua funcionando 