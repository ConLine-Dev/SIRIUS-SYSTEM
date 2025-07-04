document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/freight-tariffs';
    
    // Estado da aplicação
    let formData = {};
    let currentTariffs = [];
    let favorites = JSON.parse(localStorage.getItem('commercial-favorites') || '[]');
    let currentFilters = {};
    let searchHistory = JSON.parse(localStorage.getItem('search-history') || '[]');
    let isFilterProcessing = false; // Flag para evitar execuções simultâneas
    let isSearchProcessing = false; // Flag para evitar buscas simultâneas

    // --- Funções de Inicialização ---
    async function initializePage() {
        try {
            console.log('Iniciando carregamento da página...');
            
            // Limpar qualquer estado anterior
            clearPreviousState();
            
            await loadFormData();
            initializeSearchableSelects();
            loadFavorites();
            setupEventListeners();
            initializeRecommendations();
            await updateMarketMetrics([]); // Carregar métricas iniciais (estado vazio)
            // setupScrollToTop();
            
            // Configurar tema e watchers
            setupThemeWatcher();
            
            // Animar elementos na entrada
            animatePageElements();
            
            console.log('Página inicializada com sucesso!');
        } catch (error) {
            console.error('Erro ao inicializar página:', error);
        }
    }

    function clearPreviousState() {
        // Limpar elementos duplicados ou estados anteriores
        const spinner = document.getElementById('loading-spinner');
        const results = document.getElementById('tariffs-results');
        
        if (spinner) {
            spinner.classList.add('d-none');
            spinner.style.display = 'none';
        }
        
        if (results) {
            results.style.display = 'block';
        }
        
        // Limpar Select2 existente se presente
        try {
            if ($('#search-origin').hasClass('select2-hidden-accessible')) {
                console.log('Destruindo Select2 existente...');
                $('#search-origin, #search-destination, #search-modality').select2('destroy');
            }
        } catch (error) {
            console.log('Erro ao destruir Select2 existente (pode ser normal):', error);
        }
        
        // Limpar resultados anteriores se existirem
        currentTariffs = [];
        updateMetrics([]);
        
        console.log('Estado anterior limpo');
    }

    function setupThemeWatcher() {
        let lastTheme = document.documentElement.getAttribute('data-theme-mode');
        
        // Observar mudanças no atributo data-theme-mode do HTML
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme-mode') {
                    const currentTheme = document.documentElement.getAttribute('data-theme-mode');
                    
                    // Só reinicializar se o tema realmente mudou
                    if (currentTheme !== lastTheme) {
                        console.log(`Tema mudou de ${lastTheme} para ${currentTheme}, reinicializando Select2...`);
                        lastTheme = currentTheme;
                        
                        // Reinicializar select2 para aplicar tema correto
                        setTimeout(() => {
                            if ($('#search-origin').hasClass('select2-hidden-accessible')) {
                                $('#search-origin, #search-destination, #search-modality').select2('destroy').select2({
                                    theme: 'bootstrap-5',
                                    width: '100%',
                                    placeholder: 'Selecione...',
                                    allowClear: true
                                });
                                console.log('Select2 reinicializado para novo tema');
                            }
                        }, 100);
                    }
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme-mode']
        });
    }

    function animatePageElements() {
        const cards = document.querySelectorAll('.insight-card, .metric-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }

    async function loadFormData() {
        try {
            const data = await makeRequest(`${API_URL}/meta/form-data`);
            formData = data;
            populateSearchSelects();
        } catch (error) {
            console.error('Erro ao carregar dados do formulário:', error);
            showToast('Erro ao carregar dados de suporte', 'error');
        }
    }

    function populateSearchSelects() {
        const createOption = (item) => `<option value="${item.id}">${item.name}</option>`;
        const initialOption = '<option value="">Selecione...</option>';
        
        $('#search-origin').html(initialOption + formData.locations.filter(l => l.type !== 'Destino').map(createOption).join(''));
        $('#search-destination').html(initialOption + formData.locations.filter(l => l.type !== 'Origem').map(createOption).join(''));
        $('#search-modality').html('<option value="">Todos os modais</option>' + formData.modalities.map(createOption).join(''));
    }

    function initializeSearchableSelects() {
        // Verificar se já foi inicializado
        if ($('#search-origin').hasClass('select2-hidden-accessible')) {
            console.log('Select2 já inicializado, ignorando...');
            return;
        }
        
        const select2Options = {
            theme: 'bootstrap-5',
            width: '100%',
            placeholder: 'Selecione...',
            allowClear: true
        };
        
        $('#search-origin, #search-destination, #search-modality').select2(select2Options);

        // Foco automático no campo de busca
        $('#search-origin, #search-destination, #search-modality').on('select2:open', () => {
            setTimeout(() => {
                const searchField = document.querySelector('.select2-container--open .select2-search__field');
                if (searchField) searchField.focus();
            }, 10);
        });
        
        console.log('Select2 inicializado com sucesso');
    }

    // --- Funcionalidades de Favoritos ---
    function loadFavorites() {
        const container = document.getElementById('favorites-container');
        
        if (favorites.length === 0) {
            container.innerHTML = '<p class="text-muted mb-0">Salve suas consultas mais frequentes para acesso rápido</p>';
            return;
        }

        const favoritesHtml = favorites.map(favorite => `
            <div class="favorite-chip" data-favorite-id="${favorite.id}">
                <i class="ri-heart-fill me-1"></i>
                ${favorite.name}
                <span class="remove-favorite" data-id="${favorite.id}" title="Remover favorito">
                    <i class="ri-close-line"></i>
                </span>
            </div>
        `).join('');

        container.innerHTML = `<div class="favorites-grid">${favoritesHtml}</div>`;
    }

    function saveFavorite(name, filters) {
        const favorite = {
            id: Date.now(),
            name: name,
            filters: filters,
            createdAt: new Date().toISOString()
        };

        favorites.push(favorite);
        localStorage.setItem('commercial-favorites', JSON.stringify(favorites));
        loadFavorites();
        showToast('Favorito salvo com sucesso!', 'success');
    }

    function removeFavorite(id) {
        favorites = favorites.filter(f => f.id !== parseInt(id));
        localStorage.setItem('commercial-favorites', JSON.stringify(favorites));
        loadFavorites();
        showToast('Favorito removido', 'info');
    }

    function applyFavorite(favoriteId) {
        const favorite = favorites.find(f => f.id === parseInt(favoriteId));
        if (!favorite) return;

        // Aplicar filtros do favorito
        $('#search-origin').val(favorite.filters.origin || '').trigger('change');
        $('#search-destination').val(favorite.filters.destination || '').trigger('change');
        $('#search-modality').val(favorite.filters.modality || '').trigger('change');

        // Executar busca automaticamente
        setTimeout(() => {
            performSearch();
        }, 300);

        showToast(`Filtros aplicados: ${favorite.name}`, 'info');
    }

    // --- Funcionalidades de Busca ---
    async function performSearch() {
        if (isSearchProcessing) {
            console.log('Busca já está sendo processada, ignorando...');
            return;
        }
        
        isSearchProcessing = true;
        
        const form = document.getElementById('search-form');
        const formDataObj = new FormData(form);
        const filters = Object.fromEntries(formDataObj.entries());
        
        // Filtrar apenas tarifas ativas (não expiradas)
        filters.status = 'Ativa,Expira Breve';
        
        currentFilters = filters;
        
        showLoading(true);
        updateFilterSummary(filters);
        
        try {
            const query = new URLSearchParams(filters).toString();
            const tariffs = await makeRequest(`${API_URL}/tariffs/commercial?${query}`);
            
            // As tarifas já vêm filtradas da API (apenas ativas)
            currentTariffs = tariffs;
            
            renderTariffs(currentTariffs);
            updateMetrics(currentTariffs);
            generateInsights(currentTariffs);
            saveToSearchHistory(filters);
            
        } catch (error) {
            console.error('Erro ao buscar tarifas:', error);
            showToast('Erro ao buscar tarifas', 'error');
            renderEmptyState('Erro ao carregar tarifas. Tente novamente.');
        } finally {
            showLoading(false);
            isSearchProcessing = false;
        }
    }

    async function renderTariffs(tariffs) {
        const container = document.getElementById('tariffs-results');
        
        if (tariffs.length === 0) {
            renderEmptyState('Nenhuma tarifa encontrada para os filtros selecionados.');
            return;
        }

        // Obter cotações de moedas
        const exchangeRates = await getExchangeRates();
        
        // Converter preços para USD para comparação justa
        const pricesInUSD = await convertPricesToUSD(tariffs, exchangeRates);
        const bestPriceUSD = Math.min(...pricesInUSD);

        const tariffsWithUSD = tariffs.map((tariff, index) => ({
            ...tariff,
            priceUSD: pricesInUSD[index]
        }));

        // Ordenar por preço em USD
        const sortedTariffs = tariffsWithUSD.sort((a, b) => a.priceUSD - b.priceUSD);
        
        // Atualizar currentTariffs com as tarifas renderizadas
        currentTariffs = sortedTariffs;

        const tariffsHtml = await Promise.all(sortedTariffs.map(async (tariff, index) => {
            const isBestDeal = Math.abs(tariff.priceUSD - bestPriceUSD) < 1; // Tolerância para comparação
            const savings = tariff.priceUSD > bestPriceUSD ? 
                Math.round(((tariff.priceUSD - bestPriceUSD) / bestPriceUSD) * 100) : 0;
            
            return await createTariffCard(tariff, isBestDeal, savings, exchangeRates);
        }));

        container.innerHTML = `
            <div class="row">
                ${tariffsHtml.map(card => `<div class="col-lg-4 col-md-6 mb-3">${card}</div>`).join('')}
            </div>
        `;
        
        // Gerar insights e métricas
        await generateInsights(sortedTariffs);
        await updateMetrics(sortedTariffs);
        await updateMarketMetrics(sortedTariffs);
        
        // Animar entrada dos cards
        const cards = container.querySelectorAll('.tariff-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }

    // Função para re-renderizar tarifas sem fazer nova busca (para filtros rápidos)
    async function reRenderTariffs(tariffs) {
        const container = document.getElementById('tariffs-results');
        
        if (tariffs.length === 0) {
            renderEmptyState('Nenhuma tarifa encontrada para o filtro aplicado.');
            return;
        }

        // Obter cotações de moedas
        const exchangeRates = await getExchangeRates();
        
        // Converter preços para USD para identificar melhor preço
        const pricesInUSD = await convertPricesToUSD(tariffs, exchangeRates);
        const bestPriceUSD = Math.min(...pricesInUSD);

        // Não reordenar aqui - manter a ordem que veio dos filtros
        const tariffsHtml = await Promise.all(tariffs.map(async (tariff, index) => {
            const tariffPriceUSD = pricesInUSD[index];
            const isBestDeal = Math.abs(tariffPriceUSD - bestPriceUSD) < 1;
            const savings = tariffPriceUSD > bestPriceUSD ? 
                Math.round(((tariffPriceUSD - bestPriceUSD) / bestPriceUSD) * 100) : 0;
            
            // Determinar tag do filtro baseado na posição (primeiro recebe a tag principal)
            let filterTag = null;
            if (tariff._filterTag) {
                filterTag = tariff._filterTag;
                console.log(`Card ${index}: aplicando filterTag =`, filterTag);
            }
            
            return await createTariffCard(tariff, isBestDeal, savings, exchangeRates, filterTag);
        }));

        container.innerHTML = `
            <div class="row">
                ${tariffsHtml.map(card => `<div class="col-lg-4 col-md-6 mb-3">${card}</div>`).join('')}
            </div>
        `;
        
        // Atualizar métricas com as tarifas filtradas
        await updateMetrics(tariffs);
        await updateMarketMetrics(tariffs);
        
        // Animar entrada dos cards
        const cards = container.querySelectorAll('.tariff-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 50); // Animação mais rápida para re-render
        });
    }

    async function createTariffCard(tariff, isBestDeal, savings, exchangeRates = null, filterTag = null) {
        // Formatação de valores - mais limpa
        const price = parseFloat(tariff.freight_cost);
        const priceFormatted = price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        
        // Conversão para USD se necessário
        let priceUSD = '';
        if (exchangeRates && tariff.freight_currency !== 'USD') {
            const rate = exchangeRates[tariff.freight_currency];
            if (rate) {
                const usdValue = price / rate;
                priceUSD = `≈ $${usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
            }
        }
        
        // Sistema de badges com prioridade
        let badges = [];
        
        // 1. Badge do filtro aplicado (máxima prioridade)
        if (filterTag) {
            console.log(`createTariffCard: recebeu filterTag =`, filterTag);
            badges.push(filterTag);
        }
        
        // 2. Badge de melhor preço (se não conflitar com filtro)
        if (isBestDeal && (!filterTag || !filterTag.includes('MELHOR PREÇO'))) {
            badges.push('<span class="badge bg-success">MELHOR PREÇO</span>');
        }
        
        // 3. Badge de recomendado (menor prioridade)
        if (tariff.is_recommended && !filterTag) {
            badges.push('<span class="badge bg-primary">RECOMENDADO</span>');
        }
        
        // Montar badges (máximo 2 para não poluir)
        let topBadge = badges.slice(0, 2).join(' ');
        
        // DEBUG: Mostrar o que foi gerado
        if (filterTag) {
            console.log(`topBadge gerado:`, topBadge);
        }
        
        // Sobretaxas - valores reais com moedas originais
        let surchargesInfo = '';
        if (tariff.surcharges && tariff.surcharges.length > 0) {
            // Mostrar as 2 principais sobretaxas com valores reais
            const mainSurcharges = tariff.surcharges.slice(0, 2).map(s => {
                const value = parseFloat(s.cost || s.value || 0);
                const formattedValue = value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                return `${s.name || s.description}: ${formattedValue} ${s.currency}`;
            }).join(', ');

            const moreCount = tariff.surcharges.length > 2 ? ` +${tariff.surcharges.length - 2}` : '';

            surchargesInfo = `
                <div class="surcharges-section">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <small class="text-warning-emphasis">
                            <i class="ri-add-circle-line me-1"></i>Sobretaxas (${tariff.surcharges.length})
                        </small>
                        ${moreCount ? `<small class="text-muted">${moreCount} mais</small>` : ''}
                    </div>
                    <div class="text-truncate">
                        <small class="text-muted">${mainSurcharges}</small>
                    </div>
                </div>
            `;
        }
        
        const cardHTML = `
            <div class="card tariff-card ${tariff.is_recommended ? 'card-recommended' : ''}" data-tariff-id="${tariff.id}">
                ${topBadge ? `<div class="card-top-badges">${topBadge}</div>` : ''}
                
                <div class="card-body">
                    <!-- Rota -->
                    <div class="route-header">
                        <div class="route-cities">
                            <span class="city-origin">${tariff.origin_name.split(',')[0]}</span>
                            <i class="ri-arrow-right-line mx-2 text-muted"></i>
                            <span class="city-destination">${tariff.destination_name.split(',')[0]}</span>
                        </div>
                        <div class="route-details">
                            <span class="badge">${tariff.modality_name}</span>
                            ${tariff.service_type ? `<span class="badge">${tariff.service_type}</span>` : ''}
                        </div>
                    </div>

                    <!-- Preço -->
                    <div class="price-highlight">
                        <div class="price-currency-line">
                            <span class="price-amount">${priceFormatted}</span>
                            <span class="currency-tag">${tariff.freight_currency}</span>
                        </div>
                        ${priceUSD ? `<div class="price-usd">${priceUSD}</div>` : ''}
                    </div>

                    ${surchargesInfo}

                    <!-- Informações -->
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Agente</div>
                            <div class="info-value" title="${tariff.agent_name || 'N/A'}">
                                ${tariff.agent_name ? 
                                    (tariff.agent_name.length > 18 ? 
                                        tariff.agent_name.substring(0, 15) + '...' : 
                                        tariff.agent_name) : 'N/A'}
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Armador</div>
                            <div class="info-value" title="${tariff.shipowner_name || 'N/A'}">
                                ${tariff.shipowner_name ? 
                                    (tariff.shipowner_name.length > 18 ? 
                                        tariff.shipowner_name.substring(0, 15) + '...' : 
                                        tariff.shipowner_name) : 'N/A'}
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Trânsito</div>
                            <div class="info-value">${tariff.transit_time || 'Consultar'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Validade</div>
                            <div class="info-value">
                                <span class="status-dot ${(tariff.status === 'Ativa' || tariff.is_active === 1 || tariff.is_active === true) ? 'bg-success' : 'bg-danger'}"></span>
                                ${tariff.validity_end_date ? 
                                    new Date(tariff.validity_end_date).toLocaleDateString('pt-BR') : 
                                    'Não informado'}
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Container</div>
                            <div class="info-value" title="${tariff.container_type_name || 'Standard'}">
                                ${(tariff.container_type_name || 'Standard').length > 15 ? 
                                    (tariff.container_type_name || 'Standard').substring(0, 12) + '...' : 
                                    (tariff.container_type_name || 'Standard')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ação -->
                <div class="card-footer">
                    <button class="btn btn-primary w-100" onclick="showTariffDetails(${tariff.id})">
                        <i class="ri-eye-line me-1"></i>Ver Detalhes
                    </button>
                </div>
            </div>
        `;
        
        // DEBUG: Mostrar HTML final se tiver filterTag
        if (filterTag) {
            console.log(`HTML final gerado:`, cardHTML.substring(0, 200) + '...');
        }
        
        return cardHTML;
    }

    // Função de rating removida temporariamente

    function renderEmptyState(message) {
        const container = document.getElementById('tariffs-results');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="ri-search-line fs-1"></i>
                </div>
                <h5>${message}</h5>
                <p>Tente ajustar os filtros ou remover algumas restrições</p>
            </div>
        `;
    }

    // --- Funcionalidades de Insights ---
    // Buscar análise de mercado real do backend
    async function getMarketAnalysis() {
        try {
            const response = await fetch('/api/freight-tariffs/market-analysis');
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.analysis : null;
            }
        } catch (error) {
            console.warn('Erro ao buscar análise de mercado:', error);
        }
        return null;
    }

    // Gerar insights baseados na análise de mercado real
    async function generateMarketInsights(insights) {
        const marketData = await getMarketAnalysis();
        if (!marketData) return;

        // Insight de variação de preços do mercado
        const { priceVariation, availability, trend } = marketData;
        
        if (priceVariation) {
            let variationText = '';
            let variationColor = 'info';
            
            if (priceVariation.trend === 'increase') {
                variationText = `Preços do mercado subiram ${Math.abs(priceVariation.percentage)}% nos últimos 30 dias.`;
                variationColor = 'warning';
            } else if (priceVariation.trend === 'decrease') {
                variationText = `Preços do mercado caíram ${Math.abs(priceVariation.percentage)}% nos últimos 30 dias. Boa oportunidade!`;
                variationColor = 'success';
            } else {
                variationText = 'Preços do mercado estão estáveis nos últimos 30 dias.';
                variationColor = 'info';
            }

            insights.push({
                icon: 'ri-line-chart-line',
                title: 'Tendência de Mercado',
                text: variationText,
                color: variationColor
            });
        }

        // Insight de disponibilidade
        if (availability) {
            let availabilityText = '';
            let availabilityColor = 'info';
            
            if (availability.status === 'Alta') {
                availabilityText = `${availability.percentage}% das tarifas estão ativas. Excelente disponibilidade no mercado.`;
                availabilityColor = 'success';
            } else if (availability.status === 'Moderada') {
                availabilityText = `${availability.percentage}% das tarifas estão ativas. Disponibilidade moderada - planeje com antecedência.`;
                availabilityColor = 'warning';
            } else {
                availabilityText = `Apenas ${availability.percentage}% das tarifas estão ativas. Mercado com baixa disponibilidade.`;
                availabilityColor = 'danger';
            }

            insights.push({
                icon: 'ri-pie-chart-line',
                title: 'Disponibilidade',
                text: availabilityText,
                color: availabilityColor
            });
        }

        // Insight de tendência
        if (trend) {
            let trendText = '';
            let trendColor = 'info';
            
            if (trend.status === 'Crescimento') {
                trendText = `Mercado em crescimento: ${trend.recentTariffs} novas tarifas vs ${trend.previousTariffs} no período anterior.`;
                trendColor = 'success';
            } else if (trend.status === 'Declínio') {
                trendText = `Mercado em declínio: ${trend.recentTariffs} novas tarifas vs ${trend.previousTariffs} no período anterior.`;
                trendColor = 'warning';
            } else {
                trendText = `Mercado estável com ${trend.recentTariffs} novas tarifas no último mês.`;
                trendColor = 'info';
            }

            insights.push({
                icon: 'ri-trending-up-line',
                title: 'Atividade do Mercado',
                text: trendText,
                color: trendColor
            });
        }
    }

    async function generateInsights(tariffs) {
        const insightsContainer = document.getElementById('insights-container');
        const insights = [];

        if (tariffs.length === 0) {
            insightsContainer.innerHTML = '<p class="text-muted small mb-0">Realize uma busca para ver insights</p>';
            return;
        }

        // Primeiro, buscar análise de mercado real
        await generateMarketInsights(insights);

        // Obter cotações de moedas para análise
        const exchangeRates = await getExchangeRates();
        
        // Análise de preços dos resultados atuais com conversão para USD
        const pricesInUSD = await convertPricesToUSD(tariffs, exchangeRates);
        const avgPriceUSD = pricesInUSD.reduce((a, b) => a + b, 0) / pricesInUSD.length;
        const minPriceUSD = Math.min(...pricesInUSD);
        const maxPriceUSD = Math.max(...pricesInUSD);
        const priceVariation = ((maxPriceUSD - minPriceUSD) / minPriceUSD * 100).toFixed(1);

        // Determinar se é uma boa variação de preços dos resultados
        let priceAnalysis = '';
        if (priceVariation < 10) {
            priceAnalysis = 'Preços consistentes entre os resultados.';
        } else if (priceVariation < 25) {
            priceAnalysis = 'Variação moderada - há oportunidades de negociação.';
        } else {
            priceAnalysis = 'Grande variação - considere negociar melhores condições.';
        }

        insights.push({
            icon: 'ri-money-dollar-circle-line',
            title: 'Análise dos Resultados',
            text: `Variação de ${priceVariation}% entre as tarifas encontradas. ${priceAnalysis}`,
            color: priceVariation > 25 ? 'warning' : priceVariation > 10 ? 'info' : 'success'
        });

        // Análise inteligente de disponibilidade
        const availabilityAnalysis = analyzeMarketAvailability(tariffs);
        insights.push({
            icon: 'ri-pie-chart-line',
            title: 'Disponibilidade do Mercado',
            text: availabilityAnalysis.text,
            color: availabilityAnalysis.color
        });

        // Análise de competitividade no mercado (agentes e armadores)
        const competitionAnalysis = analyzeAgentCompetition(tariffs, pricesInUSD);
        insights.push({
            icon: 'ri-team-line',
            title: 'Competição no Mercado',
            text: competitionAnalysis.text,
            color: competitionAnalysis.color
        });

        // Análise de tempo de trânsito
        const transitAnalysis = analyzeTransitTimes(tariffs);
        if (transitAnalysis) {
            insights.push({
                icon: 'ri-time-line',
                title: 'Tempo de Trânsito',
                text: transitAnalysis.text,
                color: transitAnalysis.color
            });
        }

        // Análise de estabilidade do mercado (baseada nos resultados atuais)
        const stabilityAnalysis = analyzeMarketStability(tariffs, pricesInUSD);
        insights.push({
            icon: 'ri-pulse-line',
            title: 'Estabilidade do Mercado',
            text: stabilityAnalysis.text,
            color: stabilityAnalysis.color
        });

        // Análise de moedas com volatilidade
        const currencyAnalysis = analyzeCurrencyRisk(tariffs, exchangeRates);
        if (currencyAnalysis) {
            insights.push({
                icon: 'ri-exchange-line',
                title: 'Risco Cambial',
                text: currencyAnalysis.text,
                color: currencyAnalysis.color
            });
        }

        const insightsHtml = insights.map(insight => `
            <div class="insight-item ${insight.color || 'primary'}">
                <div class="insight-icon">
                    <i class="${insight.icon} text-white"></i>
                </div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <p class="insight-text">${insight.text}</p>
                </div>
            </div>
        `).join('');

        insightsContainer.innerHTML = insightsHtml;
    }

    // Função para obter cotações de moedas
    async function getExchangeRates() {
        try {
            // Usando API gratuita do ExchangeRate-API
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            return data.rates;
        } catch (error) {
            console.warn('Erro ao obter cotações:', error);
            // Cotações fallback (valores aproximados)
            return {
                USD: 1,
                EUR: 0.85,
                BRL: 5.20,
                GBP: 0.73,
                JPY: 110,
                CNY: 6.45,
                CAD: 1.25,
                AUD: 1.35
            };
        }
    }

    // Converter preços para USD para comparação
    async function convertPricesToUSD(tariffs, exchangeRates) {
        return tariffs.map(tariff => {
            const price = parseFloat(tariff.freight_cost);
            const currency = tariff.freight_currency;
            
            if (currency === 'USD') return price;
            
            const rate = exchangeRates[currency];
            return rate ? price / rate : price; // Se não tiver taxa, assume USD
        });
    }

    // Análise inteligente de disponibilidade do mercado
    function analyzeMarketAvailability(tariffs) {
        const totalResults = tariffs.length;
        const uniqueAgents = new Set(tariffs.map(t => t.agent_name)).size;
        const uniqueRoutes = new Set(tariffs.map(t => `${t.origin_name}-${t.destination_name}`)).size;
        
        let availabilityLevel = '';
        let availabilityColor = '';
        let availabilityText = '';
        
        if (totalResults >= 10) {
            availabilityLevel = 'Excelente';
            availabilityColor = 'success';
            availabilityText = `Mercado muito ativo com ${totalResults} opções de ${uniqueAgents} agentes. Excelente poder de negociação.`;
        } else if (totalResults >= 5) {
            availabilityLevel = 'Boa';
            availabilityColor = 'info';
            availabilityText = `Boa disponibilidade com ${totalResults} opções de ${uniqueAgents} agentes. Boas chances de negociação.`;
        } else if (totalResults >= 2) {
            availabilityLevel = 'Limitada';
            availabilityColor = 'warning';
            availabilityText = `Disponibilidade limitada com apenas ${totalResults} opções. Considere ampliar critérios de busca.`;
        } else {
            availabilityLevel = 'Escassa';
            availabilityColor = 'danger';
            availabilityText = `Mercado com baixa disponibilidade (${totalResults} opção). Recomendamos buscar rotas alternativas.`;
        }
        
        return { text: availabilityText, color: availabilityColor };
    }

    // Análise de competição entre agentes e armadores
    function analyzeAgentCompetition(tariffs, pricesInUSD) {
        const agentPrices = {};
        const shipownerPrices = {};
        
        // Agrupar preços por agente e armador
        tariffs.forEach((tariff, index) => {
            const agent = tariff.agent_name;
            const shipowner = tariff.shipowner_name || 'Não informado';
            
            if (!agentPrices[agent]) {
                agentPrices[agent] = [];
            }
            agentPrices[agent].push(pricesInUSD[index]);
            
            if (!shipownerPrices[shipowner]) {
                shipownerPrices[shipowner] = [];
            }
            shipownerPrices[shipowner].push(pricesInUSD[index]);
        });
        
        const agents = Object.keys(agentPrices);
        const shipowners = Object.keys(shipownerPrices).filter(s => s !== 'Não informado');
        const agentCount = agents.length;
        const shipownerCount = shipowners.length;
        
        // Análise combinada de agentes e armadores
        let competitionText = '';
        let competitionColor = '';
        
        if (agentCount === 1 && shipownerCount <= 1) {
            competitionText = `Mercado concentrado: 1 agente${shipownerCount === 1 ? ' e 1 armador' : ''}. Limitada competição de preços.`;
            competitionColor = 'warning';
        } else {
            // Calcular variação de preços entre agentes
            const agentAvgPrices = agents.map(agent => {
                const prices = agentPrices[agent];
                return prices.reduce((a, b) => a + b, 0) / prices.length;
            });
            
            const minAvgPrice = Math.min(...agentAvgPrices);
            const maxAvgPrice = Math.max(...agentAvgPrices);
            const priceVariation = ((maxAvgPrice - minAvgPrice) / minAvgPrice * 100).toFixed(1);
            
            if (priceVariation > 20) {
                competitionText = `Alta competição: ${agentCount} agentes${shipownerCount > 0 ? ` e ${shipownerCount} armadores` : ''} com ${priceVariation}% de variação. Ótimo para negociação.`;
                competitionColor = 'success';
            } else if (priceVariation > 10) {
                competitionText = `Competição moderada: ${agentCount} agentes${shipownerCount > 0 ? ` e ${shipownerCount} armadores` : ''} (${priceVariation}% variação). Margem para negociação.`;
                competitionColor = 'info';
            } else {
                competitionText = `Preços estáveis: ${agentCount} agentes${shipownerCount > 0 ? ` e ${shipownerCount} armadores` : ''} (${priceVariation}% variação). Mercado estabelecido.`;
                competitionColor = 'warning';
            }
        }
        
        return { text: competitionText, color: competitionColor };
    }

    // Analisar market share dos agentes e armadores
    function analyzeAgentMarketShare(tariffs, pricesInUSD) {
        const agentStats = {};
        const shipownerStats = {};
        
        tariffs.forEach((tariff, index) => {
            const agent = tariff.agent_name;
            const shipowner = tariff.shipowner_name || 'Não informado';
            
            // Estatísticas dos agentes
            if (!agentStats[agent]) {
                agentStats[agent] = {
                    name: agent,
                    type: 'agente',
                    count: 0,
                    totalPrice: 0,
                    minPrice: Infinity,
                    maxPrice: 0
                };
            }
            
            agentStats[agent].count++;
            agentStats[agent].totalPrice += pricesInUSD[index];
            agentStats[agent].minPrice = Math.min(agentStats[agent].minPrice, pricesInUSD[index]);
            agentStats[agent].maxPrice = Math.max(agentStats[agent].maxPrice, pricesInUSD[index]);
            
            // Estatísticas dos armadores (se informado)
            if (shipowner !== 'Não informado') {
                if (!shipownerStats[shipowner]) {
                    shipownerStats[shipowner] = {
                        name: shipowner,
                        type: 'armador',
                        count: 0,
                        totalPrice: 0,
                        minPrice: Infinity,
                        maxPrice: 0
                    };
                }
                
                shipownerStats[shipowner].count++;
                shipownerStats[shipowner].totalPrice += pricesInUSD[index];
                shipownerStats[shipowner].minPrice = Math.min(shipownerStats[shipowner].minPrice, pricesInUSD[index]);
                shipownerStats[shipowner].maxPrice = Math.max(shipownerStats[shipowner].maxPrice, pricesInUSD[index]);
            }
        });

        // Calcular score de recomendação para agentes e armadores
        const agents = Object.values(agentStats).map(agent => ({
            ...agent,
            avgPrice: agent.totalPrice / agent.count,
            score: agent.count * 0.3 + (1 / (agent.totalPrice / agent.count)) * 0.7
        }));
        
        const shipowners = Object.values(shipownerStats).map(shipowner => ({
            ...shipowner,
            avgPrice: shipowner.totalPrice / shipowner.count,
            score: shipowner.count * 0.3 + (1 / (shipowner.totalPrice / shipowner.count)) * 0.7
        }));

        const allProviders = [...agents, ...shipowners];
        const recommended = allProviders.reduce((best, current) => 
            current.score > best.score ? current : best
        );

        return { 
            recommended, 
            agents, 
            shipowners,
            all: allProviders 
        };
    }

    // Análise de estabilidade do mercado
    function analyzeMarketStability(tariffs, pricesInUSD) {
        const uniqueAgents = new Set(tariffs.map(t => t.agent_name)).size;
        const uniqueModalities = new Set(tariffs.map(t => t.modality_name)).size;
        const transitTimes = tariffs.map(t => extractTransitDays(t.transit_time)).filter(t => t < 999);
        
        // Análise de variação de preços (coeficiente de variação)
        const avgPrice = pricesInUSD.reduce((a, b) => a + b, 0) / pricesInUSD.length;
        const variance = pricesInUSD.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / pricesInUSD.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = (stdDev / avgPrice) * 100;
        
        // Análise de variação de tempos de trânsito
        const avgTransit = transitTimes.length > 0 ? transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length : 0;
        const transitVariance = transitTimes.length > 0 ? 
            transitTimes.reduce((sum, time) => sum + Math.pow(time - avgTransit, 2), 0) / transitTimes.length : 0;
        const transitStdDev = Math.sqrt(transitVariance);
        const transitCoefficient = avgTransit > 0 ? (transitStdDev / avgTransit) * 100 : 0;
        
        let stabilityText = '';
        let stabilityColor = '';
        
        // Critérios de estabilidade baseados em dados reais
        if (coefficientOfVariation < 15 && transitCoefficient < 20 && uniqueAgents >= 2) {
            stabilityText = `Mercado estável: preços consistentes (±${coefficientOfVariation.toFixed(1)}%), ${uniqueAgents} agentes ativos. Condições favoráveis para planejamento.`;
            stabilityColor = 'success';
        } else if (coefficientOfVariation < 30 && uniqueAgents >= 2) {
            stabilityText = `Mercado em equilíbrio: alguma variação de preços (±${coefficientOfVariation.toFixed(1)}%), mas com ${uniqueAgents} agentes competindo.`;
            stabilityColor = 'info';
        } else if (coefficientOfVariation >= 30 || uniqueAgents === 1) {
            stabilityText = `Mercado volátil: ${coefficientOfVariation >= 30 ? `alta variação de preços (±${coefficientOfVariation.toFixed(1)}%)` : 'monopolizado por 1 agente'}. Atenção às condições de contratação.`;
            stabilityColor = 'warning';
        } else {
            stabilityText = `Mercado instável: condições desfavoráveis para planejamento. Considere ampliar critérios de busca.`;
            stabilityColor = 'danger';
        }
        
        return { text: stabilityText, color: stabilityColor };
    }

    // Analisar tempos de trânsito
    function analyzeTransitTimes(tariffs) {
        const transitTimes = tariffs.map(t => {
            if (!t.transit_time) return null;
            const match = t.transit_time.match(/(\d+)/);
            return match ? parseInt(match[0]) : null;
        }).filter(t => t !== null);

        if (transitTimes.length === 0) return null;

        const avgTransit = Math.round(transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length);
        const minTransit = Math.min(...transitTimes);
        const maxTransit = Math.max(...transitTimes);

        let analysis = '';
        let color = 'info';

        if (avgTransit <= 7) {
            analysis = `Tempo médio excelente de ${avgTransit} dias. Ideal para cargas urgentes.`;
            color = 'success';
        } else if (avgTransit <= 15) {
            analysis = `Tempo médio de ${avgTransit} dias. Bom equilíbrio entre velocidade e custo.`;
            color = 'info';
        } else {
            analysis = `Tempo médio de ${avgTransit} dias. Considere se a velocidade é prioridade.`;
            color = 'warning';
        }

        return { text: analysis, color };
    }

    // Analisar risco cambial
    function analyzeCurrencyRisk(tariffs, exchangeRates) {
        const currencies = [...new Set(tariffs.map(t => t.freight_currency))];
        
        if (currencies.length <= 1) return null;

        // Moedas consideradas mais voláteis
        const volatileCurrencies = ['BRL', 'ARS', 'TRY', 'ZAR', 'MXN'];
        const hasVolatileCurrency = currencies.some(c => volatileCurrencies.includes(c));

        let analysis = '';
        let color = 'info';

        if (hasVolatileCurrency) {
            analysis = `Encontradas ${currencies.length} moedas, incluindo algumas voláteis (${currencies.join(', ')}). Monitore variações cambiais.`;
            color = 'warning';
        } else {
            analysis = `Tarifas em ${currencies.length} moedas estáveis (${currencies.join(', ')}). Risco cambial baixo.`;
            color = 'success';
        }

        return { text: analysis, color };
    }

    async function initializeRecommendations() {
        const container = document.getElementById('recommendations-container');
        
        try {
            // Buscar dados de rotas populares do backend
            const response = await fetch('/api/freight-tariffs/popular-routes');
            let recommendations = [];
            
            if (response.ok) {
                const data = await response.json();
                recommendations = data.routes || [];
            }
            
            // Se não tiver dados do backend, usar recomendações baseadas em análise de mercado
            if (recommendations.length === 0) {
                recommendations = await generateSmartRecommendations();
            }

            const recommendationsHtml = recommendations.map(rec => `
                <div class="recommendation-item" data-filters='${JSON.stringify(rec.filters)}'>
                    <div class="recommendation-header">
                        <div class="recommendation-route">${rec.route}</div>
                        <div class="recommendation-badge ${rec.badgeClass || 'popular'}">${rec.reason}</div>
                    </div>
                    <div class="recommendation-details">
                        <span>${rec.details}</span>
                        <span><i class="ri-arrow-right-line"></i></span>
                    </div>
                </div>
            `).join('');

            container.innerHTML = recommendationsHtml;
        } catch (error) {
            console.error('Erro ao carregar recomendações:', error);
            container.innerHTML = '<p class="text-muted small">Erro ao carregar recomendações</p>';
        }
    }

    // Gerar recomendações inteligentes baseadas em dados históricos
    async function generateSmartRecommendations() {
        try {
            // Buscar dados de todas as tarifas para análise
            const response = await fetch('/api/freight-tariffs/tariffs/commercial');
            const data = await response.json();
            
            if (!data.success || !data.data.length) {
                return getDefaultRecommendations();
            }

            const tariffs = data.data;
            const exchangeRates = await getExchangeRates();
            const pricesInUSD = await convertPricesToUSD(tariffs, exchangeRates);
            
            // Analisar rotas por popularidade, economia e velocidade
            const routeAnalysis = analyzeRoutes(tariffs, pricesInUSD);
            
            const recommendations = [];
            
            // Rota mais popular
            if (routeAnalysis.mostPopular) {
                recommendations.push({
                    route: `${routeAnalysis.mostPopular.origin} → ${routeAnalysis.mostPopular.destination}`,
                    reason: 'Popular',
                    details: `${routeAnalysis.mostPopular.count} tarifas disponíveis`,
                    badgeClass: 'popular',
                    filters: routeAnalysis.mostPopular.filters
                });
            }
            
            // Rota mais econômica
            if (routeAnalysis.mostEconomical) {
                recommendations.push({
                    route: `${routeAnalysis.mostEconomical.origin} → ${routeAnalysis.mostEconomical.destination}`,
                    reason: 'Economia',
                    details: `A partir de $${routeAnalysis.mostEconomical.minPrice.toFixed(0)}`,
                    badgeClass: 'economy',
                    filters: routeAnalysis.mostEconomical.filters
                });
            }
            
            // Rota mais rápida
            if (routeAnalysis.fastest) {
                recommendations.push({
                    route: `${routeAnalysis.fastest.origin} → ${routeAnalysis.fastest.destination}`,
                    reason: 'Velocidade',
                    details: `${routeAnalysis.fastest.minTransit} dias de trânsito`,
                    badgeClass: 'speed',
                    filters: routeAnalysis.fastest.filters
                });
            }
            
            return recommendations.length > 0 ? recommendations : getDefaultRecommendations();
            
        } catch (error) {
            console.error('Erro ao gerar recomendações:', error);
            return getDefaultRecommendations();
        }
    }

    // Analisar rotas para recomendações
    function analyzeRoutes(tariffs, pricesInUSD) {
        const routeStats = {};
        
        tariffs.forEach((tariff, index) => {
            const routeKey = `${tariff.origin_name}-${tariff.destination_name}`;
            
            if (!routeStats[routeKey]) {
                routeStats[routeKey] = {
                    origin: tariff.origin_name,
                    destination: tariff.destination_name,
                    filters: {
                        origin: tariff.origin_id,
                        destination: tariff.destination_id,
                        modality: tariff.modality_id
                    },
                    count: 0,
                    prices: [],
                    transitTimes: []
                };
            }
            
            routeStats[routeKey].count++;
            routeStats[routeKey].prices.push(pricesInUSD[index]);
            
            if (tariff.transit_time) {
                const match = tariff.transit_time.match(/(\d+)/);
                if (match) {
                    routeStats[routeKey].transitTimes.push(parseInt(match[0]));
                }
            }
        });

        const routes = Object.values(routeStats);
        
        // Calcular estatísticas
        routes.forEach(route => {
            route.minPrice = Math.min(...route.prices);
            route.avgPrice = route.prices.reduce((a, b) => a + b, 0) / route.prices.length;
            route.minTransit = route.transitTimes.length > 0 ? Math.min(...route.transitTimes) : null;
            route.avgTransit = route.transitTimes.length > 0 ? 
                route.transitTimes.reduce((a, b) => a + b, 0) / route.transitTimes.length : null;
        });

        return {
            mostPopular: routes.reduce((max, route) => route.count > (max?.count || 0) ? route : max, null),
            mostEconomical: routes.reduce((min, route) => route.minPrice < (min?.minPrice || Infinity) ? route : min, null),
            fastest: routes.filter(r => r.minTransit).reduce((min, route) => 
                route.minTransit < (min?.minTransit || Infinity) ? route : min, null)
        };
    }

    // Recomendações padrão como fallback
    function getDefaultRecommendations() {
        return [
            {
                route: 'Santos → Hamburg',
                reason: 'Popular',
                details: 'Rota tradicional de exportação',
                badgeClass: 'popular',
                filters: { modality: '1' } // Marítimo
            },
            {
                route: 'São Paulo → Miami',
                reason: 'Economia',
                details: 'Boa relação custo-benefício',
                badgeClass: 'economy',
                filters: { modality: '2' } // Aéreo
            },
            {
                route: 'Rio de Janeiro → Rotterdam',
                reason: 'Velocidade',
                details: 'Conexões frequentes',
                badgeClass: 'speed',
                filters: { modality: '1' } // Marítimo
            }
        ];
    }

    // --- Funções Auxiliares ---
    async function updateMetrics(tariffs) {
        // Atualizar métricas dos resultados atuais
        document.getElementById('total-routes').textContent = tariffs.length;
        
        if (tariffs.length > 0) {
            const prices = tariffs.map(t => parseFloat(t.freight_cost));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const savings = ((maxPrice - minPrice) / maxPrice * 100).toFixed(0);
            document.getElementById('best-savings').textContent = `${savings}%`;
        } else {
            document.getElementById('best-savings').textContent = '0%';
        }

        // Métricas de mercado são atualizadas separadamente com as tarifas
    }

    async function updateMarketMetrics(tariffs = null) {
        const container = document.getElementById('market-analysis');
        
        if (!tariffs || tariffs.length === 0) {
            // Mostrar estado vazio quando não há tarifas
            container.innerHTML = `
                <div class="text-center py-3">
                    <i class="ri-bar-chart-line text-muted mb-2" style="font-size: 2rem; opacity: 0.5;"></i>
                    <p class="text-muted small mb-0">Análise aparecerá após uma busca</p>
                </div>
            `;
            return;
        }

        try {
            // Obter cotações para análise de preços
            const exchangeRates = await getExchangeRates();
            const pricesInUSD = await convertPricesToUSD(tariffs, exchangeRates);
            
            // === 1. ANÁLISE INTELIGENTE DE VARIAÇÃO DE PREÇOS ===
            const minPrice = Math.min(...pricesInUSD);
            const maxPrice = Math.max(...pricesInUSD);
            const avgPrice = pricesInUSD.reduce((a, b) => a + b, 0) / pricesInUSD.length;
            const priceVariation = maxPrice > minPrice ? ((maxPrice - minPrice) / minPrice * 100) : 0;
            
            let variationIcon = 'ri-minus-line';
            let variationColor = 'text-muted';
            let variationBadgeClass = 'bg-secondary-subtle text-secondary';
            let variationAnalysis = '';
            
            if (priceVariation > 30) {
                variationIcon = 'ri-arrow-up-line';
                variationColor = 'text-danger';
                variationBadgeClass = 'bg-danger-subtle text-danger';
                variationAnalysis = 'Grande oportunidade de negociação';
            } else if (priceVariation > 15) {
                variationIcon = 'ri-arrow-up-line';
                variationColor = 'text-warning';
                variationBadgeClass = 'bg-warning-subtle text-warning';
                variationAnalysis = 'Margem para negociação';
            } else if (priceVariation > 5) {
                variationIcon = 'ri-arrow-right-line';
                variationColor = 'text-info';
                variationBadgeClass = 'bg-info-subtle text-info';
                variationAnalysis = 'Preços consistentes';
            } else {
                variationIcon = 'ri-minus-line';
                variationColor = 'text-success';
                variationBadgeClass = 'bg-success-subtle text-success';
                variationAnalysis = 'Mercado uniforme';
            }

            // === 2. ANÁLISE INTELIGENTE DE DISPONIBILIDADE DO MERCADO ===
            const totalResults = tariffs.length;
            const uniqueAgents = new Set(tariffs.map(t => t.agent_name)).size;
            
            let availabilityStatus = '';
            let availabilityBadgeClass = '';
            let availabilityIcon = '';
            let availabilityText = '';
            
            if (totalResults >= 10) {
                availabilityStatus = 'Excelente';
                availabilityBadgeClass = 'bg-success-subtle text-success';
                availabilityIcon = 'ri-shield-check-line';
                availabilityText = `${totalResults} opções de ${uniqueAgents} agentes`;
            } else if (totalResults >= 5) {
                availabilityStatus = 'Boa';
                availabilityBadgeClass = 'bg-info-subtle text-info';
                availabilityIcon = 'ri-ship-line';
                availabilityText = `${totalResults} opções de ${uniqueAgents} agentes`;
            } else if (totalResults >= 2) {
                availabilityStatus = 'Limitada';
                availabilityBadgeClass = 'bg-warning-subtle text-warning';
                availabilityIcon = 'ri-error-warning-line';
                availabilityText = `Apenas ${totalResults} opções disponíveis`;
            } else {
                availabilityStatus = 'Escassa';
                availabilityBadgeClass = 'bg-danger-subtle text-danger';
                availabilityIcon = 'ri-alert-line';
                availabilityText = `Mercado com baixa oferta`;
            }

            // === 3. ANÁLISE INTELIGENTE DE COMPETIÇÃO ENTRE AGENTES ===
            let competitionStatus = '';
            let competitionBadgeClass = '';
            let competitionIcon = '';
            let competitionText = '';
            
            if (uniqueAgents === 1) {
                competitionStatus = 'Monopólio';
                competitionBadgeClass = 'bg-warning-subtle text-warning';
                competitionIcon = 'ri-user-line';
                competitionText = `Apenas 1 agente (${tariffs[0].agent_name.split(' ')[0]})`;
            } else {
                // Calcular variação real de preços entre agentes
                const agentPrices = {};
                tariffs.forEach((tariff, index) => {
                    const agent = tariff.agent_name;
                    if (!agentPrices[agent]) agentPrices[agent] = [];
                    agentPrices[agent].push(pricesInUSD[index]);
                });
                
                const agentAvgPrices = Object.keys(agentPrices).map(agent => {
                    const prices = agentPrices[agent];
                    return prices.reduce((a, b) => a + b, 0) / prices.length;
                });
                
                const minAgentPrice = Math.min(...agentAvgPrices);
                const maxAgentPrice = Math.max(...agentAvgPrices);
                const agentPriceVariation = minAgentPrice > 0 ? 
                    ((maxAgentPrice - minAgentPrice) / minAgentPrice * 100) : 0;
                
                if (agentPriceVariation > 20) {
                    competitionStatus = 'Alta Competição';
                    competitionBadgeClass = 'bg-success-subtle text-success';
                    competitionIcon = 'ri-funds-line';
                    competitionText = `${uniqueAgents} agentes competindo`;
                } else if (agentPriceVariation > 10) {
                    competitionStatus = 'Competição Moderada';
                    competitionBadgeClass = 'bg-info-subtle text-info';
                    competitionIcon = 'ri-bar-chart-box-line';
                    competitionText = `${uniqueAgents} agentes, preços similares`;
                } else {
                    competitionStatus = 'Preços Alinhados';
                    competitionBadgeClass = 'bg-warning-subtle text-warning';
                    competitionIcon = 'ri-equal-line';
                    competitionText = `${uniqueAgents} agentes, preços uniformes`;
                }
            }

            // === 4. ANÁLISE DE ESTABILIDADE DO MERCADO ===
            const transitTimes = tariffs.map(t => extractTransitDays(t.transit_time)).filter(t => t < 999);
            let stabilityStatus = '';
            let stabilityBadgeClass = '';
            let stabilityIcon = '';
            let stabilityText = '';
            
            if (transitTimes.length > 0) {
                // Calcular coeficiente de variação (CV) para preços e tempos
                const priceCV = (Math.sqrt(pricesInUSD.reduce((acc, price) => acc + Math.pow(price - avgPrice, 2), 0) / pricesInUSD.length) / avgPrice) * 100;
                const avgTransit = transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length;
                const transitCV = transitTimes.length > 1 ? 
                    (Math.sqrt(transitTimes.reduce((acc, time) => acc + Math.pow(time - avgTransit, 2), 0) / transitTimes.length) / avgTransit) * 100 : 0;
                
                const overallStability = (priceCV + transitCV) / 2;
                
                if (overallStability < 15) {
                    stabilityStatus = 'Muito Estável';
                    stabilityBadgeClass = 'bg-success-subtle text-success';
                    stabilityIcon = 'ri-shield-check-line';
                    stabilityText = 'Preços e tempos consistentes';
                } else if (overallStability < 30) {
                    stabilityStatus = 'Estável';
                    stabilityBadgeClass = 'bg-info-subtle text-info';
                    stabilityIcon = 'ri-pulse-line';
                    stabilityText = 'Mercado previsível';
                } else {
                    stabilityStatus = 'Volátil';
                    stabilityBadgeClass = 'bg-warning-subtle text-warning';
                    stabilityIcon = 'ri-alert-line';
                    stabilityText = 'Condições variáveis';
                }
            } else {
                stabilityStatus = 'Dados Limitados';
                stabilityBadgeClass = 'bg-secondary-subtle text-secondary';
                stabilityIcon = 'ri-question-line';
                stabilityText = 'Tempos não informados';
            }

            // === RENDERIZAR O HTML COM ANÁLISES INTELIGENTES ===
            container.innerHTML = `
                <div class="market-metric mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="small fw-medium">
                            <i class="${variationIcon} ${variationColor} me-1"></i>Variação de Preços
                        </span>
                        <span class="badge ${variationBadgeClass}">${priceVariation.toFixed(1)}%</span>
                    </div>
                    <div class="mt-1">
                        <small class="text-muted">
                            ${variationAnalysis} | $${minPrice.toFixed(0)} - $${maxPrice.toFixed(0)}
                        </small>
                    </div>
                </div>
                <div class="market-metric mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="small fw-medium">
                            <i class="${availabilityIcon} me-1"></i>Disponibilidade
                        </span>
                        <span class="badge ${availabilityBadgeClass}">${availabilityStatus}</span>
                    </div>
                    <div class="mt-1">
                        <small class="text-muted">
                            ${availabilityText}
                        </small>
                    </div>
                </div>
                <div class="market-metric mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="small fw-medium">
                            <i class="${competitionIcon} me-1"></i>Competição
                        </span>
                        <span class="badge ${competitionBadgeClass}">${competitionStatus}</span>
                    </div>
                    <div class="mt-1">
                        <small class="text-muted">
                            ${competitionText}
                        </small>
                    </div>
                </div>
                <div class="market-metric">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="small fw-medium">
                            <i class="${stabilityIcon} me-1"></i>Estabilidade
                        </span>
                        <span class="badge ${stabilityBadgeClass}">${stabilityStatus}</span>
                    </div>
                    <div class="mt-1">
                        <small class="text-muted">
                            ${stabilityText}
                        </small>
                    </div>
                </div>
            `;

        } catch (error) {
            console.warn('Erro ao analisar dados de mercado:', error);
            container.innerHTML = `
                <div class="text-center py-2">
                    <i class="ri-error-warning-line text-warning"></i>
                    <small class="text-muted d-block">Erro ao analisar dados</small>
                </div>
            `;
        }
    }

    function updateFilterSummary(filters) {
        const summaryElement = document.getElementById('filter-summary');
        const textElement = document.getElementById('active-filters-text');
        
        const activeFilters = [];
        
        if (filters.origin) {
            const origin = formData.locations.find(l => l.id == filters.origin);
            if (origin) activeFilters.push(`Origem: ${origin.name}`);
        }
        
        if (filters.destination) {
            const destination = formData.locations.find(l => l.id == filters.destination);
            if (destination) activeFilters.push(`Destino: ${destination.name}`);
        }
        
        if (filters.modality) {
            const modality = formData.modalities.find(m => m.id == filters.modality);
            if (modality) activeFilters.push(`Modal: ${modality.name}`);
        }

        if (activeFilters.length > 0) {
            textElement.textContent = activeFilters.join(', ');
            summaryElement.style.display = 'block';
        } else {
            summaryElement.style.display = 'none';
        }
    }

    function calculateSavings(bestPrice, currentPrice) {
        return Math.round(((currentPrice - bestPrice) / bestPrice) * 100);
    }

    function showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        const results = document.getElementById('tariffs-results');
        
        if (show) {
            spinner.classList.remove('d-none');
            spinner.style.display = 'flex';
            results.style.display = 'none';
        } else {
            spinner.classList.add('d-none');
            spinner.style.display = 'none';
            results.style.display = 'block';
        }
    }

    function saveToSearchHistory(filters) {
        const search = {
            filters: filters,
            timestamp: Date.now(),
            count: currentTariffs.length
        };

        searchHistory.unshift(search);
        searchHistory = searchHistory.slice(0, 50); // Manter apenas os últimos 50
        localStorage.setItem('search-history', JSON.stringify(searchHistory));
    }

    function showToast(message, type = 'info') {
        // Implementação simples de toast
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Função utilitária para limpeza de modais
    function cleanupModal() {
        // Remover todos os backdrops órfãos
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Limpar classes do body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Remover atributos de acessibilidade órfãos
        document.body.removeAttribute('data-bs-overflow');
        document.body.removeAttribute('data-bs-padding-right');
    }

    function setupScrollToTop() {
        const scrollBtn = document.getElementById('scroll-to-top');
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollBtn.style.display = 'flex';
            } else {
                scrollBtn.style.display = 'none';
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Busca
        document.getElementById('search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch();
        });

        // Salvar favorito
        document.getElementById('btn-save-favorite').addEventListener('click', () => {
            const form = document.getElementById('search-form');
            const formDataObj = new FormData(form);
            const filters = Object.fromEntries(formDataObj.entries());
            
            if (!filters.origin && !filters.destination && !filters.modality) {
                showToast('Selecione pelo menos um filtro para salvar como favorito', 'warning');
                return;
            }

            showSaveFavoriteModal(filters);
        });

        // Limpar tudo
        document.getElementById('btn-clear-all').addEventListener('click', () => {
            // Resetar formulário
            document.getElementById('search-form').reset();
            
            // Limpar selects do Select2
            $('#search-origin, #search-destination, #search-modality').val(null).trigger('change');
            
            // Esconder resumo de filtros
            const filterSummary = document.getElementById('filter-summary');
            if (filterSummary) {
                filterSummary.style.display = 'none';
            }
            
            // Limpar filtros rápidos ativos
            document.querySelectorAll('.quick-filter').forEach(f => f.classList.remove('active'));
            
            // Limpar resultados e mostrar estado inicial
            renderEmptyState('Faça uma busca para encontrar tarifas');
            
            // Limpar variáveis globais
            currentTariffs = [];
            
            // Resetar métricas para zero
            updateMetrics([]);
            updateMarketMetrics([]);
            
            // Mostrar feedback
            showToast('Todos os filtros foram limpos', 'success');
            
            // Focar no primeiro campo
            setTimeout(() => {
                const firstSelect = document.querySelector('#search-origin');
                if (firstSelect) {
                    firstSelect.focus();
                }
            }, 100);
        });

        // Filtros rápidos
        document.querySelectorAll('.quick-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const filterType = e.currentTarget.dataset.filter;
                const isCurrentlyActive = e.currentTarget.classList.contains('active');
                
                console.log(`Filtro clicado: ${filterType}, isActive: ${isCurrentlyActive}`);
                
                if (isCurrentlyActive) {
                    // Se já está ativo, remove o filtro (volta ao original)
                    console.log('Filtro já ativo, resetando...');
                    
                    // Remover classe active
                    e.currentTarget.classList.remove('active');
                    
                    resetQuickFilters();
                } else {
                    // Aplica o novo filtro
                    console.log('Aplicando novo filtro...');
                    
                    // Remover classe active de todos os filtros
                    document.querySelectorAll('.quick-filter').forEach(f => f.classList.remove('active'));
                    
                    // Adicionar classe active ao filtro clicado
                    e.currentTarget.classList.add('active');
                    
                    applyQuickFilter(filterType);
                }
            });
        });

        // Limpar filtros
        document.getElementById('clear-filters').addEventListener('click', () => {
            document.getElementById('search-form').reset();
            $('#search-origin, #search-destination, #search-modality').val(null).trigger('change');
            document.getElementById('filter-summary').style.display = 'none';
            
            // Limpar filtros rápidos ativos
            document.querySelectorAll('.quick-filter').forEach(f => f.classList.remove('active'));
            
            renderEmptyState('Faça uma busca para encontrar tarifas');
        });

        // Favoritos
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-chip') && !e.target.closest('.remove-favorite')) {
                const favoriteId = e.target.closest('.favorite-chip').dataset.favoriteId;
                applyFavorite(favoriteId);
            }

            if (e.target.closest('.remove-favorite')) {
                const favoriteId = e.target.closest('.remove-favorite').dataset.id;
                removeFavorite(favoriteId);
            }

            if (e.target.closest('.recommendation-item')) {
                const filters = JSON.parse(e.target.closest('.recommendation-item').dataset.filters);
                applyRecommendationFilters(filters);
            }
        });

        // Modal de favoritos
        document.getElementById('confirm-save-favorite').addEventListener('click', () => {
            const name = document.getElementById('favorite-name').value.trim();
            if (!name) {
                showToast('Digite um nome para o favorito', 'warning');
                return;
            }

            const modalElement = document.getElementById('saveFavoriteModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            
            if (!modal) {
                showToast('Erro: Modal não encontrado', 'error');
                return;
            }
            
            const filters = modal._currentFilters;
            
            saveFavorite(name, filters);
            
            // Fechar modal com limpeza adequada
            modal.hide();
            
            // Garantir limpeza do backdrop após animation
            setTimeout(() => {
                cleanupModal();
            }, 300);
        });
    }

    function showSaveFavoriteModal(filters) {
        const modalElement = document.getElementById('saveFavoriteModal');
        
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }
        
        // Forçar limpeza completa antes de criar nova instância
        cleanupModal();
        
        // Aguardar um tick para garantir que a limpeza foi processada
        setTimeout(() => {
            try {
                // Limpar instância anterior se existir
                const existingModal = bootstrap.Modal.getInstance(modalElement);
                if (existingModal) {
                    existingModal.dispose();
                }
                
                // Aguardar mais um tick para garantir dispose completo
                setTimeout(() => {
                    try {
                        // Criar nova instância limpa
                        const modal = new bootstrap.Modal(modalElement, {
                            backdrop: true,
                            keyboard: true,
                            focus: true
                        });
                        
                        modal._currentFilters = filters;
                        
                        // Continuar com o resto da lógica
                        setupModalContent(modal, filters, modalElement);
                        
                    } catch (error) {
                        console.error('Erro ao criar modal:', error);
                        showToast('Erro ao abrir modal de favoritos', 'error');
                    }
                }, 50);
                
            } catch (error) {
                console.error('Erro ao limpar modal anterior:', error);
            }
        }, 10);
    }
    
    function setupModalContent(modal, filters, modalElement) {

        // Gerar nome automático no formato "Origem -> Destino"
        let autoName = '';
        const summary = [];
        
        let originName = '';
        let destinationName = '';
        
        if (filters.origin) {
            const origin = formData.locations.find(l => l.id == filters.origin);
            if (origin) {
                originName = origin.name.split(',')[0]; // Pegar apenas o primeiro nome (cidade)
                summary.push(`<strong>Origem:</strong> ${origin.name}`);
            }
        }
        
        if (filters.destination) {
            const destination = formData.locations.find(l => l.id == filters.destination);
            if (destination) {
                destinationName = destination.name.split(',')[0]; // Pegar apenas o primeiro nome (cidade)
                summary.push(`<strong>Destino:</strong> ${destination.name}`);
            }
        }
        
        if (filters.modality) {
            const modality = formData.modalities.find(m => m.id == filters.modality);
            if (modality) summary.push(`<strong>Modal:</strong> ${modality.name}`);
        }

        // Construir nome automático
        if (originName && destinationName) {
            autoName = `${originName} → ${destinationName}`;
        } else if (originName) {
            autoName = `${originName} → (Qualquer destino)`;
        } else if (destinationName) {
            autoName = `(Qualquer origem) → ${destinationName}`;
        } else {
            autoName = 'Filtro personalizado';
        }

        // Adicionar modal se houver
        if (filters.modality) {
            const modality = formData.modalities.find(m => m.id == filters.modality);
            if (modality) {
                autoName += ` (${modality.name})`;
            }
        }

        // Preencher o campo de nome com o nome automático
        const nameInput = document.getElementById('favorite-name');
        const summaryElement = document.getElementById('favorite-summary');
        
        if (nameInput) {
            nameInput.value = autoName;
        }
        
        if (summaryElement) {
            summaryElement.innerHTML = summary.join('<br>') || 'Nenhum filtro específico';
        }
        
        // Adicionar event listener para limpeza quando modal for fechado
        const modalHiddenHandler = function() {
            try {
                // Usar função utilitária de limpeza
                cleanupModal();
                
                // Resetar form
                const form = document.getElementById('favorite-form');
                if (form) {
                    form.reset();
                }
                
                // Remover este event listener para evitar acúmulo
                modalElement.removeEventListener('hidden.bs.modal', modalHiddenHandler);
                
                // Dispose do modal para limpeza completa
                if (modal && typeof modal.dispose === 'function') {
                    modal.dispose();
                }
            } catch (error) {
                console.error('Erro na limpeza do modal:', error);
            }
        };
        
        modalElement.addEventListener('hidden.bs.modal', modalHiddenHandler);
        
        // Mostrar modal com try/catch
        try {
            modal.show();
            
            // Focar no campo de nome e selecionar todo o texto para facilitar edição
            setTimeout(() => {
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }, 500); // Aumentei o timeout para garantir que o modal esteja completamente renderizado
            
        } catch (error) {
            console.error('Erro ao mostrar modal:', error);
            showToast('Erro ao abrir modal de favoritos', 'error');
        }
    }

    async function applyQuickFilter(filterType) {
        if (isFilterProcessing) {
            console.log('Filtro já está sendo processado, ignorando...');
            return;
        }
        
        isFilterProcessing = true;
        console.log('Aplicando filtro rápido:', filterType);
        console.log('currentTariffs.length:', currentTariffs.length);
        
        // IMPORTANTE: Não mexer nas classes aqui para evitar conflito com event listener
        const activeFilter = document.querySelector(`[data-filter="${filterType}"]`);

        // Verificar se há tarifas para filtrar
        if (!currentTariffs || currentTariffs.length === 0) {
            showToast('Realize uma busca primeiro para aplicar filtros', 'warning');
            return;
        }

        try {
            showLoading(true);
            
            let filteredTariffs = [...currentTariffs];
            const exchangeRates = await getExchangeRates();

            switch (filterType) {
                case 'best-price':
                    console.log('Aplicando filtro de melhor preço...');
                    // Ordenar por preço convertido para USD
                    const pricesInUSD = await convertPricesToUSD(filteredTariffs, exchangeRates);
                    const minPrice = Math.min(...pricesInUSD);
                    
                    filteredTariffs = filteredTariffs
                        .map((tariff, index) => ({ ...tariff, priceUSD: pricesInUSD[index] }))
                        .sort((a, b) => a.priceUSD - b.priceUSD)
                        .map((tariff, index) => ({
                            ...tariff,
                            // APENAS o que tem o melhor preço recebe a tag
                            _filterTag: Math.abs(tariff.priceUSD - minPrice) < 1 ? 
                                '<span class="badge bg-success">🏆 MELHOR PREÇO</span>' : null
                        }));
                    break;
                    
                case 'fastest':
                    console.log('Aplicando filtro de mais rápido...');
                    
                    // Calcular tempos de trânsito
                    const transitTimes = filteredTariffs.map(t => extractTransitDays(t.transit_time));
                    const minTransitTime = Math.min(...transitTimes);
                    
                    filteredTariffs.sort((a, b) => {
                        const aTime = extractTransitDays(a.transit_time);
                        const bTime = extractTransitDays(b.transit_time);
                        console.log(`Comparando ${a.transit_time} (${aTime}) vs ${b.transit_time} (${bTime})`);
                        return aTime - bTime;
                    });
                    
                    // APENAS os que têm o menor tempo de trânsito recebem a tag
                    filteredTariffs = filteredTariffs.map(tariff => ({
                        ...tariff,
                        _filterTag: extractTransitDays(tariff.transit_time) === minTransitTime ? 
                            '<span class="badge bg-info">⚡ MAIS RÁPIDO</span>' : null
                    }));
                    break;
                    
                case 'recommended':
                    console.log('Aplicando filtro recomendado...');
                    
                    // Critério INTELIGENTE: menor preço + menor tempo de trânsito
                    const recPricesInUSD = await convertPricesToUSD(filteredTariffs, exchangeRates);
                    const recMinPrice = Math.min(...recPricesInUSD);
                    const recTransitTimes = filteredTariffs.map(t => extractTransitDays(t.transit_time));
                    const recMinTransitTime = Math.min(...recTransitTimes);
                    
                    // Calcular score: 60% preço + 40% tempo
                    filteredTariffs = filteredTariffs
                        .map((tariff, index) => {
                            const priceScore = recMinPrice > 0 ? (recMinPrice / recPricesInUSD[index]) * 60 : 0;
                            const timeScore = recMinTransitTime < 999 ? 
                                (recMinTransitTime / extractTransitDays(tariff.transit_time)) * 40 : 0;
                            const totalScore = priceScore + timeScore;
                            
                            return { 
                                ...tariff, 
                                priceUSD: recPricesInUSD[index],
                                recScore: totalScore 
                            };
                        })
                        .sort((a, b) => b.recScore - a.recScore); // Maior score primeiro
                    
                    // APENAS o que tem o melhor score (menor preço + menor tempo) recebe a tag
                    const bestScore = filteredTariffs[0]?.recScore || 0;
                    filteredTariffs = filteredTariffs.map(tariff => ({
                        ...tariff,
                        _filterTag: Math.abs(tariff.recScore - bestScore) < 0.1 ? 
                            '<span class="badge bg-primary">⭐ RECOMENDADO</span>' : null
                    }));
                    break;
                    
                case 'direct':
                    console.log('Aplicando filtro de rota direta...');
                    const originalLength = filteredTariffs.length;
                    
                    // Função para verificar se é rota direta
                    const isDirectRoute = (tariff) => {
                        const route_type = (tariff.route_type || '').toLowerCase();
                        const service_type = (tariff.service_type || '').toLowerCase();
                        
                        // Considerar direto se:
                        // 1. Contém explicitamente "direto" ou "direct"
                        // 2. NÃO contém palavras que indicam escalas
                        const hasDirectIndicator = route_type.includes('direto') ||
                                                 route_type.includes('direct') ||
                                                 service_type.includes('direto') ||
                                                 service_type.includes('direct');
                        
                        const hasStopIndicator = route_type.includes('escala') ||
                                               route_type.includes('conexão') ||
                                               route_type.includes('transbordo') ||
                                               service_type.includes('escala') ||
                                               service_type.includes('conexão') ||
                                               service_type.includes('transbordo');
                        
                        return hasDirectIndicator || (!hasStopIndicator && !route_type && !service_type);
                    };
                    
                    // Filtrar apenas rotas diretas
                    filteredTariffs = filteredTariffs.filter(t => {
                        const isDirect = isDirectRoute(t);
                        console.log(`Tarifa ${t.id}: route_type="${t.route_type}", service_type="${t.service_type}", isDirect=${isDirect}`);
                        return isDirect;
                    });
                    
                    // TODAS as rotas diretas recebem a tag (já que foram filtradas)
                    filteredTariffs = filteredTariffs.map(tariff => ({
                        ...tariff,
                        _filterTag: '<span class="badge bg-purple">🛣️ ROTA DIRETA</span>'
                    }));
                    
                    console.log(`Filtro direto: ${originalLength} -> ${filteredTariffs.length} tarifas`);
                    
                    if (filteredTariffs.length === 0) {
                        showToast('Nenhuma rota direta encontrada nos resultados atuais', 'warning');
                        showLoading(false);
                        return;
                    }
                    
                    // Ordenar por preço para as rotas diretas
                    const directPricesInUSD = await convertPricesToUSD(filteredTariffs, exchangeRates);
                    filteredTariffs = filteredTariffs
                        .map((tariff, index) => ({ ...tariff, priceUSD: directPricesInUSD[index] }))
                        .sort((a, b) => a.priceUSD - b.priceUSD);
                    break;
                    
                default:
                    console.log('Tipo de filtro desconhecido:', filterType);
                    break;
            }

            console.log(`Filtro ${filterType} aplicado. Tarifas: ${currentTariffs.length} -> ${filteredTariffs.length}`);
            
            // Verificar quantas tags foram aplicadas para feedback
            const appliedTags = filteredTariffs.map(t => t._filterTag).filter(Boolean);
            console.log(`${appliedTags.length} tag(s) aplicada(s) no filtro ${filterType}`);

            // Re-renderizar com os dados filtrados/ordenados
            await reRenderTariffs(filteredTariffs);
            
            showToast(`Filtro aplicado: ${activeFilter ? activeFilter.textContent.trim() : filterType}`, 'success');
            
        } catch (error) {
            console.error('Erro ao aplicar filtro rápido:', error);
            showToast('Erro ao aplicar filtro', 'error');
        } finally {
            showLoading(false);
            isFilterProcessing = false;
        }
    }

    // Reset dos filtros rápidos - volta à ordenação original
    async function resetQuickFilters() {
        if (isFilterProcessing) {
            console.log('Reset ignorado - filtro já está sendo processado...');
            return;
        }
        
        isFilterProcessing = true;
        console.log('Resetando filtros rápidos...');
        
        // Remover classe active de todos os filtros
        document.querySelectorAll('.quick-filter').forEach(f => f.classList.remove('active'));
        
        if (!currentTariffs || currentTariffs.length === 0) {
            showToast('Nenhuma busca ativa para resetar', 'info');
            return;
        }

        try {
            showLoading(true);
            
            // Aplicar ordenação original (por preço em USD)
            const exchangeRates = await getExchangeRates();
            const pricesInUSD = await convertPricesToUSD(currentTariffs, exchangeRates);
            
            const sortedTariffs = currentTariffs
                .map((tariff, index) => ({ ...tariff, priceUSD: pricesInUSD[index] }))
                .sort((a, b) => a.priceUSD - b.priceUSD);
            
            await reRenderTariffs(sortedTariffs);
            showToast('Filtros removidos - ordenação original restaurada', 'info');
            
        } catch (error) {
            console.error('Erro ao resetar filtros:', error);
            showToast('Erro ao remover filtros', 'error');
        } finally {
            showLoading(false);
            isFilterProcessing = false;
        }
    }

    // Extrair dias de trânsito do texto
    function extractTransitDays(transitTime) {
        if (!transitTime) return 999; // Valor alto para itens sem tempo
        const match = transitTime.match(/(\d+)/);
        return match ? parseInt(match[0]) : 999;
    }

    // Calcular scores de recomendação
    async function calculateRecommendationScores(tariffs, exchangeRates) {
        const pricesInUSD = await convertPricesToUSD(tariffs, exchangeRates);
        const minPrice = Math.min(...pricesInUSD);
        const maxPrice = Math.max(...pricesInUSD);
        
        // Contar frequência de agentes e armadores (mais comum = mais confiável)
        const agentCounts = {};
        const shipownerCounts = {};
        
        tariffs.forEach(t => {
            agentCounts[t.agent_name] = (agentCounts[t.agent_name] || 0) + 1;
            if (t.shipowner_name) {
                shipownerCounts[t.shipowner_name] = (shipownerCounts[t.shipowner_name] || 0) + 1;
            }
        });
        
        const maxAgentCount = Math.max(...Object.values(agentCounts));
        const maxShipownerCount = Object.keys(shipownerCounts).length > 0 ? 
            Math.max(...Object.values(shipownerCounts)) : 0;

        return tariffs.map((tariff, index) => {
            // Score de preço (0-40): menor preço = maior score
            const priceScore = maxPrice > minPrice ? 
                40 * (1 - (pricesInUSD[index] - minPrice) / (maxPrice - minPrice)) : 40;
            
            // Score de tempo (0-30): menor tempo = maior score
            const transitDays = extractTransitDays(tariff.transit_time);
            const timeScore = transitDays < 999 ? Math.max(0, 30 - (transitDays * 2)) : 0;
            
            // Score de agente (0-20): mais comum = maior score
            const agentScore = 20 * (agentCounts[tariff.agent_name] / maxAgentCount);
            
            // Score de armador (0-10): mais comum = maior score (se informado)
            const shipownerScore = tariff.shipowner_name && maxShipownerCount > 0 ? 
                10 * (shipownerCounts[tariff.shipowner_name] / maxShipownerCount) : 0;
            
            return priceScore + timeScore + agentScore + shipownerScore;
        });
    }

    function applyRecommendationFilters(filters) {
        $('#search-origin').val(filters.origin || '').trigger('change');
        $('#search-destination').val(filters.destination || '').trigger('change');
        $('#search-modality').val(filters.modality || '').trigger('change');

        setTimeout(() => {
            performSearch();
        }, 300);
    }

    // --- Funções Globais ---
    window.showTariffDetails = async function(tariffId) {
        const tariff = currentTariffs.find(t => t.id === tariffId);
        if (!tariff) return;

        const modalElement = document.getElementById('tariffDetailsModal');
        
        if (!modalElement) {
            console.error('Tariff details modal element not found');
            return;
        }
        
        // Forçar limpeza completa antes de criar nova instância
        cleanupModal();
        
        // Aguardar um tick para garantir que a limpeza foi processada
        setTimeout(() => {
            try {
                // Limpar instância anterior se existir
                const existingModal = bootstrap.Modal.getInstance(modalElement);
                if (existingModal) {
                    existingModal.dispose();
                }
                
                // Aguardar mais um tick para garantir dispose completo
                setTimeout(async () => {
                    try {
                        const modal = new bootstrap.Modal(modalElement, {
                            backdrop: true,
                            keyboard: true,
                            focus: true
                        });
                        
                        // Adicionar limpeza ao fechar
                        const detailsModalHandler = function() {
                            try {
                                cleanupModal();
                                modalElement.removeEventListener('hidden.bs.modal', detailsModalHandler);
                                if (modal && typeof modal.dispose === 'function') {
                                    modal.dispose();
                                }
                            } catch (error) {
                                console.error('Erro na limpeza do modal de detalhes:', error);
                            }
                        };
                        
                        modalElement.addEventListener('hidden.bs.modal', detailsModalHandler);
                        
                        // Gerar conteúdo e mostrar modal
                        await setupTariffDetailsContent(modal, tariff, modalElement);
                        
                    } catch (error) {
                        console.error('Erro ao criar modal de detalhes:', error);
                        showToast('Erro ao abrir detalhes da tarifa', 'error');
                    }
                }, 50);
                
            } catch (error) {
                console.error('Erro ao limpar modal anterior:', error);
            }
        }, 10);
    };
    
    async function setupTariffDetailsContent(modal, tariff, modalElement) {
        const content = document.getElementById('tariff-details-content');
        
        if (!content) {
            console.error('Tariff details content element not found');
            showToast('Erro ao carregar detalhes da tarifa', 'error');
            return;
        }

        try {
            // Obter cotações para mostrar preço em USD
            const exchangeRates = await getExchangeRates();
            let priceUSD = null;
            if (tariff.freight_currency !== 'USD') {
                const rate = exchangeRates[tariff.freight_currency];
                if (rate) {
                    priceUSD = parseFloat(tariff.freight_cost) / rate;
                }
            }

            // Calcular dias para expirar
            const expirationDate = new Date(tariff.validity_end_date);
            const today = new Date();
            const daysToExpire = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

            // Status de urgência
            let urgencyStatus = '';
            let urgencyClass = '';
            if (daysToExpire <= 7) {
                urgencyStatus = 'EXPIRA EM BREVE';
                urgencyClass = 'text-danger';
            } else if (daysToExpire <= 30) {
                urgencyStatus = 'EXPIRA EM BREVE';
                urgencyClass = 'text-warning';
            } else {
                urgencyStatus = 'VÁLIDA';
                urgencyClass = 'text-success';
            }

            content.innerHTML = `
            <div class="tariff-details-header mb-4">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">
                            <i class="ri-${tariff.modality_name === 'Marítimo' ? 'ship' : 'plane'}-line me-2"></i>
                            ${tariff.origin_name} → ${tariff.destination_name}
                        </h5>
                        <p class="text-muted mb-0">${tariff.modality_name} ${tariff.container_type_name ? `(${tariff.container_type_name})` : ''}</p>
                    </div>
                    <div class="text-end">
                        <div class="price-display">
                            <div class="main-price h4 mb-0">${parseFloat(tariff.freight_cost).toFixed(2)} <small class="text-muted">${tariff.freight_currency}</small></div>
                            ${priceUSD ? `<div class="text-muted small">≈ $${priceUSD.toLocaleString('en-US', {maximumFractionDigits: 0})} USD</div>` : ''}
                        </div>
                        <span class="badge bg-${urgencyClass.includes('success') ? 'success' : urgencyClass.includes('warning') ? 'warning' : 'danger'} mt-2">
                            ${urgencyStatus}
                        </span>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="details-section">
                        <h6 class="section-title">
                            <i class="ri-route-line me-2 text-primary"></i>
                            Informações da Rota
                        </h6>
                        <div class="details-grid">
                            <div class="detail-item">
                                <label>Origem:</label>
                                <span>${tariff.origin_name}</span>
                            </div>
                            <div class="detail-item">
                                <label>Destino:</label>
                                <span>${tariff.destination_name}</span>
                            </div>
                            <div class="detail-item">
                                <label>Modal:</label>
                                <span>${tariff.modality_name}</span>
                            </div>
                            <div class="detail-item">
                                <label>Tipo de Container:</label>
                                <span>${tariff.container_type_name || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Tipo de Rota:</label>
                                <span>${tariff.route_type || 'Direto'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Tempo de Trânsito:</label>
                                <span class="fw-bold text-primary">${tariff.transit_time || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="details-section">
                        <h6 class="section-title">
                            <i class="ri-building-line me-2 text-info"></i>
                            Informações Comerciais
                        </h6>
                        <div class="commercial-details">
                            <div class="detail-item">
                                <label>Agente:</label>
                                <span class="fw-bold">${tariff.agent_name || 'N/A'}</span>
                            </div>
                            ${tariff.shipowner_name ? `
                                <div class="detail-item">
                                    <label>Armador:</label>
                                    <span class="fw-bold">${tariff.shipowner_name}</span>
                                </div>
                            ` : ''}
                           
                        </div>
                    </div>

                    <div class="details-section mt-4">
                        <h6 class="section-title">
                            <i class="ri-calendar-line me-2 text-success"></i>
                            Validade
                        </h6>
                        <div class="validity-info">
                            <div class="d-flex justify-content-between">
                                <span>Início:</span>
                                <span class="fw-bold">${new Date(tariff.validity_start_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Fim:</span>
                                <span class="fw-bold ${urgencyClass}">${new Date(tariff.validity_end_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Status:</span>
                                <span class="fw-bold ${urgencyClass}">${daysToExpire} dias restantes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${tariff.notes ? `
                <div class="details-section mt-4">
                    <h6 class="section-title">
                        <i class="ri-file-text-line me-2 text-warning"></i>
                        Observações
                    </h6>
                    <div class="notes-content">
                        <p class="mb-0">${tariff.notes}</p>
                    </div>
                </div>
            ` : ''}

            ${tariff.surcharges && tariff.surcharges.length > 0 ? `
                <div class="details-section mt-4">
                    <h6 class="section-title">
                        <i class="ri-money-dollar-circle-line me-2 text-danger"></i>
                        Sobretaxas
                    </h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>Nome</th>
                                    <th class="text-end">Valor</th>
                                    <th class="text-center">Moeda</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tariff.surcharges.map(s => `
                                    <tr>
                                        <td>${s.name}</td>
                                        <td class="text-end fw-bold">${parseFloat(s.cost || s.value).toFixed(2)}</td>
                                        <td class="text-center">
                                            <span class="badge bg-secondary">${s.currency}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            <!-- Modal actions removidas -->
        `;

            // Mostrar modal
            modal.show();
            
        } catch (error) {
            console.error('Erro ao gerar conteúdo do modal:', error);
            showToast('Erro ao carregar detalhes da tarifa', 'error');
        }
    }

    function hideLoader() {
        const loader = document.getElementById("loader");
        loader?.classList.add("d-none")
      }

    // Função requestQuote removida

    // Funções de cotação e compartilhamento removidas

    // --- Inicializar ---
    // Expor função globalmente para chamada externa
    window.initializePage = initializePage;
    
    // Inicializar página quando documento estiver pronto
    initializePage();
    hideLoader();
});

