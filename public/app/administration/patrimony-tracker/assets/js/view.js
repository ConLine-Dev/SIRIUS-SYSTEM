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
        initializeSocket(itemId);
    } else {
        // Mostrar erro se não houver ID
        showError('ID do item não fornecido. Volte para a lista de itens e tente novamente.');
    }
    
    // Configurar handlers para botões de ação
    setupActionButtons();
});

function showLoader(show) {
    if (show) {
        $('#loader2').show();
    } else {
        $('#loader2').fadeOut();
    }
}

// Carregar dados do item
async function fetchItemData(id) {
    showLoader(true);
    try {
        const response = await makeRequest(`/api/patrimony-tracker/items/${id}`);
        currentItem = response;
        console.log('Dados recebidos do item:', currentItem);
        renderItemData();
    } catch (error) {
        console.error('Erro ao buscar dados do item:', error);
        // Idealmente, mostrar uma mensagem de erro na própria página
        $('.card-body').html('<div class="alert alert-danger">Não foi possível carregar os detalhes do item. Tente novamente mais tarde.</div>');
    } finally {
        showLoader(false);
    }
}

// Renderizar os dados do item na interface
function renderItemData() {
    if (!currentItem) return;
    
    // Título da página
    document.title = currentItem.description;
    
    // Informações básicas
    $('#item-code').text(currentItem.code);
    $('#item-status').html(getStatusBadge(currentItem.current_status));
    $('#item-location').text(currentItem.location_name || 'Não definida');
    $('#item-category').text(currentItem.category_name || 'Não definida');
    
    // Detalhes do item
    $('#item-description').text(currentItem.description);
    $('#item-acquisition-date').text(currentItem.acquisition_date);
    $('#item-acquisition-value').text(currentItem.acquisition_value ? `R$ ${parseFloat(currentItem.acquisition_value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-');
    $('#item-notes').text(currentItem.notes || 'Nenhuma nota adicional.');
    
    // Atribuição atual
    if (currentItem.current_assignment) {
        $('#current-assignment-info').removeClass('d-none');
        $('#no-current-assignment').addClass('d-none');
        
        const employee = currentItem.current_assignment;
        
        // Melhora a apresentação do avatar com as iniciais do colaborador
        const avatar = $('#current-assignment-info .avatar');
        const initials = getInitials(employee.employee_name);
        // Substitui o ícone pelas iniciais e ajusta o estilo para melhor visualização
        avatar.empty().text(initials).addClass('fw-bold fs-16'); 
        
        // Informações do colaborador usando os IDs corretos do view.html
        $('#current-employee-name').text(employee.employee_name);
        $('#current-employee-department').text(employee.employee_job_position || 'Cargo não informado');
        $('#current-assignment-date').text(employee.assignment_date);
        $('#current-assignment-notes').text(employee.notes || 'Sem observações.');
    } else {
        $('#current-assignment-info').addClass('d-none');
        $('#no-current-assignment').removeClass('d-none');
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
    const historyBody = $('#assignment-history-table-body');
    historyBody.empty();
    
    if (!currentItem.assignment_history || currentItem.assignment_history.length === 0) {
        // Esconde a tabela e mostra a mensagem de "sem histórico"
        historyBody.closest('.table-responsive').addClass('d-none');
        $('#no-assignment-history').removeClass('d-none');
        return;
    }
    
    // Garante que a tabela está visível e a mensagem, oculta.
    historyBody.closest('.table-responsive').removeClass('d-none');
    $('#no-assignment-history').addClass('d-none');
    
    // Os dados já vêm ordenados do backend. Apenas iteramos e renderizamos.
    currentItem.assignment_history.forEach(assignment => {
        let returnDateDisplay = '-';
        if (assignment.return_date) {
            // Analisa a string de data 'DD/MM/YYYY HH:mm' para um objeto Date
            const parts = assignment.return_date.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
            if (parts) {
                const date = new Date(parts[3], parts[2] - 1, parts[1], parts[4], parts[5]);
                
                // Subtrai 3 horas para ajustar o fuso horário para a exibição
                date.setHours(date.getHours() - 3);

                // Formata a data de volta para o formato 'DD/MM/YYYY HH:mm'
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                returnDateDisplay = `${day}/${month}/${year} ${hours}:${minutes}`;
            } else {
                returnDateDisplay = assignment.return_date; // Fallback se o formato for inesperado
            }
        } else if (assignment.status === 'active') {
            returnDateDisplay = '<span class="badge bg-primary-transparent">Em uso</span>';
        }

        const historyRow = `
            <tr>
                <td>${assignment.employee_name || 'N/A'}</td>
                <td>${assignment.employee_job_position || 'Não informado'}</td>
                <td>${assignment.assignment_date || '-'}</td>
                <td>${returnDateDisplay}</td>
            </tr>
        `;
        historyBody.append(historyRow);
    });
}

// Renderizar log de eventos
function renderEventLog() {
    const logList = $('#event-log-timeline');
    logList.empty();
    
    if (!currentItem.event_log || currentItem.event_log.length === 0) {
        return;
    }
    
    currentItem.event_log.forEach(event => {
        const eventIcon = getEventIcon(event.event_type);
        const eventClass = getEventClass(event.event_type);
        
        let eventDateDisplay = event.event_date; // Fallback
        if (event.event_date) {
            // Analisa a string de data 'DD/MM/YYYY HH:mm:ss'
            const parts = event.event_date.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
                const date = new Date(parts[3], parts[2] - 1, parts[1], parts[4], parts[5], parts[6]);
                
                // Subtrai 3 horas para ajustar o fuso horário
                date.setHours(date.getHours() - 3);

                // Formata a data de volta para o padrão
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                eventDateDisplay = `${day}/${month}/${year} ${hours}:${minutes}`; // Mostra sem os segundos para ficar mais limpo
            }
        }
        
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
                            <small class="text-muted">${eventDateDisplay}</small>
                        </div>
                        <p class="text-muted small mb-0">${event.details || 'Nenhuma anotação fornecida.'}</p>
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
    const status = currentItem.current_status;
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
    if (status === 'maintenance') {
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
        if (currentItem && currentItem.current_status === 'available') {
            showAssignItemModal();
        }
    });
    
    // Registrar devolução
    $('#btn-return-item').click(function(e) {
        e.preventDefault();
        if (currentItem && currentItem.current_status === 'in_use' && currentItem.current_assignment) {
            showReturnItemModal();
        }
    });
    
    // Enviar para manutenção
    $('#btn-send-maintenance').click(function(e) {
        e.preventDefault();
        if (currentItem && ['available', 'in_use', 'damaged'].includes(currentItem.current_status)) {
            showSendToMaintenanceModal();
        }
    });
    
    // Retorno da manutenção
    $('#btn-return-maintenance').click(function(e) {
        e.preventDefault();
        if (currentItem && currentItem.current_status === 'maintenance') {
            showReturnFromMaintenanceModal();
        }
    });
    
    // Marcar como danificado
    $('#btn-mark-damaged').click(function(e) {
        e.preventDefault();
        if (currentItem && ['available', 'in_use'].includes(currentItem.current_status)) {
            showMarkAsDamagedModal();
        }
    });
    
    // Dar baixa/descartar
    $('#btn-discard-item').click(function(e) {
        e.preventDefault();
        if (currentItem && currentItem.current_status !== 'discarded') {
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

function showSendToMaintenanceModal() {
    showInputModal(
        'Enviar para Manutenção',
        'Informe o motivo do envio para manutenção:',
        'Ex: Tela quebrada, não liga, etc.',
        'Confirmar Envio',
        async (notes) => {
            try {
                await makeRequest(`/api/patrimony-tracker/items/${currentItem.id}/maintenance/send`, 'POST', { notes });
                showSuccess('Item enviado para manutenção com sucesso!');
                fetchItemData(currentItem.id);
            } catch (error) {
                showError(error.responseJSON?.message || 'Erro ao enviar para manutenção.');
            }
        }
    );
}

function showReturnFromMaintenanceModal() {
    showInputModal(
        'Retornar da Manutenção',
        'Descreva o que foi feito no item:',
        'Ex: Tela trocada, sistema reinstalado, etc.',
        'Confirmar Retorno',
        async (notes) => {
            try {
                await makeRequest(`/api/patrimony-tracker/items/${currentItem.id}/maintenance/return`, 'POST', { notes });
                showSuccess('Item retornado da manutenção com sucesso!');
                fetchItemData(currentItem.id);
            } catch (error) {
                showError(error.responseJSON?.message || 'Erro ao retornar da manutenção.');
            }
        }
    );
}

function showMarkAsDamagedModal() {
    showInputModal(
        'Marcar como Danificado',
        'Descreva o dano apresentado pelo item:',
        'Ex: Riscos na carcaça, botão quebrado, etc.',
        'Confirmar Dano',
        async (notes) => {
            try {
                await makeRequest(`/api/patrimony-tracker/items/${currentItem.id}/damage`, 'POST', { notes });
                showSuccess('Item marcado como danificado!');
                fetchItemData(currentItem.id);
            } catch (error) {
                showError(error.responseJSON?.message || 'Erro ao marcar como danificado.');
            }
        }
    );
}

function showDiscardItemModal() {
    showInputModal(
        'Descartar/Baixar Item',
        'Informe o motivo do descarte:',
        'Ex: Obsoleto, sem conserto, etc.',
        'Confirmar Descarte',
        async (notes) => {
            if (!notes) {
                showError('O motivo do descarte é obrigatório.');
                return;
            }
            try {
                await makeRequest(`/api/patrimony-tracker/items/${currentItem.id}/discard`, 'POST', { notes });
                showSuccess('Item descartado com sucesso!');
                fetchItemData(currentItem.id);
            } catch (error) {
                showError(error.responseJSON?.message || 'Erro ao descartar item.');
            }
        }
    );
}

function showReturnItemModal() {
    showInputModal(
        'Registrar Devolução',
        'Adicione observações sobre a devolução (opcional):',
        'Ex: Devolvido com todos os acessórios.',
        'Confirmar Devolução',
        async (notes) => {
            try {
                await makeRequest(`/api/patrimony-tracker/items/${currentItem.id}/return`, 'POST', { notes });
                showSuccess('Devolução registrada com sucesso!');
                fetchItemData(currentItem.id);
            } catch (error) {
                showError(error.responseJSON?.message || 'Erro ao registrar devolução.');
            }
        }
    );
}

function showInputModal(title, message, placeholder, confirmBtnText, onConfirm) {
    $('.modal').remove();
    const modalHtml = `
        <div class="modal fade" id="input-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                        <textarea id="input-modal-value" class="form-control" rows="3" placeholder="${placeholder}"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btn-confirm-input">${confirmBtnText}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    $('body').append(modalHtml);
    const modalInstance = new bootstrap.Modal(document.getElementById('input-modal'));
    
    $('#btn-confirm-input').click(async function() {
        const value = $('#input-modal-value').val();
        const button = $(this);
        button.prop('disabled', true).html('<i class="ri-loader-4-line fa-spin"></i>');
        
        await onConfirm(value);
        
        button.prop('disabled', false).html(confirmBtnText);
        modalInstance.hide();
    });

    modalInstance.show();
}

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
                                <input type="datetime-local" class="form-control" id="assign-date" required>
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
    
    // Preenche o campo com a data e hora atuais locais
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('#assign-date').val(now.toISOString().slice(0, 16));
    
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
            const jobTitle = employee.job_position ? `(${employee.job_position})` : '';
            select.append(`<option value="${employee.id}">${employee.name} ${jobTitle}</option>`);
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
        'maintenance': 'Em Manutenção',
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
        'maintenance': 'bg-warning-transparent',
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
        'maintenance_start': 'ri-tools-line',
        'maintenance_end': 'ri-tools-fill',
        'damaged': 'ri-error-warning-line',
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
        'maintenance_start': 'bg-warning',
        'maintenance_end': 'bg-warning',
        'damaged': 'bg-danger',
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
        'maintenance_start': 'Enviado para Manutenção',
        'maintenance_end': 'Retornado da Manutenção',
        'damaged': 'Marcado como Danificado',
        'discarded': 'Dado Baixa/Descartado',
        'audited': 'Auditoria Realizada'
    };
    
    return textMap[eventType] || eventType;
}

