/**
 * PDI Hub - Script para a página do supervisor
 */

// Variáveis globais
let actionCounter = 0;
let actionsToDelete = [];
let profileChartInstance = null;
let evaluationsChartInstance = null;
let supervisorId = null;
let allActions = [];
let allRecentEvaluations = [];

// Esperar o documento carregar
document.addEventListener('DOMContentLoaded', async function() {
    try {
    showLoader();
        
        // Obter ID do supervisor logado
        supervisorId = await getSupervisorId();
        if (!supervisorId) {
            showError('Não foi possível identificar o supervisor logado. Verifique se você está autenticado corretamente.');
            hideLoader();
            return;
        }
        
        // Inicializar elementos
        setupEventListeners();
        await loadPDIList();
        
        // Verificar o estado salvo no localStorage para os indicadores
        const indicatorsVisible = localStorage.getItem('pdiHubIndicatorsVisible') === 'true';
        if (indicatorsVisible) {
            const dashboardIndicators = document.getElementById('dashboardIndicators');
            const btnToggleText = document.getElementById('btnToggleText');
            
            dashboardIndicators.classList.remove('d-none');
            btnToggleText.textContent = 'Esconder Indicadores';
            
            // Carregar os indicadores
            if (!dashboardIndicators.dataset.loaded) {
                loadDashboardIndicators();
                dashboardIndicators.dataset.loaded = 'true';
            }
        }
        
        hideLoader();
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        hideLoader();
        showError('Erro ao carregar a página: ' + error.message);
    }
});

// Obter ID do supervisor logado
async function getSupervisorId() {
    // Verificar storage local primeiro
        const storage = localStorage.getItem('StorageGoogle');
        if (storage) {
            try {
                const obj = JSON.parse(storage);
                if (obj && obj.system_collaborator_id) {
                return obj.system_collaborator_id;
            }
        } catch (e) {
            console.error('Erro ao parsear StorageGoogle:', e);
        }
    }
    
    // Tentar obter da sessão via API
    try {
        const response = await fetch('/api/session/getSession');
        const result = await response.json();
        
        if (result.success && result.data && result.data.system_collaborator_id) {
            return result.data.system_collaborator_id;
        }
    } catch (error) {
        console.error('Erro ao obter sessão:', error);
    }
    
    return null;
}

