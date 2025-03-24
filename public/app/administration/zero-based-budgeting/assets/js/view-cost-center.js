// Script para a página de visualização de centro de custo
document.addEventListener("DOMContentLoaded", async () => {
    // Esconder o loader quando a página estiver carregada
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('d-none');
    }
    
    // Obter o ID do centro de custo da URL
    const urlParams = new URLSearchParams(window.location.search);
    const costCenterId = urlParams.get('id');
    
    if (!costCenterId) {
        showAlert('Erro', 'ID do centro de custo não fornecido!', 'error');
        return;
    }
    
    // Carregar os dados do centro de custo
    await loadCostCenterData(costCenterId);
    
    // Configurar os botões de ação
    setupActionButtons(costCenterId);
});

// Função para definir o conteúdo de um elemento de forma segura
function setElementContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = content;
        return true;
    }
    console.warn(`Elemento com ID '${elementId}' não encontrado`);
    return false;
}

// Função para definir o atributo src de uma imagem de forma segura
function setImageSrc(elementId, src) {
    const element = document.getElementById(elementId);
    if (element) {
        element.src = src;
        return true;
    }
    console.warn(`Elemento de imagem com ID '${elementId}' não encontrado`);
    return false;
}

// Função para definir o innerHTML de um elemento de forma segura
function setElementHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = html;
        return true;
    }
    console.warn(`Elemento com ID '${elementId}' não encontrado`);
    return false;
}

// Função para carregar os dados do centro de custo
async function loadCostCenterData(id) {
    try {
        // Fazer a requisição para obter os dados do centro de custo
        const response = await fetch(`/api/zero-based-budgeting/getCostCenterView`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showAlert('Erro', result.message || 'Falha ao carregar os dados do centro de custo', 'error');
            return;
        }
        
        // Dados do centro de custo
        const data = result.data;
        
        // Preencher os campos da interface com os dados
        setElementContent('cost-center-id', data.id);
        setElementContent('cost-center-name', data.name);
        setElementContent('cost-center-name-display', data.name);
        setElementContent('cost-center-description', data.description || 'Sem descrição disponível');
        setElementContent('cost-center-created', formatDate(data.created_at));
        setElementContent('cost-center-updated', formatDate(data.updated_at));
        
        // Exibir informações dos responsáveis
        const responsibleList = document.getElementById('responsible-list');
        if (data.responsibleNames && data.responsibleNames.length > 0) {
            const responsibleHtml = data.responsibleNames.map((name, index) => `
                <div class="d-flex align-items-center mb-3">
                    <div class="me-3">
                        <span class="avatar avatar-xl">
                            <img src="https://cdn.conlinebr.com.br/colaboradores/${data.responsibleAvatars[index]}" alt="">
                        </span>
                    </div>
                    <div>
                        <h6>${name}</h6>
                    </div>
                </div>
            `).join('');
            responsibleList.innerHTML = responsibleHtml;
        } else {
            responsibleList.innerHTML = '<div class="text-muted">Sem responsáveis cadastrados</div>';
        }
        
        // Carregar solicitações de gastos relacionadas
        loadRelatedExpenseRequests(id);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar os dados do centro de custo', 'error');
    }
}

// Função para carregar solicitações de gastos relacionadas ao centro de custo
async function loadRelatedExpenseRequests(costCenterId) {
    try {
        const response = await fetch(`/api/zero-based-budgeting/getExpenseRequestsByCostCenter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cost_center_id: costCenterId })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Falha ao carregar solicitações relacionadas:', result.message);
            return;
        }
        
        const expenseRequests = result.data;
        const tableBody = document.getElementById('related-expenses-body');
        
        if (!tableBody) {
            console.warn('Elemento de tabela não encontrado (ID: related-expenses-body)');
            return;
        }
        
        if (expenseRequests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma solicitação encontrada</td></tr>';
            return;
        }
        
        let html = '';
        
        expenseRequests.forEach(request => {
            // Definir a classe do badge com base no status
            let statusClass = 'badge-secondary';
            
            switch(request.status) {
                case 'Pendente':
                    statusClass = 'badge-pending';
                    break;
                case 'Aprovado':
                    statusClass = 'badge-approved';
                    break;
                case 'Rejeitado':
                    statusClass = 'badge-rejected';
                    break;
                case 'Aprovação Parcial':
                    statusClass = 'badge-partial';
                    break;
            }
            
            html += `
                <tr>
                    <td>${request.id}</td>
                    <td>${request.month}</td>
                    <td>${request.category}</td>
                    <td class="text-right">R$ ${parseFloat(request.amount).toFixed(2).replace('.', ',')}</td>
                    <td class="text-center"><span class="badge ${statusClass}">${request.status}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary view-expense-btn" data-id="${request.id}" 
                            title="Visualizar Solicitação">
                            <i class="ri-eye-line"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
        // Adicionar event listeners para os botões
        addExpenseButtonsListeners();
        
    } catch (error) {
        console.error('Erro ao carregar solicitações relacionadas:', error);
    }
}

// Adicionar event listeners para os botões de visualização e edição de solicitações
function addExpenseButtonsListeners() {
    // Botões de visualização
    const viewButtons = document.querySelectorAll('.view-expense-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const expenseId = this.getAttribute('data-id');
            window.open(`/app/administration/zero-based-budgeting/view-expense-request.html?id=${expenseId}`, '_blank');
        });
    });
    
    // Botões de edição
    const editButtons = document.querySelectorAll('.edit-expense-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const expenseId = this.getAttribute('data-id');
            window.open(`/app/administration/zero-based-budgeting/edit-expense-request.html?id=${expenseId}`, '_blank');
        });
    });
}

// Configurar os botões de ação
function setupActionButtons(costCenterId) {
    // Botão para voltar
    const backButton = document.getElementById('back-btn');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.close();
        });
    }
    
    // Botão para imprimir
    const printButton = document.getElementById('print-btn');
    if (printButton) {
        printButton.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Botão para editar
    const editButton = document.getElementById('edit-btn');
    if (editButton) {
        editButton.addEventListener('click', function() {
            window.open(`/app/administration/zero-based-budgeting/edit-cost-center.html?id=${costCenterId}`, '_blank');
        });
    }
    
    // Botão para nova solicitação de gasto
    const newExpenseButton = document.getElementById('new-expense-btn');
    if (newExpenseButton) {
        newExpenseButton.addEventListener('click', function() {
            window.open(`/app/administration/zero-based-budgeting/create-expense-request.html?costCenter=${costCenterId}`, '_blank');
        });
    }
}

// Formatar data no padrão brasileiro
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    // Verifica se a data já está no formato brasileiro (DD/MM/YYYY HH:MM:SS)
    const brDatePattern = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;
    if (brDatePattern.test(dateString)) {
        return dateString;
    }
    
    // Se não estiver no formato brasileiro, tenta converter
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'Data inválida';
    }
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
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
} 