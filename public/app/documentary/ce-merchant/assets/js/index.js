const table = [];
let divergenceChart = null;
let typeChart = null;
let sectorChart = null;
let typeSectorChart = null;
let monthlyChart = null;
let monthlyTypeChart = null;
let ceLancadasChart = null;
let ceLiberadasChart = null;
let sectorTypes = [];
let responsibleTypes = [];
let ceLancadasData = [];
let ceLiberadasData = [];

// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializa o socket.io
    const socket = io();

    // Verifica se a biblioteca ApexCharts está disponível
    if (typeof ApexCharts === 'undefined') {
        console.error('A biblioteca ApexCharts não foi carregada corretamente.');
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar a biblioteca de gráficos. Por favor, recarregue a página ou contate o suporte.'
        });
        document.querySelector('#loader2').classList.add('d-none');
        return;
    }

    // Carrega os dados iniciais
    await loadData();

    // Configura os eventos dos botões de filtro
    document.querySelector('#btn-filter').addEventListener('click', applyFilters);
    document.querySelector('#btn-clear-filter').addEventListener('click', clearFilters);
    document.querySelector('#export-ce-lancadas').addEventListener('click', exportCELancadasToExcel);
    document.querySelector('#export-ce-liberadas').addEventListener('click', exportCELiberadasToExcel);
    
    // Configura o evento do botão para mostrar/esconder indicadores
    const toggleButton = document.querySelector('#toggle-indicators');
    const indicatorsContainer = document.querySelector('#indicators-container');
    
    toggleButton.addEventListener('click', function() {
        const isVisible = indicatorsContainer.style.display !== 'none';
        
        if (isVisible) {
            indicatorsContainer.style.display = 'none';
            toggleButton.innerHTML = '<i class="ri-eye-line me-1"></i> Mostrar Indicadores';
        } else {
            indicatorsContainer.style.display = 'flex';
            toggleButton.innerHTML = '<i class="ri-eye-off-line me-1"></i> Esconder Indicadores';
            
            // Adiciona um pequeno atraso antes de renderizar os gráficos
            // para garantir que o container esteja completamente visível
            setTimeout(() => {
                renderAllCharts();
            }, 300);
        }
    });

    // Esconde o loader
    document.querySelector('#loader2').classList.add('d-none');
});

// Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
}

// Carrega todos os dados necessários para a página
async function loadData() {
    try {
        // Carrega os indicadores
        const indicators = await makeRequest('/api/ce-merchant/getIndicators', 'GET');
        
        // Carrega os dados para preencher os selects
        const allData = await makeRequest('/api/ce-merchant/getAll', 'GET');
        
        // Carrega os dados de CE Lançadas
        ceLancadasData = await makeRequest('/api/ce-merchant/getAllCE', 'GET');
        
        // Carrega os dados de CE Liberadas
        ceLiberadasData = await makeRequest('/api/ce-merchant/getLiberacoesCE', 'GET');
        
        // Preenche os selects de filtros
        populateFilterSelects(allData);
        
        // Cria os gráficos
        createTypeChart(indicators.typeCount);
        createSectorChart(indicators.sectorCount);
        createTypeSectorChart(indicators.typeSectorCount);
        createMonthlyChart(indicators.monthlyCount);
        createMonthlyTypeChart(indicators.monthlyTypeCount);
        createCELancadasChart(ceLancadasData);
        createCELiberadasChart(ceLiberadasData);
        
        // Gera a tabela de dados
        await generateTable(allData);

        // Renderiza os gráficos se o container estiver visível
        renderAllCharts();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde.'
        });
    }
}

// Preenche os selects de filtros com os dados disponíveis
function populateFilterSelects(data) {
    // Preenche o select de setores
    const sectorSelect = document.querySelector('#filter-sector');
    
    // Limpa as opções existentes, mantendo a opção "Todos"
    while (sectorSelect.options.length > 1) {
        sectorSelect.remove(1);
    }
    
    // Adiciona as novas opções de setores
    data.forEach(item => {
        if (item.Setor && !sectorTypes.includes(item.Setor)) {
            sectorTypes.push(item.Setor);
            const option = document.createElement('option');
            option.value = item.Setor;
            option.textContent = item.Setor;
            sectorSelect.appendChild(option);
        }
    });
    
    // Preenche o select de responsáveis
    const responsibleSelect = document.querySelector('#filter-responsible');
    
    // Limpa as opções existentes, mantendo a opção "Todos"
    while (responsibleSelect.options.length > 1) {
        responsibleSelect.remove(1);
    }
    
    // Adiciona as novas opções de responsáveis
    data.forEach(item => {
        if (item.Responsavel && !responsibleTypes.includes(item.Responsavel)) {
            responsibleTypes.push(item.Responsavel);
            const option = document.createElement('option');
            option.value = item.Responsavel;
            option.textContent = item.Responsavel;
            responsibleSelect.appendChild(option);
        }
    });
}

