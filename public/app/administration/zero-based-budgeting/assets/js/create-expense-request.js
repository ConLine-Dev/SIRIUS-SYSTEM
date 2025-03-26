// Variaveis globais para gerenciamento de selects com o Choices
let sMonth, sYear, sCostCenter;
let itemCategories = []; // Array para armazenar as instâncias de Choices para categorias dos itens

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializa os selects com Choices.js
    await initializeSelects();
    
    // Configura os eventos de clique
    await eventClick();
    
    // Define o mês atual como padrão
    setCurrentMonth();
    
    // Define o ano atual como padrão
    setCurrentYear();
    
    // Inicializa os eventos para os itens
    initializeItemEvents();
});

// Inicializa os selects com a biblioteca Choices.js
async function initializeSelects() {
    // Select de Mês
    sMonth = new Choices('select[name="month"]', {
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
    });
    
    // Select de Ano
    sYear = new Choices('select[name="year"]', {
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
    });
    
    // Preencher as opções de anos (atual + 3 anos para frente e 2 para trás)
    populateYearOptions();
    
    // Select de Centro de Custo
    await loadCostCenters();
    
    // Carrega as categorias para o primeiro item
    await loadItemCategories();
}

// Preenche as opções do select de ano
function populateYearOptions() {
    const currentYear = new Date().getFullYear();
    
    // Criar array com os anos de 2021 até o ano atual + 1
    const years = [];
    for (let i = 2021; i <= currentYear + 1; i++) {
        years.push({
            value: i.toString(),
            label: i.toString()
        });
    }
    
    // Adicionar as opções ao select
    sYear.setChoices(years, 'value', 'label', true);
}

// Carrega os centros de custo do usuário logado
async function loadCostCenters() {
    const user = await getInfosLogin();
    const costCenters = await makeRequest(`/api/zero-based-budgeting/getCostCentersByUser?id_collaborator=${user.system_collaborator_id}`);
    
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
    sCostCenter = new Choices('select[name="cost_center"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
    });
}

// Função para carregar as categorias ativas da API para os itens
async function loadItemCategories() {
    try {
        const response = await makeRequest('/api/zero-based-budgeting/getActiveCategories');
        
        if (!response) {
            console.error('Erro ao carregar categorias: resposta vazia');
            showAlert('Erro', 'Falha ao carregar categorias. Por favor, tente novamente.', 'error');
            return;
        }
        
        const categories = response;
        console.log('Categorias carregadas:', categories);
        
        // Formatar as categorias para o Choices.js
        const formattedCategories = categories.map(category => ({
            value: category.id.toString(),
            label: category.name
        }));
        
        // Inicializar os Choices.js para cada select de categoria existente
        const categorySelects = document.querySelectorAll('.item-category');
        
        // Limpar array existente
        itemCategories = [];
        
        categorySelects.forEach((select, index) => {
            // Adicionar o choices.js para o select
            const choiceInstance = new Choices(select, {
                choices: formattedCategories,
                searchEnabled: true,
                itemSelectText: '',
                shouldSort: false,
                noChoicesText: 'Não há categorias disponíveis',
            });
            
            // Armazenar a instância no array
            itemCategories.push(choiceInstance);
        });
        
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar as categorias. Por favor, tente novamente.', 'error');
    }
}

// Define o mês atual como padrão
function setCurrentMonth() {
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const currentMonth = new Date().getMonth();
    sMonth.setChoiceByValue(monthNames[currentMonth]);
}

// Define o ano atual como padrão
function setCurrentYear() {
    const currentYear = new Date().getFullYear().toString();
    sYear.setChoiceByValue(currentYear);
}

// Inicializa os eventos para os itens
function initializeItemEvents() {
    // Adicionar um item
    document.getElementById('add-item-btn').addEventListener('click', addNewItem);
    
    // Eventos para o primeiro item (já existente no carregamento)
    setupItemListeners(document.querySelector('.item-row'));
    
    // Calcular o subtotal inicial para o primeiro item
    updateSubtotal(document.querySelector('.item-row'));
    
    // Atualizar o total geral
    updateTotalAmount();
}

