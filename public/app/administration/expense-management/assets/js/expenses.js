// Variável global para armazenar a tabela de despesas
const table = [];

// Evento disparado quando o documento é completamente carregado
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar socket para atualizações em tempo real
    const socket = io();

    // Recarregar tabela quando houver atualização
    socket.on('updateExpenses', (data) => {
        table['table_expenses'].ajax.reload(null, false);
    });

    // Carregar departamentos
    loadDepartments();

    // Gerar tabela de despesas
    await generateTable();

    // Configurar filtros
    setupFilters();

    // Esconder loader
    document.querySelector('#loader').classList.add('d-none');
});

// Função para carregar departamentos
function loadDepartments() {
    $.ajax({
        url: `/api/expense-management/departments`,
        method: 'GET',
        success: function(departments) {
            const $departmentSelect = $('#department, #departmentFilter');
            $departmentSelect.empty().append('<option value="">Todos Departamentos</option>');
            
            departments.forEach(function(department) {
                $departmentSelect.append(`<option value="${department.id}">${department.name}</option>`);
            });
        },
        error: function(xhr) {
            console.error('Erro ao carregar departamentos:', xhr.responseText);
        }
    });
}

// Função para configurar filtros
function setupFilters() {
    // Filtro de departamento
    $('#departmentFilter').on('change', function() {
        applyFilters();
    });

    // Filtro de status
    $('#statusFilter').on('change', function() {
        applyFilters();
    });

    // Filtro de mês
    $('#monthFilter').on('change', function() {
        applyFilters();
    });
}

// Função para aplicar filtros na tabela
function applyFilters() {
    // Obter o valor do mês selecionado
    const selectedMonth = $('#monthFilter').val();
    
    // Preparar filtros
    const filters = {
        department_id: $('#departmentFilter').val(),
        status: $('#statusFilter').val()
    };

    // Adicionar filtro de data se um mês foi selecionado
    if (selectedMonth) {
        // Criar objeto Date para o primeiro e último dia do mês selecionado
        const [year, month] = selectedMonth.split('-');
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);

        // Formatar datas no formato ISO (YYYY-MM-DD)
        filters.start_date = firstDay.toISOString().split('T')[0];
        filters.end_date = lastDay.toISOString().split('T')[0];
    }

    // Converter filtros em parâmetros de URL
    const queryParams = new URLSearchParams(filters).toString();
    
    // Recarregar tabela com filtros
    table['table_expenses'].ajax.url(`/api/expense-management/expenses?${queryParams}`).load();
}

// Mapeamento de frequências
const FREQUENCY_MAP = {
    'single': 'Único',
    'monthly': 'Mensal',
    'yearly': 'Anual'
};

// Função para obter nome da frequência
function getFrequencyName(frequencyId) {
    return FREQUENCY_MAP[frequencyId] || 'Não definido';
}