// Configurar os listeners de eventos
function setupEventListeners() {
    // Botão para abrir a nova janela de criação de PDI
    const btnNewPDI = document.getElementById('btnNewPDI');
    if (btnNewPDI) {
        btnNewPDI.addEventListener('click', openNewPDIWindow);
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
    
    // Seletor de filtro de status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterPDIsByStatus);
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

// Carregar indicadores do dashboard
async function loadDashboardIndicators() {
    try {
        showLoader();
        
        // Obter dados para indicadores, filtrando pelo supervisor
        const response = await fetch(`/api/pdi-hub/getDashboardIndicators?supervisor_id=${supervisorId}`);
        const result = await response.json();
        
        hideLoader();
        
        if (!result.success) {
            console.error('Falha ao carregar indicadores:', result.message);
            return;
        }
        
        // Atualizar contadores
        updateCounters(result.data.counters);
        
        // Atualizar gráfico de distribuição por perfil
        renderProfileDistributionChart(result.data.profileDistribution);
        
        // Atualizar gráfico de avaliações mensais
        renderMonthlyEvaluationsChart(result.data.monthlyEvaluations);
        
        // Atualizar tabela de avaliações recentes
        renderRecentEvaluations(result.data.recentEvaluations);
        
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
    if (!data || !data.labels || !data.series || data.labels.length === 0) {
        document.getElementById('profileDistributionChart').innerHTML = '<div class="text-center p-4 text-muted">Dados insuficientes para gerar o gráfico</div>';
                    return;
                }
    
    const options = {
        series: data.series,
        chart: {
            type: 'donut',
            height: 300
        },
        labels: data.labels,
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
    
    profileChartInstance = new ApexCharts(document.getElementById('profileDistributionChart'), options);
    profileChartInstance.render();
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
    
    evaluationsChartInstance = new ApexCharts(document.getElementById('monthlyEvaluationsChart'), options);
    evaluationsChartInstance.render();
}

// Renderizar avaliações recentes
function renderRecentEvaluations(evaluations) {
    allRecentEvaluations = evaluations || [];
    const container = document.getElementById('recentEvaluationsList');
    const noDataMessage = document.getElementById('noRecentEvaluations');
    const filterSelect = document.getElementById('filterColaborador');

    // Preencher filtro de colaborador
    if (filterSelect) {
        // Extrair nomes únicos dos colaboradores
        const uniqueNames = [...new Set(allRecentEvaluations.map(e => e.collaborator_name))];
        // Salvar valor atual
        const currentValue = filterSelect.value;
        filterSelect.innerHTML = '<option value="">Todos</option>' + uniqueNames.map(name => `<option value="${name}">${name}</option>`).join('');
        // Restaurar seleção se possível
        filterSelect.value = currentValue || '';
    }

    // Função para filtrar avaliações
    function getFilteredEvaluations() {
        if (!filterSelect || !filterSelect.value) return allRecentEvaluations;
        return allRecentEvaluations.filter(e => e.collaborator_name === filterSelect.value);
    }

    // Evento de filtro
    if (filterSelect && !filterSelect._listenerAdded) {
        filterSelect.addEventListener('change', () => {
            renderRecentEvaluations(getFilteredEvaluations());
        });
        filterSelect._listenerAdded = true;
    }

    // Renderizar tabela
    const evaluationsToShow = getFilteredEvaluations();
    if (!evaluationsToShow || evaluationsToShow.length === 0) {
        container.innerHTML = '';
        noDataMessage.classList.remove('d-none');
        return;
    }
    noDataMessage.classList.add('d-none');
    container.innerHTML = '';
    evaluationsToShow.forEach(evaluation => {
        const row = document.createElement('tr');
        // Período
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const period = `${monthNames[evaluation.month - 1]}/${evaluation.year}`;
        // Média
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
        // Colaborador com imagem
        const collaboratorName = `
            <div class="d-flex align-items-center">
                <img src="https://cdn.conlinebr.com.br/colaboradores/${evaluation.collaborator_avatar || 'default-avatar.jpg'}"
                    class="rounded-circle me-2" width="32" height="32" alt="${evaluation.collaborator_name}">
                <a href="javascript:void(0)" class="fw-semibold" onclick="viewPDI(${evaluation.pdi_id}, ${evaluation.collaborator_id})">
                    ${evaluation.collaborator_name}
                </a>
            </div>
        `;
        // Data da avaliação
        const evaluationDate = formatDate(evaluation.created_at);

        // Botão de ação para abrir avaliação
        const actionBtn = `
            <button type="button" class="btn btn-sm btn-outline-primary" title="Visualizar Avaliação"
                onclick="openEvaluationWindowFromCoordinator(${evaluation.pdi_id}, ${evaluation.month}, ${evaluation.year}, '${encodeURIComponent(evaluation.collaborator_name)}')">
                <i class="ri-eye-line"></i>
            </button>
        `;

        row.innerHTML = `
            <td>${collaboratorName}</td>
            <td><strong>${period}</strong></td>
            <td><span class="badge ${badgeClass}">${average}</span></td>
            <td>${evaluation.supervisor_name}</td>
            <td>${evaluationDate}</td>
            <td>${actionBtn}</td>
        `;
        container.appendChild(row);
    });
}

// Carregar lista de PDIs
async function loadPDIList() {
    try {
        showLoader();
        
        // Chamar API para obter PDIs, filtrando pelo supervisor
        const response = await fetch(`/api/pdi-hub/getAllPDIs?supervisor_id=${supervisorId}`);
        const result = await response.json();
        
        hideLoader();
        
        if (!result.success) {
            console.error('Falha ao carregar PDIs:', result.message);
            return;
        }
        
        const pdis = result.data;
        
        // Verificar se não há PDIs
        if (!pdis || pdis.length === 0) {
            document.getElementById('pdiList').innerHTML = '';
            document.getElementById('emptyPDIs').classList.remove('d-none');
            return;
        }
        
        // Ocultar mensagem de vazios e preencher a tabela
        document.getElementById('emptyPDIs').classList.add('d-none');
        
        // Encontrar o container da tabela
        const pdiListContainer = document.getElementById('pdiList');
        
        if (!pdiListContainer) {
            console.error('Container da lista de PDIs não encontrado no DOM');
            return;
        }
        
        // Limpar o container
        pdiListContainer.innerHTML = '';
        
        // Adicionar cada PDI à tabela
        pdis.forEach(pdi => {
            const row = document.createElement('tr');
            row.setAttribute('data-status', pdi.status);
            
            // Formatar a data de criação
            const createdAt = formatDate(pdi.created_at);
            
            // Gerar o HTML da linha
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="https://cdn.conlinebr.com.br/colaboradores/${pdi.collaborator_avatar || '../../assets/images/users/user-default.jpg'}" class="avatar me-2 rounded-circle" alt="${pdi.collaborator_name}">
                        <a href="javascript:void(0)" class="text-dark fw-medium" onclick="viewPDI(${pdi.id}, ${pdi.collaborator_id})">${pdi.collaborator_name}</a>
                    </div>
                </td>
                <td>${pdi.job_position || 'Não especificado'}</td>
                <td>${pdi.supervisor_name || 'Não atribuído'}</td>
                <td><span class="badge ${getProfileBadgeClass(pdi.profile_type)}">${pdi.profile_type || 'Não definido'}</span></td>
                <td><span class="badge ${getStatusBadgeClass(pdi.status)}">${pdi.status}</span></td>
                <td>${createdAt}</td>
                <td>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-primary" onclick="viewPDI(${pdi.id}, ${pdi.collaborator_id})">
                            <i class="ri-eye-line"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-warning" onclick="editPDI(${pdi.id})">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deletePDI(${pdi.id})">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            `;
            
            pdiListContainer.appendChild(row);
        });
        
        // Aplicar o filtro atual, se houver
        filterPDIsByStatus();
        
    } catch (error) {
        console.error('Erro ao carregar PDIs:', error);
        hideLoader();
        showError('Erro ao carregar PDIs: ' + error.message);
    }
}

// Abrir nova janela para criar PDI
function openNewPDIWindow() {
    const url = '/app/administration/pdi-hub/create-pdi.html';
    window.open(url, '_blank');
}

// Editar PDI existente
async function editPDI(id) {
    try {
        showLoader();
        
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
            showError('Não foi possível carregar o PDI: ' + result.message);
            return;
        }
        
        // Abrir a página de edição em uma nova aba
        const url = `/app/administration/pdi-hub/create-pdi.html?id=${id}`;
        const windowFeatures = 'width=1000,height=800,resizable=yes,scrollbars=yes';
        window.open(url, '_blank', windowFeatures);
        
    } catch (error) {
        console.error('Erro ao carregar PDI para edição:', error);
        hideLoader();
        showError('Erro ao carregar PDI para edição: ' + error.message);
    }
}

// Visualizar detalhes do PDI
function viewPDI(pdiId, collaboratorId) {
    // Caminho absoluto para garantir que sempre encontra o arquivo
    const url = '/app/administration/pdi-hub/collaborator.html?pdi_id=' + pdiId + '&id_collaborator=' + collaboratorId;
    window.open(url, '_blank');
}

// Excluir PDI
async function deletePDI(id) {
    try {
        // Solicitar confirmação do usuário
        const confirmed = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Essa ação irá excluir permanentemente o PDI e todas as suas ações e avaliações. Essa operação não pode ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            focusCancel: true
        });
        
        if (!confirmed.isConfirmed) {
            return;
        }
        
        showLoader();
        
        // Enviar requisição para o servidor
        const response = await fetch('/api/pdi-hub/deletePDI', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        });
        
        const result = await response.json();
        
        hideLoader();
        
        if (result.success) {
            Swal.fire({
                title: 'PDI excluído!',
                text: 'O plano de desenvolvimento foi removido com sucesso.',
                icon: 'success',
                confirmButtonColor: '#28a745'
            });
            
            // Recarregar a lista de PDIs
            loadPDIList();
            
            // Se os indicadores estiverem visíveis, recarregar
            const dashboardIndicators = document.getElementById('dashboardIndicators');
            if (!dashboardIndicators.classList.contains('d-none')) {
                loadDashboardIndicators();
            }
        } else {
            showError('Não foi possível excluir o PDI: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao excluir PDI:', error);
        hideLoader();
        showError('Erro ao excluir PDI: ' + error.message);
}
}

// Filtrar PDIs por status
function filterPDIsByStatus() {
    const statusFilter = document.getElementById('statusFilter');
    const selectedStatus = statusFilter.value;
    
    const rows = document.querySelectorAll('#pdiList tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        
        if (selectedStatus === 'Todos' || rowStatus === selectedStatus) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Mostrar ou esconder mensagem de filtro vazio
    const emptyMessage = document.getElementById('emptyFilterMessage');
    if (visibleCount === 0 && rows.length > 0) {
        emptyMessage.classList.remove('d-none');
    } else {
        emptyMessage.classList.add('d-none');
    }
}

// Formatar data para exibição
function formatDate(dateString) {
    if (!dateString) return 'Não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Obter classe de badge para o status
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Ativo':
            return 'bg-primary';
        case 'Em Andamento':
            return 'bg-info';
        case 'Concluído':
            return 'bg-success';
        case 'Atrasado':
            return 'bg-danger';
        case 'Cancelado':
            return 'bg-secondary';
        default:
            return 'bg-light text-dark';
    }
}

// Obter classe de badge para o perfil
function getProfileBadgeClass(profile) {
    switch (profile) {
        case 'Comunicador':
            return 'bg-warning text-dark';
        case 'Executor':
            return 'bg-danger';
        case 'Planejador':
            return 'bg-success';
        case 'Analista':
            return 'bg-info';
        default:
            return 'bg-light text-dark';
}
}

// Mostrar loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Esconder loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Mostrar mensagem de erro
function showError(message) {
    Swal.fire({
        title: 'Erro',
        text: message,
        icon: 'error',
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'OK'
    });
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    Swal.fire({
        title: 'Sucesso',
        text: message,
        icon: 'success',
        confirmButtonColor: '#28a745',
        confirmButtonText: 'OK'
    });
}

// Função para buscar e renderizar ações
async function loadActionsList(status = '', collaborator = '') {
    try {
        showLoader();
        // Buscar todas as ações, sem filtro de status
        const response = await fetch(`/api/pdi-hub/getAllActions?supervisor_id=${supervisorId}`);
        const result = await response.json();
        hideLoader();
        allActions = result.success ? result.data : [];
        populateCollaboratorFilter(allActions);
        renderActionsList(filterActions(allActions, status, collaborator));
    } catch (error) {
        hideLoader();
        renderActionsList([]);
    }
}

function populateCollaboratorFilter(actions) {
    const collaboratorFilter = document.getElementById('collaboratorFilter');
    if (!collaboratorFilter) return;
    const uniqueNames = [...new Set(actions.map(a => a.collaborator_name).filter(Boolean))];
    const currentValue = collaboratorFilter.value;
    collaboratorFilter.innerHTML = '<option value="">Todos</option>' +
        uniqueNames.map(name => `<option value="${name}">${name}</option>`).join('');
    collaboratorFilter.value = currentValue;
}

function filterActions(actions, status, collaborator) {
    return actions.filter(action => {
        let matchStatus = true;
        let matchCollaborator = true;
        if (status && status !== '' && status !== 'Todos') {
            if (status === 'Atrasado') {
                // Atrasado: prazo passou e não está concluído/cancelado
                const deadlineDate = new Date(action.deadline);
                matchStatus = (action.status !== 'Concluído' && action.status !== 'Cancelado' && deadlineDate < new Date());
            } else {
                let displayStatus = action.status;
                if (displayStatus !== 'Concluído' && displayStatus !== 'Cancelado') {
                    const deadlineDate = new Date(action.deadline);
                    if (deadlineDate < new Date()) {
                        displayStatus = 'Atrasado';
                    }
                }
                matchStatus = displayStatus === status;
            }
        }
        if (collaborator && collaborator !== '') {
            matchCollaborator = action.collaborator_name === collaborator;
        }
        return matchStatus && matchCollaborator;
    });
}

// Função para renderizar a tabela de ações
function renderActionsList(actions) {
    const actionsListElement = document.getElementById('actionsList');
    const noActions = document.getElementById('noActions');
    actionsListElement.innerHTML = '';
    if (!actions || actions.length === 0) {
        noActions.classList.remove('d-none');
        return;
    }
    noActions.classList.add('d-none');
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
        // Evento para abrir modal de visualização
        row.style.cursor = 'pointer';
        row.addEventListener('click', function() {
            openViewActionModalCoordinator(action.id);
        });
        actionsListElement.appendChild(row);
    });
}

// Função para abrir o modal de visualização de ação (coordinator)
async function openViewActionModalCoordinator(actionId) {
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
            const found = allActions.find(a => a.id == actionId);
            collaboratorName = found ? found.collaborator_name : '-';
        }
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
                attachments = attachments ? [attachments] : [];
            }
        }
        if (attachments && attachments.length > 0) {
            attachmentsContainer.innerHTML = `
                <ul class="list-group list-group-flush">
                    ${attachments.map(filename => `
                        <li class="list-group-item d-flex align-items-center justify-content-between px-2 py-2">
                            <div class="d-flex align-items-center flex-grow-1">
                                <i class="ri-attachment-2 text-primary me-2 fs-5"></i>
                                <span class="text-break text-truncate" style="max-width: 220px;" title="${filename}">${filename}</span>
                            </div>
                            <div class="d-flex align-items-center ms-2">
                                <a href="/uploads/pdi-hub/attachment_actions/${filename}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary me-1" title="Abrir em nova aba">
                                    <i class="ri-eye-line"></i>
                                </a>
                                <a href="/uploads/pdi-hub/attachment_actions/${filename}" download class="btn btn-sm btn-outline-success" title="Baixar">
                                    <i class="ri-download-2-line"></i>
                                </a>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            attachmentsContainer.textContent = 'Nenhum anexo';
        }
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('viewActionModal'));
        modal.show();
    } catch (error) {
        Swal.fire('Erro', 'Erro ao carregar detalhes da ação.', 'error');
    }
}

// Função para retornar a classe CSS do status
function getStatusClass(status) {
    switch(status) {
        case 'Pendente': return 'bg-warning text-dark';
        case 'Em Andamento': return 'bg-info';
        case 'Concluído': return 'bg-success';
        case 'Cancelado': return 'bg-danger';
        case 'Atrasado': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// Atualizar listeners para considerar ambos os filtros das ações
const actionStatusFilter = document.getElementById('actionStatusFilter');
const collaboratorFilter = document.getElementById('collaboratorFilter');
if (actionStatusFilter && collaboratorFilter) {
    actionStatusFilter.addEventListener('change', function() {
        loadActionsList(this.value, collaboratorFilter.value);
    });
    collaboratorFilter.addEventListener('change', function() {
        loadActionsList(actionStatusFilter.value, this.value);
    });
}

// Carregar lista de ações ao iniciar a página
// (após supervisorId ser definido)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof supervisorId !== 'undefined' && supervisorId) {
            loadActionsList('', '');
        }
    }, 500);
});

// Substituir o evento do botão #btnEditPDI para abrir a página de edição em nova janela
$(document).on('click', '#btnEditPDI', function() {
    var pdiId = $(this).data('id');
    if (!pdiId && window.currentPDIId) pdiId = window.currentPDIId;
    if (pdiId) {
        const url = 'edit-pdi.html?id=' + pdiId;
        const windowFeatures = 'width=1000,height=800,resizable=yes,scrollbars=yes';
        window.open(url, '_blank', windowFeatures);
    } else {
        Swal.fire('Erro', 'ID do PDI não encontrado para edição.', 'error');
    }
});

// Substituir também na tabela de PDIs (função editPDI)
window.editPDI = function(id) {
    const url = 'edit-pdi.html?id=' + id;
    const windowFeatures = 'width=1000,height=800,resizable=yes,scrollbars=yes';
    window.open(url, '_blank', windowFeatures);
};

// Função global para abrir avaliação em nova janela/aba
function openEvaluationWindowFromCoordinator(pdiId, month, year, collaboratorName) {
    const url = `evaluation.html?pdi_id=${pdiId}&collaborator_name=${collaboratorName}&month=${month}&year=${year}`;
    window.open(url, '_blank', 'width=800,height=800,resizable=yes,scrollbars=yes');
} 