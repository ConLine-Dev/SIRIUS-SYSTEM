/**
 * create-pdi.js
 * Script para a página de criação de PDI
 */

// Variáveis globais
let selectedProfileType = '';
let actionCounter = 0;
let collaboratorChoices;
let supervisorChoices;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeSelects();
    loadCollaborators();
    loadSupervisors();
    setupEventListeners();
    hideLoader();
});

// Inicializar selects com choices.js
function initializeSelects() {
    // Inicializar o select de colaboradores
    collaboratorChoices = new Choices('#collaborator_id', {
        searchEnabled: true,
        itemSelectText: '',
        searchPlaceholderValue: 'Pesquisar colaborador...',
        noResultsText: 'Nenhum colaborador encontrado',
        noChoicesText: 'Nenhum colaborador disponível',
        position: 'bottom',
        placeholder: true,
        placeholderValue: 'Selecione um colaborador',
        shouldSort: false,
        classNames: {
            containerOuter: 'choices choices-collaborator position-relative',
            dropdown: 'choices__dropdown choices__dropdown--bottom'
        }
    });

    // Inicializar o select de supervisores
    supervisorChoices = new Choices('#supervisor_id', {
        searchEnabled: true,
        itemSelectText: '',
        searchPlaceholderValue: 'Pesquisar supervisor...',
        noResultsText: 'Nenhum supervisor encontrado',
        noChoicesText: 'Nenhum supervisor disponível',
        position: 'bottom',
        placeholder: true,
        placeholderValue: 'Selecione um supervisor',
        shouldSort: false,
        classNames: {
            containerOuter: 'choices choices-supervisor position-relative',
            dropdown: 'choices__dropdown choices__dropdown--bottom'
        }
    });
    
    // Fix para garantir que os dropdowns não fiquem presos dentro dos cards
    document.addEventListener('click', function(e) {
        const choicesDropdowns = document.querySelectorAll('.choices__list--dropdown');
        choicesDropdowns.forEach(dropdown => {
            if (dropdown.classList.contains('is-active')) {
                // Garantir que o dropdown esteja visível fora do card
                dropdown.style.zIndex = '9999';
                
                // Verificar se o dropdown está sendo cortado
                const rect = dropdown.getBoundingClientRect();
                if (rect.bottom > window.innerHeight) {
                    dropdown.style.top = 'auto';
                    dropdown.style.bottom = '100%';
                    dropdown.classList.add('choices__dropdown--top');
                    dropdown.classList.remove('choices__dropdown--bottom');
                }
            }
        });
    }, true);
}

// Carregar colaboradores ativos para o dropdown
async function loadCollaborators() {
    try {
        showLoader();
        const response = await fetch('/api/pdi-hub/getAllActiveCollaborators');
        if (!response.ok) {
            throw new Error('Erro ao carregar colaboradores');
        }
        
        const result = await response.json();
        
        // Verificar se a resposta tem o formato esperado
        const collaborators = result.data || result;
        
        if (!Array.isArray(collaborators)) {
            console.error('Resposta de colaboradores não é um array:', result);
            showErrorAlert('Formato de resposta inválido ao carregar colaboradores');
            hideLoader();
            return;
        }
        
        const collaboratorOptions = [
            { value: '', label: 'Selecione um colaborador' }
        ];
        
        collaborators.forEach(collaborator => {
            collaboratorOptions.push({
                value: collaborator.id,
                label: `${collaborator.name} ${collaborator.department ? `(${collaborator.department})` : ''}`,
                customProperties: {
                    department: collaborator.department || '',
                    job_position: collaborator.job_position || ''
                }
            });
        });
        
        collaboratorChoices.setChoices(collaboratorOptions, 'value', 'label', true);
        hideLoader();
    } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
        showErrorAlert('Não foi possível carregar a lista de colaboradores');
        hideLoader();
    }
}

