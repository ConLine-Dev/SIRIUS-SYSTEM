// Conecta-se ao servidor Socket.io
const socket = io();

// Configurações globais
let occurrencesData = [];
let filters = {
    status: '',
    type: '',
    unit: '',
    period: ''
};

// Mapeamento de status
const statusMap = {
    '0': 'Pendente - Aprovação 1ª etapa',
    '1': 'Reprovado - Aguardando Ajuste 1ª etapa',
    '2': 'Aprovado - Liberado Preenchimento 2ª etapa',
    '3': 'Pendente - aprovação 2ª etapa',
    '4': 'Reprovado - Aguardando Ajuste 2ª etapa',
    '5': 'Desenvolvimento - Ação Corretiva',
    '6': 'Desenvolvimento - Avaliação de Eficácia',
    '7': 'Finalizado'
};

const invertedStatusMap = Object.entries(statusMap).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});

// Elementos do DOM
const elements = {
    newOccurenceButton: document.querySelector('#newOccurenceButton'),
    statusFilter: document.querySelector('#statusFilter'),
    typeFilter: document.querySelector('#typeFilter'),
    unitFilter: document.querySelector('#unitFilter'),
    periodFilter: document.querySelector('#periodFilter'),
    loader: document.querySelector('#loader2'),
    toggleActionsBtn: document.querySelector('#toggleActions'),
    occurrencesSection: document.querySelector('#occurrencesSection'),
    actionsSection: document.querySelector('#actionsSection'),
    filterButtons: document.querySelectorAll('.filter-button'),
    toggleResumoBtn: document.querySelector('#toggleResumo'),
    resumoSection: document.querySelector('#resumoSection')
};

// Funções auxiliares para extrair texto do HTML
const extractors = {
    // Extrai texto de uma string HTML
    extractText: function(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    // Extrai número de referência
    extractReference: function(html) {
        if (!html) return '';
        const match = html.match(/#(\d+)/);
        return match ? match[1] : '';
    },

    // Extrai data
    extractDate: function(html) {
        if (!html) return '';
        const text = this.extractText(html);
        return text.replace(/[^\d/]/g, '');
    }
};

// Event Listeners
async function setupEventListeners() {
    // Botão Nova Ocorrência
    elements.newOccurenceButton.addEventListener('click', function() {
        const newWindow = window.open(`new-occurrence.html`, '_blank', 'width=1400,height=800');
        newWindow.onload = function() {
            newWindow.moveTo(0, 0);
            newWindow.resizeTo(screen.availWidth, screen.availHeight);
        };
    });

    // Adiciona listeners para os filtros
    elements.filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe ativa de todos os botões
            elements.filterButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona a classe ativa ao botão clicado
            button.classList.add('active');

            // Atualiza a tabela com o filtro selecionado
            const filter = button.getAttribute('data-filter');
            updateTable(filter);
        });
    });

    // Controle de visibilidade do resumo
    elements.toggleResumoBtn.addEventListener('click', function() {
        const isVisible = !elements.resumoSection.classList.contains('d-none');
        
        elements.resumoSection.classList.toggle('d-none');
        
        // Atualiza o texto e ícone do botão
        const icon = isVisible ? 'ri-bar-chart-line' : 'ri-bar-chart-fill';
        const text = isVisible ? 'Mostrar Indicadores' : 'Ocultar Indicadores';
        this.innerHTML = `<i class="${icon} align-middle me-1"></i>${text}`;
        
        if (!isVisible) {
            generateCharts();
        }
    });

    // Controle de visibilidade das ações
    elements.toggleActionsBtn.addEventListener('click', toggleActions);

    // Adiciona listeners para os filtros
    elements.statusFilter.addEventListener('change', filterOccurrences);
    elements.typeFilter.addEventListener('change', filterOccurrences);
    elements.unitFilter.addEventListener('change', filterOccurrences);
    elements.periodFilter.addEventListener('change', filterOccurrences);

    // Socket.io event
    socket.on('att-non-compliance', async () => {
        elements.loader.classList.remove('d-none');
        await loadData();
        await loadActions();
        elements.loader.classList.add('d-none');
    });

    // Campo de pesquisa personalizado
    $('input[type="search"]').on('keyup', function() {
        const table = $('#occurrences_table').DataTable();
        table.search(this.value).draw();
    });

    // Adiciona evento de duplo clique nas linhas
    $('#occurrences_table tbody').on('dblclick', 'tr', function() {
        const table = $('#occurrences_table').DataTable();
        const data = table.row(this).data();
        if (data) {
            // Abre em nova janela
            const newWindow = window.open(`view-occurrence.html?id=${data.id}`, '_blank', 'width=1400,height=800');
            newWindow.onload = function() {
                newWindow.moveTo(0, 0);
                newWindow.resizeTo(screen.availWidth, screen.availHeight);
            };
        }
    });
}

