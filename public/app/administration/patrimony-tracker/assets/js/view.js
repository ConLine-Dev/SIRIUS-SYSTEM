// Variáveis globais
let currentItem = null;

// Inicialização da página
$(document).ready(function() {
    // Obter ID do item da URL
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    
    if (itemId) {
        // Carregar dados do item
        fetchItemData(itemId);
    } else {
        // Mostrar erro se não houver ID
        showError('ID do item não fornecido. Volte para a lista de itens e tente novamente.');
    }
    
    // Configurar handlers para botões de ação
    setupActionButtons();
});

// Carregar dados do item
async function fetchItemData(id) {
    try {
        // Fazer requisição para a API
        const response = await makeRequest(`/api/patrimony-tracker/items/${id}`);
        currentItem = response;
        
        // Preencher os dados na interface
        renderItemData();
    } catch (error) {
        console.error('Erro ao buscar dados do item:', error);
        showError('Não foi possível carregar os detalhes do item. Tente novamente mais tarde.');
    }
}

// Renderizar os dados do item na interface
function renderItemData() {
    if (!currentItem) return;
    
    // Título da página
    $('#item-title').text(currentItem.description);
    
    // Informações básicas
    $('#item-code').text(currentItem.code);
    $('#item-status').text(getStatusText(currentItem.status));
    $('#item-status').addClass(getStatusBadgeClass(currentItem.status));
    $('#item-location').text(currentItem.location);
    
    // Detalhes do item
    $('#item-description').text(currentItem.description);
    $('#item-acquisition-date').text(currentItem.acquisition_date);
    $('#item-notes').text(currentItem.notes || 'Nenhuma nota adicional.');
    
    // Atribuição atual
    if (currentItem.current_assignment) {
        $('#current-assignment-container').removeClass('d-none');
        $('#no-assignment-container').addClass('d-none');
        
        const employee = currentItem.current_assignment;
        
        // Iniciais para o avatar
        const initials = getInitials(employee.employee_name);
        $('#employee-initials').text(initials);
        
        // Informações do colaborador
        $('#employee-name').text(employee.employee_name);
        $('#employee-department').text(employee.employee_department);
        $('#assignment-date').text(employee.assignment_date);
        $('#assignment-notes').text(employee.notes || 'Sem observações.');
    } else {
        $('#current-assignment-container').addClass('d-none');
        $('#no-assignment-container').removeClass('d-none');
    }
    
    // Histórico de atribuições
    renderAssignmentHistory();
    
    // Log de eventos
    renderEventLog();
    
    // Ajustar botões de ação com base no estado atual do item
    updateActionButtons();
}

// Renderizar histórico de atribuições
function renderAssignmentHistory() {
    const historyList = $('#assignment-history-list');
    historyList.empty();
    
    if (!currentItem.assignment_history || currentItem.assignment_history.length === 0) {
        $('#assignment-history-container').addClass('d-none');
        $('#no-assignment-history').removeClass('d-none');
        return;
    }
    
    $('#assignment-history-container').removeClass('d-none');
    $('#no-assignment-history').addClass('d-none');
    
    // Ordenar por data de atribuição (mais recente primeiro)
    const sortedHistory = [...currentItem.assignment_history].sort((a, b) => {
        // Converter datas para objetos Date para comparação
        const dateA = a.assignment_date ? new Date(a.assignment_date.split('/').reverse().join('-')) : new Date(0);
        const dateB = b.assignment_date ? new Date(b.assignment_date.split('/').reverse().join('-')) : new Date(0);
        return dateB - dateA;
    });
    
    sortedHistory.forEach(assignment => {
        const isActive = !assignment.return_date;
        const statusClass = isActive ? 'border-start border-primary border-3' : '';
        const statusBadge = isActive 
            ? '<span class="badge bg-primary-transparent">Atual</span>' 
            : '';
        
        const historyItem = `
            <li class="list-group-item p-3 ${statusClass}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${assignment.employee_name}</h6>
                    ${statusBadge}
                </div>
                <p class="small text-muted mb-1">${assignment.employee_department}</p>
                <p class="small mb-1">
                    <i class="ri-calendar-check-line text-primary me-1"></i> 
                    <strong>Atribuído em:</strong> ${assignment.assignment_date}
                </p>
                ${assignment.return_date ? `
                <p class="small mb-1">
                    <i class="ri-calendar-close-line text-danger me-1"></i>
                    <strong>Devolvido em:</strong> ${assignment.return_date}
                </p>` : ''}
                ${assignment.notes ? `
                <p class="small mb-0">
                    <i class="ri-file-text-line text-muted me-1"></i>
                    <strong>Observações:</strong> ${assignment.notes}
                </p>` : ''}
            </li>
        `;
        
        historyList.append(historyItem);
    });
}

