let quill;

// ===============================
// SISTEMA DE DEBOUNCE PARA SALVAMENTO
// ===============================
let saveTimeout = null;
let isSaving = false;
const SAVE_DEBOUNCE_DELAY = 1000;

// Cache para metadados
let metadataCache = {
    departments: null,
    roles: null,
    types: null,
    responsibles: null,
    timestamp: 0
};
const METADATA_CACHE_TTL = 300000; // 5 minutos

$(document).ready(function() {
    // Carrega dados para os selects
    loadSelectOptions();

    // Inicializa o Quill.js
    quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video']
            ]
        },
        placeholder: 'Comece a escrever seu procedimento aqui...'
    });

    // Inicializa o SortableJS para arrastar e soltar
    const attachmentsContainer = document.getElementById('attachments-container');
    new Sortable(attachmentsContainer, {
        animation: 150,
        handle: '.handle', // Define o ícone de arrastar como o "handle"
        ghostClass: 'sortable-ghost'
    });
    
    // Lógica para adicionar anexos - ABRE O MODAL
    $('#btn-add-attachment').click(function() {
        resetAndShowModal();
    });

    // Lógica para remover anexos
    $('#attachments-container').on('click', '.btn-remove-attachment', function() {
        if (confirm('Tem certeza de que deseja remover este anexo?')) {
            $(this).closest('.attachment-card').remove();
        }
    });

    // --- Lógica de Edição Inline da Descrição ---
    $('#attachments-container').on('click', '.attachment-description-display', function() {
        const $display = $(this);
        const $input = $display.siblings('.attachment-description-input');
        $display.hide();
        $input.show().focus();
    });
    // Salvar ao perder o foco ou pressionar Enter
    $('#attachments-container').on('blur keypress', '.attachment-description-input', function(e) {
        if (e.type === 'keypress' && e.which !== 13) return;
        const $input = $(this);
        const $display = $input.siblings('.attachment-description-display');
        const newDescription = $input.val();
        $display.text(newDescription || 'Clique para adicionar uma descrição');
        $input.hide();
        $display.show();
    });
    
    // Listener para o clique no botão de upload dentro do card
    $('#attachments-container').on('click', '.btn-upload-file', function() {
        $(this).closest('.attachment-card').find('.attachment-file-input-actual').click();
    });

    // Listener para a mudança do input de arquivo (quando um arquivo é selecionado)
    $('#attachments-container').on('change', '.attachment-file-input-actual', async function() {
        const file = this.files[0];
        if (!file) return;

        const $card = $(this).closest('.attachment-card');
        const formData = new FormData();
        formData.append('attachment', file);
        
        try {
            const response = await makeRequest('/api/procedures-management/procedures/upload', 'POST', formData);
            
            // Atualiza o card com as informações do arquivo
            $card.data('type', 'file'); // Garante que o tipo é 'file'
            $card.find('.attachment-url').val(response.filePath);
            
            // Troca o botão de "Selecionar" pelos de "Visualizar/Baixar"
            const buttonsHtml = `
                <a href="${response.filePath}" target="_blank" class="btn btn-light" title="Visualizar"><i class="ri-eye-line"></i></a>
                <a href="${response.filePath}" download class="btn btn-light" title="Baixar"><i class="ri-download-2-line"></i></a>`;
            $card.find('.btn-group').html(buttonsHtml);
            
            // Atualiza o corpo do card para mostrar o nome do arquivo
            $card.find('.attachment-body').html(`
                <input type="hidden" class="attachment-url" value="${response.filePath}">
                <small class="text-muted text-truncate d-block">${response.filePath.split('/').pop()}</small>
            `);

            // Se a descrição estiver vazia, preenche com o nome do arquivo
            const $descDisplay = $card.find('.attachment-description-display');
            if ($descDisplay.text() === 'Clique para adicionar uma descrição') {
                $descDisplay.text(file.name);
                $card.find('.attachment-description-input').val(file.name);
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert('Falha no upload do arquivo.');
        }
    });

    // Listener para o campo de URL (para tipos link, video, image)
    $('#attachments-container').on('input', '.attachment-url', function() {
        const $input = $(this);
        const url = $input.val().trim();
        const $card = $input.closest('.attachment-card');
        const $viewButton = $card.find('a[title="Abrir Link"]');

        if (url) {
            $viewButton.attr('href', url).removeClass('disabled');
        } else {
            $viewButton.addClass('disabled').attr('href', '#');
        }
    });

    // Ação do botão salvar COM DEBOUNCE
    $('#form-create-procedure').submit(async function(e) {
        e.preventDefault();
        
        // Evitar múltiplos envios
        if (isSaving) {
            console.log('Salvamento já em progresso, ignorando...');
            return;
        }
        
        isSaving = true;
        toggleSaveButton(true);

        const contentData = quill.getContents();

        const attachments = [];
        $('.attachment-card').each(function() {
            const $card = $(this);
            const type = $card.data('type');
            const url = $card.find('.attachment-url').val();
            let description = $card.find('.attachment-description-display').text();
            if (description === 'Clique para adicionar uma descrição') {
                description = '';
            }
    
            if (url) {
                attachments.push({ type, url, description });
            }
        });

        const tagsValue = $('#tags').val() || '';

        const procedureData = {
            title: $('#title').val(),
            content: contentData,
            department_id: $('#department').val(),
            role: $('#role').val(),
            type_id: $('#type').val(),
            responsible: $('#responsible').val(),
            tags: tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag),
            attachments: attachments
        };

        try {
            const response = await makeRequest('/api/procedures-management/procedures', 'POST', procedureData);
            showNotification(response.message || 'Procedimento criado com sucesso!', 'success');
             setTimeout(() => {
                window.close();
            }, 1000);
        } catch (error) {
            const errorMessage = error.responseJSON ? error.responseJSON.message : 'Erro ao salvar o procedimento.';
            showNotification(errorMessage, 'danger');
            console.error(error);
        } finally {
            toggleSaveButton(false);
            isSaving = false; // Reset flag
        }
    });

    // --- Lógica do Novo Modal de Anexos ---
    let attachmentModal;
    
    function getAttachmentModal() {
        if (!attachmentModal) {
            attachmentModal = new bootstrap.Modal(document.getElementById('add-attachment-modal'));
        }
        return attachmentModal;
    }

    function resetAndShowModal() {
        $('#attachment-type-selection').show();
        $('#attachment-url-input').hide();
        $('#attachment-file-upload').hide();
        $('#modal-attachment-url').val('');
        $('#modal-attachment-description-url').val('');
        $('#modal-file-input').val('');
        $('#modal-progress-bar').css('width', '0%').parent().hide();
        getAttachmentModal().show();
    }

    // Navegação do modal: Escolha do tipo
    $('.option-box').click(function() {
        const type = $(this).data('type');
        $('#attachment-type-selection').hide();
        if (type === 'url') {
            $('#attachment-url-input').show();
        } else {
            $('#attachment-file-upload').show();
        }
    });

    // Salvar anexo do tipo URL
    $('#btn-save-url-attachment').click(function() {
        const url = $('#modal-attachment-url').val();
        if (!url) {
            alert('Por favor, insira uma URL.');
            return;
        }
        const description = $('#modal-attachment-description-url').val();
        
        let type = 'link';
        if (/\.(jpg|jpeg|png|gif)$/i.test(url)) type = 'image';
        if (/youtube\.com|vimeo\.com/i.test(url)) type = 'video';

        addAttachmentRow({ type, url, description });
        getAttachmentModal().hide();
    });

    // Upload de arquivo
    $('#attachment-dropzone').on('click', () => $('#modal-file-input').click());
    $('#attachment-dropzone, #add-attachment-modal').on('dragover dragenter', function(e) {
        e.preventDefault();
        $('#attachment-dropzone').addClass('dragover');
    }).on('dragleave drop', function(e) {
        e.preventDefault();
        $('#attachment-dropzone').removeClass('dragover');
    });

    $('#add-attachment-modal').on('drop', function(e) {
        const files = e.originalEvent.dataTransfer.files;
        if (files.length) {
            uploadFile(files[0]);
        }
    });
    $('#modal-file-input').on('change', function() {
        if (this.files.length) {
            uploadFile(this.files[0]);
        }
    });
    
    async function uploadFile(file) {
        const $progress = $('#modal-progress-bar').parent();
        const $progressBar = $('#modal-progress-bar');
        
        $progress.show();
        $progressBar.removeClass('bg-success bg-danger').css('width', '0%');
        
        const formData = new FormData();
        formData.append('attachment', file);

        try {
            $progressBar.animate({ width: '50%' }, 400);
            const response = await makeRequest('/api/procedures-management/procedures/upload', 'POST', formData);
            $progressBar.animate({ width: '100%' }, 400, () => $progressBar.addClass('bg-success'));

            setTimeout(() => {
                addAttachmentRow({
                    type: 'file',
                    url: response.filePath,
                    description: file.name
                });
                getAttachmentModal().hide();
            }, 500);

        } catch (error) {
            console.error('Upload error:', error);
            $progressBar.addClass('bg-danger');
            alert('Falha no upload do arquivo.');
        }
    }
});

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

