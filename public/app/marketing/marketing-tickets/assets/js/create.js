// create.js - Formulário de Abertura de Chamado de Marketing

$(document).ready(function() {
    // Inicializar Socket.IO
    const socket = io();
    
    // Variável global para FilePond
    let fileAttachments;
    
    // Inicializar FilePond
    initializeFilePond();
    
    // Inicializar select de envolvidos (exemplo)
    // Preencher via API de usuários
    // ...

    $('#create-ticket-form').on('submit', async function(e) {
        e.preventDefault();
        let formData = new FormData();
        
        // Adicionar campos básicos
        formData.append('title', $('#ticket-title').val());
        formData.append('type', $('#ticket-type').val());
        formData.append('other_type', $('#ticket-other-type').val());
        formData.append('category', $('#ticket-category').val());
        formData.append('description', $('#ticket-description').val());
        formData.append('dimensions', $('#ticket-dimensions').val());
        formData.append('links', $('#ticket-links').val());
        
        // Obter valores selecionados do Choices.js
        const selectedUsers = involvedChoices.getValue();
        if (selectedUsers && selectedUsers.length > 0) {
            // Adicionar cada usuário selecionado
            selectedUsers.forEach(user => {
                formData.append('involved', user.value);
            });
        }
        
        // Adicionar arquivos do FilePond
        const files = fileAttachments.getFiles();
        files.forEach((file, index) => {
            formData.append('attachments', file.file, file.filename);
        });
        
        try {
            await makeRequest('/api/marketing/tickets', 'POST', formData);
            alert('Chamado aberto com sucesso!');
            window.close();
        } catch (err) {
            alert('Erro ao abrir chamado: ' + (err.message || 'Tente novamente.'));
        }
    });
    
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
                maxFileSize: '25MB',
                acceptedFileTypes: [
                    'application/pdf',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ],
                labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>',
                labelFileProcessing: 'Processando',
                labelFileProcessingComplete: 'Upload completo',
                labelTapToCancel: 'Clique para cancelar',
                labelTapToRetry: 'Clique para tentar novamente',
                labelTapToUndo: 'Clique para desfazer',
                labelFileProcessingError: 'Erro',
                labelFileProcessingAborted: 'Upload cancelado',
                labelFileProcessingLoadError: 'Erro ao carregar',
                labelFileProcessingNetworkError: 'Erro de rede',
                labelFileProcessingRevertError: 'Erro ao reverter',
                labelFileProcessingFetchError: 'Erro ao buscar',
                labelFileProcessingLoadProgress: 'Carregando...',
                labelFileProcessingAddProgress: 'Adicionando...',
                labelFileProcessingCompleteProgress: 'Completo',
                labelFileProcessingAbortProgress: 'Cancelando...',
                labelFileProcessingRevertProgress: 'Revertendo...',
                labelFileProcessingFetchProgress: 'Buscando...',
                labelFileProcessingRemoveProgress: 'Removendo...',
                labelFileProcessingRemoveError: 'Erro ao remover',
                labelFileProcessingRemoveComplete: 'Removido',
                labelFileProcessingRemoveAborted: 'Remoção cancelada',
                labelFileProcessingRemoveRevertError: 'Erro ao reverter remoção',
                labelFileProcessingRemoveRevertComplete: 'Remoção revertida',
                labelFileProcessingRemoveRevertAborted: 'Revertendo remoção cancelada',
                labelFileProcessingRemoveRevertProgress: 'Revertendo remoção...',
                labelFileProcessingRemoveRevertFetchError: 'Erro ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchProgress: 'Buscando para reverter remoção...',
                labelFileProcessingRemoveRevertFetchAborted: 'Buscando para reverter remoção cancelado',
                labelFileProcessingRemoveRevertFetchComplete: 'Buscando para reverter remoção completo',
                labelFileProcessingRemoveRevertFetchNetworkError: 'Erro de rede ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchServerError: 'Erro do servidor ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchClientError: 'Erro do cliente ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchTimeoutError: 'Timeout ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchAbortError: 'Abortado ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchCorsError: 'Erro CORS ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchNotSupportedError: 'Não suportado ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchNotAllowedError: 'Não permitido ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchNotFoundError: 'Não encontrado ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchMethodNotAllowedError: 'Método não permitido ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchConflictError: 'Conflito ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchUnsupportedMediaTypeError: 'Tipo de mídia não suportado ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchInternalServerError: 'Erro interno do servidor ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchServiceUnavailableError: 'Serviço indisponível ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchBadGatewayError: 'Gateway ruim ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchGatewayTimeoutError: 'Timeout do gateway ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchInsufficientStorageError: 'Armazenamento insuficiente ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchLoopDetectedError: 'Loop detectado ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchNotExtendedError: 'Não estendido ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchNetworkAuthenticationRequiredError: 'Autenticação de rede necessária ao buscar para reverter remoção',
                labelFileProcessingRemoveRevertFetchUnknownError: 'Erro desconhecido ao buscar para reverter remoção'
            });

            fileAttachments.on('addfile', (error, file) => {
                if (error) {
                    console.error('Erro ao adicionar arquivo:', error);
                }
            });
        }
    }
}); 