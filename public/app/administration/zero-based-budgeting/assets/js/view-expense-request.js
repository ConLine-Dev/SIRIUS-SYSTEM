// Script para a página de visualização de solicitações de gastos
document.addEventListener("DOMContentLoaded", async () => {
    // Esconder o loader quando a página estiver carregada
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('d-none');
    }
    
    // Obter o ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');
    
    if (!requestId) {
        showAlert('Erro', 'ID da solicitação não fornecido!', 'error');
        return;
    }
    
    // Carregar os dados da solicitação
    await loadExpenseRequestData(requestId);
    
    // Configurar os botões de ação
    setupActionButtons(requestId);
});

// Função para definir o conteúdo de um elemento de forma segura
function setElementContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = content;
        return true;
    }
    console.warn(`Elemento com ID '${elementId}' não encontrado`);
    return false;
}

// Função para definir o atributo src de uma imagem de forma segura
function setImageSrc(elementId, src) {
    const element = document.getElementById(elementId);
    if (element) {
        element.src = src;
        return true;
    }
    console.warn(`Elemento de imagem com ID '${elementId}' não encontrado`);
    return false;
}

// Função para definir o innerHTML de um elemento de forma segura
function setElementHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = html;
        return true;
    }
    console.warn(`Elemento com ID '${elementId}' não encontrado`);
    return false;
}

// Função para carregar os dados da solicitação
async function loadExpenseRequestData(id) {
    try {
        if (!id) {
            console.error('ID da solicitação não fornecido para carregamento');
            showAlert('Erro', 'ID da solicitação não fornecido', 'error');
            return;
        }
        
        console.log('Carregando dados da solicitação:', id);
        
        const userLogged = await getInfosLogin();
        if (!userLogged || !userLogged.system_collaborator_id) {
            console.error('Informações do usuário não disponíveis');
            showAlert('Erro', 'Não foi possível obter informações do usuário logado', 'error');
            return;
        }
        
        // Fazer a requisição para obter os dados da solicitação
        const response = await fetch(`/api/zero-based-budgeting/getExpenseRequestView`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: parseInt(id) })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showAlert('Erro', result.message || 'Falha ao carregar os dados da solicitação', 'error');
            return;
        }
        
        // Dados da solicitação
        const data = result.data;
        
        // Preencher os campos da interface com os dados
        setElementContent('request-id', data.id);
        setElementContent('expense-id', data.id);
        setElementContent('expense-month', data.month);
        setElementContent('expense-year', data.year);
        setElementContent('expense-cost-center', data.costCenterName);
        setElementContent('expense-category', data.category);
        setElementContent('expense-description', data.description);
        setElementContent('expense-quantity', data.quantity);
        setElementContent('expense-amount', data.amount);
        setElementContent('expense-total-amount', data.total_amount);
        setElementContent('expense-strategic', data.strategic_contribution || 'Não informado');
        
        // Exibir informações do solicitante
        setElementContent('requester-name', data.requesterName);
        setImageSrc('requester-avatar', data.requesterAvatar);
        setElementContent('expense-created', data.created_at);
        
        // Renderizar os itens da solicitação
        const itemsContainer = document.getElementById('expense-items');
        if (itemsContainer && data.items && Array.isArray(data.items)) {
            let itemsHTML = '';
            data.items.forEach(item => {
                itemsHTML += `
                    <tr>
                        <td>${item.categoryName}</td>
                        <td>${item.description}</td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-end">${item.amount}</td>
                        <td class="text-end">${item.subtotal}</td>
                    </tr>
                `;
            });
            itemsContainer.innerHTML = itemsHTML;
        }
        
        // Exibir o valor total
        setElementContent('expense-total-amount', data.total_amount);
        
        // Exibir o status
        let statusClass, statusText;
        
        // Verificar se o status é um número ou string
        if (typeof data.status === 'number' || !isNaN(parseInt(data.status))) {
            const statusCode = parseInt(data.status);
            switch(statusCode) {
                case 2:
                    statusText = 'Aprovado';
                    statusClass = 'badge-approved';
                    break;
                case 3:
                    statusText = 'Rejeitado';
                    statusClass = 'badge-rejected';
                    break;
                case 4:
                    statusText = 'Aprovação Parcial';
                    statusClass = 'badge-partial';
                    break;
                default: // 1 ou outro - Pendente
                    statusText = 'Pendente';
                    statusClass = 'badge-pending';
            }
        } else {
            // Manter a lógica antiga baseada em string
            statusText = data.status;
            switch(data.status) {
                case 'Aprovado':
                    statusClass = 'badge-approved';
                    break;
                case 'Rejeitado':
                    statusClass = 'badge-rejected';
                    break;
                case 'Aprovação Parcial':
                    statusClass = 'badge-partial';
                    break;
                default: // Pendente
                    statusClass = 'badge-pending';
            }
        }
        
        setElementHTML('expense-status', `<span class="badge ${statusClass}">${statusText}</span>`);
        
        // Renderizar a timeline de aprovações
        renderApprovalsTimeline(data.approvals);
        
        // Verificar se o usuário atual é um aprovador pendente
        const userIsApprover = checkApproverActions(data.approvals, userLogged.system_collaborator_id, statusText);
        
        // Esconder a seção de ações se o usuário não for um aprovador pendente
        const actionsContainer = document.getElementById('approval-actions-container');
        if (actionsContainer) {
            actionsContainer.style.display = userIsApprover ? 'block' : 'none';
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar os dados da solicitação', 'error');
    }
}

