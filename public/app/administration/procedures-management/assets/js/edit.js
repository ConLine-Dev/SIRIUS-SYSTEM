let quill;
let procedureData = {}; // Armazena todos os dados, incluindo a versão mais recente
let currentContent; // Armazena o conteúdo da versão atual para restauração
let selectedVersionContent; // Armazena o conteúdo da versão selecionada para reverter

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
        const versionId = $(this).data('version-id');
        $(this).addClass('active').siblings().removeClass('active');
        
        const versionData = procedureData.versions.find(v => v.version_number == versionId);
        if (versionData) {
            enterPreviewMode(versionData);
        }
    });

    // Lógica para o novo botão "Voltar para Versão Atual"
    $('#btn-back-to-current').click(function() {
        exitPreviewMode();
    });

    // Lógica para reverter para a versão selecionada
    $('#btn-revert-version').click(function() {
        if (!selectedVersionContent) {
            alert('Por favor, selecione uma versão para visualizar antes de reverter.');
            return;
        }

        if (confirm(`Tem certeza de que deseja reverter o conteúdo para esta versão? A alteração precisará ser salva.`)) {
            exitPreviewMode(); // Sai do modo preview
            quill.setContents(selectedVersionContent); // Carrega o conteúdo no editor (agora editável)
            alert('Conteúdo revertido. Clique em "Atualizar Procedimento" para salvar a alteração como uma nova versão.');
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
            department: $('#department').val(),
            role: $('#role').val(),
            type: $('#type').val(),
            responsible: $('#responsible').val(),
            tags: tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag),
            attachments: attachments
        };

        try {
            await makeRequest(`/api/procedures-management/procedures/${procedureData.id}`, 'PUT', dataToSave);
            showNotification('Procedimento atualizado com sucesso!', 'success');
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
        currentContent = data.content; // Salva o conteúdo original/atual
        
        // Inicializa o Quill.js com os dados carregados
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
        quill.setContents(currentContent); // Carrega o conteúdo atual no editor

        $('#procedure_id').val(data.id);
        $('#title').val(data.title);
        $('#department').val(data.department);
        $('#role').val(data.role);
        $('#type').val(data.type);
        $('#responsible').val(data.responsible);
        $('#tags').val(data.tags ? data.tags.join(', ') : '');
        
        // Limpa e popula os anexos existentes
        $('#attachments-container').empty();
        if (data.attachments && data.attachments.length > 0) {
            data.attachments.forEach(attachment => {
                addAttachmentRow(attachment);
            });
        }

        displayVersionHistory(data.versions);
    } catch (error) {
        console.error('Erro ao buscar dados do procedimento:', error);
        alert('Não foi possível carregar os detalhes do procedimento.');
    }
}

function displayVersionHistory(versions) {
    const list = $('#version-history');
    list.empty();
    if (!versions || versions.length === 0) {
        list.html('<li class="list-group-item">Nenhum histórico de versão encontrado.</li>');
        return;
    }
    versions.sort((a, b) => b.version_number - a.version_number).forEach(item => { // Ordena da mais nova para a mais antiga
        const listItem = `
            <li class="list-group-item list-group-item-action version-item" data-version-id="${item.version_number}">
                <strong>Versão ${item.version_number}</strong>
                <small class="d-block text-muted">
                    por ${item.author} em ${new Date(item.created_at).toLocaleString()}
                </small>
            </li>
        `;
        list.append(listItem);
    });
}

function addAttachmentRow(attachment = {}) {
    const newRow = `
        <div class="row gx-2 mb-2 attachment-row">
            <div class="col-md-3">
                <select class="form-select form-select-sm attachment-type">
                    <option value="link" ${attachment.type === 'link' ? 'selected' : ''}>Link</option>
                    <option value="video" ${attachment.type === 'video' ? 'selected' : ''}>Vídeo</option>
                    <option value="image" ${attachment.type === 'image' ? 'selected' : ''}>Imagem</option>
                </select>
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm attachment-url" placeholder="URL" value="${attachment.url || ''}">
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm attachment-description" placeholder="Descrição" value="${attachment.description || ''}">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-sm btn-danger btn-remove-attachment">&times;</button>
            </div>
        </div>
    `;
    $('#attachments-container').append(newRow);
}

function loadSelectOptions() {
    // Retorna uma promessa para garantir que os dados sejam carregados antes de preencher o form
    return new Promise((resolve) => {
        const departments = [{id: 'RH', name: 'Recursos Humanos'}, {id: 'Financeiro', name: 'Financeiro'}, {id: 'TI', name: 'Tecnologia da Informação'}];
        const roles = [{id: 'Todos', name: 'Todos'}, {id: 'Gestores', name: 'Gestores'}, {id: 'Analistas', name: 'Analistas'}];
        const types = [{id: 'Processo', name: 'Processo'}, {id: 'Financeiro', name: 'Financeiro'}, {id: 'Suporte', 'name': 'Suporte'}];
        const responsibles = [{id: 'Ana Paula', name: 'Ana Paula'}, {id: 'Carlos Alberto', name: 'Carlos Alberto'}, {id: 'Juliana Lima', name: 'Juliana Lima'}];

        populateSelect('#department', departments);
        populateSelect('#role', roles);
        populateSelect('#type', types);
        populateSelect('#responsible', responsibles);
        resolve();
    });
}

function populateSelect(selectId, data) {
    const select = $(selectId);
    select.empty();
    select.append('<option value="">Selecione...</option>');
    data.forEach(item => {
        select.append(`<option value="${item.id}">${item.name}</option>`);
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

function showNotification(message, type = 'success') {
    if (window.opener && window.opener.showGlobalNotification) {
        window.opener.showGlobalNotification(message, type);
    } else {
        alert(message);
    }
    
    if (type === 'success') {
        window.opener.location.reload();
        window.close();
    }
}

// Função para alternar para o modo de preview
function enterPreviewMode(version) {
    quill.setContents(version.content);
    quill.disable(); // Bloqueia o editor
    $('#preview-mode-indicator').show();
    $('#btn-back-to-current').show();
    $('#btn-revert-version').prop('disabled', false);
    selectedVersionContent = version.content; // Salva o conteúdo para a reversão
}

// Função para voltar ao modo de edição
function exitPreviewMode() {
    quill.setContents(currentContent); // Restaura o conteúdo original
    quill.enable(); // Libera o editor
    $('#preview-mode-indicator').hide();
    $('#btn-back-to-current').hide();
    $('#btn-revert-version').prop('disabled', true);
    $('.version-item').removeClass('active');
    selectedVersionContent = null;
} 