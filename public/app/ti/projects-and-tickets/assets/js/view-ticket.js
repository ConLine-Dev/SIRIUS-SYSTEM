

let GticketId, itUserSelect, selectedColumn, selectedValueChange, responsibleSelect, involvedSelect;

const socket = io();

/**
 * Evento principal ao carregar o DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {

    await loadItTeam();
    await initializeComponents();
    await loadTicket();
    await verifyAcess();
    await loadResponsibleUsers();
    await loadInvolved();


    socket.on('new-message-ticket', async (data) => {
        if(data.default_msg.ticket_id == GticketId){
            await addComments(data.default_msg);
        }
        
    })

    socket.on('changeColumn', async (data) => {
        console.log(data)
        const priority = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta',
            'critical': 'Critica',
        }

        // Define as classes correspondentes às prioridades
        const priorityClasses = {
            'low': 'bg-info-transparent',    // Baixa
            'medium': 'bg-success-transparent', // Média
            'high': 'bg-warning-transparent',    // Alta
            'critical': 'bg-danger-transparent' // Crítica (exemplo)
        };

        let ticket = await makeRequest('/api/called/tickets/getById', 'POST', { id: GticketId });
        ticket = ticket[0];
        document.querySelector('.start_forecast').innerHTML = ticket.start_forecast ? formatDateBR(ticket.start_forecast) : 'Não informado';
        document.querySelector('.end_forecast').innerHTML = ticket.end_forecast ? formatDateBR(ticket.end_forecast) : 'Não informado';
        document.querySelector('.priority_text').innerHTML = priority[ticket.priority];
        document.querySelector('.category_text').innerHTML = ticket.categorieName;
        document.querySelector('.responsibleName').innerHTML = ticket.name;
        document.querySelector('.responsibleIMG').setAttribute('src', 'https://cdn.conlinebr.com.br/colaboradores/' + ticket.id_headcargo)

        // Atualiza a classe do elemento priority_text
        const priorityElement = document.querySelector('.priority_text');
        // Remove todas as classes de prioridade existentes
        Object.values(priorityClasses).forEach(cls => priorityElement.classList.remove(cls));
        // Adiciona a nova classe baseada na prioridade
        priorityElement.classList.add(priorityClasses[ticket.priority]);



        await writeInvolved(ticket.involved);
        
    })

    socket.on('update-step-status', async (data) => {
        const stepsList = document.getElementById('steps-list');
   
        const stepItem = stepsList.querySelector(`[data-id="${parseInt(data.stepId)}"]`);
        const stepCheckbox = stepItem.querySelector('.step-checkbox');
        stepCheckbox.checked = data.completed;
        console.log(data, 'update-step-status');
    })

    socket.on('delete-step-status', async (data) => {
        const stepsList = document.getElementById('steps-list');
        console.log(data)
        const stepItem = stepsList.querySelector(`[data-id="${parseInt(data.stepId)}"]`);

        if(stepItem){
            stepItem.remove();
        }
        
    })

    socket.on('create-step', async (data) => {
        const result = data.result;
        const stepsList = document.getElementById('steps-list');

        // Adiciona o novo item à lista usando innerHTML
        stepsList.innerHTML += `
            <li class="list-group-item" data-id="${result.insertId}">
                <div class="d-flex align-items-center">
                    <!-- Conteúdo à esquerda -->
                    <div class="me-auto d-flex align-items-center">
                    <input data-id="${result.insertId}" class="form-check-input form-checked-success me-2 step-checkbox" type="checkbox" value="">
                        <span class="fw-semibold">${data.step}</span>
                    </div>
                    <!-- Botão à direita -->
                    <button data-id="${result.insertId}" class="btn btn-sm btn-danger remove-btn">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </li>
        `;

        verifyAcess();
    })

    
    socket.on('new-file-ticket', async (data) => {
        if(data.id == GticketId){
            await addFiles([data.data[0]]);
        }
        verifyAcess();
    })

    socket.on('remove-file-ticket', async (data) => {


        if(data.ticketId == GticketId){
            document.querySelector('[data-id-ref="'+data.filename+'"]').remove();
        }
    
        
    })

    socket.on('update-team', async (data) => {


        if(data[0].ticket_id == GticketId){
            await writeAssigned(data);
        }
        verifyAcess();
        
    })

    

    socket.on('remove-assigned', async (data) => {
        console.log(data)
        const btnRemoveAssigned = document.querySelector('.btn-remove-assigned[data-id="'+data.userId+'"]');

        if(btnRemoveAssigned){
            btnRemoveAssigned.closest('tr').remove();
        }

        verifyAcess();
        
    })
    


    document.querySelector('#loader').classList.add('d-none');

});

async function verifyAcess(){


    const user = await getInfosLogin();

    console.log(user)

    if(user.department_ids == 7){
        console.log(true)
    }else{
        console.log(false)
    }

    if(user && user.department_ids && user.department_ids == 7){
        // document.querySelector('.buttonComment').removeAttribute('disabled');
        // document.querySelector('.inputComment').removeAttribute('disabled');
        // document.querySelector('#new-step').removeAttribute('disabled');
        // document.querySelector('#add-step-btn').removeAttribute('disabled');
        // document.querySelector('.multiple-filepond-Attachments').removeAttribute('disabled');

        addClickEventsToTI()
       

    }else{

        document.querySelector('.btnControleTeam').setAttribute('disabled', true);

        const setps = document.querySelectorAll('.step-checkbox');
        setps.forEach(step => {
            step.setAttribute('disabled', true);
        })

        const removebtn = document.querySelectorAll('.remove-btn');
        removebtn.forEach(step => {
            step.setAttribute('disabled', true);
        })

        const ButtonRemoveTicket = document.querySelectorAll('#ButtonRemoveTicket');
        ButtonRemoveTicket.forEach(step => {
            step.setAttribute('disabled', true);
        })

        

        const removebtnFiles = document.querySelectorAll('.files button');
        removebtnFiles.forEach(step => {
            step.setAttribute('disabled', true);
        })

        const btnRemoveAssigned = document.querySelectorAll('.btn-remove-assigned');
        btnRemoveAssigned.forEach(step => {
            step.setAttribute('disabled', true);
        })
        
        document.querySelector('#new-step').setAttribute('disabled', true);
        
        

        
    }
}

/**
 * Carrega os responsáveis e popula o select correspondente.
 */
