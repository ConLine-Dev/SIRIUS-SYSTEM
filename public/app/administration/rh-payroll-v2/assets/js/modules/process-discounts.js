import { makeRequest, showToast } from './utils.js';

let discountsTable;
let userLogin;


const socket = io();

socket.on('updateDiscounts', (data) => {
    discountsTable.ajax.reload(null, false);
});


// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await initializeDataTable();
    initializeEventListeners();
    userLogin = await getInfosLogin();
    console.log(userLogin)
    document.querySelector('#loader2').classList.add('d-none');
});


// Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
};



// Inicializa a tabela de descontos
async function initializeDataTable() {
    try {
  
        
        discountsTable = new DataTable('#discounts-table', {
            ajax: {
                url: '/api/rh-payroll/discount/pending',
                method: 'GET',
                dataSrc: 'data'
            },
            columns: [
                {
                    data: null,
                    defaultContent: '',
                    orderable: false,
                    className: 'select-checkbox',
                    render: function() {
                        return '<input type="checkbox" class="form-check-input discount-checkbox">';
                    }
                },
                { data: 'reference_month', 
                  render: function(data) {
                      return new Date(data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
                    data: null,
                    orderable: false,
                    render: function(data) {
                        if (data.status === 'pending') {
                            return `
                                <button type="button" class="btn btn-sm btn-success process-single" data-id="${data.id}" data-type="${data.type}">
                                    <i class="fas fa-cog"></i> Processar
                                </button>`;
                        }
                        return '';
                    }
                }
            ],
            select: {
                style: 'multi',
                selector: 'td:first-child'
            },
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
            }
        });

        // Adiciona listener para atualizar contador de selecionados
        $('#discounts-table').on('change', '.discount-checkbox', updateSelectedCount);
        
        // Adiciona listener para processar desconto individual
        $('#discounts-table').on('click', '.process-single', async function() {
            const id = $(this).data('id');
            const type = $(this).data('type');
            const processed_by = userLogin.system_collaborator_id;


            await processSingleDiscount(id, type, processed_by);
        });

    } catch (error) {
        console.error('Erro ao carregar descontos:', error);
        showToast('error', 'Erro ao carregar descontos');
    }
}

// Atualiza o contador de descontos selecionados
function updateSelectedCount() {
    const selectedCount = document.querySelectorAll('#discounts-table tbody input.discount-checkbox:checked').length;
    const processButton = document.getElementById('process-selected');
    
    if (processButton) {
        processButton.textContent = `Processar Selecionados (${selectedCount})`;
        processButton.disabled = selectedCount === 0;
    }
}

// Processa um único desconto
async function processSingleDiscount(id, type, processed_by) {
    try {
        const data = {
            discounts: [{
                id: id,
                type: type,
                processed_by:processed_by
            }]
        };

        const response = await makeRequest('/api/rh-payroll/discount/process', 'POST', data);

        if (response.success) {
            showToast('success', 'Desconto processado com sucesso!');
        } else {
            throw new Error(response.message || 'Erro ao processar desconto');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('error', error.message || 'Erro ao processar desconto');
    }
}

// Processa todos os descontos pendentes
async function processAllDiscounts() {
    try {
        const response = await makeRequest('/api/rh-payroll/discount/process/all', 'POST');

        if (response.success) {
            showToast('success', 'Todos os descontos foram processados com sucesso!');
        } else {
            throw new Error(response.message || 'Erro ao processar descontos');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('error', error.message || 'Erro ao processar descontos');
    }
}

// Inicializa os event listeners
function initializeEventListeners() {

    const toggleFiltersButton = document.getElementById('sidebarToggle');
    toggleFiltersButton.addEventListener('click', toggleFilters);

    const sidebarCloseButton = document.getElementById('sidebarClose');
    sidebarCloseButton.addEventListener('click', toggleFilters);

    // Botão de processar descontos selecionados
    const processButton = document.getElementById('process-selected');
    if (processButton) {
        processButton.addEventListener('click', processSelectedDiscounts);
    }

    // Botão de processar todos os descontos
    const processAllButton = document.getElementById('process-all');
    if (processAllButton) {
        processAllButton.addEventListener('click', processAllDiscounts);
    }

    // Checkbox de selecionar todos
    const selectAllCheckbox = document.querySelector('#discounts-table thead input[type="checkbox"]');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('#discounts-table tbody input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = this.checked);
            updateSelectedCount();
        });
    }
}

function toggleFilters() {
    const content = document.getElementById('content');
    const sidebar = document.getElementById('sidebar');


    content.classList.toggle('active');
    sidebar.classList.toggle('active');
}

// Processa os descontos selecionados
async function processSelectedDiscounts() {
    try {
        const selectedRows = Array.from(document.querySelectorAll('#discounts-table tbody input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.closest('tr'))
            .map(row => discountsTable.row(row).data());

        if (selectedRows.length === 0) {
            throw new Error('Selecione pelo menos um desconto para processar');
        }

        const data = {
            discounts: selectedRows.map(row => ({
                id: row.id,
                type: row.type === 'individual' ? 'individual' : 'batch'
            }))
        };

        const response = await makeRequest('/api/rh-payroll/discount/process', 'POST', data);

        if (response.success) {
            showToast('success', 'Descontos processados com sucesso!');
       
        } else {
            throw new Error(response.message || 'Erro ao processar descontos');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('error', error.message || 'Erro ao processar descontos');
    }
}
