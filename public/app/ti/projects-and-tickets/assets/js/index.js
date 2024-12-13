let choicesInstance, choicesInstanceEdit, SCategories, SEditing_Categories;
let IdUpdate, myModal, actualDate;

  // Verifica o localStorage para alterar a mensagem de boas vindas
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

// Função principal para iniciar os eventos
async function initEvents() {
    initializeButtonAddTicket();
    initializeFilter();
    initializeTaskCardEvents();
    initializeDatePicker();
    // Inicializar os event listeners
    initializeCollaboratorFilter();
}

// Clique na imagem para fazer o filtro do colab responsavel
function initializeCollaboratorFilter() {
    const collaboratorButtons = document.querySelectorAll('.btnSelectTI');
    const allButton = document.querySelector('.avatar.bg-primary');
    
    collaboratorButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const collabId = event.currentTarget.getAttribute('data-collabid');
            filterTicketsByCollaborator(collabId);
        });
    });


    allButton.removeEventListener('click', showAllTickets);
    allButton.addEventListener('click', showAllTickets);
}

// Apresenta os chamados do colaborador clicado
function filterTicketsByCollaborator(collabId) {
    const allTickets = document.querySelectorAll('.defaultBodyTicket .task-card'); // Captura todos os tickets
    
    allTickets.forEach(ticket => {

        ticket.style.display = 'none' // Da display none em todos os tickets
        const userTiAttributed = ticket.querySelectorAll('.userTiAtributed'); // Pega todos os colaboradores atribuidos nos tickets

        for (let i = 0; i < userTiAttributed.length; i++) {
            const item = userTiAttributed[i];
            
            // Quando encontrar um chamado que tenha o colaborador, da display block no ticket
            if (item && item.getAttribute('data-collabid') == collabId) {
                ticket.style.display = 'block'
            }
        }
    });
}

// Botao de mostrar todos os chamados
function showAllTickets() {
    const allTickets = document.querySelectorAll('.defaultBodyTicket .task-card');
    
    allTickets.forEach(ticket => {
        ticket.style.display = 'block';
    });
}


// Inicializa o evento do botão de adicionar ticket
function initializeButtonAddTicket() {

    const buttonAddTicket = document.getElementById('ButtonAddTicket');
    const buttonRemoveTicket = document.getElementById('ButtonRemoveTicket');
    const buttonSaveTicket = document.getElementById('ButtonSaveTicket');
    const buttonAddMessage = document.getElementById('ButtonAddMessage');
    
    const inputMessage = document.querySelector('.inputMessage');

    removeExistingEventListeners(buttonAddTicket, buttonRemoveTicket, buttonSaveTicket, buttonAddMessage, inputMessage);

    addEventListeners(buttonAddTicket, buttonRemoveTicket, buttonSaveTicket, buttonAddMessage, inputMessage);
}


function removeExistingEventListeners(buttonAddTicket, buttonRemoveTicket, buttonSaveTicket, buttonAddMessage, inputMessage) {
    buttonAddTicket.removeEventListener('click', handleAddTicket);
    buttonRemoveTicket.removeEventListener('click', handleRemoveTicket);
    buttonSaveTicket.removeEventListener('click', handleSaveTicket);
    buttonAddMessage.removeEventListener('click', handleAddMessage);
    inputMessage.removeEventListener('keypress', handleInputMessageKeypress);
}

function addEventListeners(buttonAddTicket, buttonRemoveTicket, buttonSaveTicket, buttonAddMessage, inputMessage) {
    buttonAddTicket.addEventListener('click', handleAddTicket);
    buttonRemoveTicket.addEventListener('click', handleRemoveTicket);
    buttonSaveTicket.addEventListener('click', handleSaveTicket);
    buttonAddMessage.addEventListener('click', handleAddMessage);
 

    inputMessage.addEventListener('keypress', handleInputMessageKeypress);
}

// Bota abrir novo chamado
async function handleAddTicket(event) {
    event.preventDefault();
    const ticketSettings = getTicketSettings();

    document.querySelector('#loader2').classList.remove('d-none')
    await createTicket(ticketSettings);
    await listAllTickets()
    await initEvents()
    await clearFormFields();
    document.querySelector('#loader2').classList.add('d-none')
}

// Botão remover chamado
async function handleRemoveTicket(event) {
    event.preventDefault();
    const ticketId = event.target.getAttribute('data-id');
    await removeTicket(ticketId);
}

