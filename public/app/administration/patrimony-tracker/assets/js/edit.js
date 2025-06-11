// Variáveis globais
let currentItem = null;

// Inicialização da página
$(document).ready(function() {
    // Obter ID do item da URL
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    
    if (itemId) {
        // Carregar dados do item
        fetchItemData(itemId);
        
        // Carregar opções para os selects
        loadOptions();
        
        // Configurar o botão de cancelar
        setupCancelButton();
        
        // Configurar o formulário de edição
        setupFormSubmission(itemId);
    } else {
        // Mostrar erro se não houver ID
        showError('ID do item não fornecido. Volte para a lista de itens e tente novamente.');
    }
});

// Carregar dados do item
async function fetchItemData(id) {
    try {
        // Fazer requisição para a API
        const response = await makeRequest(`/api/patrimony-tracker/items/${id}`);
        currentItem = response;
        
        // Preencher o formulário com os dados
        populateForm();
    } catch (error) {
        console.error('Erro ao buscar dados do item:', error);
        showError('Não foi possível carregar os detalhes do item. Tente novamente mais tarde.');
    }
}

// Preencher o formulário com os dados do item
function populateForm() {
    if (!currentItem) return;
    
    // Preencher campos de texto
    $('#item-description').val(currentItem.description);
    $('#item-code').val(currentItem.code);
    $('#item-acquisition-date').val(formatDateForInput(currentItem.acquisition_date));
    $('#item-notes').val(currentItem.notes || '');
    
    // Preencher selects (após carregamento das opções)
    $('#item-location').val(currentItem.location);
    
    // Preencher campos somente leitura
    $('#item-status').val(getStatusText(currentItem.status));
    
    if (currentItem.current_assignment) {
        $('#item-current-employee').val(
            `${currentItem.current_assignment.employee_name} (${currentItem.current_assignment.employee_department})`
        );
    } else {
        $('#item-current-employee').val('Não atribuído');
    }
}

// Carregar opções para os selects
async function loadOptions() {
    try {
        const response = await makeRequest('/api/patrimony-tracker/options');
        const options = await response;
        
        // Preencher o select de localização
        const locationSelect = $('#item-location');
        locationSelect.empty();
        locationSelect.append('<option value="">Selecione uma localização...</option>');
        options.locations.forEach(location => {
            locationSelect.append(`<option value="${location.name}">${location.name}</option>`);
        });
    } catch (error) {
        console.error('Erro ao carregar opções:', error);
        showNotification('Erro ao carregar dados. Por favor, recarregue a página.', 'danger');
    }
}

// Configurar o botão de cancelar
function setupCancelButton() {
    $('#btn-cancel').click(function() {
        if (confirm('Tem certeza que deseja cancelar a edição? As alterações não salvas serão perdidas.')) {
            if (currentItem) {
                window.location.href = `view.html?id=${currentItem.id}`;
            } else {
                window.close();
            }
        }
    });
}

// Configurar o formulário de edição
function setupFormSubmission(itemId) {
    $('#form-edit-item').submit(async function(e) {
        e.preventDefault();
        
        // Desabilitar botão de salvar para evitar submissões duplicadas
        const saveButton = $('#btn-save');
        saveButton.prop('disabled', true);
        saveButton.html('<i class="ri-loader-4-line fa-spin me-1"></i> Salvando...');
        
        try {
            // Construir objeto com dados do item
            const itemData = {
                code: $('#item-code').val(),
                description: $('#item-description').val(),
                location: $('#item-location').val(),
                acquisition_date: $('#item-acquisition-date').val(),
                notes: $('#item-notes').val()
            };
            
            // Enviar dados para o servidor
            await makeRequest(`/api/patrimony-tracker/items/${itemId}`, 'PUT', itemData);
            
            // Mostrar notificação de sucesso
            showNotification('Item atualizado com sucesso!', 'success');
            
            // Redirecionar para a página de visualização do item após um breve delay
            setTimeout(() => {
                window.location.href = `view.html?id=${itemId}`;
            }, 1500);
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            
            // Mostrar notificação de erro
            showNotification('Erro ao salvar as alterações. Por favor, tente novamente.', 'danger');
            
            // Reabilitar botão de salvar
            saveButton.prop('disabled', false);
            saveButton.html('<i class="ri-save-line me-1"></i> Salvar Alterações');
        }
    });
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Remover notificações existentes
    $('.alert-notification').remove();
    
    // Criar elemento de notificação
    const alert = $(`
        <div class="alert alert-${type} alert-dismissible fade show alert-notification" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);
    
    // Adicionar ao topo do formulário
    $('.card-body').prepend(alert);
    
    // Desaparecer automaticamente após 5 segundos
    setTimeout(() => {
        alert.alert('close');
    }, 5000);
}

// Função para mostrar erro
function showError(message) {
    alert(message);
}

// Obter texto do status
function getStatusText(status) {
    const statusMap = {
        'available': 'Disponível',
        'in_use': 'Em Uso',
        'in_maintenance': 'Em Manutenção',
        'damaged': 'Danificado',
        'discarded': 'Baixado/Descartado'
    };
    
    return statusMap[status] || status;
}

// Formatar data para o campo input (DD/MM/YYYY -> YYYY-MM-DD)
function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    // Verificar se a data já está no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    
    // Converter de DD/MM/YYYY para YYYY-MM-DD
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    return dateString;
} 