// Cria o gráfico por tipo (Divergência/Retificação)
function createTypeChart(typeData) {
    // Verifica se a biblioteca ApexCharts está disponível
    if (typeof ApexCharts === 'undefined') {
        console.error('A biblioteca ApexCharts não foi carregada corretamente.');
        return;
    }

    const chartContainer = document.querySelector("#type-chart");
    if (typeChart) {
        typeChart.destroy();
    }
    chartContainer.innerHTML = "";

    // Prepara os dados para o gráfico
    const series = [{
        name: 'Total',
        data: typeData.map(item => item.Total)
    }];
    
    const categories = typeData.map(item => item.Tipo);
    
    // Configurações do gráfico
    const options = {
        series: series,
        chart: {
            type: 'bar',
            height: 350,
            toolbar: {
                show: true
            },
            events: {
                dataPointSelection: function(event, chartContext, config) {
                    const tipo = config.w.globals.labels[config.dataPointIndex];
                    Swal.fire({
                        title: 'Filtrar por Tipo',
                        text: `Deseja filtrar os dados para mostrar apenas o tipo "${tipo}"?`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Sim, filtrar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Aplicar filtro por tipo
                            document.querySelector('#filter-type').value = tipo;
                            applyFilters();
                        }
                    });
                }
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: categories,
            title: {
                text: 'Tipo'
            }
        },
        yaxis: {
            title: {
                text: 'Quantidade'
            }
        },
        fill: {
            opacity: 1,
            colors: ['#f9423a']
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " ocorrências";
                }
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const tipo = w.globals.labels[dataPointIndex];
                const valor = series[seriesIndex][dataPointIndex];
                const porcentagem = ((valor / series[seriesIndex].reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                
                return `<div class="p-2">
                    <div class="fw-bold mb-1">${tipo}</div>
                    <div>Total: <span class="fw-semibold">${valor} ocorrências</span></div>
                    <div>Percentual: <span class="fw-semibold">${porcentagem}%</span></div>
                    <div class="small text-muted mt-1">Clique para filtrar por este tipo</div>
                </div>`;
            }
        }
    };
    
    // Destrói o gráfico existente, se houver
    if (typeChart) {
        typeChart.destroy();
    }
    
    // Cria o novo gráfico
    typeChart = new ApexCharts(document.querySelector("#type-chart"), options);
}

// Cria o gráfico por setor
function createSectorChart(sectorData) {
    // Verifica se a biblioteca ApexCharts está disponível
    if (typeof ApexCharts === 'undefined') {
        console.error('A biblioteca ApexCharts não foi carregada corretamente.');
        return;
    }

    const chartContainer = document.querySelector("#sector-chart");
    if (sectorChart) {
        sectorChart.destroy();
    }
    chartContainer.innerHTML = "";

    // Prepara os dados para o gráfico
    const series = [{
        name: 'Total',
        data: sectorData.map(item => item.Total)
    }];
    
    const categories = sectorData.map(item => item.Setor);
    
    // Configurações do gráfico
    const options = {
        series: series,
        chart: {
            type: 'bar',
            height: 350,
            toolbar: {
                show: true
            },
            events: {
                dataPointSelection: function(event, chartContext, config) {
                    const setor = config.w.globals.labels[config.dataPointIndex];
                    Swal.fire({
                        title: 'Filtrar por Setor',
                        text: `Deseja filtrar os dados para mostrar apenas o setor "${setor}"?`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Sim, filtrar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Aplicar filtro por setor
                            document.querySelector('#filter-sector').value = setor;
                            applyFilters();
                        }
                    });
                }
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: categories,
            title: {
                text: 'Setor'
            }
        },
        yaxis: {
            title: {
                text: 'Quantidade'
            }
        },
        fill: {
            opacity: 1,
            colors: ['#4a6cf7']
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " ocorrências";
                }
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const setor = w.globals.labels[dataPointIndex];
                const valor = series[seriesIndex][dataPointIndex];
                const porcentagem = ((valor / series[seriesIndex].reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                
                return `<div class="p-2">
                    <div class="fw-bold mb-1">${setor}</div>
                    <div>Total: <span class="fw-semibold">${valor} ocorrências</span></div>
                    <div>Percentual: <span class="fw-semibold">${porcentagem}%</span></div>
                    <div class="small text-muted mt-1">Clique para filtrar por este setor</div>
                </div>`;
            }
        }
    };
    
    // Destrói o gráfico existente, se houver
    if (sectorChart) {
        sectorChart.destroy();
    }
    
    // Cria o novo gráfico
    sectorChart = new ApexCharts(document.querySelector("#sector-chart"), options);
}

// Cria o gráfico por tipo e setor
function createTypeSectorChart(typeSectorData) {
    // Verifica se a biblioteca ApexCharts está disponível
    if (typeof ApexCharts === 'undefined') {
        console.error('A biblioteca ApexCharts não foi carregada corretamente.');
        return;
    }

    const chartContainer = document.querySelector("#type-sector-chart");
    if (typeSectorChart) {
        typeSectorChart.destroy();
    }
    chartContainer.innerHTML = "";

    // Agrupa os dados por tipo
    const groupedData = {};
    typeSectorData.forEach(item => {
        if (!groupedData[item.Tipo]) {
            groupedData[item.Tipo] = [];
        }
        groupedData[item.Tipo].push({
            setor: item.Setor,
            total: item.Total
        });
    });
    
    // Prepara as séries para o gráfico
    const series = Object.keys(groupedData).map(tipo => {
        return {
            name: tipo,
            data: groupedData[tipo].map(item => item.total)
        };
    });
    
    // Obtém todas as categorias (setores) únicas
    const allSectors = [...new Set(typeSectorData.map(item => item.Setor))];
    
    // Configurações do gráfico
    const options = {
        series: series,
        chart: {
            type: 'bar',
            height: 350,
            stacked: true,
            toolbar: {
                show: true
            },
            events: {
                dataPointSelection: function(event, chartContext, config) {
                    const setor = config.w.globals.labels[config.dataPointIndex];
                    const tipo = config.w.globals.seriesNames[config.seriesIndex];
                    
                    Swal.fire({
                        title: 'Filtrar por Tipo e Setor',
                        text: `Deseja filtrar os dados para mostrar apenas o tipo "${tipo}" no setor "${setor}"?`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Sim, filtrar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Aplicar filtro por tipo e setor
                            document.querySelector('#filter-type').value = tipo;
                            document.querySelector('#filter-sector').value = setor;
                            applyFilters();
                        }
                    });
                }
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: allSectors,
            title: {
                text: 'Setor'
            }
        },
        yaxis: {
            title: {
                text: 'Quantidade'
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: function (val) {
                    return val + " ocorrências";
                }
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const setor = w.globals.labels[dataPointIndex];
                const tipo = w.globals.seriesNames[seriesIndex];
                const valor = series[seriesIndex][dataPointIndex];
                
                // Calcula o total para este setor (soma de todas as séries para este ponto de dados)
                let totalSetor = 0;
                for (let i = 0; i < series.length; i++) {
                    totalSetor += series[i][dataPointIndex] || 0;
                }
                
                const porcentagem = totalSetor > 0 ? ((valor / totalSetor) * 100).toFixed(1) : 0;
                
                return `<div class="p-2">
                    <div class="fw-bold mb-1">${setor} - ${tipo}</div>
                    <div>Total: <span class="fw-semibold">${valor} ocorrências</span></div>
                    <div>Percentual no setor: <span class="fw-semibold">${porcentagem}%</span></div>
                    <div class="small text-muted mt-1">Análise combinada de tipo e setor</div>
                </div>`;
            }
        },
        legend: {
            position: 'top'
        }
    };
    
    // Destrói o gráfico existente, se houver
    if (typeSectorChart) {
        typeSectorChart.destroy();
    }
    
    // Cria o novo gráfico
    typeSectorChart = new ApexCharts(document.querySelector("#type-sector-chart"), options);
}