// Inicializa os filtros
function initializeFilters() {
    // Status
    elements.statusFilter.innerHTML = `
        <option value="">Todos</option>
        ${Object.entries(statusMap).map(([key, value]) => 
            `<option value="${key}">${value}</option>`
        ).join('')}
    `;
}

// Carrega dados iniciais
async function loadData() {
    try {
        elements.loader.classList.remove('d-none');

        // Inicializar filtros
        initializeFilters();

        // Carregar tipos de ocorrências
        const types = await makeRequest('/api/non-compliance/AllTypes');
        populateTypeFilter(types);

        // Carregar unidades para o filtro
        const units = await makeRequest('/api/non-compliance/AllUnit');
        populateUnitFilter(units);

        // Carregar ocorrências
        const occurrences = await makeRequest('/api/non-compliance/AllOccurrence');
        
        occurrencesData = occurrences.map(item => ({
            ...item,
            raw_type: item.type,
            raw_reference: extractors.extractReference(item.reference),
            raw_title: extractors.extractText(item.title),
            raw_status: extractors.extractText(item.status),
            raw_status_number: invertedStatusMap[extractors.extractText(item.status)],
            raw_date: new Date(item.date_occurrence_noformat) // Usando o campo formatado da API
        }));
        
        // Atualizar visualizações
        updateTable();
        updateCharts();

        elements.loader.classList.add('d-none');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados', 'error');
        elements.loader.classList.add('d-none');
    }
}

// Popula o filtro de tipos
function populateTypeFilter(types) {
    const options = types.map(type => `
        <option value="${type.name}">${type.name}</option>
    `).join('');
    
    elements.typeFilter.innerHTML = '<option value="">Todos</option>' + options;
}

// Popula o filtro de unidades
function populateUnitFilter(units) {
    const options = units.map(unit => `
        <option value="${unit.id}">${unit.city} | ${unit.country}</option>
    `).join('');
    
    elements.unitFilter.innerHTML = '<option value="">Todas</option>' + options;
}

// Filtra ocorrências baseado nos filtros selecionados
function filterOccurrences() {
    filters = {
        status: elements.statusFilter.value,
        type: elements.typeFilter.value,
        unit: elements.unitFilter.value,
        period: elements.periodFilter.value
    };

    updateTable();
    updateCharts();
}

const extractTextFromHTML = (html) => {
    const span = document.createElement('span');
    span.innerHTML = html;
    return span.textContent || span.innerText;
  };

// Filtra os dados baseado nos filtros selecionados
function filterData(data) {
    return data.filter(item => {
        // Status - usando o campo editing para comparação
        const matchStatus = !filters.status || String(item.raw_status_number) === filters.status;
    
        // Tipo - já está funcionando
        const matchType = !filters.type || item.raw_type === filters.type;
        
        // Unidade - usando o company_id como string
        const matchUnit = !filters.unit || String(item.company_id) === filters.unit;
        
        // Período - usando a data formatada da API
        let matchPeriod = true;
        if (filters.period) {
            const [year, month] = filters.period.split('-');
            const itemDate = item.raw_date;
            
            matchPeriod = itemDate && 
                         itemDate.getFullYear() === parseInt(year) && 
                         itemDate.getMonth() === parseInt(month) - 1;
        }

        return matchStatus && matchType && matchUnit && matchPeriod;
    });
}