// Carregar supervisores para o dropdown
async function loadSupervisors() {
    try {
        showLoader();
        const response = await fetch('/api/pdi-hub/getSupervisors');
        if (!response.ok) {
            throw new Error('Erro ao carregar supervisores');
        }
        
        const result = await response.json();
        
        // Verificar se a resposta tem o formato esperado
        const supervisors = result.data || result;
        
        if (!Array.isArray(supervisors)) {
            console.error('Resposta de supervisores não é um array:', result);
            showErrorAlert('Formato de resposta inválido ao carregar supervisores');
            hideLoader();
            return;
        }
        
        const supervisorOptions = [
            { value: '', label: 'Selecione um supervisor' }
        ];
        
        supervisors.forEach(supervisor => {
            supervisorOptions.push({
                value: supervisor.id,
                label: `${supervisor.name} ${supervisor.job_position ? `(${supervisor.job_position})` : ''}`,
                customProperties: {
                    job_position: supervisor.job_position || ''
                }
            });
        });
        
        supervisorChoices.setChoices(supervisorOptions, 'value', 'label', true);
        hideLoader();
    } catch (error) {
        console.error('Erro ao carregar supervisores:', error);
        showErrorAlert('Não foi possível carregar a lista de supervisores');
        hideLoader();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botão de cancelar
    document.getElementById('btnCancel').addEventListener('click', function() {
        window.close();
    });
    
    // Botão de salvar
    document.getElementById('btnSave').addEventListener('click', savePDI);
    
    // Seleção de tipo de perfil usando imagens
    document.querySelectorAll('.profile-image-container').forEach(function(container) {
        container.addEventListener('click', function() {
            // Remover a classe 'selected' de todos os containers
            document.querySelectorAll('.profile-image-container').forEach(function(c) {
                c.classList.remove('selected');
            });
            
            // Adicionar a classe 'selected' ao container clicado
            this.classList.add('selected');
            
            // Efeito de animação suave
            this.style.transition = 'all 0.3s ease';
            this.style.transform = 'scale(1.05)';
            setTimeout(() => {
                this.style.transform = 'translateY(-5px)';
            }, 200);
            
            // Atualizar o tipo de perfil selecionado
            selectedProfileType = this.getAttribute('data-type');
            console.log('Perfil selecionado:', selectedProfileType);
        });
    });

    // Adicionar nova ação ao formulário
    function addNewAction() {
        const today = new Date();
        const todayFormatted = today.toISOString().split('T')[0];
        const actionItem = document.createElement('div');
        actionItem.className = 'action-item';
        actionItem.id = `action-${actionCounter}`;
        actionItem.innerHTML = `
            <i class="ri-delete-bin-line remove-action" style="cursor:pointer; float:right;"></i>
            <div class="row">
                <div class="col-md-8 form-group">
                    <label class="form-label">Descrição da Ação</label>
                    <textarea class="form-control action-description" rows="2" placeholder="Descreva a ação a ser realizada"></textarea>
                </div>
                <div class="col-md-4 form-group">
                    <label class="form-label">Prazo</label>
                    <input type="date" class="form-control action-deadline" min="${todayFormatted}">
                </div>
            </div>
        `;
        document.getElementById('actionsContainer').appendChild(actionItem);
        actionCounter++;
    }

    // Listener para adicionar ação
    if (document.querySelector('.btn-add-action')) {
        document.querySelector('.btn-add-action').addEventListener('click', addNewAction);
    }
    // Listener para remover ação (delegado para o container de ações)
    if (document.getElementById('actionsContainer')) {
        document.getElementById('actionsContainer').addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-action') || (e.target.parentElement && e.target.parentElement.classList.contains('remove-action'))) {
                const actionItem = e.target.closest('.action-item');
                if (actionItem) {
                    actionItem.remove();
                }
            }
        });
    }
}

