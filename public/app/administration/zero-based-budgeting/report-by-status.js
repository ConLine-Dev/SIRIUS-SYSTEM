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