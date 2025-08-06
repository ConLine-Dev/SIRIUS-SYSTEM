# Funcionalidades Exclusivas do Supervisor do PDI

## Visão Geral
Implementação de permissões especiais para o **Supervisor do PDI** no módulo PDI-Hub, permitindo maior controle sobre as ações do plano de desenvolvimento individual.

## Funcionalidades Implementadas

### 1. Alteração de Prazo (Deadline)
- **Quem pode**: Apenas o Supervisor do PDI
- **Como funciona**: Campo de data editável no modal de edição
- **Validação**: Dupla (frontend + backend)

### 2. Alteração de Descrição da Ação
- **Quem pode**: Apenas o Supervisor do PDI
- **Como funciona**: Campo textarea editável no modal de edição
- **Validação**: Dupla (frontend + backend)

### 3. Exclusão de Ações
- **Quem pode**: Apenas o Supervisor do PDI
- **Como funciona**: Botão de exclusão visível apenas para supervisores
- **Validação**: Tripla (visibilidade + frontend + backend)

## Detalhes da Implementação

### Frontend - Interface do Usuário

#### HTML (collaborator.html)
```html
<!-- Campo de Descrição -->
<div class="mb-3">
    <label for="actionDescriptionInput" class="form-label">Descrição da Ação</label>
    <textarea class="form-control" id="actionDescriptionInput" name="description" rows="3"></textarea>
    <small id="descriptionHelp" class="form-text text-muted d-none">
        <i class="ri-information-line"></i> Apenas o supervisor do PDI pode alterar a descrição
    </small>
</div>

<!-- Campo de Prazo -->
<div class="mb-3">
    <label for="actionDeadlineInput" class="form-label">Prazo</label>
    <input type="date" class="form-control" id="actionDeadlineInput" name="deadline">
    <small id="deadlineHelp" class="form-text text-muted d-none">
        <i class="ri-information-line"></i> Apenas o supervisor do PDI pode alterar o prazo
    </small>
</div>
```

#### JavaScript (collaborator.js)

##### Controle de Permissões nos Campos
```javascript
// Configurar permissões de edição para supervisor
if (window.isSupervisorPDI) {
    // Supervisor pode editar descrição e prazo
    descriptionInput.disabled = false;
    descriptionInput.classList.remove('form-control-plaintext');
    descriptionInput.classList.add('form-control');
    descriptionHelp.classList.add('d-none');
    
    deadlineInput.disabled = false;
    deadlineInput.classList.remove('form-control-plaintext');
    deadlineInput.classList.add('form-control');
    deadlineHelp.classList.add('d-none');
} else {
    // Outros usuários não podem editar
    descriptionInput.disabled = true;
    descriptionInput.classList.add('form-control-plaintext');
    descriptionHelp.classList.remove('d-none');
    
    deadlineInput.disabled = true;
    deadlineInput.classList.add('form-control-plaintext');
    deadlineHelp.classList.remove('d-none');
}
```

##### Envio de Dados para o Backend
```javascript
// Adicionar descrição e prazo se o supervisor alterou
if (window.isSupervisorPDI) {
    const descriptionInput = document.getElementById('actionDescriptionInput');
    if (descriptionInput && descriptionInput.value) {
        formData.append('description', descriptionInput.value);
    }
    
    const deadlineInput = document.getElementById('actionDeadlineInput');
    if (deadlineInput && deadlineInput.value) {
        formData.append('deadline', deadlineInput.value);
    }
}
```

##### Validação de Exclusão
```javascript
async function confirmRemoveAction(actionId, pdiId) {
    // Verificar se o usuário é supervisor
    if (!window.isSupervisorPDI) {
        showErrorAlert('Apenas o supervisor do PDI pode excluir ações.');
        return;
    }
    
    // Confirmar e executar exclusão
    if (confirm('Tem certeza que deseja remover esta ação?')) {
        // Enviar requisição com ID do usuário para validação no backend
        const response = await fetch('/api/pdi-hub/deleteAction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                actionId,
                pdiId,
                logged_user_id: userLogged.system_collaborator_id
            })
        });
    }
}
```

### Backend - Validação e Segurança

#### Controller (pdi-hub.js - função saveActionAttachments)

##### Validação de Descrição
```javascript
// Verificar se o usuário pode alterar a descrição
let descriptionValue = action.description;

if (req.body.description && req.body.logged_user_id) {
    const [pdi] = await executeQuery('SELECT supervisor_id FROM pdi_plans WHERE id = ?', [pdiId]);
    if (pdi && parseInt(pdi.supervisor_id) === parseInt(req.body.logged_user_id)) {
        descriptionValue = req.body.description;
        console.log('Usuário é supervisor, atualizando descrição');
    }
}
```

