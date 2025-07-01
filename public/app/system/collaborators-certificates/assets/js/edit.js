// Variaveis globais para gerenciamento de selects com o Choices
// s antes da variavel se refere a select
let sAllResponsible, sAllDepartments, sAllCertiticate, password_id;


// Esta função busca todos os usuários responsáveis via uma requisição à API
async function getAllResponsible() {
    // carrega os usuarios responsaveis
    const Responsible = await makeRequest(`/api/users/listAllUsersActive`);

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

// Esta função busca todos os usuários responsáveis via uma requisição à API
async function getAllCertificates() {
    // carrega os usuarios responsaveis
    const Responsible = await makeRequest(`/api/collaborators-certificates/certificates`);

    // Formate o array para ser usado com o Choices.js (Biblioteca)
    const listaDeOpcoes = Responsible.map(function (element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });



    // verifica se o select ja existe, caso exista destroi
    if (sAllCertiticate) {
        sAllCertiticate.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllCertiticate = new Choices('select[name="certiticate"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',

    });


}


// Esta função busca os dados de uma senha específica via uma requisição à API
async function getCertificate(id) {
    const certificate = await makeRequest(`/api/collaborators-certificates/collaborators-certificates-id/${id}`);

    console.log(certificate)

    document.querySelector('textarea[name="observation"]').value = certificate.reason

    sAllResponsible.setChoiceByValue(certificate.collaborator_id.toString())
    sAllCertiticate.setChoiceByValue(certificate.certificate_id.toString())


} 

// Esta função coleta dados de um formulário HTML, realiza validações no campo de link, e faz uma requisição para criar uma nova entrada no sistema de controle de senhas
async function getForm() {
    const form = {
        collaborator_id: sAllResponsible.getValue(true),
        certificate_id: sAllCertiticate.getValue(true),
        reason: document.querySelector('textarea[name="observation"]').value,
    }


    const Result = await makeRequest(`/api/collaborators-certificates/collaborators-certificates/${password_id}`, 'PUT', form);
    window.close();
}

// Função para verificar se os campos estão preenchidos
async function getValuesFromInputs() {
    // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
    let requiredInputFields = [
       { name: 'observation', message: 'Você deve preencher a descrição de uso.' }
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
       { name: 'responsible', message: 'Você deve selecionar um colaborador.' },
       { name: 'certiticate', message: 'Você deve selecionar um certificado.' },
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

// Função para receber o id da pessoa que esta sendo aberta nesta janela
async function getPasswordInfo() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');
    return id;
 };

//Esta função adiciona um ouvinte de eventos para o botão de salvar com o ID `btn-save`
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
    password_id = await getPasswordInfo()

    // carrega os usuarios responsaveis
    await getAllResponsible();

    await getAllCertificates();



    // carrega a view 
    await getCertificate(password_id);

    await eventClick();

    
    // remover loader
    document.querySelector('#loader2').classList.add('d-none');

})