// Renderizar log de eventos
function renderEventLog() {
    const logList = $('#event-log-list');
    logList.empty();
    
    if (!currentItem.event_log || currentItem.event_log.length === 0) {
        return;
    }
    
    currentItem.event_log.forEach(event => {
        const eventIcon = getEventIcon(event.event_type);
        const eventClass = getEventClass(event.event_type);
        
        const logItem = `
            <li class="list-group-item p-3">
                <div class="d-flex">
                    <div class="flex-shrink-0 me-3">
                        <span class="avatar avatar-sm ${eventClass} rounded-circle">
                            <i class="${eventIcon}"></i>
                        </span>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">${getEventText(event.event_type)}</h6>
                            <small class="text-muted">${event.event_date}</small>
                        </div>
                        <p class="text-muted small mb-0">${event.details}</p>
                    </div>
                </div>
            </li>
        `;
        
        logList.append(logItem);
    });
}

// Atualizar botões de ação com base no estado atual do item
function updateActionButtons() {
    // Verificar o status atual do item
    const status = currentItem.status;
    const hasAssignment = !!currentItem.current_assignment;
    
    // Botão de atribuir a colaborador
    if (status === 'available') {
        $('#btn-assign-item').parent().removeClass('disabled');
    } else {
        $('#btn-assign-item').parent().addClass('disabled');
    }
    
    // Botão de registrar devolução
    if (hasAssignment && status === 'in_use') {
        $('#btn-return-item').parent().removeClass('disabled');
    } else {
        $('#btn-return-item').parent().addClass('disabled');
    }
    
    // Botão de enviar para manutenção
    if (status === 'available' || status === 'in_use' || status === 'damaged') {
        $('#btn-send-maintenance').parent().removeClass('disabled');
    } else {
        $('#btn-send-maintenance').parent().addClass('disabled');
    }
    
    // Botão de retorno da manutenção
    if (status === 'in_maintenance') {
        $('#btn-return-maintenance').parent().removeClass('disabled');
    } else {
        $('#btn-return-maintenance').parent().addClass('disabled');
    }
    
    // Botão de marcar como danificado
    if (status === 'available' || status === 'in_use') {
        $('#btn-mark-damaged').parent().removeClass('disabled');
    } else {
        $('#btn-mark-damaged').parent().addClass('disabled');
    }
    
    // Botão de baixa/descarte
    if (status !== 'discarded') {
        $('#btn-discard-item').parent().removeClass('disabled');
    } else {
        $('#btn-discard-item').parent().addClass('disabled');
    }
}

