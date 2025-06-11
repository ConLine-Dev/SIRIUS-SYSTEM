// Quando o documento estiver pronto
$(document).ready(function() {
    // Mostrar loader enquanto carrega dados iniciais
    $('#loader2').show();
    
    // Carregar opções do formulário
    loadFormOptions()
        .then(() => {
            // Inicializar o formulário
            initializeForm();
            
            // Esconder loader quando tudo estiver pronto
            $('#loader2').hide();
        })
        .catch(error => {
            console.error('Erro ao carregar opções do formulário:', error);
            showErrorToast('Não foi possível carregar as opções do formulário. Tente novamente mais tarde.');
            $('#loader2').hide();
        });
});

// Carregar opções para os selects
async function loadFormOptions() {
    try {
        // Carregar localizações
        const locationsResponse = await makeRequest('/api/patrimony-tracker/locations');
        const locations = await locationsResponse;
        
        // Preencher select de localização
        const locationSelect = $('#item-location');
        locationSelect.empty();
        locationSelect.append('<option value="">Selecione...</option>');
        
        if (locations && locations.length > 0) {
            locations.forEach(location => {
                locationSelect.append(`<option value="${location.name}">${location.name}</option>`);
            });
        } else {
            locationSelect.append('<option value="" disabled>Não foi possível carregar localizações</option>');
        }
        
    } catch (error) {
        console.error('Erro ao carregar opções:', error);
        showErrorToast('Não foi possível carregar as opções do formulário. Tente novamente mais tarde.');
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
        location: $('#item-location').val(),
        status: $('#item-status').val(),
        acquisition_date: $('#item-acquisition-date').val(),
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