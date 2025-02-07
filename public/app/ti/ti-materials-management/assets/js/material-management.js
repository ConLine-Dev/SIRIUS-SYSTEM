// Material Management Module
 // Inicialização das tabelas mantida
 const tables = {};

class MaterialManagement {
    constructor() {
        // Usar a instância global criada em material-api.js
        this.materialAPI = window.MaterialAPI;

        // Dados de exemplo (serão substituídos pela API posteriormente)
        this.collaborators = [];
        this.materials = [];
        this.materialMovements = [];

        // Bind methods to ensure correct context
        const methodsToBind = [
            'initializeDOM', 
            'handleMaterialReturn',
            'validateField',
            'resetForm',
            'refreshTables',
            'initializeTables',
            'populateAllocationSelects',
            'handleMaterialAllocation',
            'populateReturnMaterialSelects',
            'loadAllocatedMaterials'
        ];

        methodsToBind.forEach(method => {
            if (typeof this[method] === 'function') {
                this[method] = this[method].bind(this);
            }
        });
    }

    // Método para inicializar o DOM
    initializeDOM() {
        // Inicializar elementos do DOM
        this.materialsTableBody = document.getElementById('materials-table-body');
        this.lastMovementsTableBody = document.getElementById('recent-movements-body');
        this.materialRegistrationForm = document.getElementById('material-registration-form');
        this.materialReturnForm = document.getElementById('material-return-form');

        // Verificação de depuração
        console.log('Elementos DOM:', {
            materialsTableBody: this.materialsTableBody,
            lastMovementsTableBody: this.lastMovementsTableBody,
            materialRegistrationForm: this.materialRegistrationForm,
            materialReturnForm: this.materialReturnForm
        });

        if (this.materialReturnForm) {
            this.materialReturnForm.addEventListener('submit', this.handleMaterialReturn);
        }
    }

