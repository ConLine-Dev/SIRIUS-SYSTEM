// Quando o documento estiver pronto
$(document).ready(function() {
    loadFormOptions();
});

document.addEventListener('DOMContentLoaded', () => {
    loadOptions();
    initializeSocket();
});

function showLoader(show) {
    if (show) {
        $('#loader2').show();
    } else {
        $('#loader2').fadeOut();
    }
}

// Carregar opções para os selects
async function loadFormOptions() {
    showLoader(true);
    try {
        const options = await makeRequest('/api/patrimony-tracker/options');
        
        const locationSelect = $('#item-location');
        locationSelect.empty().append('<option value="">Selecione...</option>');
        options.locations.forEach(location => {
            locationSelect.append(`<option value="${location.id}">${location.name}</option>`);
        });

        const categorySelect = $('#item-category');
        categorySelect.empty().append('<option value="">Selecione...</option>');
        options.categories.forEach(category => {
            categorySelect.append(`<option value="${category.id}">${category.name}</option>`);
        });

        initializeForm();

    } catch (error) {
        console.error('Erro ao carregar opções:', error);
        showErrorToast('Não foi possível carregar as opções do formulário.');
    } finally {
        showLoader(false);
    }
}

// Inicializar formulário
function initializeForm() {
    // Definir data máxima como hoje
    const today = new Date().toISOString().split('T')[0];
    $('#item-acquisition-date').attr('max', today);
    
    // Default para a data de aquisição (hoje)
    $('#item-acquisition-date').val(today);
    
    // Configurar validação do formulário
    $('#create-item-form').on('submit', function(e) {
        e.preventDefault();
        
        // Validar formulário
        if (validateForm()) {
            createItem();
        }
    });
}

// Validar formulário
function validateForm() {
    let isValid = true;
    
    // Validar código
    const code = $('#item-code').val().trim();
    if (!code) {
        $('#item-code').addClass('is-invalid');
        isValid = false;
    } else {
        $('#item-code').removeClass('is-invalid').addClass('is-valid');
    }
    
    // Validar descrição
    const description = $('#item-description').val().trim();
    if (!description) {
        $('#item-description').addClass('is-invalid');
        isValid = false;
    } else {
        $('#item-description').removeClass('is-invalid').addClass('is-valid');
    }
    
    // Validar localização
    const location = $('#item-location').val();
    if (!location) {
        $('#item-location').addClass('is-invalid');
        isValid = false;
    } else {
        $('#item-location').removeClass('is-invalid').addClass('is-valid');
    }
    
    // Validar data de aquisição
    const acquisitionDate = $('#item-acquisition-date').val();
    if (!acquisitionDate) {
        $('#item-acquisition-date').addClass('is-invalid');
        isValid = false;
    } else {
        $('#item-acquisition-date').removeClass('is-invalid').addClass('is-valid');
    }
    
    return isValid;
}

// Remover classes de validação ao interagir com campos
$('.form-control, .form-select').on('input change', function() {
    $(this).removeClass('is-invalid is-valid');
});

// Criar item
async function createItem() {
    // Obter valores do formulário
    const formData = {
        code: $('#item-code').val().trim(),
        description: $('#item-description').val().trim(),
        location_id: $('#item-location').val(),
        category_id: $('#item-category').val(),
        acquisition_date: $('#item-acquisition-date').val(),
        acquisition_value: $('#item-acquisition-value').val() || null,
        notes: $('#item-notes').val().trim()
    };
    
    // Desabilitar botão de submit e mostrar loading
    const submitBtn = $('#create-item-form button[type="submit"]');
    const originalBtnText = submitBtn.html();
    submitBtn.prop('disabled', true);
    submitBtn.html('<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Processando...');
    
    try {
        // Enviar dados para o servidor
        const response = await makeRequest('/api/patrimony-tracker/items', 'POST', formData);
        
        // Mostrar mensagem de sucesso
        showSuccessToast('Item cadastrado com sucesso!');
        
        // Fechar janela após 1 segundo
        setTimeout(() => {
            window.opener.location.reload(); // Recarregar a página principal se existir
            window.close();
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao criar item:', error);
        showErrorToast('Não foi possível cadastrar o item. Tente novamente mais tarde.');
        
        // Restaurar botão
        submitBtn.prop('disabled', false);
        submitBtn.html(originalBtnText);
    }
}

// Função para mostrar toast de sucesso
function showSuccessToast(message) {
    // Remover toast anterior se existir
    $('.toast-container').remove();
    
    const toastHtml = `
        <div class="toast-container position-fixed top-0 end-0 p-3">
            <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="ri-check-line me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar toast ao DOM
    $('body').append(toastHtml);
    
    // Mostrar toast
    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remover toast após fechamento
    $('.toast').on('hidden.bs.toast', function() {
        $('.toast-container').remove();
    });
}

// Função para mostrar toast de erro
function showErrorToast(message) {
    // Remover toast anterior se existir
    $('.toast-container').remove();
    
    const toastHtml = `
        <div class="toast-container position-fixed top-0 end-0 p-3">
            <div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="ri-error-warning-line me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar toast ao DOM
    $('body').append(toastHtml);
    
    // Mostrar toast
    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
    
    // Remover toast após fechamento
    $('.toast').on('hidden.bs.toast', function() {
        $('.toast-container').remove();
    });
}

/**
 * Inicializa a conexão com o Socket.io e registra os listeners.
 */
function initializeSocket() {
    const socket = io();

    // Listener para quando as opções de Categoria ou Localização mudam em outro lugar
    socket.on('patrimony:options_changed', () => {
        console.log('Detectada mudança nas opções de patrimônio. Recarregando...');
        showToast('As listas de Categoria e Localização foram atualizadas.');
        loadOptions(); // Recarrega as opções nos campos <select>
    });
}

/**
 * Carrega as opções de categoria e localização para os campos de seleção.
 */
async function loadOptions() {
    await loadFormOptions();
} 