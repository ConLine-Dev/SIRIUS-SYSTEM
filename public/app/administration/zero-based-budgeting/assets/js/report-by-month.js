// Script para a página de relatório por mês
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar o Select2
    $('.select2').select2({
        width: '100%',
        dropdownParent: $('body')
    });
    
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
    
    // Preencher com os anos de 2021 até o ano atual + 1
    let options = '<option value="">Todos os Anos</option>';
    for (let year = currentYear + 1; year >= 2021; year--) {
        options += `<option value="${year}">${year}</option>`;
    }
    
    yearSelect.innerHTML = options;
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
        const month = document.getElementById('filter-month').value || null;
        const year = document.getElementById('filter-year').value || null;
        
        console.log('Enviando requisição com filtros:', { month, year });
        
        // Fazer a requisição para obter os dados do relatório
        const response = await fetch('/api/zero-based-budgeting/reportByMonth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                month: month,
                year: year
            })
        });
        
        const result = await response.json();
        console.log('Dados recebidos da API:', result);
        
        if (!result || !result.success) {
            console.error('Erro na resposta da API:', result);
            showAlert('Erro', 'Ocorreu um erro ao carregar os dados do relatório', 'error');
            return;
        }
        
        // Os dados estão dentro da propriedade 'data' da resposta
        const data = result.data;
        
        if (!data || !data.expenses) {
            console.error('Estrutura de dados inválida:', data);
            showAlert('Erro', 'Os dados recebidos do servidor estão em um formato inválido', 'error');
            return;
        }
        
        // Processar e exibir os dados
        processReportData(data);
        
    } catch (error) {
        console.error('Erro ao carregar dados do relatório:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar os dados do relatório', 'error');
    }
}

// Função para processar e exibir os dados do relatório
function processReportData(data) {
    console.log('Processando dados do relatório:', data);
    
    // Atualizar os cards de resumo
    updateSummaryCards(data.summary, data.expenses);
    
    // Renderizar o gráfico de gastos por mês (apenas aprovados)
    renderMonthExpensesChart(data.expenses);
    
    // Renderizar o gráfico de status
    renderStatusChart(data.expenses);
    
    // Preencher a tabela de detalhes
    populateExpensesTable(data.expenses);
}

// Atualizar os cards de resumo
function updateSummaryCards(summary, expenses) {
    if (!summary) return;
    
    // Total de solicitações
    const totalRequestsEl = document.getElementById('total-requests');
    if (totalRequestsEl) {
        totalRequestsEl.textContent = summary.totalRequests || 0;
    }
    
    // Total aprovado
    const totalApprovedEl = document.getElementById('total-approved');
    if (totalApprovedEl) {
        const formattedApproved = new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(summary.totalApproved || 0);
        totalApprovedEl.textContent = formattedApproved;
    }
    
    // Total rejeitado
    const averageAmountEl = document.getElementById('average-amount');
    if (averageAmountEl) {
        const totalRejected = summary.totalRejected || 0;
        const formattedRejected = new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(totalRejected);
        averageAmountEl.textContent = formattedRejected;
    }
    
    // Média por mês
    if (Array.isArray(expenses)) {
        const monthlyAverageEl = document.getElementById('monthly-average');
        if (monthlyAverageEl) {
            // Filtrar apenas despesas aprovadas
            const approvedExpenses = expenses.filter(e => e.status === 'Aprovado');
            
            // Agrupar por mês para calcular a média
            const expensesByMonth = {};
            approvedExpenses.forEach(expense => {
                const month = expense.month;
                if (!month) return;
                
                // Converter valor de texto para número de forma robusta
                let amount = 0;
                try {
                    if (typeof expense.total_amount === 'string') {
                        // Remover "R$ ", substituir "." por "" (para milhares) e "," por "." (decimal)
                        let amountStr = expense.total_amount.replace(/R\$\s?/g, '');
                        
                        // Tratar números com formato brasileiro (ex: 12.345.678,90)
                        // Primeiro remove todos os pontos e depois substitui a vírgula por ponto
                        amountStr = amountStr.replace(/\./g, '').replace(',', '.');
                        
                        // Tentar converter para número
                        const parsedAmount = parseFloat(amountStr);
                        
                        // Verificar se o resultado é um número válido
                        if (!isNaN(parsedAmount)) {
                            amount = parsedAmount;
                        } else {
                            console.error(`Falha na conversão: "${expense.total_amount}" => "${amountStr}" => NaN`);
                        }
                    } else if (typeof expense.total_amount === 'number') {
                        amount = expense.total_amount;
                    }
                } catch (e) {
                    console.error('Erro ao converter valor:', e, expense.total_amount);
                }
                
                if (!expensesByMonth[month]) {
                    expensesByMonth[month] = [];
                }
                expensesByMonth[month].push(amount);
            });
            
            // Calcular a média por mês
            const totalMonths = Object.keys(expensesByMonth).length;
            const totalAmount = Object.values(expensesByMonth).reduce((sum, values) => {
                return sum + values.reduce((subtotal, value) => subtotal + value, 0);
            }, 0);
            
            // Mostrar a média ou zero se não houver meses
            const monthlyAverage = totalMonths > 0 ? totalAmount / totalMonths : 0;
            
            // Formatar com separador de milhares
            const formattedAverage = new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(monthlyAverage);
            
            monthlyAverageEl.textContent = formattedAverage;
            
            console.log('Média por mês:', {
                totalMonths,
                totalAmount,
                monthlyAverage,
                formattedAverage
            });
        }
    }
}

