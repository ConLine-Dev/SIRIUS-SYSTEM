$(document).ready(function() {
    showLoader(true);
    const modalElement = document.getElementById('manage-item-modal');
    if (!modalElement) {
        console.error("O elemento do modal #manage-item-modal não foi encontrado.");
        showLoader(false);
        return;
    }
    const manageModal = new bootstrap.Modal(modalElement);

    // Carregar dados iniciais e esconder o loader quando ambos terminarem
    Promise.all([
        loadItems('locations'),
        loadItems('categories')
    ]).finally(() => {
        showLoader(false);
    });

    // --- Event Listeners ---

    // Abrir modal para ADICIONAR
    $('#btn-add-location').click(() => openModal('locations', 'add', null, manageModal));
    $('#btn-add-category').click(() => openModal('categories', 'add', null, manageModal));

    // Abrir modal para EDITAR
    $(document).on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        const type = $(this).data('type');
        openModal(type, 'edit', id, manageModal);
    });

    // DELETAR item
    $(document).on('click', '.btn-delete', function() {
        const id = $(this).data('id');
        const type = $(this).data('type');
        const typeName = type === 'locations' ? 'Localização' : 'Categoria';
        
        if (confirm(`Tem certeza que deseja excluir esta ${typeName}? Esta ação não pode ser desfeita.`)) {
            deleteItem(type, id);
        }
    });

    // Salvar item (Adicionar ou Editar)
    $('#btn-save-item').click(function() {
        const id = $('#item-id').val();
        const type = $('#item-type').val();
        const name = $('#item-name').val();
        const description = $('#item-description').val();

        if (!name || name.trim() === '') {
            showErrorToast('O campo "Nome" é obrigatório.');
            return;
        }

        const data = { name, description };

        if (id) { // Editar
            updateItem(type, id, data, manageModal);
        } else { // Adicionar
            createItem(type, data, manageModal);
        }
    });
});

// --- Funções de Carregamento e CRUD ---

async function loadItems(type) {
    try {
        const items = await makeRequest(`/api/patrimony-tracker/${type}`);
        const tableBody = $(`#${type}-table-body`);
        tableBody.empty();
        if (items.length === 0) {
            const typeName = type === 'locations' ? 'localizações' : 'categorias';
            tableBody.html(`<tr><td colspan="3" class="text-center">Nenhuma ${typeName} encontrada.</td></tr>`);
        } else {
            items.forEach(item => {
                tableBody.append(`
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.description || ''}</td>
                        <td class="text-center">
                            <div class="d-inline-flex flex-nowrap">
                                <button class="btn btn-sm btn-info me-2 btn-edit" data-id="${item.id}" data-type="${type}" title="Editar"><i class="ri-edit-line"></i></button>
                                <button class="btn btn-sm btn-danger btn-delete" data-id="${item.id}" data-type="${type}" title="Excluir"><i class="ri-delete-bin-line"></i></button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    } catch (error) {
        console.error(`Erro ao carregar ${type}:`, error);
        showErrorToast(`Não foi possível carregar os dados de ${type}.`);
    }
}

async function openModal(type, mode, id = null, manageModal) {
    const typeName = type === 'locations' ? 'Localização' : 'Categoria';
    $('#manage-item-form')[0].reset();
    $('#item-type').val(type);

    if (mode === 'add') {
        $('#modal-title').text(`Adicionar Nova ${typeName}`);
        $('#item-id').val('');
        manageModal.show();
    } else { // 'edit'
        showLoader(true);
        try {
            // Assume-se que a API suporta GET /api/patrimony-tracker/{type}/{id}
            const item = await makeRequest(`/api/patrimony-tracker/${type}/${id}`);
            if (item) {
                $('#modal-title').text(`Editar ${typeName}`);
                $('#item-id').val(item.id);
                $('#item-name').val(item.name);
                $('#item-description').val(item.description);
                manageModal.show();
            } else {
                showErrorToast('Item não encontrado.');
            }
        } catch (error) {
            console.error(`Erro ao carregar item para edição:`, error);
            showErrorToast('Não foi possível carregar os dados do item para edição.');
        } finally {
            showLoader(false);
        }
    }
}

async function createItem(type, data, manageModal) {
    showLoader(true);
    try {
        await makeRequest(`/api/patrimony-tracker/${type}`, 'POST', data);
        manageModal.hide();
        await loadItems(type);
        showSuccessToast('Item criado com sucesso!');
    } catch (error) {
        console.error('Erro ao criar item:', error);
        showErrorToast(error.message || 'Erro ao criar o item.');
    } finally {
        showLoader(false);
    }
}

async function updateItem(type, id, data, manageModal) {
    showLoader(true);
    try {
        await makeRequest(`/api/patrimony-tracker/${type}/${id}`, 'PUT', data);
        manageModal.hide();
        await loadItems(type);
        showSuccessToast('Item atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        showErrorToast(error.message || 'Erro ao atualizar o item.');
    } finally {
        showLoader(false);
    }
}

async function deleteItem(type, id) {
    showLoader(true);
    try {
        await makeRequest(`/api/patrimony-tracker/${type}/${id}`, 'DELETE');
        await loadItems(type);
        showSuccessToast('Item excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir item:', error);
        showErrorToast(error.message || 'Erro ao excluir o item. Verifique se ele não está sendo utilizado.');
    } finally {
        showLoader(false);
    }
}

// --- Funções Auxiliares (Loader e Toasts) ---

function showLoader(show) {
    const loader = $('#loader2');
    if (show) {
        loader.show();
    } else {
        loader.fadeOut();
    }
}

function showSuccessToast(message) {
    showToast(message, 'bg-success');
}

function showErrorToast(message) {
    showToast(message, 'bg-danger');
}

function showToast(message, bgClass) {
    // Remover toast anterior para evitar acúmulo
    $('.toast-container').remove();

    const toastIcon = bgClass === 'bg-success' ? 'ri-check-line' : 'ri-error-warning-line';

    const toastHtml = `
        <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1081;">
            <div class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="${toastIcon} me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>
    `;

    $('body').append(toastHtml);

    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
    toast.show();

    // Limpeza do DOM após o toast desaparecer
    toastElement.addEventListener('hidden.bs.toast', function () {
        this.closest('.toast-container').remove();
    });
} 