// Cria o gráfico de divergências por mês
function createMonthlyChart(monthlyData) {
    // Verifica se a biblioteca ApexCharts está disponível
    if (typeof ApexCharts === 'undefined') {
        console.error('A biblioteca ApexCharts não foi carregada corretamente.');
        return;
    }

    const chartContainer = document.querySelector("#monthly-chart");
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    chartContainer.innerHTML = "";

    // Prepara os dados para o gráfico
    const series = [{
        name: 'Total',
        data: monthlyData.map(item => item.Total)
    }];
    
    const categories = monthlyData.map(item => item.Mes);
    
    // Configurações do gráfico
    const options = {
        series: series,
        chart: {
            type: 'line',
            height: 350,
            toolbar: {
                show: true
            },
            events: {
                dataPointSelection: function(event, chartContext, config) {
                    const mes = config.w.globals.labels[config.dataPointIndex];
                    
                    // Extrair mês e ano do formato MM/YYYY
                    const [month, year] = mes.split('/');
                    
                    // Criar datas para o primeiro e último dia do mês
                    const startDate = `${year}-${month}-01`;
                    
                    // Último dia do mês (considerando meses com diferentes números de dias)
                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const endDate = `${year}-${month}-${lastDay}`;
                    
                    Swal.fire({
                        title: 'Filtrar por Período',
                        text: `Deseja filtrar os dados para mostrar apenas o mês de "${mes}"?`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Sim, filtrar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Aplicar filtro por período
                            document.querySelector('#start-date-abertura').value = startDate;
                            document.querySelector('#end-date-abertura').value = endDate;
                            applyFilters();
                        }
                    });
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 3,
            colors: ['#f9423a']
        },
        xaxis: {
            categories: categories,
            title: {
                text: 'Mês'
            }
        },
        yaxis: {
            title: {
                text: 'Quantidade'
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " ocorrências";
                }
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const mes = w.globals.labels[dataPointIndex];
                const valor = series[seriesIndex][dataPointIndex];
                
                // Encontra o valor máximo da série para calcular a tendência
                const maxValue = Math.max(...series[seriesIndex]);
                const minValue = Math.min(...series[seriesIndex]);
                const mediaValue = series[seriesIndex].reduce((a, b) => a + b, 0) / series[seriesIndex].length;
                
                let tendencia = '';
                if (valor > mediaValue) {
                    tendencia = '<span class="text-danger">Acima da média</span>';
                } else if (valor < mediaValue) {
                    tendencia = '<span class="text-success">Abaixo da média</span>';
                } else {
                    tendencia = '<span class="text-warning">Na média</span>';
                }
                
                return `<div class="p-2">
                    <div class="fw-bold mb-1">${mes}</div>
                    <div>Total: <span class="fw-semibold">${valor} ocorrências</span></div>
                    <div>Tendência: ${tendencia}</div>
                    <div class="small text-muted mt-1">Média mensal: ${mediaValue.toFixed(1)}</div>
                </div>`;
            }
        },
        markers: {
            size: 5,
            colors: ['#f9423a'],
            strokeColors: '#fff',
            strokeWidth: 2,
            hover: {
                size: 7,
            }
        }
    };
    
    // Destrói o gráfico existente, se houver
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    // Cria o novo gráfico
    monthlyChart = new ApexCharts(document.querySelector("#monthly-chart"), options);
}