// Botão de salvar chamado
async function handleSaveTicket(event) {
    event.preventDefault();
    const ticketSettings = getTicketEditing();

    document.querySelector('#loader2').classList.remove('d-none')
    await saveTicket(ticketSettings);
    document.querySelector('#loader2').classList.add('d-none')
}

// Botão de adicionar mensagem no chat
async function handleAddMessage(event) {
    event.preventDefault();
    await addMessage();
}

// Adiciona mensagem ao clicar ENTER
async function handleInputMessageKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        await addMessage();
    }
}

// remove ticket
async function removeTicket(id){
    const elementRemove = document.querySelector(`.task-card-${id}`);
        elementRemove.remove()
        
        
    $('#edit-task').modal('hide');
    makeRequest('/api/called/tickets/removeTicket', 'POST', {id:id});
    
}

// Obtém as configurações do ticket a partir dos inputs do formulário
function getTicketSettings() {
    const selectedOptions = choicesInstance.getValue().map(opcao => ({
        id: opcao.value,
        name: opcao.label,
        dataHead: opcao.customProperties?.dataHead
    }));

    const responsibleElement = document.getElementsByName('responsible')[0];
    const responsibleOption = responsibleElement.options[responsibleElement.selectedIndex];

    return {
        type: '#new-tasks-draggable',
        responsible: {
            id: responsibleOption.id,
            name: responsibleOption.text
        },
        categories: {
            id: SCategories.getValue(true),
            name: document.getElementsByName("categories")[0].textContent
        },
        timeInit: document.getElementsByName("timeInit")[0].value,
        timeEnd: document.getElementsByName("timeEnd")[0].value,
        finished_at: document.getElementsByName("finished_at")[0].value,
        approved_at: document.getElementsByName("approved_at")[0].value,
        title: document.getElementsByName("title")[0].value,
        atribuido: selectedOptions,
        description: document.getElementsByName("description")[0].value,
    };
}

async function clearFormFields() {
    // Limpa os campos de texto
    document.getElementsByName("timeInit")[0].value = "";
    document.getElementsByName("timeEnd")[0].value = "";
    document.getElementsByName("finished_at")[0].value = "";
    document.getElementsByName("approved_at")[0].value = "";
    document.getElementsByName("title")[0].value = "";
    document.getElementsByName("description")[0].value = "";

    // Limpa o campo de seleção 'responsible'
    document.getElementsByName('responsible')[0].selectedIndex = 0;

    // Limpa o campo de categorias
    SCategories.setChoiceByValue([0]);

    // Limpa o campo de atribuição
    choicesInstance.removeActiveItems();  // Limpa a seleção, mantendo as opções
}


function getTicketEditing() {
    const selectedOptions = choicesInstanceEdit.getValue().map(opcao => ({
        id: opcao.value,
        name: opcao.label,
        dataHead: opcao.customProperties?.dataHead
    }));

    const responsibleElement = document.getElementsByName('edit_responsible')[0];
    const responsibleOption = responsibleElement.options[responsibleElement.selectedIndex];

    const id = document.querySelector('#ButtonRemoveTicket').getAttribute('data-id')
    return {
        id:id,
        type: '#new-tasks-draggable',
        responsible: {
            id: responsibleOption.id,
            name: responsibleOption.text
        },
        categories: {
            id: SEditing_Categories.getValue(true),
            name: document.getElementsByName("edit_categories")[0].textContent
        },
        timeInit: document.getElementsByName("edit_timeInit")[0].value,
        timeEnd: document.getElementsByName("edit_timeEnd")[0].value,
        finished_at: document.getElementsByName("edit_finished_at")[0].value,
        approved_at: document.getElementsByName("edit_approved_at")[0].value,
        title: document.getElementsByName("edit_title")[0].value,
        atribuido: selectedOptions,
        description: document.getElementsByName("edit_description")[0].value,
    };
}

// Inicializa o filtro de busca de tickets
function initializeFilter() {
    document.getElementById('btnPesquisa').addEventListener('input', function () {
        const filter = this.value.toLowerCase();
        const cards = document.querySelectorAll('.defaultBodyTicket .card.custom-card');
        cards.forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(filter) ? '' : 'none';
        });
    });
}