// Configurar handlers para botões de ação
function setupActionButtons() {
    // Editar item
    $('#btn-edit-item').click(function(e) {
        e.preventDefault();
        if (currentItem) {
            window.location.href = `edit.html?id=${currentItem.id}`;
        }
    });
    
    // Atribuir a colaborador
    $('#btn-assign-item').click(function(e) {
        e.preventDefault();
        if (currentItem && currentItem.status === 'available') {
            showAssignItemModal();
        }
    });
    
    // Registrar devolução
    $('#btn-return-item').click(function(e) {
        e.preventDefault();
        if (currentItem && currentItem.status === 'in_use' && currentItem.current_assignment) {
            showReturnItemModal();
        }
    });
    
    // Enviar para manutenção
    $('#btn-send-maintenance').click(function(e) {
        e.preventDefault();
        if (currentItem && ['available', 'in_use', 'damaged'].includes(currentItem.status)) {
            showSendToMaintenanceModal();
        }
    });
    
    // Retorno da manutenção
    $('#btn-return-maintenance').click(function(e) {
        e.preventDefault();
        if (currentItem && currentItem.status === 'in_maintenance') {
            showReturnFromMaintenanceModal();
        }
    });
    
    // Marcar como danificado
    $('#btn-mark-damaged').click(function(e) {
        e.preventDefault();
        if (currentItem && ['available', 'in_use'].includes(currentItem.status)) {
            showMarkAsDamagedModal();
        }
    });
    
    // Dar baixa/descartar
    $('#btn-discard-item').click(function(e) {
        e.preventDefault();
        if (currentItem && currentItem.status !== 'discarded') {
            showDiscardItemModal();
        }
    });
    
    // Auditoria inteligente
    $('#btn-audit-item').click(function(e) {
        e.preventDefault();
        if (currentItem) {
            performAuditItem();
        }
    });
}

// Realizar auditoria inteligente
async function performAuditItem() {
    try {
        // Alterar o botão para indicar processo
        const auditButton = $('#btn-audit-item');
        const originalText = auditButton.html();
        auditButton.prop('disabled', true);
        auditButton.html('<i class="ri-loader-4-line fa-spin me-1"></i> Analisando...');
        
        // Fazer requisição para a API
        const response = await makeRequest(`/api/patrimony-tracker/items/${currentItem.id}/audit`, 'POST');
        
        // Mostrar resultado da auditoria
        showAuditResultModal(response.audit_result);
        
        // Recarregar os dados do item para atualizar o log de eventos
        fetchItemData(currentItem.id);
    } catch (error) {
        console.error('Erro ao realizar auditoria:', error);
        showError('Não foi possível realizar a auditoria. Tente novamente mais tarde.');
    } finally {
        // Restaurar o botão
        const auditButton = $('#btn-audit-item');
        auditButton.prop('disabled', false);
        auditButton.html('<i class="ri-ai-generate me-1"></i> Auditoria');
    }
}

// Funções para exibir modais de ação