// Cria o gráfico de divergências por mês e tipo
function createMonthlyTypeChart(monthlyTypeData) {
    // Verifica se a biblioteca ApexCharts está disponível
    if (typeof ApexCharts === 'undefined') {
        console.error('A biblioteca ApexCharts não foi carregada corretamente.');
        return;
    }

    const chartContainer = document.querySelector("#monthly-type-chart");
    if (monthlyTypeChart) {
        monthlyTypeChart.destroy();
    }
    chartContainer.innerHTML = "";

    // Agrupa os dados por tipo
    const groupedData = {};
    monthlyTypeData.forEach(item => {
        if (!groupedData[item.Tipo]) {
            groupedData[item.Tipo] = [];
        }
        groupedData[item.Tipo].push({
            mes: item.Mes,
            total: item.Total
        });
    });
    
    // Prepara as séries para o gráfico
    const series = Object.keys(groupedData).map(tipo => {
        return {
            name: tipo,
            data: groupedData[tipo].map(item => item.total)
        };
    });
    
    // Obtém todas as categorias (meses) únicas
    const allMonths = [...new Set(monthlyTypeData.map(item => item.Mes))];
    
    // Configurações do gráfico
    const options = {
        series: series,
        chart: {
            type: 'line',
            height: 350,
            toolbar: {
                show: true
            },
            events: {
                dataPointSelection: function(event, chartContext, config) {
                    const mes = config.w.globals.labels[config.dataPointIndex];
                    const tipo = config.w.globals.seriesNames[config.seriesIndex];
                    
                    // Extrair mês e ano do formato MM/YYYY
                    const [month, year] = mes.split('/');
                    
                    // Criar datas para o primeiro e último dia do mês
                    const startDate = `${year}-${month}-01`;
                    
                    // Último dia do mês (considerando meses com diferentes números de dias)
                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const endDate = `${year}-${month}-${lastDay}`;
                    
                    Swal.fire({
                        title: 'Filtrar por Período e Tipo',
                        text: `Deseja filtrar os dados para mostrar apenas o tipo "${tipo}" no mês de "${mes}"?`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Sim, filtrar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Aplicar filtro por período e tipo
                            document.querySelector('#filter-type').value = tipo;
                            document.querySelector('#start-date-abertura').value = startDate;
                            document.querySelector('#end-date-abertura').value = endDate;
                            applyFilters();
                        }
                    });
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        xaxis: {
            categories: allMonths,
            title: {
                text: 'Mês'
            }
        },
        yaxis: {
            title: {
                text: 'Quantidade'
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: function (val) {
                    return val + " ocorrências";
                }
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const mes = w.globals.labels[dataPointIndex];
                const tipo = w.globals.seriesNames[seriesIndex];
                const valor = series[seriesIndex][dataPointIndex];
                
                // Calcula o total para este mês (soma de todas as séries para este ponto de dados)
                let totalMes = 0;
                for (let i = 0; i < series.length; i++) {
                    totalMes += series[i][dataPointIndex] || 0;
                }
                
                const porcentagem = totalMes > 0 ? ((valor / totalMes) * 100).toFixed(1) : 0;
                
                // Calcula a variação em relação ao mês anterior
                let variacao = '';
                if (dataPointIndex > 0 && series[seriesIndex][dataPointIndex-1] !== undefined) {
                    const valorAnterior = series[seriesIndex][dataPointIndex-1];
                    const diff = valor - valorAnterior;
                    const percentDiff = valorAnterior !== 0 ? ((diff / valorAnterior) * 100).toFixed(1) : 'N/A';
                    
                    if (diff > 0) {
                        variacao = `<span class="text-danger">+${diff} (${percentDiff}%)</span>`;
                    } else if (diff < 0) {
                        variacao = `<span class="text-success">${diff} (${percentDiff}%)</span>`;
                    } else {
                        variacao = '<span class="text-warning">Sem variação</span>';
                    }
                }
                
                return `<div class="p-2">
                    <div class="fw-bold mb-1">${mes} - ${tipo}</div>
                    <div>Total: <span class="fw-semibold">${valor} ocorrências</span></div>
                    <div>Percentual no mês: <span class="fw-semibold">${porcentagem}%</span></div>
                    ${variacao ? `<div>Variação: ${variacao}</div>` : ''}
                    <div class="small text-muted mt-1">Evolução mensal por tipo</div>
                </div>`;
            }
        },
        markers: {
            size: 5,
            strokeColors: '#fff',
            strokeWidth: 2,
            hover: {
                size: 7,
            }
        },
        legend: {
            position: 'top'
        }
    };
    
    // Destrói o gráfico existente, se houver
    if (monthlyTypeChart) {
        monthlyTypeChart.destroy();
    }
    
    // Cria o novo gráfico
    monthlyTypeChart = new ApexCharts(document.querySelector("#monthly-type-chart"), options);
}

// Cria o gráfico de CEs Lançadas
function createCELancadasChart(data) {
    if (typeof ApexCharts === 'undefined') {
        console.error('A biblioteca ApexCharts não foi carregada corretamente.');
        return;
    }

    const chartContainer = document.querySelector("#ce-lancadas-chart");
    if (ceLancadasChart) {
        ceLancadasChart.destroy();
    }
    chartContainer.innerHTML = "";

    // Processa os dados para contar CEs por mês
    const monthlyCount = data.reduce((acc, item) => {
        if (item.Data_Desconsolidacao_Mercante) {
            try {
                const parts = item.Data_Desconsolidacao_Mercante.split('/');
                const monthYear = `${parts[1]}/${parts[2]}`;
                if (!acc[monthYear]) {
                    acc[monthYear] = {
                        count: 0,
                        year: parseInt(parts[2]),
                        month: parseInt(parts[1])
                    };
                }
                acc[monthYear].count++;
            } catch (e) {
                console.warn("Invalid date format:", item.Data_Desconsolidacao_Mercante);
            }
        }
        return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyCount).sort((a, b) => {
        const dataA = monthlyCount[a];
        const dataB = monthlyCount[b];
        if (dataA.year !== dataB.year) {
            return dataA.year - dataB.year;
        }
        return dataA.month - dataB.month;
    });

    const seriesData = sortedMonths.map(month => monthlyCount[month].count);
    const categories = sortedMonths;

    const options = {
        series: [{
            name: 'CEs Lançadas',
            data: seriesData
        }],
        chart: {
            type: 'area',
            height: 350,
            toolbar: {
                show: true
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        xaxis: {
            categories: categories,
            title: {
                text: 'Mês (Data de Desconsolidação)'
            }
        },
        yaxis: {
            title: {
                text: 'Quantidade de CEs'
            }
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val + " CEs";
                }
            }
        },
        markers: {
            size: 5
        }
    };

    if (ceLancadasChart) {
        ceLancadasChart.destroy();
    }

    ceLancadasChart = new ApexCharts(document.querySelector("#ce-lancadas-chart"), options);
}

function createCELiberadasChart(data) {
    if (typeof ApexCharts === 'undefined') {
        console.error('A biblioteca ApexCharts não foi carregada corretamente.');
        return;
    }

    const chartContainer = document.querySelector("#ce-liberadas-chart");
    if (ceLiberadasChart) {
        ceLiberadasChart.destroy();
    }
    chartContainer.innerHTML = "";

    // Processa os dados para contar CEs por mês
    const monthlyCount = data.reduce((acc, item) => {
        if (item.Data_Desembarque) {
            try {
                const parts = item.Data_Desembarque.split('/');
                const monthYear = `${parts[1]}/${parts[2]}`;
                if (!acc[monthYear]) {
                    acc[monthYear] = {
                        count: 0,
                        year: parseInt(parts[2]),
                        month: parseInt(parts[1])
                    };
                }
                acc[monthYear].count++;
            } catch (e) {
                console.warn("Invalid date format:", item.Data_Desembarque);
            }
        }
        return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyCount).sort((a, b) => {
        const dataA = monthlyCount[a];
        const dataB = monthlyCount[b];
        if (dataA.year !== dataB.year) {
            return dataA.year - dataB.year;
        }
        return dataA.month - dataB.month;
    });

    const seriesData = sortedMonths.map(month => monthlyCount[month].count);
    const categories = sortedMonths;

    const options = {
        series: [{
            name: 'CEs Liberadas',
            data: seriesData
        }],
        chart: {
            type: 'area',
            height: 350,
            toolbar: {
                show: true
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        xaxis: {
            categories: categories,
            title: {
                text: 'Mês (Data de Desembarque)'
            }
        },
        yaxis: {
            title: {
                text: 'Quantidade de CEs'
            }
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val + " CEs";
                }
            }
        },
        markers: {
            size: 5
        }
    };

    if (ceLiberadasChart) {
        ceLiberadasChart.destroy();
    }

    ceLiberadasChart = new ApexCharts(document.querySelector("#ce-liberadas-chart"), options);
}

// Função para renderizar todos os gráficos se o container estiver visível
function renderAllCharts() {
    const indicatorsContainer = document.querySelector('#indicators-container');
    if (indicatorsContainer.style.display !== 'none') {
        if (typeChart) typeChart.render();
        if (sectorChart) sectorChart.render();
        if (typeSectorChart) typeSectorChart.render();
        if (monthlyChart) monthlyChart.render();
        if (monthlyTypeChart) monthlyTypeChart.render();
        if (ceLancadasChart) ceLancadasChart.render();
        if (ceLiberadasChart) ceLiberadasChart.render();
    }
}

// Função auxiliar para configurar a tabela com colunas dinâmicas
function setupDynamicTable(data, tableId) {
    // Identificar todas as colunas dinâmicas (tipos) presentes nos dados
    const dynamicColumns = new Set();
    data.forEach(item => {
        Object.keys(item).forEach(key => {
            // Excluir colunas padrão que não são dinâmicas
            if (!['Numero_Processo', 'Data_Abertura_Processo', 'Tipo', 'Setor', 'Descricao', 'Data_Desconsolidacao_Mercante', 'Responsavel', 'action'].includes(key)) {
                dynamicColumns.add(key);
            }
        });
    });
    
    // Converter o Set para um array
    let dynamicColumnsArray = Array.from(dynamicColumns);
    
    // Reconstruir o cabeçalho da tabela com as colunas dinâmicas
    const tableHeader = $(`#${tableId} thead tr`);
    tableHeader.empty(); // Limpar o cabeçalho existente
    
    // Adicionar colunas fixas
    tableHeader.append('<th>Número Processo</th>');
    tableHeader.append('<th>Data Abertura</th>');
    tableHeader.append('<th>Tipo</th>');
    tableHeader.append('<th>Setor</th>');
    
    // Adicionar coluna de descrição se existir
    if (data.length > 0 && 'Descricao' in data[0]) {
        tableHeader.append('<th>Descrição</th>');
    }
    
    // Adicionar colunas dinâmicas
    dynamicColumnsArray.forEach(column => {
        tableHeader.append(`<th>${column}</th>`);
    });
    
    // Adicionar colunas finais
    tableHeader.append('<th>Data Desconsolidacao</th>');
    tableHeader.append('<th>Responsável</th>');
    tableHeader.append('<th>Ação</th>');
    
    // Definir as colunas para o DataTable
    const columns = [
        { data: 'Numero_Processo' },
        { data: 'Data_Abertura_Processo' },
        { data: 'Tipo' },
        { 
            data: 'Setor', 
            defaultContent: '-',
            render: function(data, type, row) {
                return data || '-';
            }
        }
    ];
    
    // Adicionar coluna de descrição se existir
    if (data.length > 0 && 'Descricao' in data[0]) {
        columns.push({ 
            data: 'Descricao', 
            defaultContent: '-',
            render: function(data, type, row) {
                return data || '-';
            }
        });
    }
    
    // Adicionar colunas dinâmicas
    dynamicColumnsArray.forEach(column => {
        columns.push({ 
            data: column,
            defaultContent: '-', // Valor padrão caso a coluna não exista para um registro
            render: function(data, type, row) {
                // Para renderização de exibição, retornar "-" se o valor for nulo ou vazio
                if (type === 'display') {
                    return data || '-';
                }
                // Para outros tipos (ordenação, filtragem, etc.), retornar o valor original
                return data;
            }
        });
    });
    
    // Adicionar colunas finais
    columns.push({ data: 'Data_Desconsolidacao_Mercante' });
    columns.push({ data: 'Responsavel' });
    columns.push({ 
        data: 'action',
        orderable: false,
        searchable: false
    });
    
    return {
        dynamicColumnsArray,
        columns
    };
}

// Cria ou recria a tabela de processos
async function generateTable(data = null) {
    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_ce_merchant')) {
        $('#table_ce_merchant').DataTable().destroy();
    }
    
    try {
        // Se não foram fornecidos dados, buscar da API
        if (!data) {
            data = await makeRequest('/api/ce-merchant/getAll', 'GET');
        }
        
        // Configurar a tabela com colunas dinâmicas
        const { columns } = setupDynamicTable(data, 'table_ce_merchant');
        
        // Criar a nova tabela com os dados da API
        table['table_ce_merchant'] = $('#table_ce_merchant').DataTable({
            dom: 'Bfrtip',
            paging: false,
            // pageLength: 10,
            fixedHeader: true,
            info: true,
            scrollY: 'calc(100vh - 300px)',
            scrollCollapse: true,
            order: [[0, 'asc']],
            data: data,
            columns: columns,
            buttons: [
                'excel', 'pdf', 'print'
            ],
            language: {
                searchPlaceholder: 'Pesquisar...',
                sSearch: '',
                url: '../../assets/libs/datatables/pt-br.json'
            },
            createdRow: function(row, data, dataIndex) {
                // Adicionar classe para identificar a linha
                $(row).addClass('clickable-row');
                
                // Adicionar atributos de dados para filtros rápidos
                $(row).attr('data-tipo', data.Tipo || '');
                $(row).attr('data-setor', data.Setor || '');
                $(row).attr('data-responsavel', data.Responsavel || '');
            }
        });
        
        // Adicionar evento para visualizar processo
        $('#table_ce_merchant').on('click', '.view-process', function() {
            const processNumber = $(this).data('processo');
            viewProcess(processNumber);
        });
        
        // Adicionar evento para filtrar por responsável ao clicar na célula correspondente
        $('#table_ce_merchant tbody').on('click', 'td:nth-child(7)', function() {
            const responsavel = $(this).text();
            if (responsavel && responsavel !== '-') {
                Swal.fire({
                    title: 'Filtrar por Responsável',
                    text: `Deseja filtrar os dados para mostrar apenas os processos do responsável "${responsavel}"?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, filtrar',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        document.querySelector('#filter-responsible').value = responsavel;
                        applyFilters();
                    }
                });
            }
        });
        
        // Adicionar evento para filtrar por tipo ao clicar na célula correspondente
        $('#table_ce_merchant tbody').on('click', 'td:nth-child(3)', function() {
            const tipo = $(this).text();
            if (tipo && tipo !== '-') {
                Swal.fire({
                    title: 'Filtrar por Tipo',
                    text: `Deseja filtrar os dados para mostrar apenas os processos do tipo "${tipo}"?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, filtrar',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        document.querySelector('#filter-type').value = tipo;
                        applyFilters();
                    }
                });
            }
        });
        
        // Adicionar evento para filtrar por setor ao clicar na célula correspondente
        $('#table_ce_merchant tbody').on('click', 'td:nth-child(4)', function() {
            const setor = $(this).text();
            if (setor && setor !== '-') {
                Swal.fire({
                    title: 'Filtrar por Setor',
                    text: `Deseja filtrar os dados para mostrar apenas os processos do setor "${setor}"?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, filtrar',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        document.querySelector('#filter-sector').value = setor;
                        applyFilters();
                    }
                });
            }
        });
    } catch (error) {
        console.error('Erro ao gerar tabela:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Ocorreu um erro ao carregar a tabela. Por favor, tente novamente mais tarde.'
        });
    }
}

// Aplica os filtros selecionados
async function applyFilters() {
    // Obter valores dos filtros
    const type = document.querySelector('#filter-type').value;
    const sector = document.querySelector('#filter-sector').value;
    const responsible = document.querySelector('#filter-responsible').value;
    const startDateAbertura = document.querySelector('#start-date-abertura').value;
    const endDateAbertura = document.querySelector('#end-date-abertura').value;
    const startDateCE = document.querySelector('#start-date-ce').value;
    const endDateCE = document.querySelector('#end-date-ce').value;
    
    // Destruir a tabela existente
    if ($.fn.DataTable.isDataTable('#table_ce_merchant')) {
        $('#table_ce_merchant').DataTable().destroy();
    }
    
    try {
        // Obter todos os dados
        const allData = await makeRequest('/api/ce-merchant/getAll', 'GET');
        
        // Aplicar filtros aos dados
        let filteredData = allData.filter(item => {
            // Filtro por tipo
            if (type && item.Tipo !== type) {
                return false;
            }
            
            // Filtro por setor
            if (sector && item.Setor !== sector) {
                return false;
            }
            
            // Filtro por responsável
            if (responsible && item.Responsavel !== responsible) {
                return false;
            }

             // Filtro por data CE
             if (startDateCE && endDateCE && !item.Data_Desconsolidacao_Mercante) {
                return false;
            }

            
            // Filtro por data de abertura
            if (startDateAbertura && endDateAbertura && item.Data_Abertura_Processo) {
                // Converter data do formato DD/MM/YYYY para objeto Date
                const parts = item.Data_Abertura_Processo.split('/');
                const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
                const startDateParts = startDateAbertura.split('-');
                const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
                const endDateParts = endDateAbertura.split('-');
                const endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);
                endDate.setHours(23, 59, 59, 999); // Garante que o dia final seja inclusivo
                
                if (itemDate < startDate || itemDate > endDate) {
                    return false;
                }
            }
            
            // Filtro por data CE
            if (startDateCE && endDateCE && item.Data_Desconsolidacao_Mercante && item.Data_Desconsolidacao_Mercante !== '-'  && item.Data_Desconsolidacao_Mercante !== null) {
             
                // Converter data do formato DD/MM/YYYY para objeto Date
                const parts = item.Data_Desconsolidacao_Mercante.split('/');
                const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
                const startDateParts = startDateCE.split('-');
                const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
                const endDateParts = endDateCE.split('-');
                const endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);
                endDate.setHours(23, 59, 59, 999); // Garante que o dia final seja inclusivo
                
                if (itemDate < startDate || itemDate > endDate) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Filtra os dados de CE Lançadas
        const filteredCeLancadas = ceLancadasData.filter(item => {
            // Filtro por responsável
            if (responsible && item.Responsavel !== responsible) {
                return false;
            }
            // Filtro por data de abertura
            if (startDateAbertura && endDateAbertura && item.Data_Abertura_Processo) {
                const parts = item.Data_Abertura_Processo.split('/');
                const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
                const startDateParts = startDateAbertura.split('-');
                const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
                const endDateParts = endDateAbertura.split('-');
                const endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);
                endDate.setHours(23, 59, 59, 999); // Garante que o dia final seja inclusivo
                if (itemDate < startDate || itemDate > endDate) {
                    return false;
                }
            }
            // Filtro por data CE
            if (startDateCE && endDateCE && item.Data_Desconsolidacao_Mercante) {
                const parts = item.Data_Desconsolidacao_Mercante.split('/');
                const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
                const startDateParts = startDateCE.split('-');
                const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
                const endDateParts = endDateCE.split('-');
                const endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);
                endDate.setHours(23, 59, 59, 999); // Garante que o dia final seja inclusivo
                if (itemDate < startDate || itemDate > endDate) {
                    return false;
                }
            }
            return true;
        });
        
        // Filtra os dados de CE Liberadas
        const filteredCeLiberadas = ceLiberadasData.filter(item => {
            // Usaremos o filtro de Data Desconsolidação (Data CE) para filtrar por Data de Desembarque
            if (startDateCE && endDateCE && item.Data_Desembarque) {
                const parts = item.Data_Desembarque.split('/');
                const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
                const startDateParts = startDateCE.split('-');
                const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
                const endDateParts = endDateCE.split('-');
                const endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);
                endDate.setHours(23, 59, 59, 999); // Garante que o dia final seja inclusivo
                if (itemDate < startDate || itemDate > endDate) {
                    return false;
                }
            }
            return true;
        });
        
        // Atualizar gráficos com dados filtrados
        updateChartsWithFilteredData(filteredData);
        createCELancadasChart(filteredCeLancadas);
        createCELiberadasChart(filteredCeLiberadas);
        
        // Renderiza os gráficos atualizados
        renderAllCharts();

        // Gerar tabela com dados filtrados
        await generateTable(filteredData);
        
        // Mostrar mensagem de sucesso
        Swal.fire({
            icon: 'success',
            title: 'Filtros aplicados',
            text: `Foram encontrados ${filteredData.length} registros com os filtros selecionados.`,
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Erro ao aplicar filtros:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Ocorreu um erro ao aplicar os filtros. Por favor, tente novamente mais tarde.'
        });
    }
}

// Atualiza os gráficos com os dados filtrados
function updateChartsWithFilteredData(filteredData) {
    // Processar dados para os gráficos
    const typeCount = processTypeCount(filteredData);
    const sectorCount = processSectorCount(filteredData);
    const typeSectorCount = processTypeSectorCount(filteredData);
    const monthlyCount = processMonthlyCount(filteredData);
    const monthlyTypeCount = processMonthlyTypeCount(filteredData);
    
    // Atualizar gráficos
    createTypeChart(typeCount);
    createSectorChart(sectorCount);
    createTypeSectorChart(typeSectorCount);
    createMonthlyChart(monthlyCount);
    createMonthlyTypeChart(monthlyTypeCount);
}

// Processa dados para o gráfico de tipo
function processTypeCount(data) {
    const typeMap = new Map();
    
    // Contar ocorrências por tipo
    data.forEach(item => {
        if (item.Tipo) {
            if (!typeMap.has(item.Tipo)) {
                typeMap.set(item.Tipo, 0);
            }
            typeMap.set(item.Tipo, typeMap.get(item.Tipo) + 1);
        }
    });
    
    // Converter para o formato esperado pelo gráfico
    const result = [];
    typeMap.forEach((value, key) => {
        result.push({
            Tipo: key,
            Total: value
        });
    });
    
    return result;
}

// Processa dados para o gráfico de setor
function processSectorCount(data) {
    const sectorMap = new Map();
    
    // Contar ocorrências por setor
    data.forEach(item => {
        if (item.Setor) {
            if (!sectorMap.has(item.Setor)) {
                sectorMap.set(item.Setor, 0);
            }
            sectorMap.set(item.Setor, sectorMap.get(item.Setor) + 1);
        }
    });
    
    // Converter para o formato esperado pelo gráfico
    const result = [];
    sectorMap.forEach((value, key) => {
        result.push({
            Setor: key,
            Total: value
        });
    });
    
    return result;
}

// Processa dados para o gráfico de tipo e setor
function processTypeSectorCount(data) {
    const typeSectorMap = new Map();
    
    // Contar ocorrências por tipo e setor
    data.forEach(item => {
        if (item.Tipo && item.Setor) {
            const key = `${item.Tipo}|${item.Setor}`;
            if (!typeSectorMap.has(key)) {
                typeSectorMap.set(key, 0);
            }
            typeSectorMap.set(key, typeSectorMap.get(key) + 1);
        }
    });
    
    // Converter para o formato esperado pelo gráfico
    const result = [];
    typeSectorMap.forEach((value, key) => {
        const [tipo, setor] = key.split('|');
        result.push({
            Tipo: tipo,
            Setor: setor,
            Total: value
        });
    });
    
    return result;
}

// Processa dados para o gráfico mensal
function processMonthlyCount(data) {
    const monthMap = new Map();
    
    // Contar ocorrências por mês
    data.forEach(item => {
        if (item.Data_Abertura_Processo) {
            // Extrair mês e ano do formato DD/MM/YYYY
            const parts = item.Data_Abertura_Processo.split('/');
            const monthYear = `${parts[1]}/${parts[2]}`;
            
            if (!monthMap.has(monthYear)) {
                monthMap.set(monthYear, {
                    Mes: monthYear,
                    Ano: parseInt(parts[2]),
                    Mes_Numero: parseInt(parts[1]),
                    Total: 0
                });
            }
            
            monthMap.get(monthYear).Total++;
        }
    });
    
    // Converter para array e ordenar por ano e mês
    const result = Array.from(monthMap.values()).sort((a, b) => {
        if (a.Ano !== b.Ano) {
            return a.Ano - b.Ano;
        }
        return a.Mes_Numero - b.Mes_Numero;
    });
    
    return result;
}

// Processa dados para o gráfico mensal por tipo
function processMonthlyTypeCount(data) {
    const monthTypeMap = new Map();
    
    // Contar ocorrências por mês e tipo
    data.forEach(item => {
        if (item.Data_Abertura_Processo && item.Tipo) {
            // Extrair mês e ano do formato DD/MM/YYYY
            const parts = item.Data_Abertura_Processo.split('/');
            const monthYear = `${parts[1]}/${parts[2]}`;
            const key = `${monthYear}|${item.Tipo}`;
            
            if (!monthTypeMap.has(key)) {
                monthTypeMap.set(key, {
                    Mes: monthYear,
                    Ano: parseInt(parts[2]),
                    Mes_Numero: parseInt(parts[1]),
                    Tipo: item.Tipo,
                    Total: 0
                });
            }
            
            monthTypeMap.get(key).Total++;
        }
    });
    
    // Converter para array e ordenar por ano, mês e tipo
    const result = Array.from(monthTypeMap.values()).sort((a, b) => {
        if (a.Ano !== b.Ano) {
            return a.Ano - b.Ano;
        }
        if (a.Mes_Numero !== b.Mes_Numero) {
            return a.Mes_Numero - b.Mes_Numero;
        }
        return a.Tipo.localeCompare(b.Tipo);
    });
    
    return result;
}

// Limpa os filtros e recarrega os dados originais
async function clearFilters() {
    // Limpa os campos de filtro
    document.querySelector('#filter-type').value = '';
    document.querySelector('#filter-sector').value = '';
    document.querySelector('#filter-responsible').value = '';
    document.querySelector('#start-date-abertura').value = '';
    document.querySelector('#end-date-abertura').value = '';
    document.querySelector('#start-date-ce').value = '';
    document.querySelector('#end-date-ce').value = '';
    
    // Recarrega os dados originais
    await loadData();
    
    // Mostrar mensagem de sucesso
    Swal.fire({
        icon: 'success',
        title: 'Filtros limpos',
        text: 'Todos os filtros foram removidos e os dados foram recarregados.',
        timer: 2000,
        showConfirmButton: false
    });
}

// Função para visualizar detalhes do processo
function viewProcess(processNumber) {
    Swal.fire({
        title: 'Detalhes do Processo',
        text: `Número do Processo: ${processNumber}`,
        icon: 'info',
        confirmButtonText: 'Fechar'
    });
}

// Função para exportar dados do gráfico de CE Lançadas para Excel
async function exportCELancadasToExcel() {
    // Obter os filtros atuais para aplicar aos dados de exportação
    const responsible = document.querySelector('#filter-responsible').value;
    const startDateAbertura = document.querySelector('#start-date-abertura').value;
    const endDateAbertura = document.querySelector('#end-date-abertura').value;
    const startDateCE = document.querySelector('#start-date-ce').value;
    const endDateCE = document.querySelector('#end-date-ce').value;

    // Filtrar os dados globais de CE Lançadas
    const filteredData = ceLancadasData.filter(item => {
        if (responsible && item.Responsavel !== responsible) return false;
        if (startDateAbertura && endDateAbertura) {
            const parts = item.Data_Abertura_Processo.split('/');
            const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
            if (itemDate < new Date(startDateAbertura) || itemDate > new Date(endDateAbertura)) return false;
        }
        if (startDateCE && endDateCE && item.Data_Desconsolidacao_Mercante) {
            const parts = item.Data_Desconsolidacao_Mercante.split('/');
            const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
            if (itemDate < new Date(startDateCE) || itemDate > new Date(endDateCE)) return false;
        }
        return true;
    });

    if (filteredData.length === 0) {
        Swal.fire('Nenhum dado para exportar', 'Não há dados correspondentes aos filtros selecionados.', 'warning');
        return;
    }

    // Usar a biblioteca SheetJS (xlsx) para criar o arquivo Excel
    try {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CEs Lançadas");

        // Fazer o download do arquivo
        XLSX.writeFile(workbook, "CEs_Lancadas.xlsx");

        Swal.fire('Exportado!', 'Os dados foram exportados para Excel com sucesso.', 'success');
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        Swal.fire('Erro', 'Ocorreu um erro ao exportar os dados para Excel.', 'error');
    }
}

// Função para exportar dados do gráfico de CE Liberadas para Excel
async function exportCELiberadasToExcel() {
    // Obter os filtros atuais para aplicar aos dados de exportação
    const startDateCE = document.querySelector('#start-date-ce').value;
    const endDateCE = document.querySelector('#end-date-ce').value;

    // Filtrar os dados globais de CE Liberadas
    const filteredData = ceLiberadasData.filter(item => {
        if (startDateCE && endDateCE && item.Data_Desembarque) {
            const parts = item.Data_Desembarque.split('/');
            const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
            const startDateParts = startDateCE.split('-');
            const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
            const endDateParts = endDateCE.split('-');
            const endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);
            endDate.setHours(23, 59, 59, 999);
            if (itemDate < startDate || itemDate > endDate) {
                return false;
            }
        }
        return true;
    });

    if (filteredData.length === 0) {
        Swal.fire('Nenhum dado para exportar', 'Não há dados correspondentes aos filtros selecionados.', 'warning');
        return;
    }

    // Usar a biblioteca SheetJS (xlsx) para criar o arquivo Excel
    try {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CEs Liberadas");

        // Fazer o download do arquivo
        XLSX.writeFile(workbook, "CEs_Liberadas.xlsx");

        Swal.fire('Exportado!', 'Os dados foram exportados para Excel com sucesso.', 'success');
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        Swal.fire('Erro', 'Ocorreu um erro ao exportar os dados para Excel.', 'error');
    }
} 