// Renderizar o gráfico de gastos por mês
function renderMonthExpensesChart(expenses) {
    if (!Array.isArray(expenses)) {
        console.error('Expenses não é um array:', expenses);
        return;
    }
    
    const ctx = document.getElementById('monthly-expenses-chart');
    if (!ctx) return;
    
    // Destruir o gráfico existente, se houver
    if (window.monthExpensesChart) {
        window.monthExpensesChart.destroy();
    }
    
    // Filtrar apenas as despesas aprovadas
    const approvedExpenses = expenses.filter(e => e.status === 'Aprovado');
    console.log('Despesas aprovadas:', approvedExpenses);
    
    // Agrupar as despesas aprovadas por mês
    const expensesByMonth = {};
    approvedExpenses.forEach(expense => {
        const month = expense.month;
        if (!month) return;
        
        // Converter valor de texto para número de forma robusta
        let amount = 0;
        try {
            if (typeof expense.total_amount === 'string') {
                // Remover "R$ ", substituir "." por "" (para milhares) e "," por "." (decimal)
                let amountStr = expense.total_amount.replace(/R\$\s?/g, '');
                
                // Tratar números com formato brasileiro (ex: 12.345.678,90)
                // Primeiro remove todos os pontos e depois substitui a vírgula por ponto
                amountStr = amountStr.replace(/\./g, '').replace(',', '.');
                
                // Tentar converter para número
                const parsedAmount = parseFloat(amountStr);
                
                // Verificar se o resultado é um número válido
                if (!isNaN(parsedAmount)) {
                    amount = parsedAmount;
                } else {
                    console.error(`Falha na conversão: "${expense.total_amount}" => "${amountStr}" => NaN`);
                }
            } else if (typeof expense.total_amount === 'number') {
                amount = expense.total_amount;
            }
        } catch (e) {
            console.error('Erro ao converter valor:', e, expense.total_amount);
        }
        
        if (!expensesByMonth[month]) {
            expensesByMonth[month] = 0;
        }
        expensesByMonth[month] += amount;
    });
    
    console.log('Gastos por mês (aprovados):', expensesByMonth);
    
    // Ordenar os meses na ordem correta
    const monthOrder = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 
        'Maio', 'Junho', 'Julho', 'Agosto', 
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    // Preparar os dados ordenados para o gráfico
    const sortedData = Object.keys(expensesByMonth)
        .map(month => ({
            month: month,
            value: expensesByMonth[month],
            order: monthOrder.indexOf(month)
        }))
        .sort((a, b) => a.order - b.order)
        .filter(item => item.order !== -1); // Remover meses inválidos
    
    console.log('Dados mensais ordenados (apenas aprovados):', sortedData);
    
    // Preparar os dados para o gráfico
    const labels = sortedData.map(item => item.month);
    const values = sortedData.map(item => item.value);
    
    // Criar o novo gráfico
    window.monthExpensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor Aprovado (R$)',
                data: values,
                backgroundColor: 'rgba(40, 167, 69, 0.8)', // Verde para aprovados
                borderColor: 'rgba(40, 167, 69, 1)',
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
                            return 'R$ ' + value.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return 'R$ ' + value.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        }
                    }
                }
            }
        }
    });
}

