const table = [];

// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {
    // Carrega as tabelas
    await loadCostCentersTable();
    await loadExpenseRequestsTable();

    // Configura o socket para atualizações em tempo real
    const socket = io();

    // Atualiza as tabelas quando houver mudanças nos dados
    socket.on('updateCostCenters', (data) => {
        $('#cost-centers-table').DataTable().ajax.reload(null, false);
    });

    socket.on('updateExpenseRequests', (data) => {
        $('#expense-requests-table').DataTable().ajax.reload(null, false);
        // Atualizar o contador de aprovações quando houver novas solicitações ou mudanças
        updatePendingApprovalsCount();
    });

    // Verifica as aprovações pendentes e atualiza o contador
    await updatePendingApprovalsCount();
    
    // Configurar atualização periódica da contagem de aprovações pendentes (a cada 60 segundos)
    setInterval(updatePendingApprovalsCount, 60000);

    // Remove o loader quando a página estiver carregada
    document.querySelector('#loader2').classList.add('d-none');
});

// Obtém as informações do usuário logado do localStorage
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
}

// Função para atualizar o contador de aprovações pendentes
async function updatePendingApprovalsCount() {
    try {
        const userLogged = await getInfosLogin();
        const response = await fetch(`/api/zero-based-budgeting/getPendingApprovalsCount?id_collaborator=${userLogged.system_collaborator_id}`);
        const data = await response.json();
        
        const badgeElement = document.getElementById('pending-approvals-badge');
        if (badgeElement) {
            if (data.count > 0) {
                // Mostrar e atualizar o badge com o número de aprovações pendentes
                badgeElement.textContent = data.count;
                badgeElement.style.display = 'inline-block';
            } else {
                // Esconder o badge se não houver aprovações pendentes
                badgeElement.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Erro ao buscar contagem de aprovações pendentes:', error);
    }
}

// Função para carregar a tabela de Centros de Custo
async function loadCostCentersTable() {
    const userLogged = await getInfosLogin();

    // Inicializa a tabela de centros de custo
    $('#cost-centers-table').DataTable({
        dom: 'frti',
        paging: false,
        scrollY: 'calc(100vh - 650px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        responsive: true,
        lengthChange: false,
        info: false,
        order: [[0, 'asc']],
        ajax: {
            url: `/api/zero-based-budgeting/getAllCostCenters?id_collaborator=${userLogged.system_collaborator_id}`,
            dataSrc: ''
        },
        columns: [
            { data: 'name' },
            { data: 'responsibleName' },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <div class="hstack gap-2 fs-15">
                            <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-info-transparent rounded-pill" onclick="openCostCenter(${row.id})" title="Visualizar">
                                <i class="ri-eye-line"></i>
                            </a>
                            <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-primary-transparent rounded-pill" onclick="openCostCenterEdit(${row.id})" title="Editar">
                                <i class="ri-edit-line"></i>
                            </a>
                            <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-danger-transparent rounded-pill" onclick="confirmarDelecaoCostCenter(${row.id})" title="Excluir">
                                <i class="ri-delete-bin-line"></i>
                            </a>
                        </div>
                    `;
                },
                orderable: false
            },
        ],
        createdRow: function(row, data, dataIndex) {
            $(row).css('cursor', 'pointer');
            $(row).on('dblclick', function() {
                openCostCenter(data.id);
            });
        },
        language: {
            url: '../../assets/libs/datatables/pt-br.json',
            searchPlaceholder: 'Buscar centro de custo...',
            search: ''
        }
    });
}

// Função para carregar a tabela de Solicitações de Gastos
async function loadExpenseRequestsTable() {
    const userLogged = await getInfosLogin();

    // Inicializa a tabela de solicitações de gastos
    $('#expense-requests-table').DataTable({
        dom: 'frti',
        paging: false,
        scrollY: 'calc(100vh - 220px)',  // Ajusta a altura para ocupar o espaço restante
        scrollCollapse: false,  // Permite que a tabela se ajuste ao conteúdo
        responsive: true,
        lengthChange: false,
        info: false,
        order: [[2, 'desc']],
        ajax: {
            url: `/api/zero-based-budgeting/getAllExpenseRequests?id_collaborator=${userLogged.system_collaborator_id}`,
            dataSrc: ''
        },
        columns: [
            { data: 'costCenterName' },
            { 
                data: 'amount',
                render: function(data) {
                    // Se o valor já vier formatado (como string contendo R$)
                    if (typeof data === 'string' && data.includes('R$')) {
                        return data;
                    }
                    
                    // Caso contrário, tenta formatar o valor
                    try {
                        // Verifica se é um número válido antes de formatar
                        if (data === null || data === undefined || isNaN(parseFloat(data))) {
                            return 'R$ 0,00'; // Valor padrão para dados inválidos
                        }
                        // Converte para número e formata
                        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(data));
                    } catch (error) {
                        console.error('Erro ao formatar valor:', error);
                        return 'R$ 0,00';
                    }
                }
            },
            { 
                data: 'status',
                render: function(data) {
                    // let badgeClass = '';
                    // switch(data.toLowerCase()) {
                    //     case 'aprovado':
                    //         badgeClass = 'badge bg-success-transparent';
                    //         break;
                    //     case 'pendente':
                    //         badgeClass = 'badge bg-warning-transparent';
                    //         break;
                    //     case 'reprovado':
                    //         badgeClass = 'badge bg-danger-transparent';
                    //         break;
                    //     default:
                    //         badgeClass = 'badge bg-info-transparent';
                    // }
                    return data;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <div class="hstack gap-2 fs-15">
                            <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-info-transparent rounded-pill" onclick="openExpenseRequestView(${row.id})" title="Visualizar">
                                <i class="ri-eye-line"></i>
                            </a>
                            <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-primary-transparent rounded-pill" onclick="openExpenseRequestEdit(${row.id})" title="Editar">
                                <i class="ri-edit-line"></i>
                            </a>
                            <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-danger-transparent rounded-pill" onclick="confirmarDelecaoExpenseRequest(${row.id})" title="Excluir">
                                <i class="ri-delete-bin-line"></i>
                            </a>
                        </div>
                    `;
                },
                orderable: false
            },
        ],
        createdRow: function(row, data, dataIndex) {
            $(row).css('cursor', 'pointer');
            $(row).on('dblclick', function() {
                openExpenseRequestView(data.id);
            });
        },
        language: {
            url: '../../assets/libs/datatables/pt-br.json',
            searchPlaceholder: 'Buscar solicitação...',
            search: ''
        }
    });
}

