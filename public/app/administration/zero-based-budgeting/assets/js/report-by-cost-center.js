// Script para a página de relatório por centro de custo
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
        const response = await fetch('/api/zero-based-budgeting/reportByCostCenter', {
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
    updateSummaryCards(data.summary);
    
    // Renderizar o gráfico de gastos por centro de custo
    renderCostCenterChart(data.costCenterData);
    
    // Renderizar o gráfico de status
    renderStatusChart(data.statusData);
    
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
    
    // Total rejeitado
    const totalRejectedEl = document.getElementById('total-rejected');
    if (totalRejectedEl) {
        totalRejectedEl.textContent = `R$ ${(summary.totalRejected || 0).toFixed(2).replace('.', ',')}`;
    }
}

// Renderizar o gráfico de gastos por centro de custo
function renderCostCenterChart(costCenterData) {
    if (!costCenterData || !costCenterData.labels || !costCenterData.values) return;
    
    const ctx = document.getElementById('cost-center-chart');
    if (!ctx) return;
    
    // Destruir o gráfico existente, se houver
    if (window.costCenterChart) {
        window.costCenterChart.destroy();
    }
    
    // Cores para o gráfico de pizza
    const backgroundColors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
        '#5a5c69', '#6f42c1', '#20c9a6', '#fd7e14', '#17a2b8'
    ];
    
    // Criar o novo gráfico
    window.costCenterChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: costCenterData.labels,
            datasets: [{
                data: costCenterData.values,
                backgroundColor: backgroundColors.slice(0, costCenterData.labels.length),
                hoverBackgroundColor: backgroundColors.slice(0, costCenterData.labels.length).map(color => color + 'dd'),
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

// Renderizar o gráfico de status
function renderStatusChart(statusData) {
    if (!statusData || !statusData.labels || !statusData.values) return;
    
    const ctx = document.getElementById('status-chart');
    if (!ctx) return;
    
    // Destruir o gráfico existente, se houver
    if (window.statusChart) {
        window.statusChart.destroy();
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
    window.statusChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: statusData.labels,
            datasets: [{
                label: 'Quantidade',
                data: statusData.values,
                backgroundColor: colors,
                borderColor: colors,
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
                        precision: 0 // Só mostrar números inteiros
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
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
    const fileName = `relatorio_centro_custo_${costCenterName.replace(/\s+/g, '_')}_${year}_${formatDate(new Date())}.csv`;
    
    // Obter a tabela
    const table = document.getElementById('expenses-table');
    if (!table) return;
    
    // Criar o conteúdo CSV
    let csv = [];
    
    // Adicionar o título do relatório
    csv.push(`Relatório por Centro de Custo - ${formatDate(new Date())}`);
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

// Adicionar a função getInfosLogin() no final do arquivo
// Obter as informações do usuário logado do localStorage
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    if (!StorageGoogleData) return null;
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
} 