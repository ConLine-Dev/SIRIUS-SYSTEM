/**
 * PDI Hub - Script para a página do coordenador/supervisor
 */

// Variáveis globais
let actionCounter = 0;
let actionsToDelete = [];
let profileChartInstance = null;
let evaluationsChartInstance = null;
let allGlobalActions = [];
let allRecentEvaluations = [];

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
    const tableBody = document.getElementById('recentEvaluationsList');
    const noEvaluations = document.getElementById('noRecentEvaluations');
    const filterSelect = document.getElementById('filterColaborador');

    // Preencher filtro de colaborador
    if (filterSelect) {
        const uniqueNames = [...new Set(allRecentEvaluations.map(e => e.collaborator_name))];
        const currentValue = filterSelect.value;
        filterSelect.innerHTML = '<option value="">Todos</option>' + uniqueNames.map(name => `<option value="${name}">${name}</option>`).join('');
        filterSelect.value = currentValue || '';
    }

    function getFilteredEvaluations() {
        if (!filterSelect || !filterSelect.value) return allRecentEvaluations;
        return allRecentEvaluations.filter(e => e.collaborator_name === filterSelect.value);
    }

    if (filterSelect && !filterSelect._listenerAdded) {
        filterSelect.addEventListener('change', () => {
            renderRecentEvaluations(getFilteredEvaluations());
        });
        filterSelect._listenerAdded = true;
    }

    const evaluationsToShow = getFilteredEvaluations();
    tableBody.innerHTML = '';
    if (!evaluationsToShow || evaluationsToShow.length === 0) {
        noEvaluations.classList.remove('d-none');
        return;
    }
    noEvaluations.classList.add('d-none');
    evaluationsToShow.forEach(evaluation => {
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
        
        if (pdisArray.length === 0) {
            document.getElementById('emptyPDIs').classList.remove('d-none');
            return;
        }
        
        document.getElementById('emptyPDIs').classList.add('d-none');
        
        // Renderizar a lista de PDIs
        const pdiListElement = document.getElementById('pdiList');
        pdiListElement.innerHTML = '';
        
        pdisArray.forEach(pdi => {
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
            
            const row = document.createElement('tr');
            
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
                <td>${pdi.profile_type || '-'}</td>
                <td>${statusHtml}</td>
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
            
            pdiListElement.appendChild(row);
        });
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

// Resetar o formulário do PDI
function resetPDIForm() {
    document.getElementById('pdiId').value = '';
    document.getElementById('newPDIForm').reset();
    
    // Limpar as ações
    document.getElementById('actionsContainer').innerHTML = '';
    actionCounter = 0;
    actionsToDelete = [];
    
    // Resetar as seleções dos dropdowns
    const collaboratorSelect = document.getElementById('collaborator_id');
    const supervisorSelect = document.getElementById('supervisor_id');
    
    if (collaboratorSelect.choices) {
        collaboratorSelect.choices.setChoiceByValue('');
    }
    
    if (supervisorSelect.choices) {
        supervisorSelect.choices.setChoiceByValue('');
    }
}

// Formatar data para exibição
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

// Obter a classe CSS para o status do PDI
function getStatusClass(status) {
    switch(status) {
        case 'Ativo': return 'badge-active';
        case 'Em Andamento': return 'bg-info';
        case 'Concluído': return 'badge-concluded';
        case 'Cancelado': return 'badge-canceled';
        case 'Atrasado': return 'bg-danger';
        default: return 'badge-active';
    }
}

// Obter a classe CSS para o status da ação
function getStatusBadgeClass(status) {
    switch(status) {
        case 'Pendente': return 'bg-warning text-dark';
        case 'Em Andamento': return 'bg-info';
        case 'Concluído': return 'bg-success';
        default: return 'bg-secondary';
    }
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

// Filtrar PDIs por status
function filterPDIsByStatus() {
    const statusFilter = document.getElementById('statusFilter');
    const selectedStatus = statusFilter.value;
    
    console.log('Filtrando por status:', selectedStatus);
    
    // Obter todas as linhas da tabela
    const rows = document.querySelectorAll('#pdiList tr');
    
    // Contador para verificar se todos os PDIs estão filtrados
    let hiddenCount = 0;
    let totalRows = 0;
    
    rows.forEach(row => {
        totalRows++;
        
        // Se for "Todos", mostrar todas as linhas
        if (selectedStatus === 'Todos') {
            row.style.display = '';
            return;
        }
        
        // Verificar se a célula do status contém o status selecionado
        const statusCell = row.querySelector('td:nth-child(5)');
        if (!statusCell) return;
        
        // Verificar tanto o status oficial quanto possíveis badges "Em Andamento"
        if (selectedStatus === 'Em Andamento') {
            // Se for filtro "Em Andamento", procurar por badges com essa informação
            if (statusCell.innerHTML.includes('Em Andamento')) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
                hiddenCount++;
            }
        } else {
            // Para outros status, procurar pelo texto exato do status
            if (statusCell.textContent.includes(selectedStatus)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
                hiddenCount++;
            }
        }
    });
    
    // Mostrar mensagem se nenhum PDI corresponder ao filtro
    const emptyMessage = document.getElementById('emptyFilterMessage');
    const emptyPDIs = document.getElementById('emptyPDIs');
    
    // Esconder sempre a mensagem de "nenhum PDI" quando filtrando
    if (emptyPDIs) {
        emptyPDIs.classList.add('d-none');
    }
    
    // Mostrar mensagem de filtro vazio se necessário
    if (emptyMessage) {
        if (totalRows > 0 && hiddenCount === totalRows) {
            emptyMessage.classList.remove('d-none');
            emptyMessage.textContent = `Nenhum PDI com status "${selectedStatus}" encontrado.`;
        } else {
            emptyMessage.classList.add('d-none');
        }
    }
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
        populateCollaboratorFilterIndex(allGlobalActions);
        renderGlobalActionsList(filterGlobalActions(allGlobalActions, status, collaborator));
    } catch (error) {
        hideLoader();
        renderGlobalActionsList([]);
    }
}

function populateCollaboratorFilterIndex(actions) {
    const collaboratorFilter = document.getElementById('collaboratorFilterIndex');
    if (!collaboratorFilter) return;
    const uniqueNames = [...new Set(actions.map(a => a.collaborator_name).filter(Boolean))];
    const currentValue = collaboratorFilter.value;
    collaboratorFilter.innerHTML = '<option value="">Todos</option>' +
        uniqueNames.map(name => `<option value="${name}">${name}</option>`).join('');
    collaboratorFilter.value = currentValue;
}

function filterGlobalActions(actions, status, collaborator) {
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

function renderGlobalActionsList(actions) {
    const actionsListElement = document.getElementById('actionsListIndex');
    const noActions = document.getElementById('noActionsIndex');
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
        // Adicionar campo do colaborador no modal (se não existir)
        let collaboratorField = document.getElementById('viewActionCollaborator');
        if (!collaboratorField) {
            const descField = document.getElementById('viewActionDescription');
            const dt = document.createElement('dt');
            dt.className = 'col-sm-4';
            dt.textContent = 'Colaborador';
            const dd = document.createElement('dd');
            dd.className = 'col-sm-8';
            dd.id = 'viewActionCollaborator';
            dd.textContent = collaboratorName;
            descField.parentNode.insertBefore(dt, descField);
            descField.parentNode.insertBefore(dd, descField);
        } else {
            collaboratorField.textContent = collaboratorName;
        }
        document.getElementById('viewActionDescription').textContent = action.description || '-';
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

// Listeners dos filtros de ações globais
const actionStatusFilterIndex = document.getElementById('actionStatusFilterIndex');
const collaboratorFilterIndex = document.getElementById('collaboratorFilterIndex');
if (actionStatusFilterIndex && collaboratorFilterIndex) {
    actionStatusFilterIndex.addEventListener('change', function() {
        loadGlobalActionsList(this.value, collaboratorFilterIndex.value);
    });
    collaboratorFilterIndex.addEventListener('change', function() {
        loadGlobalActionsList(actionStatusFilterIndex.value, this.value);
    });
}

// Adicionar função global para abrir a edição em nova janela
function openEditPDIWindow(id) {
    const url = 'edit-pdi.html?id=' + id;
    const windowFeatures = 'width=1000,height=800,resizable=yes,scrollbars=yes';
    window.open(url, '_blank', windowFeatures);
}

// Função global para abrir avaliação em nova janela/aba
function openEvaluationWindowFromCoordinator(pdiId, month, year, collaboratorName) {
    const url = `evaluation.html?pdi_id=${pdiId}&collaborator_name=${collaboratorName}&month=${month}&year=${year}`;
    window.open(url, '_blank', 'width=800,height=800,resizable=yes,scrollbars=yes');
}