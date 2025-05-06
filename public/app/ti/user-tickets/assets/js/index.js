let choicesInstance, choicesInstanceEdit, SCategories, SEditing_Categories;

// Verifica o localStorage para alterar a mensagem de boas vindas
const StorageGoogleData = localStorage.getItem('StorageGoogle');
const StorageGoogle = JSON.parse(StorageGoogleData);

// Função principal para iniciar os eventos
async function initEvents() {
    initializeButtonAddTicket();
    initializeFilter();
    initializeTaskCardEvents();
    initializeDatePicker();
}

// Apresenta os chamados do colaborador clicado
function filterTicketsByCollaborator(collabId) {
    const allTickets = document.querySelectorAll('.defaultBodyTicket .task-card'); // Captura todos os tickets

    allTickets.forEach(ticket => {

        ticket.style.display = 'none' // Da display none em todos os tickets
        const userTiAttributed = ticket.querySelectorAll('.userTiAtributed'); // Pega todos os colaboradores atribuidos nos tickets

        for (let i = 0; i < userTiAttributed.length; i++) {
            const item = userTiAttributed[i];
            console.log(item)

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
    const buttonAddSimplifiedTicket = document.getElementById('ButtonAddSimplifiedTicket');
    const buttonRemoveTicket = document.getElementById('ButtonRemoveTicket');
    const buttonSaveTicket = document.getElementById('ButtonSaveTicket');
    const buttonApproveByUser = document.getElementById('ButtonApproveTicket');
    const buttonReviewByUser = document.getElementById('ButtonReviewTicket');
    const buttonAddMessage = document.getElementById('ButtonAddMessage');

    const inputMessage = document.querySelector('.inputMessage');

    removeExistingEventListeners(buttonAddTicket, buttonAddSimplifiedTicket, buttonRemoveTicket, buttonSaveTicket, buttonApproveByUser, buttonReviewByUser, buttonAddMessage, inputMessage);

    addEventListeners(buttonAddTicket, buttonAddSimplifiedTicket, buttonRemoveTicket, buttonSaveTicket, buttonApproveByUser, buttonReviewByUser, buttonAddMessage, inputMessage);
}

function removeExistingEventListeners(buttonAddTicket, buttonAddSimplifiedTicket, buttonRemoveTicket, buttonSaveTicket, buttonApproveByUser, buttonReviewByUser, buttonAddMessage, inputMessage) {
    buttonAddTicket.removeEventListener('click', handleAddTicket);
    buttonAddSimplifiedTicket.removeEventListener('click', handleAddSimplifiedTicket);
    buttonRemoveTicket.removeEventListener('click', handleRemoveTicket);
    buttonSaveTicket.removeEventListener('click', handleSaveTicket);
    buttonApproveByUser.removeEventListener('click', handleApproveByUser);
    buttonReviewByUser.removeEventListener('click', handleReviewByUser);
    buttonAddMessage.removeEventListener('click', handleAddMessage);
    inputMessage.removeEventListener('keypress', handleInputMessageKeypress);
}

function addEventListeners(buttonAddTicket, buttonAddSimplifiedTicket, buttonRemoveTicket, buttonSaveTicket, buttonApproveByUser, buttonReviewByUser, buttonAddMessage, inputMessage) {
    buttonAddTicket.addEventListener('click', handleAddTicket);
    buttonAddSimplifiedTicket.addEventListener('click', handleAddSimplifiedTicket);
    buttonRemoveTicket.addEventListener('click', handleRemoveTicket);
    buttonSaveTicket.addEventListener('click', handleSaveTicket);
    buttonApproveByUser.addEventListener('click', handleApproveByUser);
    buttonReviewByUser.addEventListener('click', handleReviewByUser);
    buttonAddMessage.addEventListener('click', handleAddMessage);


    inputMessage.addEventListener('keypress', handleInputMessageKeypress);
}

// Bota abrir novo chamado
async function handleAddTicket(event) {
    event.preventDefault();
    const ticketSettings = getTicketSettings();
    if(ticketSettings){
        document.querySelector('#loader2').classList.remove('d-none')
        await createTicket(ticketSettings);
        await listAllTickets()
        await initEvents()
        await clearFormFields();
        document.querySelector('#loader2').classList.add('d-none')
    }
   
}

function openNewCalling() {
    // Obtém o tamanho do monitor do usuário
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    // Define largura e altura como metade do tamanho do monitor
    const windowWidth = screenWidth / 1.3;
    const windowHeight = screenHeight / 1.3;

   
    const newWindow = window.open('/app/ti/projects-and-tickets/create-ticket', '_blank', `width=${windowWidth},height=${windowHeight},resizable=yes,scrollbars=yes`);

}

async function handleAddSimplifiedTicket(event) {
    event.preventDefault();

    document.querySelector('#loader2').classList.remove('d-none')
    await sendSimplificatedTicket()
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

// remove ticket
async function removeTicket(id) {
    const elementRemove = document.querySelector(`.task-card-${id}`);
    elementRemove.remove()


    $('#edit-task').modal('hide');
    makeRequest('/api/called/tickets/removeTicket', 'POST', { id: id });

}

// Botão de salvar chamado
async function handleSaveTicket(event) {
    event.preventDefault();
    const ticketSettings = getTicketEditing();

    document.querySelector('#loader2').classList.remove('d-none')
    await saveTicket(ticketSettings);
    document.querySelector('#loader2').classList.add('d-none')
}

async function handleApproveByUser(event) {
    event.preventDefault();
    const ticketSettings = getTicketEditing();

    document.querySelector('#loader2').classList.remove('d-none')
    await approveTicketByUser(ticketSettings);
    await listAllTickets()
    await initEvents()
    await clearFormFields();
    document.querySelector('#loader2').classList.add('d-none')
}

async function handleReviewByUser(event) {
    event.preventDefault();
    const ticketSettings = getTicketEditing();

    document.querySelector('#loader2').classList.remove('d-none')
    await reviewTicketByUser(ticketSettings);
    await listAllTickets()
    await initEvents()
    await clearFormFields();
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


// Obtém as configurações do ticket a partir dos inputs do formulário
function getTicketSettings() {
    const selectedOptions = choicesInstance.getValue().map(opcao => ({
        id: opcao.value,
        name: opcao.label,
        dataHead: opcao.customProperties?.dataHead
    }));

    const responsibleElement = document.getElementsByName('responsible')[0];
    const responsibleOption = responsibleElement.options[responsibleElement.selectedIndex];

    const categoriesElement = document.getElementsByName('categories')[0];
    const categoriesValue = SCategories.getValue(true);
    const categoriesName = categoriesElement.textContent;

    const timeInit = document.getElementsByName('timeInit')[0].value;
    const timeEnd = document.getElementsByName('timeEnd')[0].value;
    const finished_at = document.getElementsByName('finished_at')[0].value;
    const title = document.getElementsByName('title')[0].value;
    const description = document.getElementsByName('description')[0].value;


    if (categoriesValue == 'Selecione uma categoria') {
        alert('categoria não pode estar sem seleção')
        // SCategories select is empty, return null or handle the error accordingly
        return null;
    }

    return {
        type: '#new-tasks-draggable',
        responsible: {
            id: responsibleOption.id,
            name: responsibleOption.text
        },
        categories: {
            id: categoriesValue,
            name: categoriesName
        },
        timeInit,
        timeEnd,
        finished_at,
        title,
        atribuido: selectedOptions,
        description,
    };
}

async function clearFormFields() {
    // Limpa os campos de texto
    document.getElementsByName("timeInit")[0].value = "";
    document.getElementsByName("timeEnd")[0].value = "";
    document.getElementsByName("finished_at")[0].value = "";
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
        id: id,
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

                         // Obtém o tamanho do monitor do usuário
                         const screenWidth = window.screen.width;
                         const screenHeight = window.screen.height;
                     
                         // Define largura e altura como metade do tamanho do monitor
                         const windowWidth = screenWidth / 2;
                         const windowHeight = screenHeight / 2;
         
                         // Calcula a posição para centralizar a janela
                         const left = (screenWidth - windowWidth) / 2;
                         const top = (screenHeight - windowHeight) / 2;
         
                         window.open('/app/ti/projects-and-tickets/view-ticket?id='+taskId, '_blank', `width=${screenWidth},height=${screenHeight},resizable=yes,scrollbars=yes`);
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
    const allUsers = await makeRequest('/api/users/listAllUsers');
    const loginData = await getInfosLogin();
    let user = [];
    const idCollaborator = (loginData.system_collaborator_id).toString();
    for (let index = 0; index < allUsers.length; index++) {
        if (allUsers[index].id_colab == idCollaborator){
            user = allUsers[index];
        }
    }
    updateResponsibleOptions(user, 'responsible');
    updateResponsibleOptions(user, 'edit_responsible');
}

// Atualiza as opções de responsáveis nos selects
function updateResponsibleOptions(user, selectName) {
    const selectElement = document.querySelector(`select[name="${selectName}"]`);
    
    // Limpa as opções existentes
    selectElement.innerHTML = '';

    // Adiciona a nova opção ao select
    selectElement.innerHTML += `<option data-headcargoID="${user.id_headcargo}" id="${user.id_colab}" value="${user.id_colab}">${user.username} ${user.familyName}</option>`;

    // Inicializa o select2
    const $select = $(`select[name="${selectName}"]`).select2({
        dropdownParent: $(`#${selectName === 'responsible' ? 'add-task' : 'edit-task'}`),
        templateResult: selectFormatImg,
        templateSelection: selectFormatImg,
        placeholder: "Selecione o colaborador",
        escapeMarkup: m => m,
        allowClear: true
    });

    // Define o valor selecionado no Select2
    $select.val(user.id_colab).trigger('change');

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
async function saveTicket(settingsTicket) {
    const ticket = await makeRequest('/api/called/tickets/saveTicket', 'POST', settingsTicket);

    $('#edit-task').modal('hide');
    // Se a data de finalizado for vazia, só lista os chamados normalmente
    if (settingsTicket.finished_at == '') {
        await listAllTickets()
        await initEvents()

        // Se a data de finalizado for diferente de vazia, joga o chamado para concluido
    } else if (settingsTicket.finished_at !== '') {
        await makeRequest('/api/called/tickets/updateStatus', 'POST', { id: settingsTicket.id, status: 'completed-tasks-draggable' });
        await listAllTickets()
        await initEvents()
    }
}

async function approveTicketByUser(ticketSettings) {
    const ticket = await makeRequest('/api/called/tickets/saveTicket', 'POST', ticketSettings);
    $('#edit-task').modal('hide');
    
    const arrayResult = { id: ticketSettings.id, status: 'completed-tasks-draggable' }
    await makeRequest('/api/user-tickets/updateStatus', 'POST', arrayResult);

}

async function reviewTicketByUser(ticketSettings){
    const ticket = await makeRequest('/api/called/tickets/saveTicket', 'POST', ticketSettings);
    $('#edit-task').modal('hide'); 
    await makeRequest('/api/user-tickets/updateStatus', 'POST', { id: ticketSettings.id, status: 'todo-tasks-draggable' });
}

// Cria um novo ticket
async function createTicket(settingsTicket) {

    const ticket = await makeRequest('/api/called/tickets/create', 'POST', settingsTicket);

    const users = settingsTicket.atribuido.map(user => `
        <span class="avatar avatar-sm avatar-rounded" title="${user.name}" data-collabID="${user.id}" data-headcargoId="${user.dataHead}">
            <img src="https://cdn.conlinebr.com.br/colaboradores/${user.dataHead}" alt="img">
        </span>`).join('');

    const dateEnd = settingsTicket.finished_at
        ? `<span class="badge bg-success-transparent">${formatDate(settingsTicket.finished_at)}</span>`
        : settingsTicket.timeEnd
            ? `<span class="badge bg-danger-transparent">${formatDate(settingsTicket.timeEnd)}</span>`
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
                    <div class="kanban-task-description">${settingsTicket.description}</div>
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
async function addMessage() {
    const inputMessage = document.querySelector('.inputMessage');
    const ButtonAddMessage = document.getElementById('ButtonAddMessage');
    const ticketId = ButtonAddMessage.getAttribute('data-id');
    const body = inputMessage.value;

    if (body.trim() !== '') {
        const message = await makeRequest('/api/called/tickets/createMessage', 'POST', { ticketId: ticketId, body: body, collab_id: StorageGoogle.system_collaborator_id });


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
async function listAllTickets() {
    const cards = document.querySelectorAll('.task-card')
    for (let index = 0; index < cards.length; index++) {
        const element = cards[index];
        element.remove()
    }

    const tickets = await makeRequest('/api/called/tickets/listAll');
    const loginData = await getInfosLogin();
    const idCollaborator = (loginData.system_collaborator_id).toString();

    for (let index = 0; index < tickets.length; index++) {
        const ticket = tickets[index];


        // Exemplo de verificação se um usuário está entre os envolvidos
        const isUserInvolved = ticket.involved.some(person => person.collaborator_id === loginData.system_collaborator_id);
      
        if (ticket.responsible == idCollaborator || isUserInvolved) {
            const users = ticket.atribuido.map(item => `
                <span class="avatar avatar-sm avatar-rounded userTiAtributed" title="${item.name}" data-collabID="${item.collaborator_id}" data-headcargoId="${item.id_headcargo}">
                    <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt="img">
                </span>`).join('');

            const dateEnd = ticket.finished_at
                ? `<span class="badge bg-success-transparent">${formatDate(ticket.finished_at)}</span>`
                : ticket.end_forecast
                    ? `<span class="badge bg-danger-transparent">${formatDate(ticket.end_forecast)}</span>`
                    : '';

            const card = `
            <div class="card custom-card task-card task-card-${ticket.id}" id="${ticket.id}">
                <div class="card-body p-0">
                    <div class="p-3 kanban-board-head">
                        <div class="d-flex text-muted justify-content-between mb-1 fs-12 fw-semibold">
                            <div><span class="badge bg-success-transparent">${formatDate(ticket.start_forecast)}</span></div>
                            <div>${dateEnd}</div>
                        </div>
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="task-badges"></div>
                        </div>
                        <div class="kanban-content mt-2">
                            <h6 class="fw-semibold mb-1 fs-15">${ticket.title}</h6>
                            <div class="kanban-task-description">${ticket.description}</div>
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
                            <div class="avatar-list-stacked">${users}</div>
                        </div>
                    </div>
                </div>
            </div>`;

            const container = document.querySelector(`#${ticket.status}`) || document.querySelector('#new-tasks-draggable');
            container.innerHTML += card;
        }
    }
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

        document.querySelector('#ButtonReviewTicket').classList.add('d-none')
        document.querySelector('#ButtonApproveTicket').classList.add('d-none')

        if (data.status == 'inreview-tasks-draggable') {
            document.querySelector('#ButtonReviewTicket').classList.remove('d-none')
            document.querySelector('#ButtonApproveTicket').classList.remove('d-none')
        }

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

async function printSimplifiedCategories() {
    const simplifiedTicketCategories = await makeRequest('/api/user-tickets/simplifiedticketcategories');
    const divSimplifiedCategories = document.getElementById('simplifiedCategories');
    let printSimplifiedCategories = '';

    for (let index = 0; index < simplifiedTicketCategories.length; index++) {

        printSimplifiedCategories += `
            <div class="col-3">
                <a href="javascript:void(0);" class="border-0" onclick="printSimplifiedSubcategories(${simplifiedTicketCategories[index].id})">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start row">
                            <span class="transaction-icon card icon-square">
                                ${simplifiedTicketCategories[index].icon}
                                <span>${simplifiedTicketCategories[index].name}</span>
                            </span>
                        </div>
                    </div>
                </a>
            </div>`
    }
    divSimplifiedCategories.innerHTML = printSimplifiedCategories;
}

async function printSimplifiedSubcategories(category) {
    const simplifiedTicketSubcategories = await makeRequest('/api/user-tickets/simplifiedticketsubcategories');
    const divSimplifiedSubcategories = document.getElementById('simplifiedSubcategories');
    let printSimplifiedSubcategories = '';

    for (let index = 0; index < simplifiedTicketSubcategories.length; index++) {
        if (simplifiedTicketSubcategories[index].id_simplified_ticket_categories == category) {
            printSimplifiedSubcategories += `
                <div class="col-3">
                    <a href="javascript:void(0);" class="border-0">
                        <div class="list-group-item border-0">
                            <div class="d-flex align-items-start row">
                                <span class="transaction-icon card icon-square simplified-ticket" data-name="${simplifiedTicketSubcategories[index].name}" id="${simplifiedTicketSubcategories[index].id}">
                                    ${simplifiedTicketSubcategories[index].icon}
                                    <span>${simplifiedTicketSubcategories[index].name}</span>
                                </span>
                            </div>
                        </div>
                    </a>
                </div>`
        }
    }
    divSimplifiedSubcategories.innerHTML = printSimplifiedSubcategories;

    selectSimplifiedTicket();
}

function selectSimplifiedTicket() {
    const buttons = document.querySelectorAll('.simplified-ticket');

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            buttons.forEach(function (b) {
                b.classList.remove('selected-ticket');
            });
            this.classList.add('selected-ticket');
        });
    });
}

async function sendSimplificatedTicket() {

    const loginData = await getInfosLogin();
    const subCategory = document.querySelector('.selected-ticket');
    const idCollaborator = (loginData.system_collaborator_id).toString();

    if (subCategory) {
        const subCategoryId = subCategory.getAttribute('id');
        let description = document.querySelector('#simplifiedDescription').value;
        const categoryName = subCategory.getAttribute('data-name');

        const arraySimplifiedTicket = { subCategoryId, description, categoryName, idCollaborator };

        const ticket = await makeRequest('/api/user-tickets/create', 'POST', arraySimplifiedTicket);

        resetSimplifiedTicket();
    }
}

function resetSimplifiedTicket() {

    $('#add-simplified-task').modal('hide');
    document.getElementById('simplifiedDescription').value = "";

    const divSimplifiedSubcategories = document.getElementById('simplifiedSubcategories');
    let printSimplifiedSubcategories = '';

    printSimplifiedSubcategories = ``
    divSimplifiedSubcategories.innerHTML = printSimplifiedSubcategories;
}

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}


// Função principal executada ao carregar o DOM
document.addEventListener("DOMContentLoaded", async () => {

    await listAllUsersTIToChoice();
    await listResponsibles();
    await listCategories();
    await listAllTickets();
    await initEvents();
    await printSimplifiedCategories();

    document.querySelector('#loader2').classList.add('d-none')
});