// Inicializa os eventos de clique duplo nos cartões de tarefas
function initializeTaskCardEvents() {
    document.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('dblclick', async function () {
            document.querySelector(`.chat-ticket`).innerHTML = ''
            const taskId = this.getAttribute('id');

            document.getElementById('ButtonAddMessage').setAttribute('data-id', taskId)

             // Obtém o tamanho do monitor do usuário
                const screenWidth = window.screen.width;
                const screenHeight = window.screen.height;
            
                // Define largura e altura como metade do tamanho do monitor
                const windowWidth = screenWidth / 2;
                const windowHeight = screenHeight / 2;

                // Calcula a posição para centralizar a janela
                const left = (screenWidth - windowWidth) / 2;
                const top = (screenHeight - windowHeight) / 2;

                window.open('./view-ticket?id='+taskId, '_blank', `width=${screenWidth},height=${screenHeight},resizable=yes,scrollbars=yes`);
            
            // await editTask(taskId);
        });
    });
}

// Inicializa o seletor de data
function initializeDatePicker() {
    flatpickr(".targetDate", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
    });
}

// Lista todos os usuários do departamento de TI
async function listAllUsersTI() {
    const listusers = await makeRequest('/api/users/ListUserByDep/7');
    const DivSelected = document.querySelector('.listusers');
    DivSelected.innerHTML = '';

    listusers.forEach(user => {
        DivSelected.innerHTML += `
        <span class="avatar avatar-rounded btnSelectTI" data-collabID="${user.collab_id}" data-userID="${user.userID}" data-headcargoId="${user.id_headcargo}">
            <img src="https://cdn.conlinebr.com.br/colaboradores/${user.id_headcargo}" alt="img">
        </span>`;
    });

    DivSelected.innerHTML += `<a class="avatar bg-primary avatar-rounded text-fixed-white" href="javascript:void(0);"> Todos </a>`;
}

// Lista todos os usuários do departamento de TI para escolha
async function listAllUsersTIToChoice() {
    const listusers = await makeRequest('/api/users/ListUserByDep/7');
    const optionsList = listusers.map(user => ({
        customProperties: { dataHead: user.id_headcargo },
        value: user.collab_id,
        label: `${user.username} ${user.familyName}`,
        id: user.collab_id
    }));

    choicesInstance = new Choices('select[name="atribuido"]', {
        choices: optionsList,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis',
    });

    choicesInstanceEdit = new Choices('select[name="edit_atribuido"]', {
        choices: optionsList,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis',
    });
}

async function listCategories() {
    const categories = await makeRequest('/api/called/categories');
    let categoryList = categories.map(category => ({
        customProperties: { id: category.id },
        value: category.id,
        label: `${category.name}`,
        id: category.id
    }));

    SCategories = new Choices('select[name="categories"]', {
        choices: categoryList,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis',
    });

    SEditing_Categories = new Choices('select[name="edit_categories"]', {
        choices: categoryList,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis',
    });
}

// Lista todos os responsáveis
async function listResponsibles() {
    const users = await makeRequest('/api/users/listAllUsers');
    updateResponsibleOptions(users, 'responsible');
    updateResponsibleOptions(users, 'edit_responsible');
}

// Atualiza as opções de responsáveis nos selects
function updateResponsibleOptions(users, selectName) {
    const selectElement = document.querySelector(`select[name="${selectName}"]`);
    selectElement.innerHTML = '';

    users.forEach(user => {
        selectElement.innerHTML += `<option data-headcargoID="${user.id_headcargo}" id="${user.id_colab}" value="${user.id_colab}">${user.username} ${user.familyName}</option>`;
    });

    // Configurações padrões do select2
    const $select = $(`select[name="${selectName}"]`).select2({
        dropdownParent: $(`#${selectName === 'responsible' ? 'add-task' : 'edit-task'}`),
        templateResult: selectFormatImg,
        templateSelection: selectFormatImg,
        placeholder: "Selecione o colaborador",
        escapeMarkup: m => m,
        allowClear: true // Permite limpar a seleção
    });

    // Definindo o valor como null e disparando o evento change para atualizar a interface
    $select.val(null).trigger('change');

    // Função auxiliar para tentar focar no campo de pesquisa
    function focusSearchField() {
        const searchField = document.querySelector('.select2-search__field');
        if (searchField) {
            searchField.focus();
        } else {
            setTimeout(focusSearchField, 100);
        }
    }

    // Evento para focar no input de pesquisa do Select2 quando ele é aberto
    $select.on('select2:open', function () {
        focusSearchField();
    });
}