    // Função utilitária de validação
    validateField(field, errorMessage) {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            const errorElement = field.nextElementSibling || document.createElement('div');
            errorElement.classList.add('invalid-feedback');
            errorElement.textContent = errorMessage;
            field.parentNode.insertBefore(errorElement, field.nextSibling);
            return false;
        }
        field.classList.remove('is-invalid');
        return true;
    }

    // Função para limpar formulários
    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            const invalidFields = form.querySelectorAll('.is-invalid');
            invalidFields.forEach(field => field.classList.remove('is-invalid'));
        }
    }

    // Método para lidar com devolução de material
    handleMaterialReturn(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const returnData = Object.fromEntries(formData.entries());

        console.log('Dados de devolução recebidos:', returnData);

        // Validar campos obrigatórios
        if (!returnData.collaborator_id || !returnData.material_id || !returnData.quantity) {
            showToast('Erro', 'Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        // Encontrar a alocação correspondente
        const materialSelect = form.querySelector('select[name="material_id"]');
        const selectedOption = materialSelect.selectedOptions[0];
        const allocationId = selectedOption.dataset.allocationId;

        // Adicionar allocation_id aos dados de devolução
        returnData.allocation_id = parseInt(allocationId, 10);

        // Converter campos numéricos
        returnData.material_id = parseInt(returnData.material_id, 10);
        returnData.collaborator_id = parseInt(returnData.collaborator_id, 10);
        returnData.quantity = parseInt(returnData.quantity, 10);

        console.log('Dados de devolução processados:', returnData);

        this.materialAPI.returnAllocatedMaterial(returnData)
            .then(response => {
                showToast('Sucesso', 'Material devolvido com sucesso!', 'success');

                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('material-return-modal'));
                if (modal) modal.hide();

                // Limpar formulário
                form.reset();

                // Atualizar tabelas
                this.refreshTables();

                // Recarregar lista de materiais no modal
                this.populateReturnMaterialSelects();
            })
            .catch(error => {
                console.error('Erro ao devolver material:', error);
                
                try {
                    // Tentar parsear a mensagem de erro como JSON
                    const parsedError = JSON.parse(error.message);
                    
                    // Verificar se há detalhes no erro
                    if (parsedError.details) {
                        showToast('Erro', parsedError.details, 'warning');
                    } else {
                        showToast('Erro', 'Não foi possível devolver o material', 'error');
                    }
                } catch (parseError) {
                    // Se não for possível parsear, mostrar a mensagem original
                    showToast('Erro', error.message || 'Não foi possível devolver o material', 'error');
                }
            });
    }

    // Função para atualizar tabelas
    refreshTables() {
        // Inicialização das tabelas mantida
        // const tables = this.initializeTables();

        // Atualizar tabela de movimentações recentes
        tables['recent_movements'].ajax.reload(null, false);
    }

    // Remover funções obsoletas e manter apenas as essenciais
    initializeTables() {
       

        // Tabela de movimentações recentes
        tables['recent_movements'] = $('#recent-movements-table').DataTable({
            dom: 'frtip',
            paging: false,
            fixedHeader: true,
            info: false,
            scrollY: 'calc(100vh - 240px)',
            scrollCollapse: false,
            order: [[4, 'desc']],
            ajax: {
                url: '/api/material-control/movements',
                dataSrc: '',
                dataFilter: function(data) {
                    const json = JSON.parse(data);
                    console.log('Dados recebidos para movimentações:', json);
                    return JSON.stringify(json.map(item => {
                        console.log('Item individual:', item);
                        let type, collaboratorName;

                        // Log detalhado para depuração
                        console.log('Source:', item.source);
                        console.log('Movement Type:', item.movement_type);
                        console.log('Collaborator Name:', item.collaborator_name);

                        // Usar o movement_type_label se disponível
                        type = item.movement_type_label || 
                            (item.source === 'return' ? 'Devolução' : 
                            (item.source === 'allocation' ? 'Alocação' : 
                            (item.movement_type === 'input' ? 'Entrada de Estoque' : 
                            (item.movement_type === 'output' ? 'Saída de Estoque' : 
                            'Tipo Desconhecido'))));

                        // Definir nome do colaborador
                        collaboratorName = item.collaborator_name || 
                            (item.source === 'movement' && item.movement_type === 'input' ? '-' : 
                            'Colaborador não identificado');

                        return {
                            material_name: item.material_name || 'Material não identificado',
                            collaborator_name: collaboratorName,
                            type: type,
                            quantity: item.quantity || 0,
                            date: item.movement_date || new Date()
                        };
                    }));
                }
            },
            columns: [
                { 
                    data: 'material_name',
                    title: 'Material'
                },
                { 
                    data: 'collaborator_name',
                    title: 'Colaborador'
                },
                { 
                    data: 'type',
                    title: 'Tipo'
                },
                { 
                    data: 'quantity',
                    title: 'Quantidade'
                },
                { 
                    data: 'date',
                    title: 'Data',
                    render: function(data) {
                        return new Date(data).toLocaleString('pt-BR');
                    }
                }
            ],
            language: {
                searchPlaceholder: 'Pesquisar...',
                sSearch: '',
                url: '../../assets/libs/datatables/pt-br.json'
            }
        });

        return tables;
    }

    // Método para popular selects de alocação e alocar material
    async populateAllocationSelects() {
        try {
            // Buscar colaboradores
            const collaborators = await this.materialAPI.getCollaborators();
            const collaboratorSelect = document.querySelector('select[name="collaborator_id"]');
            
            if (collaboratorSelect) {
                collaboratorSelect.innerHTML = '<option value="">Selecione um colaborador</option>';
                collaborators.forEach(collaborator => {
                    const option = document.createElement('option');
                    option.value = collaborator.id_colab;
                    option.textContent = `${collaborator.username} ${collaborator.familyName}`;
                    collaboratorSelect.appendChild(option);
                });
            }

            // Buscar materiais
            const materialsResponse = await this.materialAPI.getAllMaterials();
            const materialSelect = document.querySelector('select[name="material_id"]');
            
            if (materialSelect) {
                materialSelect.innerHTML = '<option value="">Selecione um material</option>';
                console.log('Materiais recebidos:', materialsResponse);
                
                // Acessar o array de materiais de forma mais flexível
                const materials = materialsResponse.materials || materialsResponse;
                
                materials.forEach(material => {
                    const option = document.createElement('option');
                    option.value = material.id;
                    
                    // Acessar o estoque disponível de forma mais flexível
                    const availableStock = 
                        material.stock_details?.available_stock || 
                        material.available_stock || 
                        material.total_input - material.total_output - material.total_allocated || 
                        0;
                    
                    option.textContent = `${material.name} (${material.sku}) - Estoque: ${availableStock}`;
                    
                    // Desabilitar materiais sem estoque
                    if (availableStock <= 0) {
                        option.disabled = true;
                        option.textContent += ' (Sem estoque)';
                    }
                    
                    materialSelect.appendChild(option);
                });
            }

            // Adicionar evento de submissão do formulário de alocação
            const allocationForm = document.getElementById('material-allocation-form');
            if (allocationForm) {
                allocationForm.addEventListener('submit', this.handleMaterialAllocation);
            }
        } catch (error) {
            console.error('Erro ao popular selects de alocação:', error);
            showToast('Erro', 'Não foi possível carregar colaboradores ou materiais', 'error');
        }
    }

    // Método para lidar com alocação de material
    handleMaterialAllocation(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const allocationData = Object.fromEntries(formData.entries());

        // Validar campos obrigatórios
        if (!allocationData.collaborator_id || !allocationData.material_id || !allocationData.quantity) {
            showToast('Erro', 'Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        // Converter quantidade para número inteiro
        allocationData.quantity = parseInt(allocationData.quantity, 10);

        this.materialAPI.allocateMaterial(allocationData)
            .then(response => {
                showToast('Sucesso', 'Material alocado com sucesso!', 'success');

                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('material-allocation-modal'));
                if (modal) modal.hide();

                // Limpar formulário
                form.reset();

                // Atualizar tabelas
                this.refreshTables();

                // Recarregar lista de materiais no modal
                this.populateAllocationSelects();
            })
            .catch(error => {
                console.log(error);
                console.error('Erro ao alocar material:', error);
                
                try {
                    // Tentar parsear a mensagem de erro como JSON
                    const parsedError = JSON.parse(error.message);
                    
                    // Verificar se há detalhes no erro
                    if (parsedError.details) {
                        showToast('Erro', parsedError.details, 'warning');
                    } else {
                        showToast('Erro', 'Não foi possível alocar o material', 'error');
                    }
                } catch (parseError) {
                    // Se não for possível parsear, mostrar a mensagem original
                    showToast('Erro', error.message || 'Não foi possível alocar o material', 'error');
                }
            })
    }

    // Método para popular selects de devolução de materiais
    async populateReturnMaterialSelects() {
        try {
            // Buscar colaboradores com materiais alocados
            const collaborators = await this.materialAPI.getCollaboratorsWithAllocatedMaterials();
            const collaboratorSelect = document.querySelector('#material-return-modal select[name="collaborator_id"]');
            
            if (collaboratorSelect) {
                collaboratorSelect.innerHTML = '<option value="">Selecione um colaborador</option>';
                collaborators.forEach(collaborator => {
                    const option = document.createElement('option');
                    option.value = collaborator.id_colab;
                    option.textContent = `${collaborator.username} ${collaborator.familyName}`;
                    collaboratorSelect.appendChild(option);
                });

                // Adicionar evento de mudança para carregar materiais do colaborador
                collaboratorSelect.addEventListener('change', this.loadAllocatedMaterials);
            }

            // Adicionar evento de submissão do formulário de devolução
            const returnForm = document.getElementById('material-return-form');
            if (returnForm) {
                returnForm.addEventListener('submit', this.handleMaterialReturn);
            }
        } catch (error) {
            console.error('Erro ao popular selects de devolução:', error);
            showToast('Erro', 'Não foi possível carregar colaboradores', 'error');
        }
    }

    // Método para carregar materiais alocados de um colaborador específico
    async loadAllocatedMaterials(event) {
        const collaboratorId = event.target.value;
        const materialSelect = document.querySelector('#material-return-modal select[name="material_id"]');
        const quantityInput = document.querySelector('#material-return-modal input[name="quantity"]');

        // Limpar selects e inputs
        if (materialSelect) {
            materialSelect.innerHTML = '<option value="">Carregando materiais...</option>';
        }
        if (quantityInput) {
            quantityInput.value = '';
            quantityInput.max = 0;
        }

        if (!collaboratorId) {
            if (materialSelect) {
                materialSelect.innerHTML = '<option value="">Selecione um colaborador primeiro</option>';
            }
            return;
        }

        try {
            // Buscar materiais alocados para o colaborador
            console.log(`Buscando materiais alocados para colaborador ID: ${collaboratorId}`);
            const allocatedMaterials = await this.materialAPI.getAllocatedMaterialsByCollaborator(collaboratorId);
            
            console.log('Materiais alocados encontrados:', allocatedMaterials);

            if (materialSelect) {
                // Limpar select anterior
                materialSelect.innerHTML = '<option value="">Selecione um material</option>';

                // Verificar se há materiais alocados
                if (allocatedMaterials.length === 0) {
                    materialSelect.innerHTML = '<option value="">Nenhum material alocado encontrado</option>';
                    return;
                }

                // Adicionar materiais ao select
                allocatedMaterials.forEach(material => {
                    const option = document.createElement('option');
                    option.value = material.material_id;  
                    option.textContent = `${material.material_name} (${material.material_sku}) - Alocado: ${material.quantity}`;
                    option.dataset.allocatedQuantity = material.quantity;
                    option.dataset.allocationId = material.allocation_id;  // Adicionar ID da alocação
                    materialSelect.appendChild(option);
                });

                // Adicionar evento para limitar quantidade máxima de devolução
                materialSelect.addEventListener('change', (e) => {
                    const selectedOption = e.target.selectedOptions[0];
                    if (selectedOption && quantityInput) {
                        const maxQuantity = parseInt(selectedOption.dataset.allocatedQuantity, 10);
                        quantityInput.max = maxQuantity;
                        quantityInput.setAttribute('max', maxQuantity);
                        
                        // Adicionar validação para quantidade
                        quantityInput.addEventListener('input', () => {
                            const currentValue = parseInt(quantityInput.value, 10);
                            if (currentValue > maxQuantity) {
                                quantityInput.value = maxQuantity;
                                showToast('Aviso', `Quantidade máxima de devolução: ${maxQuantity}`, 'warning');
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar materiais alocados:', error);
            showToast('Erro', 'Não foi possível carregar os materiais alocados', 'error');
        }
    }

    // Inicialização
    init() {
        // Bind methods to ensure correct context
        const methodsToBind = [
            'initializeDOM', 
            'handleMaterialReturn',
            'validateField',
            'resetForm',
            'refreshTables',
            'initializeTables',
            'populateAllocationSelects',
            'handleMaterialAllocation',
            'populateReturnMaterialSelects',
            'loadAllocatedMaterials'
        ];

        methodsToBind.forEach(method => {
            if (typeof this[method] === 'function') {
                this[method] = this[method].bind(this);
            }
        });

        // Inicializar DOM
        this.initializeDOM();

        // Inicializar tabelas
        this.tables = this.initializeTables();

        // Popular selects de alocação
        this.populateAllocationSelects();

        // Popular selects de devolução
        this.populateReturnMaterialSelects();
    }
}


// Função para mostrar toast
function showToast(title, message, type = 'success') {
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
        <div class="toast-header">
            <strong class="me-auto" style="color: white;">${title}</strong>
        </div>
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

// Iniciar a aplicação
const materialManagement = new MaterialManagement();
materialManagement.init();
