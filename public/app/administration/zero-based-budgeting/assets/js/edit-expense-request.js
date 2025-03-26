// Variaveis globais para gerenciamento de selects com o Choices
let sMonth, sCostCenter, sCategory;

// Script para a página de edição de solicitações de gastos
document.addEventListener("DOMContentLoaded", async () => {
    // Esconder o loader quando a página estiver carregada
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('d-none');
    }
    
    // Obter o ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');
    
    if (!requestId) {
        showAlert('Erro', 'ID da solicitação não fornecido!', 'error');
        return;
    }

    // Preencher as opções de ano
    populateYearOptions();
    
    // Carregar os centros de custo
    await loadCostCenters();
    
    // Carregar as categorias
    await loadCategories();
    
    // Carregar os dados da solicitação
    await loadExpenseRequestData(requestId);
    
    // Configurar os eventos
    setupEventListeners();
});

// Função para preencher as opções do select de ano
function populateYearOptions() {
    const yearSelect = document.getElementById('year');
    const currentYear = new Date().getFullYear();
    
    // Limpar opções existentes, mantendo apenas a primeira
    while (yearSelect.options.length > 1) {
        yearSelect.remove(1);
    }
    
    // Adicionar anos de 2021 até o ano atual + 1
    for (let i = 2021; i <= currentYear + 1; i++) {
        const option = new Option(i.toString(), i.toString());
        yearSelect.add(option);
    }
}

