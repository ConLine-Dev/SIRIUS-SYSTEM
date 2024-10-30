// Variaveis globais para gerenciamento de selects com o Choices
// s antes da variavel se refere a select
let sAllResponsible, sAllDepartments, sAllCategories, sAllResponsibles2;

function getLinkParams() {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('categoryId');
    return categoryId;
}

// Esta função busca todos os usuários responsáveis via uma requisição à API
async function getAllResponsible(respsArray) {
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

    const listaDeOpcoes2 = Responsible.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
            selected: respsArray.includes(element.id_colab)
        };
    });

    // verifica se o select ja existe, caso exista destroi
    if (sAllResponsible) {
        sAllResponsible.destroy();
    }
    if (sAllResponsibles2) {
        sAllResponsibles2.destroy();
    }

    // renderiza o select com as opções formatadas
    sAllResponsible = new Choices('select[name="responsible"]', {
        choices: listaDeOpcoes,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
    });
    sAllResponsibles2 = new Choices('select[name="responsibles"]', {
        choices: listaDeOpcoes2,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
    });

    sAllResponsible.setChoiceByValue(`${collabData[0].collabId}`)
    sAllResponsibles2.setChoiceByValue(`${collabData[0].collabId}`)
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

    const selectElement = document.querySelector('select[name="departments"]');
    selectElement.addEventListener('change', async function(event) {
        const selectedValues = Array.from(event.target.selectedOptions).map(option => option.value);
        let deptId = selectedValues;
        await addResponsiblesByDept(deptId);
    });
}

async function addResponsiblesByDept(deptId) {
    const responsibles = await makeRequest(`/api/meeting-control/getCollabsByDept`, 'POST', {deptId});
    const collabs = responsibles.map(item => item.collaborator_id);

    getAllResponsible(collabs);
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
    const responsibles = Array.from(document.querySelectorAll('select[name="responsibles"] option:checked')).map(option => option.value);
    const description = document.querySelector('textarea[name="observation"]').value;
    const timeInit = document.querySelector('input[name="timeInit"]').value;
    const timeEnd = document.querySelector('input[name="timeEnd"]').value;
    let validEvent = 1;

    const eventData = { title, responsible, eventCategory, departments, responsibles, description, timeInit, timeEnd }
    
    const occupiedCollabs = await makeRequest('/api/meeting-control/getResponsiblesCallendar', 'POST', {responsibles: responsibles, start: timeInit, end: timeEnd});
    if (occupiedCollabs.length > 0) {
        validEvent = 0;
        let occupiedName = '';
        for (let index = 0; index < occupiedCollabs.length; index++) {
            if (index == 0) {
                occupiedName = `${occupiedCollabs[index].name} ${occupiedCollabs[index].family_name}`
            } else if (index > 1) {
                occupiedName += `, ${occupiedCollabs[index].name} ${occupiedCollabs[index].family_name}`
            }
        }
        Swal.fire({
            icon: "error",
            title: "Nem todos os envolvidos estão disponíveis!",
            text: `${occupiedName} já tem compromisso marcado para este horário.`,
        });
    }

    if (eventCategory == 3) {
        let occupiedRoom = await makeRequest(`/api/meeting-control/verifyFreeRoom`, 'POST', { firstDate: timeInit, lastDate: timeEnd });

        if (occupiedRoom) {
            validEvent = 0;
            let occupiedBooth = await makeRequest(`/api/meeting-control/verifyFreeBooth`, 'POST', { firstDate: timeInit, lastDate: timeEnd });
            if (!occupiedBooth) {
                Swal.fire({
                    icon: "error",
                    title: "Sala ocupada na data solicitada!",
                    text: "A sala de reunião já está reservada, escolha outra data/hora.",
                    footer: '<label>Dica: o Booth está livre para esta data.</label>'
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Sala ocupada na data solicitada!",
                    text: "A sala de reunião já está reservada, escolha outra data/hora.",
                });
            }
        }
    }

    if (eventCategory == 5) {
        let occupiedBooth = await makeRequest(`/api/meeting-control/verifyFreeBooth`, 'POST', { firstDate: timeInit, lastDate: timeEnd });
        if (occupiedBooth) {
            validEvent = 0;
            Swal.fire({
                icon: "error",
                title: "Sala ocupada na data solicitada!",
                text: "O Booth já está reservado, escolha outra data/hora.",
            });
        }
    }

    if (validEvent) {
        await makeRequest(`/api/meeting-control/saveEvent`, 'POST', eventData);
    
        window.close();
    }
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
    await getAllResponsible([0]);
    await getAllCategories();


    // carrega os usuarios departamentos
    await getAllDepartments();

})