// Função otimizada de carregamento com cache
async function loadSelectOptions() {
    try {
        // Verificar cache primeiro
        const now = Date.now();
        if (metadataCache.departments && (now - metadataCache.timestamp) < METADATA_CACHE_TTL) {
            console.log('Usando metadados do cache');
            populateFromCache();
            return;
        }
        
        console.log('Carregando metadados do servidor');
        const [departments, roles, types, responsibles] = await Promise.all([
            makeRequest('/api/procedures-management/meta/departments'),
            makeRequest('/api/procedures-management/meta/roles'),
            makeRequest('/api/procedures-management/meta/types'),
            makeRequest('/api/procedures-management/meta/responsibles')
        ]);
        
        // Atualizar cache
        metadataCache = {
            departments,
            roles,
            types,
            responsibles,
            timestamp: now
        };

        // Popular selects e configurar usuário padrão
        populateSelects(departments, roles, types, responsibles);

        // Valores padrão do usuário já são definidos em populateSelects()
    } catch (error) {
        console.error('Falha ao carregar opções para os selects:', error);
        showNotification('Erro ao carregar dados do formulário. Tente novamente.', 'danger');
    }
}

// Função para popular do cache
function populateFromCache() {
    const { departments, roles, types, responsibles } = metadataCache;
    populateSelects(departments, roles, types, responsibles);
    setDefaultUserValues();
}