// Atualiza a tabela de ocorrências
function updateTable() {
    const filteredData = filterData(occurrencesData);
    
    if ($.fn.DataTable.isDataTable('#occurrences_table')) {
        $('#occurrences_table').DataTable().destroy();
    }

    const table = $('#occurrences_table').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        info: false,
        data: filteredData,
        columns: [
            { 
                data: 'reference',
                render: function(data, type, row) {
                    return `<span style="display: none;">${row.id}</span> </span>${data}`;
                }
            },
            { 
                data: 'title',
                render: function(data, type, row) {
                    return data;
                }
            },
            { 
                data: 'type',
                render: function(data, type, row) {
                    return data;
                }
            },
            { 
                data: 'responsibles',
                render: function(data, type, row) {
                    return data;
                }
            },
            { 
                data: 'status',
                render: function(data, type, row) {
                    return data;
                }
            },
            { 
                data: 'company_name',
                render: function(data, type, row) {
                    return data;
                }
            },
            { 
                data: 'date_occurrence',
                render: function(data, type, row) {
                    return data;
                }
            }
        ],
        order: [[0, 'desc']],
        scrollY: 'calc(100vh - 400px)',  // Define a altura dinamicamente
        scrollCollapse: true,
        language: {
            url: '../../assets/libs/datatables/lang/pt-BR.json'
        }
    });

    // Campo de pesquisa personalizado
    $('input[type="search"]').on('keyup', function() {
        table.search(this.value).draw();
    });

    // Adiciona evento de duplo clique nas linhas
    // $('#occurrences_table tbody').on('dblclick', 'tr', function() {
    //     const data = table.row(this).data();
    //     if (data) {
    //         // Abre em nova janela
    //         window.open(`view-occurrence.html?id=${data.id}`, '_blank', 'width=1200,height=800');
    //     }
    // });
}

// Atualiza os gráficos
function updateCharts() {
    const filteredData = filterData(occurrencesData);
    
    updateStatusChart(filteredData);
    updateTypeChart(filteredData);
    updateUnitChart(filteredData);
}

