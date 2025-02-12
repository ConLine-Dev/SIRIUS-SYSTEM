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

// Elementos do DOM
const elements = {
    newOccurenceButton: document.querySelector('#newOccurenceButton'),
    statusFilter: document.querySelector('#statusFilter'),
    typeFilter: document.querySelector('#typeFilter'),
    unitFilter: document.querySelector('#unitFilter'),
    periodFilter: document.querySelector('#periodFilter'),
    loader: document.querySelector('#loader2')
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
    elements.newOccurenceButton.addEventListener('click', () => {
        window.location.href = 'new-occurrence.html';
    });

    // Adiciona listeners para os filtros
    elements.statusFilter.addEventListener('change', filterOccurrences);
    elements.typeFilter.addEventListener('change', filterOccurrences);
    elements.unitFilter.addEventListener('change', filterOccurrences);
    elements.periodFilter.addEventListener('change', filterOccurrences);

    // Socket.io event
    socket.on('att-non-compliance', async () => {
        elements.loader.classList.remove('d-none');
        await loadData();
        elements.loader.classList.add('d-none');
    });

    // Controle de visibilidade do resumo
    const toggleResumoBtn = document.getElementById('toggleResumo');
    const resumoSection = document.getElementById('resumoSection');

    if (toggleResumoBtn && resumoSection) {
        toggleResumoBtn.addEventListener('click', function() {
            const isVisible = !resumoSection.classList.contains('d-none');
            
            // Toggle da visibilidade
            resumoSection.classList.toggle('d-none');
            
            // Atualiza o texto do botão
            const icon = isVisible ? 'ri-bar-chart-line' : 'ri-bar-chart-fill';
            const text = isVisible ? 'Mostrar Indicadores' : 'Ocultar Indicadores';
            toggleResumoBtn.innerHTML = `<i class="${icon} align-middle me-1"></i>${text}`;
            
            // Se estiver mostrando o resumo, atualiza os gráficos
            if (!isVisible) {
                if (typeof updateCharts === 'function') {
                    updateCharts();
                }
            }
        });
    }
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
        const occurrences = await makeRequest('/api/non-compliance/getPendingOccurrences');
        occurrencesData = occurrences.map(item => ({
            ...item,
            raw_status: extractors.extractText(item.status),
            raw_type: item.type,
            raw_reference: extractors.extractReference(item.reference),
            raw_title: extractors.extractText(item.title),
            raw_date: extractors.extractDate(item.date_occurrence)
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
        // console.log(item);
        // const matchStatus = !filters.status || String(item.editing) === filters.status;
        const matchStatus = !filters.status || extractTextFromHTML(item.status) === filters.status;
        console.log(matchStatus)
        const matchType = !filters.type || item.raw_type === filters.type;
        const matchUnit = !filters.unit || item.company_id === parseInt(filters.unit);
        
        let matchPeriod = true;
        if (filters.period) {
            const itemDate = item.raw_date ? new Date(item.raw_date) : null;
            const filterDate = new Date(filters.period);
            matchPeriod = itemDate && 
                         itemDate.getFullYear() === filterDate.getFullYear() &&
                         itemDate.getMonth() === filterDate.getMonth();
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

    const dataTable = $('#occurrences_table').DataTable({
        data: filteredData,
        columns: [
            { 
                data: 'reference',
                render: function(data, type, row) {
                    return `<span class="text-primary">${data}</span>`;
                }
            },
            { data: 'title' },
            { 
                data: 'type',
                render: function(data, type, row) {
                    return `<span class="badge bg-light text-dark">${data}</span>`;
                }
            },
            { data: 'responsibles' },
            { 
                data: 'status',
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
        dom: 'rt',
        language: {
            emptyTable: "Nenhum registro encontrado",
            zeroRecords: "Nenhum registro encontrado"
        },
        paging: false,
        info: false,
        scrollY: 'calc(100vh - 400px)',  // Define a altura dinamicamente
        rowCallback: function(row, data) {
            $(row).attr('occurrence-id', data.id);
        }
    });

    // Campo de pesquisa personalizado
    $('input[type="search"]').on('keyup', function() {
        dataTable.search(this.value).draw();
    });

    // Adiciona evento de duplo clique nas linhas
    $('#occurrences_table tbody').on('dblclick', 'tr', function() {
        const id = $(this).attr('occurrence-id');
        window.location.href = `view-occurrence.html?id=${id}`;
    });
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
        const status = statusMap[item.editing] || 'Desconhecido';
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
        const unit = document.querySelector(`#unitFilter option[value="${item.company_id}"]`);
        const unitName = unit ? unit.textContent.split('|')[0].trim() : `Unidade ${item.company_id}`;
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
                distributed: true
            }
        },
        xaxis: {
            categories: Object.keys(unitCounts)
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

// Inicialização
window.addEventListener('load', async () => {
    console.time('Carregamento da página');
    
    setupEventListeners();
    await loadData();
    
    console.timeEnd('Carregamento da página');
});
