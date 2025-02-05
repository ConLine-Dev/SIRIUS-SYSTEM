class StockManagement {
    constructor() {
        // Dados de exemplo (serão substituídos pela API posteriormente)
        this.materials = [
            { id: 1, name: 'Notebook Dell', sku: 'NT-001', category: 'hardware', stock: 10, minimum_stock: 3, unit: 'unidade', status: 'ativo', description: 'Notebook Dell Inspiron 15' },
            { id: 2, name: 'Monitor LG', sku: 'MT-002', category: 'hardware', stock: 15, minimum_stock: 5, unit: 'unidade', status: 'ativo', description: 'Monitor LG 24"' },
            { id: 3, name: 'Windows 10 Pro', sku: 'SW-003', category: 'software', stock: 50, minimum_stock: 10, unit: 'licença', status: 'ativo', description: 'Sistema operacional Windows 10 Pro' }
        ];

        this.collaborators = [
            { id: 1, name: 'João Silva', department: 'TI', email: 'joao.silva@empresa.com' },
            { id: 2, name: 'Maria Souza', department: 'RH', email: 'maria.souza@empresa.com' },
            { id: 3, name: 'Pedro Santos', department: 'Financeiro', email: 'pedro.santos@empresa.com' }
        ];

        this.stockMovements = [];

        // Bind methods
        this.initializeDOM = this.initializeDOM.bind(this);
        this.populateMaterials = this.populateMaterials.bind(this);
        this.populateCollaborators = this.populateCollaborators.bind(this);
        this.handleStockEntry = this.handleStockEntry.bind(this);
        this.handleStockExit = this.handleStockExit.bind(this);
        this.updateStockMovementsTable = this.updateStockMovementsTable.bind(this);
        this.updateDashboardCards = this.updateDashboardCards.bind(this);
        this.handleNewMaterial = this.handleNewMaterial.bind(this);
    }

    initializeDOM() {
        // Inicializar elementos do DOM
        this.stockMovementsBody = document.getElementById('stock-movements-body');
        this.materialsBody = document.getElementById('materials-body');
        this.stockEntryForm = document.getElementById('stock-entry-form');
        this.stockExitForm = document.getElementById('stock-exit-form');
        this.newMaterialForm = document.getElementById('new-material-form');

        // Adicionar event listeners
        if (this.stockEntryForm) {
            this.stockEntryForm.addEventListener('submit', this.handleStockEntry);
        }

        if (this.stockExitForm) {
            this.stockExitForm.addEventListener('submit', this.handleStockExit);
        }

        if (this.newMaterialForm) {
            this.newMaterialForm.addEventListener('submit', this.handleNewMaterial);
        }

        // Popular selects
        this.populateMaterials();

        // Atualizar tabelas
        this.updateMaterialsTable();
        this.updateStockMovementsTable();
        this.updateDashboardCards();
    }

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

    populateCollaborators() {
        // Método mantido vazio, pois não estamos mais usando colaboradores
        // no modal de entrada de estoque
    }

    handleStockEntry(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const entryData = Object.fromEntries(formData.entries());

        // Validar dados
        if (!this.validateStockEntry(entryData)) return;

        // Criar movimento de entrada
        const newStockEntry = {
            id: this.stockMovements.length + 1,
            type: 'entry',
            material: this.materials.find(m => m.id === parseInt(entryData.material_id)),
            quantity: parseInt(entryData.quantity),
            source: entryData.entry_source,
            invoice_number: entryData.invoice_number || null,
            observations: entryData.observations || null,
            date: new Date()
        };

        // Atualizar estoque do material
        const material = newStockEntry.material;
        material.stock += newStockEntry.quantity;

        // Adicionar movimento
        this.stockMovements.push(newStockEntry);

        // Atualizar tabela e cards
        this.updateStockMovementsTable();
        this.updateDashboardCards();

        // Fechar modal e limpar formulário
        const modal = bootstrap.Modal.getInstance(document.getElementById('stock-entry-modal'));
        modal.hide();
        event.target.reset();

        this.showToast('Entrada de estoque registrada com sucesso!', 'success');
    }

    validateStockEntry(entryData) {
        const material = this.materials.find(m => m.id === parseInt(entryData.material_id));
        const quantity = parseInt(entryData.quantity);

        if (!material) {
            this.showToast('Selecione um material válido.', 'danger');
            return false;
        }

        if (isNaN(quantity) || quantity <= 0) {
            this.showToast('Quantidade inválida.', 'danger');
            return false;
        }

        return true;
    }

    handleStockExit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const exitData = Object.fromEntries(formData.entries());

        // Validar dados
        if (!this.validateStockExit(exitData)) return;

        // Criar movimento de saída
        const newStockExit = {
            id: this.stockMovements.length + 1,
            type: 'exit',
            material: this.materials.find(m => m.id === parseInt(exitData.material_id)),
            quantity: parseInt(exitData.quantity),
            reason: exitData.exit_reason,
            destination: exitData.destination || null,
            observations: exitData.observations || null,
            date: new Date()
        };

        // Atualizar estoque do material
        const material = newStockExit.material;
        material.stock -= newStockExit.quantity;

        // Adicionar movimento
        this.stockMovements.push(newStockExit);

        // Atualizar tabela e cards
        this.updateStockMovementsTable();
        this.updateDashboardCards();

        // Fechar modal e limpar formulário
        const modal = bootstrap.Modal.getInstance(document.getElementById('stock-exit-modal'));
        modal.hide();
        event.target.reset();

        this.showToast('Saída de estoque registrada com sucesso!', 'success');
    }

    validateStockExit(exitData) {
        const material = this.materials.find(m => m.id === parseInt(exitData.material_id));
        const quantity = parseInt(exitData.quantity);

        if (!material) {
            this.showToast('Selecione um material válido.', 'danger');
            return false;
        }

        if (isNaN(quantity) || quantity <= 0) {
            this.showToast('Quantidade inválida.', 'danger');
            return false;
        }

        if (quantity > material.stock) {
            this.showToast(`Quantidade indisponível. Estoque atual: ${material.stock}`, 'danger');
            return false;
        }

        return true;
    }

    updateStockMovementsTable() {
        if (!this.stockMovementsBody) return;

        // Limpar tabela
        this.stockMovementsBody.innerHTML = '';

        // Ordenar movimentos por data (mais recentes primeiro)
        const sortedMovements = this.stockMovements.sort((a, b) => b.date - a.date);

        // Preencher tabela
        sortedMovements.forEach(movement => {
            const row = document.createElement('tr');
            
            // Definir classe de estilo
            const typeClass = movement.type === 'entry' ? 'text-success' : 'text-danger';
            const typeText = movement.type === 'entry' ? 'Entrada' : 'Saída';

            row.innerHTML = `
                <td>${movement.material.name}</td>
                <td class="${typeClass}">${typeText}</td>
                <td>${movement.quantity}</td>
                <td>${movement.type === 'exit' ? movement.reason : movement.source}</td>
                <td>${movement.date.toLocaleDateString('pt-BR')} ${movement.date.toLocaleTimeString('pt-BR')}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info view-movement" data-id="${movement.id}">
                            <i class="ri-eye-line"></i>
                        </button>
                        <button class="btn btn-sm btn-warning edit-movement" data-id="${movement.id}">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-movement" data-id="${movement.id}">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            `;
            this.stockMovementsBody.appendChild(row);
        });
    }

    updateMaterialsTable() {
        if (!this.materialsBody) return;

        // Limpar tabela
        this.materialsBody.innerHTML = '';

        // Ordenar materiais por nome
        const sortedMaterials = this.materials.sort((a, b) => a.name.localeCompare(b.name));

        // Preencher tabela
        sortedMaterials.forEach(material => {
            const row = document.createElement('tr');
            
            // Definir classe de status
            const statusClass = material.status === 'ativo' ? 'text-success' : 'text-danger';
            const stockClass = material.stock < material.minimum_stock ? 'text-danger' : 'text-dark';

            row.innerHTML = `
                <td>${material.sku}</td>
                <td>${material.name}</td>
                <td>${this.formatCategory(material.category)}</td>
                <td class="${stockClass}">${material.stock} ${material.unit}</td>
                <td>${material.minimum_stock} ${material.unit}</td>
                <td class="${statusClass}">${this.formatStatus(material.status)}</td>
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
            this.materialsBody.appendChild(row);
        });
    }

    formatCategory(category) {
        const categoryMap = {
            'hardware': 'Hardware',
            'software': 'Software',
            'acessorio': 'Acessório',
            'consumivel': 'Consumível'
        };
        return categoryMap[category] || category;
    }

    formatStatus(status) {
        const statusMap = {
            'ativo': 'Ativo',
            'inativo': 'Inativo'
        };
        return statusMap[status] || status;
    }

    updateDashboardCards() {
        // Total de materiais em estoque
        const totalStockMaterials = document.getElementById('total-stock-materials');
        if (totalStockMaterials) {
            const totalStock = this.materials.reduce((sum, material) => sum + material.stock, 0);
            totalStockMaterials.textContent = totalStock;
        }

        // Total de entradas de estoque
        const totalStockEntries = document.getElementById('total-stock-entries');
        if (totalStockEntries) {
            const entriesCount = this.stockMovements.filter(m => m.type === 'entry').length;
            totalStockEntries.textContent = entriesCount;
        }

        // Total de saídas de estoque
        const totalStockExits = document.getElementById('total-stock-exits');
        if (totalStockExits) {
            const exitsCount = this.stockMovements.filter(m => m.type === 'exit').length;
            totalStockExits.textContent = exitsCount;
        }
    }

    handleNewMaterial(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const materialData = Object.fromEntries(formData.entries());

        // Validar dados do material
        if (!this.validateNewMaterial(materialData)) return;

        // Criar novo material
        const newMaterial = {
            id: this.materials.length + 1,
            name: materialData.name,
            sku: materialData.sku,
            category: materialData.category,
            unit: materialData.unit,
            minimum_stock: parseInt(materialData.minimum_stock),
            status: materialData.status,
            description: materialData.description,
            stock: 0 // Inicialmente sem estoque
        };

        // Adicionar material à lista
        this.materials.push(newMaterial);

        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('new-material-modal'));
        modal.hide();

        // Limpar formulário
        event.target.reset();

        // Popular novamente os selects de materiais
        this.populateMaterials();

        // Atualizar tabela de materiais
        this.updateMaterialsTable();

        // Mostrar toast de sucesso
        this.showToast(`Material ${newMaterial.name} cadastrado com sucesso!`, 'success');

        // Abrir modal de entrada de estoque automaticamente
        const stockEntryModal = new bootstrap.Modal(document.getElementById('stock-entry-modal'));
        stockEntryModal.show();

        // Pré-selecionar o material recem-criado no modal de entrada
        const materialSelect = document.querySelector('#stock-entry-modal select[name="material_id"]');
        if (materialSelect) {
            materialSelect.value = newMaterial.id;
        }
    }

    validateNewMaterial(materialData) {
        // Verificar campos obrigatórios
        if (!materialData.name || !materialData.sku || !materialData.category) {
            this.showToast('Por favor, preencha todos os campos obrigatórios.', 'danger');
            return false;
        }

        // Verificar se o SKU já existe
        const skuExists = this.materials.some(m => m.sku === materialData.sku);
        if (skuExists) {
            this.showToast('Já existe um material com este SKU.', 'danger');
            return false;
        }

        // Validar estoque mínimo
        const minimumStock = parseInt(materialData.minimum_stock);
        if (isNaN(minimumStock) || minimumStock < 0) {
            this.showToast('Estoque mínimo deve ser um número não negativo.', 'danger');
            return false;
        }

        return true;
    }

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

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.initializeDOM);
        } else {
            this.initializeDOM();
        }
    }
}

// Iniciar a aplicação
const stockManagement = new StockManagement();
stockManagement.init();
