// Armazena todos os itens para filtros do lado do cliente
let allItems = [];
let formOptions = {}; // Armazenar opções de selects (locations, employees, etc.)
let currentViewMode = 'table'; // 'table', 'cards', ou 'grouped'

// Configuração inicial e carregamento de dados
$(document).ready(function() {
    // Inicializar modo de visualização
    setupViewModes();
    
    // Configurar eventos de filtro
    setupFilters();
    
    // Carregar dados dos itens
    loadItems();
    
    // Configurar evento global para os dropdowns de ações
    setupActionDropdowns();
});

// Adicionada função para gerenciar o loader
function showLoader(show) {
    if (show) {
        $('#loader2').show();
    } else {
        $('#loader2').fadeOut(); // Usando fadeOut para uma transição suave
    }
}

// Configurar eventos para os dropdowns de ações
function setupActionDropdowns() {
    // Delegação de eventos para lidar com os itens carregados dinamicamente
    $(document).on('click', '.dropdown-item-action', function(e) {
        e.preventDefault();
        
        const actionType = $(this).data('action');
        const itemId = $(this).closest('.dropdown-menu').data('item-id');
        
        handleItemAction(actionType, itemId);
    });
}

// Função para tratar as ações nos itens
function handleItemAction(actionType, itemId) {
    switch(actionType) {
        case 'view':
            viewItem(itemId);
            break;
        case 'edit':
            editItem(itemId);
            break;
        case 'assign':
            openAssignDialog(itemId);
            break;
        case 'return':
            confirmReturn(itemId);
            break;
        case 'maintenance':
            confirmMaintenance(itemId);
            break;
        case 'return_from_maintenance':
            confirmReturnFromMaintenance(itemId);
            break;
        case 'damage':
            confirmDamage(itemId);
            break;
        case 'discard':
            confirmDiscard(itemId);
            break;
        case 'audit':
            openAuditDialog(itemId);
            break;
        default:
            console.error('Ação desconhecida:', actionType);
    }
}

// Funções para gerenciar as ações disponíveis com base no status do item
function getAvailableActions(item) {
    const actions = [];
    
    // Ações básicas disponíveis para todos os itens
    actions.push({ id: 'view', label: 'Visualizar', icon: 'ri-eye-line', class: 'text-primary' });
    
    // Apenas itens não descartados podem ser editados
    if (item.status !== 'discarded') {
        actions.push({ id: 'edit', label: 'Editar', icon: 'ri-edit-line', class: 'text-info' });
    }
    
    // Ações específicas baseadas no status
    switch (item.status) {
        case 'available':
            actions.push({ id: 'assign', label: 'Atribuir', icon: 'ri-user-add-line', class: 'text-success' });
            actions.push({ id: 'maintenance', label: 'Enviar para Manutenção', icon: 'ri-tools-line', class: 'text-warning' });
            actions.push({ id: 'damage', label: 'Marcar como Danificado', icon: 'ri-error-warning-line', class: 'text-danger' });
            actions.push({ id: 'discard', label: 'Descartar/Baixar', icon: 'ri-delete-bin-line', class: 'text-danger' });
            break;
            
        case 'in_use':
            actions.push({ id: 'return', label: 'Devolver', icon: 'ri-arrow-go-back-line', class: 'text-success' });
            actions.push({ id: 'maintenance', label: 'Enviar para Manutenção', icon: 'ri-tools-line', class: 'text-warning' });
            actions.push({ id: 'damage', label: 'Marcar como Danificado', icon: 'ri-error-warning-line', class: 'text-danger' });
            break;
            
        case 'maintenance':
            actions.push({ id: 'return_from_maintenance', label: 'Retornar da Manutenção', icon: 'ri-arrow-go-back-line', class: 'text-success' });
            actions.push({ id: 'damage', label: 'Marcar como Danificado', icon: 'ri-error-warning-line', class: 'text-danger' });
            break;
            
        case 'damaged':
            actions.push({ id: 'maintenance', label: 'Enviar para Manutenção', icon: 'ri-tools-line', class: 'text-warning' });
            actions.push({ id: 'discard', label: 'Descartar/Baixar', icon: 'ri-delete-bin-line', class: 'text-danger' });
            break;
    }
    
    // Auditoria disponível para todos os itens, exceto descartados
    if (item.status !== 'discarded') {
        actions.push({ id: 'audit', label: 'Auditoria IA', icon: 'ri-robot-line', class: 'text-primary' });
    }
    
    return actions;
}

