// public/app/marketing/marketing-tickets/assets/js/collaborator.js
$(document).ready(function() {
    let tickets = [];
    let socket;
    let currentFilters = {
        keyword: '',
        type: '',
        status: '',
        responsible: '',
        requester: ''
    };

    // Inicializar
    init();

    function init() {
        loadTickets();
        setupSocket();
        setupEventListeners();
        loadFilterOptions();
    }

    // Carregar tickets do colaborador
    async function loadTickets() {
        try {
            console.log('loadTickets iniciado - collaborator.js');
            
            // Construir query string com filtros
            const params = {
                keyword: currentFilters.keyword,
                type: currentFilters.type,
                status: currentFilters.status,
                responsible: currentFilters.responsible,
                requester: currentFilters.requester
            };
            
            console.log('Parâmetros de busca:', params);
            
            const queryString = Object.keys(params)
                .filter(key => params[key])
                .map(key => `${key}=${encodeURIComponent(params[key])}`)
                .join('&');
            
            console.log('Query string:', queryString);
            console.log('Fazendo requisição para API...');
            
            const response = await makeRequest(`/api/marketing/tickets/collaborator${queryString ? '?' + queryString : ''}`, 'GET');
            
            console.log('Tickets recebidos:', response);
            
            if (Array.isArray(response)) {
                tickets = response;
                renderKanbanBoard(tickets);
                updateTicketCounts();
            } else {
                console.error('Resposta inválida da API:', response);
                showNotification('Erro ao carregar tickets', 'error');
            }
        } catch (err) {
            console.error('Erro ao carregar tickets:', err);
            showNotification('Erro ao carregar tickets', 'error');
        }
    }

    // Configurar Socket.IO
    function setupSocket() {
        socket = io();
        
        socket.on('connect', function() {
            console.log('Socket.IO conectado - collaborator.js');
        });
        
        socket.on('disconnect', function() {
            console.log('Socket.IO desconectado - collaborator.js');
        });
        
        socket.on('ticketCreated', function(data) {
            console.log('Novo chamado criado:', data);
            console.log('Recarregando lista para incluir novo chamado...');
            // Recarregar lista para incluir novo chamado (se for do usuário atual)
            loadTickets();
        });
        
        socket.on('ticketUpdated', function(data) {
            console.log('Chamado atualizado:', data);
            
            if (data.type === 'kanban_order_update') {
                // Recarregar tickets para refletir nova ordem
                loadTickets();
            } else {
                // Atualizar ticket específico
                updateTicketInBoard(data);
            }
        });
        
        socket.on('ticketDeleted', function(data) {
            console.log('Chamado excluído:', data);
            loadTickets(); // Recarregar lista
        });
        
        socket.on('newComment', function(data) {
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
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Filtros
        $('#filter-keyword').on('input', debounce(function() {
            currentFilters.keyword = $(this).val();
            loadTickets();
        }, 500));

        $('#filter-type').on('change', function() {
            currentFilters.type = $(this).val();
            loadTickets();
        });

        $('#filter-status').on('change', function() {
            currentFilters.status = $(this).val();
            loadTickets();
        });

        $('#filter-responsible').on('change', function() {
            currentFilters.responsible = $(this).val();
            loadTickets();
        });

        $('#filter-requester').on('change', function() {
            currentFilters.requester = $(this).val();
            loadTickets();
        });

        // Limpar filtros
        $('#btn-clear-filters').on('click', function() {
            currentFilters = {
                keyword: '',
                type: '',
                status: '',
                responsible: '',
                requester: ''
            };
            
            $('#filter-keyword').val('');
            $('#filter-type').val('').trigger('change');
            $('#filter-status').val('').trigger('change');
            $('#filter-responsible').val('').trigger('change');
            $('#filter-requester').val('').trigger('change');
            
            loadTickets();
        });

        // Exportar Excel
        $('#btn-export-excel').on('click', function() {
            exportToExcel();
        });
    }

    // Carregar opções dos filtros
    async function loadFilterOptions() {
        try {
            const [types, statuses, users] = await Promise.all([
                makeRequest('/api/marketing/tickets/types', 'GET'),
                makeRequest('/api/marketing/tickets/statuses', 'GET'),
                makeRequest('/api/marketing/tickets/users', 'GET')
            ]);

            // Preencher tipos
            const typeSelect = $('#filter-type');
            typeSelect.append('<option value="">Todos os tipos</option>');
            if (Array.isArray(types)) {
                types.forEach(type => {
                    typeSelect.append(`<option value="${type}">${type}</option>`);
                });
            }

            // Preencher status
            const statusSelect = $('#filter-status');
            statusSelect.append('<option value="">Todos os status</option>');
            if (Array.isArray(statuses)) {
                statuses.forEach(status => {
                    statusSelect.append(`<option value="${status}">${status}</option>`);
                });
            }

            // Preencher usuários
            const responsibleSelect = $('#filter-responsible');
            const requesterSelect = $('#filter-requester');
            
            responsibleSelect.append('<option value="">Todos os responsáveis</option>');
            requesterSelect.append('<option value="">Todos os solicitantes</option>');
            
            if (Array.isArray(users)) {
                users.forEach(user => {
                    const option = `<option value="${user.id}">${user.name}</option>`;
                    responsibleSelect.append(option);
                    requesterSelect.append(option);
                });
            }
        } catch (err) {
            console.error('Erro ao carregar opções dos filtros:', err);
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

    // Renderizar quadro Kanban
    function renderKanbanBoard(tickets) {
        console.log('renderKanbanBoard iniciado - collaborator.js, tickets:', tickets.length);
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
            
            const card = $(
                `<div class="card custom-card task-card task-card-${ticket.id}" id="${ticket.id}" data-id="${ticket.id}">
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
                    url: `/app/marketing/marketing-tickets/view.html?id=${ticket.id}`,
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
                // Remover funcionalidade de drag and drop para colaboradores
                // new Sortable(el, {
                //     group: 'kanban',
                //     animation: 150,
                //     onAdd: function (evt) {
                //         // Só chama o modal de status se realmente mudou de coluna
                //         if (evt.from !== evt.to) {
                //             const card = $(evt.item);
                //             const ticketId = card.attr('data-id');
                //             const newStatus = status;
                //             showKanbanStatusModal(ticketId, newStatus, card);
                //         }
                //     },
                //     onEnd: function(evt) {
                //         // Só atualiza a ordem se for dentro da mesma coluna
                //         if (evt.from === evt.to && evt.oldIndex !== evt.newIndex) {
                //             updateKanbanOrder(status, evt.to);
                //         }
                //     }
                // });
            }
        });
    }

    // Atualizar ticket no quadro
    function updateTicketInBoard(data) {
        const ticketId = data.ticket_id;
        const ticket = tickets.find(t => t.id == ticketId);
        
        if (ticket) {
            // Atualizar dados do ticket existente
            Object.assign(ticket, data);
            
            // Recarregar quadro
            renderKanbanBoard(tickets);
            updateTicketCounts();
        } else {
            // Se o ticket não existe na lista atual, pode ser um novo chamado
            // Recarregar a lista completa para incluir o novo chamado
            console.log('Ticket não encontrado na lista atual, recarregando lista completa...');
            loadTickets();
        }
    }

    // Atualizar contadores
    function updateTicketCounts() {
        const total = tickets.length;
        
        $('#tickets-count-display').text(`${total} chamado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`);
        
        // Remover contadores detalhados de status
        $('#tickets-status-counts').html('');
    }

    // Exportar para Excel
    function exportToExcel() {
        if (tickets.length === 0) {
            showNotification('Nenhum ticket para exportar', 'info');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(tickets.map(ticket => ({
            'ID': ticket.id,
            'Título': ticket.title,
            'Tipo': ticket.type,
            'Categoria': ticket.category,
            'Status': ticket.status,
            'Prioridade': ticket.priority,
            'Solicitante': ticket.requester_name,
            'Responsável': ticket.responsible_name,
            'Data de Criação': formatDate(ticket.created_at),
            'Previsão de Início': formatDate(ticket.start_date),
            'Previsão de Entrega': formatDate(ticket.end_date),
            'Descrição': ticket.description
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Chamados');

        const fileName = `chamados_marketing_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        showNotification('Arquivo Excel exportado com sucesso', 'success');
    }

    // Funções auxiliares
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    function getPriorityColor(priority) {
        const colors = {
            'Baixa': 'success',
            'Média': 'warning',
            'Alta': 'danger',
            'Urgente': 'danger'
        };
        return colors[priority] || 'secondary';
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

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

    document.querySelector('#loader2').classList.add('d-none');
});