async function loadResponsibleUsers() {
    const users = await makeRequest('/api/users/listAllUsers');

    const selectElement = document.querySelector('select[name="change_responsible"]');
    selectElement.innerHTML = '';

    users.forEach(user => {
        selectElement.innerHTML += `
            <option 
                data-headcargoID="${user.id_headcargo}" 
                id="${user.id_colab}" 
                value="${user.id_colab}">
                ${user.username} ${user.familyName}
            </option>`;
    });

    responsibleSelect = $(`select[name="change_responsible"]`).select2({
        templateResult: formatSelectWithImages,
        templateSelection: formatSelectWithImages,
        placeholder: "Selecione o colaborador",
        escapeMarkup: markup => markup,
        allowClear: true
    });

    responsibleSelect.val(null).trigger('change');
}

// async function loadInvolved() {
//     const users = await makeRequest('/api/users/listAllUsers');

//     const selectElement = document.querySelector('select[name="change_involved"]');
//     selectElement.innerHTML = '';

//     users.forEach(user => {
//         selectElement.innerHTML += `
//             <option 
//                 data-headcargoID="${user.id_headcargo}" 
//                 id="${user.id_colab}" 
//                 value="${user.id_colab}">
//                 ${user.username} ${user.familyName}
//             </option>`;
//     });

//     involvedSelect = $(`select[name="change_involved"]`).select2({
//         templateResult: formatSelectWithImages,
//         templateSelection: formatSelectWithImages,
//         placeholder: "Selecione o colaborador",
//         escapeMarkup: markup => markup,
//         allowClear: true
//     });

//     involvedSelect.val(null).trigger('change');
// }

async function loadInvolved() {
    const users = await makeRequest('/api/users/listAllUsers');

    // Formatar dados para o Choices.js
    const options = users.map(user => ({
        value: `${user.id_colab}`,
        label: `${user.username} ${user.familyName}`
    }));

    // Verificar se o Choices.js já está inicializado
    if (involvedSelect) {
        involvedSelect.destroy();
    }

    // Inicializar Choices.js
    involvedSelect = new Choices('select[name="change_involved"]', {
        choices: options,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis'
    });
}

function getSelectedInvolved() {
    if (!involvedSelect) return [];

    // Obter os valores selecionados do Choices.js
    return involvedSelect.getValue(true); // Retorna os valores como um array de strings
}

/**
 * Formata o select para incluir imagens dos usuários.
 */
function formatSelectWithImages(option) {
    if (!option.id) return option.text;
    const element = option.element;
    const headId = element.getAttribute('data-headcargoID');
    return $(`<span><img src="https://cdn.conlinebr.com.br/colaboradores/${headId}" /> ${option.text}</span>`);
}


async function getParams(param) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get(param);
    return id;
};

async function loadTicket() {
    GticketId = await getParams('id');

    let ticket = await makeRequest('/api/called/tickets/getById', 'POST', { id: GticketId });

    await toFillTicket(ticket[0]);
}