// Função para renderizar a timeline de aprovações
function renderApprovalsTimeline(approvals) {
    const timelineContainer = document.getElementById('approval-timeline');
    if (!timelineContainer) {
        console.warn("Container da timeline não encontrado");
        return;
    }
    
    if (!approvals || approvals.length === 0) {
        timelineContainer.innerHTML = '<div class="text-center text-muted">Nenhuma informação de aprovação disponível</div>';
        return;
    }
    
    let timelineHTML = '';
    
    approvals.forEach(approval => {
        let statusBadgeClass, statusText;
        
        switch(approval.status) {
            case 'Aprovado':
                statusBadgeClass = 'bg-success-transparent';
                statusText = 'Aprovado';
                break;
            case 'Rejeitado':
                statusBadgeClass = 'bg-danger-transparent';
                statusText = 'Rejeitado';
                break;
            default: // Pendente
                statusBadgeClass = 'bg-warning-transparent';
                statusText = 'Pendente';
        }
        
        // Extrair data e hora da string de data
        const approvalDate = new Date(approval.created_at.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
        const formattedDate = approvalDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        timelineHTML += `
            <li>
                <div class="timeline-time text-end">
                    <span class="date">${formattedDate}</span>
                    <span class="time d-inline-block">${approvalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="timeline-icon">
                    <a href="javascript:void(0);"></a>
                </div>
                <div class="timeline-body">
                    <div class="d-flex align-items-top timeline-main-content flex-wrap mt-0">
                        <div class="avatar avatar-md ${approval.status === 'Pendente' ? 'offline' : 'online'} me-3 avatar-rounded mt-sm-0 mt-4">
                            <img src="${approval.approverAvatar}" alt="${approval.approverName}" onerror="this.onerror=null; this.src='../../assets/images/brand-logos/favicon.ico';" class="avatar-img">
                        </div>
                        <div class="flex-fill">
                            <div class="d-flex align-items-center">
                                <div class="mt-sm-0 mt-2">
                                    <p class="mb-0 fs-14 fw-semibold">${approval.approverName}</p>
                                    <p class="mb-0 text-muted">
                                        Status: <span class="badge ${statusBadgeClass} fw-semibold mx-1">${statusText}</span>
                                        ${approval.comment ? `<br>Comentário: ${approval.comment}` : ''}
                                    </p>
                                </div>
                                <div class="ms-auto">
                                    <span class="float-end badge bg-light text-muted timeline-badge">
                                        ${approval.created_at}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        `;
    });
    
    timelineContainer.innerHTML = timelineHTML;
}

// Verifica se o usuário atual é um aprovador e mostra botões de ação
function checkApproverActions(approvals, currentUserId, requestStatus) {
    const actionsContainer = document.getElementById('approval-actions');
    const changeContainer = document.getElementById('change-approval-actions');
    
    if (!actionsContainer || !changeContainer) {
        console.warn("Container de ações não encontrado");
        return false;
    }
    
    // Limpar os contêineres
    actionsContainer.innerHTML = '';
    changeContainer.innerHTML = '';
    
    // Verificar se o usuário atual é um aprovador pendente
    const pendingApproval = approvals.find(a => 
        a.approver_id == currentUserId && a.status === 'Pendente'
    );
    
    // Verificar se o usuário já processou esta solicitação
    const processedApproval = approvals.find(a =>
        a.approver_id == currentUserId && (a.status === 'Aprovado' || a.status === 'Rejeitado')
    );
    
    // Se não for um aprovador pendente nem já tiver processado, retornar false
    if (!pendingApproval && !processedApproval) {
        return false;
    }
    
    let userCanAct = false;
    
    // Obter o ID da solicitação
    const requestId = document.getElementById('request-id').textContent;
    if (!requestId || requestId === 'Carregando...') {
        console.error('ID da solicitação não encontrado ou ainda não carregado');
        return false;
    }
    
    console.log('ID da solicitação:', requestId);
    console.log('ID do aprovador:', currentUserId);
    
    // Se tiver aprovação pendente e a solicitação não estiver finalizada, mostrar botões padrão
    if (pendingApproval && (requestStatus === 'Pendente' || requestStatus === 'Aprovação Parcial')) {
        // Mostrar botões de ação para aprovação pendente
        actionsContainer.innerHTML = `
            <button class="btn btn-success approve-request-btn" id="approve-btn">
                <i class="ri-check-line me-1"></i> Aprovar
            </button>
            <button class="btn btn-danger reject-request-btn" id="reject-btn">
                <i class="ri-close-line me-1"></i> Rejeitar
            </button>
        `;
        
        // Adicionar listeners para os botões
        document.getElementById('approve-btn').addEventListener('click', function() {
            processRequest(requestId, currentUserId, 'Aprovado');
        });
        
        document.getElementById('reject-btn').addEventListener('click', function() {
            showRejectDialog(requestId, currentUserId);
        });
        
        userCanAct = true;
    }
    
    // Se já tiver processado, mostrar opção para mudar decisão
    if (processedApproval) {
        const statusActual = processedApproval.status;
        const newStatus = statusActual === 'Aprovado' ? 'Rejeitado' : 'Aprovado';
        const buttonClass = newStatus === 'Aprovado' ? 'btn-success' : 'btn-danger';
        const iconClass = newStatus === 'Aprovado' ? 'ri-check-line' : 'ri-close-line';
        
        changeContainer.innerHTML = `
            <h6 class="mb-2">Alterar sua decisão anterior</h6>
            <div class="alert alert-info">
                <p class="mb-2">
                    <i class="ri-information-line me-1"></i> 
                    Você já ${statusActual === 'Aprovado' ? 'aprovou' : 'rejeitou'} esta solicitação. Caso deseje alterar sua decisão, utilize o botão abaixo.
                </p>
            </div>
            <button class="btn ${buttonClass} change-approval-btn" id="change-btn">
                <i class="${iconClass} me-1"></i> Alterar para ${newStatus}
            </button>
        `;
        
        // Adicionar listener para o botão de alteração
        document.getElementById('change-btn').addEventListener('click', function() {
            showChangeDialog(requestId, currentUserId, newStatus, statusActual);
        });
        
        userCanAct = true;
    }
    
    return userCanAct;
}

// Função para mostrar diálogo de alteração de status com comentário
function showChangeDialog(requestId, approverId, newStatus, currentStatus) {
    const title = `Alterar para ${newStatus}`;
    const text = `Por favor, informe o motivo da alteração de "${currentStatus}" para "${newStatus}":`;
    
    Swal.fire({
        title: title,
        text: text,
        input: 'textarea',
        inputPlaceholder: 'Digite o motivo aqui...',
        inputAttributes: {
            'aria-label': 'Motivo da alteração'
        },
        showCancelButton: true,
        confirmButtonText: 'Confirmar Alteração',
        cancelButtonText: 'Cancelar',
        showLoaderOnConfirm: true,
        preConfirm: (comment) => {
            if (!comment || comment.trim() === '') {
                Swal.showValidationMessage('O motivo da alteração é obrigatório');
                return false;
            }
            return comment;
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            console.log('Processando alteração de status:', {
                requestId, 
                approverId, 
                newStatus,
                currentStatus,
                comment: result.value
            });
            
            changeApprovalStatus(requestId, approverId, newStatus, result.value);
        }
    });
}

// Função para mudar o status de uma aprovação
async function changeApprovalStatus(requestId, approverId, newStatus, comment = '') {
    try {
        // Mostrar mensagem de confirmação
        const result = await Swal.fire({
            title: 'Alterar Decisão',
            text: `Você tem certeza que deseja alterar sua decisão para "${newStatus}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, alterar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!result.isConfirmed) return;
        
        console.log('Enviando alteração de status:', {
            expense_request_id: requestId,
            approver_id: approverId,
            status: newStatus,
            comment: comment,
            is_change: true
        });
        
        // Executar a alteração
        const response = await fetch('/api/zero-based-budgeting/processExpenseRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                expense_request_id: parseInt(requestId),
                approver_id: parseInt(approverId),
                status: newStatus,
                comment: comment,
                is_change: true
            })
        });
        
        const apiResult = await response.json();
        
        if (apiResult.success) {
            showAlert('Sucesso', `Sua decisão foi alterada para ${newStatus} com sucesso!`, 'success');
            
            // Recarregar os dados para mostrar as alterações
            setTimeout(() => {
                loadExpenseRequestData(requestId);
            }, 1000);
        } else {
            showAlert('Erro', apiResult.message || `Falha ao alterar para ${newStatus}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        showAlert('Erro', `Ocorreu um erro ao alterar o status`, 'error');
    }
}

// Mostrar diálogo para rejeição com comentário (manter para compatibilidade)
function showRejectDialog(requestId, approverId, isChange = false) {
    if (isChange) {
        showChangeDialog(requestId, approverId, 'Rejeitado', 'Aprovado');
    } else {
        Swal.fire({
            title: 'Rejeitar Solicitação',
            text: 'Por favor, informe o motivo da rejeição:',
            input: 'textarea',
            inputPlaceholder: 'Digite o motivo aqui...',
            inputAttributes: {
                'aria-label': 'Motivo da rejeição'
            },
            showCancelButton: true,
            confirmButtonText: 'Rejeitar',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: (comment) => {
                if (!comment || comment.trim() === '') {
                    Swal.showValidationMessage('O motivo da rejeição é obrigatório');
                    return false;
                }
                return comment;
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                console.log('Processando rejeição:', {
                    requestId, 
                    approverId, 
                    comment: result.value
                });
                
                processRequest(requestId, approverId, 'Rejeitado', result.value);
            }
        });
    }
}

// Exibir alerta com SweetAlert2
function showAlert(title, message, icon) {
    Swal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonText: 'OK'
    });
}

// Obter as informações do usuário logado do localStorage
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
}