// Função otimizada para popular todos os selects
function populateSelects(departments, roles, types, responsibles) {
    populateSelect('#department', departments, 'id', 'name');
    populateSelect('#type', types, 'id', 'name');
    
    // Para cargos, o retorno é um array de strings
    const roleData = roles.map(role => ({ id: role, name: role }));
    populateSelect('#role', roleData, 'id', 'name');
    
    // Responsáveis: lista de colaboradores
    populateSelect('#responsible', responsibles, 'id', 'name');
    
    setDefaultUserValues();
}

// Função para definir valores padrão do usuário
async function setDefaultUserValues() {
    const infos = await getInfosLogin();
    if (infos) {
        if (infos.system_collaborator_id) {
            $('#responsible').val(infos.system_collaborator_id);
        }
        // Seleciona o primeiro departamento, se houver
        if (infos.department_ids) {
            let firstDept = null;
            if (typeof infos.department_ids === 'string') {
                firstDept = infos.department_ids.split(',')[0].trim();
            } else if (Array.isArray(infos.department_ids)) {
                firstDept = infos.department_ids[0];
            }
            if (firstDept) {
                $('#department').val(firstDept);
            }
        }
        if (infos.job_position) {
            $('#role').val(infos.job_position);
        }
    }
}

function populateSelect(selectId, data, valueKey, nameKey) {
    const select = $(selectId);
    select.empty();
    select.append('<option value="">Selecione...</option>');
    data.forEach(item => {
        select.append(`<option value="${item[valueKey]}">${item[nameKey]}</option>`);
    });
}