// Funções para manipulação de Centros de Custo
function openCreateCostCenter() {
    const url = '/app/administration/zero-based-budgeting/create-cost-center';
    const windowFeatures = 'width=1000,height=600,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}

function openCategories() {
    const url = '/app/administration/zero-based-budgeting/categories';
    const windowFeatures = 'width=1000,height=600,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}


async function openCostCenter(id) {
    const url = `/app/administration/zero-based-budgeting/view-cost-center?id=${id}`;
    const windowFeatures = 'width=1000,height=600,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}

async function openCostCenterEdit(id) {
    const url = `/app/administration/zero-based-budgeting/edit-cost-center?id=${id}`;
    const windowFeatures = 'width=1000,height=600,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}

function confirmarDelecaoCostCenter(id) {
    Swal.fire({
        title: 'Tem certeza?',
        text: "Deseja realmente deletar este centro de custo?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, deletar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/api/zero-based-budgeting/deleteCostCenter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: id })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    Swal.fire(
                        'Deletado!',
                        'Centro de custo excluído com sucesso!',
                        'success'
                    );
                    
                    // Atualizar a tabela
                    $('#cost-centers-table').DataTable().ajax.reload(null, false);
                } else {
                    Swal.fire(
                        'Erro!',
                        result.message || 'Ocorreu um erro ao excluir o centro de custo.',
                        'error'
                    );
                }
            } catch (error) {
                console.error('Erro ao excluir centro de custo:', error);
                Swal.fire(
                    'Erro!',
                    'Ocorreu um erro ao excluir o centro de custo.',
                    'error'
                );
            }
        }
    });
}

// Funções para manipulação de Solicitações de Gastos
function openCreateExpenseRequest() {
    const url = '/app/administration/zero-based-budgeting/create-expense-request';
    const windowFeatures = 'width=1000,height=800,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}

async function openExpenseRequestView(id) {
    const url = `/app/administration/zero-based-budgeting/view-expense-request?id=${id}`;
    const windowFeatures = 'width=1000,height=700,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}

async function openExpenseRequestEdit(id) {
    const url = `/app/administration/zero-based-budgeting/edit-expense-request?id=${id}`;
    const windowFeatures = 'width=1000,height=800,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}

function confirmarDelecaoExpenseRequest(id) {
    Swal.fire({
        title: 'Tem certeza?',
        text: "Deseja realmente deletar esta solicitação de gasto?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, deletar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/api/zero-based-budgeting/deleteExpenseRequest', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: id })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    Swal.fire(
                        'Deletado!',
                        'Solicitação excluída com sucesso!',
                        'success'
                    );
                    
                    // Atualizar a tabela
                    $('#expense-requests-table').DataTable().ajax.reload(null, false);
                } else {
                    Swal.fire(
                        'Erro!',
                        result.message || 'Ocorreu um erro ao excluir a solicitação.',
                        'error'
                    );
                }
            } catch (error) {
                console.error('Erro ao excluir solicitação:', error);
                Swal.fire(
                    'Erro!',
                    'Ocorreu um erro ao excluir a solicitação.',
                    'error'
                );
            }
        }
    });
}

// Funções para as páginas de relatórios
function openReportByCostCenter() {
    const url = '/app/administration/zero-based-budgeting/report-by-cost-center';
    const windowFeatures = 'width=1200,height=800,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}

function openReportByStatus() {
    const url = '/app/administration/zero-based-budgeting/report-by-status';
    const windowFeatures = 'width=1200,height=800,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}

function openReportByMonth() {
    const url = '/app/administration/zero-based-budgeting/report-by-month';
    const windowFeatures = 'width=1200,height=800,resizable=yes';
    window.open(url, '_blank', windowFeatures);
}

// Função para abrir a página de aprovações pendentes
function openApprovalPage() {
    const url = '/app/administration/zero-based-budgeting/pending-approvals';
    const windowFeatures = 'width=1200,height=800,resizable=yes';
    window.open(url, '_blank', windowFeatures);
} 