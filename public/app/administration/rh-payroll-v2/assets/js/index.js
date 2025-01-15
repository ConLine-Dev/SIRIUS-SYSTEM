import { makeRequest, showToast } from './modules/utils.js';
// Variável para armazenar a instância do DataTable
let discountTable;

// Cache de descontos
let discounts = [];

const socket = io();

socket.on('updateDiscounts', (data) => {
    discountTable.ajax.reload(null, false);
});

function toggleFilters() {
    const content = document.getElementById('content');
    const sidebar = document.getElementById('sidebar');

    content.classList.toggle('active');
    sidebar.classList.toggle('active');
}

// Função para abrir a janela de adicionar desconto
function openAddDiscountWindow() {
    const width = 800;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open('./pages/add-discount.html', 'AddDiscount',
        `width=${width},height=${height},left=${left},top=${top}`);
}

// Função para abrir a janela de adicionar desconto em lote
function openAddBatchDiscountWindow() {
    const width = 800;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open('./pages/add-batch-discount.html', 'AddBatchDiscount',
        `width=${width},height=${height},left=${left},top=${top}`);
}

// Inicializa os event listeners
function initializeEventListeners() {
    // Botão de adicionar desconto individual
    const addButton = document.getElementById('btn-add-discount');
    if (addButton) {
        addButton.addEventListener('click', openAddDiscountWindow);
    }

    // Botão de adicionar desconto em lote
    const addBatchButton = document.getElementById('btn-batch-discount');
    if (addBatchButton) {
        addBatchButton.addEventListener('click', openAddBatchDiscountWindow);
    }

    // Botão de alternar filtros
    const toggleFiltersButton = document.getElementById('sidebarToggle');
    if (toggleFiltersButton) {
        toggleFiltersButton.addEventListener('click', toggleFilters);
    }

    // Botão de fechar filtros
    const sidebarCloseButton = document.getElementById('sidebarClose');
    if (sidebarCloseButton) {
        sidebarCloseButton.addEventListener('click', toggleFilters);
    }
}

// Inicializa a tabela de descontos
async function initializeDataTable() {
    discountTable = new DataTable('#discount-list', {
        ajax: {
            url: '/api/rh-payroll/discount/list',
            method: 'GET',
            dataSrc: 'data'
        },
        columns: [
            { 
                data: 'reference_month',
                render: function(data) {
                    return new Date(data).toLocaleDateString('pt-BR', { 
                        month: 'long', 
                        year: 'numeric' 
                    });
                }
            },
            { data: 'collaborator_name' },
            { data: 'category_name' },
            { 
                data: 'amount',
                render: function(data) {
                    return new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                    }).format(data);
                }
            },
            { data: 'description' },
            {
                data: 'attachment_path',
                render: (data) => {
                    if (!data) return '-';
                    const icon = data.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' :
                               data.toLowerCase().endsWith('.doc') || data.toLowerCase().endsWith('.docx') ? 'fa-file-word' :
                               data.match(/\.(jpg|jpeg|png)$/i) ? 'fa-file-image' : 'fa-file';
                    return `
                        <button class="btn btn-sm btn-link view-attachment" onclick="window.open('/api/rh-payroll/view-file/${data}', '_blank', 'width=800,height=600,resizable=yes')">
                            <i class="fas ${icon}"></i>
                        </button>
                    `;
                }
            },
            { 
                data: 'status',
                render: function(data) {
                    const statusClasses = {
                        'pending': 'badge bg-warning',
                        'processed': 'badge bg-success',
                        'cancelled': 'badge bg-danger'
                    };
                    const statusLabels = {
                        'pending': 'Pendente',
                        'processed': 'Processado',
                        'cancelled': 'Cancelado'
                    };
                    return `<span class="${statusClasses[data]}">${statusLabels[data]}</span>`;
                }
            },
            { 
                data: 'processing_date',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
                }
            },
            {
                data: 'processed_by_name',
                defaultContent: '-'
            },
            {
                data: null,
                orderable: false,
                render: function(data) {
                    console.log(data)
                    const buttons = [];
                    
                    // Botão de visualizar
                    buttons.push(`
                        <button type="button" class="btn btn-sm btn-info btn-view" 
                            data-bs-toggle="tooltip" title="Visualizar">
                            <i class="bi bi-eye"></i>
                        </button>
                    `);

                    // Botão de editar (apenas para pendentes)
                    if (data.status === 'pending') {
                        buttons.push(`
                            <button type="button" class="btn btn-sm btn-primary btn-edit"
                                data-bs-toggle="tooltip" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                        `);
                    }

                    // Botão de cancelar (apenas para pendentes)
                    if (data.status === 'pending') {
                        buttons.push(`
                            <button type="button" class="btn btn-sm btn-danger btn-cancel"
                                data-bs-toggle="tooltip" title="Cancelar">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        `);
                    }

                    return buttons.join(' ');
                }
            }
        ],
        order: [[0, 'desc'], [1, 'asc']],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
        }
    });

    // Adiciona listeners para os botões de ação
    $('#discount-list').on('click', '.btn-view', function() {
        const data = discountTable.row($(this).closest('tr')).data();
        viewDiscount(data);
    });

    $('#discount-list').on('click', '.btn-edit', function() {
        const data = discountTable.row($(this).closest('tr')).data();
        editDiscount(data);
    });

    $('#discount-list').on('click', '.btn-cancel', async function() {
        const data = discountTable.row($(this).closest('tr')).data();
        console.log(data)
        if (confirm('Tem certeza que deseja cancelar este desconto?')) {
            try {
                const response = await makeRequest('/api/rh-payroll/discount/cancel', 'POST', {
                    id: data.id
                });

                if (response.success) {
                    showToast('success', 'Desconto cancelado com sucesso!');
                    discountTable.ajax.reload();
                } else {
                    throw new Error(response.message || 'Erro ao cancelar desconto');
                }
            } catch (error) {
                console.error('Erro:', error);
                showToast('error', error.message || 'Erro ao cancelar desconto');
            }
        }
    });
}




// Funções para manipular descontos
async function viewDiscount(data) {
    // Implementar visualização detalhada do desconto
    console.log('Visualizar desconto:', data);
}

async function editDiscount(data) {
    // Implementar edição do desconto
    console.log('Editar desconto:', data);
}

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    initializeEventListeners();
    initializeDataTable();
    document.querySelector('#loader2').classList.add('d-none');
});