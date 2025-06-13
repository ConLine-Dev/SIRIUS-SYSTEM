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

    // Lógica para adicionar anexos
    $('#btn-add-attachment').click(function() {
        addAttachmentRow();
    });

    // Lógica para remover anexos
    $('#attachments-container').on('click', '.btn-remove-attachment', function() {
        if (confirm('Tem certeza de que deseja remover este anexo?')) {
            $(this).closest('.attachment-row').remove();
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
        $('.attachment-row').each(function() {
            const type = $(this).find('.attachment-type').val();
            const url = $(this).find('.attachment-url').val();
            const description = $(this).find('.attachment-description').val();
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
    const disabledAttr = isReadonly ? 'disabled' : '';
    const newRow = `
        <div class="row gx-2 mb-2 attachment-row">
            <div class="col-md-3">
                <select class="form-select form-select-sm attachment-type" ${disabledAttr}>
                    <option value="link" ${attachment.type === 'link' ? 'selected' : ''}>Link</option>
                    <option value="video" ${attachment.type === 'video' ? 'selected' : ''}>Vídeo</option>
                    <option value="image" ${attachment.type === 'image' ? 'selected' : ''}>Imagem</option>
                </select>
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm attachment-url" placeholder="URL" value="${attachment.url || ''}" ${disabledAttr}>
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm attachment-description" placeholder="Descrição" value="${attachment.description || ''}" ${disabledAttr}>
            </div>
            <div class="col-md-1">
                ${!isReadonly ? '<button type="button" class="btn btn-sm btn-danger btn-remove-attachment">&times;</button>' : ''}
            </div>
        </div>
    `;
    $('#attachments-container').append(newRow);
}

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