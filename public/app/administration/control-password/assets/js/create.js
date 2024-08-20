// Variaveis globais para gerenciamento de selects com o Choices
// s antes da variavel se refere a select
let sAllResponsible, sAllDepartments;


async function getAllResponsible() {
    // carrega os usuarios responsaveis
    const Responsible = await makeRequest(`/api/users/listAllUsers`);

    // Formate o array para ser usado com o Choices.js (Biblioteca)
    const listaDeOpcoes = Responsible.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
        };
    });



    // verifica se o select ja existe, caso exista destroi
    if (sAllResponsible) {
        sAllResponsible.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllResponsible = new Choices('select[name="responsible"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',

    });


}

async function getAllDepartments() {
    // carrega os usuarios responsaveis
    const Departments = await makeRequest(`/api/users/getAllDept`);

    // Formate o array para ser usado com o Choices.js
    const listaDeOpcoes = Departments.map(function (element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });

    // verifica se o select ja existe, caso exista destroi
    if (sAllDepartments) {
        sAllDepartments.destroy();
    }

    // renderiza o select com as opções formatadas
    sAllDepartments = new Choices('select[name="departments"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',

    });


}

async function getForm() {

    const form = {
        title: document.querySelector('input[name="title"]').value,
        login: document.querySelector('input[name="login"]').value,
        password: document.querySelector('input[name="password"]').value,
        responsible: document.querySelector('select[name="responsible"]').value,
        departments: sAllDepartments.getValue(true),
        link: document.querySelector('input[name="link"]').value,
        observation: document.querySelector('textarea[name="observation"]').value,
    }

    const Result = await makeRequest(`/api/control-password/create`, 'POST', form);
    window.close()

}

// Função para verificar se os campos estão preenchidos
async function getValuesFromInputs() {
    // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
    let requiredInputFields = [
       { name: 'title', message: 'O campo TÍTULO é obrigatório.' },
       { name: 'login', message: 'O campo LOGIN é obrigatório.' },
       { name: 'password', message: 'O campo SENHA é obrigatório.' },
       { name: 'link', message: 'O campo LINK é obrigatório.' },
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
       { name: 'departments', message: 'O campo DEPARTAMENTO é obrigatório.' },
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

async function eventClick() {
    // ==== Salvar ==== //
    document.getElementById('btn-save').addEventListener('click', async function (){
        const inputsValid = await getValuesFromInputs();
        const selectsValid = await getValuesFromSelects();

        if (inputsValid && selectsValid) {
            await getForm();
        }
        
    })
    // ==== /Salvar ==== //
}

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {

    // carrega os usuarios responsaveis
    await getAllResponsible();

    // carrega os usuarios departamentos
    await getAllDepartments();

    await eventClick();

})

