import { loadTypes, makeRequest, showToast } from './modules/utils.js';
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
                    // Split the date string
                    const [year, month] = data.split('-');
                    
                    // Create a Date object (use day 1 to avoid timezone issues)
                    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                    
                    // Format to full month name and year in Portuguese
                    return dateObj.toLocaleDateString('pt-BR', { 
                        month: 'long', 
                        year: 'numeric' 
                    }).replace(/^\w/, (c) => c.toUpperCase());
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

    setupFilterListeners();
}

// Funções para manipular descontos
async function viewDiscount(data) {
    // Implementar visualização detalhada do desconto
    console.log('Visualizar desconto:', data);
    const width = 800;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open('./pages/view-discount?id=' + data.id,
        `width=${width},height=${height},left=${left},top=${top}`);
}

async function editDiscount(data) {
    // Implementar edição do desconto
    console.log('Editar desconto:', data);
    const width = 800;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open('./pages/edit-discount?id=' + data.id,
        `width=${width},height=${height},left=${left},top=${top}`);
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
            if (settings.nTable.id !== 'discount-list') return true;

            console.log('Checking row:', data);

            // Check type filter (if not 'Todos')
            if (filters.type && filters.type !== 'Todos') {
                console.log('Filtering Type - Filter:', filters.type, 'Row Value:', data[2]);
                if (data[2] !== filters.type) {
                    console.log('Type filter failed');
                    return false;
                }
            }

            // Check employee filter
            if (filters.employee) {
                console.log('Filtering Employee - Filter:', filters.employee, 'Row Value:', data[1]);
                if (!data[1].toLowerCase().includes(filters.employee.toLowerCase())) {
                    console.log('Employee filter failed');
                    return false;
                }
            }

            // Check amount filter
            if (filters.amount && parseAmountValue(filters.amount) !== 0) {
                const filterAmount = parseAmountValue(filters.amount);
                const rowAmount = parseAmountValue(data[3]);

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
                const rowMonthParts = data[0].toLowerCase().split(' ');
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
                const statusCell = data[6].toLowerCase(); // index for status
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
        discountTable.draw();
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
        discountTable.draw();

        console.log('Filters cleared');
    });
}

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

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    initializeEventListeners();
    initializeDataTable();
    displayTypes();
    setupCurrencyInput();
    document.querySelector('#loader2').classList.add('d-none');
});