let GticketId;

/**
 * Evento principal ao carregar o DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {

    await initializeComponents();
    await loadTicket();
    document.querySelector('#loader').classList.add('d-none');

});




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
                        console.log('Resposta do servidor:', serverResponse);

                        if (serverResponse.success) {
                            await addFiles(serverResponse.data)
                           
                        } else {
                            console.log('Erro ao enviar arquivo: ' + serverResponse.message);
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
                console.log('Arquivo processado com sucesso:', file.filename);
                console.log(file);
                // Remove apenas o arquivo que foi processado com sucesso
                fileAttachments.removeFile(file.id);
            }
        });
    }
}

async function removeFile(filename, buttonElement) {

    try {
        const result = await makeRequest(`/api/called/tickets/reverse-file-ticket`, 'DELETE', {ticketId: GticketId,filename: filename});

        console.log('Arquivo removido com sucesso:', result);

        // Remover o elemento <li> correspondente
        const liElement = buttonElement.closest('.list-group-item');
        if (liElement) {
            liElement.remove();
        }
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
    console.log(Files)
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
        <li class="list-group-item">
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
        <li class="list-group-item">
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
    const HTMLsteps = steps.map(step => `<li class="list-group-item">
    <div class="d-flex align-items-center">
      <div class="me-2">
        <input class="form-check-input form-checked-success" type="checkbox" value="" id="successChecked1" ${ step.status != 'pending' ? 'checked' : '' }>
      </div>
      <div class="fw-semibold">${step.step_name}</div>
    </div>
  </li>`).join('');

    document.querySelector('.steps').innerHTML = HTMLsteps;
}

async function writeAssigned(assigned){

    const HTMLassigned = assigned.map(user => `<tr>
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
        <button class="btn btn-sm btn-icon btn-danger-light btn-wave waves-effect waves-light">
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
