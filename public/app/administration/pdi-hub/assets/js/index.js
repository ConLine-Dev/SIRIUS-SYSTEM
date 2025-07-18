/**
 * PDI Hub - Script para a página do coordenador/supervisor
 */

// Variáveis globais
let actionCounter = 0;
let actionsToDelete = [];
let profileChartInstance = null;
let evaluationsChartInstance = null;

// Variáveis para filtros avançados
let allPDIs = [];
let activeFilters = {
    collaborator: '',
    supervisor: '',
    profile: '',
    dateRange: '',
    actionsStatus: '',
    search: ''
};

// Variáveis para filtros das avaliações
let allRecentEvaluations = [];
let evaluationFilters = {
    collaborator: '',
    period: '',
    score: '',
    date: ''
};

// Variáveis para filtros das ações
let allGlobalActions = [];
let actionFilters = {
    collaborator: '',
    status: '',
    deadline: '',
    search: ''
};

// Esperar o documento carregar
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos
    setupEventListeners();
    loadPDIList();
    
    // Verificar o estado salvo no localStorage para os indicadores
    const indicatorsVisible = localStorage.getItem('pdiHubIndicatorsVisible') === 'true';
    if (indicatorsVisible) {
        const dashboardIndicators = document.getElementById('dashboardIndicators');
        const btnToggleText = document.getElementById('btnToggleText');
        
        dashboardIndicators.classList.remove('d-none');
        btnToggleText.textContent = 'Esconder Indicadores';
        
        // Carregar os indicadores se ainda não foram carregados
        if (!dashboardIndicators.dataset.loaded) {
            loadDashboardIndicators();
            dashboardIndicators.dataset.loaded = 'true';
        }
    }

    // Carregar lista de ações globais ao iniciar a página
    setTimeout(() => {
        loadGlobalActionsList('', '');
    }, 500);
});

// Configurar os listeners de eventos
function setupEventListeners() {
    // Botão para abrir a nova janela de criação de PDI
    const btnNewPDI = document.getElementById('btnNewPDI');
    if (btnNewPDI) {
        btnNewPDI.addEventListener('click', openNewPDIWindow);
    }
    
    // Botão para salvar o PDI (criar/atualizar)
    const btnSavePDI = document.getElementById('btnSavePDI');
    if (btnSavePDI) {
        btnSavePDI.addEventListener('click', savePDI);
    }
    
    // Botão para adicionar nova ação
    const btnAddAction = document.getElementById('btnAddAction');
    if (btnAddAction) {
        btnAddAction.addEventListener('click', addActionRow);
    }
    
    // Botão para editar PDI
    const btnEditPDI = document.getElementById('btnEditPDI');
    if (btnEditPDI) {
        btnEditPDI.addEventListener('click', function() {
            const pdiId = this.getAttribute('data-id');
            openEditPDIModal(pdiId);
        });
    }
    
    // Botão para mostrar/esconder indicadores
    const btnToggleIndicators = document.getElementById('btnToggleIndicators');
    if (btnToggleIndicators) {
        btnToggleIndicators.addEventListener('click', toggleIndicators);
    }
    

    
    // Filtros avançados
    const btnToggleAdvancedFilters = document.getElementById('btnToggleAdvancedFilters');
    if (btnToggleAdvancedFilters) {
        btnToggleAdvancedFilters.addEventListener('click', toggleAdvancedFilters);
    }
    
    const btnClearFilters = document.getElementById('btnClearFilters');
    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', clearAdvancedFilters);
    }
    
    // Event listeners para filtros individuais
    const filterSearch = document.getElementById('filterSearch');
    if (filterSearch) {
        filterSearch.addEventListener('input', debounce(applyAdvancedFilters, 500));
    }
    
    // Event listeners para selects dos filtros
    const filterSelects = [
        'filterCollaborator',
        'filterSupervisor', 
        'filterProfile',
        'filterDateRange',
        'filterActionsStatus'
    ];
    
    filterSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', applyAdvancedFilters);
        }
    });
    
    // Event listeners para filtros das avaliações
    const btnToggleEvaluationFilters = document.getElementById('btnToggleEvaluationFilters');
    if (btnToggleEvaluationFilters) {
        btnToggleEvaluationFilters.addEventListener('click', toggleEvaluationFilters);
    }
    
    const btnClearEvaluationFilters = document.getElementById('btnClearEvaluationFilters');
    if (btnClearEvaluationFilters) {
        btnClearEvaluationFilters.addEventListener('click', clearEvaluationFilters);
    }
    
    // Event listeners para filtros das ações
    const btnToggleActionFilters = document.getElementById('btnToggleActionFilters');
    if (btnToggleActionFilters) {
        btnToggleActionFilters.addEventListener('click', toggleActionFilters);
    }
    
    const btnClearActionFilters = document.getElementById('btnClearActionFilters');
    if (btnClearActionFilters) {
        btnClearActionFilters.addEventListener('click', clearActionFilters);
    }
    
    // Event listeners para filtros individuais das avaliações
    const evaluationFilterSelects = [
        'filterEvaluationCollaborator',
        'filterEvaluationPeriod',
        'filterEvaluationScore',
        'filterEvaluationDate'
    ];
    
    evaluationFilterSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', applyEvaluationFilters);
        }
    });
    
    // Event listeners para filtros individuais das ações
    const actionFilterSelects = [
        'filterActionCollaborator',
        'filterActionStatus',
        'filterActionDeadline'
    ];
    
    actionFilterSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', applyActionFilters);
        }
    });
    
    // Event listener para busca de texto das ações
    const filterActionSearch = document.getElementById('filterActionSearch');
    if (filterActionSearch) {
        filterActionSearch.addEventListener('input', debounce(applyActionFilters, 500));
    }
}

// Mostrar/esconder indicadores
function toggleIndicators() {
    const dashboardIndicators = document.getElementById('dashboardIndicators');
    const btnToggleText = document.getElementById('btnToggleText');
    const isHidden = dashboardIndicators.classList.contains('d-none');
    
    if (isHidden) {
        // Se estiver escondido, mostrar e carregar os dados
        dashboardIndicators.classList.remove('d-none');
        btnToggleText.textContent = 'Esconder Indicadores';
        
        // Salvar estado no localStorage
        localStorage.setItem('pdiHubIndicatorsVisible', 'true');
        
        // Carregar os indicadores apenas quando o painel for mostrado pela primeira vez
        if (!dashboardIndicators.dataset.loaded) {
            loadDashboardIndicators();
            dashboardIndicators.dataset.loaded = 'true';
        }
    } else {
        // Se estiver visível, esconder
        dashboardIndicators.classList.add('d-none');
        btnToggleText.textContent = 'Mostrar Indicadores';
        
        // Salvar estado no localStorage
        localStorage.setItem('pdiHubIndicatorsVisible', 'false');
    }
}