// Configurar os botões de ação
function setupActionButtons(requestId) {
    // Botão para voltar
    const backButton = document.getElementById('back-btn');
    if (backButton) {
        backButton.addEventListener('click', function() {
            // Verificar se existe uma página anterior no histórico de navegação
            if (window.history.length > 1 && document.referrer.includes(window.location.hostname)) {
                window.history.back();
            } else {
                window.close();
            }
        });
    }
    
    // Botão para imprimir
    const printButton = document.getElementById('print-btn');
    if (printButton) {
        printButton.addEventListener('click', function() {
            window.print();
        });
    }
}

// Função para processar aprovação/rejeição
async function processRequest(requestId, approverId, status, comment = '') {
    try {
        console.log('Processando solicitação:', {
            requestId,
            approverId,
            status,
            comment
        });
        
        const response = await fetch('/api/zero-based-budgeting/processExpenseRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                expense_request_id: parseInt(requestId),
                approver_id: parseInt(approverId),
                status: status,
                comment: comment
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Sucesso', `Solicitação ${status.toLowerCase()} com sucesso!`, 'success');
            
            // Recarregar os dados para mostrar as alterações
            setTimeout(() => {
                loadExpenseRequestData(requestId);
            }, 1000);
        } else {
            showAlert('Erro', result.message || `Falha ao ${status.toLowerCase()} a solicitação`, 'error');
        }
    } catch (error) {
        console.error('Erro ao processar solicitação:', error);
        showAlert('Erro', `Ocorreu um erro ao ${status.toLowerCase()} a solicitação`, 'error');
    }
} 