// Função para gerar/recarregar tabela de despesas
async function generateTable() {
    // Destruir tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#expensesTable')) {
        $('#expensesTable').DataTable().destroy();
    }

    // Criar nova tabela com dados da API
    table['table_expenses'] = $('#expensesTable').DataTable({
        dom: 'frtip',
        paging: false,
        fixedHeader: true,
        info: false,
        scrollY: 'calc(100vh - 240px)',
        scrollCollapse: false,
        order: [[0, 'asc']],
        ajax: {
            url: `/api/expense-management/expenses`,
            dataSrc: ''
        },
        columns: [
            { data: 'id' },
            { data: 'description' },
            { 
                data: 'amount',
                render: function(data) {
                    return `R$ ${parseFloat(data).toFixed(2).replace('.', ',')}`;
                }
            },
            { 
                data: 'payment_date',
                render: function(data) {
                    return formatDateBR(data);
                }
            },
            { data: 'department_name' },
            { 
                data: 'frequency',
                render: function(data) {
                    return getFrequencyName(data);
                }
            },
            { 
                data: 'status',
                render: function(data, type, row) {
                    const statusMap = {
                        'pending': row.days_overdue > 0 
                            ? `<span class="badge bg-soft-danger text-danger">Pendente (${row.days_overdue} dias em atraso)</span>`
                            : '<span class="badge bg-soft-warning text-warning">Pendente</span>',
                        'paid': '<span class="badge bg-soft-success text-success">Pago</span>',
                        'approved': '<span class="badge bg-soft-success text-success">Aprovado</span>',
                        'rejected': '<span class="badge bg-soft-danger text-danger">Rejeitado</span>'
                    };
                    return statusMap[data] || `<span class="badge bg-soft-secondary text-secondary">${data}</span>`;
                }
            },
            {
                data: null,
                render: function(data, type, row) {
                    // Desabilitar botão de marcar como pago se já estiver pago
                    const isPaidDisabled = row.status === 'paid' ? 'disabled' : '';
                    
                    return `
                        <div class="d-flex gap-2 justify-content-center">
                            <button 
                                class="btn btn-sm ${isPaidDisabled ? 'btn-outline-secondary' : 'btn-outline-primary'} d-flex align-items-center justify-content-center" 
                                title="Editar" 
                                onclick="editExpense(${row.id})"
                                ${isPaidDisabled}>
                                <i class="ri-edit-line fs-6"></i>
                            </button>
                            <button 
                                class="btn btn-sm ${isPaidDisabled ? 'btn-outline-secondary' : 'btn-outline-danger'} d-flex align-items-center justify-content-center" 
                                title="Deletar" 
                                onclick="confirmDelete(${row.id})"
                                ${isPaidDisabled}>
                                <i class="ri-delete-bin-line fs-6"></i>
                            </button>
                            <button 
                                class="btn btn-sm ${row.status === 'paid' ? 'btn-outline-secondary' : 'btn-outline-success'} d-flex align-items-center justify-content-center" 
                                title="Marcar como Pago" 
                                onclick="markAsPaid(${row.id})"
                                ${isPaidDisabled}>
                                <i class="ri-check-line fs-6"></i>
                            </button>
                        </div>
                    `;
                },
                orderable: false,
                width: '50px',
                className: 'text-center'
            }
        ],
        createdRow: function(row, data, dataIndex) {
            // Adicionar atributo com ID da despesa
            $(row).attr('expense-id', data.id);
            
            // Adicionar evento de duplo clique para abrir detalhes
            $(row).on('dblclick', async function() {
                const expenseId = $(this).attr('expense-id');
                await openExpenseDetails(expenseId);
            });
        },
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        }
    });

    // Evento após carregar dados via AJAX
    table['table_expenses'].on('xhr.dt', function() {
        // Foco no campo de pesquisa
        document.querySelector('#expensesTable_filter input').focus();
    });
}

// Função para adicionar nova despesa
function addExpense() {
    const body = {
        url: '/app/administration/expense-management/create',
        width: 1000,
        height: 640,
        resizable: false
    };
    window.ipcRenderer.invoke('open-exWindow', body);
}

// Função para editar despesa
function editExpense(id) {
    const body = {
        url: `/app/administration/expense-management/edit?id=${id}`,
        width: 1000,
        height: 640,
        resizable: false
    };
    window.ipcRenderer.invoke('open-exWindow', body);
}

// Função para visualizar detalhes da despesa
async function openExpenseDetails(id) {
    const body = {
        url: `/app/administration/expense-management/view?id=${id}`,
        width: 500,
        height: 420,
        resizable: false,
        alwaysOnTop: true
    };
    window.ipcRenderer.invoke('open-exWindow', body);
}

// Função para confirmar exclusão
function confirmDelete(id) {
    // Mostrar toast de confirmação
    showToast('Tem certeza que deseja excluir o registro selecionado?', 'warning');
    setTimeout(() => {
        if (confirm('Tem certeza que deseja excluir o registro selecionado?')) {
            deleteExpense(id);
        }
    }, 3000);
}

// Função para deletar despesa
async function deleteExpense(id) {
    try {
        const response = await makeRequest('/api/expense-management/expenses/delete', 'POST', { id: id });
        
        // Recarregar tabela após exclusão
        table['table_expenses'].ajax.reload(null, false);
        
        showToast('Despesa excluída com sucesso', 'success');
    } catch (error) {
        showToast('Não foi possível excluir o registro', 'error');
    }
}

// Função para marcar despesa como paga
async function markAsPaid(id) {
    try {
        const response = await $.ajax({
            url: `/api/expense-management/expenses/${id}/mark-paid`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                payment_date: new Date().toISOString().split('T')[0]
            })
        });
        
        // Recarregar tabela após marcar como pago
        table['table_expenses'].ajax.reload(null, false);
        
        showToast('Despesa marcada como paga com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao marcar despesa como paga:', error);
        
        showToast('Não foi possível marcar a despesa como paga', 'error');
    }
}

