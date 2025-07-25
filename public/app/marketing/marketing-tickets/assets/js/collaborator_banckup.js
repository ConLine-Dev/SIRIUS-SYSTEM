// collaborator.js - Página do Colaborador - Chamados de Marketing

$(document).ready(function() {
    // Inicializar Socket.IO
    const socket = io();
    
    // Event listeners do Socket.IO
    socket.on('ticketCreated', (data) => {
        console.log('Novo chamado criado:', data);
        loadCollaboratorTickets(); // Recarregar lista
    });
    
    socket.on('ticketUpdated', (data) => {
        console.log('Chamado atualizado:', data);
        
        // Se for atualização de status, mostrar notificação
        if (data.type === 'status_update') {
            showNotification(`Status do chamado #${data.ticket_id} atualizado para: ${data.status}`, 'info');
        }
        
        loadCollaboratorTickets(); // Recarregar lista
    });
    
    socket.on('ticketDeleted', (data) => {
        console.log('Chamado excluído:', data);
        loadCollaboratorTickets(); // Recarregar lista
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
    
    // Inicializar filtros
    initializeFilters();

    // Buscar chamados ao digitar ou mudar filtros
    $('#filter-keyword, #filter-type, #filter-status, #filter-role').on('change keyup', function() {
        loadCollaboratorTickets();
    });

    $('#btn-clear-filters').on('click', function() {
        $('#filter-keyword').val('');
        $('#filter-type').val('');
        $('#filter-status').val('');
        $('#filter-role').val('');
        loadCollaboratorTickets();
    });

    // Carregar chamados ao iniciar
    loadCollaboratorTickets();

    // Função para inicializar filtros
    async function initializeFilters() {
        try {
            // Carregar tipos de chamado
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

        } catch (err) {
            console.error('Erro ao carregar filtros:', err);
        }
    }

    // Função para carregar chamados do colaborador
    async function loadCollaboratorTickets() {
        try {
            const params = {
                keyword: $('#filter-keyword').val(),
                type: $('#filter-type').val(),
                status: $('#filter-status').val(),
                role: $('#filter-role').val(),
                collaborator: true // Flag para indicar que é busca do colaborador
            };
            
            // Monta query string
            const query = Object.keys(params)
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k] || ''))
                .join('&');
                
            const tickets = await makeRequest(`/api/marketing/tickets/collaborator?${query}`);
            renderCollaboratorTicketsTable(tickets);
        } catch (err) {
            $('#tickets-table-view').html('<div class="alert alert-danger">Erro ao carregar chamados.</div>');
            console.error('Erro ao carregar chamados:', err);
        }
    }

    // Renderizar tabela de chamados do colaborador
    function renderCollaboratorTicketsTable(tickets) {
        let html = '';
        if (!tickets || tickets.length === 0) {
            html = '<div class="alert alert-info">Nenhum chamado encontrado.</div>';
        } else {
            html = '<table class="table table-hover"><thead><tr>' +
                '<th>Título</th><th>Tipo</th><th>Status</th><th>Meu Papel</th><th>Prazo</th><th>Ações</th>' +
                '</tr></thead><tbody>';
            
            tickets.forEach(ticket => {
                const rowClass = getRowClass(ticket.user_role);
                const roleBadge = getRoleBadge(ticket.user_role);
                
                html += `<tr class="${rowClass}">
                    <td><strong>${ticket.title}</strong></td>
                    <td>${ticket.type}</td>
                    <td><span class="badge bg-${getStatusColor(ticket.status)}">${ticket.status}</span></td>
                    <td>${roleBadge}</td>
                    <td>${formatDate(ticket.end_date)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.open('view.html?id=${ticket.id}', '_blank', 'width=1030,height=583,resizable=yes,scrollbars=yes')" title="Ver detalhes">
                            <i class="ri-eye-line"></i>
                        </button>
                        ${ticket.user_role === 'responsible' ? 
                            `<button class="btn btn-sm btn-outline-success ms-1" onclick="updateStatus(${ticket.id})" title="Atualizar status">
                                <i class="ri-edit-line"></i>
                            </button>` : ''
                        }
                    </td>
                </tr>`;
            });
            html += '</tbody></table>';
        }
        $('#tickets-table-view').html(html);
        $('#tickets-count-display').text(`${tickets.length} chamados encontrados`);
    }

    // Função para determinar classe da linha baseada no papel do usuário
    function getRowClass(userRole) {
        switch(userRole) {
            case 'responsible': return 'responsible-ticket';
            case 'requester': return 'requester-ticket';
            case 'involved': return 'involved-ticket';
            default: return '';
        }
    }

    // Função para badge do papel do usuário
    function getRoleBadge(userRole) {
        const badges = {
            'responsible': '<span class="badge bg-danger">Responsável</span>',
            'requester': '<span class="badge bg-primary">Solicitante</span>',
            'involved': '<span class="badge bg-success">Envolvido</span>'
        };
        return badges[userRole] || '<span class="badge bg-secondary">-</span>';
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

    // Função para formatar data
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
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

    // Função para atualizar status (apenas para responsáveis)
    window.updateStatus = async function(ticketId) {
        try {
            const newStatus = prompt('Digite o novo status:');
            if (newStatus) {
                await makeRequest(`/api/marketing/tickets/${ticketId}/status`, 'PUT', { status: newStatus });
                loadCollaboratorTickets(); // Recarregar lista
            }
        } catch (err) {
            alert('Erro ao atualizar status');
            console.error('Erro ao atualizar status:', err);
        }
    };

    // Exportar para Excel
    $('#btn-export-excel').on('click', function() {
        // Implementar exportação para Excel
        alert('Funcionalidade de exportação será implementada');
    });

    document.querySelector('#loader2').classList.add('d-none');
}); 