// Criar HTML para dropdown de ações
function createActionsDropdown(item) {
    const actions = getAvailableActions(item);
    
    let dropdownHtml = `
        <div class="dropdown d-inline-block">
            <button class="btn btn-sm btn-light btn-action" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="ri-more-2-fill"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" data-item-id="${item.id}" style="min-width: 200px;">
    `;
    
    actions.forEach(action => {
        dropdownHtml += `
            <li><a class="dropdown-item dropdown-item-action d-flex align-items-center" href="#" data-action="${action.id}">
                <i class="${action.icon} me-2 ${action.class}"></i><span class="text-nowrap">${action.label}</span>
            </a></li>
        `;
    });
    
    dropdownHtml += `
            </ul>
        </div>
    `;
    
    return dropdownHtml;
}

// Função para abrir janela pop-up
function openPopup(url) {
    // Definir limites mínimos e máximos para o tamanho da janela
    const minWidth = 1024;
    const minHeight = 700;
    const maxWidth = 1307;
    const maxHeight = 748;

    // Calcular o tamanho ideal como 85% da tela disponível
    const idealWidth = screen.availWidth * 0.85;
    const idealHeight = screen.availHeight * 0.85;

    // Garantir que o tamanho final esteja dentro dos limites definidos
    const finalWidth = Math.max(minWidth, Math.min(idealWidth, maxWidth));
    const finalHeight = Math.max(minHeight, Math.min(idealHeight, maxHeight));

    // Calcular a posição para centralizar a janela
    const left = (screen.availWidth - finalWidth) / 2;
    const top = (screen.availHeight - finalHeight) / 2;

    // Abrir a janela com as dimensões e posição calculadas
    window.open(url, 'popup', `width=${finalWidth},height=${finalHeight},left=${left},top=${top}`);
}

// Funções para abrir as janelas de gerenciamento
function openCreateItem() {
    openPopup('create.html');
}

function viewItem(id) {
    openPopup(`view.html?id=${id}`);
}

function editItem(id) {
    openPopup(`edit.html?id=${id}`);
}

// Funções para gerenciar os modos de visualização
function setupViewModes() {
    $('#btn-view-table').click(function() {
        setViewMode('table');
    });
    
    $('#btn-view-cards').click(function() {
        setViewMode('cards');
    });
    
    $('#btn-view-grouped').click(function() {
        setViewMode('grouped');
    });
}

function setViewMode(mode) {
    // Ocultar todas as visualizações
    $('.view-container').addClass('d-none');
    
    // Remover a classe active de todos os botões
    $('.btn-group button').removeClass('active');
    
    // Mostrar a visualização selecionada e marcar o botão correspondente
    currentViewMode = mode;
    
    if (mode === 'table') {
        $('#table-view').removeClass('d-none');
        $('#btn-view-table').addClass('active');
    } else if (mode === 'cards') {
        $('#cards-view').removeClass('d-none');
        $('#btn-view-cards').addClass('active');
    } else if (mode === 'grouped') {
        $('#grouped-view').removeClass('d-none');
        $('#btn-view-grouped').addClass('active');
    }
    
    // Renderizar os itens no modo selecionado
    renderItems(allItems);
}