// Função auxiliar para fazer requisições
async function makeRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: resolve,
            error: reject
        });
    });
}

// Função para formatar data
function formatDateBR(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

// Função para adicionar nova despesa
function addExpense(expenseData) {
    $.ajax({
        url: `/api/expense-management/expenses`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(expenseData),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept'
        },
        success: function(response) {
            $('#expenseModal').modal('hide');
            showToast('Despesa adicionada com sucesso', 'success');
            table['table_expenses'].ajax.reload(null, false);
        },
        error: function(xhr) {
            showToast('Erro ao adicionar despesa', 'error');
        }
    });
}

// Função para atualizar despesa
function updateExpense(id, expenseData) {
    $.ajax({
        url: `/api/expense-management/expenses/${id}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(expenseData),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept'
        },
        success: function(response) {
            $('#expenseModal').modal('hide');
            showToast('Despesa atualizada com sucesso', 'success');
            table['table_expenses'].ajax.reload(null, false);
        },
        error: function(xhr) {
            showToast('Erro ao atualizar despesa', 'error');
        }
    });
}

// Função para excluir despesa
function deleteExpense(id) {
    $.ajax({
        url: `/api/expense-management/expenses/${id}`,
        method: 'DELETE',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept'
        },
        success: function(response) {
            showToast('Despesa excluída com sucesso', 'success');
            table['table_expenses'].ajax.reload(null, false);
        },
        error: function(xhr) {
            showToast('Erro ao excluir despesa', 'error');
        }
    });
}

// Função para mostrar toast
function showToast(message, type = 'success') {
    // Mapear tipos de toast
    const toastTypes = {
        'success': 'bg-success',
        'error': 'bg-danger',
        'warning': 'bg-warning',
        'info': 'bg-info'
    };

    // Verificar se Bootstrap está disponível
    if (typeof bootstrap === 'undefined') {
        console.warn('Bootstrap não carregado, usando fallback de notificação');
        alert(message);
        return;
    }

    // Criar elemento do toast
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toastElement = document.createElement('div');
    toastElement.classList.add('toast', toastTypes[type] || toastTypes['success']);
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
        <div class="toast-body">
            ${message}
        </div>
    `;

    // Adicionar toast ao container
    toastContainer.appendChild(toastElement);

    // Inicializar e mostrar toast
    try {
        const toastInstance = new bootstrap.Toast(toastElement, {
            delay: 3000
        });
        toastInstance.show();
    } catch (error) {
        console.error('Erro ao criar toast:', error);
        alert(message);
        return;
    }

    // Remover toast após fechar
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Função para criar container de toasts se não existir
function createToastContainer() {
    const container = document.createElement('div');
    container.classList.add('toast-container', 'position-fixed', 'top-0', 'end-0', 'p-3');
    container.style.zIndex = '1200';
    document.body.appendChild(container);
    return container;
}

// Função para preencher o modal de edição
function editExpense(expenseId) {
    // Encontrar a despesa específica na tabela de dados
    const expense = table['table_expenses'].rows().data().toArray().find(item => item.id === expenseId);
    
    if (!expense) {
        showToast('Despesa não encontrada', 'error');
        return;
    }

    // Definir o ID da despesa sendo editada
    editingExpenseId = expenseId;

    // Preencher campos do modal
    $('#description').val(expense.description);
    $('#amount').val(parseFloat(expense.amount).toFixed(2).replace('.', ','));
    
    // Formatar data para input de data (YYYY-MM-DD)
    const formattedDate = expense.payment_date ? 
        new Date(expense.payment_date).toISOString().split('T')[0] : 
        '';
    $('#payment_date').val(formattedDate);

    // Popular dropdown de departamentos
    $('#department').val(expense.department_id);

    // Popular dropdown de status
    $('#status').val(expense.status);

    // Popular dropdown de frequência
    $('#frequency').val(expense.frequency || 'once');

    // Abrir modal
    $('#expenseModal').modal('show');
}

// Eventos de botões
$('#addExpenseBtn').on('click', function() {
    $('#expenseModal .modal-title').text('Adicionar Despesa');
    $('#expenseForm')[0].reset();
    editingExpenseId = null;
    
    // Limpar campos específicos
    $('#description').val('');
    $('#amount').val('');
    $('#payment_date').val('');
    $('#department').val('');
    $('#status').val('pending');
    $('#frequency').val('once');

    // Abrir modal explicitamente
    const expenseModal = new bootstrap.Modal(document.getElementById('expenseModal'));
    expenseModal.show();
});

$('#saveExpenseBtn').on('click', function() {
    const expenseData = {
        description: $('#description').val(),
        amount: parseFloat($('#amount').val().replace(',', '.')).toFixed(2),
        department_id: $('#department').val(),
        payment_date: $('#payment_date').val(),
        status: $('#status').val(),
        frequency: $('#frequency').val()
    };

    if (editingExpenseId) {
        updateExpense(editingExpenseId, expenseData);
    } else {
        addExpense(expenseData);
    }
});

// Evento de edição
$(document).on('click', '.edit-expense', function() {
    const id = $(this).data('id');
    editExpense(id);
});

// Evento de exclusão
$(document).on('click', '.delete-expense', function() {
    const id = $(this).data('id');
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
        deleteExpense(id);
    }
});

// Função para marcar despesa como paga
function markExpenseAsPaid(expenseId) {
    const paymentDate = new Date().toISOString().split('T')[0];
    
    $.ajax({
        url: `/api/expense-management/expenses/${expenseId}/pay`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ payment_date: paymentDate }),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept'
        },
        success: function(response) {
            showToast('Despesa marcada como paga com sucesso', 'success');
            table['table_expenses'].ajax.reload(null, false);
        },
        error: function(xhr) {
            showToast('Erro ao marcar despesa como paga', 'error');
            console.error('Erro:', xhr.responseText);
        }
    });
}

