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

    // Inicializar a conexão com o Socket.io
    initializeSocket();
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
            openReturnDialog(itemId);
            break;
        case 'maintenance':
            openMaintenanceDialog(itemId);
            break;
        case 'return_from_maintenance':
            openReturnFromMaintenanceDialog(itemId);
            break;
        case 'damage':
            openDamageDialog(itemId);
            break;
        case 'discard':
            openDiscardDialog(itemId);
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
    
    // Ação de visualizar está sempre disponível
    actions.push({ id: 'view', label: 'Visualizar', icon: 'ri-eye-line', class: 'text-primary' });

    // Se o item está descartado, nenhuma outra ação é permitida. É um estado final.
    if (item.status === 'discarded') {
        return actions;
    }

    // Para todos os outros estados, a edição é permitida
    actions.push({ id: 'edit', label: 'Editar', icon: 'ri-edit-line', class: 'text-info' });
    
    // Ações específicas para cada estado
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
            actions.push({ id: 'return_from_maintenance', label: 'Retornar da Manutenção', icon: 'ri-check-line', class: 'text-success' });
            actions.push({ id: 'damage', label: 'Marcar como Danificado', icon: 'ri-error-warning-line', class: 'text-danger' });
            actions.push({ id: 'discard', label: 'Descartar/Baixar', icon: 'ri-delete-bin-line', class: 'text-danger' });
            break;
            
        case 'damaged':
            actions.push({ id: 'maintenance', label: 'Enviar para Manutenção', icon: 'ri-tools-line', class: 'text-warning' });
            actions.push({ id: 'discard', label: 'Descartar/Baixar', icon: 'ri-delete-bin-line', class: 'text-danger' });
            break;
    }
    
    // Ação de auditoria está disponível para todos os estados não-finais
    actions.push({ id: 'audit', label: 'Auditoria IA', icon: 'ri-robot-line', class: 'text-primary' });
    
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

function openSettings() {
    openPopup('settings.html');
}

function viewItem(id) {
    openPopup(`view.html?id=${id}`);
}

function editItem(id) {
    if (!id) {
        console.error('ID do item não fornecido para a edição.');
        showErrorToast('ID do item não fornecido.');
        return;
    }
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

    // Botão para exportar para Excel
    $('#btn-export-excel').click(function() {
        exportItemsToExcel();
    });
}