// Função debounce para otimizar busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== FILTROS DAS AVALIAÇÕES ====================

// Mostrar/esconder filtros das avaliações
function toggleEvaluationFilters() {
    const filtersSection = document.getElementById('evaluationFiltersSection');
    const isHidden = filtersSection.classList.contains('d-none');
    
    if (isHidden) {
        filtersSection.classList.remove('d-none');
        populateEvaluationFilterOptions();
    } else {
        filtersSection.classList.add('d-none');
    }
}

// Popular opções dos filtros das avaliações
function populateEvaluationFilterOptions() {
    if (allRecentEvaluations.length === 0) return;
    
    // Popular filtro de colaboradores
    const collaboratorFilter = document.getElementById('filterEvaluationCollaborator');
    if (collaboratorFilter) {
        const uniqueCollaborators = [...new Set(allRecentEvaluations.map(e => e.collaborator_name).filter(Boolean))];
        const currentValue = collaboratorFilter.value;
        collaboratorFilter.innerHTML = '<option value="">Todos os Colaboradores</option>' +
            uniqueCollaborators.map(name => `<option value="${name}">${name}</option>`).join('');
        collaboratorFilter.value = currentValue;
    }
    
    // Popular filtro de períodos
    const periodFilter = document.getElementById('filterEvaluationPeriod');
    if (periodFilter) {
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const uniquePeriods = [...new Set(allRecentEvaluations.map(e => {
            const monthName = monthNames[e.month - 1];
            return `${monthName}/${e.year}`;
        }))];
        const currentValue = periodFilter.value;
        periodFilter.innerHTML = '<option value="">Todos os Períodos</option>' +
            uniquePeriods.map(period => `<option value="${period}">${period}</option>`).join('');
        periodFilter.value = currentValue;
    }
}

// Aplicar filtros das avaliações
function applyEvaluationFilters() {
    // Coletar valores dos filtros
    evaluationFilters = {
        collaborator: document.getElementById('filterEvaluationCollaborator')?.value || '',
        period: document.getElementById('filterEvaluationPeriod')?.value || '',
        score: document.getElementById('filterEvaluationScore')?.value || '',
        date: document.getElementById('filterEvaluationDate')?.value || ''
    };
    
    // Filtrar avaliações
    const filteredEvaluations = filterEvaluations(evaluationFilters);
    
    // Renderizar resultados
    renderRecentEvaluations(filteredEvaluations);
}

// Filtrar avaliações baseado nos critérios
function filterEvaluations(filters) {
    return allRecentEvaluations.filter(evaluation => {
        // Filtro por colaborador
        if (filters.collaborator && evaluation.collaborator_name !== filters.collaborator) {
            return false;
        }
        
        // Filtro por período
        if (filters.period) {
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const evaluationPeriod = `${monthNames[evaluation.month - 1]}/${evaluation.year}`;
            if (evaluationPeriod !== filters.period) {
                return false;
            }
        }
        
        // Filtro por média
        if (filters.score) {
            const average = (typeof evaluation.media === 'number') ? evaluation.media :
                           (typeof evaluation.average_score === 'number') ? evaluation.average_score :
                           (typeof evaluation.score === 'number') ? evaluation.score : 0;
            
            switch (filters.score) {
                case 'excellent':
                    if (average < 4.5) return false;
                    break;
                case 'good':
                    if (average < 3.5 || average >= 4.5) return false;
                    break;
                case 'regular':
                    if (average < 2.5 || average >= 3.5) return false;
                    break;
                case 'poor':
                    if (average >= 2.5) return false;
                    break;
            }
        }
        
        // Filtro por data da avaliação
        if (filters.date) {
            const evaluationDate = new Date(evaluation.created_at);
            const today = new Date();
            
            switch (filters.date) {
                case 'last7days':
                    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (evaluationDate < sevenDaysAgo) return false;
                    break;
                case 'last30days':
                    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (evaluationDate < thirtyDaysAgo) return false;
                    break;
                case 'last90days':
                    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                    if (evaluationDate < ninetyDaysAgo) return false;
                    break;
            }
        }
        
        return true;
    });
}

// Limpar filtros das avaliações
function clearEvaluationFilters() {
    evaluationFilters = {
        collaborator: '',
        period: '',
        score: '',
        date: ''
    };
    
    // Limpar valores dos campos
    document.getElementById('filterEvaluationCollaborator').value = '';
    document.getElementById('filterEvaluationPeriod').value = '';
    document.getElementById('filterEvaluationScore').value = '';
    document.getElementById('filterEvaluationDate').value = '';
    
    // Renderizar todas as avaliações
    renderRecentEvaluations(allRecentEvaluations);
}

// Mostrar/esconder filtros avançados
function toggleAdvancedFilters() {
    const advancedFiltersSection = document.getElementById('advancedFiltersSection');
    const btnToggleAdvancedFilters = document.getElementById('btnToggleAdvancedFilters');
    
    if (advancedFiltersSection.classList.contains('d-none')) {
        advancedFiltersSection.classList.remove('d-none');
        btnToggleAdvancedFilters.innerHTML = '<i class="ri-filter-3-fill me-1"></i>Filtros Avançados';
        btnToggleAdvancedFilters.classList.remove('btn-outline-secondary');
        btnToggleAdvancedFilters.classList.add('btn-secondary');
        
        // Carregar opções dos filtros se ainda não foram carregadas
        populateFilterOptions();
    } else {
        advancedFiltersSection.classList.add('d-none');
        btnToggleAdvancedFilters.innerHTML = '<i class="ri-filter-3-line me-1"></i>Filtros Avançados';
        btnToggleAdvancedFilters.classList.remove('btn-secondary');
        btnToggleAdvancedFilters.classList.add('btn-outline-secondary');
    }
}

