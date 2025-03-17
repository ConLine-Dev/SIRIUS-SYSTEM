// Definir variáveis globais
let currentButtonId = null;
let buttonsData = [];
let agentGuideData = null;
let sortableInstance = null;
let isReorderMode = false;

document.addEventListener('DOMContentLoaded', function() {
    // Socket.IO para atualizações em tempo real (se disponível)
    if (typeof io !== 'undefined') {
        const socket = io();
        
        socket.on('updateLinkTree', (data) => {
            loadLinkTreeData();
        });
    }
    
    initLinkTree();
});

// Função principal de inicialização
function initLinkTree() {
    // Elementos do DOM
    const linkForm = document.getElementById('link-form');
    const buttonsList = document.getElementById('buttons-list');
    const preview = document.getElementById('preview');
    const formTitle = document.getElementById('form-title');
    const buttonIdInput = document.getElementById('button-id');
    const titleInput = document.getElementById('title');
    const urlInput = document.getElementById('url');
    const downloadUrlInput = document.getElementById('downloadUrl');
    const activeInput = document.getElementById('active');
    const cancelEditButton = document.getElementById('cancel-edit');
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-modal'));
    const confirmDeleteButton = document.getElementById('confirm-delete');
    const guideForm = document.getElementById('guide-form');
    const guideFileInput = document.getElementById('guide-file');
    const currentGuideElement = document.getElementById('current-guide');
    const deleteGuideModal = new bootstrap.Modal(document.getElementById('delete-guide-modal'));
    const confirmDeleteGuideButton = document.getElementById('confirm-delete-guide');
    const startReorderButton = document.getElementById('start-reorder');
    const saveOrderButton = document.getElementById('save-order');
    const cancelReorderButton = document.getElementById('cancel-reorder');
    const addAnotherContainer = document.getElementById('add-another-container');
    const addAnotherButton = document.getElementById('add-another');
    
    // Funções utilitárias
    function showLoader() {
        document.querySelector('#loader2').classList.remove('d-none');
    }
    
    function hideLoader() {
        document.querySelector('#loader2').classList.add('d-none');
    }
    
    // Função para carregar os dados do link-tree
    async function loadLinkTreeData() {
        try {
            const response = await fetch('/api/link-tree/data');
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do link-tree');
            }
            
            const data = await response.json();
            buttonsData = data.buttons || [];
            agentGuideData = data.agentGuide;
            
            renderButtonsList();
            renderPreview();
            renderCurrentGuide();
            
            // Esconder o loader após carregar os dados
            hideLoader();
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao carregar dados do link-tree', 'danger');
            
            // Esconder o loader mesmo em caso de erro
            hideLoader();
        }
    }
    
    // Função para renderizar a lista de botões
    function renderButtonsList() {
        buttonsList.innerHTML = '';
        
        if (buttonsData.length === 0) {
            buttonsList.innerHTML = '<p class="text-center py-3">Nenhum link cadastrado.</p>';
            startReorderButton.classList.add('d-none');
            return;
        } else {
            startReorderButton.classList.remove('d-none');
        }
        
        buttonsData.forEach(button => {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item';
            listItem.dataset.id = button.id;
            
            const buttonInfo = document.createElement('div');
            buttonInfo.className = 'button-info';
            
            const titleElement = document.createElement('div');
            titleElement.className = 'button-title';
            titleElement.innerHTML = `
                <i class="bi bi-grip-vertical reorder-handle"></i>
                <span class="button-status ${button.active ? 'status-active' : 'status-inactive'}"></span>${button.title}
            `;
            
            const urlContainer = document.createElement('div');
            urlContainer.className = 'url-container';
            
            const urlElement = document.createElement('div');
            urlElement.className = 'button-url';
            urlElement.textContent = button.url;
            
            const copyUrlBtn = document.createElement('button');
            copyUrlBtn.className = 'copy-btn';
            copyUrlBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
            copyUrlBtn.title = 'Copiar URL';
            copyUrlBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(button.url);
            });
            
            urlContainer.appendChild(urlElement);
            urlContainer.appendChild(copyUrlBtn);
            
            buttonInfo.appendChild(titleElement);
            buttonInfo.appendChild(urlContainer);
            
            // Adicionar URL de download se existir
            if (button.downloadUrl) {
                const downloadUrlContainer = document.createElement('div');
                downloadUrlContainer.className = 'url-container';
                
                const downloadUrlElement = document.createElement('div');
                downloadUrlElement.className = 'button-download-url';
                downloadUrlElement.innerHTML = `<i class="bi bi-download"></i> ${button.downloadUrl}`;
                
                const copyDownloadUrlBtn = document.createElement('button');
                copyDownloadUrlBtn.className = 'copy-btn';
                copyDownloadUrlBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
                copyDownloadUrlBtn.title = 'Copiar URL de download';
                copyDownloadUrlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    copyToClipboard(button.downloadUrl);
                });
                
                downloadUrlContainer.appendChild(downloadUrlElement);
                downloadUrlContainer.appendChild(copyDownloadUrlBtn);
                
                buttonInfo.appendChild(downloadUrlContainer);
            }
            
            const buttonActions = document.createElement('div');
            buttonActions.className = 'button-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary';
            editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
            editBtn.addEventListener('click', () => editButton(button));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
            deleteBtn.addEventListener('click', () => showDeleteModal(button.id));
            
            buttonActions.appendChild(editBtn);
            buttonActions.appendChild(deleteBtn);
            
            listItem.appendChild(buttonInfo);
            listItem.appendChild(buttonActions);
            
            buttonsList.appendChild(listItem);
        });
    }
    
    // Função para renderizar a prévia do link-tree
    function renderPreview() {
        preview.innerHTML = '';
        
        if (buttonsData.length === 0) {
            preview.innerHTML = '<p class="text-center text-white py-3">Nenhum link para exibir.</p>';
            return;
        }
        
        buttonsData.forEach(button => {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'preview-button-container';
            
            const previewButton = document.createElement('a');
            previewButton.href = button.url;
            previewButton.className = `preview-button ${!button.active ? 'inactive' : ''}`;
            previewButton.textContent = button.title;
            previewButton.target = '_blank';
            
            buttonContainer.appendChild(previewButton);
            
            // Adicionar botão de download se houver URL de download
            if (button.downloadUrl) {
                const downloadButton = document.createElement('a');
                downloadButton.href = button.downloadUrl;
                downloadButton.className = 'download-button';
                downloadButton.innerHTML = '<i class="bi bi-download"></i>';
                downloadButton.title = 'Download';
                downloadButton.target = '_blank';
                buttonContainer.appendChild(downloadButton);
            }
            
            preview.appendChild(buttonContainer);
        });
        
        if (agentGuideData) {
            const guideButtonContainer = document.createElement('div');
            guideButtonContainer.className = 'preview-button-container';
            
            const guideButton = document.createElement('a');
            guideButton.href = '/api/link-tree/agent-guide/view';
            guideButton.className = 'preview-button';
            guideButton.textContent = 'Guia do Agente';
            guideButton.target = '_blank';
            
            guideButtonContainer.appendChild(guideButton);
            preview.appendChild(guideButtonContainer);
        }
    }
    
    // Função para renderizar o guia do agente atual
    function renderCurrentGuide() {
        if (!agentGuideData) {
            currentGuideElement.innerHTML = '<p>Nenhum guia do agente cadastrado.</p>';
            return;
        }
        
        const formattedSize = formatFileSize(agentGuideData.size);
        const uploadDate = new Date(agentGuideData.uploadedAt).toLocaleDateString('pt-BR');
        
        currentGuideElement.innerHTML = `
            <div class="guide-info">
                <div class="guide-icon">
                    <i class="bi bi-file-earmark-pdf"></i>
                </div>
                <div class="guide-details">
                    <div class="guide-filename">${agentGuideData.fileName}</div>
                    <div class="guide-meta">
                        <span>${formattedSize}</span> • 
                        <span>Enviado em ${uploadDate}</span>
                    </div>
                </div>
                <div class="guide-actions">
                    <a href="/api/link-tree/agent-guide/view" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i>
                    </a>
                    <button type="button" class="btn btn-sm btn-outline-danger" id="delete-guide-btn">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('delete-guide-btn').addEventListener('click', showDeleteGuideModal);
    }
    
    // Função para formatar o tamanho do arquivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Função para editar um botão
    function editButton(button) {
        currentButtonId = button.id;
        buttonIdInput.value = button.id;
        titleInput.value = button.title;
        urlInput.value = button.url;
        downloadUrlInput.value = button.downloadUrl || '';
        activeInput.checked = button.active;
        
        formTitle.textContent = 'Editar Link';
        cancelEditButton.classList.remove('d-none');
        addAnotherContainer.classList.add('d-none');
        
        // Scroll para o formulário
        linkForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Função para cancelar a edição
    function cancelEdit() {
        currentButtonId = null;
        buttonIdInput.value = '';
        linkForm.reset();
        
        formTitle.textContent = 'Adicionar Novo Link';
        cancelEditButton.classList.add('d-none');
        addAnotherContainer.classList.add('d-none');
    }
    
    // Função para mostrar o modal de exclusão
    function showDeleteModal(buttonId) {
        currentButtonId = buttonId;
        deleteModal.show();
    }
    
    // Função para mostrar o modal de exclusão do guia
    function showDeleteGuideModal() {
        deleteGuideModal.show();
    }
    
    // Função para mostrar alertas usando o sistema de toast do sistema
    function showAlert(message, type = 'success') {
        // Se o sistema tiver uma função de notificação do SIRIUS, usá-la
        if (typeof notifyApp === 'function') {
            notifyApp({
                title: getToastTitle(type),
                description: message,
                type: type
            });
            return;
        }
        
        // Fallback para toast personalizado
        const toastId = 'toast-' + Date.now();
        const icon = getToastIcon(type);
        
        const toastHTML = `
            <div class="toast-container position-fixed top-0 end-0 p-3">
                <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-${type} text-white">
                        <i class="${icon} me-2"></i>
                        <strong class="me-auto">${getToastTitle(type)}</strong>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
                    </div>
                    <div class="toast-body">
                        ${message}
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar o toast ao DOM
        const toastContainer = document.createElement('div');
        toastContainer.innerHTML = toastHTML;
        document.body.appendChild(toastContainer.firstElementChild);
        
        // Inicializar e mostrar o toast
        const toastElement = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        bsToast.show();
        
        // Remover o toast do DOM após fechado
        toastElement.addEventListener('hidden.bs.toast', function() {
            const container = this.closest('.toast-container');
            if (container) {
                container.remove();
            }
        });
    }
    
    // Funções auxiliares para o toast
    function getToastIcon(type) {
        switch (type) {
            case 'success': return 'bi bi-check-circle-fill';
            case 'danger': return 'bi bi-exclamation-circle-fill';
            case 'warning': return 'bi bi-exclamation-triangle-fill';
            case 'info': return 'bi bi-info-circle-fill';
            default: return 'bi bi-bell-fill';
        }
    }
    
    function getToastTitle(type) {
        switch (type) {
            case 'success': return 'Sucesso';
            case 'danger': return 'Erro';
            case 'warning': return 'Atenção';
            case 'info': return 'Informação';
            default: return 'Notificação';
        }
    }
    
    // Função para prevenir seleção de texto durante arrasto
    function preventTextSelection(e) {
        if (isReorderMode) {
            e.preventDefault();
            return false;
        }
    }
    
    // Função para iniciar o modo de reordenação
    function startReorderMode() {
        if (buttonsData.length <= 1) {
            showAlert('É necessário ter pelo menos dois links para reordenar', 'warning');
            return;
        }
        
        isReorderMode = true;
        buttonsList.classList.add('reorder-mode');
        document.body.classList.add('no-select');
        startReorderButton.classList.add('d-none');
        saveOrderButton.classList.remove('d-none');
        cancelReorderButton.classList.remove('d-none');
        
        // Adicionar eventos para prevenir seleção de texto
        document.addEventListener('selectstart', preventTextSelection);
        document.addEventListener('dragstart', preventTextSelection);
        
        // Inicializar o Sortable
        sortableInstance = new Sortable(buttonsList, {
            animation: 150,
            handle: '.reorder-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            forceFallback: true,
            fallbackTolerance: 5,
            onStart: function() {
                // Adiciona classe para prevenir seleção de texto durante arrasto
                document.body.classList.add('dragging');
            },
            onEnd: function() {
                // Remove classe após o arrasto
                document.body.classList.remove('dragging');
            }
        });
    }
    
    // Função para salvar a nova ordem
    async function saveOrder() {
        try {
            // Mostrar loader
            showLoader();
            
            // Obter a nova ordem dos IDs
            const newOrder = Array.from(buttonsList.children)
                .filter(item => item.dataset.id) // Filtrar apenas elementos com ID
                .map(item => item.dataset.id);
            
            // Enviar para o servidor
            const response = await fetch('/api/link-tree/buttons/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ buttonIds: newOrder })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao salvar a nova ordem');
            }
            
            // Atualizar os dados locais
            const updatedButtons = await response.json();
            buttonsData = updatedButtons;
            
            // Sair do modo de reordenação
            exitReorderMode();
            
            // Atualizar a UI
            renderButtonsList();
            renderPreview();
            
            showAlert('Ordem dos links atualizada com sucesso!');
            
            // Esconder loader
            hideLoader();
            
            // Se tiver socket.io disponível, emitir evento de atualização
            if (typeof io !== 'undefined' && io.emit) {
                io.emit('updateLinkTree', {});
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao salvar a nova ordem', 'danger');
            
            // Esconder loader mesmo em caso de erro
            hideLoader();
        }
    }
    
    // Função para sair do modo de reordenação
    function exitReorderMode() {
        isReorderMode = false;
        buttonsList.classList.remove('reorder-mode');
        document.body.classList.remove('no-select');
        document.body.classList.remove('dragging');
        startReorderButton.classList.remove('d-none');
        saveOrderButton.classList.add('d-none');
        cancelReorderButton.classList.add('d-none');
        
        // Remover eventos para prevenir seleção de texto
        document.removeEventListener('selectstart', preventTextSelection);
        document.removeEventListener('dragstart', preventTextSelection);
        
        // Destruir a instância do Sortable
        if (sortableInstance) {
            sortableInstance.destroy();
            sortableInstance = null;
        }
        
        // Renderizar a lista novamente para restaurar a ordem original se cancelado
        renderButtonsList();
    }
    
    // Função para copiar texto para a área de transferência
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showAlert('URL copiado para a área de transferência!', 'success');
            })
            .catch((err) => {
                console.error('Erro ao copiar texto:', err);
                showAlert('Erro ao copiar URL', 'danger');
            });
    }
    
    // Event Listeners
    
    // Formulário de link
    linkForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Mostrar loader
        showLoader();
        
        const buttonData = {
            title: titleInput.value,
            url: urlInput.value,
            downloadUrl: downloadUrlInput.value || null,
            active: activeInput.checked
        };
        
        try {
            let response;
            
            if (currentButtonId) {
                // Atualizar botão existente
                response = await fetch(`/api/link-tree/button/${currentButtonId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(buttonData)
                });
            } else {
                // Adicionar novo botão
                response = await fetch('/api/link-tree/button', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(buttonData)
                });
                
                // Mostrar botão para adicionar outro link
                addAnotherContainer.classList.remove('d-none');
            }
            
            if (!response.ok) {
                throw new Error('Erro ao salvar link');
            }
            
            const result = await response.json();
            
            if (currentButtonId) {
                // Atualizar na lista local
                const index = buttonsData.findIndex(button => button.id === currentButtonId);
                if (index !== -1) {
                    buttonsData[index] = result;
                }
                
                showAlert('Link atualizado com sucesso!');
                
                // Resetar formulário e atualizar UI
                cancelEdit();
            } else {
                // Adicionar à lista local
                buttonsData.push(result);
                
                showAlert('Link adicionado com sucesso!');
                
                // Limpar formulário mas manter visível para adicionar mais links
                titleInput.value = '';
                urlInput.value = '';
                downloadUrlInput.value = '';
                // Manter o status ativo marcado
            }
            
            renderButtonsList();
            renderPreview();
            
            // Esconder loader
            hideLoader();
            
            // Se tiver socket.io disponível, emitir evento de atualização
            if (typeof io !== 'undefined' && io.emit) {
                io.emit('updateLinkTree', {});
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao salvar link', 'danger');
            
            // Esconder loader mesmo em caso de erro
            hideLoader();
        }
    });
    
    // Botão de cancelar edição
    cancelEditButton.addEventListener('click', cancelEdit);
    
    // Botão de confirmar exclusão
    confirmDeleteButton.addEventListener('click', async function() {
        if (!currentButtonId) return;
        
        // Mostrar loader
        showLoader();
        
        try {
            const response = await fetch(`/api/link-tree/button/${currentButtonId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao excluir link');
            }
            
            // Remover da lista local
            buttonsData = buttonsData.filter(button => button.id !== currentButtonId);
            
            // Fechar modal e atualizar UI
            deleteModal.hide();
            renderButtonsList();
            renderPreview();
            
            showAlert('Link excluído com sucesso!');
            
            // Esconder loader
            hideLoader();
            
            // Se tiver socket.io disponível, emitir evento de atualização
            if (typeof io !== 'undefined' && io.emit) {
                io.emit('updateLinkTree', {});
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao excluir link', 'danger');
            
            // Esconder loader mesmo em caso de erro
            hideLoader();
        }
    });
    
    // Formulário de upload do guia
    guideForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!guideFileInput.files || guideFileInput.files.length === 0) {
            showAlert('Selecione um arquivo PDF', 'warning');
            return;
        }
        
        // Mostrar loader
        showLoader();
        
        const formData = new FormData();
        formData.append('file', guideFileInput.files[0]);
        
        try {
            const response = await fetch('/api/link-tree/agent-guide', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Erro ao fazer upload do guia do agente');
            }
            
            const result = await response.json();
            agentGuideData = result;
            
            // Resetar formulário e atualizar UI
            guideForm.reset();
            renderCurrentGuide();
            renderPreview();
            
            showAlert('Guia do agente enviado com sucesso!');
            
            // Esconder loader
            hideLoader();
            
            // Se tiver socket.io disponível, emitir evento de atualização
            if (typeof io !== 'undefined' && io.emit) {
                io.emit('updateLinkTree', {});
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao fazer upload do guia do agente', 'danger');
            
            // Esconder loader mesmo em caso de erro
            hideLoader();
        }
    });
    
    // Botão de confirmar exclusão do guia
    confirmDeleteGuideButton.addEventListener('click', async function() {
        // Mostrar loader
        showLoader();
        
        try {
            const response = await fetch('/api/link-tree/agent-guide', {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao excluir guia do agente');
            }
            
            // Atualizar dados e UI
            agentGuideData = null;
            deleteGuideModal.hide();
            renderCurrentGuide();
            renderPreview();
            
            showAlert('Guia do agente excluído com sucesso!');
            
            // Esconder loader
            hideLoader();
            
            // Se tiver socket.io disponível, emitir evento de atualização
            if (typeof io !== 'undefined' && io.emit) {
                io.emit('updateLinkTree', {});
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao excluir guia do agente', 'danger');
            
            // Esconder loader mesmo em caso de erro
            hideLoader();
        }
    });
    
    // Botão para iniciar reordenação
    startReorderButton.addEventListener('click', startReorderMode);
    
    // Botão para salvar a nova ordem
    saveOrderButton.addEventListener('click', saveOrder);
    
    // Botão para cancelar a reordenação
    cancelReorderButton.addEventListener('click', exitReorderMode);
    
    // Botão para adicionar outro link
    addAnotherButton.addEventListener('click', function() {
        // Esconder o botão e focar no campo de título
        addAnotherContainer.classList.add('d-none');
        titleInput.focus();
    });
    
    // Carregar dados iniciais
    loadLinkTreeData();
    
    // Notificar usuário sobre o link fixo do guia e a nova API
    if (typeof notifyApp === 'function') {
        setTimeout(() => {
            notifyApp({
                title: 'Novidades',
                description: 'O Link Tree foi atualizado! Agora possui URL fixa para o Guia do Agente e uma API pública para integração.',
                type: 'info'
            });
        }, 1500); // Atraso para exibir após o carregamento inicial
    }
} 