// Renderizar o gráfico de status
function renderStatusChart(expenses) {
    if (!Array.isArray(expenses)) {
        console.error('Expenses não é um array:', expenses);
        return;
    }
    
    const ctx = document.getElementById('category-expenses-chart');
    if (!ctx) return;
    
    // Destruir o gráfico existente, se houver
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }
    
    // Contar as quantidades por status diretamente do array de despesas
    const pendingCount = expenses.filter(e => e.status === 'Pendente').length;
    const approvedCount = expenses.filter(e => e.status === 'Aprovado').length;
    const rejectedCount = expenses.filter(e => e.status === 'Rejeitado').length;
    const partialCount = expenses.filter(e => e.status === 'Aprovação Parcial').length;
    
    console.log('Contagem por status:', {
        pendingCount,
        approvedCount,
        rejectedCount,
        partialCount
    });
    
    // Criar o novo gráfico
    window.categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pendente', 'Aprovado', 'Rejeitado', 'Aprovação Parcial'],
            datasets: [{
                data: [pendingCount, approvedCount, rejectedCount, partialCount],
                backgroundColor: ['#ffc107', '#28a745', '#dc3545', '#17a2b8'],
                borderColor: ['#ffc107', '#28a745', '#dc3545', '#17a2b8'],
                borderWidth: 1
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
                            return `${label}: ${value} solicitações`;
                        }
                    }
                }
            },
            cutout: '50%'
        }
    });
}

// Função para preencher a tabela de despesas
function populateExpensesTable(expenses) {
    const table = document.getElementById('expenses-table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    // Limpar a tabela
    tbody.innerHTML = '';
    
    if (!expenses || !expenses.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhum dado encontrado</td></tr>';
        return;
    }
    
    // Preencher a tabela com os dados
    expenses.forEach(expense => {
        const row = document.createElement('tr');
        
        // Obter a classe do badge de status
        const statusClass = getStatusBadgeClass(expense.status);
        
        row.innerHTML = `
            <td>${expense.costCenterName || 'N/A'}</td>
            <td>${expense.month} ${expense.year || ''}</td>
            <td>${Array.isArray(expense.categories) ? expense.categories.join(', ') : 'N/A'}</td>
            <td class="text-center">${expense.item_count}</td>
            <td class="text-end">${expense.total_amount}</td>
            <td class="text-center"><span class="badge ${statusClass}">${expense.status}</span></td>
            <td>${expense.requesterName || 'N/A'}</td>
            <td>${expense.created_at || 'N/A'}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-primary view-request-btn" data-id="${expense.id}">
                    <i class="ri-eye-line"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Adicionar listeners para os botões de visualização
    addViewButtonListeners();
}

// Função auxiliar para obter a classe do badge de status
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Aprovado':
            return 'bg-success';
        case 'Rejeitado':
            return 'bg-danger';
        case 'Aprovação Parcial':
            return 'bg-info';
        default:
            return 'bg-warning';
    }
}

// Adicionar event listeners para os botões de visualização de solicitações
function addViewButtonListeners() {
    const viewButtons = document.querySelectorAll('.view-request-btn');
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
    
    const monthName = monthFilter && monthFilter.options[monthFilter.selectedIndex].text || 'Todos';
    const year = yearFilter && yearFilter.value || 'Todos';
    
    // Nome do arquivo
    const fileName = `relatorio_mensal_${monthName.replace(/\s+/g, '_')}_${year}_${formatDate(new Date())}.csv`;
    
    // Obter a tabela
    const table = document.getElementById('expenses-table');
    if (!table) return;
    
    // Criar o conteúdo CSV
    let csv = [];
    
    // Adicionar o título do relatório
    csv.push(`Relatório por Mês - ${formatDate(new Date())}`);
    csv.push(`Mês: ${monthName}`);
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
    // Adicionar BOM UTF-8 para garantir que os caracteres especiais sejam exibidos corretamente
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
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

// Obter as informações do usuário logado do localStorage
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    if (!StorageGoogleData) return null;
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
} 