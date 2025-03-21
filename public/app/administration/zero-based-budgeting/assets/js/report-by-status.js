// Script para a página de relatório por status
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar o Select2
    $('.select2').select2({
        width: '100%'
    });
    
    // Configurar o formulário de filtros
    setupFiltersForm();
    
    // Carregar os dados iniciais do relatório (com filtro padrão para os últimos 30 dias)
    await loadReportData();
    
    // Configurar o botão de exportação
    setupExportButton();
    
    // Esconder o loader quando tudo estiver carregado
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('d-none');
    }
});

// Configurar o formulário de filtros
function setupFiltersForm() {
    const form = document.getElementById('report-filters-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Mostrar o loader durante o carregamento dos dados
            const loader = document.querySelector('.page-loader');
            if (loader) {
                loader.classList.remove('d-none');
            }
            
            // Carregar dados com os filtros selecionados
            await loadReportData();
            
            // Esconder o loader após o carregamento
            if (loader) {
                loader.classList.add('d-none');
            }
        });
    }
}

// Função para carregar os dados do relatório
async function loadReportData() {
    try {
        // Obter os valores dos filtros
        const statusFilter = document.getElementById('filter-status').value;
        const period = document.getElementById('filter-period').value || null;
        
        // Converter valor numérico do status para texto correspondente
        let statusParam = null;
        if (statusFilter) {
            switch (parseInt(statusFilter)) {
                case 1:
                    statusParam = 'Pendente';
                    break;
                case 2:
                    statusParam = 'Aprovado';
                    break;
                case 3:
                    statusParam = 'Rejeitado';
                    break;
                case 4:
                    statusParam = 'Aprovação Parcial';
                    break;
                default:
                    statusParam = null;
            }
        }
        
        // Fazer a requisição para obter os dados do relatório
        const response = await fetch('/api/zero-based-budgeting/reportByStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                statusFilter: statusParam,
                days: period
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showAlert('Erro', result.message || 'Falha ao carregar os dados do relatório', 'error');
            return;
        }
        
        // Processar e exibir os dados
        processReportData(result.data);
        
    } catch (error) {
        console.error('Erro ao carregar dados do relatório:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar os dados do relatório', 'error');
    }
}

// Função para processar e exibir os dados do relatório
function processReportData(data) {
    // Atualizar os cards de resumo
    updateStatusCards(data.summary);
    
    // Renderizar o gráfico de distribuição por status
    renderStatusDistributionChart(data.statusDistribution);
    
    // Renderizar o gráfico de evolução no tempo
    renderTimelineChart(data.timeline);
    
    // Preencher a tabela de detalhes
    populateExpensesTable(data.expenses);
}

// Atualizar os cards de status
function updateStatusCards(summary) {
    if (!summary) return;
    
    // Contagem de solicitações pendentes
    const pendingCountEl = document.getElementById('pending-count');
    if (pendingCountEl) {
        pendingCountEl.textContent = summary.pending || 0;
    }
    
    // Contagem de solicitações aprovadas
    const approvedCountEl = document.getElementById('approved-count');
    if (approvedCountEl) {
        approvedCountEl.textContent = summary.approved || 0;
    }
    
    // Contagem de solicitações rejeitadas
    const rejectedCountEl = document.getElementById('rejected-count');
    if (rejectedCountEl) {
        rejectedCountEl.textContent = summary.rejected || 0;
    }
    
    // Contagem de solicitações com aprovação parcial
    const partialCountEl = document.getElementById('partial-count');
    if (partialCountEl) {
        partialCountEl.textContent = summary.partial || 0;
    }
}