// Configuração de filtros
function setupFilters() {
    // Evento de entrada para o campo de busca
    $('#filter-keyword').on('input', function() {
        applyFilters();
    });
    
    // Eventos de mudança para os selects
    $('#filter-location, #filter-status, #filter-employee').on('change', function() {
        applyFilters();
    });
    
    // Botão para limpar filtros
    $('#btn-clear-filters').click(function() {
        $('#filter-keyword').val('');
        $('#filter-location, #filter-status, #filter-employee').val('');
        applyFilters();
    });
}

// Atualizar contagem de itens no display
function updateItemsCount(count) {
    const label = count === 1 ? 'item encontrado' : 'itens encontrados';
    $('#items-count-display').text(`${count} ${label}`);
}

// Aplicar filtros aos itens
function applyFilters() {
    const keyword = $('#filter-keyword').val().toLowerCase();
    const location = $('#filter-location').val();
    const status = $('#filter-status').val();
    const employee = $('#filter-employee').val();
    
    let filteredItems = allItems.filter(item => {
        // Filtro por palavra-chave (código ou descrição)
        const keywordMatch = keyword === '' || 
            item.code.toLowerCase().includes(keyword) || 
            item.description.toLowerCase().includes(keyword);
        
        // Filtro por localização
        const locationMatch = location === '' || item.location === location;
        
        // Filtro por status
        const statusMatch = status === '' || item.status === status;
        
        // Filtro por colaborador (atribuição atual)
        let employeeMatch = true;
        if (employee !== '') {
            employeeMatch = item.current_assignment && 
                item.current_assignment.employee_id.toString() === employee;
        }
        
        return keywordMatch && locationMatch && statusMatch && employeeMatch;
    });
    
    // Atualizar contador de itens
    updateItemsCount(filteredItems.length);
    
    renderItems(filteredItems);
}

// Carregar itens do servidor
async function loadItems() {
    showLoader(true);
    try {
        const data = await makeRequest('/api/patrimony-tracker/items');
        if (data && Array.isArray(data)) {
            allItems = data;
            renderItems(allItems);
            updateItemsCount(allItems.length);

            // Carregar e armazenar opções dos filtros com base nos dados
            formOptions = await makeRequest('/api/patrimony-tracker/options');
            populateFilterOptions(formOptions);

        } else {
            console.error('Dados recebidos não são válidos:', data);
            renderEmptyState();
        }
    } catch (error) {
        console.error('Erro ao carregar itens:', error);
        renderErrorState();
    } finally {
        showLoader(false);
    }
}

// Preencher as opções de filtro
function populateFilterOptions(options) {
    // Preencher select de localização
    const locationSelect = $('#filter-location');
    locationSelect.empty();
    locationSelect.append('<option value="">Todas as localizações</option>');
    options.locations.forEach(location => {
        locationSelect.append(`<option value="${location.name}">${location.name}</option>`);
    });
    
    // Preencher select de status
    const statusSelect = $('#filter-status');
    statusSelect.empty();
    statusSelect.append('<option value="">Todos os estados</option>');
    options.statuses.forEach(status => {
        statusSelect.append(`<option value="${status.id}">${status.name}</option>`);
    });
    
    // Preencher select de colaborador
    const employeeSelect = $('#filter-employee');
    employeeSelect.empty();
    employeeSelect.append('<option value="">Todos os colaboradores</option>');
    options.employees.forEach(employee => {
        const jobTitle = employee.job_position ? `(${employee.job_position})` : '';
        employeeSelect.append(`<option value="${employee.id}">${employee.name} ${jobTitle}</option>`);
    });
}

