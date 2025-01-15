import { makeRequest, showToast, loadTypes } from './utils.js';

let discountsTable;
let userLogin;

// Socket.io connection
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

    await displayTypes();
    setupFilterListeners();
    setupCurrencyInput();
    document.querySelector('#loader2').classList.add('d-none');
});

// Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
};


// Função para converter valor formatado para número
function parseAmountValue(formattedValue) {
    // Remove R$, espaços, pontos e substitui vírgula por ponto
    const cleanValue = formattedValue
        .replace('R$', '')
        .replace(/\s/g, '')
        .replace('.', '')
        .replace(',', '.');
    
    // Converte para número
    return parseFloat(cleanValue);
}

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

// Carrega lista de tipos
async function displayTypes() {
    try {
        const types = await loadTypes();

        const selectElement = document.getElementById('filter-type');
        
        // Limpa as opções existentes
        selectElement.innerHTML = '<option value="Todos">Todos</option>';
        
        // Adiciona as novas opções
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name_discount;
            option.textContent = type.name_discount;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar tipos:', error);
    }
}

// Function to convert month name to number (in Portuguese)
function getMonthNumberPtBr(monthName) {
    const monthMapPtBr = {
        'janeiro': '01',
        'fevereiro': '02',
        'março': '03',
        'abril': '04',
        'maio': '05',
        'junho': '06',
        'julho': '07',
        'agosto': '08',
        'setembro': '09',
        'outubro': '10',
        'novembro': '11',
        'dezembro': '12'
    };
    return monthMapPtBr[monthName.toLowerCase().split(' ')[0]];
}


// Add filter functionality to the DataTable
function setupFilterListeners() {
    const filterForm = document.querySelector('.filter-form');
    const filterType = document.getElementById('filter-type');
    const filterEmployee = document.getElementById('filter-employee');
    const filterAmount = document.getElementById('filter-amount');
    const filterMonth = document.getElementById('filter-month');
    const filterDate = document.getElementById('filter-date');
    const filterStatus = document.getElementById('filter-status');
    const applyFilterBtn = filterForm.querySelector('.btn-primary');
    const clearFilterBtn = filterForm.querySelector('.btn-light');

    // Apply filters
    applyFilterBtn.addEventListener('click', function() {
        // Remove all previous custom search filters
        while ($.fn.dataTable.ext.search.length > 0) {
            $.fn.dataTable.ext.search.pop();
        }

        const filters = {
            type: filterType.value,
            employee: filterEmployee.value,
            amount: filterAmount.value,
            month: filterMonth.value,
            date: filterDate.value,
            status: filterStatus.value
        };

        console.log('Applied Filters:', filters);

        // Custom filtering function
        $.fn.dataTable.ext.search.push(function(settings, data) {
            if (settings.nTable.id !== 'discounts-table') return true;

            console.log('Checking row:', data);

            // Check type filter (if not 'Todos')
            if (filters.type && filters.type !== 'Todos') {
                console.log('Filtering Type - Filter:', filters.type, 'Row Value:', data[3]);
                if (data[3] !== filters.type) {
                    console.log('Type filter failed');
                    return false;
                }
            }

            // Check employee filter
            if (filters.employee) {
                console.log('Filtering Employee - Filter:', filters.employee, 'Row Value:', data[2]);
                if (!data[2].toLowerCase().includes(filters.employee.toLowerCase())) {
                    console.log('Employee filter failed');
                    return false;
                }
            }

            // Check amount filter
            if (filters.amount && parseAmountValue(filters.amount) !== 0) {
                const filterAmount = parseAmountValue(filters.amount);
                const rowAmount = parseAmountValue(data[4]);

                console.log('Filtering Amount - Filter:', filterAmount, 'Row Value:', rowAmount);
                
                if (Math.abs(rowAmount - filterAmount) > 0.01) { // Permite pequena variação de ponto flutuante
                    console.log('Amount filter failed');
                    return false;
                }
            }

            // Check reference month filter
            if (filters.month) {
                // Split the month input (e.g., "2025-06")
                const [inputYear, inputMonth] = filters.month.split('-');

                // Parse row's month string
                const rowMonthParts = data[1].toLowerCase().split(' ');
                const rowMonthNumber = getMonthNumberPtBr(rowMonthParts[0]);
                const rowYear = rowMonthParts[2];

                console.log('Filtering Month - Filter:', inputYear, inputMonth, 'Row Value:', rowYear, rowMonthNumber);
                
                if (rowYear !== inputYear || rowMonthNumber !== inputMonth) {
                    console.log('Month filter failed');
                    return false;
                }
            }

            // Check processing date filter
            if (filters.date) {
                // Create date with local timezone at midnight
                const filterProcessingDate = new Date(filters.date + 'T00:00:00');
                
                // Adjust for timezone offset
                const localFilterDate = new Date(
                    filterProcessingDate.getFullYear(), 
                    filterProcessingDate.getMonth(), 
                    filterProcessingDate.getDate()
                );

                // Format to DD/MM/YYYY
                const formattedFilterDate = localFilterDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                // Parse row's processing date (already in DD/MM/YYYY format)
                const rowProcessingDate = data[7];

                console.log('Filtering Processing Date - Filter:', formattedFilterDate, 'Row Value:', rowProcessingDate);
                
                if (rowProcessingDate !== formattedFilterDate) {
                    console.log('Processing Date filter failed');
                    return false;
                }
            }

            // Check status filter (if not 'Todos')
            if (filters.status && filters.status !== 'Todos') {
                const statusCell = data[7].toLowerCase(); // index for status
                const filterStatus = filters.status.toLowerCase();
                console.log('Filtering Status - Filter:', filterStatus, 'Row Value:', statusCell);
                if (statusCell !== filterStatus) {
                    console.log('Status filter failed');
                    return false;
                }
            }

            console.log('Row passed all filters');
            return true;
        });

        // Redraw the table with the new filters
        discountsTable.draw();
    });

    // Clear filters
    clearFilterBtn.addEventListener('click', function() {
        // Reset form
        filterForm.reset();

        // Remove all custom search filters
        while ($.fn.dataTable.ext.search.length > 0) {
            $.fn.dataTable.ext.search.pop();
        }

        // Redraw table
        discountsTable.draw();

        console.log('Filters cleared');
    });
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

// Configura o input de moeda
function setupCurrencyInput() {
    const amountInput = document.getElementById('filter-amount');
    if (!amountInput) return;

    function formatValue(value) {
        // Remove tudo exceto números
        value = value.replace(/\D/g, '');
        
        // Converte para número e divide por 100 para considerar os centavos
        const numericValue = Number(value) / 100;
        
        // Formata com duas casas decimais e vírgula
        return numericValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Define valor inicial
    amountInput.value = formatValue('0');

    amountInput.addEventListener('input', function(e) {
        const value = e.target.value.replace(/\D/g, '');
        if (value === '') {
            e.target.value = formatValue('0');
            return;
        }
        e.target.value = formatValue(value);
    });

    // Seleciona todo o texto quando o input recebe foco
    amountInput.addEventListener('focus', function(e) {
        e.target.select();
    });

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
                type: row.type === 'individual' ? 'individual' : 'batch',
                processed_by: userLogin.system_collaborator_id
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
