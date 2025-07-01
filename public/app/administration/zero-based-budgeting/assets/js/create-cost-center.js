// Variaveis globais para gerenciamento de selects com o Choices
let sAllResponsible;

// Esta função busca todos os usuários responsáveis via uma requisição à API
async function getAllResponsible() {
    // Carrega os usuarios responsaveis
    const Responsible = await makeRequest(`/api/users/listAllUsersActive`);

    // Formata o array para ser usado com o Choices.js (Biblioteca)
    const listaDeOpcoes = Responsible.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
        };
    });

    // Verifica se o select ja existe, caso exista destroi
    if (sAllResponsible) {
        sAllResponsible.destroy();
    }

    // Renderiza o select com as opções formatadas
    sAllResponsible = new Choices('select[name="responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        placeholder: true,
        placeholderValue: 'Selecione os responsáveis',
        maxItemCount: -1
    });
}

// Esta função coleta dados do formulário e faz a requisição para criar um novo centro de custo
async function getForm() {
    const maxNameLength = 100; // Limite de caracteres para o nome

    // Obter os valores dos responsáveis selecionados
    const responsibleValues = await getSelectValues('responsible');

    const form = {
        name: document.querySelector('input[name="name"]').value,
        responsibles: responsibleValues,
        description: document.querySelector('textarea[name="description"]').value,
    };

    // Verifica se o nome ultrapassa o limite de caracteres
    if (form.name.length > maxNameLength) {
        Swal.fire(`O nome deve ter no máximo ${maxNameLength} caracteres.`);
        return; // Interrompe a execução se o nome ultrapassar o limite
    }

    const result = await makeRequest(`/api/zero-based-budgeting/createCostCenter`, 'POST', form);
    window.close();
}

// Função para verificar se os campos obrigatórios estão preenchidos
async function getValuesFromInputs() {
    // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
    let requiredInputFields = [
       { name: 'name', message: 'O campo NOME é obrigatório.' },
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

// Esta função define os valores padrão para o select de responsável (usuário logado)
async function setDefaultValues() {
    const user = await getInfosLogin();
    const idCollaborator = (user.system_collaborator_id).toString();
    
    sAllResponsible.setChoiceByValue(idCollaborator);
}

// Obtém informações do usuário logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    // Carrega os usuários responsáveis
    await getAllResponsible();

    // Configura os eventos de clique
    await eventClick();

    // Define os valores padrão
    await setDefaultValues();
}); 