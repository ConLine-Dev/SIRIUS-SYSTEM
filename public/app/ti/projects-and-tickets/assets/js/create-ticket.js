// Variáveis globais
let quillEditor, responsibleSelect, involvedSelect, itUserSelect, fileAttachments;

/**
 * Inicializa as configurações padrões do sistema e aplica valores iniciais nos campos.
 */
async function initializeDefaultValues() {
    const loggedUser = await getLoggedUserInfo();
    const collaboratorId = loggedUser.system_collaborator_id.toString();

    // Define o colaborador responsável padrão
    responsibleSelect.val(collaboratorId).trigger('change');
}

/**
 * Busca e popula o select com os usuários envolvidos.
 */
async function loadInvolvedUsers() {
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
    involvedSelect = new Choices('select[name="involved"]', {
        choices: options,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis'
    });
}

/**
 * Carrega os usuários do departamento de TI e preenche o select correspondente.
 */
async function loadItUsers() {
    const users = await makeRequest('/api/users/ListUserByDep/7');

    const options = users.map(user => ({
        customProperties: { dataHead: user.id_headcargo },
        value: user.collab_id,
        label: `${user.username} ${user.familyName}`
    }));

    itUserSelect = new Choices('select[name="atribuido"]', {
        choices: options,
        allowHTML: true,
        removeItemButton: true,
        shouldSort: false,
        noChoicesText: 'Não há opções disponíveis'
    });
}

/**
 * Carrega os responsáveis e popula o select correspondente.
 */
async function loadResponsibleUsers() {
    const users = await makeRequest('/api/users/listAllUsers');

    const selectElement = document.querySelector('select[name="responsible"]');
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

    responsibleSelect = $(`select[name="responsible"]`).select2({
        templateResult: formatSelectWithImages,
        templateSelection: formatSelectWithImages,
        placeholder: "Selecione o colaborador",
        escapeMarkup: markup => markup,
        allowClear: true
    });

    responsibleSelect.val(null).trigger('change');
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

/**
 * Busca e popula os departamentos no select correspondente.
 */
async function loadDepartments() {
    const departments = await makeRequest('/api/users/getAllDept');

    const options = departments.map(department => ({
        value: `${department.id}`,
        label: `${department.name}`
    }));

    // Verificar e destruir o Choices.js existente
    if (itUserSelect) {
        itUserSelect.destroy();
    }

    itUserSelect = new Choices('select[name="departments"]', {
        choices: options,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis'
    });
}

/**
 * Obtém informações do usuário logado a partir do localStorage.
 */
async function getLoggedUserInfo() {
    const userData = localStorage.getItem('StorageGoogle');
    return JSON.parse(userData);
}

/**
 * Inicializa os componentes do editor de texto Quill e FilePond.
 */
async function initializeComponents() {
    // Configuração do editor Quill
    const toolbarOptions = [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'align': [] }],
        ['image'],
        ['clean']                                         // remove formatting button
    ];

    quillEditor = new Quill('#project-descriptioin-editor', {
        modules: { toolbar: toolbarOptions },
        theme: 'snow'
    });

    // Configuração do FilePond
    FilePond.registerPlugin(
        FilePondPluginImagePreview,
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
            allowMultiple: true,
            maxFiles: 5,
            labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
        });

        fileAttachments.on('addfile', (error, file) => {
            if (error) {
                console.error('Erro ao adicionar arquivo:', error);
            } else {
                // console.log('Arquivo adicionado:', file.filename);
            }
        });
    }
}

/**
 * Ajusta o tamanho do editor Quill com base na janela do navegador.
 */
function adjustEditorSize() {
    const editorContainer = document.querySelector('.ql-container');
    editorContainer.style.height = `${window.innerHeight * 0.4}px`;
}

/**
 * Obtém os valores preenchidos no formulário e envia para o backend.
 */
async function getFormValues() {
    // Obter os valores dos usuários envolvidos
    const selectedInvolved = involvedSelect.getValue().map(option => ({
        id: option.value,
        name: option.label,
        dataHead: option.customProperties?.dataHead
    }));

    // Obter o responsável
    const responsibleElement = document.querySelector('select[name="responsible"]');
    const responsibleOption = responsibleElement.options[responsibleElement.selectedIndex];

    // Criar o objeto FormData
    const formData = new FormData();

    // Adicionar os valores do formulário ao FormData
    formData.append('responsible', JSON.stringify({
        id: responsibleOption.id,
        name: responsibleOption.text
    }));

    formData.append('priority', JSON.stringify({
        id: document.querySelector('select[name="priority"]').value,
        name: document.querySelector('select[name="priority"] option:checked').text
    }));

    formData.append('categories', JSON.stringify({
        id: document.querySelector('select[name="categories"]').value,
        name: document.querySelector('select[name="categories"] option:checked').text
    }));

    formData.append('title', document.querySelector('input[name="title"]').value);

    formData.append('involved', JSON.stringify(selectedInvolved));

    formData.append('description', quillEditor.root.innerHTML);

    // Adicionar arquivos do FilePond ao FormData
    const files = fileAttachments.getFiles();
    files.forEach((file, index) => {
        // formData.append(`attachments[${index}]`, file.file, file.filename);
        formData.append(`attachments`, file.file, file.filename);
    });

    // Exibir os dados do FormData no console para debug
    // for (let pair of formData.entries()) {
    //     console.log(pair[0], pair[1]);
    // }

    // Enviar os dados para o backend
    try {
        
        const result = await makeRequest(`/api/called/tickets/create-ticket`, 'POST', formData);

        console.log('Dados enviados com sucesso:', result);
        window.close();
        
    } catch (error) {
        console.error('Erro ao enviar o formulário:', error);
    }
}

/**
 * Evento principal ao carregar o DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await initializeComponents();
    await loadResponsibleUsers();
    await loadInvolvedUsers();
    await initializeDefaultValues();
    adjustEditorSize();
    document.querySelector('#loader').classList.add('d-none');
    window.addEventListener('resize', adjustEditorSize);
});