// Botão de salvar chamado dentro do modal
async function saveTicket(settingsTicket){
    const ticket = await makeRequest('/api/called/tickets/saveTicket', 'POST', settingsTicket);

    $('#edit-task').modal('hide');
    // Se a data de aprovação for vazia, só lista os chamados normalmente
    if (settingsTicket.approved_at == '') {
        await listAllTickets()
        await initEvents()

        // Se a data de approvação for diferente de vazia, joga o chamado para concluido
    } else if (settingsTicket.approved_at !== '') {
        await makeRequest('/api/called/tickets/updateStatus', 'POST', { id: settingsTicket.id, status: 'completed-tasks-draggable' });
        await listAllTickets()
        await initEvents()
    }
}

// Cria um novo ticket
async function createTicket(settingsTicket) {
    const ticket = await makeRequest('/api/called/tickets/create', 'POST', settingsTicket);

    const users = settingsTicket.atribuido.map(user => `
        <span class="avatar avatar-sm avatar-rounded" title="${user.name}" data-collabID="${user.id}" data-headcargoId="${user.dataHead}">
            <img src="https://cdn.conlinebr.com.br/colaboradores/${user.dataHead}" alt="img">
        </span>`).join('');

        const dateEnd = settingsTicket.finished_at 
        ? `<span class="badge bg-success-transparent">${formatDateBR(settingsTicket.finished_at)}</span>` 
        : settingsTicket.timeEnd 
        ? `<span class="badge bg-danger-transparent">${formatDateBR(settingsTicket.timeEnd)}</span>`
        : '';

    const card = `
    <div class="card custom-card task-card task-card-${ticket.id}" id="${ticket.id}">
        <div class="card-body p-0">
            <div class="p-3 kanban-board-head">
                <div class="d-flex text-muted justify-content-between mb-1 fs-12 fw-semibold">
                    <div>${dateEnd}</div>
                </div>
                <div class="kanban-content mt-2">
                    <h6 class="fw-semibold mb-1 fs-15">${settingsTicket.title}</h6>
                    <div class="kanban-task-description">${(settingsTicket.description).replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            <div class="p-3 border-top border-block-start-dashed">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <a href="javascript:void(0);" class="text-muted">
                            <span class="me-1"><i class="ri-message-2-line align-middle fw-normal"></i></span>
                            <span class="fw-semibold fs-12">0</span>
                        </a>
                    </div>
                    <div class="avatar-list-stacked">${users}</div>
                </div>
            </div>
        </div>
    </div>`;

    document.querySelector(settingsTicket.type).innerHTML += card;

    initializeTaskCardEvents()

    $('#add-task').modal('hide');
}

// Função para adicionar Mensagem
async function addMessage(){
    const inputMessage = document.querySelector('.inputMessage');
    const ButtonAddMessage = document.getElementById('ButtonAddMessage');
    const ticketId = ButtonAddMessage.getAttribute('data-id');
    const body = inputMessage.value;

    
    if (body.trim() !== '') {
        const message = await makeRequest('/api/called/tickets/createMessage', 'POST', {ticketId:ticketId, body:body, collab_id:StorageGoogle.system_collaborator_id}); 
        

        const messageList = `<li class="chat-item-end">
                                <div class="chat-list-inner">
                                    <div class="ms-3"> 
                                    <span class="chatting-user-info chatnameperson"> 
                                        ${message.colab_name} <span class="msg-sent-time" style="font-size: 9px;">${formatDate(message.date)}</span> 
                                    </span>
                                        <div class="main-chat-msg">
                                            <div style="width: 100%;">
                                                <p class="mb-0">${body}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>`


    document.querySelector(`.chat-ticket`).innerHTML += messageList


    inputMessage.value = ''; // Limpa o input após o envio
    scrollToBottom(`.cardScrollMessage`)
    }
}

