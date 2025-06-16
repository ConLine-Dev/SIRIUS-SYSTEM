let quill;
let procedureData = {}; // Armazena todos os dados, incluindo a versão mais recente
let latestVersionData = {}; // Armazena um snapshot dos dados da versão mais recente para restauração
let selectedVersionNumber = null; // Armazena o número da versão selecionada

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const procedureId = urlParams.get('id');

    // Carrega opções dos selects e depois busca os dados do procedimento
    loadSelectOptions().then(() => {
        if (procedureId) {
            fetchProcedureData(procedureId);
        }
    });

    // Inicializa o SortableJS para arrastar e soltar
    const attachmentsContainer = document.getElementById('attachments-container');
    new Sortable(attachmentsContainer, {
        animation: 150,
        handle: '.handle', // Define o ícone de arrastar como o "handle"
        ghostClass: 'sortable-ghost'
    });

    // Lógica para adicionar anexos - AGORA ABRE O MODAL
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
        if ($(this).closest('.attachment-card').parent().is('[readonly]')) return;
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
    
    // Listener para o clique no botão de upload
    $('#attachments-container').on('click', '.btn-upload-file', function() {
        $(this).closest('.attachment-card').find('.attachment-file-input-actual').click();
    });

    // Listener para a mudança do input de arquivo (quando um arquivo é selecionado)
    $('#attachments-container').on('change', '.attachment-file-input-actual', async function() {
        const file = this.files[0];
        if (!file) return;

        const $card = $(this).closest('.attachment-card');
        const $progress = $card.find('.progress');
        const $progressBar = $card.find('.progress-bar');
        const $descriptionDisplay = $card.find('.attachment-description-display');
        const $descriptionInput = $card.find('.attachment-description-input');
        
        const formData = new FormData();
        formData.append('attachment', file);
        
        $progress.show();
        $progressBar.removeClass('bg-success bg-danger').css('width', '0%');

        try {
            $progressBar.animate({ width: '50%' }, 400);
            const response = await makeRequest('/api/procedures-management/procedures/upload', 'POST', formData);
            $progressBar.animate({ width: '100%' }, 400, () => $progressBar.addClass('bg-success'));

            const cardState = {
                type: 'file',
                url: response.filePath,
                description: $descriptionInput.val() || file.name
            };

            // Para garantir a atualização correta, substituímos o card antigo pelo novo
            setTimeout(() => {
                const newCard = $(addAttachmentRow(cardState, false)); // Gera o novo card
                $card.replaceWith(newCard); // Substitui o antigo
            }, 500);

        } catch (error) {
            console.error('Upload error:', error);
            $progressBar.addClass('bg-danger');
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
            // Tenta gerar um thumbnail para imagens
            if ($card.data('type') === 'image') {
                $card.find('.attachment-thumbnail').attr('src', url);
            }
        } else {
            $viewButton.addClass('disabled').attr('href', '#');
        }
    });

    // Lógica para selecionar uma versão para preview
    $('#version-history').on('click', '.version-item', function() {
        const versionNumber = $(this).data('version-id');
        selectedVersionNumber = versionNumber;
        
        $('.version-item').removeClass('active');
        $(this).addClass('active');
        
        const versionData = procedureData.versions.find(v => v.version_number == versionNumber);
        const isLatestVersion = versionNumber === procedureData.versions[0].version_number;

        if (isLatestVersion) {
            exitPreviewMode();
        } else if (versionData) {
            enterPreviewMode(versionData);
        }
    });

    // Lógica para o novo botão "Voltar para Versão Atual"
    $('#btn-back-to-current').click(function() {
        exitPreviewMode();
    });

    // Lógica para reverter para a versão selecionada
    $('#btn-revert-version').click(async function() {
        if (!selectedVersionNumber) {
            showNotification('Nenhuma versão selecionada para reverter.', 'warning');
            return;
        }

        if (confirm(`Tem certeza de que deseja reverter o procedimento para a versão ${selectedVersionNumber}? Uma nova versão será criada com os dados da versão selecionada.`)) {
            toggleRevertButton(true);
            try {
                await makeRequest(`/api/procedures-management/procedures/${procedureData.id}/revert`, 'POST', { version_number: selectedVersionNumber });
                showNotification('Procedimento revertido com sucesso! A página será recarregada.', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (error) {
                const errorMessage = error.responseJSON ? error.responseJSON.message : 'Erro ao reverter o procedimento.';
                showNotification(errorMessage, 'danger');
                console.error(error);
                toggleRevertButton(false);
            }
        }
    });

    // Ação do botão atualizar (salvar)
    $('#form-edit-procedure').submit(async function(e) {
        e.preventDefault();
        toggleUpdateButton(true);
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
        const dataToSave = {
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
            const response = await makeRequest(`/api/procedures-management/procedures/${procedureData.id}`, 'PUT', dataToSave);
            showNotification(response.message || 'Procedimento atualizado com sucesso!', 'success');
            setTimeout(() => {
                window.close();
            }, 1000);
        } catch (error) {
            showNotification('Erro ao atualizar o procedimento.', 'danger');
            console.error(error);
        } finally {
            toggleUpdateButton(false);
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
        // Reseta para a primeira etapa
        $('#attachment-type-selection').show();
        $('#attachment-url-input').hide();
        $('#attachment-file-upload').hide();
        // Limpa inputs
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
        
        // Determina o tipo com base na URL (simplificado)
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

async function fetchProcedureData(id) {
    try {
        const data = await makeRequest(`/api/procedures-management/procedures/${id}`);
        procedureData = data;
        
        // Inicializa o Quill
        quill = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image', 'video']
                ]
            }
        });

        // Ordena as versões da mais nova para a mais antiga
        procedureData.versions.sort((a, b) => b.version_number - a.version_number);

        // A versão mais recente é a primeira da lista ordenada
        const latestVersion = procedureData.versions[0];
        latestVersionData = {
            title: data.title,
            content: data.content,
            department_id: data.department_id,
            role: data.role,
            type_id: data.type_id,
            responsible_id: data.responsible_id,
            tags: data.tags,
            attachments: data.attachments
        };
        
        populateForm(latestVersionData);
        displayVersionHistory(procedureData.versions);
        // Marca a versão atual como ativa
        $('#version-history').find('.version-item').first().addClass('active');

    } catch (error) {
        console.error('Erro ao buscar dados do procedimento:', error);
        alert('Não foi possível carregar os detalhes do procedimento.');
    }
}

function populateForm(data, isPreview = false) {
    quill.setContents(data.content || { ops: [] });
    $('#title').val(data.title || '');
    $('#department').val(data.department_id || '');
    $('#role').val(data.role || '');
    $('#type').val(data.type_id || '');
    $('#responsible').val(data.responsible_id || '');
    
    let tags = data.tags || [];
    if (typeof tags === 'string') {
        try { tags = JSON.parse(tags); } catch (e) { console.error('Error parsing tags:', e); tags = []; }
    }
    $('#tags').val(Array.isArray(tags) ? tags.join(', ') : '');

    let attachments = data.attachments || [];
    if (typeof attachments === 'string') {
        try { attachments = JSON.parse(attachments); } catch (e) { console.error('Error parsing attachments:', e); attachments = []; }
    }
    $('#attachments-container').empty();
    if (Array.isArray(attachments) && attachments.length > 0) {
        attachments.forEach(attachment => {
            addAttachmentRow(attachment, isPreview);
        });
    }

    // Gerenciar estado dos campos
    const disabled = isPreview;
    $('#form-edit-procedure :input:not(#btn-revert-version)').prop('disabled', disabled);
    quill.enable(!disabled);
    
    // Gerenciar visibilidade dos botões
    $('#btn-update').toggle(!disabled);
    $('#btn-add-attachment').toggle(!disabled);
    $('#btn-revert-version').toggle(disabled);
}

function displayVersionHistory(versions) {
    const list = $('#version-history');
    list.empty();
    if (!versions || versions.length === 0) {
        list.html('<li class="list-group-item">Nenhum histórico de versão encontrado.</li>');
        return;
    }
    versions.forEach(item => {
        let dateStr = '-';
        if (item.created_at) {
            const date = new Date(item.created_at);
            date.setHours(date.getHours() - 3);            // Ajusta a data para o fuso horário correto (UTC-3)
            dateStr = date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }

        // Verifica se é uma versão antiga sem snapshot completo
        const canRevert = !!item.title;
        const revertDisabledAttr = !canRevert ? 'disabled' : '';
        const revertTooltip = !canRevert ? 'title="Reversão não disponível para esta versão antiga"' : '';
        
        const listItem = `
            <li class="list-group-item list-group-item-action version-item" data-version-id="${item.version_number}" ${revertTooltip}>
                <strong>Versão ${item.version_number}</strong>
                <small class="d-block text-muted">
                    por ${item.author_name || 'Desconhecido'} em ${dateStr}
                </small>
                <div class="text-secondary small mt-1"><i class='ri-chat-history-line me-1'></i> ${item.change_summary || 'Sem resumo.'}</div>
            </li>
        `;
        list.append(listItem);
    });
}

function addAttachmentRow(attachment = {}, isReadonly = false) {
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
            <div class="handle me-2 text-muted" ${isReadonly ? 'style="display:none;"' : ''}><i class="ri-drag-move-2-fill"></i></div>
            ${iconHtml}
            <div class="flex-grow-1 mx-2" style="min-width: 0;">
                <p class="fw-bold m-0 text-truncate attachment-description-display" ${isReadonly ? '' : 'style="cursor: pointer;"'}>${description || 'Clique para adicionar uma descrição'}</p>
                <input type="text" class="form-control form-control-sm attachment-description-input" style="display:none;" value="${description}" ${isReadonly ? 'disabled' : ''}>
                
                <div class="attachment-body mt-1">
                    ${ isFile ? 
                        (url ? `
                            <input type="hidden" class="attachment-url" value="${url}">
                            <small class="text-muted text-truncate d-block">${url.split('/').pop()}</small>
                        ` : `
                            <input type="hidden" class="attachment-url" value="">
                            <small class="text-muted">Aguardando envio de arquivo...</small>
                        `) : 
                        `<input type="text" class="form-control form-control-sm attachment-url" placeholder="Cole a URL aqui" value="${url}" ${isReadonly ? 'disabled' : ''}>`
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
                            <button type="button" class="btn btn-primary btn-upload-file" ${isReadonly ? 'disabled' : ''}>Selecionar</button>
                        `) : 
                        (url ? `
                            <a href="${url}" target="_blank" class="btn btn-light" title="Abrir Link"><i class="ri-external-link-line"></i></a>
                        ` : `
                            <!-- Botão desabilitado para links sem URL -->
                        `)
                    }
                </div>
                <button type="button" class="btn btn-sm btn-light text-danger ms-2 btn-remove-attachment" ${isReadonly ? 'style="display:none;"' : ''} title="Remover"><i class="ri-close-line"></i></button>
            </div>
        </div>
        <input type="file" class="d-none attachment-file-input-actual">
    </div>
    `;
    $('#attachments-container').append(newCard);
}

// --- NOVOS EVENT LISTENERS ---

// Listener para o seletor de tipo
$('#attachments-container').on('click', '.attachment-type-selector .btn', function() {
    const $btn = $(this);
    if ($btn.hasClass('active') || $btn.is(':disabled')) return;

    const type = $btn.data('type');
    const $card = $btn.closest('.attachment-card');
    const cardId = $card.attr('id');

    $btn.siblings().removeClass('active');
    $btn.addClass('active');

    // Limpa o estado anterior ao trocar
    renderAttachmentBody(cardId, type);
    $card.find('.attachment-description').val('');
});

// Listener para o dropzone
$('#attachments-container').on('click', '.attachment-file-dropzone', function() {
    $(this).siblings('.attachment-file-input-actual').click();
});

// Listener para a mudança do input de arquivo
$('#attachments-container').on('change', '.attachment-file-input-actual', async function() {
    const file = this.files[0];
    if (!file) return;

    const $card = $(this).closest('.attachment-card');
    const cardId = $card.attr('id');
    const $progress = $card.find('.progress');
    const $progressBar = $card.find('.progress-bar');
    const $descriptionInput = $card.find('.attachment-description');
    
    const formData = new FormData();
    formData.append('attachment', file);
    
    $progress.show();
    $progressBar.removeClass('bg-success bg-danger').css('width', '0%');

    try {
        // Simula o progresso
        $progressBar.animate({ width: '50%' }, 400);
        const response = await makeRequest('/api/procedures-management/procedures/upload', 'POST', formData);
        $progressBar.animate({ width: '100%' }, 400, () => {
            $progressBar.addClass('bg-success');
        });
        
        const newAttachment = { url: response.filePath, description: file.name };
        if (!$descriptionInput.val()) {
            $descriptionInput.val(file.name);
        }
        
        setTimeout(() => {
            renderAttachmentBody(cardId, 'file', newAttachment);
        }, 500);

    } catch (error) {
        console.error('Upload error:', error);
        $progressBar.addClass('bg-danger').css('width', '100%');
        alert('Falha no upload do arquivo.');
    }
});

// Listener para o campo de URL
$('#attachments-container').on('input', '.attachment-url', function() {
    const $input = $(this);
    const url = $input.val();
    const $viewButton = $input.siblings('a');
    if (url) {
        $viewButton.attr('href', url).removeClass('disabled');
    } else {
        $viewButton.addClass('disabled');
    }
});

async function loadSelectOptions() {
    const [departments, roles, types, responsibles] = await Promise.all([
        makeRequest('/api/procedures-management/meta/departments'),
        makeRequest('/api/procedures-management/meta/roles'),
        makeRequest('/api/procedures-management/meta/types'),
        makeRequest('/api/procedures-management/meta/responsibles')
    ]);
    populateSelect('#department', departments, 'id', 'name');
    const roleData = roles.map(role => ({ id: role, name: role }));
    populateSelect('#role', roleData, 'id', 'name');
    populateSelect('#type', types, 'id', 'name');
    populateSelect('#responsible', responsibles, 'id', 'name');
}

function populateSelect(selectId, data, valueKey, nameKey) {
    const select = $(selectId);
    select.empty();
    select.append('<option value="">Selecione...</option>');
    data.forEach(item => {
        select.append(`<option value="${item[valueKey]}">${item[nameKey]}</option>`);
    });
}

function toggleUpdateButton(loading = false) {
    const btn = $('#btn-update');
    if (loading) {
        btn.prop('disabled', true);
        btn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Atualizando...');
    } else {
        btn.prop('disabled', false);
        btn.html('<i class="ri-save-line me-1"></i> Atualizar Procedimento');
    }
}

function toggleRevertButton(loading = false) {
    const btn = $('#btn-revert-version');
    if (loading) {
        btn.prop('disabled', true);
        btn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Revertendo...');
    } else {
        btn.prop('disabled', false);
        btn.html('Reverter para esta versão');
    }
}

function showNotification(message, type = 'info') {
    const notification = $(`
        <div class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `);
    $('#notification-container').append(notification);
    const toast = new bootstrap.Toast(notification);
    toast.show();
}

function enterPreviewMode(version) {
    // Tenta parsear conteúdo, tags e anexos, com fallback para arrays vazios
    let content, tags, attachments;
    try { content = typeof version.content === 'string' ? JSON.parse(version.content) : version.content; } catch (e) { content = { ops: [] }; }
    try { tags = typeof version.tags === 'string' ? JSON.parse(version.tags) : version.tags; } catch (e) { tags = []; }
    try { attachments = typeof version.attachments === 'string' ? JSON.parse(version.attachments) : version.attachments; } catch (e) { attachments = []; }
    
    const versionSnapshot = {
        title: version.title,
        content: content,
        department_id: version.department_id,
        role: version.role,
        type_id: version.type_id,
        responsible_id: version.responsible_id,
        tags: tags,
        attachments: attachments
    };
    
    populateForm(versionSnapshot, true); // true para isPreview
    $('#btn-revert-version').show();
    toggleRevertButton(false);
}

function exitPreviewMode() {
    populateForm(latestVersionData, false); // false para isPreview
    $('#btn-revert-version').hide();
    selectedVersionNumber = null;
    $('.version-item').removeClass('active');
    // Re-seleciona a versão atual na lista
    $('#version-history').find('.version-item').first().addClass('active');
} 