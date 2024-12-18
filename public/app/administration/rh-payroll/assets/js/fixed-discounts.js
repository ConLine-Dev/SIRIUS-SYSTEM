let sAllResponsible, sAllCategory;

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);

    return StorageGoogle;
};

// Função para buscar os Responsáveis
async function getAllUsersActive() {
    const listAllUsersActive = await makeRequest(`/api/users/listAllUsersActive`);

    const listUsers = listAllUsersActive.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
        }
    });

    if (sAllResponsible) {
        sAllResponsible.destroy();
    }

    sAllResponsible = new Choices('select[name="responsible"]', {
        choices: listUsers,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
    });
};

// Função para buscar as categorias do desconto
async function allCategoryDiscount(classe = '.row_1', name = 'discount') {
    const categoryDiscount = await makeRequest(`/api/rh-payroll/categoryDiscount`);

    const discountListSelect = document.querySelector(`${classe} [name="${name}"]`)

    let allCategory = '';

    for (let i = 0; i < categoryDiscount.length; i++) {
        const element = categoryDiscount[i];

        allCategory += `<option value="${element.id}">${element.name_discount}</option>`;
        
    }

    discountListSelect.innerHTML = allCategory;
};

let countList = 1

// Função para adicionar uma nova linha de descrição e valor
function adicionarDescricao() {
    const container = document.querySelector('#descricao-container');
    const novaLinha = document.createElement('div');
    novaLinha.classList.add('row', 'descricao-row');
    countList += 1
    novaLinha.classList.add('row_'+countList, 'descricao-row');
    

    novaLinha.innerHTML = `
        <div class="col-xl-3 col-lg-4 col-md-4 col-sm-12">
            <label class="form-label">Desconto</label>
            <select class="form-control list_${countList}" name="discount">
                <option value="">Selecione um desconto</option>
            </select>
        </div> 
        <div class="col-xl-3 col-lg-4 col-md-4 col-sm-12">
            <label class="form-label">Valor R$</label>
            <input type="number" step="0.01" name="value" class="form-control campo-valor list_${countList}" placeholder="Digite um valor...">
        </div>                                
        <div class="col-xl-3 col-lg-4 col-md-4 col-sm-12">
            <label class="form-label">Anexar Documento</label>
            <input type="file" name="document" class="form-control list_${countList}">
        </div>
        <div class="col-xl-3 col-lg-4 col-md-4 col-sm-12 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="removerDescricao(this, ${countList})">Remover</button>
        </div>
    `;

    container.appendChild(novaLinha);

    allCategoryDiscount('.row_'+countList)

    // Reaplica os eventos nos novos inputs
    configurarFormatacaoValor();
};

// Função para remover um desconto
function removerDescricao(botao) {
    const linha = botao.closest('.descricao-row');
    linha.remove();
};

// Função para configurar os eventos nos inputs de valor
function configurarFormatacaoValor() {
    function formatarValorBrasileiro(input) {
    let valor = input.value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    valor = (parseInt(valor, 10) / 100).toFixed(2); // Formata o número
    input.value = valor.replace('.', ','); // Substitui ponto por vírgula para formato brasileiro
}

};

// Função para verificar se os campos estão preenchidos
async function getDiscount() {
    const listDiscount = document.querySelectorAll('.descricao-row');
    const discount = [];

    for (let i = 0; i < listDiscount.length; i++) {
        const element = listDiscount[i];
        const valueInput = element.querySelector('[name="value"]');

        if (!valueInput.value) {
            valueInput.setCustomValidity('O campo VALOR é obrigatório.');
            valueInput.reportValidity(); // Mostra a mensagem no input
            return false;
        } else {
            valueInput.setCustomValidity(''); // Limpa a mensagem de erro
        }

        discount.push({
            discountId: element.querySelector('[name="discount"]').value,
            value: valueInput.value
        });
    }

    const form = {
        responsible: document.querySelector('select[name="responsible"]').value,
        monthYear: document.querySelector('input[name="monthYear"]').value,
        observation: document.querySelector('textarea[name="observation"]').value,
        discount: discount
    };

    const result = await makeRequest(`/api/rh-payroll/createBulk`, 'POST', form);
    window.close();
};

// Função para verificar se o campo mes/ano está preenchido
async function getValuesInputs() {
    // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
    let requiredInputFields = [
       { name: 'monthYear', message: 'O campo MES/ANO é obrigatório.' },
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
};

// Função para os valores de qualquer selected
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
};

// Função para verificar se os selects estão preenchidos
async function getValuesFromSelects() {
    // Array com os names dos selects que não devem ficar em branco e suas mensagens personalizadas
    let selectNames = [
       { name: 'responsible', message: 'O campo RESPONSÁVEL é obrigatório.' },
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
};

// Esta função adiciona um evento de clique ao botão de salvar
async function eventClick() {
    // ==== Salvar ==== //
    document.getElementById('btn-save').addEventListener('click', async function (){
        const inputsValid = await getValuesInputs();
        const selectsValid = await getValuesFromSelects();

        if (inputsValid && selectsValid) {
            await getDiscount();
        }
        
    })
    // ==== /Salvar ==== //
};

// Campo de Mês/Ano
async function initializeMonthYearPicker(selector) {
    flatpickr(selector, {
        plugins: [
            new monthSelectPlugin({
                shorthand: true, // Exibe apenas o mês e ano
                dateFormat: "Y-m", // Formato enviado ao banco
                altFormat: "F Y", // Formato exibido ao usuário (Ex: Janeiro 2024)
            }),
        ],
        altInput: true, // Habilita a exibição do formato alternativo no input
        locale: "pt", // Define o idioma para português
    });
};

// Adiciona um novo campo de seleção de mês/ano
async function addMonthYearField() {
    const container = document.getElementById("monthYearContainer");
    const newField = document.createElement("div");
    newField.classList.add("input-group", "mb-2");

    newField.innerHTML = `
        <input type="text" name="monthYear" class="form-control flatpickr-input targetDate" placeholder="Selecione o mês e ano do desconto...">
        <button type="button" class="btn btn-danger" onclick="removeField(this)">Remover</button>
    `;

    container.appendChild(newField);
    initializeMonthYearPicker(newField.querySelector(".targetDate"));
};

// Remove um campo de seleção de mês/ano
function removeField(button) {
    button.parentElement.remove();
};

// Inicializa o primeiro campo ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    initializeMonthYearPicker(".targetDate");
});





// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {

    await getAllUsersActive();
    await allCategoryDiscount();
    await initializeMonthYearPicker();

    // Inicializa a configuração para os inputs existentes
    configurarFormatacaoValor();

    await eventClick();

})