// Renderizar a tela de boas-vindas quando não há itens
function renderWelcomeState() {
    const filters = $('.card-body > .row.g-3.align-items-end');
    filters.hide(); // Esconde os filtros
    
    const viewModeControls = $('.d-flex.justify-content-end.mb-3');
    viewModeControls.hide(); // Esconde os controles de modo de visualização
    
    // Ocultar todas as visualizações
    $('.view-container').addClass('d-none');
    
    // Adicionar mensagem de boas-vindas
    const welcomeHtml = `
        <div class="text-center p-5">
            <div class="mb-4">
                <i class="ri-archive-line" style="font-size: 5rem; color: #17a2b8;"></i>
            </div>
            <h3 class="mb-3">Bem-vindo ao Gerenciamento de Patrimônio</h3>
            <p class="text-muted mb-4">Ainda não há itens cadastrados. Comece agora mesmo!</p>
            <button class="btn btn-primary btn-lg" onclick="openCreateItem()">
                <i class="ri-add-circle-line me-2"></i>Cadastrar seu primeiro item
            </button>
        </div>
    `;
    
    $('#table-view').removeClass('d-none').html(welcomeHtml);
}

// Renderizar os itens no modo atual
function renderItems(items) {
    if (items.length === 0) {
        renderEmptyState();
        return;
    }
    
    if (currentViewMode === 'table') {
        renderTableView(items);
    } else if (currentViewMode === 'cards') {
        renderCardsView(items);
    } else if (currentViewMode === 'grouped') {
        renderGroupedView(items);
    }
}

// Mostrar mensagem quando não há itens correspondentes aos filtros
function renderEmptyState() {
    const emptyMessage = `
        <div class="text-center p-5">
            <i class="ri-inbox-line display-4 text-muted mb-3"></i>
            <h4 class="text-muted">Nenhum item encontrado</h4>
            <p class="text-muted">Tente ajustar os filtros ou adicione novos itens.</p>
        </div>
    `;
    
    $('#table-view').html(emptyMessage);
    $('#cards-view').html(emptyMessage);
    $('#grouped-view').html(emptyMessage);
}

function renderErrorState() {
    const errorMessage = `
        <div class="text-center p-5">
            <i class="ri-error-warning-line display-4 text-danger mb-3"></i>
            <h4 class="text-danger">Ocorreu um Erro</h4>
            <p class="text-muted">Não foi possível carregar os itens do servidor. Por favor, tente novamente mais tarde.</p>
        </div>
    `;
    
    $('#table-view').html(errorMessage);
    $('#cards-view').html(errorMessage);
    $('#grouped-view').html(errorMessage);
}

// Visualização em tabela
function renderTableView(items) {
    let tableHtml = `
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Localização</th>
                        <th>Estado</th>
                        <th>Colaborador</th>
                        <th>Data Aquisição</th>
                        <th class="text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    items.forEach(item => {
        tableHtml += `
            <tr>
                <td><span class="fw-medium">${item.code}</span></td>
                <td>${item.description}</td>
                <td>${item.location}</td>
                <td>${getStatusBadge(item.status)}</td>
                <td>${item.current_assignment ? item.current_assignment.employee_name : '-'}</td>
                <td>${item.acquisition_date}</td>
                <td class="text-center">
                    ${createActionsDropdown(item)}
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    $('#table-view').html(tableHtml);
}