// Função para listar despesas pendentes
function loadPendingExpenses() {
    $.ajax({
        url: `/api/expense-management/expenses/pending`,
        method: 'GET',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept'
        },
        success: function(pendingExpenses) {
            // Renderizar lista de despesas pendentes
            renderPendingExpensesList(pendingExpenses);
        },
        error: function(xhr) {
            showToast('Erro ao carregar despesas pendentes', 'error');
            console.error('Erro:', xhr.responseText);
        }
    });
}

// Renderizar lista de despesas pendentes
function renderPendingExpensesList(pendingExpenses) {
    const $pendingList = $('#pendingExpensesList');
    $pendingList.empty();

    pendingExpenses.forEach(expense => {
        const overdueClass = expense.days_overdue > 0 ? 'text-danger' : 'text-warning';
        const listItem = `
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${expense.name}</h5>
                    <small class="${overdueClass}">
                        ${expense.days_overdue > 0 
                            ? `${expense.days_overdue} dias em atraso` 
                            : 'Próximo vencimento'}
                    </small>
                </div>
                <p class="mb-1">
                    Valor: R$ ${parseFloat(expense.amount).toFixed(2).replace('.', ',')}
                    | Departamento: ${expense.department_name}
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <small>Vencimento: ${formatDateBR(expense.payment_date)}</small>
                    <button 
                        onclick="markExpenseAsPaid(${expense.id})" 
                        class="btn btn-sm btn-success">
                        Marcar como Pago
                    </button>
                </div>
            </div>
        `;
        $pendingList.append(listItem);
    });
}

// Adicionar botão de despesas pendentes no menu ou dashboard
function addPendingExpensesButton() {
    const pendingButton = `
        <button id="pendingExpensesBtn" class="btn btn-warning position-relative">
            Despesas Pendentes
            <span id="pendingExpensesBadge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                0
            </span>
        </button>
    `;
    
    // Adicionar ao local apropriado no seu layout
    $('#expenseActionsContainer').append(pendingButton);

    $('#pendingExpensesBtn').on('click', function() {
        // Abrir modal ou seção de despesas pendentes
        $('#pendingExpensesModal').modal('show');
        loadPendingExpenses();
    });
}

// Adicionar modal para despesas pendentes
function createPendingExpensesModal() {
    const modalHtml = `
        <div class="modal fade" id="pendingExpensesModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Despesas Pendentes</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="pendingExpensesList" class="list-group">
                            <!-- Despesas pendentes serão carregadas aqui -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(modalHtml);
}

// Inicialização
createPendingExpensesModal();
addPendingExpensesButton();
loadDepartments();

document.querySelector('#loader').classList.add('d-none')
