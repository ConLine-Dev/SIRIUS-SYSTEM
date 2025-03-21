// Script para a página de gerenciamento de categorias
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar DataTable
    initializeCategoriesTable();
    
    // Configurar os eventos de botões
    setupEventListeners();
    
    // Esconder o loader quando tudo estiver carregado
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('d-none');
    }
});

// Inicializar a tabela de categorias com DataTables
function initializeCategoriesTable() {
    const categoriesTable = $('#categories-table').DataTable({
        dom: 'frtip',
        paging: true,
        pageLength: 10,
        responsive: true,
        lengthChange: false,
        info: true,
        order: [[0, 'asc']],
        ajax: {
            url: '/api/zero-based-budgeting/getAllCategories',
            dataSrc: 'data'
        },
        columns: [
            { data: 'id' },
            { data: 'name' },
            { 
                data: 'description',
                render: function(data) {
                    return data || '<em>Sem descrição</em>';
                }
            },
            { 
                data: 'active',
                render: function(data) {
                    return data ? 
                        '<span class="badge bg-success">Ativo</span>' : 
                        '<span class="badge bg-danger">Inativo</span>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <div class="hstack gap-2 fs-15">
                            <button class="btn btn-icon btn-sm btn-info-transparent rounded-pill edit-btn" data-id="${row.id}">
                                <i class="ri-edit-line"></i>
                            </button>
                            <button class="btn btn-icon btn-sm btn-danger-transparent rounded-pill delete-btn" data-id="${row.id}">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    `;
                }
            },
        ],
        language: {
            url: '../../assets/libs/datatables/pt-br.json',
            search: '',
            searchPlaceholder: 'Buscar categoria...'
        }
    });
    
    // Guardar a referência da tabela para uso global
    window.categoriesTable = categoriesTable;
}

// Configurar os event listeners da página
function setupEventListeners() {
    // Botão para abrir o modal de nova categoria
    document.getElementById('add-category-btn').addEventListener('click', () => {
        resetCategoryModal();
        document.getElementById('categoryModalLabel').textContent = 'Nova Categoria';
        const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
        modal.show();
    });

    // Botão para salvar categoria
    document.getElementById('save-category-btn').addEventListener('click', saveCategory);

    // Delegar eventos para botões de edição e exclusão que são adicionados dinamicamente
    document.getElementById('categories-table').addEventListener('click', event => {
        // Botão de edição
        if (event.target.closest('.edit-btn')) {
            const button = event.target.closest('.edit-btn');
            const id = button.dataset.id;
            editCategory(id);
        }
        
        // Botão de exclusão
        if (event.target.closest('.delete-btn')) {
            const button = event.target.closest('.delete-btn');
            const id = button.dataset.id;
            deleteCategory(id);
        }
    });

    // Socket.io para atualizações em tempo real
    const socket = io();
    
    socket.on('category-updated', () => {
        // Recarregar dados da tabela quando houver alterações
        $('#categories-table').DataTable().ajax.reload();
    });
}

// Resetar o modal para adicionar nova categoria
function resetCategoryModal() {
    document.getElementById('categoryModalLabel').textContent = 'Nova Categoria';
    document.getElementById('category-id').value = '';
    document.getElementById('category-name').value = '';
    document.getElementById('category-description').value = '';
    document.getElementById('category-active').checked = true;
}

// Carregar os dados de uma categoria para edição
async function editCategory(id) {
    try {
        // Obter os dados da categoria
        const response = await fetch(`/api/zero-based-budgeting/getCategoryById?id=${id}`);
        const result = await response.json();
        
        if (!result.success) {
            showAlert('Erro', result.message || 'Falha ao carregar os dados da categoria', 'error');
            return;
        }
        
        const category = result.data;
        
        // Preencher o modal com os dados
        document.getElementById('categoryModalLabel').textContent = 'Editar Categoria';
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-description').value = category.description || '';
        document.getElementById('category-active').checked = category.active;
        
        // Exibir o modal
        const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao carregar categoria:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar os dados da categoria', 'error');
    }
}

// Salvar ou atualizar uma categoria
async function saveCategory() {
    try {
        // Obter os dados do formulário
        const id = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value.trim();
        const description = document.getElementById('category-description').value.trim();
        const active = document.getElementById('category-active').checked;
        
        // Validar dados
        if (!name) {
            showAlert('Erro', 'O nome da categoria é obrigatório', 'error');
            return;
        }
        
        // Exibir loader
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.classList.remove('d-none');
        }
        
        let url, method;
        
        if (id) {
            // Atualizar categoria existente
            url = '/api/zero-based-budgeting/updateCategory';
            method = 'POST';
        } else {
            // Criar nova categoria
            url = '/api/zero-based-budgeting/createCategory';
            method = 'POST';
        }
        
        // Enviar requisição
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id,
                name,
                description,
                active
            })
        });
        
        const result = await response.json();
        
        // Esconder loader
        if (loader) {
            loader.classList.add('d-none');
        }
        
        if (result.success) {
            // Fechar o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
            modal.hide();
            
            // Recarregar a tabela
            if (window.categoriesTable) {
                window.categoriesTable.ajax.reload();
            }
            
            // Exibir mensagem de sucesso
            showAlert('Sucesso', id ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!', 'success');
        } else {
            showAlert('Erro', result.message || 'Falha ao salvar a categoria', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        showAlert('Erro', 'Ocorreu um erro ao salvar a categoria', 'error');
        
        // Esconder loader em caso de erro
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.classList.add('d-none');
        }
    }
}

// Confirmar e excluir uma categoria
async function deleteCategory(id) {
    try {
        // Pedir confirmação do usuário
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Esta ação pode não ser reversível se a categoria não estiver em uso.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        });
        
        if (!result.isConfirmed) {
            return;
        }
        
        // Exibir loader
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.classList.remove('d-none');
        }
        
        // Enviar requisição de exclusão
        const response = await fetch('/api/zero-based-budgeting/deleteCategory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id })
        });
        
        const data = await response.json();
        
        // Esconder loader
        if (loader) {
            loader.classList.add('d-none');
        }
        
        if (data.success) {
            // Recarregar a tabela
            if (window.categoriesTable) {
                window.categoriesTable.ajax.reload();
            }
            
            // Exibir mensagem de sucesso
            showAlert('Sucesso', data.message, 'success');
        } else {
            showAlert('Erro', data.message || 'Falha ao excluir a categoria', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showAlert('Erro', 'Ocorreu um erro ao excluir a categoria', 'error');
        
        // Esconder loader em caso de erro
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.classList.add('d-none');
        }
    }
}

// Exibir alerta com SweetAlert2
function showAlert(title, message, icon) {
    Swal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonText: 'OK'
    });
} 