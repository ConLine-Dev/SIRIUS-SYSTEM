// Material Management Module

class MaterialManagement {
    constructor() {
        // Dados de exemplo (serão substituídos pela API posteriormente)
        this.collaborators = [
            { id: 1, name: 'João Silva', department: 'TI', email: 'joao.silva@empresa.com' },
            { id: 2, name: 'Maria Souza', department: 'RH', email: 'maria.souza@empresa.com' },
            { id: 3, name: 'Pedro Santos', department: 'Financeiro', email: 'pedro.santos@empresa.com' }
        ];

        this.materials = [
            { id: 1, name: 'Notebook Dell', sku: 'NT-001', category: 'hardware', stock: 10, minimum_stock: 3 },
            { id: 2, name: 'Monitor LG', sku: 'MT-002', category: 'hardware', stock: 15, minimum_stock: 5 },
            { id: 3, name: 'Windows 10 Pro', sku: 'SW-003', category: 'software', stock: 50, minimum_stock: 10 }
        ];

        // Dados de exemplo de movimentações de materiais
        this.materialMovements = [
            {
                id: 1,
                type: 'allocation',
                material: this.materials[0], // Notebook Dell
                collaborator: this.collaborators[0], // João Silva
                quantity: 2,
                reason: 'projeto',
                observations: 'Alocação para projeto de desenvolvimento',
                date: new Date('2024-02-01T10:30:00')
            },
            {
                id: 2,
                type: 'return',
                material: this.materials[0], // Notebook Dell
                collaborator: this.collaborators[0], // João Silva
                quantity: 1,
                condition: 'perfeito',
                observations: 'Devolução de notebook após conclusão do projeto',
                date: new Date('2024-02-15T14:45:00')
            },
            {
                id: 3,
                type: 'allocation',
                material: this.materials[1], // Monitor LG
                collaborator: this.collaborators[1], // Maria Souza
                quantity: 3,
                reason: 'manutencao',
                observations: 'Monitores para equipe de suporte técnico',
                date: new Date('2024-01-20T09:15:00')
            },
            {
                id: 4,
                type: 'return',
                material: this.materials[1], // Monitor LG
                collaborator: this.collaborators[1], // Maria Souza
                quantity: 1,
                condition: 'com_defeito',
                observations: 'Monitor com problemas de conexão',
                date: new Date('2024-02-10T16:20:00')
            },
            {
                id: 5,
                type: 'allocation',
                material: this.materials[2], // Windows 10 Pro
                collaborator: this.collaborators[2], // Pedro Santos
                quantity: 5,
                reason: 'uso_pessoal',
                observations: 'Licenças para novos computadores do departamento financeiro',
                date: new Date('2024-01-25T11:00:00')
            }
        ];

        // Bind methods to ensure correct context
        const methodsToBind = [
            'initializeDOM', 
            'registerNewMaterial', 
            'updateLastMovements', 
            'showToast',
            'populateCollaborators',
            'populateMaterials',
            'initializeForms',
            'updateMaterialsTable',
            'updateDashboardCards'
        ];

        methodsToBind.forEach(method => {
            if (typeof this[method] === 'function') {
                this[method] = this[method].bind(this);
            }
        });

        // Verificar se os métodos existem antes de fazer bind
        if (typeof this.updateMovementsTable === 'function') {
            this.updateMovementsTable = this.updateMovementsTable.bind(this);
        }
    }

    // Método para inicializar o DOM
    initializeDOM() {
        // Inicializar elementos do DOM
        this.materialsTableBody = document.getElementById('materials-table-body');
        this.lastMovementsTableBody = document.getElementById('recent-movements-body');
        this.materialRegistrationForm = document.getElementById('material-registration-form');

        // Verificação de depuração
        console.log('Elementos DOM:', {
            materialsTableBody: this.materialsTableBody,
            lastMovementsTableBody: this.lastMovementsTableBody,
            materialRegistrationForm: this.materialRegistrationForm
        });

        if (this.materialRegistrationForm) {
            this.materialRegistrationForm.addEventListener('submit', this.registerNewMaterial);
        }

        // Carregar dados iniciais
        this.updateMaterialsTable();
        this.updateLastMovements();
        this.populateCollaborators();
        this.populateMaterials();
        this.initializeForms();
    }

    // Preencher select de colaboradores
    populateCollaborators() {
        const collaboratorSelects = document.querySelectorAll('select[name="collaborator_id"]');
        collaboratorSelects.forEach(select => {
            select.innerHTML = '<option value="">Selecione um colaborador</option>';
            
            this.collaborators.forEach(collab => {
                const option = document.createElement('option');
                option.value = collab.id;
                option.textContent = `${collab.name} - ${collab.department}`;
                select.appendChild(option);
            });
        });
    }