async function toFillTicket(ticket){
    const status = {
        'new-tasks-draggable': 'Aguardando Atribuição',
        'todo-tasks-draggable': 'Em Análise',
        'inprogress-tasks-draggable': 'Em Andamento',
        'inreview-tasks-draggable': 'Em Revisão',
        'completed-tasks-draggable': 'Concluído',
    }

    const statusClasses = {
        'new-tasks-draggable': 'bg-info-transparent',
        'todo-tasks-draggable': 'bg-success-transparent',
        'inprogress-tasks-draggable': 'bg-warning-transparent',
        'inreview-tasks-draggable': 'bg-danger-transparent',
        'completed-tasks-draggable': 'bg-secondary-transparent'
    }

    const priority = {
        'low': 'Baixa',
        'medium': 'Média',
        'high': 'Alta',
        'critical': 'Critica',
    }

    // Define as classes correspondentes às prioridades
    const priorityClasses = {
        'low': 'bg-info-transparent',    // Baixa
        'medium': 'bg-success-transparent', // Média
        'high': 'bg-warning-transparent',    // Alta
        'critical': 'bg-danger-transparent' // Crítica (exemplo)
    };


    console.log(ticket)

    document.querySelector('.task-title').innerHTML = ticket.title;
    document.querySelector('.created_at').innerHTML = formatDateBR(ticket.created_at);
    document.querySelector('.start_forecast').innerHTML = ticket.start_forecast ? formatDateBR(ticket.start_forecast) : 'Não informado';
    document.querySelector('.end_forecast').innerHTML = ticket.end_forecast ? formatDateBR(ticket.end_forecast) : 'Não informado';
    document.querySelector('.status_text').innerHTML = status[ticket.status];
    document.querySelector('.priority_text').innerHTML = priority[ticket.priority];
    document.querySelector('.category_text').innerHTML = ticket.categorieName;
    document.querySelector('.responsibleName').innerHTML = ticket.name;
    document.querySelector('.responsibleIMG').setAttribute('src', 'https://cdn.conlinebr.com.br/colaboradores/'+ticket.id_headcargo)
    document.querySelector('#ticket_id').innerHTML = ticket.id;
    document.querySelector('#ButtonRemoveTicket').setAttribute('data-id', ticket.id)

    if(ticket.status == 'inreview-tasks-draggable'){
        document.querySelector('#ButtonApproveTicket').removeAttribute('disabled');
        document.querySelector('#ButtonReviewTicket').removeAttribute('disabled');
        
    }else{
        document.querySelector('#ButtonApproveTicket').setAttribute('disabled', true);
        document.querySelector('#ButtonReviewTicket').setAttribute('disabled', true);
    }


    // Atualiza a classe do elemento priority_text
    const priorityElement = document.querySelector('.priority_text');
    // Remove todas as classes de prioridade existentes
    Object.values(priorityClasses).forEach(cls => priorityElement.classList.remove(cls));
    // Adiciona a nova classe baseada na prioridade
    priorityElement.classList.add(priorityClasses[ticket.priority]);


    // Atualiza a classe do elemento status_text
    const statusElement = document.querySelector('.status_text');
    // Remove todas as classes de prioridade existentes
    Object.values(statusElement).forEach(cls => statusElement.classList.remove(cls));
    // Adiciona a nova classe baseada na prioridade
    statusElement.classList.add(statusClasses[ticket.status]);



    


    await writeFiles(ticket.files);
    await writeSteps(ticket.steps);
    await writeAssigned(ticket.atribuido);
    await writeDescription(ticket.description);
    await writeComments(ticket.comments);
    await writeInvolved(ticket.involved);
    

}

async function writeInvolved(involved){
    const HTMLinvolved = involved.map(user => `<span title="${user.fullName}" class="avatar avatar-sm avatar-rounded" data-bs-toggle="tooltip" data-bs-custom-class="tooltip-primary" data-bs-original-title="${user.fullName}">
    <img src="https://cdn.conlinebr.com.br/colaboradores/${user.id_headcargo}" alt="img">
  </span>`).join('');

    document.querySelector('.involved').innerHTML = HTMLinvolved;

}

async function setTeam(){

    const teamByTicket =  await makeRequest(`/api/called/tickets/teamByTicket`, 'POST', {ticketId: GticketId});

    // Verifica se o `itUserSelect` já está inicializado
    if (!itUserSelect) {
        console.error('itUserSelect não foi inicializado.');
        return;
    }

    // Limpa as seleções existentes no select
    itUserSelect.removeActiveItems();

    // Define os membros do time como selecionados no select
    (teamByTicket.data).forEach(member => {
        itUserSelect.setChoiceByValue(member.collaborator_id); // Certifique-se de que o ID seja uma string
    });

}

/**
 * Carrega os usuários do departamento de TI e preenche o select correspondente.
 */
async function loadItTeam() {
    const users = await makeRequest('/api/users/ListUserByDep/7');

    const options = users.map(user => ({
        customProperties: { dataHead: user.id_headcargo },
        value: user.collab_id,
        label: `${user.username} ${user.familyName}`
    }));

    itUserSelect = new Choices('select[name="input-add-team"]', {
        choices: options,
        allowHTML: true,
        removeItemButton: true,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis'
    });
}


/**
 * Inicializa os componentes do editor de texto Quill e FilePond.
 */