// Popular opções dos filtros
function populateFilterOptions() {
    if (allPDIs.length === 0) return;
    
    // Popular filtro de colaboradores
    const collaboratorFilter = document.getElementById('filterCollaborator');
    if (collaboratorFilter) {
        const uniqueCollaborators = [...new Set(allPDIs.map(pdi => pdi.collaborator_name).filter(Boolean))];
        const currentValue = collaboratorFilter.value;
        collaboratorFilter.innerHTML = '<option value="">Todos os Colaboradores</option>' +
            uniqueCollaborators.map(name => `<option value="${name}">${name}</option>`).join('');
        collaboratorFilter.value = currentValue;
    }
    
    // Popular filtro de supervisores
    const supervisorFilter = document.getElementById('filterSupervisor');
    if (supervisorFilter) {
        const uniqueSupervisors = [...new Set(allPDIs.map(pdi => pdi.supervisor_name).filter(Boolean))];
        const currentValue = supervisorFilter.value;
        supervisorFilter.innerHTML = '<option value="">Todos os Supervisores</option>' +
            uniqueSupervisors.map(name => `<option value="${name}">${name}</option>`).join('');
        supervisorFilter.value = currentValue;
    }
    
    // Popular filtro de perfis com os perfis reais do banco
    const profileFilter = document.getElementById('filterProfile');
    if (profileFilter) {
        const uniqueProfiles = [...new Set(allPDIs.map(pdi => pdi.profile_type).filter(Boolean))];
        const currentValue = profileFilter.value;
        profileFilter.innerHTML = '<option value="">Todos os Perfis</option>' +
            uniqueProfiles.map(profile => `<option value="${profile}">${profile}</option>`).join('');
        profileFilter.value = currentValue;
    }
    
    // Popular filtro de status com os status reais que aparecem na tabela
    const actionsStatusFilter = document.getElementById('filterActionsStatus');
    if (actionsStatusFilter) {
        // Calcular os status reais que aparecem na tabela
        const realStatuses = allPDIs.map(pdi => {
            let displayStatus = pdi.status;
            
            // Se temos estatísticas de ações e o PDI está "Ativo", verificar as ações
            if (pdi.actionStats && pdi.status === 'Ativo') {
                if (pdi.actionStats.allActionsCompleted) {
                    displayStatus = 'Concluído';
                } else if (pdi.actionStats.hasLateActions) {
                    displayStatus = 'Atrasado';
                } else if (pdi.actionStats.hasActionsInProgress) {
                    displayStatus = 'Em Andamento';
                }
            }
            
            return displayStatus;
        });
        
        const uniqueStatuses = [...new Set(realStatuses)];
        const currentValue = actionsStatusFilter.value;
        actionsStatusFilter.innerHTML = '<option value="">Todos os Status</option>' +
            uniqueStatuses.map(status => `<option value="${status}">${status}</option>`).join('');
        actionsStatusFilter.value = currentValue;
    }
}

// Aplicar filtros avançados
function applyAdvancedFilters() {
    // Coletar valores dos filtros
    activeFilters = {
        collaborator: document.getElementById('filterCollaborator')?.value || '',
        supervisor: document.getElementById('filterSupervisor')?.value || '',
        profile: document.getElementById('filterProfile')?.value || '',
        dateRange: document.getElementById('filterDateRange')?.value || '',
        actionsStatus: document.getElementById('filterActionsStatus')?.value || '',

        search: document.getElementById('filterSearch')?.value || ''
    };
    
    // Filtrar PDIs
    const filteredPDIs = filterPDIs(activeFilters);
    
    // Renderizar resultados
    renderPDIList(filteredPDIs);
    
    // Atualizar filtros ativos
    updateActiveFilters();
}

