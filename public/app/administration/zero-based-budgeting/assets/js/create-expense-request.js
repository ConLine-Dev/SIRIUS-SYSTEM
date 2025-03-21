// Variaveis globais para gerenciamento de selects com o Choices
let sMonth, sCostCenter, sCategory;

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializa os selects com Choices.js
    await initializeSelects();
    
    // Configura os eventos de clique
    await eventClick();
    
    // Define o mês atual como padrão
    setCurrentMonth();
});

// Inicializa os selects com a biblioteca Choices.js
async function initializeSelects() {
    // Select de Mês
    sMonth = new Choices('select[name="month"]', {
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
    });
    
    // Select de Centro de Custo
    await loadCostCenters();
    
    // Select de Categoria
    await loadCategories();
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

// Função para carregar as categorias ativas da API
async function loadCategories() {
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
        
        // Verificar se já existe uma instância do Choices
        if (sCategory) {
            sCategory.destroy();
        }
        
        // Inicializar o Choices.js para o select de categoria
        sCategory = new Choices('select[name="category"]', {
            choices: formattedCategories,
            searchEnabled: true,
            itemSelectText: '',
            shouldSort: false,
            noChoicesText: 'Não há categorias disponíveis',
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

// Esta função coleta dados do formulário e faz a requisição para criar uma nova solicitação de gasto
async function getForm() {
    const maxDescriptionLength = 200; // Limite de caracteres para a descrição
    
    const form = {
        month: document.querySelector('select[name="month"]').value,
        cost_center_id: document.querySelector('select[name="cost_center"]').value,
        category: document.querySelector('select[name="category"]').value,
        description: document.querySelector('input[name="description"]').value,
        quantity: document.querySelector('input[name="quantity"]').value,
        amount: document.querySelector('input[name="amount"]').value,
        strategic_contribution: document.querySelector('textarea[name="strategic_contribution"]').value,
        status: 'Pendente', // Status inicial
        requester_id: (await getInfosLogin()).system_collaborator_id, // ID do solicitante
        approvals: [] // Array vazio para armazenar as aprovações
    };
    
    // Verifica se a descrição ultrapassa o limite de caracteres
    if (form.description.length > maxDescriptionLength) {
        Swal.fire(`A descrição deve ter no máximo ${maxDescriptionLength} caracteres.`);
        return; // Interrompe a execução se a descrição ultrapassar o limite
    }
    
    const result = await makeRequest(`/api/zero-based-budgeting/createExpenseRequest`, 'POST', form);
    
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
}

// Função para verificar se os campos obrigatórios estão preenchidos
async function getValuesFromInputs() {
    // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
    let requiredInputFields = [
        { name: 'description', message: 'O campo DESCRIÇÃO DO GASTO é obrigatório.' },
        { name: 'quantity', message: 'O campo QUANTIDADE é obrigatório.' },
        { name: 'amount', message: 'O campo VALOR é obrigatório.' },
        { name: 'strategic_contribution', message: 'O campo CONTRIBUIÇÃO PARA A ESTRATÉGIA DA EMPRESA é obrigatório.' }
    ];
    
    const elements = document.querySelectorAll('.form-control[name]');
    let allValid = true;
    
    for (let index = 0; index < elements.length; index++) {
        const item = elements[index];
        const itemName = item.getAttribute('name');
        
        // Verificar se o campo está no array de campos obrigatórios e se está vazio
        const requiredField = requiredInputFields.find(field => field.name === itemName);
        if (requiredField && (item.value.trim() === '' || item.value.trim() === '0')) {
            Swal.fire(requiredField.message);
            allValid = false;
            break;
        }
    }
    
    return allValid;
}

// Função para obter valores de qualquer select
async function getSelectValues(selectName) {
    const selectElement = document.querySelector(`select[name="${selectName}"]`);
    if (selectElement) {
        const selectedOptions = Array.from(selectElement.selectedOptions);
        if (!selectedOptions || selectedOptions.length === 0 || selectedOptions[0].value === '') {
            return undefined;
        } else {
            const selectedValues = selectedOptions.map(option => option.value);
            return selectedValues;
        }
    } else {
        return undefined;
    }
}

// Função para verificar se os selects obrigatórios estão preenchidos
async function getValuesFromSelects() {
    // Array com os names dos selects que não devem ficar em branco e suas mensagens personalizadas
    let selectNames = [
        { name: 'month', message: 'O campo MÊS DE REFERÊNCIA é obrigatório.' },
        { name: 'cost_center', message: 'O campo CENTRO DE CUSTO é obrigatório.' },
        { name: 'category', message: 'O campo CATEGORIA DE GASTO é obrigatório.' }
    ];
    
    let allValid = true;
    
    for (let i = 0; i < selectNames.length; i++) {
        const selectName = selectNames[i];
        const values = await getSelectValues(selectName.name);
        if (!values || values.length === 0) {
            Swal.fire(`${selectName.message}`);
            allValid = false;
            break;
        }
    }
    
    return allValid;
}

// Esta função adiciona um evento de clique ao botão de salvar
async function eventClick() {
    // ==== Salvar ==== //
    document.getElementById('btn-save').addEventListener('click', async function (){
        const inputsValid = await getValuesFromInputs();
        const selectsValid = await getValuesFromSelects();
        
        if (inputsValid && selectsValid) {
            await getForm();
        }
    });
    // ==== /Salvar ==== //
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
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`Resposta da requisição ${url}:`, result);
        
        if (method === 'POST') {
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