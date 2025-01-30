document.addEventListener('DOMContentLoaded', function() {
    // Initialize DataTable
    const expensesTable = $('#expensesTable').DataTable({
        responsive: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/pt-BR.json'
        },
        columns: [
            { data: 'name' },
            { data: 'department' },
            { 
                data: 'amount',
                render: function(data) {
                    return `R$ ${parseFloat(data).toFixed(2)}`;
                }
            },
            { 
                data: 'paymentDate',
                render: function(data) {
                    return new Date(data).toLocaleDateString('pt-BR');
                }
            },
            { 
                data: 'status',
                render: function(data) {
                    const statusClass = data === 'paid' ? 'badge-paid' : 'badge-pending';
                    return `<span class="badge ${statusClass}">${data === 'paid' ? 'Pago' : 'Pendente'}</span>`;
                }
            },
            {
                data: null,
                render: function(data, type, row) {
                    return `
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-info edit-expense" data-id="${row.id}">
                                <i class="ri-edit-line"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-expense" data-id="${row.id}">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });

    // Populate Departments Dropdown
    function populateDepartments() {
        // TODO: Fetch departments from backend
        const departments = [
            { id: 1, name: 'TI' },
            { id: 2, name: 'RH' },
            { id: 3, name: 'Financeiro' },
            { id: 4, name: 'Marketing' }
        ];

        const departmentSelect = document.getElementById('department');
        const departmentFilter = document.getElementById('departmentFilter');

        departments.forEach(dept => {
            const option = new Option(dept.name, dept.id);
            departmentSelect.add(option);

            const filterOption = new Option(dept.name, dept.id);
            departmentFilter.add(filterOption);
        });
    }

    // Add Expense Modal Handling
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const expenseModal = new bootstrap.Modal(document.getElementById('expenseModal'));
    const saveExpenseBtn = document.getElementById('saveExpenseBtn');
    const expenseForm = document.getElementById('expenseForm');

    addExpenseBtn.addEventListener('click', function() {
        expenseForm.reset();
        expenseModal.show();
    });

    saveExpenseBtn.addEventListener('click', function() {
        if (expenseForm.checkValidity()) {
            const expenseData = {
                name: document.getElementById('expenseName').value,
                description: document.getElementById('expenseDescription').value,
                amount: document.getElementById('expenseAmount').value,
                paymentDate: document.getElementById('paymentDate').value,
                status: document.getElementById('paymentStatus').value,
                frequency: document.getElementById('paymentFrequency').value,
                department: document.getElementById('department').value
            };

            // TODO: Send data to backend
            console.log('Expense Data:', expenseData);
            
            // Simulate adding to table
            expensesTable.row.add({
                id: Date.now(),
                ...expenseData
            }).draw(false);

            expenseModal.hide();
        } else {
            expenseForm.reportValidity();
        }
    });

    // Filter Event Listeners
    document.getElementById('departmentFilter').addEventListener('change', function() {
        expensesTable.column(1).search(this.value).draw();
    });

    document.getElementById('statusFilter').addEventListener('change', function() {
        expensesTable.column(4).search(this.value).draw();
    });

    document.getElementById('monthFilter').addEventListener('change', function() {
        const selectedMonth = this.value;
        expensesTable.column(3).search(selectedMonth).draw();
    });

    // Initialize
    populateDepartments();

    document.querySelector('#loader').classList.add('d-none')

});

// Toast Notification Function
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', `text-bg-${type}`);
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type === 'success' ? 'Sucesso' : 'Erro'}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}
