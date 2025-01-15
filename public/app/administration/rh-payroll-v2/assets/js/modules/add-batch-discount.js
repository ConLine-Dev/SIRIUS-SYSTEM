import { loadEmployees, loadTypes, showToast, makeRequest } from './utils.js';

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await listEmployees();
    await displayTypes();
    setupCurrencyInput();
    initializeEventListeners();
    document.querySelector('#loader2').classList.add('d-none');
});

// Carrega lista de funcionários
async function listEmployees() {
    try {
        const employees = await loadEmployees();
        console.log(employees)
        const availableList = document.getElementById('available-employees');
        
        // Limpa as listas existentes
        availableList.innerHTML = '';
        document.getElementById('selected-employees').innerHTML = '';
        
        // Adiciona os funcionários à lista de disponíveis
        employees.forEach(employee => {
            const listItem = document.createElement('button');
            listItem.type = 'button';
            listItem.className = 'list-group-item list-group-item-action';
            listItem.setAttribute('data-employee-id', employee.id_colab);
            listItem.setAttribute('data-employee-name', employee.username+' '+employee.familyName);
            listItem.textContent = employee.username+' '+employee.familyName;
            
            // Adiciona evento de clique para mover entre as listas
            listItem.addEventListener('click', function() {
                moveEmployee(this);
            });
            
            availableList.appendChild(listItem);
        });

        updateSelectedCount();
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
    }
}

// Move funcionário entre as listas
function moveEmployee(element) {
    const sourceList = element.parentElement;
    const targetList = sourceList.id === 'available-employees' 
        ? document.getElementById('selected-employees')
        : document.getElementById('available-employees');
    
    // Move o elemento para a outra lista
    targetList.appendChild(element);
    
    // Atualiza o contador
    updateSelectedCount();
}

// Atualiza contador de selecionados
function updateSelectedCount() {
    const selectedCount = document.getElementById('selected-employees').children.length;
    const countElement = document.querySelector('.selected-count');
    if (countElement) {
        countElement.textContent = selectedCount+' funcionários selecionados';
    }
}

// Carrega lista de tipos
async function displayTypes() {
    try {
        const types = await loadTypes();
        const selectElement = document.getElementById('type');
        
        // Limpa as opções existentes
        selectElement.innerHTML = '<option value="">Selecione...</option>';
        
        // Adiciona as novas opções
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name_discount;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar tipos:', error);
    }
}

// Inicializa os ouvintes de eventos
function initializeEventListeners() {
    // Formulário de Desconto em Lote
    const form = document.getElementById('batch-discount-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

// Função para enviar o formulário
async function handleSubmit(e) {
    e.preventDefault();
    
    try {
        const form = document.getElementById('batch-discount-form');
        const selectedEmployees = document.querySelectorAll('#selected-employees button');
        
        if (selectedEmployees.length === 0) {
            throw new Error('Selecione pelo menos um colaborador');
        }

        // Obtém os valores do formulário
        const formData = new FormData(form);
        
        const data = {
            category_id: formData.get('type'),
            amount: parseFloat(formData.get('value').replace(/\D/g, '')) / 100,
            description: formData.get('description'),
            discount_type: 'fixed',
            reference_month: formData.get('reference_month'),
            status: 'pending',
            collaborators: Array.from(selectedEmployees).map(emp => ({
                collaborator_id: emp.getAttribute('data-employee-id')
            }))
        };

        // Envia os dados do desconto em lote
        const response = await makeRequest('/api/rh-payroll/discount/batch/create', 'POST', data);

        if (response.success) {
            showToast('success', 'Desconto em lote adicionado com sucesso!');
            form.reset();
            // Limpa a lista de colaboradores selecionados
            document.getElementById('selected-employees').innerHTML = '';
            // Atualiza o contador
            updateSelectedCount();

            window.close();
        } else {
            throw new Error(response.message || 'Erro ao adicionar desconto em lote');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('error', error.message || 'Erro ao adicionar desconto em lote');
    }
}

// Configura o input de moeda
function setupCurrencyInput() {
    const amountInput = document.getElementById('value');
    if (!amountInput) return;

    function formatValue(value) {
        // Remove tudo exceto números
        value = value.replace(/\D/g, '');
        
        // Converte para número e divide por 100 para considerar os centavos
        const numericValue = Number(value) / 100;
        
        // Formata com duas casas decimais e vírgula
        return numericValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Define valor inicial
    amountInput.value = formatValue('0');

    amountInput.addEventListener('input', function(e) {
        const value = e.target.value.replace(/\D/g, '');
        if (value === '') {
            e.target.value = formatValue('0');
            return;
        }
        e.target.value = formatValue(value);
    });

    // Seleciona todo o texto quando o input recebe foco
    amountInput.addEventListener('focus', function(e) {
        e.target.select();
    });

    // Adiciona tratamento para o envio do formulário
    const form = document.getElementById('add-discount-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            // Converte o valor para o formato que o backend espera (ponto como separador decimal)
            const rawValue = amountInput.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            
            // Atualiza o valor do input para envio
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'amount';
            hiddenInput.value = numericValue.toFixed(2);
            form.appendChild(hiddenInput);
            
            // Remove o input original do envio
            amountInput.removeAttribute('name');
        });
    }
}