// Visualização em cards
function renderCardsView(items) {
    let cardsHtml = '<div class="row">';
    
    items.forEach(item => {
        const statusClass = getStatusClass(item.status);
        const statusText = getStatusText(item.status);
        
        cardsHtml += `
            <div class="col-md-4 col-lg-3 mb-4">
                <div class="card h-100 border-${statusClass}">
                    <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
                        <span class="badge bg-${statusClass}">${statusText}</span>
                        ${createActionsDropdown(item)}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title mb-1">${item.code}</h5>
                        <p class="text-muted mb-3">${item.description}</p>
                        
                        <div class="d-flex justify-content-between mb-2">
                            <small class="text-muted"><i class="ri-map-pin-line me-1"></i> Localização</small>
                            <span>${item.location}</span>
                        </div>
                        
                        <div class="d-flex justify-content-between mb-2">
                            <small class="text-muted"><i class="ri-user-line me-1"></i> Colaborador</small>
                            <span>${item.current_assignment ? item.current_assignment.employee_name : '-'}</span>
                        </div>
                        
                        <div class="d-flex justify-content-between">
                            <small class="text-muted"><i class="ri-calendar-line me-1"></i> Aquisição</small>
                            <span>${item.acquisition_date}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    cardsHtml += '</div>';
    
    $('#cards-view').html(cardsHtml);
}

// Visualização agrupada
function renderGroupedView(items) {
    // Agrupar itens por localização
    const groupedItems = {};
    
    items.forEach(item => {
        if (!groupedItems[item.location]) {
            groupedItems[item.location] = [];
        }
        groupedItems[item.location].push(item);
    });
    
    let groupedHtml = '';
    
    Object.keys(groupedItems).sort().forEach(location => {
        const locationItems = groupedItems[location];
        
        groupedHtml += `
            <div class="card mb-3">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${location}</h6>
                        <span class="badge bg-secondary">${locationItems.length}</span>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table mb-0">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Descrição</th>
                                    <th>Estado</th>
                                    <th>Colaborador</th>
                                    <th class="text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        locationItems.forEach(item => {
            groupedHtml += `
                <tr>
                    <td><span class="fw-medium">${item.code}</span></td>
                    <td>${item.description}</td>
                    <td>${getStatusBadge(item.status)}</td>
                    <td>${item.current_assignment ? item.current_assignment.employee_name : '-'}</td>
                    <td class="text-center">
                        ${createActionsDropdown(item)}
                    </td>
                </tr>
            `;
        });
        
        groupedHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    });
    
    $('#grouped-view').html(groupedHtml);
}

// Obter texto do status
function getStatusText(status) {
    switch(status) {
        case 'available': return 'Disponível';
        case 'in_use': return 'Em Uso';
        case 'maintenance': return 'Em Manutenção';
        case 'damaged': return 'Danificado';
        case 'discarded': return 'Baixado/Descartado';
        default: return 'Desconhecido';
    }
}

// Obter classe CSS para o status
function getStatusClass(status) {
    switch(status) {
        case 'available': return 'success';
        case 'in_use': return 'primary';
        case 'maintenance': return 'warning';
        case 'damaged': return 'danger';
        case 'discarded': return 'secondary';
        default: return 'light';
    }
}

// Obter badge HTML para o status
function getStatusBadge(status) {
    const statusClass = getStatusClass(status);
    const statusText = getStatusText(status);
    
    return `<span class="badge bg-${statusClass}">${statusText}</span>`;
}