    // Preencher select de materiais
    populateMaterials() {
        const materialSelects = document.querySelectorAll('select[name="material_id"]');
        materialSelects.forEach(select => {
            select.innerHTML = '<option value="">Selecione um material</option>';
            
            this.materials.forEach(material => {
                const option = document.createElement('option');
                option.value = material.id;
                option.textContent = `${material.name} (${material.sku}) - Estoque: ${material.stock}`;
                select.appendChild(option);
            });
        });
    }

    // Mostrar toast de notificação
    showToast(message, type = 'info') {
        // Criar o container de toast se não existir
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.classList.add('toast-container', 'position-fixed', 'top-0', 'end-0', 'p-3', 'z-3');
            
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.classList.add('toast', `text-bg-${type}`, 'align-items-center', 'border-0');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    // Inicializar formulários de movimentação
    initializeForms() {
        const allocationForm = document.getElementById('material-allocation-form');
        const returnForm = document.getElementById('material-return-form');
        const registrationForm = document.getElementById('material-registration-form');

        // Formulário de Alocação de Material
        if (allocationForm) {
            allocationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMaterialAllocation(allocationForm);
            });
        }

        // Formulário de Devolução de Material
        if (returnForm) {
            returnForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMaterialReturn(returnForm);
            });
        }

        // Formulário de Registro de Material
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMaterialRegistration(registrationForm);
            });
        }
    }

    // Manipular alocação de material
    handleMaterialAllocation(form) {
        const formData = new FormData(form);
        const movementData = Object.fromEntries(formData.entries());
        
        // Validações básicas
        if (!movementData.collaborator_id || !movementData.material_id || !movementData.quantity) {
            this.showToast('Por favor, preencha todos os campos obrigatórios.', 'danger');
            return;
        }

        const materialId = parseInt(movementData.material_id);
        const material = this.materials.find(m => m.id === materialId);
        const collaborator = this.collaborators.find(c => c.id === parseInt(movementData.collaborator_id));

        // Verificar estoque disponível
        if (!material || material.stock < parseInt(movementData.quantity)) {
            this.showToast(`Apenas ${material.stock} unidades disponíveis.`, 'danger');
            return;
        }

        // Atualizar estoque
        material.stock -= parseInt(movementData.quantity);

        // Registrar movimentação
        const movement = {
            id: this.materialMovements.length + 1,
            type: 'allocation',
            material: material,
            collaborator: collaborator,
            quantity: parseInt(movementData.quantity),
            reason: movementData.reason,
            observations: movementData.observations,
            date: new Date()
        };

        this.materialMovements.push(movement);

        // Atualizar tabela e cards
        this.updateMovementsTable();
        this.updateDashboardCards();

        this.showToast('Material alocado com sucesso.', 'success');

        // Fechar modal
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) modal.hide();

        // Limpar formulário
        form.reset();
    }

    // Manipular devolução de material
    handleMaterialReturn(form) {
        const formData = new FormData(form);
        const movementData = Object.fromEntries(formData.entries());
        
        // Validações básicas
        if (!movementData.collaborator_id || !movementData.material_id || !movementData.quantity) {
            this.showToast('Por favor, preencha todos os campos obrigatórios.', 'danger');
            return;
        }

        const materialId = parseInt(movementData.material_id);
        const material = this.materials.find(m => m.id === materialId);
        const collaborator = this.collaborators.find(c => c.id === parseInt(movementData.collaborator_id));

        // Registrar movimentação de devolução
        const movement = {
            id: this.materialMovements.length + 1,
            type: 'return',
            material: material,
            collaborator: collaborator,
            quantity: parseInt(movementData.quantity),
            condition: movementData.material_condition,
            observations: movementData.observations,
            date: new Date()
        };

        this.materialMovements.push(movement);

        // Atualizar estoque
        material.stock += parseInt(movementData.quantity);

        // Atualizar tabela e cards
        this.updateMovementsTable();
        this.updateDashboardCards();

        this.showToast('Material devolvido com sucesso.', 'success');

        // Fechar modal
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) modal.hide();

        // Limpar formulário
        form.reset();
    }

    // Manipular registro de material
    handleMaterialRegistration(form) {
        const formData = new FormData(form);
        const materialData = Object.fromEntries(formData.entries());
        
        // Validações básicas
        if (!materialData.name || !materialData.sku || !materialData.category) {
            this.showToast('Por favor, preencha todos os campos obrigatórios.', 'danger');
            return;
        }

        // Criar novo material
        const newMaterial = {
            id: this.materials.length + 1,
            name: materialData.name,
            sku: materialData.sku,
            category: materialData.category,
            stock: parseInt(materialData.initial_stock) || 0,
            minimum_stock: parseInt(materialData.minimum_stock) || 0,
            status: materialData.status
        };

        this.materials.push(newMaterial);

        // Atualizar selects de materiais
        this.populateMaterials();

        // Atualizar cards
        this.updateDashboardCards();

        this.showToast('Material registrado com sucesso.', 'success');

        // Fechar modal
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) modal.hide();

        // Limpar formulário
        form.reset();
    }

    // Atualizar tabela de movimentações
    updateMovementsTable() {
        const tableBody = document.getElementById('recent-movements-body');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        // Mostrar últimas 5 movimentações
        const lastMovements = this.materialMovements.slice(-5).reverse();

        lastMovements.forEach(movement => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${movement.material.name}</td>
                <td>${movement.collaborator.name}</td>
                <td>${movement.type === 'allocation' ? 'Alocação' : 'Devolução'}</td>
                <td>${movement.quantity}</td>
                <td>${movement.date.toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Atualizar tabela de materiais
    updateMaterialsTable() {
        if (!this.materialsTableBody) return;

        // Limpar tabela existente
        this.materialsTableBody.innerHTML = '';

        // Preencher tabela com materiais
        this.materials.forEach(material => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${material.name}</td>
                <td>${material.sku}</td>
                <td>${material.category}</td>
                <td>${material.stock}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info view-material" data-id="${material.id}">
                            <i class="ri-eye-line"></i>
                        </button>
                        <button class="btn btn-sm btn-warning edit-material" data-id="${material.id}">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-material" data-id="${material.id}">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            `;
            this.materialsTableBody.appendChild(row);
        });
    }

    // Atualizar tabela de últimas movimentações
    updateLastMovements() {
        // Verificação de depuração
        console.log('Método updateLastMovements chamado');
        console.log('Tabela de movimentações:', this.lastMovementsTableBody);

        if (!this.lastMovementsTableBody) {
            console.error('Elemento recent-movements-body não encontrado');
            return;
        }

        // Limpar tabela existente
        this.lastMovementsTableBody.innerHTML = '';

        // Ordenar movimentações por data (mais recentes primeiro)
        const sortedMovements = this.materialMovements.sort((a, b) => b.date - a.date);

        // Verificação de depuração
        console.log('Movimentações ordenadas:', sortedMovements);

        // Preencher tabela com todas as movimentações
        sortedMovements.forEach(movement => {
            const row = document.createElement('tr');
            
            // Definir classe de estilo baseado no tipo de movimentação
            let movementTypeClass = '';
            let movementTypeText = '';
            switch (movement.type) {
                case 'allocation':
                    movementTypeClass = 'text-success';
                    movementTypeText = 'Entrada';
                    break;
                case 'return':
                    movementTypeClass = 'text-warning';
                    movementTypeText = 'Devolução';
                    break;
                case 'withdrawal':
                    movementTypeClass = 'text-danger';
                    movementTypeText = 'Saída';
                    break;
                default:
                    movementTypeClass = 'text-secondary';
                    movementTypeText = 'Não especificado';
            }

            row.innerHTML = `
                <td>${movement.material.name}</td>
                <td>${movement.collaborator.name}</td>
                <td class="${movementTypeClass}">${movementTypeText}</td>
                <td>${movement.quantity}</td>
                <td>${movement.date.toLocaleDateString('pt-BR')} ${movement.date.toLocaleTimeString('pt-BR')}</td>
            `;
            this.lastMovementsTableBody.appendChild(row);

            // Verificação de depuração
            console.log('Linha adicionada:', row);
        });

        // Atualizar contador de movimentações
        const movementsCountElement = document.getElementById('total-movements');
        if (movementsCountElement) {
            movementsCountElement.textContent = this.materialMovements.length;
        }

        // Verificação final
        console.log('Número de linhas na tabela:', this.lastMovementsTableBody.children.length);
    }

    // Atualizar cards de resumo
    updateDashboardCards() {
        const totalMaterials = document.getElementById('total-materials');
        const materialsInUse = document.getElementById('materials-in-use');
        const lowStockMaterials = document.getElementById('low-stock-materials');

        if (totalMaterials) {
            const totalAllocatedQuantity = this.materialMovements
                .filter(m => m.type === 'allocation')
                .reduce((total, movement) => total + movement.quantity, 0);

            const lowStockCount = this.materials.filter(m => m.stock <= m.minimum_stock).length;

            totalMaterials.textContent = this.materials.length;
            materialsInUse.textContent = totalAllocatedQuantity;
            lowStockMaterials.textContent = lowStockCount;
        }
    }

    // Método para obter dados de exemplo (será substituído pela API)
    getExampleData() {
        return {
            collaborators: this.collaborators,
            materials: this.materials,
            materialMovements: this.materialMovements
        };
    }

    // Inicialização
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.initializeDOM);
        } else {
            this.initializeDOM();
        }
    }
}

// Iniciar a aplicação
const materialManagement = new MaterialManagement();
materialManagement.init();