async function initializeComponents() {
    // Configuração do FilePond
    FilePond.registerPlugin(
        // FilePondPluginImagePreview,
        FilePondPluginImageExifOrientation,
        FilePondPluginFileValidateSize,
        FilePondPluginFileEncode,
        FilePondPluginImageEdit,
        FilePondPluginFileValidateType,
        FilePondPluginImageCrop,
        FilePondPluginImageResize,
        FilePondPluginImageTransform
    );

    const inputElement = document.querySelector('.multiple-filepond-Attachments');
    if (inputElement) {
        fileAttachments = FilePond.create(inputElement, {
            maxFiles: 5,
            allowProcess: true,
            allowMultiple: true, // Permitir múltiplos arquivos
            instantUpload: true, // Esperar antes de enviar
            server: {
                process: {
                    url: '/api/called/tickets/upload-file-ticket',
                    method: 'POST',
                    headers: {
                        'x-csrf-token': '' // Caso use um token CSRF
                    },
                    ondata: (formData) => {
                        formData.append('ticketId', GticketId); // Substitua por um ID dinâmico
                        return formData;
                    },
                    onload: async (response) => {
                        // Manipule a resposta do servidor aqui
                        const serverResponse = JSON.parse(response); // Parse a resposta, caso seja JSON
                        // console.log('Resposta do servidor:', serverResponse);

                        if (serverResponse.success) {
                            // await addFiles(serverResponse.data)
                           
                        } else {
                            // console.log('Erro ao enviar arquivo: ' + serverResponse.message);
                        }

                        return serverResponse; // Opcional, retorna para manipulação adicional
                    },
                    onerror: (response) => {
                        console.error('Erro do servidor ao processar o arquivo:', response);
                        alert('Erro no upload do arquivo.');
                    }
                }
            },
            labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>',
            labelFileProcessingComplete: 'Upload concluído',
            labelFileProcessingError: 'Erro ao fazer upload',
            labelButtonProcessItem: 'Fazer Upload',
        });

        // Evento ao adicionar arquivo
        fileAttachments.on('addfile', (error, file) => {
            if (error) {
                console.error('Erro ao adicionar arquivo:', error);
            } else {
                console.log('Arquivo adicionado:', file.filename);
            }
        });

        // Evento ao concluir o processamento de um arquivo
        fileAttachments.on('processfile', (error, file) => {
            if (error) {
                console.error('Erro no processamento do arquivo:', error);
            } else {
                // console.log('Arquivo processado com sucesso:', file.filename);
                // console.log(file);
                // Remove apenas o arquivo que foi processado com sucesso
                fileAttachments.removeFile(file.id);
            }
        });
    }


    
    document.querySelector('#ButtonReviewTicket').addEventListener('click', async (e) => {
        const confirmation = window.confirm("Você tem certeza que deseja revisar este ticket?");
        if (!confirmation) {
            return; // Cancela a execução se o usuário não confirmar
        }
    
        document.querySelector('#ButtonReviewTicket').setAttribute('disabled', true);
    
        await makeRequest('/api/user-tickets/updateStatus', 'POST', { id: GticketId, status: 'todo-tasks-draggable' });
        window.close();
    });
    
    document.querySelector('#ButtonApproveTicket').addEventListener('click', async (e) => {
        const confirmation = window.confirm("Você tem certeza que deseja aprovar este ticket?");
        if (!confirmation) {
            return; // Cancela a execução se o usuário não confirmar
        }
    
        document.querySelector('#ButtonApproveTicket').setAttribute('disabled', true);
    
        const arrayResult = { id: GticketId, status: 'completed-tasks-draggable' };
        await makeRequest('/api/user-tickets/updateStatus', 'POST', arrayResult);
        window.close();
    });


    document.querySelector('.buttonComment').addEventListener('click', async (e) => {
        document.querySelector('.buttonComment').setAttribute('disabled', true);
        const comment = document.querySelector('.inputComment').value;
        const user = await getInfosLogin();

        if (comment) {
            document.querySelector('.inputComment').value = '';
            await makeRequest('/api/called/tickets/createMessage', 'POST', {ticketId: GticketId, collab_id: user.system_collaborator_id, name: user.system_name, body: comment});
            document.querySelector('.buttonComment').removeAttribute('disabled');
        }
    });


    document.querySelector('#ButtonRemoveTicket').addEventListener('click', async (e) => {
        e.preventDefault();
    
        // Exibe uma mensagem de confirmação
        const confirmation = window.confirm("Você tem certeza que deseja remover este ticket?");
        if (!confirmation) {
            return; // Cancela a execução se o usuário não confirmar
        }
    
        const ticketId = document.querySelector('#ButtonRemoveTicket').getAttribute('data-id');
        
        // Faz a requisição para remover o ticket
        await makeRequest('/api/called/tickets/removeTicket', 'POST', { id: ticketId });
    
        // Fecha a janela após a ação
        window.close();
    });

    document.querySelector('.inputComment').addEventListener('keydown', async (e) => {
        const comment = document.querySelector('.inputComment').value;
        if (e.key === 'Enter' && comment && comment.trim() !== '' && !e.shiftKey) {
            e.preventDefault(); // Impede o comportamento padrão de inserir uma nova linha
            document.querySelector('.buttonComment').click(); // Simula o clique no botão
        }
    });

    document.querySelector('#new-step').addEventListener('keydown', async (e) => {
        const step = document.querySelector('#new-step').value;
        if (e.key === 'Enter' && step.trim() && step) {
            e.preventDefault(); // Impede o comportamento padrão de inserir uma nova linha
            document.querySelector('#add-step-btn').click(); // Simula o clique no botão
        }
    });


    // Pega o valor do input
    const input = document.getElementById('new-step');
    const stepsList = document.getElementById('steps-list');

    // Adiciona uma etapa
    document.getElementById('add-step-btn').addEventListener('click', async function () {
        const newStepText = input.value.trim(); // Remove espaços extras

        if (newStepText === '') {
            alert('Por favor, insira uma etapa.');
            return;
        }

        input.value = '';
        // Faz a requisição para criar uma nova etapa no servidor
        const result = await makeRequest('/api/called/tickets/create-step', 'POST', { 
            ticketId: GticketId, 
            step: newStepText 
        });

        
    });

    // Event delegation para remover etapas
    stepsList.addEventListener('click', async function (event) {
        if (event.target.classList.contains('remove-btn') || event.target.closest('.remove-btn')) {
            const listItem = event.target.closest('li'); // Encontra o <li> pai do botão
            listItem.remove(); // Remove o <li> da lista
            await makeRequest('/api/called/tickets/delete-step-status', 'POST', {
                stepId: listItem.getAttribute('data-id')
            });
        }
    });

    // Escuta eventos nos checkboxes usando event delegation
    stepsList.addEventListener('change', async function (event) {
        if (event.target.classList.contains('step-checkbox')) {
            const checkbox = event.target;
            const stepId = checkbox.getAttribute('data-id'); // ID da etapa
            const isChecked = checkbox.checked; // Verifica se está marcado ou desmarcado

            try {
                // Envia para o servidor o estado do checkbox
                await makeRequest('/api/called/tickets/update-step-status', 'POST', {
                    stepId: stepId,
                    completed: isChecked
                });
                console.log(`Etapa ${stepId} atualizada para ${isChecked ? 'concluída' : 'não concluída'}.`);
            } catch (error) {
                console.error('Erro ao atualizar o status da etapa:', error);
            }
        }
    });


    // Escuta cliques nos botões de remoção de usuários
    document.querySelector('.assigned').addEventListener('click', async function (event) {
        if (event.target.closest('.btn-remove-assigned')) {
            const button = event.target.closest('.btn-remove-assigned');
            const userId = button.getAttribute('data-id'); // Obtém o ID do usuário a ser removido

            // Confirmação opcional
            const confirmRemoval = confirm('Tem certeza que deseja remover este usuário da equipe?');
            if (!confirmRemoval) return;

            try {
              
                // Faz uma requisição ao servidor para remover o usuário
                const response = await makeRequest('/api/called/tickets/remove-assigned', 'POST', { userId:userId, ticketId: GticketId, });
                
                if (response.success) {
                    // Remove a linha do usuário do DOM
                    // const row = button.closest('tr');
                    // row.remove();
                    console.log(`Usuário com ID ${userId} removido com sucesso.`);
                } else {
                    console.error('Erro ao remover o usuário:', response.message);
                    alert('Não foi possível remover o usuário. Tente novamente.');
                }
            } catch (error) {
                console.error('Erro ao remover o usuário:', error);
                alert('Ocorreu um erro ao tentar remover o usuário.');
            }
        }
    });

    // Escuta cliques nos botões de remoção de usuários
    document.querySelector('.btnControleTeam').addEventListener('click', async function (event) {
        await setTeam();
        $('#add-team').modal('show');
    })

    

}