// Lista todos os tickets
async function listAllTickets_nao_usar() {
    const cards = document.querySelectorAll('.task-card')
    for (let index = 0; index < cards.length; index++) {
        const element = cards[index];
        element.remove()
        
    }

    const tickets = await makeRequest('/api/called/tickets/listAll');
    
    for (let index = 0; index < tickets.length; index++) {
        const ticket = tickets[index];

        const users = ticket.atribuido.map(item => `
        <span class="avatar avatar-sm avatar-rounded userTiAtributed" title="${item.name}" data-collabID="${item.collaborator_id}" data-headcargoId="${item.id_headcargo}">
            <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt="img">
        </span>`).join('');


    const dateEnd = ticket.finished_at 
        ? `<span class="badge bg-success-transparent">${formatDateBR(ticket.finished_at)}</span>` 
        : ticket.end_forecast 
        ? `<span class="badge bg-danger-transparent">${formatDateBR(ticket.end_forecast)}</span>`
        : '';

    const card = `
    <div class="card custom-card task-card task-card-${ticket.id}" id="${ticket.id}">
        <div class="card-body p-0">
            <div class="p-3 kanban-board-head">
                <div class="d-flex text-muted justify-content-between mb-1 fs-12 fw-semibold">
                    <div><span class="badge bg-success-transparent">${ticket.start_forecast ? formatDateBR(ticket.start_forecast) : formatDateBR(ticket.created_at) }</span></div>
                    <div>${dateEnd}</div>
                </div>
                <div class="d-flex align-items-center justify-content-between">
                    <div class="task-badges"></div>
                </div>
                <div class="kanban-content mt-2">
                    <h6 class="fw-semibold mb-1 fs-15">${ticket.title} - Ticket #${ticket.id}</h6>
                    <div class="kanban-task-description">${(ticket.description).replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            <div class="p-3 border-top border-block-start-dashed">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <a href="javascript:void(0);" class="text-muted">
                            <span class="me-1"><i class="ri-message-2-line align-middle fw-normal"></i></span>
                            <span class="fw-semibold fs-12">${ticket.messageCount}</span>
                        </a>
                    </div>
                    <div style="display: none;">${ticket.responsible_name} ${ticket.responsible_family_name}</div>
                    <div class="avatar-list-stacked">${users}</div>
                </div>
            </div>
        </div>
    </div>`;

    const container = document.querySelector(`#${ticket.status}`) || document.querySelector('#new-tasks-draggable');
    container.innerHTML += card; 
    }

    
   
}

async function listAllTickets() {
    // Remover os cards atuais de todos os containers
    document.querySelectorAll('.task-card').forEach(card => card.remove());

    // Fazer a requisição dos tickets
    const tickets = await makeRequest('/api/called/tickets/listAll');

    // Objeto para armazenar a contagem de chamados por status
    const statusCounts = {};

    // Criar o HTML de cada ticket e adicionar ao container correspondente
    tickets.forEach(ticket => {

        let priority = '';
        let color = '';

        if (ticket.priority == 'low'){
            priority = 'Baixa';
            color = 'info-rgb';
        }
        if (ticket.priority == 'medium'){
            priority = 'Média';
            color = 'success-rgb';
        }
        if (ticket.priority == 'high'){
            priority = 'Alta';
            color = 'warning-rgb';
        }
        if (ticket.priority == 'critical'){
            priority = 'Crítica';
            color = 'danger-rgb';
        }

        // Incrementar a contagem de chamados para o status atual
        statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;

        // Construir o HTML dos avatares de usuários atribuídos
        const users = ticket.atribuido.map(item => `
            <span class="avatar avatar-sm avatar-rounded userTiAtributed" title="${item.name}" data-collabID="${item.collaborator_id}" data-headcargoId="${item.id_headcargo}">
                <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt="img">
            </span>
        `).join('');

        // Determinar a data de conclusão ou previsão de conclusão
        const dateEnd = ticket.finished_at 
            ? `<span class="badge bg-success-transparent">${formatDateBR(ticket.finished_at)}</span>` 
            : ticket.end_forecast 
            ? `<span class="badge bg-danger-transparent">${formatDateBR(ticket.end_forecast)}</span>`
            : '';

        // Construir o HTML completo do card de ticket
        const cardHTML = `
            <div class="card custom-card task-card task-card-${ticket.id}" id="${ticket.id}">
                <div class="card-body p-0">
                    <div class="p-3 kanban-board-head">
                        <div class="d-flex text-muted justify-content-between mb-1 fs-12 fw-semibold">
                            <div><span class="badge bg-success-transparent">${ticket.start_forecast ? formatDateBR(ticket.start_forecast) : formatDateBR(ticket.created_at)}</span></div>
                            <div>${dateEnd}</div>
                        </div>
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="task-badges"></div>
                        </div>
                        <div class="kanban-content mt-2">
                            <h6 class="fw-semibold mb-1 fs-15">${ticket.title} - Ticket #${ticket.id}</h6>
                            <div class="kanban-task-description">${ticket.description.replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                    <div class="p-3 border-top border-block-start-dashed">
                    <div style="display: none;">${ticket.responsible_name} ${ticket.responsible_family_name}</div>
                        <div class="row d-flex align-items-center justify-content-between">
                            <div class="col-3 d-flex" style="justify-content: left;">
                                <a href="javascript:void(0);" class="text-muted">
                                    <span class="me-1"><i class="ri-message-2-line align-middle fw-normal"></i></span>
                                    <span class="fw-semibold fs-12">${ticket.messageCount}</span>
                                </a>
                            </div>
                            <div class="col-6 d-flex" style="justify-content: center;align-items: center;flex-direction: column;">
                                <div style="color: rgb(var(--${color})) !important;">${priority}</div>
                                <div style="color: rgb(var(--${color})) !important; font-size: 9px;">${ticket.category}</div>
                            </div>
                            <div class="col-3 avatar-list-stacked d-flex" style="justify-content: right; padding-right: 1%;">${users}</div>
                        </div>
                    </div>
                </div>
            </div>`;

            // Selecionar o container apropriado com base no status do ticket
            const container = document.querySelector(`#${ticket.status}`) || document.querySelector('#new-tasks-draggable');
            
            // Inserir o card no container correspondente
            container.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Atualizar o elemento de contagem para cada status
    Object.keys(statusCounts).forEach(status => {
        const countElement = document.querySelector(`#${status}-count`);
        if (countElement) {
            countElement.textContent = statusCounts[status];
        }
    });
}



// Função para rolar até o final de um elemento específico
function scrollToBottom(selector) {
    const element = document.querySelector(selector);
    element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth' // Faz a rolagem ser suave
    });
}