// Atualiza o gráfico de status
function updateStatusChart(data) {
    const statusCounts = {};
    
    data.forEach(item => {
        // Usando raw_status_number para obter o texto correto do status
        const status = statusMap[item.raw_status_number] || 'Desconhecido';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const options = {
        series: Object.values(statusCounts),
        labels: Object.keys(statusCounts),
        chart: {
            type: 'donut',
            height: 200
        },
        colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'],
        legend: {
            position: 'bottom',
            fontSize: '12px'
        },
        noData: {
            text: 'Sem dados disponíveis'
        }
    };

    if (document.querySelector("#statusChart")) {
        document.querySelector("#statusChart").innerHTML = '';
        const chart = new ApexCharts(document.querySelector("#statusChart"), options);
        chart.render();
    }
}

// Atualiza o gráfico de tipos
function updateTypeChart(data) {
    const typeCounts = {};
    
    data.forEach(item => {
        const type = item.raw_type || 'Não especificado';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const options = {
        series: Object.values(typeCounts),
        labels: Object.keys(typeCounts),
        chart: {
            type: 'donut',
            height: 200
        },
        colors: ['#4d96ff', '#ff6b6b', '#6bcb77'],
        legend: {
            position: 'bottom',
            fontSize: '12px'
        },
        noData: {
            text: 'Sem dados disponíveis'
        }
    };

    if (document.querySelector("#typeChart")) {
        document.querySelector("#typeChart").innerHTML = '';
        const chart = new ApexCharts(document.querySelector("#typeChart"), options);
        chart.render();
    }
}

// Atualiza o gráfico de unidades
function updateUnitChart(data) {
    const unitCounts = {};
    
    data.forEach(item => {
        // Usando company_name que vem direto da API
        const unitName = item.company_name || `Unidade ${item.company_id}`;
        unitCounts[unitName] = (unitCounts[unitName] || 0) + 1;
    });

    const options = {
        series: [{
            data: Object.values(unitCounts)
        }],
        chart: {
            type: 'bar',
            height: 200
        },
        plotOptions: {
            bar: {
                horizontal: true,
                distributed: true,
                dataLabels: {
                    position: 'bottom'
                }
            }
        },
        xaxis: {
            categories: Object.keys(unitCounts)
        },
        legend: {
            show: false
        },
        noData: {
            text: 'Sem dados disponíveis'
        }
    };

    if (document.querySelector("#unitChart")) {
        document.querySelector("#unitChart").innerHTML = '';
        const chart = new ApexCharts(document.querySelector("#unitChart"), options);
        chart.render();
    }
}

// Carrega as ações tomadas
async function loadActions() {
    try {
        const actions = await makeRequest('/api/non-compliance/get-actions-pendents');

        let actionsHTML = '';
        for (const action of actions) {
            actionsHTML += `
                <li data-type="${action.statusID}" occurrence-id="${action.occurrence_id}" action-id="${action.id}" 
                    class="list-group-item border-top-0 border-start-0 border-end-0">
                    <a href="javascript:void(0);">
                        <div class="d-flex align-items-center">
                            <div class="me-2 lh-1"> 
                                <span title="${action.name} ${action.family_name}" class="avatar avatar-md avatar-rounded bg-primary-transparent"> 
                                    <img src="https://cdn.conlinebr.com.br/colaboradores/${action.id_headcargo}" alt=""> 
                                </span> 
                            </div>
                            <div class="flex-fill">
                                <p class="mb-0 fw-semibold" style="display: flex;">
                                    ${action.reference}&#8287;&#8287;${action.status}
                                </p>
                                <p class="fs-12 text-muted mb-0">${action.action}</p>
                            </div>
                            <div class="text-end">
                                <p class="mb-0 fs-12">Prazo</p>
                                ${action.deadline}
                            </div>
                        </div>
                    </a>
                </li>`;
        }

        document.querySelector('.allactions').innerHTML = actionsHTML;
        await filterActions();
        await dblClickOnAction();
    } catch (error) {
        console.error('Erro ao carregar ações:', error);
        showToast('Erro ao carregar ações', 'error');
    }
}

// Filtra as ações
async function filterActions() {
    const dropdownItems = document.querySelectorAll('.filterActions');
    const dropdownToggle = document.querySelector('.dropdown-filterActions');

    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            const types = this.getAttribute('data-type').split(',');
            const selectedText = this.textContent.trim();
            
            const allActions = document.querySelector('.allactions');
            const listItems = allActions.querySelectorAll('li');
            
            listItems.forEach(item => {
                const itemType = item.getAttribute('data-type');
                if (types.includes(itemType) || types[0] === '0,1,2,3') {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

            dropdownToggle.innerHTML = `${selectedText} <i class="ri-arrow-down-s-line align-middle ms-1 d-inline-block"></i>`;
        });
    });

    // Filtra e seleciona a opção "Todas" ao iniciar
    const initialFilter = document.querySelector('.filterActions[data-type="0"]');
    if (initialFilter) {
        initialFilter.click();
    }
}

// Configura eventos de duplo clique nas ações
async function dblClickOnAction() {
    document.querySelectorAll('.allactions li').forEach(item => {
        item.addEventListener('dblclick', function() {
            const occurrenceId = this.getAttribute('occurrence-id');
            const actionId = this.getAttribute('action-id');
            if (occurrenceId && actionId) {
                const newWindow = window.open(`view-occurrence.html?id=${occurrenceId}&action=${actionId}`, '_blank', ',width=1400,height=800');
                newWindow.onload = function() {
                    newWindow.moveTo(0, 0);
                    newWindow.resizeTo(screen.availWidth, screen.availHeight);
                };
            }
        });
    });
}

// Função auxiliar para fazer requisições
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Erro na requisição');
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

// Função para mostrar toast de notificação
function showToast(message, type = 'info') {
    // Implementar conforme o sistema de notificação existente
    console.log(`${type}: ${message}`);
}

// Função para mostrar/ocultar ações
function toggleActions() {
    const actionsSection = document.getElementById('actionsSection');
    const occurrencesSection = document.getElementById('occurrencesSection');
    const toggleBtn = document.getElementById('toggleActions');
    const isVisible = !actionsSection.classList.contains('d-none');

    if (isVisible) {
        // Ocultar ações
        actionsSection.classList.add('d-none');
        occurrencesSection.classList.remove('col-md-8');
        occurrencesSection.classList.remove('actions-visible');
        occurrencesSection.classList.add('col-md-12');

        // Atualizar botão
        toggleBtn.innerHTML = '<i class="ri-list-check-2 align-middle me-1"></i>Ações Tomadas';
    } else {
        // Mostrar ações
        actionsSection.classList.remove('d-none');
        occurrencesSection.classList.remove('col-md-12');
        occurrencesSection.classList.add('col-md-8');
        occurrencesSection.classList.add('actions-visible');

        // Atualizar botão
        toggleBtn.innerHTML = '<i class="ri-list-check-fill align-middle me-1"></i>Ocultar Ações';

        // Carregar ações se necessário
        loadActions();
    }

    // Aguardar a transição CSS antes de ajustar a tabela
    setTimeout(() => {
        if ($.fn.DataTable.isDataTable('#occurrences_table')) {
            const table = $('#occurrences_table').DataTable();
            table.columns.adjust();
            $(window).trigger('resize'); // Forçar recálculo do layout
            table.draw(false); // Redesenhar sem reordenar
        }
    }, 300); // Tempo suficiente para a transição CSS completar
}

// Inicialização
window.addEventListener('load', async () => {
    console.time('Carregamento da página');
    
    setupEventListeners();
    await loadData();
    await loadActions();
    
    console.timeEnd('Carregamento da página');
});