// Filtrar PDIs baseado nos critérios
function filterPDIs(filters) {
    return allPDIs.filter(pdi => {
        // Filtro por colaborador
        if (filters.collaborator && pdi.collaborator_name !== filters.collaborator) {
            return false;
        }
        
        // Filtro por supervisor
        if (filters.supervisor && pdi.supervisor_name !== filters.supervisor) {
            return false;
        }
        
        // Filtro por perfil
        if (filters.profile && pdi.profile_type) {
            if (pdi.profile_type !== filters.profile) {
                return false;
            }
        }
        
        // Filtro por período de criação
        if (filters.dateRange) {
            const creationDate = new Date(pdi.created_at);
            const today = new Date();
            
            switch (filters.dateRange) {
                case 'last7days':
                    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (creationDate < sevenDaysAgo) return false;
                    break;
                case 'last30days':
                    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (creationDate < thirtyDaysAgo) return false;
                    break;
                case 'last90days':
                    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                    if (creationDate < ninetyDaysAgo) return false;
                    break;
                case 'thisYear':
                    if (creationDate.getFullYear() !== today.getFullYear()) return false;
                    break;
                case 'lastYear':
                    if (creationDate.getFullYear() !== today.getFullYear() - 1) return false;
                    break;
            }
        }
        
        // Filtro por status das ações
        if (filters.actionsStatus) {
            // Determinar o status visual do PDI (mesma lógica da renderização)
            let displayStatus = pdi.status;
            
            // Se temos estatísticas de ações e o PDI está "Ativo", verificar as ações
            if (pdi.actionStats && pdi.status === 'Ativo') {
                if (pdi.actionStats.allActionsCompleted) {
                    displayStatus = 'Concluído';
                } else if (pdi.actionStats.hasLateActions) {
                    displayStatus = 'Atrasado';
                } else if (pdi.actionStats.hasActionsInProgress) {
                    displayStatus = 'Em Andamento';
                }
            }
            
            // Verificar se o status do PDI corresponde ao filtro
            if (displayStatus !== filters.actionsStatus) {
                return false;
            }
        }
        

        
        // Filtro por busca de texto
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const searchableText = [
                pdi.collaborator_name,
                pdi.job_position,
                pdi.supervisor_name,
                pdi.profile_type
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
}



// Renderizar lista de PDIs
function renderPDIList(pdis) {
    const pdiList = document.getElementById('pdiList');
    const emptyPDIs = document.getElementById('emptyPDIs');
    const emptyFilterMessage = document.getElementById('emptyFilterMessage');
    
    if (!pdiList) return;
    
    pdiList.innerHTML = '';
    
    if (pdis.length === 0) {
        // Verificar se há filtros ativos
        const hasActiveFilters = Object.values(activeFilters).some(value => value !== '');
        
        if (hasActiveFilters) {
            emptyFilterMessage.classList.remove('d-none');
            emptyPDIs.classList.add('d-none');
        } else {
            emptyPDIs.classList.remove('d-none');
            emptyFilterMessage.classList.add('d-none');
        }
        return;
    }
    
    // Esconder mensagens de vazio
    emptyPDIs.classList.add('d-none');
    emptyFilterMessage.classList.add('d-none');
    
    pdis.forEach(pdi => {
        const row = document.createElement('tr');
        
        // Determinar o status visual do PDI
        let displayStatus = pdi.status;
        let statusClass = getStatusClass(pdi.status);
        let statusHtml = '';
        
        // Se temos estatísticas de ações e o PDI está "Ativo", verificar as ações
        if (pdi.actionStats && pdi.status === 'Ativo') {
            // Se todas as ações estão concluídas, mostrar como "Concluído" (com info)
            if (pdi.actionStats.allActionsCompleted) {
                statusHtml = `<span class="badge ${getStatusClass('Concluído')}">Concluído</span>
                              <span class="badge bg-info small ms-1">Todas ações concluídas</span>`;
            }
            // Se há ações atrasadas, mostrar como "Atrasado"
            else if (pdi.actionStats.hasLateActions) {
                statusHtml = `<span class="badge ${getStatusClass('Atrasado')}">Atrasado</span>
                              <span class="badge bg-warning small ms-1 text-dark">${pdi.actionStats.late} ${pdi.actionStats.late === 1 ? 'ação atrasada' : 'ações atrasadas'}</span>`;
            }
            // Se há ações em andamento, mostrar como "Em Andamento"
            else if (pdi.actionStats.hasActionsInProgress) {
                statusHtml = `<span class="badge bg-info">Em Andamento</span>`;
            }
            // Caso contrário, manter o status original
            else {
                statusHtml = `<span class="badge ${statusClass}">${displayStatus}</span>`;
            }
        } else {
            // Se não temos estatísticas ou o status não é "Ativo", manter o status original
            statusHtml = `<span class="badge ${statusClass}">${displayStatus}</span>`;
        }
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="me-2">
                        <img src="https://cdn.conlinebr.com.br/colaboradores/${pdi.collaborator_avatar || 'default-avatar.jpg'}" class="rounded-circle" width="40" height="40" alt="Avatar">
                    </div>
                    <div>
                        <h6 class="mb-0">${pdi.collaborator_name}</h6>
                    </div>
                </div>
            </td>
            <td>${pdi.job_position || '-'}</td>
            <td>${pdi.supervisor_name || '-'}</td>
            <td>
                <span class="badge bg-info">${pdi.profile_type || '-'}</span>
            </td>
            <td>
                ${statusHtml}
            </td>
            <td>${formatDate(pdi.created_at)}</td>
            <td>
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-primary" onclick="viewPDI(${pdi.id}, ${pdi.collaborator_id})">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-warning" onclick="openEditPDIWindow(${pdi.id})">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="deletePDI(${pdi.id})">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </td>
        `;
        
        pdiList.appendChild(row);
    });
}

// Atualizar filtros ativos
function updateActiveFilters() {
    const activeFiltersSection = document.getElementById('activeFilters');
    const activeFiltersTags = document.getElementById('activeFiltersTags');
    
    if (!activeFiltersSection || !activeFiltersTags) return;
    
    const activeFilterEntries = Object.entries(activeFilters).filter(([key, value]) => value !== '');
    
    if (activeFilterEntries.length === 0) {
        activeFiltersSection.classList.add('d-none');
        return;
    }
    
    activeFiltersSection.classList.remove('d-none');
    activeFiltersTags.innerHTML = '';
    
    activeFilterEntries.forEach(([key, value]) => {
        const tag = document.createElement('span');
        tag.className = 'badge bg-primary me-1';
        tag.innerHTML = `${getFilterLabel(key)}: ${value} <i class="ri-close-line ms-1" onclick="removeFilter('${key}')"></i>`;
        activeFiltersTags.appendChild(tag);
    });
}

// Obter label do filtro
function getFilterLabel(filterKey) {
    const labels = {
        collaborator: 'Colaborador',
        supervisor: 'Supervisor',
        profile: 'Perfil',
        dateRange: 'Período',
        actionsStatus: 'Status das Ações',
        search: 'Busca'
    };
    return labels[filterKey] || filterKey;
}

// Remover filtro específico
function removeFilter(filterKey) {
    const filterElement = document.getElementById(`filter${filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}`);
    if (filterElement) {
        filterElement.value = '';
    }
    applyAdvancedFilters();
}

// Limpar todos os filtros avançados
function clearAdvancedFilters() {
    // Limpar todos os campos de filtro
    const filterFields = [
        'filterCollaborator',
        'filterSupervisor',
        'filterProfile',
        'filterDateRange',
        'filterActionsStatus',
        'filterSearch'
    ];
    
    filterFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });
    
    // Resetar filtros ativos
    activeFilters = {
        collaborator: '',
        supervisor: '',
        profile: '',
        dateRange: '',
        actionsStatus: '',
        search: ''
    };
    
    // Aplicar filtros (que agora mostrará todos os PDIs)
    applyAdvancedFilters();
}

// Carregar indicadores do dashboard
async function loadDashboardIndicators() {
    try {
        showLoader();
        
        // Obter dados para indicadores
        const response = await fetch('/api/pdi-hub/getDashboardIndicators');
        const result = await response.json();
        
        hideLoader();
        
        if (!result.success) {
            console.error('Falha ao carregar indicadores:', result.message);
            return;
        }
        
        // Atualizar contadores
        updateCounters(result.data.counters);
        
        // Atualizar gráfico de distribuição por perfil
        const profileData = result.data.profileDistribution;
        
        if (profileData && profileData.labels && profileData.labels.length > 0 && profileData.series && profileData.series.length > 0) {
            renderProfileDistributionChart(profileData);
        } else {
            renderProfileDistributionChart({
                labels: ['Perfil A', 'Perfil B', 'Perfil C'],
                series: [10, 5, 3]
            });
        }
        
        // Atualizar gráfico de avaliações mensais
        renderMonthlyEvaluationsChart(result.data.monthlyEvaluations);
        
        // Armazenar avaliações na variável global e atualizar tabela
        allRecentEvaluations = result.data.recentEvaluations || [];
        renderRecentEvaluations(allRecentEvaluations);
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        hideLoader();
    }
}

// Atualizar contadores
function updateCounters(counters) {
    document.getElementById('totalPDIs').textContent = counters.total;
    document.getElementById('inProgressPDIs').textContent = counters.inProgress;
    document.getElementById('completedPDIs').textContent = counters.completed;
    document.getElementById('latePDIs').textContent = counters.late;
    
    // Adicionar tooltips com explicações
    const inProgressElement = document.getElementById('inProgressPDIs').closest('.card');
    if (inProgressElement) {
        const tooltipText = document.createElement('div');
        tooltipText.className = 'mt-2 small';
        tooltipText.innerHTML = 'PDIs que têm ações com status "Em Andamento"';
        const footer = inProgressElement.querySelector('.card-footer');
        if (footer) {
            footer.innerHTML = '';
            footer.appendChild(tooltipText);
        }
    }
    
    console.log('Contadores atualizados:', counters);
}

// Renderizar gráfico de distribuição por perfil
function renderProfileDistributionChart(data) {
    // Verificar se os dados estão no formato correto
    if (!data) {
        document.getElementById('profileDistributionChart').innerHTML = '<div class="text-center p-4 text-muted">Dados não fornecidos</div>';
        return;
    }
    
    // Verificar se temos labels e series
    if (!data.labels || !data.series) {
        document.getElementById('profileDistributionChart').innerHTML = '<div class="text-center p-4 text-muted">Estrutura de dados incorreta</div>';
        return;
    }
    
    if (data.labels.length === 0) {
        document.getElementById('profileDistributionChart').innerHTML = '<div class="text-center p-4 text-muted">Nenhum perfil encontrado</div>';
        return;
    }
    
    // Garantir que os dados estão no formato correto
    const series = Array.isArray(data.series) ? data.series : [];
    const labels = Array.isArray(data.labels) ? data.labels : [];
    
    const options = {
        series: series,
        chart: {
            type: 'donut',
            height: 300
        },
        labels: labels,
        colors: ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0', '#607d8b'],
        legend: {
            position: 'bottom'
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 300
                },
                legend: {
                    position: 'bottom'
                }
            }
        }],
        plotOptions: {
            pie: {
                donut: {
                    size: '60%'
                }
            }
        }
    };
    
    if (profileChartInstance) {
        profileChartInstance.destroy();
    }
    
    const chartElement = document.getElementById('profileDistributionChart');
    
    // Aguardar um pouco para garantir que o ApexCharts carregou
    if (typeof ApexCharts === 'undefined') {
        setTimeout(() => {
            renderProfileDistributionChart(data);
        }, 1000);
        return;
    }
    
    if (chartElement && typeof ApexCharts !== 'undefined') {
        try {
            profileChartInstance = new ApexCharts(chartElement, options);
            profileChartInstance.render();
        } catch (error) {
            chartElement.innerHTML = '<div class="text-center p-4 text-danger">Erro ao renderizar gráfico</div>';
        }
    } else {
        if (chartElement) {
            chartElement.innerHTML = '<div class="text-center p-4 text-warning">ApexCharts não disponível</div>';
        }
    }
}

// Renderizar gráfico de avaliações mensais
function renderMonthlyEvaluationsChart(data) {
    if (!data || !data.months || !data.averages || data.months.length === 0) {
        document.getElementById('monthlyEvaluationsChart').innerHTML = '<div class="text-center p-4 text-muted">Dados insuficientes para gerar o gráfico</div>';
        return;
    }
    
    const options = {
        series: [{
            name: 'Média das Avaliações',
            data: data.averages
        }],
        chart: {
            type: 'bar',
            height: 300,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 4
            }
        },
        dataLabels: {
            enabled: false
        },
        colors: ['#3f51b5'],
        xaxis: {
            categories: data.months
        },
        yaxis: {
            min: 0,
            max: 5,
            tickAmount: 5,
            labels: {
                formatter: function (val) {
                    return val.toFixed(1);
                }
            },
            title: {
                text: 'Média (1-5)'
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val.toFixed(2);
                }
            }
        }
    };
    
    if (evaluationsChartInstance) {
        evaluationsChartInstance.destroy();
    }
    
    const chartElement = document.getElementById('monthlyEvaluationsChart');
    if (chartElement && typeof ApexCharts !== 'undefined') {
        evaluationsChartInstance = new ApexCharts(chartElement, options);
        evaluationsChartInstance.render();
    } else {
        console.error('ApexCharts não está disponível ou elemento do gráfico não encontrado');
    }
}

// Renderizar avaliações recentes
function renderRecentEvaluations(evaluations) {
    // Se não foram passadas avaliações específicas, usar todas as avaliações
    if (!evaluations) {
        evaluations = allRecentEvaluations;
    }
    
    const tableBody = document.getElementById('recentEvaluationsList');
    const noEvaluations = document.getElementById('noRecentEvaluations');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    if (!evaluations || evaluations.length === 0) {
        if (noEvaluations) noEvaluations.classList.remove('d-none');
        return;
    }
    if (noEvaluations) noEvaluations.classList.add('d-none');
    
    evaluations.forEach(evaluation => {
        const row = document.createElement('tr');
        
        // Usar a média pronta do backend
        const average = (typeof evaluation.media === 'number') ? evaluation.media.toFixed(2)
                       : (typeof evaluation.average_score === 'number') ? evaluation.average_score.toFixed(2)
                       : (typeof evaluation.score === 'number') ? evaluation.score.toFixed(2)
                       : 'N/A';
        // Badge de cor
        let badgeClass = 'bg-secondary';
        if (average !== 'N/A') {
            const avgNum = parseFloat(average);
            if (avgNum >= 4.5) badgeClass = 'bg-success';
            else if (avgNum >= 3.5) badgeClass = 'bg-primary';
            else if (avgNum >= 2.5) badgeClass = 'bg-warning';
            else badgeClass = 'bg-danger';
        }
        // Período avaliado
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const monthName = monthNames[evaluation.month - 1];
        const period = `${monthName}/${evaluation.year}`;
        // Botão de ação para abrir avaliação
        const actionBtn = `
            <button type="button" class="btn btn-sm btn-outline-primary" title="Visualizar Avaliação"
                onclick="openEvaluationWindowFromCoordinator(${evaluation.pdi_id}, ${evaluation.month}, ${evaluation.year}, '${encodeURIComponent(evaluation.collaborator_name)}')">
                <i class=\"ri-eye-line\"></i>
            </button>
        `;
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="me-2">
                        <img src="https://cdn.conlinebr.com.br/colaboradores/${evaluation.collaborator_avatar || 'default-avatar.jpg'}" 
                            class="rounded-circle" width="32" height="32" alt="${evaluation.collaborator_name}">
                    </div>
                    <div>
                        ${evaluation.collaborator_name}
                    </div>
                </div>
            </td>
            <td><strong>${period}</strong></td>
            <td><span class="badge ${badgeClass}">${average}</span></td>
            <td>${evaluation.supervisor_name}</td>
            <td>${formatDate(evaluation.created_at)}</td>
            <td>${actionBtn}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Carregar a lista de PDIs
async function loadPDIList() {
    try {
        showLoader();
        
        // Obter dados da sessão para verificar o ID do colaborador
        const urlParams = new URLSearchParams(window.location.search);
        const collaboratorId = urlParams.get('id_collaborator') || '';
        
        console.log('Carregando PDIs, collaboratorId:', collaboratorId);
        
        const response = await fetch(`/api/pdi-hub/getAllPDIs?supervisor_id=${collaboratorId}`);
        const pdis = await response.json();
        
        console.log('PDIs carregados:', pdis);
        
        hideLoader();
        
        // Verificar se pdis é um array (API retorna diretamente o array)
        const pdisArray = Array.isArray(pdis) ? pdis : 
                         (pdis.data && Array.isArray(pdis.data) ? pdis.data : []);
        
        // Armazenar todos os PDIs na variável global para filtros
        allPDIs = pdisArray;
        
        if (pdisArray.length === 0) {
            document.getElementById('emptyPDIs').classList.remove('d-none');
            return;
        }
        
        document.getElementById('emptyPDIs').classList.add('d-none');
        
        // Popular opções dos filtros com os dados reais
        populateFilterOptions();
        
        // Usar a nova função de renderização
        renderPDIList(pdisArray);
    } catch (error) {
        console.error('Erro ao carregar a lista de PDIs:', error);
        hideLoader();
        showErrorAlert('Não foi possível carregar a lista de PDIs. Por favor, tente novamente.');
    }
}

// Abrir janela para criar novo PDI
function openNewPDIWindow() {
    const url = '/app/administration/pdi-hub/create-pdi.html';
    const windowFeatures = 'width=1000,height=800,resizable=yes,scrollbars=yes';
    window.open(url, '_blank', windowFeatures);
}

// Abrir janela para editar PDI
function openEditPDIWindow(id) {
    const url = `/app/administration/pdi-hub/edit-pdi.html?id=${id}`;
    const windowFeatures = 'width=1000,height=800,resizable=yes,scrollbars=yes';
    window.open(url, '_blank', windowFeatures);
}

// Abrir janela de avaliação a partir do coordenador
function openEvaluationWindowFromCoordinator(pdiId, month, year, collaboratorName) {
    const decodedName = decodeURIComponent(collaboratorName);
    const url = `/app/administration/pdi-hub/evaluation.html?pdi_id=${pdiId}&month=${month}&year=${year}&collaborator_name=${encodeURIComponent(decodedName)}`;
    const windowFeatures = 'width=1000,height=800,resizable=yes,scrollbars=yes';
    window.open(url, '_blank', windowFeatures);
}

// Abrir modal para editar PDI existente
async function editPDI(id) {
    try {
        showLoader();
        
        // Buscar dados do PDI
        const response = await fetch('/api/pdi-hub/getPDIView', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        });
        
        const result = await response.json();
        
        hideLoader();
        
        if (!result.success) {
            showErrorAlert(result.message || 'Não foi possível carregar os detalhes do PDI.');
            return;
        }
        
        const pdi = result.data;
        
        // Preencher o formulário com os dados do PDI
        document.getElementById('pdiId').value = pdi.id;
        
        // Selecionar o colaborador e supervisor nos dropdowns
        const collaboratorSelect = document.getElementById('collaborator_id');
        const supervisorSelect = document.getElementById('supervisor_id');
        
        // Atualizar as seleções nos dropdowns
        if (collaboratorSelect.choices) {
            collaboratorSelect.choices.setChoiceByValue(pdi.collaborator_id.toString());
        } else {
            collaboratorSelect.value = pdi.collaborator_id;
        }
        
        if (supervisorSelect.choices) {
            supervisorSelect.choices.setChoiceByValue(pdi.supervisor_id.toString());
        } else {
            supervisorSelect.value = pdi.supervisor_id;
        }
        
        // Preencher os campos de texto
        document.getElementById('academic_summary').value = pdi.academic_summary || '';
        document.getElementById('who_are_you').value = pdi.who_are_you || '';
        document.getElementById('strengths').value = pdi.strengths || '';
        document.getElementById('improvement_points').value = pdi.improvement_points || '';
        document.getElementById('development_goals').value = pdi.development_goals || '';
        document.getElementById('profile_type').value = pdi.profile_type || '';
        
        // Limpar e adicionar ações do PDI
        document.getElementById('actionsContainer').innerHTML = '';
        actionCounter = 0;
        
        if (pdi.actions && pdi.actions.length > 0) {
            pdi.actions.forEach(action => {
                addActionRow(action);
            });
        }
        
        // Atualizar o título do modal
        document.getElementById('newPDIModalLabel').textContent = 'Editar Plano de Desenvolvimento Individual';
        
        // Abrir o modal
        const modal = new bootstrap.Modal(document.getElementById('newPDIModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao editar PDI:', error);
        hideLoader();
        showErrorAlert('Não foi possível carregar os detalhes do PDI para edição. Por favor, tente novamente.');
    }
}

// Função para visualizar um PDI específico
function viewPDI(pdiId, collaboratorId) {
    console.log("Visualizando PDI:", pdiId, "de colaborador:", collaboratorId);
    
    // Limpar valores antigos para evitar confusões
    localStorage.removeItem('current_pdi_id');
    localStorage.removeItem('current_collaborator_id');
    
    // Armazenar IDs no localStorage apenas se forem válidos
    if (collaboratorId) {
        localStorage.setItem('current_collaborator_id', collaboratorId);
    }
    if (pdiId) {
        localStorage.setItem('current_pdi_id', pdiId);
    }
    
    // Abrir a página do colaborador com os parâmetros
    const url = `./collaborator.html?pdi_id=${pdiId}${collaboratorId ? `&id_collaborator=${collaboratorId}` : ''}`;
    window.open(url, '_blank');
}

// Excluir um PDI
async function deletePDI(id) {
    try {
        // Confirmação antes de excluir
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Essa ação não poderá ser revertida!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        });
        
        if (!result.isConfirmed) {
            return;
        }
        
        showLoader();
        
        // Executar a exclusão
        const response = await fetch('/api/pdi-hub/deletePDI', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        });
        
        const data = await response.json();
        
        hideLoader();
        
        if (data.success) {
            showSuccessAlert('PDI excluído com sucesso!');
            loadPDIList(); // Recarregar a lista
        } else {
            showErrorAlert(data.message || 'Não foi possível excluir o PDI.');
        }
        
    } catch (error) {
        console.error('Erro ao excluir PDI:', error);
        hideLoader();
        showErrorAlert('Não foi possível excluir o PDI. Por favor, tente novamente.');
    }
}

// Salvar PDI (criar ou atualizar)
async function savePDI() {
    try {
        // Validar formulário
        const form = document.getElementById('newPDIForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        showLoader();
        
        // Coletar os dados do formulário
        const formData = {
            id: document.getElementById('pdiId').value,
            collaborator_id: document.getElementById('collaborator_id').value,
            supervisor_id: document.getElementById('supervisor_id').value,
            academic_summary: document.getElementById('academic_summary').value,
            who_are_you: document.getElementById('who_are_you').value,
            strengths: document.getElementById('strengths').value,
            improvement_points: document.getElementById('improvement_points').value,
            development_goals: document.getElementById('development_goals').value,
            profile_type: document.getElementById('profile_type').value,
            actions: getActionsFromForm(),
            actions_to_delete: actionsToDelete
        };
        
        // Determinar se é uma criação ou atualização
        const isUpdate = formData.id ? true : false;
        const url = isUpdate ? '/api/pdi-hub/updatePDI' : '/api/pdi-hub/createPDI';
        
        // Enviar requisição
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        hideLoader();
        
        if (result.success) {
            // Fechar o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newPDIModal'));
            modal.hide();
            
            // Mostrar mensagem de sucesso
            const message = isUpdate ? 'PDI atualizado com sucesso!' : 'PDI criado com sucesso!';
            showSuccessAlert(message);
            
            // Recarregar a lista
            loadPDIList();
        } else {
            showErrorAlert(result.message || 'Não foi possível salvar o PDI.');
        }
        
    } catch (error) {
        console.error('Erro ao salvar PDI:', error);
        hideLoader();
        showErrorAlert('Não foi possível salvar o PDI. Por favor, tente novamente.');
    }
}

// Adicionar linha de ação ao formulário
function addActionRow(action = null) {
    const actionsContainer = document.getElementById('actionsContainer');
    const actionRow = document.createElement('div');
    actionRow.className = 'action-row border rounded p-3 mb-3';
    actionRow.id = `action-${actionCounter}`;
    
    let actionId = '';
    let description = '';
    let deadline = '';
    
    if (action) {
        // Se for uma ação existente
        actionId = `value="${action.id}"`;
        description = action.description;
        
        // Formatar a data do prazo para o formato yyyy-MM-dd do input type="date"
        if (action.deadline) {
            const date = new Date(action.deadline);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            deadline = `${year}-${month}-${day}`;
        }
    }
    
    actionRow.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Ação #${actionCounter + 1}</h6>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeActionRow(${actionCounter})">
                <i class="ri-delete-bin-line"></i>
            </button>
        </div>
        <input type="hidden" name="action_id_${actionCounter}" ${actionId}>
        <div class="mb-3">
            <label for="action_description_${actionCounter}" class="form-label">Descrição da Ação</label>
            <textarea class="form-control" id="action_description_${actionCounter}" name="action_description_${actionCounter}" rows="2" required>${description}</textarea>
        </div>
        <div class="mb-3">
            <label for="action_deadline_${actionCounter}" class="form-label">Prazo</label>
            <input type="date" class="form-control" id="action_deadline_${actionCounter}" name="action_deadline_${actionCounter}" value="${deadline}" required>
        </div>
    `;
    
    actionsContainer.appendChild(actionRow);
    actionCounter++;
}

// Remover linha de ação do formulário
function removeActionRow(index) {
    const actionRow = document.getElementById(`action-${index}`);
    
    // Se tiver ID (ação existente), adicionar à lista para exclusão
    const actionIdInput = actionRow.querySelector(`input[name="action_id_${index}"]`);
    if (actionIdInput && actionIdInput.value) {
        actionsToDelete.push(actionIdInput.value);
    }
    
    // Remover o elemento do DOM
    actionRow.remove();
}

// Obter as ações do formulário
function getActionsFromForm() {
    const actions = [];
    const actionRows = document.querySelectorAll('.action-row');
    
    actionRows.forEach((row, index) => {
        const rowId = row.id.split('-')[1];
        
        const action = {
            id: row.querySelector(`input[name="action_id_${rowId}"]`).value || null,
            description: row.querySelector(`textarea[name="action_description_${rowId}"]`).value,
            deadline: row.querySelector(`input[name="action_deadline_${rowId}"]`).value
        };
        
        actions.push(action);
    });
    
    return actions;
}

// Função para formatar data
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Função para obter classe CSS do status
function getStatusClass(status) {
    switch (status) {
        case 'Ativo':
            return 'bg-success';
        case 'Em Andamento':
            return 'bg-info';
        case 'Concluído':
            return 'bg-success';
        case 'Atrasado':
            return 'bg-danger';
        case 'Cancelado':
            return 'bg-secondary';
        default:
            return 'bg-secondary';
    }
}

// Função para obter classe CSS do badge de status
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Ativo':
            return 'bg-success';
        case 'Em Andamento':
            return 'bg-info';
        case 'Concluído':
            return 'bg-success';
        case 'Atrasado':
            return 'bg-danger';
        case 'Cancelado':
            return 'bg-secondary';
        default:
            return 'bg-secondary';
    }
}

// Função para mostrar loader
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

// Função para esconder loader
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Função para mostrar alerta de erro
function showErrorAlert(message) {
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: message,
        confirmButtonColor: '#dc3545'
    });
}

// Função para mostrar alerta de sucesso
function showSuccessAlert(message) {
    Swal.fire({
        icon: 'success',
        title: 'Sucesso',
        text: message,
        confirmButtonColor: '#198754'
    });
}

// ==================== FILTROS DAS AÇÕES ====================

// Mostrar/esconder filtros das ações
function toggleActionFilters() {
    const filtersSection = document.getElementById('actionFiltersSection');
    const isHidden = filtersSection.classList.contains('d-none');
    
    if (isHidden) {
        filtersSection.classList.remove('d-none');
        populateActionFilterOptions();
    } else {
        filtersSection.classList.add('d-none');
    }
}

// Popular opções dos filtros das ações
function populateActionFilterOptions() {
    if (allGlobalActions.length === 0) return;
    
    // Popular filtro de colaboradores
    const collaboratorFilter = document.getElementById('filterActionCollaborator');
    if (collaboratorFilter) {
        const uniqueCollaborators = [...new Set(allGlobalActions.map(a => a.collaborator_name).filter(Boolean))];
        const currentValue = collaboratorFilter.value;
        collaboratorFilter.innerHTML = '<option value="">Todos os Colaboradores</option>' +
            uniqueCollaborators.map(name => `<option value="${name}">${name}</option>`).join('');
        collaboratorFilter.value = currentValue;
    }
}

// Aplicar filtros das ações
function applyActionFilters() {
    // Coletar valores dos filtros
    actionFilters = {
        collaborator: document.getElementById('filterActionCollaborator')?.value || '',
        status: document.getElementById('filterActionStatus')?.value || '',
        deadline: document.getElementById('filterActionDeadline')?.value || '',
        search: document.getElementById('filterActionSearch')?.value || ''
    };
    
    // Filtrar ações
    const filteredActions = filterActions(actionFilters);
    
    // Renderizar resultados
    renderGlobalActionsList(filteredActions);
}

// Filtrar ações baseado nos critérios
function filterActions(filters) {
    return allGlobalActions.filter(action => {
        // Filtro por colaborador
        if (filters.collaborator && action.collaborator_name !== filters.collaborator) {
            return false;
        }
        
        // Filtro por status
        if (filters.status) {
            let displayStatus = action.status;
            
            // Verificar se está atrasada
            if (action.status !== 'Concluído' && action.status !== 'Cancelado') {
                const deadlineDate = new Date(action.deadline);
                if (deadlineDate < new Date()) {
                    displayStatus = 'Atrasado';
                }
            }
            
            if (displayStatus !== filters.status) {
                return false;
            }
        }
        
        // Filtro por prazo
        if (filters.deadline) {
            const deadlineDate = new Date(action.deadline);
            const today = new Date();
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            const endOfWeek = new Date(today.getTime() + (7 - today.getDay()) * 24 * 60 * 60 * 1000);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            
            switch (filters.deadline) {
                case 'overdue':
                    if (action.status === 'Concluído' || action.status === 'Cancelado' || deadlineDate >= today) {
                        return false;
                    }
                    break;
                case 'due_today':
                    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    if (deadlineDate < startOfDay || deadlineDate > endOfDay) {
                        return false;
                    }
                    break;
                case 'due_week':
                    if (deadlineDate < today || deadlineDate > endOfWeek) {
                        return false;
                    }
                    break;
                case 'due_month':
                    if (deadlineDate < today || deadlineDate > endOfMonth) {
                        return false;
                    }
                    break;
                case 'completed':
                    if (action.status !== 'Concluído') {
                        return false;
                    }
                    break;
            }
        }
        
        // Filtro por busca de texto
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const searchableText = action.description.toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
}

// Limpar filtros das ações
function clearActionFilters() {
    actionFilters = {
        collaborator: '',
        status: '',
        deadline: '',
        search: ''
    };
    
    // Limpar valores dos campos
    document.getElementById('filterActionCollaborator').value = '';
    document.getElementById('filterActionStatus').value = '';
    document.getElementById('filterActionDeadline').value = '';
    document.getElementById('filterActionSearch').value = '';
    
    // Renderizar todas as ações
    renderGlobalActionsList(allGlobalActions);
}

// ==================== AÇÕES DOS PDIs (GLOBAL) ====================

async function loadGlobalActionsList(status = '', collaborator = '') {
    try {
        showLoader();
        // Buscar todas as ações, sem filtro de status
        const response = await fetch(`/api/pdi-hub/getAllActionsGlobal`);
        const result = await response.json();
        hideLoader();
        allGlobalActions = result.success ? result.data : [];
        populateActionFilterOptions();
        renderGlobalActionsList(filterActions(actionFilters));
    } catch (error) {
        hideLoader();
        renderGlobalActionsList([]);
    }
}



function renderGlobalActionsList(actions) {
    const actionsListElement = document.getElementById('actionsListIndex');
    const noActions = document.getElementById('noActionsIndex');
    if (!actionsListElement) return;
    
    actionsListElement.innerHTML = '';
    if (!actions || actions.length === 0) {
        if (noActions) noActions.classList.remove('d-none');
        return;
    }
    if (noActions) noActions.classList.add('d-none');
    
    const today = new Date();
    actions.forEach(action => {
        const row = document.createElement('tr');
        let displayStatus = action.status;
        if (displayStatus !== 'Concluído' && displayStatus !== 'Cancelado') {
            const deadlineDate = new Date(action.deadline);
            if (deadlineDate < today) {
                displayStatus = 'Atrasado';
            }
        }
        row.innerHTML = `
            <td>${action.collaborator_name}</td>
            <td>${action.description}</td>
            <td>${formatDate(action.deadline)}</td>
            <td><span class="badge ${getStatusClass(displayStatus)}">${displayStatus}</span></td>
            <td>${action.completion_date ? formatDate(action.completion_date) : '-'}</td>
        `;
        // Ao clicar na linha, abrir o modal de visualização
        row.style.cursor = 'pointer';
        row.addEventListener('click', function() {
            openViewActionModal(action.id);
        });
        actionsListElement.appendChild(row);
    });
}

async function openViewActionModal(actionId) {
    try {
        // Buscar dados completos da ação
        const response = await fetch(`/api/pdi-hub/getActionById?actionId=${actionId}`);
        const result = await response.json();
        if (!result.success || !result.data) {
            Swal.fire('Erro', 'Não foi possível carregar os detalhes da ação.', 'error');
            return;
        }
        const action = result.data;
        
        // Buscar nome do colaborador (se não vier na ação, buscar na lista já carregada)
        let collaboratorName = action.collaborator_name;
        if (!collaboratorName) {
            // Tenta encontrar na lista já carregada
            const found = allGlobalActions.find(a => a.id == actionId);
            collaboratorName = found ? found.collaborator_name : '-';
        }
        
        // Preencher dados no modal
        document.getElementById('viewActionDescription').textContent = action.description || '-';
        document.getElementById('viewActionCollaborator').textContent = collaboratorName;
        document.getElementById('viewActionDeadline').textContent = formatDate(action.deadline);
        document.getElementById('viewActionStatus').textContent = action.status || '-';
        document.getElementById('viewActionCompletionDate').textContent = action.completion_date ? formatDate(action.completion_date) : '-';
        
        // Anexos
        const attachmentsContainer = document.getElementById('viewActionAttachments');
        let attachments = action.attachment || [];
        if (typeof attachments === 'string') {
            try {
                attachments = JSON.parse(attachments);
            } catch (e) {
                attachments = [];
            }
        }
        
        if (attachments && attachments.length > 0) {
            attachmentsContainer.innerHTML = attachments.map(attachment => 
                `<a href="${attachment.url}" target="_blank" class="btn btn-sm btn-outline-primary me-2 mb-2">
                    <i class="ri-attachment-2 me-1"></i>${attachment.name}
                </a>`
            ).join('');
        } else {
            attachmentsContainer.innerHTML = '<span class="text-muted">Nenhum anexo</span>';
        }
        
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('viewActionModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao abrir modal de ação:', error);
        Swal.fire('Erro', 'Não foi possível carregar os detalhes da ação.', 'error');
    }
}