// Edita uma tarefa existente
async function editTask(taskId) {
    try {
        let data = await makeRequest('/api/called/tickets/getById', 'POST', { id: taskId });
        data = data[0];

        // Preenche os campos do modal com os dados recebidos
        document.querySelector('input[name="edit_title"]').value = data.title;
        document.querySelector('textarea[name="edit_description"]').value = data.description;
        document.querySelector('select[name="edit_categories"]').value = data.categorieID;
        document.querySelector('select[name="edit_responsible"]').value = data.responsible;

        $('select[name="edit_responsible"]').val(data.responsible).trigger('change');

        SEditing_Categories.setChoiceByValue(data.categorieID);
    
        // Limpa as seleções existentes e seleciona as opções corretas
        if (choicesInstanceEdit) {
            choicesInstanceEdit.removeActiveItems();
        }

        const selectedAtribuido = data.atribuido.map(item => item.collaborator_id);
        selectedAtribuido.forEach(id => choicesInstanceEdit.setChoiceByValue(id));

        document.querySelector('input[name="edit_timeInit"]').value = data.start_forecast ? formatDate(data.start_forecast) : '';
        document.querySelector('input[name="edit_timeEnd"]').value = data.end_forecast ? formatDate(data.end_forecast) : '';
        document.querySelector('input[name="edit_finished_at"]').value = data.finished_at ? formatDate(data.finished_at) : '';
        document.querySelector('input[name="edit_approved_at"]').value = data.approved_at ? formatDate(data.approved_at) : '';

        document.querySelector('#ButtonRemoveTicket').setAttribute('data-id', taskId)
        document.querySelector('#ButtonSaveTicket').setAttribute('data-id', taskId)

        let messages = await makeRequest('/api/called/tickets/listMessage', 'POST', { id: taskId });

        for (let index = 0; index < messages.length; index++) {
            const element = messages[index];

            const messageList = `<li class="chat-item-end">
                                <div class="chat-list-inner">
                                    <div class="ms-3"> 
                                    <span class="chatting-user-info chatnameperson"> 
                                        ${element.name} <span class="msg-sent-time" style="font-size: 9px;">${formatDate(element.create_at)}</span> 
                                    </span>
                                        <div class="main-chat-msg">
                                            <div style="width: 100%;">
                                                <p class="mb-0">${element.body}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>`

            document.querySelector(`.chat-ticket`).innerHTML += messageList
        }

        setTimeout(() => {
            scrollToBottom(`.cardScrollMessage`)
        }, 500);

        // Abre o modal de edição
        new bootstrap.Modal(document.getElementById('edit-task')).show();
    } catch (error) {
        console.error('Error:', error);
    }
}


