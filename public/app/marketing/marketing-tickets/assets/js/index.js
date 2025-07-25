// index.js - Administração de Chamados de Marketing

console.log('index.js carregado');

$(document).ready(function() {
    console.log('Document ready iniciado');
    
    // Inicializar Socket.IO
    const socket = io();
    console.log('Socket.IO inicializado:', socket);
    
    // Event listeners do Socket.IO
    socket.on('ticketCreated', (data) => {
        console.log('Novo chamado criado:', data);
        loadTickets(); // Recarregar lista
    });
    
    socket.on('ticketUpdated', (data) => {
        console.log('Chamado atualizado:', data);
        
        // Se for atualização de status, mostrar notificação
        if (data.type === 'status_update') {
            showNotification(`Status do chamado #${data.ticket_id} atualizado para: ${data.status}`, 'info');
        }
        
        loadTickets(); // Recarregar lista
    });
    
    socket.on('ticketDeleted', (data) => {
        console.log('Chamado excluído:', data);
        loadTickets(); // Recarregar lista
    });
    
    socket.on('newComment', (data) => {
        console.log('Novo comentário:', data);
        // Se estiver na página de visualização do chamado específico, recarregar comentários
        const currentTicketId = new URLSearchParams(window.location.search).get('id');
        if (currentTicketId && currentTicketId == data.ticket_id) {
            // Recarregar comentários se estiver na página de visualização
            if (typeof loadComments === 'function') {
                loadComments();
            }
        }
    });
    
    console.log('Iniciando configuração da página');
    
    // Inicializar filtros
    console.log('Inicializando filtros...');
    initializeFilters();

    // Buscar chamados ao digitar ou mudar filtros
    $('#filter-keyword, #filter-type, #filter-status, #filter-responsible, #filter-requester').on('change keyup', function() {
        console.log('Filtro alterado, recarregando tickets...');
        loadTickets();
    });

    $('#btn-clear-filters').on('click', function() {
        console.log('Limpando filtros...');
        $('#filter-keyword').val('');
        $('#filter-type').val('');
        $('#filter-status').val('');
        $('#filter-responsible').val('');
        $('#filter-requester').val('');
        loadTickets();
    });

    // Carregar chamados ao iniciar
    console.log('Carregando tickets iniciais...');
    loadTickets();

    // Função para inicializar filtros
    async function initializeFilters() {
        console.log('initializeFilters iniciado');
        try {
            // Carregar tipos de chamado
            console.log('Carregando tipos de chamado...');
            const types = await makeRequest('/api/marketing/tickets/types');
            const typeSelect = $('#filter-type');
            typeSelect.append('<option value="">Todos os tipos</option>');
            types.forEach(type => {
                typeSelect.append(`<option value="${type}">${type}</option>`);
            });

            // Carregar status
            const statuses = await makeRequest('/api/marketing/tickets/statuses');
            const statusSelect = $('#filter-status');
            statusSelect.append('<option value="">Todos os status</option>');
            statuses.forEach(status => {
                statusSelect.append(`<option value="${status}">${status}</option>`);
            });

            // Carregar responsáveis
            const responsibles = await makeRequest('/api/marketing/tickets/users');
            const responsibleSelect = $('#filter-responsible');
            responsibleSelect.append('<option value="">Todos os responsáveis</option>');
            responsibles.forEach(user => {
                responsibleSelect.append(`<option value="${user.id}">${user.full_name}</option>`);
            });

            // Carregar solicitantes
            const requesters = await makeRequest('/api/marketing/tickets/users');
            const requesterSelect = $('#filter-requester');
            requesterSelect.append('<option value="">Todos os solicitantes</option>');
            requesters.forEach(user => {
                requesterSelect.append(`<option value="${user.id}">${user.full_name}</option>`);
            });

        } catch (err) {
            console.error('Erro ao carregar filtros:', err);
        }
    }

    // Função para carregar chamados
    async function loadTickets() {
        console.log('loadTickets iniciado');
        try {
            const params = {
                keyword: $('#filter-keyword').val(),
                type: $('#filter-type').val(),
                status: $('#filter-status').val(),
                responsible: $('#filter-responsible').val(),
                requester: $('#filter-requester').val()
            };
            console.log('Parâmetros de busca:', params);
            
            // Monta query string
            const query = Object.keys(params)
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k] || ''))
                .join('&');
            console.log('Query string:', query);
            
            console.log('Fazendo requisição para API...');
            const tickets = await makeRequest(`/api/marketing/tickets?${query}`);
            console.log('Tickets recebidos:', tickets);
            
            renderTicketsTable(tickets);
        } catch (err) {
            console.error('Erro ao carregar tickets:', err);
            $('#tickets-table-view').html('<div class="alert alert-danger">Erro ao carregar chamados.</div>');
        }
    }

    // Lista de status para as colunas do Kanban
    const KANBAN_STATUSES = [
        'Novo',
        'Em triagem',
        'Em andamento',
        'Aguardando validação',
        'Aguardando retorno do solicitante',
        'Finalizado'
    ];

    // Substituir a função renderKanbanBoard para:
    function renderKanbanBoard(tickets) {
        const board = $('#kanban-board');
        board.empty();
        // Contador por status
        const statusCounts = {};
        KANBAN_STATUSES.forEach(s => statusCounts[s] = 0);
        tickets.forEach(t => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });
        // Atualizar contador detalhado
        const total = tickets.length;
        let statusHtml = `<span class='text-muted'>Total: <b>${total}</b></span>`;
        KANBAN_STATUSES.forEach(s => {
            statusHtml += ` | <span>${s}: <b>${statusCounts[s]}</b></span>`;
        });
        $('#tickets-count-display').text(`${total} chamados encontrados`);
        // Remover/ignorar o bloco que atualiza #tickets-status-counts
        $('#tickets-status-counts').html('');
        // Criar colunas
        KANBAN_STATUSES.forEach(status => {
            const count = statusCounts[status] || 0;
            const badgeClass =
              status === 'Novo' ? 'bg-primary' :
              status === 'Em triagem' ? 'bg-info' :
              status === 'Em andamento' ? 'bg-warning' :
              status === 'Aguardando validação' ? 'bg-secondary' :
              status === 'Aguardando retorno do solicitante' ? 'bg-danger' :
              status === 'Finalizado' ? 'bg-success' : 'bg-secondary';
            const col = $(`
                <div class="kanban-col" data-status="${status}">
                    <div class="kanban-col-header bg-light p-2 mb-2 text-center fw-bold border rounded">
                        ${status} <span class="badge ${badgeClass} ms-1">${count}</span>
                    </div>
                    <div class="kanban-cards" id="kanban-col-${status.replace(/\s+/g, '-')}"></div>
                </div>
            `);
            board.append(col);
        });
        // Adicionar cards nas colunas
        tickets.forEach(ticket => {
            const hasAttachment = ticket.attachments && ticket.attachments.length > 0;
            const startDate = formatDate(ticket.created_at);
            const forecastStart = formatDate(ticket.start_date);
            const forecastEnd = formatDate(ticket.end_date);
            const avatarList = (ticket.involved_avatars || []).map(a => `<span class='avatar avatar-sm avatar-rounded' title='${a.name}'><img src='${a.url}' alt='img'></span>`).join('');
            const commentsCount = ticket.comments_count || 0;
            // Avatar do responsável
            const responsibleAvatar = ticket.responsible_id_headcargo ? `<span class="avatar avatar-sm avatar-rounded me-1" title="Responsável: ${ticket.responsible_name}"><img src="https://cdn.conlinebr.com.br/colaboradores/${ticket.responsible_id_headcargo}" alt="img"></span>` : '';
            // Avatar do solicitante
            const requesterAvatar = ticket.requester_id_headcargo ? `<span class="avatar avatar-sm avatar-rounded me-1" title="Solicitante: ${ticket.requester_name}"><img src="https://cdn.conlinebr.com.br/colaboradores/${ticket.requester_id_headcargo}" alt="img"></span>` : '';
            // Linha de responsáveis/solicitante (não será mais usada na parte superior)
            // const peopleLine = `<div class=\"d-flex align-items-center gap-2 mb-1\">${responsibleAvatar}${requesterAvatar}</div>`;
            const card = $(
                `<div class="card custom-card task-card task-card-${ticket.id}" id="${ticket.id}" data-id="${ticket.id}" data-start-date="${ticket.start_date || ''}" data-end-date="${ticket.end_date || ''}" data-responsible="${ticket.responsible_id || ''}">
                    <div class="card-body p-0">
                        <div class="p-3 kanban-board-head">
                            <div class="d-flex text-muted justify-content-between mb-1 fs-12 fw-semibold">
                                <div><span class="badge bg-success-transparent" title="Data de abertura">Abertura: ${startDate}</span></div>
                            </div>
                            <div class="d-flex flex-wrap text-muted justify-content-between mb-1 fs-12 fw-semibold gap-2">
                                <div><span class="badge bg-info-transparent" title="Previsão de início">Início: ${forecastStart}</span></div>
                                <div><span class="badge bg-danger-transparent" title="Previsão de entrega">Entrega: ${forecastEnd}</span></div>
                            </div>
                            <div class="kanban-content mt-2">
                                <h6 class="fw-semibold mb-1 fs-15">${ticket.title} - Ticket #${ticket.id}</h6>
                                <div class="kanban-task-description"><p>${ticket.description ? ticket.description.substring(0, 120) : ''}</p></div>
                            </div>
                        </div>
                        <div class="p-3 border-top border-block-start-dashed">
                            <div class="row d-flex align-items-center justify-content-between">
                                <div class="col-3 d-flex" style="justify-content: left;">
                                    <a href="javascript:void(0);" class="text-muted">
                                        <span class="me-1"><i class="ri-message-2-line align-middle fw-normal"></i></span>
                                        <span class="fw-semibold fs-12">${commentsCount}</span>
                                    </a>
                                </div>
                                <div class="col-6 d-flex" style="justify-content: center;align-items: center;flex-direction: column;"></div>
                                <div class="col-3 avatar-list-stacked d-flex" style="justify-content: right; padding-right: 1%;">
                                    ${responsibleAvatar}${requesterAvatar}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
            );
            
            // Adicionar evento de duplo clique para abrir edição
            card.on('dblclick', function() {
                const body = {
                    url: `/app/marketing/marketing-tickets/edit.html?id=${ticket.id}`,
                    width: 1280,
                    height: 720,
                    resizable: true
                }
                window.ipcRenderer.invoke('open-exWindow', body);
            });
            
            $(`#kanban-col-${ticket.status.replace(/\s+/g, '-')}`).append(card);
        });
        // Inicializar SortableJS para cada coluna
        KANBAN_STATUSES.forEach(status => {
            const colId = `kanban-col-${status.replace(/\s+/g, '-')}`;
            const el = document.getElementById(colId);
            if (el) {
                new Sortable(el, {
                    group: 'kanban',
                    animation: 150,
                    onAdd: function (evt) {
                        // Só chama o modal de status se realmente mudou de coluna
                        if (evt.from !== evt.to) {
                            const card = $(evt.item);
                            const ticketId = card.attr('data-id');
                            const newStatus = status;
                            showKanbanStatusModal(ticketId, newStatus, card);
                        }
                    },
                    onEnd: function(evt) {
                        // Só atualiza a ordem se for dentro da mesma coluna
                        if (evt.from === evt.to && evt.oldIndex !== evt.newIndex) {
                            updateKanbanOrder(status, evt.to);
                        }
                    }
                });
            }
        });
    }

    // Modal de confirmação ao arrastar
    function showKanbanStatusModal(ticketId, newStatus, card) {
        // Verificar se o chamado já tem datas definidas
        let hasStartDate = false;
        let hasEndDate = false;
        
        if (card && card.length > 0) {
            const startDate = card.attr('data-start-date');
            const endDate = card.attr('data-end-date');
            hasStartDate = startDate && startDate !== 'null' && startDate !== '';
            hasEndDate = endDate && endDate !== 'null' && endDate !== '';
        }
        
        // Se for "Em andamento", sempre mostrar campos de data (obrigatórios)
        const showDateFields = newStatus === 'Em andamento';
        
        const dateFieldsHtml = showDateFields ? `
            <div class="mb-3">
                <label for="start_date" class="form-label">Data de Início <span class="text-danger">*</span></label>
                <input type="date" class="form-control" id="start_date" required>
            </div>
            <div class="mb-3">
                <label for="end_date" class="form-label">Data de Entrega <span class="text-danger">*</span></label>
                <input type="date" class="form-control" id="end_date" required>
            </div>
        ` : '';
        
        const modalHtml = `
            <div class="modal fade" id="kanbanStatusModal" tabindex="-1" aria-labelledby="kanbanStatusModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="kanbanStatusModalLabel">Alterar Status</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Confirmar mudança de status do chamado para <b>${newStatus}</b>?</p>
                            ${dateFieldsHtml}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="kanban-modal-confirm-btn">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>`;
        $('#kanbanStatusModal').remove();
        $('body').append(modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('kanbanStatusModal'));
        modal.show();
        $('#kanban-modal-confirm-btn').off('click').on('click', async function() {
            try {
                // Se for para 'Em andamento', vincular usuário logado como responsável apenas se não houver responsável
                let body = { status: newStatus };
                
                // Validar datas se for "Em andamento"
                if (newStatus === 'Em andamento' && showDateFields) {
                    const startDate = $('#start_date').val();
                    const endDate = $('#end_date').val();
                    
                    // Validar se as datas foram preenchidas
                    if (!startDate || !endDate) {
                        showNotification('As datas de início e entrega são obrigatórias para colocar em andamento!', 'error');
                        return;
                    }
                    
                    // Validar se a data de entrega é posterior à data de início
                    if (new Date(endDate) <= new Date(startDate)) {
                        showNotification('A data de entrega deve ser posterior à data de início!', 'error');
                        return;
                    }
                    
                    body.start_date = startDate;
                    body.end_date = endDate;
                }
                
                if (newStatus === 'Em andamento') {
                    // Buscar se já existe responsável no card
                    let hasResponsible = false;
                    if (card && card.length > 0 && card.data('responsible')) {
                        hasResponsible = !!card.data('responsible');
                    } else if (card && card.length > 0 && card.attr('data-responsible')) {
                        hasResponsible = !!card.attr('data-responsible');
                    }
                    if (!hasResponsible) {
                        const StorageGoogleData = localStorage.getItem('StorageGoogle');
                        if (StorageGoogleData) {
                            const StorageGoogle = JSON.parse(StorageGoogleData);
                            if (StorageGoogle && StorageGoogle.system_userID) {
                                body.responsible_id = StorageGoogle.system_userID;
                            }
                        }
                    }
                }
                
                await makeRequest(`/api/marketing/tickets/${ticketId}/status`, 'PUT', body);
                showNotification('Status atualizado com sucesso!', 'success');
                modal.hide();
                loadTickets();
            } catch (err) {
                showNotification('Erro ao atualizar status', 'error');
                modal.hide();
                loadTickets();
            }
        });
        $('#kanbanStatusModal').on('hidden.bs.modal', function() {
            loadTickets(); // Recarregar para garantir consistência
        });
    }

    // Função para atualizar ordem dos cards no Kanban
    async function updateKanbanOrder(status, columnElement) {
        try {
            // Coletar IDs dos cards na ordem atual
            const cardElements = columnElement.querySelectorAll('.card.custom-card.task-card');
            const ids = Array.from(cardElements).map(card => card.getAttribute('data-id'));
            
            if (ids.length > 0) {
                console.log(`Atualizando ordem para status "${status}":`, ids);
                
                // Enviar nova ordem para o backend
                await makeRequest('/api/marketing/tickets/kanban-order', 'PUT', {
                    status: status,
                    ids: ids
                });
                
                console.log('Ordem do Kanban atualizada com sucesso');
            }
        } catch (err) {
            console.error('Erro ao atualizar ordem do Kanban:', err);
            showNotification('Erro ao salvar ordem dos cards', 'error');
        }
    }

    // Substituir renderTicketsTable por renderKanbanBoard
    function renderTicketsTable(tickets) {
        renderKanbanBoard(tickets);
    }

    // Função para formatar data
    function formatDate(dateString) {
        if (!dateString) return '-';
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
        setTimeout(() => {
            notification.alert('close');
        }, 5000);
    }


    document.querySelector('#loader2').classList.add('d-none')
});