// Salvar PDI
async function savePDI() {
    if (!validateForm()) {
        return;
    }
    
    showLoader();
    
    const collaborator_id = document.getElementById('collaborator_id').value;
    const supervisor_id = document.getElementById('supervisor_id').value;
    
    // Obter o texto do supervisor selecionado
    const supervisorElement = document.querySelector(`option[value="${supervisor_id}"]`);
    const supervisor_name = supervisorElement ? supervisorElement.textContent : '';
    
    // Coletar ações
    const actions = [];
    document.querySelectorAll('.action-item').forEach(function(item) {
        const description = item.querySelector('.action-description').value;
        const deadline = item.querySelector('.action-deadline').value;
        
        if (description && deadline) {
            actions.push({
                description,
                deadline
            });
        }
    });
    
    // Montar objeto do PDI
    const pdiData = {
        collaborator_id,
        supervisor_id,
        supervisor_name,
        academic_summary: document.getElementById('academic_summary').value,
        who_are_you: document.getElementById('who_are_you').value,
        strengths: document.getElementById('strengths').value,
        improvement_points: document.getElementById('improvement_points').value,
        development_goals: document.getElementById('development_goals').value,
        profile_type: selectedProfileType,
        actions
    };
    
    try {
        // Enviar requisição para criar PDI
        const response = await fetch('/api/pdi-hub/createPDI', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pdiData)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao criar PDI');
        }
        
        const result = await response.json();
        hideLoader();
        
        if (result.success) {
            showSuccessAlert('PDI criado com sucesso!');
            
            // Aguardar um pouco antes de fechar e recarregar a página pai
            setTimeout(() => {
                if (window.opener && !window.opener.closed) {
                    window.opener.location.reload();
                }
                window.close();
            }, 1500);
        } else {
            throw new Error('Erro ao criar PDI');
        }
    } catch (error) {
        console.error('Erro ao salvar PDI:', error);
        hideLoader();
        showErrorAlert('Não foi possível criar o PDI. Tente novamente.');
    }
}

// Validar formulário
function validateForm() {
    let isValid = true;
    
    // Validar campos obrigatórios
    if (!document.getElementById('collaborator_id').value) {
        showWarningAlert('Selecione um colaborador');
        isValid = false;
    }
    
    if (!document.getElementById('supervisor_id').value) {
        showWarningAlert('Selecione um supervisor');
        isValid = false;
    }
    
    if (!selectedProfileType) {
        showWarningAlert('Selecione um tipo de perfil');
        isValid = false;
    }
    
    // Verificar se há pelo menos uma ação
    if (document.querySelectorAll('.action-item').length === 0) {
        showWarningAlert('Adicione pelo menos uma ação ao PDI');
        isValid = false;
    }
    
    // Validar ações
    let hasInvalidAction = false;
    document.querySelectorAll('.action-item').forEach(function(item) {
        const description = item.querySelector('.action-description').value;
        const deadline = item.querySelector('.action-deadline').value;
        
        if (!description && !hasInvalidAction) {
            showWarningAlert('Preencha a descrição de todas as ações');
            hasInvalidAction = true;
            isValid = false;
        }
        
        if (!deadline && !hasInvalidAction) {
            showWarningAlert('Defina o prazo para todas as ações');
            hasInvalidAction = true;
            isValid = false;
        }
    });
    
    return isValid;
}

// Mostrar o loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Esconder o loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Mostrar alerta de erro
function showErrorAlert(message) {
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert não está disponível:', message);
        alert('Erro: ' + message);
        return;
    }
    
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: message,
        confirmButtonColor: 'var(--primary-color)'
    });
}

// Mostrar alerta de sucesso
function showSuccessAlert(message) {
    if (typeof Swal === 'undefined') {
        console.log('Sucesso:', message);
        alert('Sucesso: ' + message);
        return;
    }
    
    Swal.fire({
        icon: 'success',
        title: 'Sucesso',
        text: message,
        confirmButtonColor: 'var(--primary-color)'
    });
}

// Mostrar alerta de aviso
function showWarningAlert(message) {
    if (typeof Swal === 'undefined') {
        console.warn('Aviso:', message);
        alert('Aviso: ' + message);
        return;
    }
    
    Swal.fire({
        icon: 'warning',
        title: 'Aviso',
        text: message,
        confirmButtonColor: 'var(--primary-color)'
    });
}