function addAttachmentRow(attachment = {}) {
    const type = attachment.type || 'file'; 
    const description = attachment.description || '';
    const url = attachment.url || '';
    const isFile = type === 'file';

    let iconHtml = '';
    if (type === 'image' && url) {
        iconHtml = `<img src="${url}" class="attachment-thumbnail" alt="Anexo">`;
    } else {
        const iconClass = {
            link: 'ri-links-line', video: 'ri-film-line',
            image: 'ri-image-line', file: 'ri-file-text-line'
        }[type] || 'ri-links-line';
        iconHtml = `<div class="attachment-icon"><i class="${iconClass}"></i></div>`;
    }

    const newCard = `
    <div class="attachment-card p-2 mb-2" data-type="${type}">
        <div class="d-flex align-items-center">
            <div class="handle me-2 text-muted"><i class="ri-drag-move-2-fill"></i></div>
            ${iconHtml}
            <div class="flex-grow-1 mx-2" style="min-width: 0;">
                <p class="fw-bold m-0 text-truncate attachment-description-display" style="cursor: pointer;">${description || 'Clique para adicionar uma descrição'}</p>
                <input type="text" class="form-control form-control-sm attachment-description-input" style="display:none;" value="${description}">
                
                <div class="attachment-body mt-1">
                    ${ isFile ? 
                        (url ? `
                            <input type="hidden" class="attachment-url" value="${url}">
                            <small class="text-muted text-truncate d-block">${url.split('/').pop()}</small>
                        ` : `
                            <input type="hidden" class="attachment-url" value="">
                            <small class="text-muted">Aguardando envio de arquivo...</small>
                        `) : 
                        `<input type="text" class="form-control form-control-sm attachment-url" placeholder="Cole a URL aqui" value="${url}">`
                    }
                </div>
            </div>
            <div class="ms-auto d-flex align-items-center">
                <div class="btn-group btn-group-sm">
                    ${ isFile ? 
                        (url ? `
                            <a href="${url}" target="_blank" class="btn btn-light" title="Visualizar"><i class="ri-eye-line"></i></a>
                            <a href="${url}" download class="btn btn-light" title="Baixar"><i class="ri-download-2-line"></i></a>
                        ` : `
                            <button type="button" class="btn btn-primary btn-upload-file">Selecionar</button>
                        `) : 
                        (url ? `
                            <a href="${url}" target="_blank" class="btn btn-light" title="Abrir Link"><i class="ri-external-link-line"></i></a>
                        ` : `
                            <!-- Botão desabilitado para links sem URL -->
                        `)
                    }
                </div>
                <button type="button" class="btn btn-sm btn-light text-danger ms-2 btn-remove-attachment" title="Remover"><i class="ri-close-line"></i></button>
            </div>
        </div>
        <input type="file" class="d-none attachment-file-input-actual">
    </div>
    `;
    $('#attachments-container').append(newCard);
}

function toggleSaveButton(loading = false) {
    const btn = $('#btn-save');
    if (loading) {
        btn.prop('disabled', true);
        btn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...');
    } else {
        btn.prop('disabled', false);
        btn.html('<i class="ri-save-line me-1"></i> Salvar Procedimento');
    }
}

function showNotification(message, type = 'success') {
    // Fecha a janela principal e mostra a notificação na página que a abriu.
    // Isso é melhor pois o usuário verá o resultado da ação.
    if (window.opener && window.opener.showGlobalNotification) {
        window.opener.showGlobalNotification(message, type);
    } else {
        alert(message); // Fallback caso a função não exista na página principal
    }
    
    if (type === 'success') {
        // window.opener.location.reload(); // Removido para evitar reload completo
        window.close();
    }
} 