// Variaveis globais para gerenciamento de selects com o Choices
let sMonth, sCostCenter, sCategory;

// Script para a página de edição de solicitação de gasto
document.addEventListener("DOMContentLoaded", async () => {
    // Obter o ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    const expenseRequestId = urlParams.get('id');
    
    if (!expenseRequestId) {
        showAlert('Erro', 'ID da solicitação não fornecido!', 'error');
        return;
    }

    try {
        // Exibir loader
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.classList.remove('d-none');
        }
        
        // 1. Inicializar os selects com Choices.js
        await initializeSelects();
        
        // 2. Carregar os dados da solicitação e preencher o formulário
        await loadExpenseRequestData(expenseRequestId);
        
        // 3. Configurar os botões e o formulário
        setupForm(expenseRequestId);
        
        // Esconder o loader quando tudo estiver carregado
        if (loader) {
            loader.classList.add('d-none');
        }
    } catch (error) {
        console.error('Erro na inicialização da página:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar a página', 'error');
        
        // Esconder loader em caso de erro
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.classList.add('d-none');
        }
    }
});

// Função para carregar as categorias ativas da API
async function loadCategories() {
    try {
        const response = await fetch('/api/zero-based-budgeting/getActiveCategories');
        const result = await response.json();
        
        if (!result.success) {
            console.error('Erro ao carregar categorias:', result.message);
            return;
        }
        
        const categories = result.data;
        
        // Verificar se já existe um select de categorias
        const existingCategorySelect = document.querySelector('#category-select');
        if (existingCategorySelect && existingCategorySelect._choice) {
            existingCategorySelect._choice.destroy();
        }
        
        // Limpar qualquer opção existente
        if (existingCategorySelect) {
            existingCategorySelect.innerHTML = '';
        }
        
        // Adicionar as categorias como opções
        const selectElement = existingCategorySelect || document.createElement('select');
        
        // Formatar as categorias para o Choices.js
        const formattedCategories = categories.map(category => ({
            value: category.id.toString(),
            label: category.name
        }));
        
        // Inicializar o Choices.js para o select de categoria
        const categorySelect = new Choices(selectElement, {
            searchEnabled: true,
            itemSelectText: '',
            shouldSort: false,
            allowHTML: true,
            choices: formattedCategories
        });
        
        // Guardar referência para uso posterior
        if (existingCategorySelect) {
            existingCategorySelect._choice = categorySelect;
        }
        
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Função para inicializar os selects com Choices.js
function initializeSelects() {
    // Inicializa o select para centro de custo
    loadCostCenters()
        .then(() => {
            // Depois de carregar os centros de custo, carrega as categorias
            loadCategories();
        })
        .catch((error) => {
            console.error('Erro ao inicializar selects:', error);
        });
        
    // Inicializa o select para modo de pagamento
    const paymentModeSelect = document.getElementById('payment-mode-select');
    if (paymentModeSelect) {
        new Choices(paymentModeSelect, {
            searchEnabled: false,
            itemSelectText: '',
            shouldSort: false
        });
    }
}

// Função para carregar a lista de centros de custo
async function loadCostCenters() {
    try {
        // Obter as informações do usuário logado
        const user = await getInfosLogin();
        
        // Fazer a requisição para obter os centros de custo
        const costCenters = await makeRequest(`/api/zero-based-budgeting/getCostCentersByUser?id_collaborator=${user.system_collaborator_id}`);
        
        if (!costCenters || costCenters.length === 0) {
            console.error('Falha ao carregar centros de custo');
            return;
        }
        
        // Formata o array para ser usado com o Choices.js
        const listaDeOpcoes = costCenters.map(function (element) {
            return {
                value: `${element.id}`,
                label: `${element.name}`,
            };
        });
        
        // Verifica se o select já existe, caso exista destroi
        if (sCostCenter) {
            sCostCenter.destroy();
        }
        
        // Renderiza o select com as opções formatadas
        sCostCenter = new Choices('#cost-center', {
            choices: listaDeOpcoes,
            shouldSort: false,
            removeItemButton: false,
            noChoicesText: 'Não há opções disponíveis',
        });
        
        console.log('Centros de custo carregados:', costCenters.length);
        
    } catch (error) {
        console.error('Erro ao carregar centros de custo:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar a lista de centros de custo', 'error');
    }
}

// Função para carregar os dados da solicitação de gasto
async function loadExpenseRequestData(id) {
    try {
        // Fazer a requisição para obter os dados da solicitação usando método POST
        const data = await makeRequest(`/api/zero-based-budgeting/getExpenseRequestView`, 'POST', { id: id });
        
        if (!data) {
            showAlert('Erro', 'Não foi possível carregar os dados da solicitação', 'error');
            return;
        }
        
        console.log('Dados carregados:', data);
        
        // Verificar se a solicitação pode ser editada (apenas solicitações pendentes)
        if (data.status !== 'Pendente') {
            showAlert('Aviso', 'Apenas solicitações com status Pendente podem ser editadas.', 'warning');
            
            // Desabilitar o formulário
            const form = document.getElementById('edit-expense-request-form');
            if (form) {
                const inputs = form.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.disabled = true);
                
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;
            }
            
            return;
        }
        
        // Preencher os campos do formulário com os dados
        document.getElementById('expense-request-id').value = data.id;
        document.getElementById('description').value = data.description || '';
        document.getElementById('quantity').value = data.quantity || 1;
        
        // Formatar o valor removendo a formatação de moeda, se necessário
        let amountValue = data.raw_amount || data.amount;
        if (typeof amountValue === 'string' && amountValue.includes('R$')) {
            // Remover formatação de moeda
            amountValue = amountValue.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        }
        document.getElementById('amount').value = amountValue;
        
        document.getElementById('strategic-contribution').value = data.strategic_contribution || '';
        
        // Definir os valores dos selects usando as instâncias do Choices.js
        
        // Selecionar o centro de custo no dropdown
        if (sCostCenter) {
            sCostCenter.setChoiceByValue(data.cost_center_id.toString());
            console.log('Centro de custo selecionado:', data.cost_center_id);
        }
        
        // Selecionar o mês no dropdown
        if (sMonth) {
            sMonth.setChoiceByValue(data.month);
            console.log('Mês selecionado:', data.month);
        }
        
        // Selecionar a categoria no dropdown
        if (sCategory) {
            sCategory.setChoiceByValue(data.category);
            console.log('Categoria selecionada:', data.category);
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar os dados da solicitação', 'error');
    }
}

// Configurar o formulário e os botões
function setupForm(expenseRequestId) {
    // Botões para cancelar
    const cancelButtons = document.querySelectorAll('#cancel-btn, #cancel-btn-bottom');
    cancelButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', function() {
                window.close();
            });
        }
    });
    
    // Formulário de edição
    const form = document.getElementById('edit-expense-request-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Verificar se os campos obrigatórios foram preenchidos
            const costCenterId = sCostCenter ? sCostCenter.getValue().value : null;
            const month = sMonth ? sMonth.getValue().value : null;
            const category = sCategory ? sCategory.getValue().value : null;
            const description = document.getElementById('description').value.trim();
            const quantity = document.getElementById('quantity').value;
            const amount = document.getElementById('amount').value;
            
            if (!costCenterId || !month || !category || !description || !quantity || !amount) {
                showAlert('Erro', 'Por favor, preencha todos os campos obrigatórios', 'error');
                return;
            }
            
            // Obter os dados do formulário
            const strategicContribution = document.getElementById('strategic-contribution').value.trim();
            
            try {
                // Obter as informações do usuário logado
                const userLogged = await getInfosLogin();
                
                // Exibir loader durante o processamento
                const loader = document.querySelector('.page-loader');
                if (loader) {
                    loader.classList.remove('d-none');
                }
                
                // Enviar dados para atualização
                const result = await makeRequest('/api/zero-based-budgeting/updateExpenseRequest', 'POST', {
                    id: expenseRequestId,
                    cost_center_id: costCenterId,
                    month: month,
                    category: category,
                    description: description,
                    quantity: parseInt(quantity),
                    amount: parseFloat(amount),
                    strategic_contribution: strategicContribution,
                    requester_id: userLogged.system_collaborator_id
                });
                
                // Esconder loader após o processamento
                if (loader) {
                    loader.classList.add('d-none');
                }
                
                if (result && result.success) {
                    Swal.fire({
                        title: 'Sucesso',
                        text: 'Solicitação de gasto atualizada com sucesso!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        // Recarregar a página que abriu esta
                        if (window.opener && !window.opener.closed) {
                            window.opener.location.reload();
                        }
                        window.close();
                    });
                } else {
                    showAlert('Erro', result?.message || 'Falha ao atualizar a solicitação de gasto', 'error');
                }
                
            } catch (error) {
                console.error('Erro ao atualizar solicitação de gasto:', error);
                showAlert('Erro', 'Ocorreu um erro ao atualizar a solicitação de gasto', 'error');
                
                // Esconder loader em caso de erro
                const loader = document.querySelector('.page-loader');
                if (loader) {
                    loader.classList.add('d-none');
                }
            }
        });
    }
}

// Função genérica para fazer requisições
async function makeRequest(url, method = 'GET', data = null) {
    try {
        console.log(`Fazendo requisição: ${method} ${url}`, data);
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`Resposta da requisição ${url}:`, result);
        
        if (method === 'POST') {
            if (url.includes('getExpenseRequestView')) {
                // Esta API retorna o dado no objeto 'data'
                return result.data || result;
            }
            return result;
        } else {
            return result.data || result;
        }
    } catch (error) {
        console.error('Erro ao fazer requisição:', error);
        showAlert('Erro', 'Ocorreu um erro na comunicação com o servidor', 'error');
        return null;
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