// Atualizar contagem e valor total dos itens no display
function updateTotals(items) {
    const count = items.length;
    
    // Atualiza a contagem de itens
    const countLabel = count === 1 ? 'item encontrado' : 'itens encontrados';
    $('#items-count-display').text(`${count} ${countLabel}`);

    // Calcula e atualiza o valor total
    const totalValue = items.reduce((sum, item) => {
        // Garante que o valor é um número antes de somar
        const value = parseFloat(item.acquisition_value);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const formattedValue = totalValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    $('#items-total-value-display').text(`Valor total: ${formattedValue}`);
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
    
    // Atualizar contador e valor total
    updateTotals(filteredItems);
    
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
            updateTotals(allItems); // Atualiza os totais iniciais

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
        tableHtml += renderSingleTableRow(item);
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    $('#table-view').html(tableHtml);
}

/**
 * Gera o HTML para uma única linha da tabela de itens.
 * @param {object} item - O objeto do item.
 * @returns {string} - O HTML da linha (tr).
 */
function renderSingleTableRow(item) {
    return `
        <tr data-item-id="${item.id}">
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
}

// Visualização em cards
function renderCardsView(items) {
    let cardsHtml = '<div class="row">';
    
    items.forEach(item => {
        cardsHtml += renderSingleCard(item);
    });
    
    cardsHtml += '</div>';
    
    $('#cards-view').html(cardsHtml);
}

/**
 * Gera o HTML para um único card de item.
 * @param {object} item - O objeto do item.
 * @returns {string} - O HTML do card.
 */
function renderSingleCard(item) {
    const statusClass = getStatusClass(item.status);
    const statusText = getStatusText(item.status);

    return `
        <div class="col-md-4 col-lg-3 mb-4" data-item-id="${item.id}">
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
        
        // Calcula o valor total para o grupo
        const groupTotalValue = locationItems.reduce((sum, item) => {
            const value = parseFloat(item.acquisition_value);
            return sum + (isNaN(value) ? 0 : value);
        }, 0);

        const formattedGroupTotalValue = groupTotalValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        groupedHtml += `
            <div class="card mb-3">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${location || 'Sem Localização'}</h6>
                        <div>
                            <span class="badge bg-light text-dark me-2">Valor: ${formattedGroupTotalValue}</span>
                            <span class="badge bg-secondary">Itens: ${locationItems.length}</span>
                        </div>
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
                <tr data-item-id="${item.id}">
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
    // Conteúdo HTML do modal, agora incluindo um campo para a data
    const modalHtml = `
        <div class="mb-3">
            <label for="assign-employee" class="form-label">Colaborador</label>
            <select class="form-select" id="assign-employee-modal" required>
                <option value="">Carregando...</option>
            </select>
        </div>
        <div class="mb-3">
            <label for="assign-date-modal" class="form-label">Data de Atribuição</label>
            <input type="datetime-local" class="form-control" id="assign-date-modal" required>
        </div>
        <div class="mb-3">
            <label for="assign-notes-modal" class="form-label">Observações (opcional)</label>
            <textarea class="form-control" id="assign-notes-modal" rows="3"></textarea>
        </div>
    `;

    // Exibir o modal e configurar a confirmação
    showConfirmModal(
        'Atribuir Item',
        modalHtml,
        'Atribuir',
        async () => {
            const employeeId = $('#assign-employee-modal').val();
            const assignmentDate = $('#assign-date-modal').val();
            const notes = $('#assign-notes-modal').val();

            if (!employeeId || !assignmentDate) {
                showErrorToast('Selecione um colaborador e uma data de atribuição.');
                return;
            }
            
            await performAssignAction(itemId, employeeId, assignmentDate, notes);
        }
    );
    
    // Preenche o campo com a data e hora atuais locais
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('#assign-date-modal').val(now.toISOString().slice(0, 16));

    // Carregar as opções de colaboradores no select do modal
    const select = $('#assign-employee-modal');
    select.empty().append('<option value="">Selecione um colaborador...</option>');
    
    if (formOptions.employees && formOptions.employees.length > 0) {
        formOptions.employees.forEach(employee => {
            select.append(`<option value="${employee.id}">${employee.name}</option>`);
        });
    } else {
        // Fallback caso as opções não tenham sido carregadas
        select.append('<option value="">Não foi possível carregar colaboradores</option>');
        console.error("Opções de colaboradores não disponíveis.");
    }
}

function openReturnDialog(itemId) {
    showInputModal(
        'Devolver Item',
        'Confirme a data e hora da devolução e adicione notas, se necessário.',
        'Notas sobre a devolução...',
        'Confirmar Devolução',
        async (notes) => {
            const returnDate = $('#modal-input-datetime').val();
            if (!returnDate) {
                showErrorToast('A data e hora de devolução são obrigatórias.');
                return;
            }
            await performReturnAction(itemId, returnDate, notes);
        },
        true // Habilita o campo de data e hora
    );
}

function openReturnFromMaintenanceDialog(itemId) {
    showInputModal(
        'Retornar da Manutenção',
        'O item será marcado como "Disponível". Adicione uma nota sobre o reparo ou serviço realizado.',
        'Ex: Reparo concluído, peça trocada...',
        'Confirmar Retorno',
        async (notes) => {
            await performReturnFromMaintenanceAction(itemId, notes);
        }
    );
}

function openMaintenanceDialog(itemId) {
    showInputModal(
        'Enviar para Manutenção',
        'O item será marcado como "Em Manutenção" e, se estiver atribuído a alguém, será devolvido automaticamente. Adicione uma nota sobre o motivo.',
        'Ex: Tela quebrada, não liga...',
        'Confirmar Manutenção',
        async (notes) => {
            await performMaintenanceAction(itemId, notes);
        }
    );
}

function openDamageDialog(itemId) {
    showInputModal(
        'Marcar como Danificado',
        'O item será marcado como "Danificado" e, se estiver atribuído a alguém, será devolvido automaticamente. Adicione uma nota sobre o dano.',
        'Ex: Arranhões profundos na carcaça...',
        'Confirmar Dano',
        async (notes) => {
            await performDamageAction(itemId, notes);
        }
    );
}

function openDiscardDialog(itemId) {
    showInputModal(
        'Descartar/Baixar Item',
        'Esta ação é irreversível. O item será marcado como "Baixado/Descartado". Por favor, forneça uma justificativa.',
        'Ex: Obsoleto, sem possibilidade de reparo...',
        'Confirmar Descarte',
        async (notes) => {
            if (!notes || notes.trim() === '') {
                showErrorToast('A justificativa é obrigatória para o descarte.');
                return;
            }
            await performDiscardAction(itemId, notes);
        }
    );
}

async function openAuditDialog(itemId) {
    try {
        const item = allItems.find(i => i.id === itemId);
        if (!item) {
            showErrorToast('Item não encontrado para auditoria.');
            return;
        }

        // Simula o início do processo de auditoria, mostrando um loader/toast
        showSuccessToast(`Iniciando auditoria para o item ${item.code}...`);

        const result = await auditItem(itemId);

        // Remove o toast de "carregando" e mostra o resultado
        $('.toast').remove();

        // Mostra o resultado em um modal
        showConfirmModal(
            'Resultado da Auditoria',
            `<p>${result.audit_result}</p>`,
            'Fechar',
            () => {}, // Ação vazia, apenas para fechar o modal
            true // Modo "Apenas OK"
        );

    } catch (error) {
        showErrorToast(error.message || 'Falha ao realizar a auditoria.');
    }
}

// Funções para fazer chamadas à API
async function performAssignAction(itemId, employeeId, assignmentDate, notes) {
    showLoader(true);
    try {
        const response = await makeRequest(`/api/patrimony-tracker/items/${itemId}/assign`, 'POST', {
            employee_id: employeeId,
            assignment_date: assignmentDate,
            notes: notes
        });
        showSuccessToast(response.message || 'Item atribuído com sucesso!');
        loadItems(); // Recarregar
    } catch (error) {
        showErrorToast(error.message || 'Falha ao atribuir item.');
    } finally {
        showLoader(false);
    }
}

async function performReturnAction(itemId, returnDate, notes) {
    showLoader(true);
    try {
        const response = await makeRequest(`/api/patrimony-tracker/items/${itemId}/return`, 'POST', {
            return_date: returnDate,
            notes: notes
        });
        showSuccessToast(response.message || 'Item devolvido com sucesso!');
        loadItems(); // Recarregar
    } catch (error) {
        showErrorToast(error.message || 'Falha ao devolver item.');
    } finally {
        showLoader(false);
    }
}

async function performReturnFromMaintenanceAction(itemId, notes) {
    showLoader(true);
    try {
        const response = await makeRequest(`/api/patrimony-tracker/items/${itemId}/return-from-maintenance`, 'POST', { notes });
        showSuccessToast(response.message || 'Item retornado da manutenção.');
        loadItems();
    } catch (error) {
        showErrorToast(error.message || 'Falha ao retornar da manutenção.');
    } finally {
        showLoader(false);
    }
}

async function performMaintenanceAction(itemId, notes) {
    showLoader(true);
    try {
        const response = await makeRequest(`/api/patrimony-tracker/items/${itemId}/maintenance`, 'POST', { notes });
        showSuccessToast(response.message || 'Item enviado para manutenção.');
        loadItems();
    } catch (error) {
        showErrorToast(error.message || 'Falha ao enviar para manutenção.');
    } finally {
        showLoader(false);
    }
}

async function performDamageAction(itemId, notes) {
    showLoader(true);
    try {
        const response = await makeRequest(`/api/patrimony-tracker/items/${itemId}/damaged`, 'POST', { notes });
        showSuccessToast(response.message || 'Item marcado como danificado.');
        loadItems();
    } catch (error) {
        showErrorToast(error.message || 'Falha ao marcar como danificado.');
    } finally {
        showLoader(false);
    }
}

async function performDiscardAction(itemId, notes) {
    showLoader(true);
    try {
        const response = await makeRequest(`/api/patrimony-tracker/items/${itemId}/discard`, 'POST', { notes });
        showSuccessToast(response.message || 'Item descartado com sucesso.');
        loadItems();
    } catch (error) {
        showErrorToast(error.message || 'Falha ao descartar item.');
    } finally {
        showLoader(false);
    }
}

async function auditItem(itemId) {
    try {
        const response = await makeRequest('/api/patrimony-tracker/items/' + itemId + '/audit');
        return response;
    } catch (error) {
        console.error('Erro ao realizar auditoria:', error);
        showErrorToast('Não foi possível realizar a auditoria. Tente novamente mais tarde.');
    }
}

// Funções para exibir modais
function showConfirmModal(title, message, confirmBtnText, onConfirm, onlyOk = false) {
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
        if (!onlyOk) {
            onConfirm();
        }
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
    
    // Limpar modal após fechamento
    $('#confirmModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

// Refatoração do showInputModal para incluir opcionalmente um campo de data/hora
function showInputModal(title, message, placeholder, confirmBtnText, onConfirm, showDateTimeField = false) {
    $('#modal-input-label').text(message);
    $('#modal-input-field').attr('placeholder', placeholder);
    $('#modal-input-title').text(title);
    $('#modal-input-confirm-btn').text(confirmBtnText);
    
    // Limpar campo de input
    $('#modal-input-field').val('');
    
    // Gerenciar visibilidade do campo de data/hora
    if (showDateTimeField) {
        $('#modal-datetime-group').show();
        // Definir data e hora atuais como padrão
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        $('#modal-input-datetime').val(now.toISOString().slice(0, 16));
    } else {
        $('#modal-datetime-group').hide();
    }

    const modal = new bootstrap.Modal(document.getElementById('input-modal'));

    // Remover ouvintes de eventos anteriores para evitar chamadas múltiplas
    $('#modal-input-confirm-btn').off('click');

    $('#modal-input-confirm-btn').on('click', async function() {
        const inputValue = $('#modal-input-field').val();
        await onConfirm(inputValue);
        modal.hide();
    });

    modal.show();
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

// Função para exportar os dados para Excel
async function exportItemsToExcel() {
    showLoader(true);
    showSuccessToast('Gerando seu relatório... Isso pode levar alguns segundos.');

    try {
        const response = await fetch('/api/patrimony-tracker/items/export');

        if (!response.ok) {
            throw new Error('Falha ao gerar o relatório no servidor.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const date = new Date().toISOString().slice(0, 10);
        a.download = `Relatorio_Patrimonio_${date}.xlsx`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        showErrorToast(error.message || 'Não foi possível exportar os dados.');
    } finally {
        showLoader(false);
    }
}

/**
 * Inicializa a conexão com o Socket.io e registra os listeners de eventos.
 */
function initializeSocket() {
    const socket = io();

    // Listener para quando um item específico é atualizado (atribuído, devolvido, etc.)
    socket.on('patrimony:item_updated', (updatedItem) => {
        console.log('Evento patrimony:item_updated recebido:', updatedItem);
        
        const itemIndex = allItems.findIndex(item => item.id === updatedItem.id);
        if (itemIndex === -1) {
            // Se o item não está na lista, algo está fora de sincronia. Recarregar tudo é mais seguro.
            fetchItems();
            return;
        }

        // Converte o item recebido para o formato da lista e atualiza o array principal
        const newItemData = convertItemForList(updatedItem);
        allItems[itemIndex] = newItemData;

        // Encontra o elemento no DOM para ser atualizado
        const itemElement = $(`[data-item-id="${newItemData.id}"]`);
        
        if (itemElement.length > 0) {
            // Se o item está visível, atualiza-o no local.
            let newHtml;
            if (itemElement.is('tr')) {
                newHtml = renderSingleTableRow(newItemData);
            } else if (itemElement.hasClass('col-md-4')) {
                newHtml = renderSingleCard(newItemData);
            }

            if (newHtml) {
                itemElement.replaceWith(newHtml);
                showSuccessToast(`Item "${newItemData.code}" foi atualizado.`);
            }
        } else {
            // Se o item não está visível (devido a filtros), uma atualização completa dos filtros
            // garantirá que ele apareça se agora corresponder aos critérios.
            applyFilters();
        }

        // Atualiza os totais, pois o valor do item pode ter mudado
        updateTotalsBasedOnCurrentFilters();
    });

    // Listener para quando a lista geral precisa ser recarregada (ex: novo item criado)
    socket.on('patrimony:list_changed', () => {
        console.log('Evento patrimony:list_changed recebido.');
        showSuccessToast('A lista de patrimônio foi atualizada. Recarregando...');
        loadItems(); // Busca novamente todos os itens
    });

    // Listener para quando as opções de filtro (categorias/localizações) mudam
    socket.on('patrimony:options_changed', () => {
        console.log('Evento patrimony:options_changed recebido.');
        showSuccessToast('As opções de filtro foram atualizadas. Recarregando...');
        // Recarrega as opções de filtro
        loadItems();
    });
}

/**
 * Converte um objeto de item completo (da tela de detalhes) para o formato esperado na lista.
 * @param {object} fullItem - O objeto de item completo recebido pelo socket.
 * @returns {object} - O objeto de item no formato da lista.
 */
function convertItemForList(fullItem) {
    return {
        id: fullItem.id,
        code: fullItem.code,
        description: fullItem.description,
        location: fullItem.location_name,
        status: fullItem.current_status,
        acquisition_value: fullItem.acquisition_value,
        acquisition_date: fullItem.acquisition_date,
        notes: fullItem.notes,
        current_assignment: fullItem.current_assignment ? {
            employee_id: fullItem.current_assignment.user_id, // Correção crucial
            employee_name: fullItem.current_assignment.employee_name
        } : null
    };
}

/**
 * Recalcula e atualiza os totais (contagem e valor) com base nos filtros atuais.
 */
function updateTotalsBasedOnCurrentFilters() {
    const keyword = $('#filter-keyword').val().toLowerCase();
    const location = $('#filter-location').val();
    const status = $('#filter-status').val();
    const employee = $('#filter-employee').val();

    let filteredItems = allItems.filter(item => {
        const keywordMatch = keyword === '' || item.code.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword);
        const locationMatch = location === '' || item.location === location;
        const statusMatch = status === '' || item.status === status;
        let employeeMatch = true;
        if (employee !== '') {
            employeeMatch = item.current_assignment && item.current_assignment.employee_id.toString() === employee;
        }
        return keywordMatch && locationMatch && statusMatch && employeeMatch;
    });
    
    updateTotals(filteredItems);
}

// document.addEventListener('DOMContentLoaded', () => {
//     initializePage();
//     setupEventListeners();
//     initializeSocket();
// }); 