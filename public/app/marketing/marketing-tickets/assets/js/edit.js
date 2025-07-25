// edit.js - Gerenciamento de Chamado de Marketing (Administrador)

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('id');
    
    if (!ticketId) {
        alert('ID do chamado não fornecido');
        window.close();
        return;
    }

    // Variável global para FilePond
    let fileAttachments;

    // Inicializar Choices.js para seleção múltipla
    let involvedSelect;
    
    // Função para inicializar Choices.js
    function initializeChoices() {
        involvedSelect = new Choices('#edit-involved', {
            removeItemButton: true,
            searchEnabled: true,
            placeholder: true,
            placeholderValue: 'Selecione os envolvidos',
            noResultsText: 'Nenhum resultado encontrado',
            itemSelectText: 'Pressione para selecionar'
        });
        
        console.log('Choices.js inicializado:', involvedSelect);
    }
    
    // Inicializar depois de carregar os usuários
    // initializeChoices();

    // Inicializar FilePond
    initializeFilePond();

    // Carregar usuários primeiro, depois os dados do chamado
    loadUsers().then(() => {
        console.log('Usuários carregados, agora carregando dados do ticket...');
        setTimeout(() => {
            loadTicketData();
        }, 500); // Aguardar um pouco mais para garantir que o Choices.js foi recriado
    });

    // Event listeners
    $('#edit-form').on('submit', handleFormSubmit);
    $('#btn-delete-ticket').on('click', handleDeleteTicket);
    
    // Event listener para o formulário de comentário - usar delegação de eventos
    $(document).on('submit', '#chat-form', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleChatSubmit(e);
    });
    
    // Prevenir que Enter no campo de comentário submeta o formulário principal
    $(document).on('keypress', '#chat-message', function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            e.stopPropagation();
            handleChatSubmit();
        }
    });
    
    // Handler para envio de mensagem do chat sem submit do form principal
    $('#btn-send-chat').on('click', function(e) {
        handleChatSubmit(e);
    });
    // Garantir que o submit do chat-form não submeta o form principal
    $('#chat-form').on('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleChatSubmit(e);
    });
    
    // Controle de campos condicionais
    $('#edit-type').on('change', function() {
        const selectedType = $(this).val();
        
        // Mostrar/ocultar campo "outro tipo"
        if (selectedType === 'outro') {
            $('#edit-other-type').closest('.col-md-6').show();
        } else {
            $('#edit-other-type').closest('.col-md-6').hide();
        }
        
        // Mostrar/ocultar campo "dimensões"
        if (selectedType === 'arte') {
            $('#edit-dimensions').closest('.col-md-6').show();
            $('#edit-dimensions').prop('required', true);
        } else {
            $('#edit-dimensions').closest('.col-md-6').hide();
            $('#edit-dimensions').prop('required', false);
        }
    });

    // Função para carregar dados do chamado
    async function loadTicketData() {
        try {
            const ticket = await makeRequest(`/api/marketing/tickets/${ticketId}`);
            populateForm(ticket);
            loadComments();
        } catch (err) {
            console.error('Erro ao carregar dados do chamado:', err);
            alert('Erro ao carregar dados do chamado');
        }
    }

    // Função para carregar usuários
    async function loadUsers() {
        try {
            console.log('Iniciando carregamento de usuários...');
            const users = await makeRequest('/api/marketing/tickets/users');
            console.log('Usuários carregados:', users);
            
            if (!users || users.length === 0) {
                console.warn('Nenhum usuário encontrado');
                return;
            }
            
            // Preencher select de responsável
            const responsibleSelect = $('#edit-responsible');
            responsibleSelect.empty(); // Limpar opções existentes
            users.forEach(user => {
                responsibleSelect.append(`<option value="${user.id}">${user.full_name}</option>`);
            });

            // Preencher select de envolvidos
            const involvedSelectElement = document.getElementById('edit-involved');
            console.log('Elemento select encontrado:', involvedSelectElement);
            
            if (!involvedSelectElement) {
                console.error('Elemento select não encontrado!');
                return;
            }
            
            involvedSelectElement.innerHTML = ''; // Limpar opções existentes
            
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id.toString();
                option.textContent = user.full_name;
                involvedSelectElement.appendChild(option);
                console.log('Opção adicionada:', user.id.toString(), user.full_name);
            });
            
            console.log('Opções adicionadas ao select:', involvedSelectElement.options.length);
            
            // Inicializar Choices.js com as opções já carregadas
            initializeChoices();
            
            console.log('Choices.js inicializado com opções:', involvedSelect);

            console.log('Usuários adicionados ao Choices.js');

        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
        }
    }

    // Função para mostrar/esconder botões admin de ação
    function updateAdminActionButtons(status) {
        const adminButtons = $('#admin-action-buttons');
        if (status === 'Aguardando validação') {
            adminButtons.removeClass('d-none');
        } else {
            adminButtons.addClass('d-none');
        }
    }

    // Função para preencher formulário
    function populateForm(ticket) {
        console.log('Preenchendo formulário com dados:', ticket);
        
        $('#edit-title').val(ticket.title);
        $('#edit-status').val(ticket.status);
        $('#edit-category').val(ticket.category);
        $('#edit-description').val(ticket.description);
        $('#edit-dimensions').val(ticket.dimensions);
        $('#edit-links').val(ticket.links);
        
        // Função utilitária para garantir formato YYYY-MM-DD
        function formatDateInput(dateStr) {
            if (!dateStr) return '';
            // Se já está no formato certo
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
            // Se vier no formato ISO ou com hora, pega só a parte da data
            return dateStr.split('T')[0];
        }

        $('#edit-start-date').val(formatDateInput(ticket.start_date));
        $('#edit-end-date').val(formatDateInput(ticket.end_date));
        $('#edit-responsible').val(ticket.responsible_id);
        $('#edit-other-type').val(ticket.other_type);
        
        // Atualizar badge de status
        updateStatusBadge(ticket.status);
        updateAdminActionButtons(ticket.status);
        
        // Carregar envolvidos se existirem
        if (ticket.involved_ids) {
            const involvedIds = ticket.involved_ids.split(',').map(id => id.trim().toString());
            console.log('IDs dos envolvidos:', involvedIds);
            // Aguardar um pouco para garantir que as opções foram carregadas
            setTimeout(() => {
                try {
                    involvedSelect.setChoiceByValue(involvedIds);
                    console.log('Envolvidos marcados com sucesso');
                } catch (error) {
                    console.error('Erro ao marcar envolvidos:', error);
                    // Tentar método alternativo
                    involvedIds.forEach(id => {
                        involvedSelect.setChoiceByValue([id]);
                    });
                }
            }, 200);
        } else {
            console.log('Nenhum envolvido encontrado para este ticket');
        }
        
        // Marcar o tipo se existir - mover para o final para garantir que funcione
        if (ticket.type) {
            console.log('Tipo do ticket:', ticket.type);
            console.log('Tipo do ticket (trim):', ticket.type.trim());
            
            // Aguardar um pouco para garantir que o select foi renderizado
            setTimeout(() => {
                const typeSelect = $('#edit-type');
                console.log('Opções disponíveis no select:', typeSelect.find('option').map(function() {
                    return { value: this.value, text: this.text };
                }).get());
                
                const ticketType = ticket.type ? ticket.type.trim() : '';
                typeSelect.val(ticketType);
                console.log('Tipo selecionado no select:', typeSelect.val());
                
                // Verificar se foi selecionado corretamente
                if (typeSelect.val() === ticketType) {
                    console.log('Tipo selecionado com sucesso!');
                    // Disparar evento change para mostrar/ocultar campos condicionais
                    typeSelect.trigger('change');
                } else {
                    console.log('Falha ao selecionar tipo. Valor esperado:', ticketType, 'Valor atual:', typeSelect.val());
                    console.log('Comparação detalhada:');
                    console.log('- Valor do ticket (original):', ticket.type);
                    console.log('- Valor do ticket (trim):', ticketType);
                    console.log('- Valor do select:', typeSelect.val());
                    console.log('- São iguais?', typeSelect.val() === ticketType);
                }
            }, 100);
        } else {
            console.log('Nenhum tipo encontrado para este ticket');
        }
        
        // Carregar anexos se existirem
        if (ticket.attachments) {
            loadAttachments(ticket.attachments);
        } else {
            loadAttachments([]);
        }
    }

    // Função para atualizar badge de status
    function updateStatusBadge(status) {
        const badge = $('#ticket-status-badge');
        badge.removeClass().addClass('badge fs-14');
        
        switch(status) {
            case 'Novo': badge.addClass('bg-secondary'); break;
            case 'Em triagem': badge.addClass('bg-info'); break;
            case 'Em andamento': badge.addClass('bg-primary'); break;
            case 'Aguardando validação': badge.addClass('bg-warning'); break;
            case 'Aguardando retorno do solicitante': badge.addClass('bg-danger'); break;
            case 'Finalizado': badge.addClass('bg-success'); break;
            default: badge.addClass('bg-secondary');
        }
        
        badge.text(status);
    }
    
    // Função para mostrar notificações
    function showNotification(message, type = 'info') {
        const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
        const notification = $(`
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                ${message}
            </div>
        `);
        
        $('body').append(notification);
        
        // Remover notificação após 5 segundos
        setTimeout(() => {
            notification.alert('close');
        }, 5000);
    }

    // Função para carregar anexos
    function loadAttachments(attachments) {
        const container = $('#current-attachments');
        container.empty();
        
        if (attachments && attachments.length > 0) {
            attachments.forEach(attachment => {
                // Determinar ícone baseado na extensão do arquivo
                const fileExtension = attachment.filename.split('.').pop().toLowerCase();
                let fileIcon = 'ri-file-line';
                
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(fileExtension)) {
                    fileIcon = 'ri-image-line';
                } else if (['pdf'].includes(fileExtension)) {
                    fileIcon = 'ri-file-pdf-line';
                } else if (['doc', 'docx'].includes(fileExtension)) {
                    fileIcon = 'ri-file-word-line';
                } else if (['xls', 'xlsx'].includes(fileExtension)) {
                    fileIcon = 'ri-file-excel-line';
                } else if (['ppt', 'pptx'].includes(fileExtension)) {
                    fileIcon = 'ri-file-ppt-line';
                } else if (['zip', 'rar', '7z'].includes(fileExtension)) {
                    fileIcon = 'ri-file-zip-line';
                }
                
                // Construir URL para visualização/download
                const fileUrl = `/storageService/marketing-tickets/${attachment.filename}`;
                
                container.append(`
                    <div class="attachment-item d-flex align-items-center justify-content-between p-2 border rounded mb-2">
                        <div class="d-flex align-items-center">
                            <i class="${fileIcon} me-2 text-muted"></i>
                            <span class="attachment-name">${attachment.filename}</span>
                        </div>
                        <div class="attachment-actions">
                            <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="openAttachment('${fileUrl}', '${attachment.filename}')" title="Abrir">
                                <i class="ri-eye-line"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-success me-1" onclick="downloadAttachment('${fileUrl}', '${attachment.filename}')" title="Download">
                                <i class="ri-download-line"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeAttachment('${attachment.id}')" title="Excluir">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </div>
                `);
            });
        } else {
            container.append('<p class="text-muted">Nenhum anexo encontrado</p>');
        }
    }
    
    // Função para abrir anexo
    window.openAttachment = function(fileUrl, filename) {
        try {
            // Para imagens, abrir em nova aba
            const fileExtension = filename.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(fileExtension)) {
                window.open(fileUrl, '_blank');
            } else {
                // Para outros tipos, tentar abrir em nova aba
                window.open(fileUrl, '_blank');
            }
        } catch (error) {
            console.error('Erro ao abrir anexo:', error);
            alert('Erro ao abrir anexo. Tente fazer download.');
        }
    };
    
    // Função para download de anexo
    window.downloadAttachment = function(fileUrl, filename) {
        try {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Erro ao fazer download:', error);
            alert('Erro ao fazer download. Tente novamente.');
        }
    };
    
    // Função para remover anexo
    window.removeAttachment = async function(attachmentId) {
        if (confirm('Tem certeza que deseja excluir este anexo?')) {
            try {
                await makeRequest(`/api/marketing/tickets/attachments/${attachmentId}`, 'DELETE');
                showNotification('Anexo removido com sucesso', 'success');
                // Recarregar dados do ticket para atualizar lista de anexos
                loadTicketData();
            } catch (error) {
                console.error('Erro ao remover anexo:', error);
                showNotification('Erro ao remover anexo', 'error');
            }
        }
    };

    // Função para carregar comentários
    async function loadComments() {
        try {
            const comments = await makeRequest(`/api/marketing/tickets/${ticketId}/comments`);
            renderComments(comments);
        } catch (err) {
            console.error('Erro ao carregar comentários:', err);
        }
    }

    // Função para renderizar comentários
    function renderComments(comments) {
        const container = $('#chat-container');
        container.empty();
        
        if (comments && comments.length > 0) {
            comments.forEach(comment => {
                const messageClass = comment.is_own ? 'own' : 'other';
                
                // Tratar data corretamente
                let time = 'Data não disponível';
                if (comment.created_at) {
                    try {
                        const date = new Date(comment.created_at);
                        if (!isNaN(date.getTime())) {
                            time = date.toLocaleString('pt-BR');
                        }
                    } catch (e) {
                        console.error('Erro ao processar data:', e);
                    }
                }
                
                // Tratar nome do autor
                const authorName = comment.author_name || comment.author || comment.user_name || 'Usuário';
                
                // Tratar conteúdo
                const content = comment.content || comment.message || 'Comentário sem conteúdo';
                
                container.append(`
                    <div class="chat-message ${messageClass}">
                        <div class="message-author">${authorName}</div>
                        <div class="message-content">${content}</div>
                        <div class="message-time">${time}</div>
                    </div>
                `);
            });
        } else {
            container.append('<p class="text-muted text-center">Nenhum comentário ainda</p>');
        }
        
        container.scrollTop(container[0].scrollHeight);
    }



    // Função para inicializar FilePond
    function initializeFilePond() {
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
                maxFiles: 10,
                labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
            });

            fileAttachments.on('addfile', (error, file) => {
                if (error) {
                    console.error('Erro ao adicionar arquivo:', error);
                }
            });
        }
    }

    // Função para lidar com envio do formulário
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData();
            formData.append('title', $('#edit-title').val());
            formData.append('status', $('#edit-status').val());
            formData.append('type', $('#edit-type').val());
            formData.append('other_type', $('#edit-other-type').val());
            formData.append('category', $('#edit-category').val());
            formData.append('description', $('#edit-description').val());
            formData.append('dimensions', $('#edit-dimensions').val());
            formData.append('links', $('#edit-links').val());
            const startDate = $('#edit-start-date').val();
            const endDate = $('#edit-end-date').val();
            formData.append('start_date', startDate || '');
            formData.append('end_date', endDate || '');
            const responsibleId = $('#edit-responsible').val();
            formData.append('responsible_id', responsibleId && responsibleId !== '' ? responsibleId : '');
            
            // Adicionar envolvidos
            const involvedValues = involvedSelect.getValue();
            if (involvedValues && involvedValues.length > 0) {
                const involvedIds = involvedValues.map(item => item.value);
                // Enviar como array em vez de string
                involvedIds.forEach(id => {
                    formData.append('involved_ids[]', id);
                });
            }
            
            // Adicionar novos anexos do FilePond
            const files = fileAttachments.getFiles();
            files.forEach((file, index) => {
                formData.append('attachments', file.file, file.filename);
            });
            
            await makeRequest(`/api/marketing/tickets/${ticketId}`, 'PUT', formData);
            
            alert('Chamado atualizado com sucesso!');
            updateStatusBadge($('#edit-status').val());
            
            // Limpar FilePond após sucesso
            fileAttachments.removeFiles();
            
        } catch (err) {
            console.error('Erro ao atualizar chamado:', err);
            alert('Erro ao atualizar chamado');
        }
    }

    // Função para lidar com exclusão
    async function handleDeleteTicket() {
        if (confirm('Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.')) {
            try {
                await makeRequest(`/api/marketing/tickets/${ticketId}`, 'DELETE');
                
                alert('Chamado excluído com sucesso!');
                window.close();
                
            } catch (err) {
                console.error('Erro ao excluir chamado:', err);
                alert('Erro ao excluir chamado');
            }
        }
    }

    // Função para lidar com envio de comentário
    async function handleChatSubmit(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation(); // Impedir propagação do evento
        }
        
        console.log('Formulário de comentário submetido');
        
        const message = $('#chat-message').val().trim();
        if (!message) {
            console.log('Mensagem vazia, ignorando submit');
            return;
        }
        
        try {
            console.log('Enviando comentário:', message);
            await makeRequest(`/api/marketing/tickets/${ticketId}/comments`, 'POST', { message: message });
            
            $('#chat-message').val('');
            await loadComments(); // Recarregar comentários
            
            console.log('Comentário enviado com sucesso');
            
        } catch (err) {
            console.error('Erro ao enviar comentário:', err);
            alert('Erro ao enviar comentário');
        }
    }

    // Socket.io para atualizações em tempo real
    const socket = io();
    
    socket.on('ticketUpdated', function(data) {
        if (data.ticket_id == ticketId) {
            console.log('Chamado atualizado via Socket.IO:', data);
            
            // Se for atualização de status, atualizar apenas o select de status
            if (data.type === 'status_update') {
                $('#edit-status').val(data.status);
                updateStatusBadge(data.status);
                updateAdminActionButtons(data.status); // Atualizar botões admin
                showNotification('Status atualizado para: ' + data.status, 'success');
            } else {
                // Para outras atualizações, recarregar dados completos
                loadTicketData();
            }
        }
    });

    socket.on('newComment', function(data) {
        if (data.ticket_id == ticketId) {
            console.log('Novo comentário via Socket.IO:', data);
            loadComments(); // Recarregar comentários
        }
    });
    
    socket.on('ticketDeleted', function(data) {
        if (data.ticket_id == ticketId) {
            console.log('Chamado excluído via Socket.IO:', data);
            alert('Este chamado foi excluído por outro usuário.');
            window.close();
        }
    });

    // Eventos dos botões admin
    $(document).on('click', '#btn-admin-approve', function() {
        showAdminActionModal('Aprovar Material', 'Confirmar aprovação do material?', 'Material aprovado e enviado para o solicitante!', 'Aguardando retorno do solicitante');
    });

    $(document).on('click', '#btn-admin-request-changes', function() {
        showAdminActionModal('Solicitar Ajustes', 'Descreva os ajustes necessários:', 'Ajustes solicitados: ', 'Em andamento', true);
    });

    // Função para mostrar modal de ação admin
    function showAdminActionModal(title, message, commentPrefix, newStatus, needsInput = false) {
        // Reutilizar modal do sistema ou criar simples
        const modalHtml = `
            <div class="modal fade" id="adminStatusActionModal" tabindex="-1" aria-labelledby="adminStatusActionModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="adminStatusActionModalLabel">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${needsInput ? `<p class='mb-3'>${message}</p><textarea class='form-control' id='admin-action-input' rows='3' placeholder='Digite aqui...'></textarea>` : `<p>${message}</p>`}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="admin-modal-confirm-btn">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>`;
        // Remover modal anterior se existir
        $('#adminStatusActionModal').remove();
        $('body').append(modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('adminStatusActionModal'));
        modal.show();
        
        $('#admin-modal-confirm-btn').off('click').on('click', function() {
            let comment = commentPrefix;
            if (needsInput) {
                const input = $('#admin-action-input').val().trim();
                if (!input) {
                    alert('Por favor, preencha o campo obrigatório.');
                    return;
                }
                comment += input;
            }
            updateTicketStatusAdmin(newStatus, comment);
            modal.hide();
        });
    }

    // Função para atualizar status do ticket (admin)
    async function updateTicketStatusAdmin(newStatus, comment) {
        try {
            // Atualizar status
            await makeRequest(`/api/marketing/tickets/${ticketId}/status`, 'PUT', { status: newStatus });
            // Adicionar comentário automático
            if (comment) {
                await makeRequest(`/api/marketing/tickets/${ticketId}/comments`, 'POST', {
                    message: comment,
                    type: 'publico'
                });
            }
            showNotification('Status atualizado com sucesso!', 'success');
            $('#edit-status').val(newStatus);
            updateStatusBadge(newStatus);
            updateAdminActionButtons(newStatus);
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            showNotification('Erro ao atualizar status do chamado', 'error');
        }
    }

}); 