function getStatusBadge(status) {
    const statusMap = {
        'available': { text: 'Disponível', class: 'bg-success-transparent' },
        'in_use': { text: 'Em Uso', class: 'bg-primary-transparent' },
        'maintenance': { text: 'Em Manutenção', class: 'bg-warning-transparent' },
        'damaged': { text: 'Danificado', class: 'bg-danger-transparent' },
        'discarded': { text: 'Baixado', class: 'bg-secondary-transparent' }
    };
    const { text = 'Desconhecido', class: badgeClass = 'bg-light' } = statusMap[status] || {};
    return `<span class="badge ${badgeClass}">${text}</span>`;
}

/**
 * Inicializa a conexão com o Socket.io e os listeners.
 * @param {number} itemId - O ID do item que está sendo visualizado.
 */
function initializeSocket(itemId) {
    const socket = io();

    // Evento para quando um item é atualizado
    socket.on('patrimony:item_updated', (updatedItem) => {
        // Verifica se o item atualizado é o que está sendo exibido na página
        if (updatedItem && updatedItem.id === itemId) {
            console.log('Item atualizado recebido via socket:', updatedItem);
            showToast(`Os dados do item ${updatedItem.code} foram atualizados em tempo real.`);
            // Atualiza a variável global e re-renderiza todos os dados na tela
            currentItem = updatedItem;
            renderItemData();
        }
    });

    // Evento para quando as opções (categorias, localizações) mudam.
    // Embora não sejam exibidas diretamente, é bom para consistência e pode ser útil no futuro.
    socket.on('patrimony:options_changed', () => {
        console.log('Opções de patrimônio foram atualizadas.');
        // No futuro, se houver modais de edição nesta página, aqui seria o local para recarregar as opções.
    });
}

/**
 * Extrai o ID do item da URL.
 */
function getItemIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
} 