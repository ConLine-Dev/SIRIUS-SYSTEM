// Variaveis globais para gerenciamento de selects com o Choices
// s antes da variavel se refere a select
let sAllUnits, sAllOrigins, sAllApproval, sAllResponsible, sAllResponsibleActions, sAllTypes, listPreventive = [], listReasons = [], listActions = []


/**
 * Verifica informações no localStorage do usuario logado
 */
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}


async function getAllUnit(){
    // carrega as unidades cadastradas (filiais)
    const Units = await makeRequest(`/api/non-compliance/AllUnit`);

    // Formate o array para ser usado com o Choices.js
    const listaDeOpcoes = Units.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.city+' | '+element.country}`,
        };
    });

    //adicionar a opção selecione ao select como default e desabilita
    listaDeOpcoes.push({value:0, label:'Selecione', selected: true, disabled: true})


    // verifica se o select ja existe, caso exista destroi
    if (sAllUnits) {
        sAllUnits.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllUnits = new Choices('select[name="company_id"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        // removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        
    });


}

async function getAllOrigins(){
    // carrega as origins cadastradas (motivos)
    const Origins = await makeRequest(`/api/non-compliance/AllOrigin`);

    // Formate o array para ser usado com o Choices.js
     const listaDeOpcoes = Origins.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });

    //adicionar a opção selecione ao select como default e desabilita
    listaDeOpcoes.push({value:0, label:'Selecione', selected: true, disabled: true})


    // verifica se o select ja existe, caso exista destroi
    if (sAllOrigins) {
        sAllOrigins.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllOrigins = new Choices('select[name="origin_id"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        // removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        
    });

}

async function getAllApproval(){
    // carrega os usuarios que podem aprovar
    const Approvals = await makeRequest(`/api/non-compliance/AllApproval`);
    
    // Formate o array para ser usado com o Choices.js
    const listaDeOpcoes = Approvals.map(function(element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username+' '+element.familyName}`,
        };
    });

    //adicionar a opção selecione ao select como default e desabilita
    listaDeOpcoes.push({value:0, label:'Selecione', selected: true, disabled: true})


    // verifica se o select ja existe, caso exista destroi
    if (sAllApproval) {
        sAllApproval.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllApproval = new Choices('select[name="approval"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        // removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        
    });

}

async function getAllTypes(){
    // carrega os tipos de occorrencia
    const AllTypes = await makeRequest(`/api/non-compliance/AllTypes`);
    
    // Formate o array para ser usado com o Choices.js
    const listaDeOpcoes = AllTypes.map(function(element) {
        return {
            value: `${element.id}`,
            label: `${element.name}`,
        };
    });

    //adicionar a opção selecione ao select como default e desabilita
    listaDeOpcoes.push({value:0, label:'Selecione', selected: true, disabled: true})


    // verifica se o select ja existe, caso exista destroi
    if (sAllTypes) {
        sAllTypes.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllTypes = new Choices('select[name="type_id"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        // removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        
    });

}

