// Gestão de Materiais de TI

class MaterialManager {
    constructor() {
        // Dados fictícios de materiais
        this.materials = [
            { 
                id: 1, 
                name: 'Notebook Dell', 
                sku: 'NT-001', 
                category: 'hardware', 
                description: 'Notebook Dell Inspiron 15',
                supplier: 'Dell Brasil',
                unit_price: 5000.00,
                stock: 10,
                minimum_stock: 5,
                status: 'ativo'
            },
            { 
                id: 2, 
                name: 'Monitor LG', 
                sku: 'MT-002', 
                category: 'hardware', 
                description: 'Monitor LG 24 polegadas',
                supplier: 'LG Eletrônicos',
                unit_price: 800.00,
                stock: 15,
                minimum_stock: 8,
                status: 'ativo'
            },
            { 
                id: 3, 
                name: 'Windows 10 Pro', 
                sku: 'SW-003', 
                category: 'software', 
                description: 'Licença Windows 10 Professional',
                supplier: 'Microsoft',
                unit_price: 1200.00,
                stock: 50,
                minimum_stock: 20,
                status: 'ativo'
            }
        ];

        this.initEventListeners();
    }

    initEventListeners() {
        $(document).ready(() => {
            this.loadMaterials();
        });
    }

    loadMaterials() {
        try {
            const tableBody = $('#materials-table-body');
            if (tableBody.length === 0) {
                console.warn('Tabela de materiais não encontrada');
                return;
            }
            
            tableBody.empty();

            this.materials.forEach(material => {
                const lowStockClass = material.stock <= material.minimum_stock ? 'table-warning' : '';
                const row = `
                    <tr class="${lowStockClass}">
                        <td>${material.name}</td>
                        <td>${material.sku}</td>
                        <td>${material.category}</td>
                        <td>${material.stock}</td>
                        <td>${material.status}</td>
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
                    </tr>
                `;
                tableBody.append(row);
            });

            this.updateDashboardCards();
        } catch (error) {
            console.error('Erro ao carregar materiais:', error);
        }
    }

    updateDashboardCards() {
        const totalMaterials = this.materials.length;
        const activeMaterials = this.materials.filter(m => m.status === 'ativo').length;
        const lowStockMaterials = this.materials.filter(m => m.stock <= m.minimum_stock).length;

        $('#total-materials').text(totalMaterials);
        $('#active-materials').text(activeMaterials);
        $('#low-stock-materials').text(lowStockMaterials);
    }
}

class MaterialRegistrationManager {
    constructor(materialManager) {
        this.materialManager = materialManager;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const materialRegistrationForm = document.getElementById('material-registration-form');
        
        if (materialRegistrationForm) {
            materialRegistrationForm.addEventListener('submit', this.handleMaterialRegistration.bind(this));
        }

        this.setupFormValidation();
    }

    // Função para mostrar toast
    showToast(message, type = 'info') {
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

    // Manipular registro de material
    handleMaterialRegistration(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const materialData = Object.fromEntries(formData.entries());
        
        // Validações básicas
        if (!this.validateMaterialData(materialData)) {
            return;
        }

        // Criar objeto de material
        const newMaterial = this.createMaterialObject(materialData);

        // Adicionar material à lista do MaterialManager
        this.materialManager.materials.push(newMaterial);
        this.materialManager.loadMaterials();

        // Simular envio para o backend
        console.log('Novo material registrado:', newMaterial);
        this.showToast('Material registrado com sucesso!', 'success');

        // Limpar formulário
        form.reset();
        
        // Fechar modal se estiver em um
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) modal.hide();
    }

    // Validar dados do material
    validateMaterialData(materialData) {
        if (!materialData.name || !materialData.sku || !materialData.category) {
            this.showToast('Por favor, preencha todos os campos obrigatórios.', 'danger');
            return false;
        }

        const initialStock = parseInt(materialData.initial_stock);
        const minimumStock = parseInt(materialData.minimum_stock);

        if (isNaN(initialStock) || isNaN(minimumStock)) {
            this.showToast('Quantidade inicial e estoque mínimo devem ser números válidos.', 'danger');
            return false;
        }

        if (initialStock < 0 || minimumStock < 0) {
            this.showToast('Quantidade inicial e estoque mínimo não podem ser negativos.', 'danger');
            return false;
        }

        return true;
    }

    // Criar objeto de material
    createMaterialObject(materialData) {
        return {
            id: Date.now(), // ID temporário
            name: materialData.name,
            sku: materialData.sku,
            category: materialData.category,
            stock: parseInt(materialData.initial_stock),
            minimum_stock: parseInt(materialData.minimum_stock),
            status: materialData.status || 'ativo'
        };
    }

    // Configurar validações adicionais
    setupFormValidation() {
        const skuInput = document.querySelector('input[name="sku"]');
        if (skuInput) {
            skuInput.addEventListener('input', function(e) {
                // Converter para maiúsculas e remover caracteres especiais
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            });
        }
    }
}

// Inicialização
$(document).ready(() => {
    const materialManager = new MaterialManager();
    const materialRegistrationManager = new MaterialRegistrationManager(materialManager);
});