// Funções para as ações nos itens
function openAssignDialog(itemId) {
    // Obter o item
    const item = allItems.find(i => i.id === parseInt(itemId));
    if (!item) return;
    
    // Implementar modal para atribuição
    const modalHtml = `
        <div class="modal fade" id="assignModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Atribuir Item a Colaborador</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Item</label>
                            <div class="p-3 bg-light rounded">
                                <div class="d-flex align-items-center">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">${item.code}</h6>
                                        <p class="mb-0 text-muted">${item.description}</p>
                                    </div>
                                    <span class="badge bg-${getStatusClass(item.status)}">${getStatusText(item.status)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="employee-select" class="form-label">Colaborador <span class="text-danger">*</span></label>
                            <select id="employee-select" class="form-select" required>
                                <option value="">Selecione um colaborador...</option>
                                <!-- Opções de colaboradores carregadas via AJAX -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="assign-notes" class="form-label">Observações</label>
                            <textarea id="assign-notes" class="form-control" rows="3" placeholder="Informações adicionais sobre a atribuição..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btn-confirm-assign">
                            <i class="ri-user-add-line me-1"></i> Atribuir Item
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao DOM
    $('body').append(modalHtml);
    
    // Carregar colaboradores via AJAX
    const select = $('#employee-select');
    if (formOptions.employees && formOptions.employees.length > 0) {
        formOptions.employees.forEach(employee => {
            const jobTitle = employee.job_position ? `(${employee.job_position})` : '';
            select.append(`<option value="${employee.id}">${employee.name} ${jobTitle}</option>`);
        });
    } else {
        select.append(`<option value="" disabled>Não foi possível carregar colaboradores</option>`);
        $('#btn-confirm-assign').prop('disabled', true);
    }
    
    // Configurar evento de confirmação
    $('#btn-confirm-assign').click(function() {
        const employeeId = $('#employee-select').val();
        const notes = $('#assign-notes').val();
        
        if (!employeeId) {
            // Destacar o campo com erro
            $('#employee-select').addClass('is-invalid');
            return;
        }
        
        // Desabilitar botão e mostrar loading
        $(this).prop('disabled', true);
        $(this).html('<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Processando...');
        
        assignItem(itemId, employeeId, notes).then((response) => {
            if (response) {
                $('#assignModal').modal('hide');
                showSuccessToast('Item atribuído com sucesso!');
                loadItems();
            } else {
                $(this).prop('disabled', false);
                $(this).html('<i class="ri-user-add-line me-1"></i> Atribuir Item');
            }
        });
    });
    
    // Remover destaque de erro ao interagir com o campo
    $('#employee-select').on('change', function() {
        $(this).removeClass('is-invalid');
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('assignModal'));
    modal.show();
    
    // Limpar modal após fechamento
    $('#assignModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

function confirmReturn(itemId) {
    showConfirmModal(
        'Confirmar Devolução', 
        'Tem certeza que deseja registrar a devolução deste item?',
        'Sim, devolver',
        () => {
            returnItem(itemId).then(() => {
                showSuccessToast('Item devolvido com sucesso!');
                loadItems();
            });
        }
    );
}

function confirmReturnFromMaintenance(itemId) {
    showConfirmModal(
        'Confirmar Retorno da Manutenção', 
        'Tem certeza que deseja registrar o retorno deste item da manutenção?',
        'Sim, retornar',
        () => {
            returnFromMaintenance(itemId).then(() => {
                showSuccessToast('Item retornado da manutenção com sucesso!');
                loadItems();
            });
        }
    );
}

function confirmMaintenance(itemId) {
    showInputModal(
        'Enviar para Manutenção',
        'Informe os detalhes da manutenção:',
        'Descreva o problema ou o motivo do envio...',
        'Confirmar envio',
        (notes) => {
            sendToMaintenance(itemId, notes).then(() => {
                showSuccessToast('Item enviado para manutenção com sucesso!');
                loadItems();
            });
        }
    );
}

function confirmDamage(itemId) {
    showInputModal(
        'Marcar como Danificado',
        'Informe os detalhes do dano:',
        'Descreva o problema com o item...',
        'Sim, marcar como danificado',
        (notes) => {
            if (notes) {
                markAsDamaged(itemId, notes).then(() => {
                    showSuccessToast('Item marcado como danificado com sucesso!');
                    loadItems();
                });
            }
        }
    );
}

function confirmDiscard(itemId) {
    showConfirmModal(
        'Descartar/Baixar Item', 
        '<strong class="text-danger">Atenção:</strong> Esta ação irá baixar/descartar o item permanentemente. Esta operação não pode ser desfeita.',
        'Sim, descartar item',
        () => {
            showInputModal(
                'Motivo do Descarte',
                'Informe o motivo do descarte:',
                'Informe o motivo...',
                'Confirmar descarte',
                (notes) => {
                    if (notes) {
                        discardItem(itemId, notes).then(() => {
                            showSuccessToast('Item descartado com sucesso!');
                            loadItems();
                        });
                    }
                }
            );
        }
    );
}

function openAuditDialog(itemId) {
    // Obter o item
    const item = allItems.find(i => i.id === parseInt(itemId));
    if (!item) return;
    
    // Implementar modal para auditoria com IA
    const modalHtml = `
        <div class="modal fade" id="auditModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Auditoria Inteligente</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Item</label>
                            <div class="p-3 bg-light rounded">
                                <div class="d-flex align-items-center">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">${item.code}</h6>
                                        <p class="mb-0 text-muted">${item.description}</p>
                                    </div>
                                    <span class="badge bg-${getStatusClass(item.status)}">${getStatusText(item.status)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">O que deseja analisar?</label>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="check-usage-patterns" checked>
                                <label class="form-check-label" for="check-usage-patterns">
                                    Padrões de utilização
                                </label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="check-maintenance-history" checked>
                                <label class="form-check-label" for="check-maintenance-history">
                                    Histórico de manutenção
                                </label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="check-cost-benefit" checked>
                                <label class="form-check-label" for="check-cost-benefit">
                                    Análise de custo-benefício
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="check-replacement-recommendation" checked>
                                <label class="form-check-label" for="check-replacement-recommendation">
                                    Recomendação de substituição
                                </label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="audit-notes" class="form-label">Observações adicionais para a IA</label>
                            <textarea id="audit-notes" class="form-control" rows="2" placeholder="Informe contexto adicional para a análise..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btn-run-audit">
                            <i class="ri-robot-line me-1"></i> Iniciar Auditoria
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao DOM
    $('body').append(modalHtml);
    
    // Configurar evento de confirmação
    $('#btn-run-audit').click(function() {
        // Verificar se pelo menos uma opção foi selecionada
        const anyOptionSelected = $('#check-usage-patterns').is(':checked') || 
                                 $('#check-maintenance-history').is(':checked') || 
                                 $('#check-cost-benefit').is(':checked') || 
                                 $('#check-replacement-recommendation').is(':checked');
        
        if (!anyOptionSelected) {
            showErrorToast('Por favor, selecione pelo menos uma opção para análise.');
            return;
        }
        
        // Desabilitar botão e mostrar loading
        $(this).prop('disabled', true);
        $(this).html('<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Processando...');
        
        const params = {
            usage: $('#check-usage-patterns').is(':checked'),
            maintenance: $('#check-maintenance-history').is(':checked'),
            costBenefit: $('#check-cost-benefit').is(':checked'),
            replacement: $('#check-replacement-recommendation').is(':checked'),
            notes: $('#audit-notes').val()
        };
        
        // Realizar auditoria
        auditItem(itemId, params).then((response) => {
            if (response) {
                $('#auditModal').modal('hide');
                showSuccessToast('Auditoria realizada com sucesso!');
                // Redirecionar para a página de visualização com o relatório de auditoria
                viewItem(itemId);
            } else {
                // Restaurar botão
                $(this).prop('disabled', false);
                $(this).html('<i class="ri-robot-line me-1"></i> Iniciar Auditoria');
            }
        });
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('auditModal'));
    modal.show();
    
    // Limpar modal após fechamento
    $('#auditModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

// Funções para fazer chamadas à API
async function assignItem(itemId, employeeId, notes) {
    try {
        const response = await makeRequest('/api/patrimony-tracker/items/' + itemId + '/assign', 'POST', {
            userIdToAssign: employeeId,
            notes: notes
        });
        return response;
    } catch (error) {
        console.error('Erro ao atribuir item:', error);
        showErrorToast('Não foi possível atribuir o item. Tente novamente mais tarde.');
    }
}

async function returnItem(itemId) {
    try {
        const response = await makeRequest('/api/patrimony-tracker/items/' + itemId + '/return', 'POST');
        return response;
    } catch (error) {
        console.error('Erro ao devolver item:', error);
        showErrorToast('Não foi possível devolver o item. Tente novamente mais tarde.');
    }
}

async function sendToMaintenance(itemId, notes) {
    try {
        const response = await makeRequest('/api/patrimony-tracker/items/' + itemId + '/maintenance/send', 'POST', { notes });
        return response;
    } catch (error) {
        console.error('Erro ao enviar item para manutenção:', error);
        showErrorToast('Não foi possível enviar o item para manutenção. Tente novamente mais tarde.');
    }
}

async function returnFromMaintenance(itemId) {
    try {
        const response = await makeRequest('/api/patrimony-tracker/items/' + itemId + '/maintenance/return', 'POST');
        return response;
    } catch (error) {
        console.error('Erro ao retornar item da manutenção:', error);
        showErrorToast('Não foi possível retornar o item da manutenção. Tente novamente mais tarde.');
    }
}

async function markAsDamaged(itemId, notes) {
    try {
        const response = await makeRequest('/api/patrimony-tracker/items/' + itemId + '/damage', 'POST', {
            notes: notes
        });
        return response;
    } catch (error) {
        console.error('Erro ao marcar item como danificado:', error);
        showErrorToast('Não foi possível marcar o item como danificado. Tente novamente mais tarde.');
    }
}

async function discardItem(itemId, notes) {
    try {
        const response = await makeRequest('/api/patrimony-tracker/items/' + itemId + '/discard', 'POST', {
            notes: notes
        });
        return response;
    } catch (error) {
        console.error('Erro ao descartar item:', error);
        showErrorToast('Não foi possível descartar o item. Tente novamente mais tarde.');
    }
}

async function auditItem(itemId, params) {
    try {
        const response = await makeRequest('/api/patrimony-tracker/items/' + itemId + '/audit', 'POST', params);
        return response;
    } catch (error) {
        console.error('Erro ao realizar auditoria:', error);
        showErrorToast('Não foi possível realizar a auditoria. Tente novamente mais tarde.');
    }
}

// Funções para exibir modais
function showConfirmModal(title, message, confirmBtnText, onConfirm) {
    // Remover modal anterior se existir
    $('#confirmModal').remove();
    
    const modalHtml = `
        <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btnConfirm">${confirmBtnText}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao DOM
    $('body').append(modalHtml);
    
    // Configurar evento de confirmação
    $('#btnConfirm').click(function() {
        $('#confirmModal').modal('hide');
        onConfirm();
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
    
    // Limpar modal após fechamento
    $('#confirmModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

function showInputModal(title, message, placeholder, confirmBtnText, onConfirm) {
    // Remover modal anterior se existir
    $('#inputModal').remove();
    
    const modalHtml = `
        <div class="modal fade" id="inputModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                        <textarea class="form-control" id="inputModalValue" rows="3" placeholder="${placeholder}"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btnInputConfirm">${confirmBtnText}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao DOM
    $('body').append(modalHtml);
    
    // Configurar evento de confirmação
    $('#btnInputConfirm').click(function() {
        const value = $('#inputModalValue').val();
        $('#inputModal').modal('hide');
        onConfirm(value);
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('inputModal'));
    modal.show();
    
    // Limpar modal após fechamento
    $('#inputModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

// Função para mostrar toast de sucesso
function showSuccessToast(message) {
    // Remover toast anterior se existir
    $('.toast-container').remove();
    
    const toastHtml = `
        <div class="toast-container position-fixed top-0 end-0 p-3">
            <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="ri-check-line me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar toast ao DOM
    $('body').append(toastHtml);
    
    // Mostrar toast
    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remover toast após fechamento
    $('.toast').on('hidden.bs.toast', function() {
        $('.toast-container').remove();
    });
}

// Função para mostrar toast de erro
function showErrorToast(message) {
    // Remover toast anterior se existir
    $('.toast-container').remove();
    
    const toastHtml = `
        <div class="toast-container position-fixed top-0 end-0 p-3">
            <div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="ri-error-warning-line me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar toast ao DOM
    $('body').append(toastHtml);
    
    // Mostrar toast
    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
    
    // Remover toast após fechamento
    $('.toast').on('hidden.bs.toast', function() {
        $('.toast-container').remove();
    });
} 