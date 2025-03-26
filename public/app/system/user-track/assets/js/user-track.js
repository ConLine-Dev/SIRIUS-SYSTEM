/**
 * Script para o módulo de rastreamento de usuários
 * Exibe informações em tempo real sobre usuários e páginas ativas
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicialização
    initPage();
    
    // Conectar ao socket
    const socket = io();
    
    // Escutar eventos de atualização de rastreamento
    socket.on('user-tracker:update', function(data) {
        updateDashboard(data);
    });
    
    // Carregar dados iniciais
    loadInitialData();
    
    // Configurar ações da interface
    setupUIActions();
});

// Inicializar a página
function initPage() {
    // Esconder o loader
    document.querySelector('.page-loader').classList.add('d-none');
    
    // Inicializar DataTables
    $('#active-users-table').DataTable({
        responsive: true,
        searching: true,
        paging: true,
        ordering: true,
        info: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.1/i18n/pt-BR.json'
        },
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
    });
    
    $('#active-pages-table').DataTable({
        responsive: true,
        searching: true,
        paging: true,
        ordering: true,
        info: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.1/i18n/pt-BR.json'
        },
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
    });
    
    // Inicializar gráficos vazios
    initCharts();
}

// Carregar dados iniciais do dashboard
async function loadInitialData() {
    try {
        const response = await fetch('/api/user-tracker/dashboard');
        const result = await response.json();
        
        if (result.success) {
            updateDashboard(result.data);
        } else {
            console.error('Erro ao carregar dados iniciais:', result.message);
        }
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
    }
}

// Inicializar gráficos com dados vazios
function initCharts() {
    // Gráfico de usuários por módulo
    window.usersByModuleChart = new Chart(
        document.getElementById('users-by-module-chart'),
        {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#6610f2', // system
                        '#fd7e14', // administration
                        '#20c997', // people
                        '#0dcaf0', // commercial
                        '#0d6efd', // ti
                        '#198754', // financial
                        '#dc3545', // operational
                        '#6c757d'  // unknown
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const value = context.raw;
                                const percentage = value / context.dataset.data.reduce((a, b) => a + b, 0) * 100;
                                return `${value} usuários (${percentage.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            }
        }
    );
    
    // Gráfico de páginas mais visitadas
    window.topPagesChart = new Chart(
        document.getElementById('top-pages-chart'),
        {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Usuários Ativos',
                    data: [],
                    backgroundColor: 'rgba(13, 110, 253, 0.5)',
                    borderColor: 'rgb(13, 110, 253)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        }
    );
}

// Atualizar o dashboard com novos dados
function updateDashboard(data) {
    // Verificar se os dados são válidos
    if (!data) return;
    
    const activeUsers = data.activeUsers || [];
    const pageStats = data.pageStats || [];
    const userCount = data.userCount || { total: 0, authenticated: 0, anonymous: 0 };
    
    // Atualizar contadores
    updateCounters(userCount, pageStats.length);
    
    // Atualizar novas informações (módulo mais acessado e tempo médio)
    updateTopModule(activeUsers);
    updateAverageSessionTime(activeUsers);
    
    // Atualizar tabela de usuários ativos
    updateActiveUsersTable(activeUsers);
    
    // Atualizar tabela de páginas ativas
    updateActivePagesTable(pageStats);
    
    // Atualizar gráficos
    updateCharts(activeUsers, pageStats);
}

// Atualizar contadores
function updateCounters(userCount, pagesCount) {
    // Usuários totais - contar apenas usuários ativos
    const activeUsersCount = document.getElementById('total-users-count');
    if (activeUsersCount) {
        activeUsersCount.textContent = userCount.active || userCount.total || 0;
    }
    
    // Páginas ativas
    const activePagesElement = document.getElementById('active-pages-count');
    if (activePagesElement) {
        activePagesElement.textContent = pagesCount;
    }
}

// Atualizar módulo mais acessado
function updateTopModule(users) {
    // Contar usuários por módulo
    const moduleCount = {};
    
    users.forEach(user => {
        const module = user.page && user.page.module ? user.page.module : 'unknown';
        moduleCount[module] = (moduleCount[module] || 0) + 1;
    });
    
    // Encontrar o módulo com mais usuários
    let topModule = 'Nenhum';
    let topCount = 0;
    
    for (const [module, count] of Object.entries(moduleCount)) {
        if (count > topCount) {
            topCount = count;
            topModule = module;
        }
    }
    
    // Formatar o nome do módulo
    const formattedModuleName = topModule === 'unknown' ? 'Desconhecido' : 
        topModule.charAt(0).toUpperCase() + topModule.slice(1);
    
    // Atualizar o valor no card
    document.getElementById('top-module-name').innerHTML = `
        <span class="badge badge-module module-${topModule}">
            ${formattedModuleName} (${topCount})
        </span>
    `;
}

// Calcular e atualizar o tempo médio de sessão
function updateAverageSessionTime(users) {
    if (!users.length) {
        document.getElementById('average-session-time').textContent = 'N/A';
        return;
    }
    
    const now = new Date();
    let totalMinutes = 0;
    
    // Calcular tempo de sessão para cada usuário
    users.forEach(user => {
        const timestamp = new Date(user.timestamp);
        const sessionMinutes = Math.floor((now - timestamp) / (1000 * 60));
        totalMinutes += sessionMinutes;
    });
    
    // Calcular média
    const averageMinutes = Math.round(totalMinutes / users.length);
    
    // Formatar o tempo médio
    let timeDisplay;
    if (averageMinutes < 1) {
        timeDisplay = "< 1 min";
    } else if (averageMinutes < 60) {
        timeDisplay = `${averageMinutes} min`;
    } else {
        const hours = Math.floor(averageMinutes / 60);
        const mins = averageMinutes % 60;
        timeDisplay = `${hours}h ${mins}min`;
    }
    
    // Atualizar o valor no card
    document.getElementById('average-session-time').textContent = timeDisplay;
}

// Atualizar tabela de usuários ativos
function updateActiveUsersTable(users) {
    const table = $('#active-users-table').DataTable();
    
    // Limpar a tabela
    table.clear();
    
    // Adicionar os dados dos usuários únicos
    users.forEach(user => {
        const lastActivity = new Date(user.lastActivity);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastActivity) / (1000 * 60));
        
        // Status baseado na última atividade
        let statusHtml = '';
        if (user.inactive) {
            statusHtml = '<span class="status-inactive"><i class="ri-time-line"></i> Inativo</span>';
        } else if (diffMinutes < 5) {
            statusHtml = '<span class="status-active"><i class="ri-record-circle-fill"></i> Ativo</span>';
        } else {
            statusHtml = '<span class="status-inactive"><i class="ri-time-line"></i> ' + diffMinutes + ' min</span>';
        }
        
        // Formatação HTML do usuário
        const userHtml = `
            <div class="user-info">
                <img src="${'https://cdn.conlinebr.com.br/colaboradores/'+user.id_headcargo}" class="user-avatar" />
                <span>${user.name || 'Usuário Anônimo'}</span>
                ${user.sessions > 1 ? `<span class="sessions-badge" title="${user.sessions} abas abertas">${user.sessions}</span>` : ''}
            </div>
        `;
        
        // Formatação HTML do módulo
        const moduleHtml = user.page && user.page.module ? 
            `<span class="badge badge-module module-${user.page.module}">${user.page.module}</span>` :
            '<span class="badge badge-module module-unknown">desconhecido</span>';
        
        // Formatação da data com tooltip
        const dateHtml = `
            <span data-bs-toggle="tooltip" title="Tempo desde o primeiro acesso à esta página. Não será resetado ao atualizar a página.">
                ${formatDateTime(user.timestamp)}
            </span>
        `;
        
        // Adicionar linha
        table.row.add([
            userHtml,
            user.page ? user.page.title : 'Desconhecida',
            moduleHtml,
            dateHtml,
            statusHtml
        ]);
    });
    
    // Redesenhar a tabela
    table.draw();
    
    // Inicializar tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
}

// Atualizar tabela de páginas ativas
function updateActivePagesTable(pages) {
    const table = $('#active-pages-table').DataTable();
    
    // Limpar a tabela
    table.clear();
    
    // Adicionar os dados
    pages.forEach(page => {
        // Formatação HTML do módulo
        const moduleHtml = page.module ? 
            `<span class="badge badge-module module-${page.module}">${page.module}</span>` :
            '<span class="badge badge-module module-unknown">desconhecido</span>';
        
        // Formatação da contagem com tooltip explicativo
        const countHtml = `
            <span class="badge bg-primary" data-bs-toggle="tooltip" 
                  title="Número de usuários atualmente visualizando esta página">
                ${page.count}
            </span>
        `;
        
        // Adicionar linha
        table.row.add([
            page.title,
            moduleHtml,
            page.path,
            countHtml
        ]);
    });
    
    // Redesenhar a tabela
    table.draw();
    
    // Inicializar tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
}

// Atualizar gráficos
function updateCharts(users, pages) {
    updateUsersByModuleChart(users);
    updateTopPagesChart(pages);
}

// Atualizar gráfico de usuários por módulo
function updateUsersByModuleChart(users) {
    const chart = window.usersByModuleChart;
    
    // Contar usuários por módulo
    const moduleCount = {};
    
    users.forEach(user => {
        const module = user.page && user.page.module ? user.page.module : 'unknown';
        moduleCount[module] = (moduleCount[module] || 0) + 1;
    });
    
    // Preparar dados para o gráfico
    const labels = Object.keys(moduleCount);
    const data = Object.values(moduleCount);
    
    // Atualizar o gráfico
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// Atualizar gráfico de páginas mais visitadas
function updateTopPagesChart(pages) {
    const chart = window.topPagesChart;
    
    // Ordenar páginas por contagem de usuários (decrescente)
    const sortedPages = [...pages].sort((a, b) => b.count - a.count);
    
    // Pegar as top 5 páginas
    const topPages = sortedPages.slice(0, 5);
    
    // Preparar dados para o gráfico
    const labels = topPages.map(p => truncateText(p.title, 30));
    const data = topPages.map(p => p.count);
    
    // Atualizar o gráfico
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// Configurar ações da interface
function setupUIActions() {
    // Botão de voltar para a página inicial
    // document.getElementById('back-to-home').addEventListener('click', function() {
    //     window.location.href = '/app';
    // });
}

// Helpers

// Formatar data e hora
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Truncar texto longo
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
} 