// Renderizar o gráfico de distribuição por status
function renderStatusDistributionChart(statusData) {
    if (!statusData || !statusData.labels || !statusData.values) return;
    
    const ctx = document.getElementById('status-distribution-chart');
    if (!ctx) return;
    
    // Destruir o gráfico existente, se houver
    if (window.statusDistributionChart) {
        window.statusDistributionChart.destroy();
    }
    
    // Cores para cada status
    const backgroundColors = {
        'Pendente': '#ffc107',
        'Aprovado': '#28a745',
        'Rejeitado': '#dc3545',
        'Aprovação Parcial': '#17a2b8'
    };
    
    // Criar arrays de cores baseados nos labels
    const colors = statusData.labels.map(label => backgroundColors[label] || '#6c757d');
    
    // Criar o novo gráfico
    window.statusDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statusData.labels,
            datasets: [{
                data: statusData.values,
                backgroundColor: colors,
                hoverBackgroundColor: colors.map(color => color + 'dd'),
                hoverBorderColor: 'rgba(234, 236, 244, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Renderizar o gráfico de evolução no tempo
function renderTimelineChart(timelineData) {
    if (!timelineData || !timelineData.labels || !timelineData.datasets) return;
    
    const ctx = document.getElementById('timeline-chart');
    if (!ctx) return;
    
    // Destruir o gráfico existente, se houver
    if (window.timelineChart) {
        window.timelineChart.destroy();
    }
    
    // Cores para cada status nas datasets
    const statusColors = {
        'Pendente': '#ffc107',
        'Aprovado': '#28a745',
        'Rejeitado': '#dc3545',
        'Aprovação Parcial': '#17a2b8'
    };
    
    // Preparar datasets para o gráfico
    const datasets = timelineData.datasets.map(dataset => {
        const color = statusColors[dataset.label] || '#6c757d';
        return {
            label: dataset.label,
            data: dataset.data,
            backgroundColor: color + '33',
            borderColor: color,
            borderWidth: 2,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: color,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.1
        };
    });
    
    // Criar o novo gráfico
    window.timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelineData.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0 // Só mostrar números inteiros
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

// Preencher a tabela de detalhes das solicitações
function populateExpensesTable(expenses) {
    const tableBody = document.getElementById('requests-table-body');
    if (!tableBody) return;
    
    if (!expenses || expenses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhuma solicitação encontrada</td></tr>';
        return;
    }
    
    let html = '';
    expenses.forEach(expense => {
        // Definir a classe do badge com base no status
        let statusClass, statusText;
        switch(parseInt(expense.status)) {
            case 2:
                statusClass = 'badge-approved';
                statusText = 'Aprovado';
                break;
            case 3:
                statusClass = 'badge-rejected';
                statusText = 'Rejeitado';
                break;
            case 4:
                statusClass = 'badge-partial';
                statusText = 'Parcialmente Aprovado';
                break;
            default: // 1 - Pendente
                statusClass = 'badge-pending';
                statusText = 'Pendente';
        }
        
        html += `
            <tr>
                <td>${expense.id}</td>
                <td>${expense.costCenterName}</td>
                <td>${expense.month}</td>
                <td>${expense.category}</td>
                <td>${expense.description.substring(0, 50)}${expense.description.length > 50 ? '...' : ''}</td>
                <td>R$ ${parseFloat(expense.amount).toFixed(2).replace('.', ',')}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary view-expense-btn" data-id="${expense.id}">
                        <i class="ri-eye-line"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Adicionar event listeners para os botões de visualização
    addViewButtonListeners();
}

// Adicionar event listeners para os botões de visualização de solicitações
function addViewButtonListeners() {
    const viewButtons = document.querySelectorAll('.view-expense-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const expenseId = this.getAttribute('data-id');
            window.open(`/app/administration/zero-based-budgeting/view-expense-request.html?id=${expenseId}`, '_blank');
        });
    });
}

// Configurar o botão de exportação para CSV
function setupExportButton() {
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTableToCSV);
    }
}

// Função para exportar a tabela para CSV
function exportTableToCSV() {
    // Obter os valores dos filtros
    const statusFilter = document.getElementById('filter-status');
    const periodFilter = document.getElementById('filter-period');
    
    const status = statusFilter && statusFilter.options[statusFilter.selectedIndex].text || 'Todos';
    const period = periodFilter && periodFilter.options[periodFilter.selectedIndex].text || 'Todo o período';
    
    // Nome do arquivo
    const fileName = `relatorio_status_${status.replace(/\s+/g, '_')}_${formatDateForFile(new Date())}.csv`;
    
    // Obter a tabela
    const table = document.getElementById('requests-table');
    if (!table) return;
    
    // Criar o conteúdo CSV
    let csv = [];
    
    // Adicionar o título do relatório
    csv.push(`Relatório por Status - ${formatDate(new Date())}`);
    csv.push(`Status: ${status}`);
    csv.push(`Período: ${period}`);
    csv.push(''); // Linha em branco
    
    // Adicionar cabeçalhos
    const headers = [];
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach(cell => {
        // Excluir a coluna de ações
        if (cell.textContent !== 'Ações') {
            headers.push(`"${cell.textContent}"`);
        }
    });
    csv.push(headers.join(';'));
    
    // Adicionar linhas de dados
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('td');
        for (let i = 0; i < cells.length; i++) {
            // Excluir a coluna de ações
            if (i !== cells.length - 1) {
                // Limpar o texto (remover HTML)
                const text = cells[i].textContent.trim();
                rowData.push(`"${text}"`);
            }
        }
        csv.push(rowData.join(';'));
    });
    
    // Criar o blob e fazer o download
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Formatar data para exibição
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formatar data para o nome do arquivo
function formatDateForFile(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}_${month}_${year}`;
}

// Exibir alerta com SweetAlert2
function showAlert(title, message, icon) {
    Swal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonText: 'OK'
    });
}
 