// Script para a página de edição de centro de custo
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar o Select2
    $('.select2').select2({
        width: '100%',
        dropdownParent: $('body')
    });
    
    // Obter o ID do centro de custo da URL
    const urlParams = new URLSearchParams(window.location.search);
    const costCenterId = urlParams.get('id');
    
    if (!costCenterId) {
        showAlert('Erro', 'ID do centro de custo não fornecido!', 'error');
        return;
    }
    
    // Carregar os colaboradores para o dropdown de responsáveis
    await loadCollaborators();
    
    // Carregar os dados do centro de custo
    await loadCostCenterData(costCenterId);
    
    // Configurar os botões e o formulário
    setupForm(costCenterId);
    
    // Esconder o loader quando tudo estiver carregado
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('d-none');
    }
});

// Função para carregar a lista de colaboradores
async function loadCollaborators() {
    try {
        const response = await fetch('/api/users/listAllUsersActive');
        const result = await response.json();
        
        const selectEl = document.getElementById('responsible-id');
        if (!selectEl) {
            console.warn('Elemento de seleção não encontrado');
            return;
        }
        
        // Manter a opção padrão
        let options = '<option value="">Selecionar Responsável</option>';
        
        // Adicionar cada colaborador como uma opção
        // A API retorna diretamente um array de usuários com id_colab e username+familyName
        result.forEach(user => {
            options += `<option value="${user.id_colab}">${user.username} ${user.familyName || ''}</option>`;
        });
        
        selectEl.innerHTML = options;
        
    } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar a lista de colaboradores', 'error');
    }
}

// Função para carregar os dados do centro de custo
async function loadCostCenterData(id) {
    try {
        const response = await fetch(`/api/zero-based-budgeting/getCostCenterView`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showAlert('Erro', result.message || 'Falha ao carregar os dados do centro de custo', 'error');
            return;
        }
        
        const data = result.data;
        
        // Preencher os campos do formulário
        document.getElementById('cost-center-id').value = data.id;
        document.getElementById('cost-center-name').value = data.name;
        document.getElementById('cost-center-description').value = data.description || '';
        
        // Configurar o select de responsáveis
        const responsibleSelect = document.getElementById('responsible-id');
        if (responsibleSelect) {
            // Verificar se o valor existe como uma opção
            if (data.responsible_ids && data.responsible_ids.length > 0) {
                data.responsible_ids.forEach(id => {
                    const option = Array.from(responsibleSelect.options).find(opt => opt.value == id);
                    if (option) {
                        option.selected = true;
                    }
                });
                // Atualizar o Select2
                $(responsibleSelect).trigger('change');
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro', 'Ocorreu um erro ao carregar os dados do centro de custo', 'error');
    }
}

// Configurar o formulário e os botões
function setupForm(costCenterId) {
    // Botão para cancelar
    const cancelButton = document.getElementById('cancel-btn');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            window.close();
        });
    }
    
    // Formulário de edição
    const form = document.getElementById('edit-cost-center-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Verificar se os campos obrigatórios foram preenchidos
            const name = document.getElementById('cost-center-name').value.trim();
            const responsibleSelect = document.getElementById('responsible-id');
            const selectedResponsibles = Array.from(responsibleSelect.selectedOptions).map(option => option.value);
            
            if (!name || selectedResponsibles.length === 0) {
                showAlert('Erro', 'Por favor, preencha todos os campos obrigatórios', 'error');
                return;
            }
            
            // Obter os dados do formulário
            const description = document.getElementById('cost-center-description').value.trim();
            
            // Preparar os dados para envio
            const formData = {
                id: costCenterId,
                name: name,
                description: description,
                responsibles: selectedResponsibles
            };
            
            try {
                const response = await fetch('/api/zero-based-budgeting/updateCostCenter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('Sucesso', 'Centro de custo atualizado com sucesso!', 'success');
                    window.close();
                } else {
                    showAlert('Erro', result.message || 'Erro ao atualizar o centro de custo', 'error');
                }
            } catch (error) {
                console.error('Erro ao atualizar:', error);
                showAlert('Erro', 'Ocorreu um erro ao atualizar o centro de custo', 'error');
            }
        });
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