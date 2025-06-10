let quill;

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

    // Mostra/esconde o campo de URL do vídeo com base no formato
    $('#format').change(function() {
        if ($(this).val() === 'Vídeo') {
            $('#video-url-container').show();
        } else {
            $('#video-url-container').hide();
        }
    });

    // Lógica para adicionar anexos
    $('#btn-add-attachment').click(function() {
        addAttachmentRow();
    });

    // Lógica para remover anexos (usando delegação de eventos)
    $('#attachments-container').on('click', '.btn-remove-attachment', function() {
        if (confirm('Tem certeza de que deseja remover este anexo?')) {
            $(this).closest('.attachment-row').remove();
        }
    });

    // Ação do botão salvar
    $('#form-create-procedure').submit(async function(e) {
        e.preventDefault(); // Previne o comportamento padrão do formulário
        toggleSaveButton(true);

        const contentData = quill.getContents(); // Pega o conteúdo como Delta

        // Coleta os anexos
        const attachments = [];
        $('.attachment-row').each(function() {
            const type = $(this).find('.attachment-type').val();
            const url = $(this).find('.attachment-url').val();
            const description = $(this).find('.attachment-description').val();
            if (url) {
                attachments.push({ type, url, description });
            }
        });

        const tagsValue = $('#tags').val() || ''; // Garante que seja uma string

        const procedureData = {
            title: $('#title').val(),
            content: contentData, // Salva o Delta do editor
            department: $('#department').val(),
            role: $('#role').val(),
            type: $('#type').val(),
            responsible: $('#responsible').val(),
            tags: tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag), // Filtra tags vazias
            attachments: attachments
        };

        console.log("Dados enviados para a API:", procedureData);

        try {
            await makeRequest('/api/procedures-management/procedures', 'POST', procedureData);
            showNotification('Procedimento criado com sucesso!', 'success');
        } catch (error) {
            showNotification('Erro ao salvar o procedimento.', 'danger');
            console.error(error);
        } finally {
            toggleSaveButton(false);
        }
    });
});

function loadSelectOptions() {
    // Mock: futuramente buscar de APIs reais
    const departments = [{id: 'RH', name: 'Recursos Humanos'}, {id: 'Financeiro', name: 'Financeiro'}, {id: 'TI', name: 'Tecnologia da Informação'}];
    const roles = [{id: 'Todos', name: 'Todos'}, {id: 'Gestores', name: 'Gestores'}, {id: 'Analistas', name: 'Analistas'}];
    const types = [{id: 'Processo', name: 'Processo'}, {id: 'Financeiro', name: 'Financeiro'}, {id: 'Suporte', name: 'Suporte'}];
    const responsibles = [{id: 'Ana Paula', name: 'Ana Paula'}, {id: 'Carlos Alberto', name: 'Carlos Alberto'}, {id: 'Juliana Lima', name: 'Juliana Lima'}];

    populateSelect('#department', departments);
    populateSelect('#role', roles);
    populateSelect('#type', types);
    populateSelect('#responsible', responsibles);
}

function populateSelect(selectId, data) {
    const select = $(selectId);
    select.empty();
    select.append('<option value="">Selecione...</option>');
    data.forEach(item => {
        select.append(`<option value="${item.id}">${item.name}</option>`);
    });
}

function addAttachmentRow(attachment = {}) {
    const attachmentId = Date.now(); // ID único para os elementos
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
        window.opener.location.reload();
        window.close();
    }
} 