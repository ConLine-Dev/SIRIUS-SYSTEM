// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {
    // Carrega a tabela de aprovações pendentes
    await loadPendingApprovalsTable();

    // Configura o socket para atualizações em tempo real
    const socket = io();

    // Atualiza a tabela quando houver mudanças nos dados
    socket.on('updateExpenseRequests', (data) => {
        $('#pending-approvals-table').DataTable().ajax.reload(null, false);
    });

    // Remove o loader quando a página estiver carregada
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('d-none');
    }
});

// Obtém as informações do usuário logado do localStorage
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
}

// Função para carregar a tabela de aprovações pendentes
async function loadPendingApprovalsTable() {
    const userLogged = await getInfosLogin();

    // Inicializa a tabela de aprovações pendentes
    $('#pending-approvals-table').DataTable({
        dom: 'frtip',
        paging: true,
        pageLength: 10,
        responsive: true,
        lengthChange: false,
        info: false,
        order: [[5, 'desc']], // Ordenar por data de solicitação decrescente
        ajax: {
            url: `/api/zero-based-budgeting/getPendingApprovals?id_collaborator=${userLogged.system_collaborator_id}`,
            dataSrc: ''
        },
        columns: [
            { data: 'costCenterName' },
            { 
                data: 'description',
                render: function(data, type, row) {
                    const tooltip = row.item_count > 1 ? 
                        `Solicitação com ${row.item_count} itens` : 
                        data;
                    return `<span title="${tooltip}">${data}</span>`;
                }
            },
            { 
                data: 'category',
                render: function(data, type, row) {
                    if (!row.items || !row.items.length) return data;
                    
                    const categories = [...new Set(row.items.map(item => item.categoryName))];
                    if (categories.length <= 2) {
                        return categories.join(', ');
                    } else {
                        return `${categories[0]}, ${categories[1]} +${categories.length - 2}`;
                    }
                }
            },
            { 
                data: 'item_count',
                render: function(data, type, row) {
                    if (row.items && row.items.length > 0) {
                        const totalQuantity = row.items.reduce((total, item) => {
                            return total + (parseInt(item.quantity) || 0);
                        }, 0);
                        return totalQuantity;
                    }
                    return data || 1;
                }
            },
            { 
                data: 'amount',
                render: function(data, type, row) {
                    if (type === 'display') {
                        return row.amount;
                    }
                    return row.raw_amount || 0;
                }
            },
            { 
                data: 'requestDate',
                render: function(data) {
                    return data;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <div class="hstack gap-2 fs-15">
                            ${createViewButton(row.id)}
                            ${createApprovedButton(row.id)}
                            ${createRejectedButton(row.id)}
                        </div>
                    `;
                },
                orderable: false
            },
        ],
        createdRow: function(row, data, dataIndex) {
            $(row).css('cursor', 'pointer');
            $(row).on('dblclick', function() {
                openExpenseRequest(data.id);
            });
        },
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.4/i18n/pt-BR.json',
            searchPlaceholder: 'Buscar solicitação...'
        }
    });
}

// Função para abrir a página de visualização da solicitação
function openExpenseRequest(id) {
    window.location.href = `view-expense-request.html?id=${id}`;
}

// Função para abrir o modal de aprovação
function openApprovalModal(id) {
    document.getElementById('expense-request-id').value = id;
    document.getElementById('approval-comments').value = '';
    
    const approvalModal = new bootstrap.Modal(document.getElementById('quickApprovalModal'));
    approvalModal.show();
}

// Função para abrir o modal de rejeição
function openRejectionModal(id) {
    document.getElementById('rejection-expense-request-id').value = id;
    document.getElementById('rejection-comments').value = '';
    
    const rejectionModal = new bootstrap.Modal(document.getElementById('quickRejectionModal'));
    rejectionModal.show();
}

// Função para enviar a aprovação
async function submitApproval() {
    const requestId = document.getElementById('expense-request-id').value;
    const comments = document.getElementById('approval-comments').value;
    const userLogged = await getInfosLogin();
    
    try {
        const response = await fetch('/api/zero-based-budgeting/processExpenseRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                expense_request_id: parseInt(requestId),
                approver_id: parseInt(userLogged.system_collaborator_id),
                status: 'Aprovado',
                comment: comments || ''
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Fechar o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('quickApprovalModal'));
            modal.hide();
            
            // Exibir mensagem de sucesso
            await Swal.fire({
                title: 'Aprovado!',
                text: 'Solicitação aprovada com sucesso!',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            
            // Atualizar a tabela
            $('#pending-approvals-table').DataTable().ajax.reload(null, false);
        } else {
            Swal.fire({
                title: 'Erro!',
                text: result.message || 'Ocorreu um erro ao aprovar a solicitação.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error('Erro ao aprovar solicitação:', error);
        Swal.fire({
            title: 'Erro!',
            text: 'Ocorreu um erro ao aprovar a solicitação.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Função para enviar a rejeição
async function submitRejection() {
    const requestId = document.getElementById('rejection-expense-request-id').value;
    const comments = document.getElementById('rejection-comments').value;
    const userLogged = await getInfosLogin();
    
    // Validar se o motivo da rejeição foi informado
    if (!comments.trim()) {
        Swal.fire({
            title: 'Atenção!',
            text: 'É necessário informar o motivo da rejeição.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    try {
        const response = await fetch('/api/zero-based-budgeting/processExpenseRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                expense_request_id: parseInt(requestId),
                approver_id: parseInt(userLogged.system_collaborator_id),
                status: 'Rejeitado',
                comment: comments
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Fechar o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('quickRejectionModal'));
            modal.hide();
            
            // Exibir mensagem de sucesso
            await Swal.fire({
                title: 'Rejeitado!',
                text: 'Solicitação rejeitada com sucesso!',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            
            // Atualizar a tabela
            $('#pending-approvals-table').DataTable().ajax.reload(null, false);
        } else {
            Swal.fire({
                title: 'Erro!',
                text: result.message || 'Ocorreu um erro ao rejeitar a solicitação.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error('Erro ao rejeitar solicitação:', error);
        Swal.fire({
            title: 'Erro!',
            text: 'Ocorreu um erro ao rejeitar a solicitação.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

function createApprovedButton(id) {
    return `<button class="btn btn-sm btn-icon btn-success me-1 mb-1" title="Aprovar" data-bs-toggle="modal" data-bs-target="#quickApprovalModal" onclick="setExpenseRequestId(${id})">
                <i class="mdi mdi-check"></i>
            </button>`;
}

function createRejectedButton(id) {
    return `<button class="btn btn-sm btn-icon btn-danger me-1 mb-1" title="Rejeitar" data-bs-toggle="modal" data-bs-target="#quickRejectionModal" onclick="setRejectionExpenseRequestId(${id})">
                <i class="mdi mdi-close"></i>
            </button>`;
}

function createViewButton(id) {
    return `<button class="btn btn-sm btn-icon btn-primary me-1 mb-1" title="Visualizar" onclick="openExpenseRequest(${id})">
                <i class="mdi mdi-eye"></i>
            </button>`;
}

// Função para definir o ID da solicitação de despesa no modal de aprovação
function setExpenseRequestId(id) {
    document.getElementById('expense-request-id').value = id;
}

// Função para definir o ID da solicitação de despesa no modal de rejeição
function setRejectionExpenseRequestId(id) {
    document.getElementById('rejection-expense-request-id').value = id;
} 