// Formata a data no estilo "DD/MM/YYYY HH:mm"
function formatDateBR(value) {
    const dataAtual = value ? new Date(value) : new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');

    return `${dia}-${mes}-${ano} ${horas}:${minutos}`;
}



// Formata a data no estilo "DD/MM/YYYY HH:mm"
function formatDate(value) {
    const dataAtual = value ? new Date(value) : new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');

    return `${ano}-${mes}-${dia} ${horas}:${minutos}`;
}

// Suporte ao Select2 para formatar as imagens no select
function selectFormatImg(client) {
    if (!client.id) return client.text;
    const element = client.element;
    const headID = element.getAttribute('data-headcargoid');
    return $(`<span><img src="https://cdn.conlinebr.com.br/colaboradores/${headID}" /> ${client.text}</span>`);
}



async function eventDragDrop(tickets) {
    tickets.on('drop', async (el, target, source) => {
        const cardId = el.getAttribute('id');
        const newContainerId = target.getAttribute('id');
        await makeRequest('/api/called/tickets/updateStatus', 'POST', { id: cardId, status: newContainerId });

        if (newContainerId == 'inprogress-tasks-draggable') {
            const modalElement = document.getElementById('edit-end-forecast');
            if (myModal) {
                myModal = null;
            }
            myModal = new bootstrap.Modal(modalElement);
            myModal.show();  // Exibe o modal
            IdUpdate = cardId;
        } else if (newContainerId == 'todo-tasks-draggable') {
            const modalElement = document.getElementById('edit-start-forecast');
            if (myModal) {
                myModal = null;
            }
            myModal = new bootstrap.Modal(modalElement);
            myModal.show();
            IdUpdate = cardId;
        }
    });
}

function inputStartForecast() {
    const targetDate = document.getElementById('start_forecast_input').value;
    
    makeRequest('/api/called/tickets/updateStartForecast', 'POST', { id: IdUpdate, date: targetDate });

    if (myModal) {
        myModal.hide();
    }
}

function inputEndForecast() {
    const targetDate = document.getElementById('end_forecast_input').value;
    
    makeRequest('/api/called/tickets/updateEndForecast', 'POST', { id: IdUpdate, date: targetDate });

    if (myModal) {
        myModal.hide();
    }
}

async function notificatePendingTickets() {
    await makeRequest('/api/called/tickets/notificatePendingTickets');
    await makeRequest('/api/called/tickets/notificateExpiringTickets');
}

// Função principal executada ao carregar o DOM
document.addEventListener("DOMContentLoaded", async () => {
    const tickets = dragula([
        document.querySelector('#new-tasks-draggable'), 
        document.querySelector('#todo-tasks-draggable'), 
        document.querySelector('#inprogress-tasks-draggable'), 
        document.querySelector('#inreview-tasks-draggable'), 
        document.querySelector('#completed-tasks-draggable')
    ]);
    
    notificatePendingTickets();
    await listAllUsersTI();
    await listAllUsersTIToChoice();
    await listResponsibles();
    await listCategories();
    await listAllTickets();
    await eventDragDrop(tickets);
    await initEvents();

    // flatpickr(".flatpickr-input", {
    //     dateFormat: "d-m-Y H:i",
    //     enableTime: true,
    //     time_24hr: true,
    //     locale: 'pt'
    // })

    document.querySelector('#loader2').classList.add('d-none')
});

// Função que envia para a proxima janela o id da senha clicada
async function OpenReport() {



    // Obtém o tamanho do monitor do usuário
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    openWindow('/app/ti/projects-and-tickets/report', screenWidth, screenHeight);
 };


 function openNewCalling() {
    // Obtém o tamanho do monitor do usuário
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    // Define largura e altura como metade do tamanho do monitor
    const windowWidth = screenWidth / 1.3;
    const windowHeight = screenHeight / 1.3;

   

    openWindow('/app/ti/projects-and-tickets/create-ticket', windowWidth, windowHeight);
}

function openWindow(url, width, height) {

     // Obtém o tamanho do monitor do usuário
     const screenWidth = window.screen.width;
     const screenHeight = window.screen.height;
 
     // Define largura e altura como metade do tamanho do monitor
     const windowWidth = screenWidth / 2;
     const windowHeight = screenHeight / 2;

     // Calcula a posição para centralizar a janela
     const left = (screenWidth - windowWidth) / 2;
     const top = (screenHeight - windowHeight) / 2;

    window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

