document.addEventListener('DOMContentLoaded', function() {
    const API_URL = '/api/freight-tariffs';
    let allTariffs = [];
    let formData = {};
    
    // Paleta de cores para consistência nos gráficos
    const currencyColors = {
        'USD': '#3b82f6', 'EUR': '#ef4444', 'BRL': '#10b981', 'GBP': '#f59e0b',
        'JPY': '#6366f1', 'AUD': '#ec4899', 'CAD': '#8b5cf6', 'CHF': '#14b8a6'
    };
    const defaultColor = '#6c757d';

    function getCurrencyColor(currency) {
        return currencyColors[currency] || defaultColor;
    }

    // --- Inicialização ---
    async function initializePage() {
        await Promise.all([
            loadFormData(),
            loadAllTariffs()
        ]);
        
        populateFilters();
        applyAllAnalyses();
        
        // Adicionar listeners de eventos
        document.getElementById('apply-filters').addEventListener('click', applyAllAnalyses);
    }

    function applyAllAnalyses() {
        calculateMetrics();
        renderAllCharts();
        renderBestOptionsTable();
    }
    
    // --- Carregamento de Dados ---
    async function loadFormData() {
        try {
            formData = await makeRequest(`${API_URL}/meta/form-data`);
            return formData;
        } catch (error) {
            console.error('Erro ao carregar dados do formulário:', error);
            showError('Falha ao carregar dados de suporte.');
        }
    }
    
    async function loadAllTariffs() {
        try {
            allTariffs = await makeRequest(`${API_URL}/tariffs`);
            return allTariffs;
        } catch (error) {
            console.error('Erro ao carregar tarifas:', error);
            showError('Falha ao carregar dados de tarifas.');
        }
    }
    
    // --- Manipulação de Filtros ---
    function populateFilters() {
        // Preencher filtro de modalidades
        const modalityFilter = document.getElementById('modality-filter');
        formData.modalities.forEach(modality => {
            const option = document.createElement('option');
            option.value = modality.id;
            option.textContent = modality.name;
            modalityFilter.appendChild(option);
        });
        
        // Preencher filtro de rotas
        const routeFilter = document.getElementById('route-filter');
        const routes = extractUniqueRoutes();
        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.value;
            option.textContent = route.label;
            routeFilter.appendChild(option);
        });
    }
    
    function extractUniqueRoutes() {
        const routeMap = new Map();
        
        allTariffs.forEach(tariff => {
            const routeKey = `${tariff.origin_id}-${tariff.destination_id}`;
            const routeLabel = `${tariff.origin_name} → ${tariff.destination_name}`;
            
            if (!routeMap.has(routeKey)) {
                routeMap.set(routeKey, {
                    value: routeKey,
                    label: routeLabel,
                    origin_id: tariff.origin_id,
                    destination_id: tariff.destination_id
                });
            }
        });
        
        return Array.from(routeMap.values());
    }
    
    function extractUniqueCurrencies() {
        const currencies = new Set();
        
        // Extrair moedas do frete
        allTariffs.forEach(tariff => {
            if (tariff.freight_currency) {
                currencies.add(tariff.freight_currency);
            }
        });
        
        // Extrair moedas das sobretaxas
        allTariffs.forEach(tariff => {
            if (tariff.surcharges && Array.isArray(tariff.surcharges)) {
                tariff.surcharges.forEach(surcharge => {
                    if (surcharge.currency) {
                        currencies.add(surcharge.currency);
                    }
                });
            }
        });
        
        // Garantir que USD esteja sempre disponível (caso não exista nenhuma tarifa)
        if (currencies.size === 0) {
            currencies.add('USD');
        }
        
        return Array.from(currencies).sort();
    }
    
    function handleFilterChange() {
        calculateMetrics();
        renderAllCharts();
        renderBestOptionsTable();
    }
    
    function handleCurrencyChange(event) {
        selectedCurrency = event.target.value;
        calculateMetrics();
        renderAllCharts();
        renderBestOptionsTable();
        
        // Atualizar rótulos com a moeda selecionada
        document.querySelectorAll('.currency-label').forEach(el => {
            el.textContent = selectedCurrency;
        });
    }
    
    function getFilteredTariffs() {
        const periodFilter = parseInt(document.getElementById('period-filter').value);
        const modalityFilter = document.getElementById('modality-filter').value;
        const routeFilter = document.getElementById('route-filter').value;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - periodFilter);
        
        return allTariffs.filter(tariff => {
            // Filtro de período
            const validityEnd = new Date(tariff.validity_end_date);
            if (validityEnd < cutoffDate) return false;
            
            // Filtro de modalidade
            if (modalityFilter !== 'all' && tariff.modality_id != modalityFilter) return false;
            
            // Filtro de rota
            if (routeFilter !== 'all') {
                const [originId, destId] = routeFilter.split('-');
                if (tariff.origin_id != originId || tariff.destination_id != destId) return false;
            }
            
            return true;
        });
    }
    
    function getFilteredTariffsByCurrency(currency) {
        return getFilteredTariffs().filter(t => t.freight_currency === currency);
    }
    
    // --- Cálculo de Métricas ---
    function calculateMetrics() {
        const filteredTariffs = getFilteredTariffs();

        // --- Média de Frete por Moeda ---
        const freightCostsByCurrency = {};
        filteredTariffs.forEach(t => {
            if (t.freight_cost && t.freight_currency) {
                if (!freightCostsByCurrency[t.freight_currency]) {
                    freightCostsByCurrency[t.freight_currency] = { sum: 0, count: 0 };
                }
                freightCostsByCurrency[t.freight_currency].sum += parseFloat(t.freight_cost);
                freightCostsByCurrency[t.freight_currency].count++;
            }
        });

        const avgFreightContainer = document.getElementById('avg-freight-values');
        avgFreightContainer.innerHTML = ''; // Limpa conteúdo anterior

        const displayCurrencies = ['USD', 'BRL'];
        const otherCurrenciesData = [];
        const allCalculatedCurrencies = Object.keys(freightCostsByCurrency);

        // Prioriza a ordem BRL, depois USD
        const orderedDisplayCurrencies = displayCurrencies.filter(c => allCalculatedCurrencies.includes(c));

        orderedDisplayCurrencies.forEach(currency => {
            const avg = freightCostsByCurrency[currency].sum / freightCostsByCurrency[currency].count;
            const itemEl = document.createElement('div');
            itemEl.className = 'avg-freight-item';
            itemEl.innerHTML = `
                <span class="value">${avg.toFixed(2)}</span>
                <span class="currency-badge">${currency}</span>
            `;
            avgFreightContainer.appendChild(itemEl);
        });

        allCalculatedCurrencies.forEach(currency => {
            if (!displayCurrencies.includes(currency)) {
                const avg = freightCostsByCurrency[currency].sum / freightCostsByCurrency[currency].count;
                otherCurrenciesData.push(`${avg.toFixed(2)} ${currency}`);
            }
        });

        if (otherCurrenciesData.length > 0) {
            const tooltipTitle = otherCurrenciesData.join('<br>');
            const moreEl = document.createElement('div');
            moreEl.className = 'avg-freight-item more-info-badge';
            moreEl.innerHTML = `<span>+${otherCurrenciesData.length}</span>`;
            moreEl.setAttribute('data-bs-toggle', 'tooltip');
            moreEl.setAttribute('data-bs-placement', 'top');
            moreEl.setAttribute('data-bs-html', 'true');
            moreEl.setAttribute('title', tooltipTitle);
            avgFreightContainer.appendChild(moreEl);
        }

        if (avgFreightContainer.innerHTML === '') {
            avgFreightContainer.innerHTML = '<div class="metric-value">0.00</div>';
        }

        // Inicializa todos os tooltips na página
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // --- Tempo médio de trânsito ---
        const transitTimes = filteredTariffs
            .filter(t => t.transit_time)
            .map(t => parseInt(t.transit_time));
            
        const avgTransit = transitTimes.length > 0
            ? transitTimes.reduce((sum, time) => sum + time, 0) / transitTimes.length
            : 0;
            
        // --- Tarifas Ativas ---
        const now = new Date();
        const activeTariffs = filteredTariffs.filter(t => new Date(t.validity_end_date) >= now).length;
        
        // --- Tarifas a Expirar (30 dias) ---
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        
        const expiringTariffs = filteredTariffs.filter(t => {
            const validityEnd = new Date(t.validity_end_date);
            return validityEnd >= now && validityEnd <= thirtyDaysLater;
        }).length;
        
        // Atualizar os valores na UI
        document.getElementById('avg-transit').textContent = `${Math.round(avgTransit)} dias`;
        document.getElementById('active-tariffs').textContent = activeTariffs;
        document.getElementById('expiring-tariffs').textContent = expiringTariffs;
        
        // Simulação de mudanças percentuais
        document.getElementById('avg-freight-change').innerHTML = 
            `<i class="ri-arrow-down-line text-success"></i> 3.2% vs. período anterior`;
        document.getElementById('avg-transit-change').innerHTML = 
            `<i class="ri-arrow-down-line text-success"></i> 1.5% vs. período anterior`;
        document.getElementById('active-tariffs-change').innerHTML = 
            `<i class="ri-arrow-up-line text-success"></i> 7.8% vs. período anterior`;
        document.getElementById('expiring-tariffs-change').innerHTML = 
            `<i class="ri-arrow-up-line text-danger"></i> 12.4% vs. período anterior`;
    }
    
    // --- Renderização de Gráficos ---
    function renderAllCharts() {
        renderFreightTrendChart();
        renderModalityDistributionChart();
        renderTopAgentsTransitChart();
        renderTopAgentsCostChart();
        renderRoutesHeatmapChart();
    }
    
    function renderFreightTrendChart() {
        const ctx = document.getElementById('freight-trend-chart').getContext('2d');
        const filteredTariffs = getFilteredTariffs();
        const monthlyData = groupTariffsByMonthAndCurrency(filteredTariffs);

        if (window.freightTrendChart) {
            window.freightTrendChart.destroy();
        }

        window.freightTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: monthlyData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const currency = context.dataset.label;
                                const value = context.parsed.y.toFixed(2);
                                return `${currency}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: `Custo Médio de Frete`
                        }
                    }
                }
            }
        });
    }
    
    function renderModalityDistributionChart() {
        const ctx = document.getElementById('modality-distribution-chart').getContext('2d');
        
        // Agrupar por modalidade (independente da moeda)
        const filteredTariffs = getFilteredTariffs();
        const modalityData = groupTariffsByModality(filteredTariffs);
        
        // Limpar canvas para evitar sobreposição
        if (window.modalityDistributionChart) {
            window.modalityDistributionChart.destroy();
        }
        
        window.modalityDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: modalityData.labels,
                datasets: [{
                    data: modalityData.counts,
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1',
                        '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: `Distribuição de Tarifas por Modalidade`
                    }
                }
            }
        });
    }
    
    function renderTopAgentsTransitChart() {
        const ctx = document.getElementById('top-agents-transit-chart').getContext('2d');
        
        // Obter top 5 agentes por tempo de trânsito (independente da moeda)
        const filteredTariffs = getFilteredTariffs();
        const agentTransitData = getTopAgentsByTransitTime(filteredTariffs, 5);
        
        // Limpar canvas para evitar sobreposição
        if (window.topAgentsTransitChart) {
            window.topAgentsTransitChart.destroy();
        }
        
        window.topAgentsTransitChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: agentTransitData.labels,
                datasets: [{
                    label: 'Tempo Médio de Trânsito (dias)',
                    data: agentTransitData.values,
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Dias'
                        }
                    }
                }
            }
        });
    }
    
    function renderTopAgentsCostChart() {
        const ctx = document.getElementById('top-agents-cost-chart').getContext('2d');
        
        // Obter top 5 agentes por custo, combinando agente e moeda
        const filteredTariffs = getFilteredTariffs();
        const agentCostData = getTopAgentCurrencyCombinationsByCost(filteredTariffs, 5);
        
        // Limpar canvas para evitar sobreposição
        if (window.topAgentsCostChart) {
            window.topAgentsCostChart.destroy();
        }
        
        window.topAgentsCostChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: agentCostData.labels,
                datasets: [{
                    label: `Custo Médio de Frete`,
                    data: agentCostData.values,
                    backgroundColor: agentCostData.colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                // Extrai a moeda do final do label
                                const currency = label.split(' ').pop().replace(/[()]/g, '');
                                return `Custo Médio: ${value.toFixed(2)} ${currency}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Custo Médio'
                        }
                    }
                }
            }
        });
    }
    
    function renderRoutesHeatmapChart() {
        const container = document.getElementById('routes-heatmap-chart');
        const filteredTariffs = getFilteredTariffs();
        const routesData = prepareRoutesHeatmapData(filteredTariffs);
        
        // Limpar container para evitar sobreposição
        container.innerHTML = '';
        
        const options = {
            series: routesData.series,
            chart: {
                height: 450,
                type: 'heatmap',
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: false,
                        zoom: false,
                        zoomin: false,
                        zoomout: false,
                        pan: false,
                        reset: false
                    }
                }
            },
            dataLabels: {
                enabled: true,
                 style: {
                    colors: ['#000']
                }
            },
            colors: ["#3b82f6"],
            title: {
                text: `Densidade de Tarifas por Rota`
            },
            xaxis: {
                categories: routesData.destinations,
                tooltip: {
                    enabled: false
                }
            },
            yaxis: {
                categories: routesData.origins
            },
            tooltip: {
                enabled: true,
                custom: function({ seriesIndex, dataPointIndex, w }) {
                    if (seriesIndex < 0 || dataPointIndex < 0) return '';
                    const origin = w.globals.seriesNames[seriesIndex];
                    const destination = w.globals.xaxis.categories[dataPointIndex];
                    const routeKey = `${origin}-${destination}`;
                    const metadata = routesData.metadata[routeKey];
                    const tariffCount = w.globals.series[seriesIndex].data[dataPointIndex].y;

                    if (!metadata || Object.keys(metadata).length === 0) {
                        return `<div class="p-2 apex-tooltip">
                                    <strong>${origin} → ${destination}</strong><br>
                                    <small>Total de Tarifas: ${tariffCount}</small><br>
                                    <small>Nenhuma tarifa com custo encontrada.</small>
                                </div>`;
                    }

                    let costsHtml = Object.entries(metadata)
                        .map(([currency, data]) => `<li>${data.avg.toFixed(2)} (${currency}) - ${data.count} tarifa(s)</li>`)
                        .join('');

                    return `<div class="p-2 apex-tooltip">
                                <strong>${origin} → ${destination}</strong><br>
                                <small>Total de Tarifas: ${tariffCount}</small>
                                <hr class="my-1">
                                <strong>Custos Médios:</strong>
                                <ul class="list-unstyled mb-0 small">${costsHtml}</ul>
                            </div>`;
                }
            }
        };
        
        if (window.routesHeatmapChart) {
            window.routesHeatmapChart.destroy();
        }
        window.routesHeatmapChart = new ApexCharts(container, options);
        window.routesHeatmapChart.render();
    }
    
    // --- Renderização da Tabela ---
    function renderBestOptionsTable() {
        const tableBody = document.getElementById('best-options-table');
        const filteredTariffs = getFilteredTariffs();
        const bestOptions = findBestOptionsByRouteAndCurrency(filteredTariffs);
        
        tableBody.innerHTML = '';
        
        if (bestOptions.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="8" class="text-center">Nenhuma tarifa encontrada com os filtros atuais.</td>`;
            tableBody.appendChild(emptyRow);
            return;
        }
        
        bestOptions.forEach(option => {
            const row = document.createElement('tr');
            
            // Calcular score (exemplo simplificado - em uma aplicação real seria mais complexo)
            const score = calculateOptionScore(option);
            const scoreClass = score >= 8 ? 'text-success' : (score >= 5 ? 'text-warning' : 'text-danger');
            
            // Formatação do valor do frete com a moeda apropriada
            const freightCost = option.freight_cost ? parseFloat(option.freight_cost).toFixed(2) : '0.00';
            const freightCurrency = option.freight_currency || '';
            const freightDisplay = `${freightCost} <span class="badge bg-light text-dark">${freightCurrency}</span>`;
            
            row.innerHTML = `
                <td>${option.origin_name}</td>
                <td>${option.destination_name}</td>
                <td>${option.modality_name} ${option.container_type_name ? `(${option.container_type_name})` : ''}</td>
                <td>${option.agent_name}</td>
                <td class="currency-column">${freightDisplay}</td>
                <td>${option.transit_time || 'N/A'} dias</td>
                <td>${formatDate(option.validity_end_date)}</td>
                <td><span class="fw-bold ${scoreClass}">${score.toFixed(1)}</span></td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // --- Funções Auxiliares ---
    function groupTariffsByMonthAndCurrency(tariffs) {
        const monthlyDataByCurrency = {};
        const allMonths = new Set();

        tariffs.filter(t => t.freight_cost && t.freight_currency).forEach(tariff => {
            const date = new Date(tariff.validity_start_date);
            const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            allMonths.add(monthYear);

            const currency = tariff.freight_currency;
            if (!monthlyDataByCurrency[currency]) {
                monthlyDataByCurrency[currency] = {};
            }
            if (!monthlyDataByCurrency[currency][monthYear]) {
                monthlyDataByCurrency[currency][monthYear] = { sum: 0, count: 0 };
            }

            monthlyDataByCurrency[currency][monthYear].sum += parseFloat(tariff.freight_cost);
            monthlyDataByCurrency[currency][monthYear].count++;
        });

        const sortedLabels = Array.from(allMonths).sort((a, b) => {
            const [monthA, yearA] = a.split('/').map(Number);
            const [monthB, yearB] = b.split('/').map(Number);
            return (yearA - yearB) || (monthA - monthB);
        });

        const datasets = Object.keys(monthlyDataByCurrency).map(currency => {
            const data = sortedLabels.map(label => {
                const monthData = monthlyDataByCurrency[currency][label];
                return monthData ? monthData.sum / monthData.count : null; // null para dados ausentes
            });

            return {
                label: currency,
                data: data,
                borderColor: getCurrencyColor(currency),
                backgroundColor: `${getCurrencyColor(currency)}1A`, // Cor com transparência
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                spanGaps: true // Conecta linhas através de pontos nulos
            };
        });

        return { labels: sortedLabels, datasets };
    }
    
    function groupTariffsByModality(tariffs) {
        const modalityMap = new Map();
        
        tariffs.forEach(tariff => {
            const modalityName = tariff.modality_name;
            
            if (!modalityMap.has(modalityName)) {
                modalityMap.set(modalityName, 0);
            }
            
            modalityMap.set(modalityName, modalityMap.get(modalityName) + 1);
        });
        
        const labels = Array.from(modalityMap.keys());
        const counts = Array.from(modalityMap.values());
        
        return { labels, counts };
    }
    
    function getTopAgentsByTransitTime(tariffs, limit) {
        const agentTransitMap = new Map();
        
        // Filtrar tarifas com tempo de trânsito válido
        tariffs.filter(t => t.transit_time).forEach(tariff => {
            const agentName = tariff.agent_name;
            const transitTime = parseInt(tariff.transit_time);
            
            if (!agentTransitMap.has(agentName)) {
                agentTransitMap.set(agentName, {
                    sum: 0,
                    count: 0
                });
            }
            
            agentTransitMap.get(agentName).sum += transitTime;
            agentTransitMap.get(agentName).count += 1;
        });
        
        // Calcular médias e ordenar
        const agentTransitData = Array.from(agentTransitMap.entries())
            .map(([agent, data]) => ({
                agent,
                avgTransit: data.sum / data.count
            }))
            .sort((a, b) => a.avgTransit - b.avgTransit)
            .slice(0, limit);
        
        return {
            labels: agentTransitData.map(item => item.agent),
            values: agentTransitData.map(item => item.avgTransit)
        };
    }
    
    function getTopAgentCurrencyCombinationsByCost(tariffs, limit) {
        const agentCostMap = new Map();

        tariffs.filter(t => t.freight_cost && t.freight_currency).forEach(tariff => {
            const key = `${tariff.agent_name} (${tariff.freight_currency})`;
            const cost = parseFloat(tariff.freight_cost);

            if (!agentCostMap.has(key)) {
                agentCostMap.set(key, { sum: 0, count: 0, currency: tariff.freight_currency });
            }
            
            const data = agentCostMap.get(key);
            data.sum += cost;
            data.count += 1;
        });

        const agentCostData = Array.from(agentCostMap.entries())
            .map(([label, data]) => ({
                label,
                avgCost: data.sum / data.count,
                currency: data.currency
            }))
            .sort((a, b) => {
                // Não podemos comparar custos de moedas diferentes diretamente,
                // então ordenamos por custo, mas isso é apenas uma aproximação.
                // A visualização mostrará a moeda real.
                return a.avgCost - b.avgCost;
            })
            .slice(0, limit);

        return {
            labels: agentCostData.map(item => item.label),
            values: agentCostData.map(item => item.avgCost),
            colors: agentCostData.map(item => getCurrencyColor(item.currency))
        };
    }
    
    function prepareRoutesHeatmapData(tariffs) {
        // Extrair origens e destinos únicos
        const origins = [...new Set(tariffs.map(t => t.origin_name))].sort();
        const destinations = [...new Set(tariffs.map(t => t.destination_name))].sort();
        
        // Mapear custos e contagem por rota e moeda
        const routeMap = new Map();
        
        tariffs.forEach(tariff => {
            const routeKey = `${tariff.origin_name}-${tariff.destination_name}`;
            
            if (!routeMap.has(routeKey)) {
                routeMap.set(routeKey, {
                    tariffCount: 0,
                    costsByCurrency: {}
                });
            }
            
            const routeData = routeMap.get(routeKey);
            routeData.tariffCount++;

            if (tariff.freight_cost && tariff.freight_currency) {
                const currency = tariff.freight_currency;
                if (!routeData.costsByCurrency[currency]) {
                    routeData.costsByCurrency[currency] = { sum: 0, count: 0 };
                }
                routeData.costsByCurrency[currency].sum += parseFloat(tariff.freight_cost);
                routeData.costsByCurrency[currency].count++;
            }
        });

        // Preparar metadados para o tooltip
        const metadata = {};
        routeMap.forEach((data, key) => {
            metadata[key] = {};
            for (const currency in data.costsByCurrency) {
                const currencyData = data.costsByCurrency[currency];
                metadata[key][currency] = {
                    avg: currencyData.sum / currencyData.count,
                    count: currencyData.count
                };
            }
        });
        
        // Construir série de dados para ApexCharts (o valor Y será a contagem de tarifas)
        const series = origins.map(origin => {
            return {
                name: origin,
                data: destinations.map(destination => {
                    const routeKey = `${origin}-${destination}`;
                    const routeData = routeMap.get(routeKey);
                    
                    return {
                        x: destination,
                        y: routeData ? routeData.tariffCount : 0
                    };
                })
            };
        });
        
        return { origins, destinations, series, metadata };
    }
    
    function findBestOptionsByRouteAndCurrency(tariffs) {
        const routeMap = new Map();
        const now = new Date();
        
        // Filtrar tarifas ativas com custo
        const activeTariffs = tariffs.filter(t => new Date(t.validity_end_date) >= now && t.freight_cost && t.freight_currency);
        
        // Agrupar por rota E por moeda
        activeTariffs.forEach(tariff => {
            const routeKey = `${tariff.origin_id}-${tariff.destination_id}-${tariff.freight_currency}`;
            
            if (!routeMap.has(routeKey)) {
                routeMap.set(routeKey, []);
            }
            
            routeMap.get(routeKey).push(tariff);
        });
        
        // Encontrar a melhor opção para cada grupo (rota-moeda)
        const bestOptions = [];
        
        routeMap.forEach(routeTariffs => {
            // Ordenar por score dentro de cada grupo
            routeTariffs.sort((a, b) => {
                const scoreA = calculateOptionScore(a);
                const scoreB = calculateOptionScore(b);
                return scoreB - scoreA;
            });
            
            // Adicionar a melhor opção do grupo
            if (routeTariffs.length > 0) {
                bestOptions.push(routeTariffs[0]);
            }
        });
        
        return bestOptions.sort((a, b) => a.origin_name.localeCompare(b.origin_name));
    }
    
    function calculateOptionScore(tariff) {
        // Pontuação baseada em vários fatores (exemplo simplificado)
        let score = 5; // Base score
        
        // Fator custo (quanto menor, melhor)
        const cost = parseFloat(tariff.freight_cost);
        if (cost <= 1000) score += 3;
        else if (cost <= 2000) score += 2;
        else if (cost <= 3000) score += 1;
        
        // Fator tempo de trânsito (quanto menor, melhor)
        const transitTime = parseInt(tariff.transit_time) || 0;
        if (transitTime <= 10) score += 3;
        else if (transitTime <= 20) score += 2;
        else if (transitTime <= 30) score += 1;
        
        // Fator validade (quanto mais tempo restante, melhor)
        const validityEnd = new Date(tariff.validity_end_date);
        const daysRemaining = Math.ceil((validityEnd - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining >= 90) score += 2;
        else if (daysRemaining >= 30) score += 1;
        
        // Limitar score entre 0 e 10
        return Math.min(10, Math.max(0, score));
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    function showError(message) {
        alert(message);
    }
    
    // --- Iniciar ---
    initializePage();
}); 