async function sendNewTeam(){
    const team = itUserSelect.getValue();
    const teamIds = team.map(member => member.value);

    try {
        const response = await makeRequest('/api/called/tickets/update-team', 'POST', {
            ticketId: GticketId,
            teamIds: teamIds
        });

        if (response.success) {
            // await writeAssigned(response.data);
            console.log('Time atualizado com sucesso:', response.message);
            $('#add-team').modal('hide');
        } else {
            console.error('Erro ao atualizar o time:', response.message);
            alert('Não foi possível atualizar o time. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao atualizar o time:', error);
        alert('Ocorreu um erro ao tentar atualizar o time.');
    }
}

async function removeFile(filename, buttonElement) {

    try {
        const result = await makeRequest(`/api/called/tickets/reverse-file-ticket`, 'DELETE', {ticketId: GticketId,filename: filename});

        console.log('Arquivo removido com sucesso:', result);

        // Remover o elemento <li> correspondente
        // const liElement = buttonElement.closest('.list-group-item');
        // if (liElement) {
        //     liElement.remove();
        // }
        return result; // Retorna a resposta, caso necessário
    } catch (error) {
        console.error('Erro ao remover o arquivo:', error);
        throw error;
    }
}

function viewFile(filename) {

    openWindow(`/api/called/tickets/view-file/${filename}`, 800, 600);
}

function openWindow(url, width, height) {
    window.open(url, '_blank', `width=${width},height=${height},resizable=yes`);
}

function convertToMB(filesize) {
    const sizeInMB = filesize / (1024 * 1024); // Converte bytes para MB
    return sizeInMB.toFixed(2); // Retorna com duas casas decimais
}

function shortenFilename(filename, maxLength = 12) {
    // Separa o nome do arquivo e a extensão
    const extension = filename.substring(filename.lastIndexOf('.'));
    const baseName = filename.substring(0, filename.lastIndexOf('.'));

    // Verifica se o nome é maior que o limite
    if (baseName.length > maxLength) {
        return baseName.substring(0, maxLength) + '...' + extension;
    }

    // Retorna o nome sem alterações se já for curto o suficiente
    return filename;
}

function splitFilename(path) {
    // Substitui todas as barras invertidas por barras normais e pega o último elemento
    const normalizedPath = path.replace(/\\/g, '/');
    const fileName = normalizedPath.split('/').pop();

    return fileName;
}

async function writeFiles(Files) {
    if (!Files || !Files.length) {
        return;
    }
    // Mapeamento de extensões MIME para ícones
    const iconMap = {
        'application/pdf': '../../assets/images/media/files/pdf.png',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '../../assets/images/media/files/xls.png',
        'application/msword': '../../assets/images/media/files/doc.png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '../../assets/images/media/files/doc.png',
        'text/csv': '../../assets/images/media/files/csv-file.png',
        'image/png': '', // Exibirá a imagem diretamente
        'image/jpeg': '', // Exibirá a imagem diretamente
        'image/jpg': '', // Exibirá a imagem diretamente
        'application/zip': '../../assets/images/media/files/zip.png',
        'video/mp4': '../../assets/images/media/files/video.png',
    };

    const HTMLfiles = Files.map(file => {
        // Determina o ícone ou usa a própria imagem
        const fileIcon = iconMap[file.mimetype] !== '' 
            ? `<img src="${iconMap[file.mimetype] || '../assets/images/media/files/file.png'}" alt="">`
            : `<img src="/storageService/tickets/files/${splitFilename(file.path)}" alt="" style="max-width: 50px;">`;

            console.log(fileIcon)
        return `
        <li class="list-group-item" data-id-ref="${file.filename}">
          <div class="d-flex align-items-center flex-wrap gap-2">
            <div class="lh-1">
              <span class="avatar avatar-rounded p-1 bg-light">
                ${fileIcon}
              </span>
            </div>
            <div class="flex-fill">
              <a href="javascript:void(0);">
                <span class="d-block fw-semibold" OnClick="viewFile('${splitFilename(file.path)}')">${shortenFilename(file.originalname)}</span>
              </a>
              <span class="d-block text-muted fs-12 fw-normal">${convertToMB(file.size)} MB</span>
            </div>
            <div class="btn-list">
              <a href="/api/called/tickets/download-file/${splitFilename(file.path)}" class="btn btn-sm btn-icon btn-info-light btn-wave waves-effect waves-light">
                <i class="ri-download-cloud-2-line"></i>
              </a>
              <button onclick="removeFile('${splitFilename(file.path)}', this)" class="btn btn-sm btn-icon btn-danger-light btn-wave waves-effect waves-light">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </li>`;
    }).join('');

    // Adiciona o HTML ao container
    document.querySelector('.files').innerHTML = HTMLfiles;
}

async function addFiles(Files) {
    // Mapeamento de extensões MIME para ícones
    const iconMap = {
        'application/pdf': '../../assets/images/media/files/pdf.png',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '../../assets/images/media/files/xls.png',
        'application/msword': '../../assets/images/media/files/doc.png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '../../assets/images/media/files/doc.png',
        'text/csv': '../../assets/images/media/files/csv-file.png',
        'image/png': '', // Exibirá a imagem diretamente
        'image/jpeg': '', // Exibirá a imagem diretamente
        'image/jpg': '', // Exibirá a imagem diretamente
        'application/zip': '../../assets/images/media/files/zip.png',
        'video/mp4': '../../assets/images/media/files/video.png',
    };

    const HTMLfiles = Files.map(file => {
        // Determina o ícone ou usa a própria imagem
        const fileIcon = iconMap[file.mimetype] !== '' 
            ? `<img src="${iconMap[file.mimetype] || '../assets/images/media/files/file.png'}" alt="">`
            : `<img src="/storageService/tickets/files/${splitFilename(file.path)}" alt="" style="max-width: 50px;">`;

        return `
        <li class="list-group-item" data-id-ref="${file.filename}">
          <div class="d-flex align-items-center flex-wrap gap-2">
            <div class="lh-1">
              <span class="avatar avatar-rounded p-1 bg-light">
                ${fileIcon}
              </span>
            </div>
            <div class="flex-fill">
              <a href="javascript:void(0);">
                <span class="d-block fw-semibold" OnClick="viewFile('${splitFilename(file.path)}')">${shortenFilename(file.originalname)}</span>
              </a>
              <span class="d-block text-muted fs-12 fw-normal">${convertToMB(file.size)} MB</span>
            </div>
            <div class="btn-list">
              <a href="/api/called/tickets/download-file/${splitFilename(file.path)}" class="btn btn-sm btn-icon btn-info-light btn-wave waves-effect waves-light">
                <i class="ri-download-cloud-2-line"></i>
              </a>
              <button onclick="removeFile('${splitFilename(file.path)}', this)" class="btn btn-sm btn-icon btn-danger-light btn-wave waves-effect waves-light">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </li>`;
    }).join('');

    // Adiciona o HTML ao container
    document.querySelector('.files').innerHTML += HTMLfiles;
}


async function writeSteps(steps){
    const HTMLsteps = steps.map(step => `
    <li class="list-group-item" data-id="${step.id}">
        <div class="d-flex align-items-center">
            <!-- Conteúdo à esquerda -->
            <div class="me-auto d-flex align-items-center">
                <input data-id="${step.id}" class="form-check-input form-checked-success me-2 step-checkbox" type="checkbox" value="" ${ step.status != 'pending' ? 'checked' : '' }>
                <span class="fw-semibold">${step.step_name}</span>
            </div>
            <!-- Botão à direita -->
            <button data-id="${step.id}" class="btn btn-sm btn-danger remove-btn">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </li>`).join('');


 

    document.querySelector('.steps').innerHTML = HTMLsteps;
}

async function writeAssigned(assigned){
    const HTMLassigned = assigned.map(user => `<tr data-id="${user.id}"> 
    <td>
        <div class="d-flex align-items-center">
        <div class="me-2 lh-1">
            <span class="avatar avatar-sm avatar-rounded" title="${user.name}" data-collabID="${user.id}" data-headcargoId="${user.dataHead}">
            <img src="https://cdn.conlinebr.com.br/colaboradores/${user.id_headcargo}" alt="">
            </span>
        </div>
        <div class="fw-semibold">${user.name}</div>
        </div>
    </td>
    <td>
        <span class="badge bg-primary-transparent">Developer</span>
    </td>
    <td>
        <div class="btn-list">
        <button data-id="${user.id}" class="btn-remove-assigned btn btn-sm btn-icon btn-danger-light btn-wave waves-effect waves-light">
            <i class="ri-delete-bin-line"></i>
        </button>
        </div>
    </td>
    </tr>`).join('');

    document.querySelector('.assigned').innerHTML = HTMLassigned;
}

async function writeDescription(description){
    const iframe = document.querySelector('.task-description-iframe');

    // Acessa o documento interno do iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // Insere o conteúdo do Quill
    iframeDoc.open();
    iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
        
        <link href="../../assets/css/styles.min.css" rel="stylesheet">
            <style>
                /* Estilos adicionais para o conteúdo dentro do iframe, se necessário */
                body {
                    background-color: transparent;
                }
            </style>
        </head>
        <body>
            ${description} <!-- Conteúdo do Quill -->

            <script src="../../assets/js/main.js"></script>
        </body>
        </html>
    `);

    iframeDoc.close();

    return true;
}

// Formata a data no estilo "DD/MM/YYYY HH:mm"
function formatDateBR(value) {
    const dataAtual = value ? new Date(value) : new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
}

// Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
};


async function addComments(comment){
    const user = await getInfosLogin();

    const HTMLcomments = `<li>
        <div>
        <span class="avatar avatar-sm bg-primary-transparent avatar-rounded profile-timeline-avatar"> 
        <img src="https://cdn.conlinebr.com.br/colaboradores/${comment.id_headcargo}" />
        </span>
        <p class="mb-2">
            <b>${user && user.system_collaborator_id == comment.collab_id ? 'Você' : comment.name}</b> comentou
            
            </a> <span class="float-end fs-11 text-muted">${formatDateBR(comment.create_at)}</span>
        </p>
        <p class="text-muted mb-0"> ${(comment.body).replace(/\n/g, '<br>')}</p>
        </div>
    </li>`


    document.querySelector('.profile-timeline').innerHTML += HTMLcomments;

    // rolar o profile-timeline até o final
    const profileTimeline = document.querySelector('.profile-timeline');
    profileTimeline.scrollTop = profileTimeline.scrollHeight;
}
async function writeComments(comments){
    const user = await getInfosLogin();

    const HTMLcomments = comments.map(comment => `<li>
        <div>
        <span class="avatar avatar-sm bg-primary-transparent avatar-rounded profile-timeline-avatar"> 
        <img src="https://cdn.conlinebr.com.br/colaboradores/${comment.id_headcargo}" />
        </span>
        <p class="mb-2">
            <b>${user && user.system_collaborator_id == comment.collab_id ? 'Você' : comment.name}</b> comentou
            
            </a> <span class="float-end fs-11 text-muted">${formatDateBR(comment.create_at)}</span>
        </p>
        <p class="text-muted mb-0"> ${(comment.body).replace(/\n/g, '<br>')}</p>
        </div>
    </li>`).join('');

  
    document.querySelector('.profile-msg').setAttribute('src', 'https://cdn.conlinebr.com.br/colaboradores/'+user.system_id_headcargo)

    document.querySelector('.profile-timeline').innerHTML = HTMLcomments;

    // rolar o profile-timeline até o final
    const profileTimeline = document.querySelector('.profile-timeline');
    profileTimeline.scrollTop = profileTimeline.scrollHeight;
}


async function loadInfosTickets(){
    let ticket = await makeRequest('/api/called/tickets/getById', 'POST', { id: GticketId });
    return ticket[0];
}

function formatDateForDatetimeLocal(dateString) {

    if(!dateString){ return ''}

    const date = new Date(dateString); // Cria um objeto Date a partir da string ISO
    
    const year = date.getFullYear(); // Obtém o ano
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Obtém o mês (ajustando de 0-11 para 1-12)
    const day = String(date.getDate()).padStart(2, '0'); // Obtém o dia do mês

    const hours = String(date.getHours()).padStart(2, '0'); // Obtém a hora
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Obtém os minutos

    // Concatena no formato 'YYYY-MM-DDTHH:mm'
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function addClickEventsToTI() {
    const startForecastButton = document.querySelector('.start_forecast');
    const endForecastButton = document.querySelector('.end_forecast');
    const categoryButton = document.querySelector('.category_text');
    const priorityButton = document.querySelector('.priority_text');
    const responsibleButton = document.querySelector('.responsibleName');
    const involvedButton = document.querySelector('.involved span,.involved, .involved img');

    startForecastButton.addEventListener('click', async () => {
        const modal = document.querySelector('#changePrevInicio');
        // Abra o modal aqui
        selectedColumn = 'start_forecast';
        selectedValueChange = '#inputPrevInicio'

        const ticket = await loadInfosTickets();
        console.log(ticket)

        document.querySelector(selectedValueChange).value = formatDateForDatetimeLocal(ticket.start_forecast);
        $(modal).modal('show');

    });

    endForecastButton.addEventListener('click', async () => {
        const modal = document.querySelector('#changePrevFim');
        // Abra o modal aqui
        selectedColumn = 'end_forecast';
        selectedValueChange = '#inputPrevFim'

        const ticket = await loadInfosTickets();
        console.log(ticket)
        document.querySelector(selectedValueChange).value = formatDateForDatetimeLocal(ticket.end_forecast);
        $(modal).modal('show');
    });

    categoryButton.addEventListener('click', async () => {
        const modal = document.querySelector('#changeCategory');
        // Abra o modal aqui
        selectedColumn = 'categories_id';
        selectedValueChange = '#inputCategories'

        const ticket = await loadInfosTickets();
        document.querySelector(selectedValueChange).value = ticket.categorieID;
        
        $(modal).modal('show');
    });

    priorityButton.addEventListener('click', async () => {
        const modal = document.querySelector('#changePriority');
        // Abra o modal aqui
        selectedColumn = 'priority';
        selectedValueChange = '#inputPriority'

        const ticket = await loadInfosTickets();
        document.querySelector(selectedValueChange).value = ticket.priority;

        $(modal).modal('show');
    });

    responsibleButton.addEventListener('click', async () => {
        const modal = document.querySelector('#changeResponsible');
        // Abra o modal aqui
        selectedColumn = 'collaborator_id';
        selectedValueChange = '#inputResponsible'
        const ticket = await loadInfosTickets();
        responsibleSelect.val(null).trigger('change');
        responsibleSelect.val(ticket.responsible).trigger('change');
        $(modal).modal('show');
    });

    involvedButton.addEventListener('click', async () => {
        const modal = document.querySelector('#changeInvolved');
        // Abra o modal aqui
        selectedColumn = 'called_tickets_involved';
        selectedValueChange = '#inputInvolved'
        const ticket = await loadInfosTickets();

        // // Capturar os IDs dos colaboradores selecionados
        // const selectedInvolved = getSelectedInvolved();

        // involvedSelect.val(selectedInvolved).trigger('change');

        // Pré-selecionar os envolvidos
        const selectedValues = (ticket.involved).map(item => item.collaborator_id); // IDs dos envolvidos
        involvedSelect.setChoiceByValue(selectedValues.map(String)); // Converte para string e pré-seleciona

        $(modal).modal('show');
    });


    





}


async function updateChangeColunm(){
    let value = '';

    if(selectedColumn == 'called_tickets_involved'){

        value = $(selectedValueChange).val();
      
    }else{
        value = document.querySelector(selectedValueChange).value;
    }



    try {
        const response = await makeRequest('/api/called/tickets/changeColumn', 'POST', {
            ticketId: GticketId,
            value: value == '' ? null : value,
            column: selectedColumn
        });

        if (response.success) {
            // await writeAssigned(response.data);
            console.log('Time atualizado com sucesso:', response.message);
            $('#changePrevInicio, #changePrevFim, #changeCategory, #changePriority, #changeResponsible').modal('hide');
        } else {
            console.error('Erro ao atualizar o time:', response.message);
            alert('Não foi possível atualizar o time. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao atualizar o time:', error);
        alert('Ocorreu um erro ao tentar atualizar o time.');
    }
}







