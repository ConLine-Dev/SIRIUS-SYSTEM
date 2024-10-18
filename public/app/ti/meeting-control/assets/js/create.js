// Variaveis globais para gerenciamento de selects com o Choices
// s antes da variavel se refere a select
let sAllResponsible, sAllDepartments, sAllCategories;

function getLinkParams(){
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('categoryId');
    return categoryId;
}

// Esta função busca todos os usuários responsáveis via uma requisição à API
async function getAllResponsible() {
    // carrega os usuarios responsaveis
    const Responsible = await makeRequest(`/api/users/listAllUsers`);

    const loggedData = await getInfosLogin();
    const collabData = await makeRequest(`/api/meeting-control/getCollabData`, 'POST', loggedData);

    // Formate o array para ser usado com o Choices.js (Biblioteca)
    const listaDeOpcoes = Responsible.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
            selected: element.id_colab === collabData[0].collabId
        };
    });

    // verifica se o select ja existe, caso exista destroi
    if (sAllResponsible) {
        sAllResponsible.destroy();
    }

    // renderiza o select com as opções formatadas
    sAllResponsible = new Choices('select[name="responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
    });

    sAllResponsible.setChoiceByValue(`${collabData[0].collabId}`)

}

async function getAllCategories() {
    // carrega os usuarios responsaveis
    const categories = await makeRequest(`/api/meeting-control/getAllCategoryCalendar`);
    const categoryId = getLinkParams();

    // Formate o array para ser usado com o Choices.js (Biblioteca)
    const listaDeOpcoes = categories.map(function (element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
            selected: element.id === categoryId
        };
    });

    // verifica se o select ja existe, caso exista destroi
    if (sAllCategories) {
        sAllCategories.destroy();
    }

    // renderiza o select com as opções formatadas
    sAllCategories = new Choices('select[name="event"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
    });

    sAllCategories.setChoiceByValue(`${categoryId}`)
}

// Esta função busca todos os departamentos disponíveis via uma requisição à API
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

// Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);

    return StorageGoogle;
};

async function saveEvent() {
    // Pega os valores dos inputs
    const title = document.querySelector('input[name="title"]').value;
    const responsible = document.querySelector('select[name="responsible"]').value;
    const eventCategory = document.querySelector('select[name="event"]').value;
    const departments = Array.from(document.querySelectorAll('select[name="departments"] option:checked')).map(option => option.value);
    const description = document.querySelector('textarea[name="observation"]').value;
    const timeInit = document.querySelector('input[name="timeInit"]').value;
    const timeEnd = document.querySelector('input[name="timeEnd"]').value;

    const eventData = {title, responsible, eventCategory, departments, description, timeInit, timeEnd}

    await makeRequest(`/api/meeting-control/saveEvent`, 'POST', eventData);

    window.close();
}

function initializeDatePicker() {
    flatpickr(".targetDate", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
    });
}

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {

    initializeDatePicker();
    // carrega os usuarios responsaveis
    await getAllResponsible();
    await getAllCategories();
    

    // carrega os usuarios departamentos
    await getAllDepartments();

})