async function getAllResponsible(){
    // carrega os usuarios responsaveis
    const Responsible = await makeRequest(`/api/non-compliance/AllResponsible`);
    
    // Formate o array para ser usado com o Choices.js
    const listaDeOpcoes = Responsible.map(function(element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username+' '+element.familyName}`,
        };
    });



    // verifica se o select ja existe, caso exista destroi
    if (sAllResponsible || sAllResponsibleActions) {
        sAllResponsible.destroy();
        sAllResponsibleActions.destroy();
    }


    // renderiza o select com as opções formatadas
    sAllResponsible = new Choices('select[name="occurrence_responsible"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        
    });

    const user = await getInfosLogin()
    sAllResponsible.setChoiceByValue(user.system_collaborator_id.toString());

    sAllResponsibleActions = new Choices('select[name="action_responsible"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        // removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        
    });

    sAllResponsibleActions = new Choices('select[name="Preventive_responsible"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        shouldSort: false,
        // removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        
    });

}

async function renderTableReason(){

    const tableBody = document.querySelector('#table_reasons tbody')

    let row = ''
    for (let index = 0; index < listReasons.length; index++) {
        const element = listReasons[index];

        row += `<tr>
                    <td>${index+1}º PORQUÊ?</td>
                    <td>${element}</td>
                </tr>`
        
        
    }

    tableBody.innerHTML = row
}

async function renderTableActions(){

    const tableBody = document.querySelector('#table_corrective tbody')

    let row = ''
    for (let index = 0; index < listActions.length; index++) {
        const element = listActions[index];

        const parts = element.expiration.split('-');
        const expiration = parts[2] + '/' + parts[1] + '/' + parts[0];

        row += `<tr>
                    <td>${index+1}</td>
                    <td>${element.description}</td>
                    <td>${element.responsible_name}</td>
                    <td>
                        <span class="icon-text-align">
                            <i class="las la-calendar-alt fs-5"></i> ${expiration}
                        </span>
                    </td>
                    <td><span class="badge bg-outline-warning">Pendente</span></td>
                </tr>`
        
        
    }

    tableBody.innerHTML = row
}

async function renderTablePreventive(){

    const tableBody = document.querySelector('#table_preventive tbody')

    let row = ''
    for (let index = 0; index < listPreventive.length; index++) {
        const element = listPreventive[index];

        const parts = element.expiration.split('-');
        const expiration = parts[2] + '/' + parts[1] + '/' + parts[0];

        row += `<tr>
                    <td>${index+1}</td>
                    <td>${element.description}</td>
                    <td>${element.responsible_name}</td>
                    <td>
                        <span class="icon-text-align">
                            <i class="las la-calendar-alt fs-5"></i> ${expiration}
                        </span>
                    </td>
                    <td><span class="badge bg-outline-warning">Pendente</span></td>
                </tr>`
        
        
    }

    tableBody.innerHTML = row
}

async function addReason(e){
    // pegar o valor do textarea causas e adiciona a um array chamado listReasons para ser listado posteriormente na tabela 5 porquês (salva na memoria temp)
    // esta sendo chamado no front com onclick  
    const reason = document.querySelector('[name="reason"]')

    if(reason.value.trim() == ''){
        return false;
    }

    // desabilita o botão
    e.setAttribute('disabled', true)

    // adicona o valor ao array 
    listReasons.push(reason.value)

    // limpa o campo textarea
    reason.value = ''

    // habilita o botão
    e.removeAttribute('disabled')


    //chama a função para renderizar a tabela de 5 porquês
    await renderTableReason()
}

async function addAction(e){
    // pegar o valor do textarea actions e adiciona a um array chamado listActions para ser listado posteriormente na tabela ações imediatas (salva na memoria temp)
    // esta sendo chamado no front com onclick
    const action_responsible = document.querySelector('[name="action_responsible"]')
    const action_expiration = document.querySelector('[name="action_expiration"]').value
    const action_description = document.querySelector('[name="action_description"]').value


    if(action_responsible.value.trim() == 0 || action_expiration.trim() == '' || action_description.trim() == ''){
        return false;
    }
    
    // desabilita o botão
    e.setAttribute('disabled', true)

    // adicona o valor ao array 
    listActions.push({
        responsible_id:action_responsible.value,
        responsible_name:action_responsible.textContent,
        expiration:action_expiration,
        description:action_description
    })

    // limpa o campo textarea
    action_expiration.value = ''
    action_description.value = ''

    // habilita o botão
    e.removeAttribute('disabled')
    console.log(listActions)


    //chama a função para renderizar a tabela ações imediatas
    await renderTableActions()
}

async function addPreventive(e){
    // pegar o valor do textarea actions e adiciona a um array chamado listActions para ser listado posteriormente na tabela ações imediatas (salva na memoria temp)
    // esta sendo chamado no front com onclick
    const Preventive_responsible = document.querySelector('[name="Preventive_responsible"]')
    const Preventive_expiration = document.querySelector('[name="Preventive_expiration"]').value
    const Preventive_description = document.querySelector('[name="Preventive_description"]').value


    if(Preventive_responsible.value.trim() == 0 || Preventive_expiration.trim() == '' || Preventive_description.trim() == ''){
        return false;
    }
    
    // desabilita o botão
    e.setAttribute('disabled', true)

    // adicona o valor ao array 
    listPreventive.push({
        responsible_id:Preventive_responsible.value,
        responsible_name:Preventive_responsible.textContent,
        expiration:Preventive_expiration,
        description:Preventive_description
    })

    // limpa o campo textarea
    Preventive_expiration.value = ''
    Preventive_description.value = ''

    // habilita o botão
    e.removeAttribute('disabled')
    console.log(listPreventive)


    //chama a função para renderizar a tabela ações imediatas
    await renderTablePreventive()
}

async function getValuesOccurrence(e) {
    // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
    const requiredFields = [
        { name: 'occurrence', message: 'O campo Ocorrência é obrigatório.' },
        { name: 'occurrence_date', message: 'O campo Data da Ocorrência é obrigatório.' },
        { name: 'company_id', message: 'O campo Unidade é obrigatório.' },
        { name: 'origin_id', message: 'O campo Origem é obrigatório.' },
        { name: 'type_id', message: 'O campo Tipo é obrigatório.' },
        { name: 'occurrence_responsible', message: 'O campo Responsável pela Ocorrência é obrigatório.' },
        { name: 'correction', message: 'O campo Correção é obrigatório.' },
        { name: 'description', message: 'O campo Descrição é obrigatório.' }
    ];

    const elements = document.querySelectorAll('.form-input[name]');

    const formBody = {};

    for (let index = 0; index < elements.length; index++) {
        const item = elements[index];
        const itemName = item.getAttribute('name');
        
        // Verificar se o campo está no array de campos obrigatórios e se está vazio
        const requiredField = requiredFields.find(field => field.name === itemName);
        if (requiredField && (item.value.trim() === '' || item.value.trim() === '0')) {
            Swal.fire(requiredField.message);
            return false;
        }

        // Adicionando dinamicamente o nome e o valor ao objeto
        formBody[itemName] = (itemName === 'occurrence_responsible' || itemName === 'types') ? sAllResponsible.getValue(true) : item.value;
    }

    const sendToServer = await makeRequest(`/api/non-compliance/NewOccurrence`, 'POST', { formBody });

    window.close();
}




// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    // inicio da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.time(`A página "${document.title}" carregou em`)


    // carrega as unidades cadastradas (filiais)
    await getAllUnit();

    // carrega as origins cadastradas (motivos)
    await getAllOrigins();

    // carrega os usuarios que podem aprovar
    await getAllApproval();

    // carrega os usuarios responsaveis
    await getAllResponsible();

    // carrega os tipos de ocorrencia
    await getAllTypes();

    
    // remover loader
    document.querySelector('#loader2').classList.add('d-none');


    // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.timeEnd(`A página "${document.title}" carregou em`);
})

