$(document).ready(function() {
    let currentPage = 1;
    let currentStatus = 'all';
    let currentSearch = '';
    let currentRequestId = null;

    // Inicializar
    loadRequests();
    loadClients();

    // Event listeners
    $('#btn-filter').on('click', function() {
        currentPage = 1;
        currentStatus = $('#status-filter').val();
        currentSearch = $('#search-filter').val();
        loadRequests();
    });

    $('#btn-refresh').on('click', function() {
        loadRequests();
    });

    // Aprovar solicitação
    $(document).on('click', '.btn-approve', function() {
        const requestId = $(this).data('id');
        currentRequestId = requestId;
        $('#approve-modal').modal('show');
    });

    // Rejeitar solicitação
    $(document).on('click', '.btn-reject', function() {
        const requestId = $(this).data('id');
        currentRequestId = requestId;
        $('#reject-modal').modal('show');
    });

    // Ver detalhes
    $(document).on('click', '.btn-details', function() {
        const requestId = $(this).data('id');
        loadRequestDetails(requestId);
    });

    // Confirmar aprovação
    $('#btn-confirm-approve').on('click', function() {
        const approvalType = $('input[name="approval-type"]:checked').val();
        const adminNotes = $('#admin-notes').val();
        
        if (approvalType === 'link') {
            const clientId = $('#client-select').val();
            if (!clientId) {
                Swal.fire('Erro', 'Selecione um cliente para vincular', 'error');
                return;
            }
            approveAndLink(clientId, adminNotes);
        } else {
            approveAndCreateClient(adminNotes);
        }
    });

    // Confirmar rejeição
    $('#btn-confirm-reject').on('click', function() {
        const reason = $('#reject-reason').val().trim();
        if (!reason) {
            Swal.fire('Erro', 'Informe o motivo da rejeição', 'error');
            return;
        }
        rejectRequest(reason);
    });

    // Mudança no tipo de aprovação
    $('input[name="approval-type"]').on('change', function() {
        const type = $(this).val();
        if (type === 'link') {
            $('#client-selection').show();
        } else {
            $('#client-selection').hide();
        }
    });

    // Carregar solicitações
    async function loadRequests() {
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 20,
                status: currentStatus,
                search: currentSearch
            });

            const response = await fetch(`/api/access-requests?${params}`);
            const result = await response.json();

            if (result.success) {
                renderRequests(result.data);
                updatePagination(result.pagination);
                updateStatusCounts(result.status_counts);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao carregar solicitações:', error);
            Swal.fire('Erro', 'Erro ao carregar solicitações', 'error');
        }
    }

    // Renderizar solicitações
    function renderRequests(requests) {
        const tbody = $('#requests-tbody');
        tbody.empty();

        if (requests.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="ri-inbox-line fs-2 d-block mb-2"></i>
                        Nenhuma solicitação encontrada
                    </td>
                </tr>
            `);
            return;
        }

        requests.forEach(request => {
            const statusBadge = getStatusBadge(request.status);
            const actions = getActions(request);
            
            tbody.append(`
                <tr>
                    <td>#${request.id}</td>
                    <td>${request.full_name}</td>
                    <td>${request.email}</td>
                    <td>${request.company_name}</td>
                    <td>${request.cnpj}</td>
                    <td>${statusBadge}</td>
                    <td>${formatDate(request.created_at)}</td>
                    <td>${actions}</td>
                </tr>
            `);
        });
    }

    // Obter badge de status
    function getStatusBadge(status) {
        const badges = {
            'pending': '<span class="badge bg-warning">Pendente</span>',
            'approved': '<span class="badge bg-success">Aprovada</span>',
            'rejected': '<span class="badge bg-danger">Rejeitada</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Desconhecido</span>';
    }

    // Obter ações disponíveis
    function getActions(request) {
        if (request.status === 'pending') {
            return `
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-details" data-id="${request.id}" title="Ver detalhes">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button class="btn btn-outline-success btn-approve" data-id="${request.id}" title="Aprovar">
                        <i class="ri-check-line"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-reject" data-id="${request.id}" title="Rejeitar">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
            `;
        } else {
            return `
                <button class="btn btn-outline-primary btn-sm btn-details" data-id="${request.id}" title="Ver detalhes">
                    <i class="ri-eye-line"></i>
                </button>
            `;
        }
    }

    // Atualizar paginação
    function updatePagination(pagination) {
        const { page, pages, total } = pagination;
        const start = (page - 1) * 20 + 1;
        const end = Math.min(page * 20, total);

        $('#showing-start').text(start);
        $('#showing-end').text(end);
        $('#showing-total').text(total);

        const paginationEl = $('#pagination');
        paginationEl.empty();

        if (pages <= 1) return;

        // Botão anterior
        if (page > 1) {
            paginationEl.append(`
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${page - 1}">Anterior</a>
                </li>
            `);
        }

        // Páginas
        for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
            paginationEl.append(`
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }

        // Botão próximo
        if (page < pages) {
            paginationEl.append(`
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${page + 1}">Próximo</a>
                </li>
            `);
        }

        // Event listeners para paginação
        paginationEl.find('.page-link').on('click', function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            if (page) {
                currentPage = page;
                loadRequests();
            }
        });
    }

    // Atualizar contadores de status
    function updateStatusCounts(counts) {
        $('#total-count').text(counts.pending + counts.approved + counts.rejected);
        $('#pending-count').text(counts.pending || 0);
        $('#approved-count').text(counts.approved || 0);
        $('#rejected-count').text(counts.rejected || 0);
    }

    // Carregar detalhes da solicitação
    async function loadRequestDetails(requestId) {
        try {
            const response = await fetch(`/api/access-requests/${requestId}`);
            const result = await response.json();

            if (result.success) {
                const request = result.data;
                renderRequestDetails(request);
                $('#request-details-modal').modal('show');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            Swal.fire('Erro', 'Erro ao carregar detalhes da solicitação', 'error');
        }
    }

    // Renderizar detalhes da solicitação
    function renderRequestDetails(request) {
        const content = $('#request-details-content');
        const actions = $('#request-details-actions');

        content.html(`
            <div class="row">
                <div class="col-md-6">
                    <h6>Informações do Solicitante</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Nome:</strong></td><td>${request.full_name}</td></tr>
                        <tr><td><strong>Email:</strong></td><td>${request.email}</td></tr>
                        <tr><td><strong>Telefone:</strong></td><td>${request.phone}</td></tr>
                        <tr><td><strong>Empresa:</strong></td><td>${request.company_name}</td></tr>
                        <tr><td><strong>CNPJ:</strong></td><td>${request.cnpj}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Status e Processamento</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Status:</strong></td><td>${getStatusBadge(request.status)}</td></tr>
                        <tr><td><strong>Data de Criação:</strong></td><td>${formatDate(request.created_at)}</td></tr>
                        <tr><td><strong>Última Atualização:</strong></td><td>${formatDate(request.updated_at)}</td></tr>
                        ${request.admin_name ? `<tr><td><strong>Processado por:</strong></td><td>${request.admin_name}</td></tr>` : ''}
                        ${request.client_name ? `<tr><td><strong>Cliente Vinculado:</strong></td><td>${request.client_name}</td></tr>` : ''}
                    </table>
                </div>
            </div>
            ${request.message ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Mensagem do Solicitante</h6>
                    <div class="alert alert-info">${request.message}</div>
                </div>
            </div>
            ` : ''}
            ${request.admin_notes ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Observações Administrativas</h6>
                    <div class="alert alert-warning">${request.admin_notes}</div>
                </div>
            </div>
            ` : ''}
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Histórico de Ações</h6>
                    <div class="timeline">
                        ${request.history.map(item => `
                            <div class="timeline-item">
                                <div class="timeline-marker bg-${getActionColor(item.action)}"></div>
                                <div class="timeline-content">
                                    <div class="d-flex justify-content-between">
                                        <strong>${getActionText(item.action)}</strong>
                                        <small class="text-muted">${formatDate(item.created_at)}</small>
                                    </div>
                                    <p class="mb-0">${item.details}</p>
                                    ${item.admin_name ? `<small class="text-muted">por ${item.admin_name}</small>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `);

        // Ações disponíveis
        if (request.status === 'pending') {
            actions.html(`
                <button type="button" class="btn btn-success" onclick="approveRequest(${request.id})">
                    <i class="ri-check-line me-1"></i>Aprovar
                </button>
                <button type="button" class="btn btn-danger" onclick="rejectRequest(${request.id})">
                    <i class="ri-close-line me-1"></i>Rejeitar
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            `);
        } else {
            actions.html(`
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            `);
        }
    }

    // Carregar clientes para seleção
    async function loadClients() {
        try {
            const response = await fetch('/api/access-requests/clients');
            const result = await response.json();

            if (result.success) {
                const select = $('#client-select');
                select.empty();
                select.append('<option value="">Selecione um cliente...</option>');
                
                result.data.forEach(client => {
                    select.append(`<option value="${client.id}">${client.full_name} - ${client.company_name}</option>`);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    }

    // Aprovar e vincular a cliente existente
    async function approveAndLink(clientId, adminNotes) {
        try {
            const response = await fetch(`/api/access-requests/${currentRequestId}/approve-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: clientId,
                    admin_notes: adminNotes
                })
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire('Sucesso', 'Solicitação aprovada e vinculada com sucesso', 'success');
                $('#approve-modal').modal('hide');
                loadRequests();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao aprovar solicitação:', error);
            Swal.fire('Erro', error.message || 'Erro ao aprovar solicitação', 'error');
        }
    }

    // Aprovar e criar novo cliente
    async function approveAndCreateClient(adminNotes) {
        try {
            const response = await fetch(`/api/access-requests/${currentRequestId}/approve-create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    admin_notes: adminNotes
                })
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire('Sucesso', 'Solicitação aprovada e novo cliente criado com sucesso', 'success');
                $('#approve-modal').modal('hide');
                loadRequests();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao aprovar e criar cliente:', error);
            Swal.fire('Erro', error.message || 'Erro ao aprovar solicitação', 'error');
        }
    }

    // Rejeitar solicitação
    async function rejectRequest(reason) {
        try {
            const response = await fetch(`/api/access-requests/${currentRequestId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    admin_notes: reason
                })
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire('Sucesso', 'Solicitação rejeitada com sucesso', 'success');
                $('#reject-modal').modal('hide');
                $('#reject-reason').val('');
                loadRequests();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao rejeitar solicitação:', error);
            Swal.fire('Erro', error.message || 'Erro ao rejeitar solicitação', 'error');
        }
    }

    // Funções auxiliares
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function getActionColor(action) {
        const colors = {
            'created': 'primary',
            'approved': 'success',
            'rejected': 'danger',
            'linked_client': 'info',
            'created_client': 'warning'
        };
        return colors[action] || 'secondary';
    }

    function getActionText(action) {
        const texts = {
            'created': 'Solicitação Criada',
            'approved': 'Solicitação Aprovada',
            'rejected': 'Solicitação Rejeitada',
            'linked_client': 'Vinculado a Cliente',
            'created_client': 'Novo Cliente Criado'
        };
        return texts[action] || action;
    }

    // Funções globais para uso nos modais
    window.approveRequest = function(requestId) {
        currentRequestId = requestId;
        $('#request-details-modal').modal('hide');
        $('#approve-modal').modal('show');
    };

    window.rejectRequest = function(requestId) {
        currentRequestId = requestId;
        $('#request-details-modal').modal('hide');
        $('#reject-modal').modal('show');
    };
}); 