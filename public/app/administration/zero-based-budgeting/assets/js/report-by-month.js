// Script para a página de relatório por mês
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar o Select2
    $('.select2').select2({
        width: '100%',
        dropdownParent: $('body')
    });
    
    // Carregar os centros de custo para o filtro
    await loadCostCenters();
    
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

// Função para carregar a lista de centros de custo
async function loadCostCenters() {
    try {
        // Obter ID do colaborador logado do localStorage
        const userLogged = await getInfosLogin();
        const collaborator_id = userLogged?.system_collaborator_id;
        
        if (!collaborator_id) {
            throw new Error('ID do colaborador não encontrado');
        }
        
        // Fazer a requisição para obter os centros de custo
        const response = await fetch(`/api/zero-based-budgeting/getAllCostCenters?id_collaborator=${collaborator_id}`);
        const result = await response.json();
        
        // Verificar o resultado - a API retorna diretamente o array de centros de custo
        if (!Array.isArray(result)) {
            // Se não for um array, pode ser uma resposta de erro
            if (result.success === false) {
                console.error('Falha ao carregar centros de custo:', result.message);
                return;
            }
            console.error('Resposta inesperada da API:', result);
            return;
        }
        
        const costCenters = result; // O resultado já é o array de centros de custo
        
        const selectEl = document.getElementById('filter-cost-center');
        if (!selectEl) {
            console.warn('Elemento de seleção não encontrado');
            return;
        }
        
        // Manter a opção padrão
        let options = '<option value="">Todos os Centros de Custo</option>';
        
        // Adicionar cada centro de custo como uma opção
        costCenters.forEach(costCenter => {
            options += `<option value="${costCenter.id}">${costCenter.name}</option>`;
        });
        
        selectEl.innerHTML = options;
        
    } catch (error) {
        console.error('Erro ao carregar centros de custo:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar a lista de centros de custo', 'error');
    }
}

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
        const costCenterId = document.getElementById('filter-cost-center').value || null;
        const year = document.getElementById('filter-year').value || null;
        
        console.log('Enviando requisição com filtros:', { costCenterId, year });
        
        // Fazer a requisição para obter os dados do relatório
        const response = await fetch('/api/zero-based-budgeting/reportByMonth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                costCenterId: costCenterId,
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
        totalApprovedEl.textContent = `R$ ${(summary.totalApproved || 0).toFixed(2).replace('.', ',')}`;
    }
    
    // Total rejeitado
    const averageAmountEl = document.getElementById('average-amount');
    if (averageAmountEl) {
        const totalRejected = summary.totalRejected || 0;
        averageAmountEl.textContent = `R$ ${totalRejected.toFixed(2).replace('.', ',')}`;
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
                
                // Converter valor de texto para número
                let amount = 0;
                if (typeof expense.total_amount === 'string') {
                    const amountStr = expense.total_amount.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
                    amount = parseFloat(amountStr) || 0;
                } else {
                    amount = parseFloat(expense.total_amount) || 0;
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
            monthlyAverageEl.textContent = `R$ ${monthlyAverage.toFixed(2).replace('.', ',')}`;
            
            console.log('Média por mês:', {
                totalMonths,
                totalAmount,
                monthlyAverage
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
        
        // Converter valor de texto para número (remover 'R$ ' e substituir ',' por '.')
        let amount = 0;
        if (typeof expense.total_amount === 'string') {
            const amountStr = expense.total_amount.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
            amount = parseFloat(amountStr) || 0;
        } else {
            amount = parseFloat(expense.total_amount) || 0;
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
    console.log('Populando tabela com despesas:', expenses);
    
    if (!Array.isArray(expenses)) {
        console.error('Despesas não é um array:', expenses);
        return;
    }
    
    const tableBody = document.querySelector('#expenses-table tbody');
    if (!tableBody) {
        console.error('Elemento tbody não encontrado');
        return;
    }
    
    // Limpar a tabela
    tableBody.innerHTML = '';
    
    if (expenses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhuma solicitação encontrada</td></tr>';
        return;
    }
    
    // Preencher com os novos dados
    expenses.forEach(expense => {
        console.log('Processando despesa:', expense);
        
        const row = document.createElement('tr');
        
        // Criar as células da linha
        row.innerHTML = `
            <td>${expense.costCenterName || ''}</td>
            <td>${expense.month || ''}</td>
            <td>${Array.isArray(expense.categories) ? expense.categories.join(', ') : ''}</td>
            <td>${expense.total_quantity || 0}</td>
            <td>${expense.total_amount || 'R$ 0,00'}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(expense.status)}">
                    ${expense.status || ''}
                </span>
            </td>
            <td>${expense.requesterName || ''}</td>
            <td>${expense.created_at || ''}</td>
            <td>
                <button type="button" class="btn btn-sm btn-info view-expense" data-id="${expense.id}">
                    <i class="ri-eye-line"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Adicionar os listeners para os botões de visualização
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
    const viewButtons = document.querySelectorAll('.view-expense');
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
    const costCenterFilter = document.getElementById('filter-cost-center');
    const yearFilter = document.getElementById('filter-year');
    
    const costCenterName = costCenterFilter && costCenterFilter.options[costCenterFilter.selectedIndex].text || 'Todos';
    const year = yearFilter && yearFilter.value || 'Todos';
    
    // Nome do arquivo
    const fileName = `relatorio_mensal_${costCenterName.replace(/\s+/g, '_')}_${year}_${formatDate(new Date())}.csv`;
    
    // Obter a tabela
    const table = document.getElementById('expenses-table');
    if (!table) return;
    
    // Criar o conteúdo CSV
    let csv = [];
    
    // Adicionar o título do relatório
    csv.push(`Relatório por Mês - ${formatDate(new Date())}`);
    csv.push(`Centro de Custo: ${costCenterName}`);
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