let choicesInstance;

async function events(){
    const ButtonAddTicket = document.getElementById('ButtonAddTicket')
    ButtonAddTicket.addEventListener('click', function(e){
       e.preventDefault();
       // Obtenha as opções selecionadas
       const opcoesSelecionadas = choicesInstance.getValue();

       // Mapeie para obter apenas os IDs
       const idsSelecionados = opcoesSelecionadas.map(function(opcao) {
           return {
               id:opcao.id,
               name:opcao.value,
               dataHead: opcao.customProperties && opcao.customProperties.dataHead
           };
       });

       const settingsTicket = {
           type:'#new-tasks-draggable',
           timeInit:document.getElementsByName("timeInit")[0].value,
           responsible:{
               id:document.getElementsByName("responsible")[0],
               name:document.getElementsByName("responsible")[0].value},
           timeEnd:document.getElementsByName("timeEnd")[0].value,
           title:document.getElementsByName("title")[0].value,
           atribuido:idsSelecionados,
           description: document.getElementsByName("description")[0].value,
       }

       console.log(settingsTicket)

       createTicket(settingsTicket)

    })

    /* TargetDate Picker */
    flatpickr(".targetDate", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
    });
}

async function listAllUsersTI(){
    const listusers = await makeRequest('/api/users/ListUserByDep/7')

    const DivSelected = document.querySelector('.listusers');
    DivSelected.innerHTML = '';

    listusers.forEach(element => {
        DivSelected.innerHTML += `
        <span class="avatar avatar-rounded">
            <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt="img">
        </span>`
    });
    
    DivSelected.innerHTML += `<a class="avatar bg-primary avatar-rounded text-fixed-white" href="javascript:void(0);"> Todos </a></div>`
   
  
}

async function listAllUsersTIToChoise(){
    const listusers = await makeRequest('/api/users/ListUserByDep/7')


    // Formate o array para ser usado com o Choices.js
    var listaDeOpcoes = listusers.map(function(element) {
        return {
            customProperties:{dataHead:element.id_headcargo},
            value: `${element.username} ${element.familyName}`,
            label: `${element.username} ${element.familyName}`,
            id: element.userID
        };
    });


    choicesInstance = new Choices('select[name="atribuido"]', {
        choices: listaDeOpcoes,
        // allowHTML: true,
        // allowSearch: true,
        // removeItemButton: true,
    });
}

async function listResponsibles(){
        
    const listAllUsers = await makeRequest('/api/users/listAllUsers')


    document.querySelector('select[name="responsible"]').innerHTML = ''
    listAllUsers.forEach(element => {
  
        document.querySelector('select[name="responsible"]').innerHTML += `<option data-headcargoID="${element.id_headcargo}" id="${element.userID}">${element.username} ${element.familyName}</option>`
    });

    
    
    
    $('select[name="responsible"]').select2({
        dropdownParent: $('#add-task'),
        templateResult: selectFormatImg,
        templateSelection: selectFormatImg,
        placeholder: "Selecione o colaborador",
        escapeMarkup: function (m) { return m; }
    });
}

async function createTicket(settingsTicket){

    let users = '';
    settingsTicket.atribuido.forEach(element => {
        users += `<span class="avatar avatar-sm avatar-rounded">
            <img src="https://cdn.conlinebr.com.br/colaboradores/${element.dataHead}" alt="img">
        </span>`;
 });    

const card = `<div class="card custom-card">
    <div class="card-body p-0">
        <div class="p-3 kanban-board-head">
            <div
                class="d-flex text-muted justify-content-between mb-1 fs-12 fw-semibold">
                <div>
                <i class="ri-time-line me-1 align-middle d-inline-block"></i>
                ${settingsTicket.timeInit}
                </div>
                <div>faltam 2 dias</div>
            </div>
            <div
                class="d-flex align-items-center justify-content-between">
                <div class="task-badges">
                      
                </div>
                <div class="dropdown">
                    <a aria-label="anchor"
                        href="javascript:void(0);"
                        class="btn btn-icon btn-sm btn-light"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"><i
                            class="fe fe-more-vertical"></i></a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item"
                                href="javascript:void(0);"><i
                                    class="ri-eye-line me-1 align-middle d-inline-block"></i>visualizar</a>
                        </li>
                        <li><a class="dropdown-item"
                                href="javascript:void(0);"><i
                                    class="ri-delete-bin-line me-1 align-middle d-inline-block"></i>Remover</a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="kanban-content mt-2">
                <h6 class="fw-semibold mb-1 fs-15">${settingsTicket.title}</h6>
                <div class="kanban-task-description">${settingsTicket.description}.</div>
            </div>
        </div>
        <div class="p-3 border-top border-block-start-dashed">
            <div
                class="d-flex align-items-center justify-content-between">
                <div>
               
                <a href="javascript:void(0);" class="text-muted">
                <span class="me-1">
                <i class="ri-message-2-line align-middle fw-normal"></i>
                </span>
                    <span class="fw-semibold fs-12">02</span>
                </a>
                </div>
                <div class="avatar-list-stacked">
                    ${users}

                </div>
            </div>
        </div>
    </div>
              </div>`


document.querySelector(settingsTicket.type).innerHTML += card
}

/* SUPORTE AO SELECT2 PARA FORMATAR AS IMAGENS NO SELECT */
function selectFormatImg(client) {
    if (!client.id) { return client.text; }
    const element = client.element;
    const headID = element.getAttribute('data-headcargoid');

    var $client = $(
        '<span><img src="https://cdn.conlinebr.com.br/colaboradores/'+headID+'" /> '
        + client.text + '</span>'
    );
    return $client;
};

document.addEventListener("DOMContentLoaded", async () => {

    dragula([
        document.querySelector('#new-tasks-draggable'), 
        document.querySelector('#todo-tasks-draggable'), 
        document.querySelector('#inprogress-tasks-draggable'), 
        document.querySelector('#inreview-tasks-draggable'), 
        document.querySelector('#completed-tasks-draggable')
    ]);

    await events()
    await listAllUsersTI()
    await listAllUsersTIToChoise()
    await listResponsibles()

})


