// view.js - Detalhes do Chamado de Marketing

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('id');
    if (!ticketId) {
        alert('Chamado não encontrado!');
        window.close();
        return;
    }

    // Variável global para FilePond
    let fileAttachments;

    // Função para verificar permissão de upload
    function canUploadAttachment(ticket) {
        // Pega o usuário logado do localStorage
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('StorageGoogle'));
        } catch (e) {}
        if (!user) return false;
        const userId = String(user.system_userID);
        // Permite se for solicitante, responsável ou envolvido
        if (String(ticket.requester_id) === userId) return true;
        if (String(ticket.responsible_id) === userId) return true;
        if (ticket.involved_ids && ticket.involved_ids.split(',').map(x => x.trim()).includes(userId)) return true;
        return false;
    }

    // Carregar dados do chamado
    makeRequest(`/api/marketing/tickets/${ticketId}`).then(ticket => {
        $('#ticket-title').text(ticket.title);
        $('#ticket-description').text(ticket.description);
        $('#ticket-type').text(ticket.type + (ticket.other_type ? ` - ${ticket.other_type}` : ''));
        $('#ticket-category').text(ticket.category);
        $('#ticket-requester').text(ticket.requester_name || 'Não definido');
        $('#ticket-responsible').text(ticket.responsible_name || 'Não definido');
        $('#ticket-start-date').text(formatDate(ticket.start_date) || 'Não definida');
        $('#ticket-end-date').text(formatDate(ticket.end_date) || 'Não definida');
        if (ticket.dimensions) {
            $('#dimensions-row').show();
            $('#ticket-dimensions').text(ticket.dimensions);
        }
        $('#ticket-links').html(ticket.links ? `<a href="${ticket.links}" target="_blank">${ticket.links}</a>` : '-');
        $('#ticket-status-badge').text(ticket.status).removeClass().addClass('badge bg-' + getStatusColor(ticket.status));
        
        // Anexos
        if (ticket.attachments && ticket.attachments.length > 0) {
            let files = ticket.attachments.map(f => `<a href="/storageService/marketing-tickets/${f.filename}" target="_blank">${f.filename}</a>`).join(', ');
            $('#ticket-attachments').html(files);
            loadAttachments(ticket.attachments);
        } else {
            $('#ticket-attachments').text('-');
            loadAttachments([]);
        }
        
        // Envolvidos
        if (ticket.involved_names && ticket.involved_names.length > 0) {
            $('#ticket-involved').text(ticket.involved_names.join(', '));
        } else {
            $('#ticket-involved').text('-');
        }
        
        // Inicializar FilePond SEM restrição de permissão
        $('.new-attachments-section').show();
        initializeFilePond();
    });

    // Função para formatar data
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Função para cor do status
    function getStatusColor(status) {
        switch(status) {
            case 'Novo': return 'secondary';
            case 'Em triagem': return 'info';
            case 'Em andamento': return 'primary';
            case 'Aguardando validação': return 'warning';
            case 'Aguardando retorno do solicitante': return 'danger';
            case 'Finalizado': return 'success';
            default: return 'secondary';
        }
    }



    // Chat em tempo real
    const socket = io();
    
    socket.on('newComment', function(data) {
        if (data.ticket_id == ticketId) {
            console.log('Novo comentário recebido via Socket.IO:', data);
            loadComments(); // Recarregar comentários
        }
    });
    
    socket.on('ticketUpdated', function(data) {
        if (data.ticket_id == ticketId) {
            console.log('Chamado atualizado via Socket.IO:', data);
            
            // Se for atualização de status, atualizar apenas os elementos necessários
            if (data.type === 'status_update') {
                // Atualizar badge de status
                $('#ticket-status-badge').text(data.status).removeClass().addClass('badge fs-14 bg-' + getStatusColor(data.status));
                
                // Atualizar botões de ação
                updateActionButtons(data.status);
                
                // Mostrar notificação
                showNotification('Status atualizado para: ' + data.status, 'success');
            } else {
                // Para outras atualizações, recarregar página completa
                location.reload();
            }
        }
    });
    
    socket.on('ticketDeleted', function(data) {
        if (data.ticket_id == ticketId) {
            console.log('Chamado excluído via Socket.IO:', data);
            alert('Este chamado foi excluído por outro usuário.');
            window.close();
        }
    });

    // Carregar comentários iniciais
    loadComments();

    // Enviar comentário
    $('#chat-form').on('submit', async function(e) {
        e.preventDefault();
        const msg = $('#chat-message').val().trim();
        if (!msg) return;
        
        try {
            await makeRequest(`/api/marketing/tickets/${ticketId}/comments`, 'POST', { message: msg });
            
            $('#chat-message').val('');
            loadComments(); // Recarregar comentários
            
        } catch (err) {
            console.error('Erro ao enviar comentário:', err);
            alert('Erro ao enviar comentário');
        }
    });

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
                        </div>
                    </div>
                `);
            });
        } else {
            container.append('<p class="text-muted">Nenhum anexo encontrado</p>');
        }
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

            // Adicionar evento para enviar anexos quando arquivos são adicionados
            fileAttachments.on('processfile', (error, file) => {
                if (!error) {
                    // Enviar anexos automaticamente quando processados
                    sendAttachments();
                }
            });
        }
    }

    // Função para enviar anexos
    async function sendAttachments() {
        try {
            const files = fileAttachments.getFiles();
            if (files.length === 0) return;

            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append('attachments', file.file, file.filename);
            });

            await makeRequest(`/api/marketing/tickets/${ticketId}/attachments`, 'POST', formData);

            // Limpar FilePond após sucesso
            fileAttachments.removeFiles();
            
            // Recarregar apenas a lista de anexos
            const ticket = await makeRequest(`/api/marketing/tickets/${ticketId}`);
            loadAttachments(ticket.attachments);
            
        } catch (err) {
            console.error('Erro ao enviar anexos:', err);
            alert('Erro ao enviar anexos');
        }
    }

    // Funções globais para anexos
    window.openAttachment = function(filePath, filename) {
        try {
            // Para imagens, abrir em nova aba
            const fileExtension = filename.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(fileExtension)) {
                window.open(filePath, '_blank');
            } else {
                // Para outros tipos, tentar abrir em nova aba
                window.open(filePath, '_blank');
            }
        } catch (error) {
            console.error('Erro ao abrir anexo:', error);
            alert('Erro ao abrir anexo. Tente fazer download.');
        }
    };

    window.downloadAttachment = function(filePath, filename) {
        try {
            const link = document.createElement('a');
            link.href = filePath;
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

    // ===== LÓGICA DOS BOTÕES DE AÇÃO BASEADOS NO STATUS =====
    
    // Função para mostrar/esconder botões baseado no status
    function updateActionButtons(status) {
        const actionButtons = $('#status-action-buttons');
        const validationButtons = $('#validation-buttons');
        const solicitantButtons = $('#solicitant-buttons');
        
        // Esconder todos os botões primeiro
        actionButtons.addClass('d-none');
        validationButtons.addClass('d-none');
        solicitantButtons.addClass('d-none');
        
        // Mostrar botões específicos baseado no status
        switch(status) {
            case 'Aguardando validação':
                actionButtons.removeClass('d-none');
                validationButtons.removeClass('d-none');
                break;
            case 'Aguardando retorno do solicitante':
                actionButtons.removeClass('d-none');
                solicitantButtons.removeClass('d-none');
                break;
            default:
                // Para outros status, esconder todos os botões
                actionButtons.addClass('d-none');
                break;
        }
        
        console.log('Botões de ação atualizados para status:', status);
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
    
    // Event listeners para os botões de ação
    $('#btn-approve').on('click', function() {
        showActionModal('approve', 'Aprovar Material', 
            'Confirmar aprovação do material?', 
            'Material aprovado com sucesso!', 
            'Finalizado');
    });
    
    $('#btn-request-changes').on('click', function() {
        showActionModal('request-changes', 'Solicitar Ajustes', 
            'Descreva os ajustes necessários:', 
            'Ajustes solicitados: ', 
            'Em andamento', true);
    });
    
    $('#btn-accept').on('click', function() {
        showActionModal('accept', 'Aceitar Material', 
            'Confirmar aceitação do material?', 
            'Material aceito pelo solicitante!', 
            'Finalizado');
    });
    
    $('#btn-reject').on('click', function() {
        showActionModal('reject', 'Recusar Material', 
            'Motivo da recusa:', 
            'Material recusado: ', 
            'Em andamento', true);
    });
    
    $('#btn-request-more-info').on('click', function() {
        showActionModal('request-info', 'Solicitar Informações', 
            'Que informações adicionais são necessárias?', 
            'Solicitação de informações: ', 
            'Em andamento', true);
    });
    
    // Função para mostrar modal de ação
    function showActionModal(action, title, message, commentPrefix, newStatus, needsInput = false) {
        const modal = $('#statusActionModal');
        const modalTitle = modal.find('.modal-title');
        const modalContent = modal.find('#modal-content');
        const confirmBtn = modal.find('#modal-confirm-btn');
        
        modalTitle.text(title);
        
        if (needsInput) {
            modalContent.html(`
                <p class="mb-3">${message}</p>
                <textarea class="form-control" id="action-input" rows="3" placeholder="Digite aqui..."></textarea>
            `);
            confirmBtn.text('Confirmar').removeClass('btn-success btn-danger').addClass('btn-primary');
        } else {
            modalContent.html(`<p>${message}</p>`);
            confirmBtn.text('Confirmar').removeClass('btn-primary btn-danger').addClass('btn-success');
        }
        
        // Limpar input anterior
        modal.find('#action-input').val('');
        
        // Event listener para confirmar ação
        confirmBtn.off('click').on('click', function() {
            let comment = commentPrefix;
            
            if (needsInput) {
                const input = modal.find('#action-input').val().trim();
                if (!input) {
                    alert('Por favor, preencha o campo obrigatório.');
                    return;
                }
                comment += input;
            }
            
            updateTicketStatus(newStatus, comment);
            modal.modal('hide');
        });
        
        modal.modal('show');
    }
    
    // Função para atualizar status do ticket
    async function updateTicketStatus(newStatus, comment) {
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
            
            // Mostrar notificação de sucesso
            showNotification('Status atualizado com sucesso!', 'success');
            
            // Atualizar interface localmente (não recarregar página)
            $('#ticket-status-badge').text(newStatus).removeClass().addClass('badge fs-14 bg-' + getStatusColor(newStatus));
            updateActionButtons(newStatus);
            
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            showNotification('Erro ao atualizar status do chamado', 'error');
        }
    }
    
    // Atualizar botões quando carregar dados do ticket
    makeRequest(`/api/marketing/tickets/${ticketId}`).then(ticket => {
        updateActionButtons(ticket.status);
    });

    // Exibir botão salvar anexos após upload
    function initializeFilePond() {
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
                if (!error) {
                    $('#btn-save-attachments').removeClass('d-none');
                }
            });
            fileAttachments.on('removefile', (error, file) => {
                if (fileAttachments.getFiles().length === 0) {
                    $('#btn-save-attachments').addClass('d-none');
                }
            });
        }
    }

    // Salvar anexos apenas ao clicar no botão
    $('#btn-save-attachments').on('click', async function() {
        try {
            const files = fileAttachments.getFiles();
            if (files.length === 0) return;
            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append('attachments', file.file, file.filename);
            });
            await makeRequest(`/api/marketing/tickets/${ticketId}/attachments`, 'POST', formData);
            fileAttachments.removeFiles();
            $('#btn-save-attachments').addClass('d-none');
            // Recarregar apenas a lista de anexos
            const ticket = await makeRequest(`/api/marketing/tickets/${ticketId}`);
            loadAttachments(ticket.attachments);
        } catch (err) {
            console.error('Erro ao enviar anexos:', err);
            alert('Erro ao enviar anexos');
        }
    });
}); 