##### Validação de Prazo
```javascript
// Verificar se o usuário pode alterar o prazo
let deadlineValue = action.deadline;

if (req.body.deadline && req.body.logged_user_id) {
    const [pdi] = await executeQuery('SELECT supervisor_id FROM pdi_plans WHERE id = ?', [pdiId]);
    if (pdi && parseInt(pdi.supervisor_id) === parseInt(req.body.logged_user_id)) {
        deadlineValue = req.body.deadline;
        console.log('Usuário é supervisor, atualizando prazo');
    }
}
```

##### Atualização no Banco de Dados
```javascript
await executeQuery(
    'UPDATE pdi_actions SET attachment = ?, status = ?, completion_date = ?, deadline = ?, description = ? WHERE id = ?',
    [finalAttachments, statusToSet, completionDateToSet, deadlineValue, descriptionValue, actionId]
);
```

#### Rota de Exclusão (api-pdi-hub.js)
```javascript
router.post('/deleteAction', async (req, res) => {
    const { actionId, pdiId, logged_user_id } = req.body;
    
    // Verificar se o usuário é supervisor
    if (pdiId && logged_user_id) {
        const [pdi] = await executeQuery('SELECT supervisor_id FROM pdi_plans WHERE id = ?', [pdiId]);
        
        if (!pdi || parseInt(pdi.supervisor_id) !== parseInt(logged_user_id)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Apenas o supervisor do PDI pode excluir ações.' 
            });
        }
    }
    
    // Proceder com a exclusão...
});
```

## Fluxo de Funcionamento

### Para Edição (Descrição/Prazo)
1. **Abertura do Modal**: Supervisor clica no ícone de edição
2. **Verificação de Permissão**: Sistema verifica `window.isSupervisorPDI`
3. **Habilitação de Campos**: Campos ficam editáveis apenas para supervisor
4. **Salvamento**: Dados enviados ao backend com ID do usuário
5. **Validação Backend**: Confirma se usuário é supervisor antes de salvar
6. **Atualização**: Banco de dados atualizado com novos valores

### Para Exclusão
1. **Visibilidade do Botão**: Botão aparece apenas para supervisores
2. **Confirmação**: Modal de confirmação antes de excluir
3. **Validação Frontend**: Verifica se é supervisor antes de enviar
4. **Validação Backend**: Confirma permissão no servidor
5. **Exclusão**: Remove ação e arquivos anexos

## Segurança

### Camadas de Proteção
1. **Interface (UX)**: Campos desabilitados e botões ocultos
2. **Frontend (JS)**: Validação antes de enviar requisições
3. **Backend (API)**: Validação final antes de executar operações

### Princípios de Segurança
- **Nunca confiar apenas no frontend**: Toda operação é validada no backend
- **Verificação de identidade**: ID do usuário é enviado e verificado
- **Consulta ao banco**: Supervisor é verificado diretamente na tabela `pdi_plans`
- **Logs de auditoria**: Todas as operações são registradas no console

## Feedback ao Usuário

### Mensagens de Sucesso
- Descrição alterada: "Ação atualizada com sucesso! (descrição, status e anexos)"
- Prazo alterado: "Ação atualizada com sucesso! (prazo, status e anexos)"
- Ambos alterados: "Ação atualizada com sucesso! (descrição, prazo, status e anexos)"
- Ação excluída: "Ação removida com sucesso!"

### Mensagens de Erro
- Tentativa não autorizada: "Apenas o supervisor do PDI pode [ação]"
- Erro no servidor: Mensagem específica do erro

## Variáveis de Controle

- `window.isSupervisorPDI`: Boolean que indica se o usuário logado é o supervisor
- `window.isColaboradorPDI`: Boolean que indica se o usuário logado é o colaborador
- Definidas em: `loadPDIDetails()` após verificar IDs no banco

## Testes Recomendados

### Como Supervisor
1. ✅ Editar descrição de uma ação
2. ✅ Editar prazo de uma ação
3. ✅ Editar ambos simultaneamente
4. ✅ Excluir uma ação
5. ✅ Verificar mensagens de sucesso personalizadas

### Como Colaborador (Não Supervisor)
1. ❌ Campos de descrição e prazo devem estar desabilitados
2. ❌ Botão de exclusão não deve aparecer
3. ✅ Ainda pode alterar status e anexos

### Como Visualizador
1. ❌ Não pode editar nenhum campo
2. ❌ Não vê botões de ação
3. ✅ Pode apenas visualizar informações

## Notas Técnicas

- Campos usam classes Bootstrap para feedback visual
- Validação assíncrona com await/async
- Tratamento de erros com try/catch
- Mensagens dinâmicas baseadas em campos alterados
- Compatível com todos os navegadores modernos 