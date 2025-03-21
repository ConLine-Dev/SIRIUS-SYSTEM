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
        const response = await fetch('/api/users/listAllUsers');
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
        // Fazer a requisição para obter os dados do centro de custo
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
        
        // Dados do centro de custo
        const data = result.data;
        
        // Preencher os campos do formulário com os dados
        document.getElementById('cost-center-id').value = data.id;
        document.getElementById('cost-center-name').value = data.name;
        document.getElementById('cost-center-description').value = data.description || '';
        
        // Selecionar o responsável no dropdown
        const responsibleSelect = document.getElementById('responsible-id');
        if (responsibleSelect) {
            console.log('Responsável ID do centro de custo:', data.responsible_id);
            // Verificar se o valor existe como uma opção
            const option = Array.from(responsibleSelect.options).find(opt => {
                console.log('Opção:', opt.value, 'Comparando com:', data.responsible_id);
                return opt.value == data.responsible_id;
            });
            
            if (option) {
                responsibleSelect.value = data.responsible_id;
                // Atualizar o Select2
                $(responsibleSelect).trigger('change');
                console.log('Responsável selecionado:', option.text);
            } else {
                console.warn(`Responsável com ID ${data.responsible_id} não encontrado nas opções`);
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
            const responsibleId = document.getElementById('responsible-id').value;
            
            if (!name || !responsibleId) {
                showAlert('Erro', 'Por favor, preencha todos os campos obrigatórios', 'error');
                return;
            }
            
            // Obter os dados do formulário
            const description = document.getElementById('cost-center-description').value.trim();
            
            try {
                // Exibir loader durante o processamento
                const loader = document.querySelector('.page-loader');
                if (loader) {
                    loader.classList.remove('d-none');
                }
                
                // Enviar dados para atualização
                const response = await fetch('/api/zero-based-budgeting/updateCostCenter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: costCenterId,
                        name: name,
                        description: description,
                        responsible: responsibleId // Alterado de responsible_id para responsible para combinar com a API
                    })
                });
                
                const result = await response.json();
                
                // Esconder loader após o processamento
                if (loader) {
                    loader.classList.add('d-none');
                }
                
                if (result.success) {
                    showAlert('Sucesso', 'Centro de custo atualizado com sucesso!', 'success');
                    
                    // Esperar um pouco antes de fechar a janela
                    setTimeout(() => {
                        window.opener.location.reload(); // Recarregar a página que abriu esta
                        window.close();
                    }, 1500);
                } else {
                    showAlert('Erro', result.message || 'Falha ao atualizar o centro de custo', 'error');
                }
                
            } catch (error) {
                console.error('Erro ao atualizar centro de custo:', error);
                showAlert('Erro', 'Ocorreu um erro ao atualizar o centro de custo', 'error');
                
                // Esconder loader em caso de erro
                const loader = document.querySelector('.page-loader');
                if (loader) {
                    loader.classList.add('d-none');
                }
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