// Modal para atribuir item a colaborador
function showAssignItemModal() {
    // Remover qualquer modal existente
    $('.modal').remove();
    
    // Criar o modal
    const modal = $(`
        <div class="modal fade" id="assign-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Atribuir Item a Colaborador</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="assign-form">
                            <div class="mb-3">
                                <label for="assign-employee" class="form-label">Colaborador</label>
                                <select class="form-select" id="assign-employee" required></select>
                            </div>
                            <div class="mb-3">
                                <label for="assign-date" class="form-label">Data de Atribuição</label>
                                <input type="date" class="form-control" id="assign-date" required>
                            </div>
                            <div class="mb-3">
                                <label for="assign-notes" class="form-label">Observações</label>
                                <textarea class="form-control" id="assign-notes" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btn-confirm-assign">Atribuir</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    // Adicionar o modal ao corpo da página
    $('body').append(modal);
    
    // Carregar opções de colaboradores
    loadEmployeeOptions('#assign-employee');
    
    // Preencher a data atual
    $('#assign-date').val(new Date().toISOString().split('T')[0]);
    
    // Mostrar o modal
    const modalInstance = new bootstrap.Modal(document.getElementById('assign-modal'));
    modalInstance.show();
    
    // Configurar o botão de confirmação
    $('#btn-confirm-assign').click(async function() {
        if (!$('#assign-form')[0].checkValidity()) {
            $('#assign-form')[0].reportValidity();
            return;
        }
        
        const assignData = {
            employee_id: $('#assign-employee').val(),
            assignment_date: $('#assign-date').val(),
            notes: $('#assign-notes').val()
        };
        
        try {
            // Desabilitar botão e mostrar indicador de carregamento
            const button = $(this);
            button.prop('disabled', true);
            button.html('<i class="ri-loader-4-line fa-spin me-1"></i> Processando...');
            
            // Fazer requisição para a API
            await makeRequest(`/api/patrimony-tracker/items/${currentItem.id}/assign`, 'POST', assignData);
            
            // Fechar o modal
            modalInstance.hide();
            
            // Recarregar os dados do item
            fetchItemData(currentItem.id);
            
            // Mostrar mensagem de sucesso
            showSuccess('Item atribuído com sucesso!');
        } catch (error) {
            console.error('Erro ao atribuir item:', error);
            
            // Mostrar mensagem de erro
            const errorMessage = error.responseJSON?.message || 'Ocorreu um erro ao atribuir o item. Tente novamente.';
            showError(errorMessage);
            
            // Restaurar o botão
            button.prop('disabled', false);
            button.html('Atribuir');
        }
    });
}

// Função para mostrar erro
function showError(message) {
    alert(message);
}

// Função para mostrar sucesso
function showSuccess(message) {
    alert(message);
}

// Carregar opções de colaboradores
async function loadEmployeeOptions(selectSelector) {
    try {
        const response = await makeRequest('/api/patrimony-tracker/options');
        const options = await response;
        
        const select = $(selectSelector);
        select.empty();
        select.append('<option value="">Selecione um colaborador...</option>');
        
        options.employees.forEach(employee => {
            select.append(`<option value="${employee.id}">${employee.name} (${employee.department})</option>`);
        });
    } catch (error) {
        console.error('Erro ao carregar opções de colaboradores:', error);
        showError('Não foi possível carregar a lista de colaboradores.');
    }
}

// Funções auxiliares

// Obter texto do status
function getStatusText(status) {
    const statusMap = {
        'available': 'Disponível',
        'in_use': 'Em Uso',
        'in_maintenance': 'Em Manutenção',
        'damaged': 'Danificado',
        'discarded': 'Baixado/Descartado'
    };
    
    return statusMap[status] || status;
}

// Obter classe CSS para o status
function getStatusBadgeClass(status) {
    const classMap = {
        'available': 'bg-success-transparent',
        'in_use': 'bg-primary-transparent',
        'in_maintenance': 'bg-warning-transparent',
        'damaged': 'bg-danger-transparent',
        'discarded': 'bg-dark-transparent'
    };
    
    return classMap[status] || 'bg-secondary-transparent';
}

// Obter iniciais de um nome
function getInitials(name) {
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

// Obter ícone para tipo de evento
function getEventIcon(eventType) {
    const iconMap = {
        'created': 'ri-file-add-line',
        'updated': 'ri-edit-line',
        'assigned': 'ri-user-add-line',
        'returned': 'ri-user-received-2-line',
        'sent_to_maintenance': 'ri-tools-line',
        'returned_from_maintenance': 'ri-tools-fill',
        'marked_damaged': 'ri-error-warning-line',
        'discarded': 'ri-delete-bin-line',
        'audited': 'ri-ai-generate'
    };
    
    return iconMap[eventType] || 'ri-question-line';
}

// Obter classe CSS para tipo de evento
function getEventClass(eventType) {
    const classMap = {
        'created': 'bg-success',
        'updated': 'bg-info',
        'assigned': 'bg-primary',
        'returned': 'bg-secondary',
        'sent_to_maintenance': 'bg-warning',
        'returned_from_maintenance': 'bg-warning',
        'marked_damaged': 'bg-danger',
        'discarded': 'bg-dark',
        'audited': 'bg-info'
    };
    
    return classMap[eventType] || 'bg-secondary';
}

// Obter texto para tipo de evento
function getEventText(eventType) {
    const textMap = {
        'created': 'Item Cadastrado',
        'updated': 'Informações Atualizadas',
        'assigned': 'Atribuído a Colaborador',
        'returned': 'Devolvido por Colaborador',
        'sent_to_maintenance': 'Enviado para Manutenção',
        'returned_from_maintenance': 'Retornado da Manutenção',
        'marked_damaged': 'Marcado como Danificado',
        'discarded': 'Dado Baixa/Descartado',
        'audited': 'Auditoria Realizada'
    };
    
    return textMap[eventType] || eventType;
} 