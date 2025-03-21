// Script para a página de relatório por mês
document.addEventListener("DOMContentLoaded", async () => {
    // Preencher o filtro de anos
    populateYearFilter();
    
    // Configurar o formulário de filtros
    setupFiltersForm();
    
    // Carregar os dados iniciais do relatório (sem filtros)
    await loadReportData();
    
    // Configurar o botão de exportação
    setupExportButton();
    
    // Esconder o loader quando tudo estiver carregado
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('d-none');
    }
});

// Função para preencher o filtro de anos
function populateYearFilter() {
    const yearSelect = document.getElementById('filter-year');
    if (!yearSelect) return;
    
    // Obter o ano atual
    const currentYear = new Date().getFullYear();
    
    // Preencher com os últimos 5 anos
    let options = '<option value="">Todos os Anos</option>';
    for (let year = currentYear; year >= currentYear - 4; year--) {
        options += `<option value="${year}">${year}</option>`;
    }
    
    yearSelect.innerHTML = options;
    
    // Selecionar o ano atual por padrão
    yearSelect.value = currentYear.toString();
}

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
        const monthElement = document.getElementById('filter-month');
        const yearElement = document.getElementById('filter-year');
        
        const monthValue = monthElement.value || null;
        const year = yearElement.value || null;
        
        // Converter valor numérico do mês para texto correspondente
        let monthFilter = null;
        if (monthValue) {
            const months = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            
            // O valor do select é de 1 a 12, então precisamos subtrair 1 para obter o índice correto (0-11)
            monthFilter = months[parseInt(monthValue) - 1];
        }
        
        // Fazer a requisição para obter os dados do relatório
        const response = await fetch('/api/zero-based-budgeting/reportByMonth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                monthFilter: monthFilter,
                yearFilter: year
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
    updateSummaryCards(data.summary);
    
    // Renderizar o gráfico de gastos por mês
    renderMonthExpensesChart(data.monthlyData);
    
    // Renderizar o gráfico de gastos por categoria
    renderCategoryChart(data.categoryData);
    
    // Preencher a tabela de detalhes
    populateExpensesTable(data.expenses);
}

// Atualizar os cards de resumo
function updateSummaryCards(summary) {
    if (!summary) return;
    
    // Total de solicitações
    const totalRequestsEl = document.getElementById('total-requests');
    if (totalRequestsEl) {
        totalRequestsEl.textContent = summary.totalRequests || 0;
    }
    
    // Total aprovado
    const totalApprovedEl = document.getElementById('total-approved');
    if (totalApprovedEl) {
        totalApprovedEl.textContent = `R$ ${(summary.totalApproved || 0).toFixed(2).replace('.', ',')}`;
    }
    
    // Média por solicitação
    const averageAmountEl = document.getElementById('average-amount');
    if (averageAmountEl) {
        const average = summary.totalRequests ? summary.totalAmount / summary.totalRequests : 0;
        averageAmountEl.textContent = `R$ ${average.toFixed(2).replace('.', ',')}`;
    }
}

// Renderizar o gráfico de gastos por mês
function renderMonthExpensesChart(monthlyData) {
    if (!monthlyData || !monthlyData.labels || !monthlyData.values) return;
    
    const ctx = document.getElementById('monthly-expenses-chart');
    if (!ctx) return;
    
    // Destruir o gráfico existente, se houver
    if (window.monthExpensesChart) {
        window.monthExpensesChart.destroy();
    }
    
    // Criar o novo gráfico
    window.monthExpensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.labels,
            datasets: [{
                label: 'Valor Total (R$)',
                data: monthlyData.values,
                backgroundColor: 'rgba(78, 115, 223, 0.8)',
                borderColor: 'rgba(78, 115, 223, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2).replace('.', ',');
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.raw.toFixed(2).replace('.', ',');
                        }
                    }
                }
            }
        }
    });
}

// Renderizar o gráfico de gastos por categoria
function renderCategoryChart(categoryData) {
    if (!categoryData || !categoryData.labels || !categoryData.values) return;
    
    const ctx = document.getElementById('category-expenses-chart');
    if (!ctx) return;
    
    // Destruir o gráfico existente, se houver
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }
    
    // Cores para o gráfico de pizza
    const backgroundColors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
        '#5a5c69', '#6f42c1', '#20c9a6', '#fd7e14', '#17a2b8'
    ];
    
    // Criar o novo gráfico
    window.categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.values,
                backgroundColor: backgroundColors.slice(0, categoryData.labels.length),
                hoverBackgroundColor: backgroundColors.slice(0, categoryData.labels.length).map(color => color + 'dd'),
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            return `${label}: R$ ${value.toFixed(2).replace('.', ',')}`;
                        }
                    }
                }
            },
            cutout: '50%'
        }
    });
}

// Preencher a tabela de detalhes das solicitações
function populateExpensesTable(expenses) {
    const tableBody = document.getElementById('expenses-table-body');
    if (!tableBody) return;
    
    if (!expenses || expenses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhuma solicitação encontrada</td></tr>';
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
                <td>${expense.requesterName}</td>
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
    const monthFilter = document.getElementById('filter-month');
    const yearFilter = document.getElementById('filter-year');
    
    const month = monthFilter && monthFilter.options[monthFilter.selectedIndex].text || 'Todos';
    const year = yearFilter && yearFilter.value || 'Todos';
    
    // Nome do arquivo
    const fileName = `relatorio_mensal_${month.replace(/\s+/g, '_')}_${year}_${formatDate(new Date())}.csv`;
    
    // Obter a tabela
    const table = document.getElementById('expenses-table');
    if (!table) return;
    
    // Criar o conteúdo CSV
    let csv = [];
    
    // Adicionar o título do relatório
    csv.push(`Relatório por Mês - ${formatDate(new Date())}`);
    csv.push(`Mês: ${month}`);
    csv.push(`Ano: ${year}`);
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

// Formatar data para o nome do arquivo
function formatDate(date) {
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