// Função para carregar os centros de custo
async function loadCostCenters() {
    try {
        // Obter as informações do usuário logado
        const user = await getInfosLogin();
        
        // Fazer a requisição para obter os centros de custo
        const response = await fetch(`/api/zero-based-budgeting/getCostCentersByUser?id_collaborator=${user.system_collaborator_id}`);
        const result = await response.json();
        
        if (result.success) {
            const costCenterSelect = document.getElementById('cost-center');
            result.data.forEach(costCenter => {
                const option = new Option(costCenter.name, costCenter.id);
                costCenterSelect.add(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar centros de custo:', error);
        showAlert('Erro', 'Falha ao carregar os centros de custo', 'error');
    }
}

// Função para carregar as categorias
async function loadCategories() {
    try {
        const response = await fetch('/api/zero-based-budgeting/getActiveCategories');
        const result = await response.json();
        
        if (result.success) {
            window.categoriesList = result.data;
            populateCategorySelects();
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showAlert('Erro', 'Falha ao carregar as categorias', 'error');
    }
}

// Função para popular os selects de categoria
function populateCategorySelects() {
    const categorySelects = document.querySelectorAll('.item-category');
    categorySelects.forEach(select => {
        if (select.options.length <= 1) { // Se ainda não foi populado
            window.categoriesList.forEach(category => {
                const option = new Option(category.name, category.id);
                select.add(option);
            });
        }
    });
}

// Função para carregar os dados da solicitação
async function loadExpenseRequestData(id) {
    try {
        const response = await fetch(`/api/zero-based-budgeting/getExpenseRequestView`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showAlert('Erro', result.message || 'Falha ao carregar os dados da solicitação', 'error');
            return;
        }
        
        // Dados da solicitação
        const data = result.data;
        console.log('Dados recebidos:', data); // Debug
        
        // Preencher os campos do formulário
        document.getElementById('expense-request-id').value = data.id;
        document.getElementById('month').value = data.month;
        document.getElementById('year').value = data.year;
        document.getElementById('cost-center').value = data.cost_center_id;
        document.getElementById('strategic-contribution').value = data.strategic_contribution || '';
        
        // Limpar o container de itens
        const itemsContainer = document.getElementById('items-container');
        itemsContainer.innerHTML = '';
        
        // Adicionar os itens existentes
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach(item => {
                console.log('Item a ser formatado:', item); // Debug
                
                // Remover formatação de moeda se necessário
                let amount = item.amount;
                if (typeof amount === 'string') {
                    amount = amount.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
                }
                amount = parseFloat(amount);
                
                // Formatar o item antes de passar para addItemRow
                const formattedItem = {
                    category: item.category_id || item.category,
                    description: item.description,
                    quantity: parseFloat(item.quantity) || 1,
                    amount: amount,
                    categoryName: item.category_name || ''
                };
                console.log('Item formatado:', formattedItem); // Debug
                addItemRow(formattedItem);
            });
        } else {
            // Adicionar pelo menos uma linha de item
            addItemRow();
        }
        
        // Calcular o total
        calculateTotal();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar os dados da solicitação', 'error');
    }
}

// Função para adicionar uma nova linha de item
function addItemRow(itemData = null) {
    const itemsContainer = document.getElementById('items-container');
    const newRow = document.createElement('div');
    newRow.className = 'item-row mb-3';
    
    newRow.innerHTML = `
        <div class="row">
            <div class="col-lg-3 col-md-6 mb-2">
                <label class="form-label">Categoria</label>
                <select class="form-control item-category" required>
                    <option value="">Selecione a categoria</option>
                </select>
            </div>
            <div class="col-lg-3 col-md-6 mb-2">
                <label class="form-label">Descrição</label>
                <input type="text" class="form-control item-description" placeholder="Descreva o item" required>
            </div>
            <div class="col-lg-2 col-md-4 mb-2">
                <label class="form-label">Quantidade</label>
                <input type="number" class="form-control item-quantity" min="1" value="1" required>
            </div>
            <div class="col-lg-2 col-md-4 mb-2">
                <label class="form-label">Valor Unitário (R$)</label>
                <input type="text" class="form-control item-amount" placeholder="0,00" required>
            </div>
            <div class="col-lg-2 col-md-4 mb-2">
                <label class="form-label">Subtotal</label>
                <div class="input-group">
                    <input type="text" class="form-control item-subtotal" readonly>
                    <button type="button" class="btn btn-danger remove-item-btn" ${itemsContainer.children.length === 0 ? 'disabled' : ''}>
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar a nova linha ao container
    itemsContainer.appendChild(newRow);
    
    // Popular o select de categorias
    const categorySelect = newRow.querySelector('.item-category');
    if (window.categoriesList) {
        window.categoriesList.forEach(category => {
            const option = new Option(category.name, category.id);
            categorySelect.add(option);
        });
    }
    
    // Se houver dados do item, preencher os campos
    if (itemData) {
        // Definir a categoria
        categorySelect.value = itemData.category;
        
        // Preencher os outros campos
        newRow.querySelector('.item-description').value = itemData.description || '';
        newRow.querySelector('.item-quantity').value = itemData.quantity || 1;
        
        // Formatar o valor unitário
        const formattedAmount = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(itemData.amount || 0);
        newRow.querySelector('.item-amount').value = formattedAmount;
        
        // Calcular e exibir o subtotal
        calculateSubtotal(newRow);
    } else {
        // Para nova linha, inicializar o subtotal como 0
        newRow.querySelector('.item-subtotal').value = 'R$ 0,00';
    }
    
    // Configurar máscara para o campo de valor unitário
    const amountInput = newRow.querySelector('.item-amount');
    amountInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = (parseFloat(value) / 100).toFixed(2);
        e.target.value = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
        calculateSubtotal(newRow);
    });
    
    // Atualizar o estado dos botões de remoção
    updateRemoveButtons();
    
    // Adicionar os event listeners para os campos
    setupItemRowEvents(newRow);
}

// Função para configurar os eventos da linha de item
function setupItemRowEvents(row) {
    const quantityInput = row.querySelector('.item-quantity');
    const amountInput = row.querySelector('.item-amount');
    const removeButton = row.querySelector('.remove-item-btn');
    
    // Eventos para calcular o subtotal
    quantityInput.addEventListener('input', () => calculateSubtotal(row));
    amountInput.addEventListener('input', () => calculateSubtotal(row));
    
    // Evento para remover o item
    removeButton.addEventListener('click', () => {
        row.remove();
        updateRemoveButtons();
        calculateTotal();
    });
}

// Função para calcular o subtotal de uma linha
function calculateSubtotal(row) {
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const amountStr = row.querySelector('.item-amount').value;
    // Remover pontos e trocar vírgula por ponto para converter para número
    const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.')) || 0;
    
    const subtotal = quantity * amount;
    
    // Formatar o subtotal em reais
    const formattedSubtotal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(subtotal);
    
    row.querySelector('.item-subtotal').value = formattedSubtotal;
    
    // Armazenar o valor numérico para cálculos
    row.querySelector('.item-subtotal').dataset.value = subtotal;
    
    calculateTotal();
}

// Função para calcular o total geral
function calculateTotal() {
    const items = document.querySelectorAll('.item-row');
    let total = 0;
    
    items.forEach(item => {
        // Usar o valor numérico armazenado no dataset
        const subtotal = parseFloat(item.querySelector('.item-subtotal').dataset.value) || 0;
        total += subtotal;
    });
    
    // Formatar o total em reais
            const formattedTotal = new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(total);
            
    document.getElementById('total-amount').textContent = formattedTotal;
}

// Função para atualizar o estado dos botões de remoção
function updateRemoveButtons() {
    const items = document.querySelectorAll('.item-row');
    const removeButtons = document.querySelectorAll('.remove-item-btn');
    
    removeButtons.forEach(button => {
        button.disabled = items.length === 1;
    });
}

// Função para configurar os event listeners
function setupEventListeners() {
    // Botão para adicionar novo item
    document.getElementById('add-item-btn').addEventListener('click', () => {
        addItemRow();
        calculateTotal();
    });
    
    // Botão para salvar
    document.getElementById('btn-save').addEventListener('click', saveExpenseRequest);
    
    // Botão para cancelar
    document.getElementById('btn-cancel').addEventListener('click', () => {
        window.history.back();
    });
}

// Função para salvar a solicitação
async function saveExpenseRequest() {
    try {
        // Validar campos obrigatórios
        if (!validateForm()) {
            return;
        }
        
        const requestId = document.getElementById('expense-request-id').value;
        const month = document.getElementById('month').value;
        const year = document.getElementById('year').value;
        const costCenterId = document.getElementById('cost-center').value;
        const strategicContribution = document.getElementById('strategic-contribution').value;
        
        // Obter todos os itens
        const items = [];
        document.querySelectorAll('.item-row').forEach(row => {
            const category = row.querySelector('.item-category').value;
            const description = row.querySelector('.item-description').value;
            const quantity = row.querySelector('.item-quantity').value;
            const amount = row.querySelector('.item-amount').value.replace(/\./g, '').replace(',', '.');
            
            items.push({
                category,
                description,
                quantity,
                amount
            });
        });
        
        // Preparar os dados para envio
        const requestData = {
            id: requestId,
            month: month,
            year: year,
            cost_center_id: costCenterId,
            strategic_contribution: strategicContribution,
            items: items
        };
        
        // Enviar a requisição
        const response = await fetch('/api/zero-based-budgeting/updateExpenseRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            await Swal.fire({
                title: 'Sucesso',
                text: 'Solicitação atualizada com sucesso!',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            
            // Fechar a janela
            window.close();
            
            // Se a janela não fechar (alguns navegadores podem bloquear), tentar voltar
            setTimeout(() => {
                if (!window.closed) {
                    window.history.back();
                }
            }, 100);
        } else {
            showAlert('Erro', result.message || 'Falha ao atualizar a solicitação', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar solicitação:', error);
        showAlert('Erro', 'Ocorreu um erro ao salvar a solicitação', 'error');
    }
}

// Validar o formulário antes de enviar
function validateForm() {
    // Validar campos obrigatórios
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const costCenter = document.getElementById('cost-center').value;
    
    if (!month) {
        showAlert('Atenção', 'Selecione o mês de referência', 'warning');
        return false;
    }
    
    if (!year) {
        showAlert('Atenção', 'Selecione o ano de referência', 'warning');
        return false;
    }
    
    if (!costCenter) {
        showAlert('Atenção', 'Selecione o centro de custo', 'warning');
        return false;
    }
    
    let isValid = true;
    document.querySelectorAll('.item-row').forEach(row => {
        const category = row.querySelector('.item-category').value;
        const description = row.querySelector('.item-description').value;
        const quantity = row.querySelector('.item-quantity').value;
        const amount = row.querySelector('.item-amount').value;
        
        if (!category || !description || !quantity || !amount) {
            showAlert('Erro', 'Por favor, preencha todos os campos dos itens', 'error');
            isValid = false;
            return;
        }
    });
    
    return isValid;
}

// Função para exibir alertas
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