// Configurar os listeners para um item
function setupItemListeners(itemRow) {
    const quantityInput = itemRow.querySelector('.item-quantity');
    const amountInput = itemRow.querySelector('.item-amount');
    const removeBtn = itemRow.querySelector('.remove-item-btn');
    
    // Evento para atualizar o subtotal quando a quantidade ou valor mudar
    quantityInput.addEventListener('input', () => {
        updateSubtotal(itemRow);
        updateTotalAmount();
    });
    
    amountInput.addEventListener('input', () => {
        updateSubtotal(itemRow);
        updateTotalAmount();
    });
    
    // Evento para remover o item
    removeBtn.addEventListener('click', () => {
        itemRow.remove();
        updateTotalAmount();
        
        // Se só sobrou um item, desabilitar o botão de remover
        const itemRows = document.querySelectorAll('.item-row');
        if (itemRows.length === 1) {
            itemRows[0].querySelector('.remove-item-btn').setAttribute('disabled', 'disabled');
        }
    });
}

// Atualizar o subtotal de um item
function updateSubtotal(itemRow) {
    const quantity = parseFloat(itemRow.querySelector('.item-quantity').value) || 0;
    const amount = parseFloat(itemRow.querySelector('.item-amount').value) || 0;
    const subtotal = quantity * amount;
    
    itemRow.querySelector('.item-subtotal').value = subtotal.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Atualizar o valor total da solicitação
function updateTotalAmount() {
    const itemRows = document.querySelectorAll('.item-row');
    let total = 0;
    
    itemRows.forEach(row => {
        const subtotalText = row.querySelector('.item-subtotal').value;
        const subtotal = parseFloat(subtotalText.replace(/\./g, '').replace(',', '.')) || 0;
        total += subtotal;
    });
    
    document.getElementById('total-amount').textContent = total.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Adicionar um novo item
function addNewItem() {
    const itemsContainer = document.getElementById('items-container');
    const newItem = document.createElement('div');
    newItem.className = 'item-row mb-3';
    
    // Gerar um ID único para os selects
    const uniqueId = Date.now();
    
    newItem.innerHTML = `
        <div class="row">
            <div class="col-lg-3 col-md-6 mb-2">
                <label class="form-label">Categoria</label>
                <select class="form-control item-category" id="category-${uniqueId}" required>
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
                <input type="number" class="form-control item-amount" min="0.01" step="0.01" placeholder="0,00" required>
            </div>
            <div class="col-lg-2 col-md-4 mb-2">
                <label class="form-label">Subtotal</label>
                <div class="input-group">
                    <input type="text" class="form-control item-subtotal" readonly>
                    <button type="button" class="btn btn-danger remove-item-btn"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
        </div>
    `;
    
    itemsContainer.appendChild(newItem);
    
    // Inicializar o Choices.js para o novo select de categoria
    const response = makeRequest('/api/zero-based-budgeting/getActiveCategories');
    response.then(categories => {
        if (categories) {
            const formattedCategories = categories.map(category => ({
                value: category.id.toString(),
                label: category.name
            }));
            
            const choiceInstance = new Choices(`#category-${uniqueId}`, {
                choices: formattedCategories,
                searchEnabled: true,
                itemSelectText: '',
                shouldSort: false,
                noChoicesText: 'Não há categorias disponíveis',
            });
            
            itemCategories.push(choiceInstance);
        }
    });
    
    // Configurar os listeners para o novo item
    setupItemListeners(newItem);
    
    // Habilitar todos os botões de remover quando houver mais de um item
    const removeButtons = document.querySelectorAll('.remove-item-btn');
    removeButtons.forEach(btn => {
        btn.removeAttribute('disabled');
    });
    
    // Atualizar o subtotal do novo item
    updateSubtotal(newItem);
    
    // Atualizar o total geral
    updateTotalAmount();
}

// Obter o objeto do formulário
async function getForm() {
    // Recuperar valores dos inputs e selects
    const [inputsValues, selectsValues] = await Promise.all([
        getValuesFromInputs(),
        getValuesFromSelects()
    ]);
    
    // Verificação de campos
    if (!selectsValues.month) {
        showAlert('Atenção', 'O mês de referência é obrigatório', 'warning');
        return null;
    }
    
    if (!selectsValues.year) {
        showAlert('Atenção', 'O ano de referência é obrigatório', 'warning');
        return null;
    }
    
    if (!selectsValues.cost_center_id) {
        showAlert('Atenção', 'O centro de custo é obrigatório', 'warning');
        return null;
    }
    
    if (!inputsValues.items || !inputsValues.items.length) {
        showAlert('Atenção', 'Adicione pelo menos um item à solicitação', 'warning');
        return null;
    }
    
    for (const item of inputsValues.items) {
        if (!item.category) {
            showAlert('Atenção', 'A categoria é obrigatória para todos os itens', 'warning');
            return null;
        }
        
        if (!item.description.trim()) {
            showAlert('Atenção', 'A descrição é obrigatória para todos os itens', 'warning');
            return null;
        }
        
        if (item.quantity <= 0) {
            showAlert('Atenção', 'A quantidade deve ser maior que zero para todos os itens', 'warning');
            return null;
        }
        
        if (item.amount <= 0) {
            showAlert('Atenção', 'O valor unitário deve ser maior que zero para todos os itens', 'warning');
            return null;
        }
    }
    
    // Construir o objeto do formulário
    const baseForm = {
        month: selectsValues.month,
        year: selectsValues.year,
        cost_center_id: selectsValues.cost_center_id,
        strategic_contribution: inputsValues.strategic_contribution,
        items: inputsValues.items
    };
    
    // Adicionar o ID do usuário logado (solicitante)
    const userLogged = await getInfosLogin();
    return {
        ...baseForm,
        requester_id: userLogged.system_collaborator_id
    };
}

// Obter valores dos inputs
async function getValuesFromInputs() {
    // Obter valores dos campos de texto/textarea
    const strategicContribution = document.querySelector('textarea[name="strategic_contribution"]').value.trim();
    
    // Coletar os itens da solicitação
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');
    
    itemRows.forEach(row => {
        const categorySelect = row.querySelector('.item-category');
        const categoryId = categorySelect.value;
        
        const description = row.querySelector('.item-description').value.trim();
        const quantity = parseInt(row.querySelector('.item-quantity').value) || 0;
        const amount = parseFloat(row.querySelector('.item-amount').value) || 0;
        
        const item = {
            category: categoryId,
            description: description,
            quantity: quantity,
            amount: amount
        };
        
        items.push(item);
    });
    
    return {
        strategic_contribution: strategicContribution,
        items: items
    };
}

// Obter valores dos selects
async function getValuesFromSelects() {
    let selectValues = {};
    
    // Obter os valores dos selects definidos
    let selectNames = [
        { name: 'month', message: 'O campo MÊS DE REFERÊNCIA é obrigatório.' },
        { name: 'year', message: 'O campo ANO DE REFERÊNCIA é obrigatório.' },
        { name: 'cost_center', message: 'O campo CENTRO DE CUSTO é obrigatório.' }
    ];
    
    for (const select of selectNames) {
        const value = await getSelectValues(select.name);
        if (select.name === 'cost_center') {
            selectValues['cost_center_id'] = value;
        } else {
            selectValues[select.name] = value;
        }
    }
    
    return selectValues;
}

// Função auxiliar para obter valores de selects
async function getSelectValues(selectName) {
    const select = document.querySelector(`select[name="${selectName}"]`);
    if (!select) return null;
    
    // Retornar o valor selecionado
    return select.value;
}

// Configurar os eventos de clique
async function eventClick() {
    // Botão de salvar
    document.getElementById('btn-save').addEventListener('click', async () => {
        // Obter os dados do formulário
        const formData = await getForm();
        
        if (!formData) {
            return; // Se retornou null, houve algum erro nos dados
        }
        
        console.log('Dados da solicitação a ser enviada:', formData);
        
        // Mostrar indicador de carregamento
        Swal.fire({
            title: 'Enviando solicitação...',
            text: 'Por favor, aguarde enquanto processamos sua solicitação.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });
        
        try {
            // Enviar a solicitação para a API
            const result = await makeRequest(`/api/zero-based-budgeting/createExpenseRequest`, 'POST', formData);
            
            if (result) {
                Swal.fire({
                    title: 'Solicitação Registrada!',
                    text: 'Sua solicitação de gasto foi registrada com sucesso e será analisada pelos aprovadores.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    window.close();
                });
            }
        } catch (error) {
            console.error('Erro ao enviar solicitação:', error);
            Swal.fire({
                title: 'Erro',
                text: 'Ocorreu um erro ao enviar a solicitação. Por favor, tente novamente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    });
}

// Obtém informações do usuário logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
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
        
        if (response.ok) {
            const result = await response.json();
            return result.data || result;
        } else {
            const errorText = await response.text();
            console.error(`Erro na requisição (${response.status}): ${errorText}`);
            
            let errorMessage = 'Ocorreu um erro na requisição.';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                // Se não for um JSON válido, usa o texto puro
                errorMessage = errorText || errorMessage;
            }
            
            Swal.fire({
                title: 'Erro',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'OK'
            });
            
            return null;
        }
    } catch (error) {
        console.error('Erro ao fazer requisição:', error);
        
        Swal.fire({
            title: 'Erro',
            text: 'Ocorreu um erro na comunicação com o servidor. Por favor, tente novamente mais tarde.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        
        return null;
    }
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
