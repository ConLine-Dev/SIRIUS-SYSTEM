class StockManagement {
    constructor() {
        // Usar a instância global criada em material-api.js
        this.materialAPI = window.MaterialAPI;
        this.materialsTable = null;
        this.stockMovementsTable = null;

        // Bind methods
        this.initializeDOM = this.initializeDOM.bind(this);
        this.loadMaterials = this.loadMaterials.bind(this);
        this.loadStockMovements = this.loadStockMovements.bind(this);
        this.handleStockEntry = this.handleStockEntry.bind(this);
        this.handleStockExit = this.handleStockExit.bind(this);
        this.handleNewMaterial = this.handleNewMaterial.bind(this);
    }

    async init() {
        // Esperar o DOM estar completamente carregado
        await this.waitForDOMReady();
        
        // Inicializar elementos do DOM
        this.initializeDOM();
        
        // Configurar DataTables
        this.setupDataTables();
        
        // Carregar dados
        try {
            await this.loadMaterials();
            await this.loadStockMovements();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showToast('Erro ao carregar dados', 'danger');
        }
        
        // Configurar event listeners
        this.setupEventListeners();
        this.setupMaterialEditHandlers();
    }

    // Método para esperar o DOM estar pronto
    waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    initializeDOM() {
        // Selecionar elementos do DOM com verificação de existência
        this.stockEntryForm = document.getElementById('stock-entry-form');
        this.stockExitForm = document.getElementById('stock-exit-form');
        this.newMaterialForm = document.getElementById('new-material-form');
        this.materialsBody = document.getElementById('materials-body');
        this.stockMovementsBody = document.getElementById('stock-movements-body');
        
        // Elementos de resumo
        // this.totalStockMaterials = document.getElementById('total-stock-materials');
        // this.totalStockEntries = document.getElementById('total-stock-entries');
        // this.totalStockExits = document.getElementById('total-stock-exits');

        // Remover loader se existir
        const loader = document.querySelector('#loader');
        if (loader && loader.classList) {
            loader.classList.add('d-none');
        }
    }

    // Utilitários de formatação
    formatDate(dateString) {
        if (!dateString) return 'Não informado';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatStatus(status) {
        const statusMap = {
            'active': { 
                text: 'Ativo', 
                class: 'badge-success' 
            },
            'inactive': { 
                text: 'Inativo', 
                class: 'badge-danger' 
            },
            'low_stock': { 
                text: 'Baixo Estoque', 
                class: 'badge-warning' 
            },
            'default': { 
                text: status || 'Não definido', 
                class: 'badge-secondary' 
            }
        };
        
        const statusInfo = statusMap[status] || statusMap['default'];
        return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
    }

    formatMovementType(type) {
        const typeMap = {
            'input': { 
                text: 'Entrada', 
                class: 'badge-success' 
            },
            'output': { 
                text: 'Saída', 
                class: 'badge-danger' 
            },
            'transfer': { 
                text: 'Transferência', 
                class: 'badge-info' 
            },
            'default': { 
                text: type || 'Não definido', 
                class: 'badge-secondary' 
            }
        };
        
        const typeInfo = typeMap[type] || typeMap['default'];
        return `<span class="badge ${typeInfo.class}">${typeInfo.text}</span>`;
    }

    formatMaterialCategory(category) {
        const categoryMap = {
            'hardware': 'Hardware',
            'software': 'Software',
            'acessorio': 'Acessório',
            'consumivel': 'Consumível',
            'default': 'Não categorizado'
        };
        
        return categoryMap[category.toLowerCase()] || categoryMap['default'];
    }

    formatMovementReason(reason) {
        console.log(reason)
        const reasonMap = {
            // Entradas de estoque
            'purchase': 'Compra',
            'donation': 'Doação',
            'transfer': 'Transferência',
            'transfer_in': 'Transferência de Entrada',
            'inventory_adjustment': 'Ajuste de Inventário',
            'return': 'Devolução',

            // Saídas de estoque
            'allocation': 'Alocação',
            'transfer_out': 'Transferência de Saída',
            'loss': 'Perda',
            'damage': 'Dano',
            'consumption': 'Consumo',
            'maintenance': 'Manutenção',

            // Outros
            'default': reason || 'Motivo não especificado'
        };

        return reasonMap[reason] || reasonMap['default'];
    }

    formatMovementDetails(movement) {
        // Adicionar lógica para lidar com o novo campo real_quantity
        const realQuantityInfo = movement.real_quantity !== undefined && movement.real_quantity !== null 
            ? `<div class="row mt-2">
                    <div class="col-12">
                        <strong>Quantidade Real:</strong> ${movement.real_quantity}
                    </div>
                </div>`
            : '';

        return `
            <div class="movement-details">
                <div class="row">
                    <div class="col-md-6">
                        <strong>Material:</strong> ${movement.material_name || 'Não identificado'}
                    </div>
                    <div class="col-md-6">
                        <strong>Tipo:</strong> ${this.formatMovementType(movement.movement_type)}
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-md-6">
                        <strong>Quantidade:</strong> ${movement.quantity || '0'}
                    </div>
                    <div class="col-md-6">
                        <strong>Data:</strong> ${this.formatDate(movement.movement_date)}
                    </div>
                </div>
                ${realQuantityInfo}
                <div class="row mt-2">
                    <div class="col-12">
                        <strong>Origem/Fonte:</strong> ${movement.source || 'Não especificado'}
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-12">
                        <strong>Motivo:</strong> ${this.formatMovementReason(movement.reason)}
                    </div>
                </div>
                ${movement.observations ? `
                <div class="row mt-2">
                    <div class="col-12">
                        <strong>Observações:</strong> ${movement.observations}
                    </div>
                </div>
                ` : ''}
                ${movement.invoice_number ? `
                <div class="row mt-2">
                    <div class="col-12">
                        <strong>Número da Nota Fiscal:</strong> ${movement.invoice_number}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    setupDataTables() {
        // Verificar se os elementos existem antes de inicializar DataTables
        if (document.getElementById('materials-table')) {
            this.materialsTable = $('#materials-table').DataTable({
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/pt-BR.json'
                },
                responsive: true,
                pageLength: 10,
                columns: [
                    { 
                        data: 'sku',
                        render: (data) => data || 'Não informado'
                    },
                    { 
                        data: 'name',
                        render: (data) => data || 'Sem nome'
                    },
                    { 
                        data: 'category',
                        render: (data) => this.formatMaterialCategory(data)
                    },
                    { 
                        data: 'real_quantity',
                        render: (data) => data !== null ? data : '0'
                    },
                    { 
                        data: 'minimum_stock',
                        render: (data) => data !== null ? data : 'Não definido'
                    },
                    { 
                        data: 'status',
                        render: (data) => this.formatStatus(data)
                    },
                    {
                        data: null,
                        render: () => `
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-sm btn-info edit-material" title="Editar Material">
                                    <i class="ti ti-edit"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-danger delete-material" title="Excluir Material">
                                    <i class="ti ti-trash"></i>
                                </button>
                            </div>
                        `
                    }
                ]
            });
        }

        if (document.getElementById('stock-movements-table')) {
            this.stockMovementsTable = $('#stock-movements-table').DataTable({
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/pt-BR.json'
                },
                responsive: true,
                pageLength: 10,
                columns: [
                    { 
                        data: 'material_name',
                        render: (data) => data || 'Material não identificado'
                    },
                    { 
                        data: 'movement_type_label',
                        render: (data) => data
                    },
                    { 
                        data: 'quantity',
                        render: (data) => data !== null ? data : '0'
                    },
                    { 
                        data: 'reason',
                        render: (data) => this.formatMovementReason(data)
                    },
                    { 
                        data: 'movement_date',
                        render: (data) => this.formatDate(data)
                    },
                    {
                        data: null,
                        render: () => `
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-info view-movement" title="Detalhes da Movimentação">
                                    <i class="ri-eye-line"></i>
                                </button>
                            </div>
                        `
                    }
                ]
            });
        }
    }

    setupEventListeners() {
        if (this.stockEntryForm) {
            this.stockEntryForm.addEventListener('submit', this.handleStockEntry);
        }
        if (this.stockExitForm) {
            this.stockExitForm.addEventListener('submit', this.handleStockExit);
        }
        if (this.newMaterialForm) {
            this.newMaterialForm.addEventListener('submit', this.handleNewMaterial);
        }

        // Adicionar listener para visualização de movimentações
        if (document.getElementById('stock-movements-table')) {
            $('#stock-movements-table').on('click', '.view-movement', (event) => {
                const row = $(event.currentTarget).closest('tr');
                const movementData = this.stockMovementsTable.row(row).data();
                
                // Criar modal de detalhes
                const modalHtml = `
                    <div class="modal fade" id="movement-details-modal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Detalhes da Movimentação</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    ${this.formatMovementDetails(movementData)}
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Remover modais existentes
                $('#movement-details-modal').remove();
                
                // Adicionar modal ao body
                $('body').append(modalHtml);
                
                // Mostrar modal
                const modal = new bootstrap.Modal(document.getElementById('movement-details-modal'));
                modal.show();
            });
        }
    }

    setupMaterialEditHandlers() {
        const materialTable = document.getElementById('materials-table');
        materialTable.addEventListener('click', async (event) => {
            const editButton = event.target.closest('.edit-material');
            if (editButton) {
                const row = editButton.closest('tr');
                const materialId = row.dataset.materialId;
                
                // Encontrar o material na lista de materiais
                const material = this.materials.find(m => m.id == materialId);
                
                if (material) {
                    // Preencher modal de edição
                    document.getElementById('edit-material-id').value = material.id;
                    document.getElementById('edit-material-name').value = material.name;
                    document.getElementById('edit-material-description').value = material.description || '';
                    document.getElementById('edit-material-category').value = material.category;
                    document.getElementById('edit-material-sku').value = material.sku;
                    document.getElementById('edit-material-unit').value = material.unit;
                    document.getElementById('edit-material-minimum-stock').value = material.minimum_stock || 0;
                    document.getElementById('edit-material-status').value = material.status;

                    // Mostrar modal de edição
                    const editModal = new bootstrap.Modal(document.getElementById('edit-material-modal'));
                    editModal.show();
                }
            }
        });

        // Adicionar evento de submit no formulário de edição
        const editForm = document.getElementById('edit-material-form');
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const materialData = Object.fromEntries(formData.entries());

            try {
                const result = await this.materialAPI.editMaterial(materialData);
                
                // Recarregar materiais
                await this.loadMaterials();

                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('edit-material-modal'));
                modal.hide();
                event.target.reset();

                showToast('Material editado com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao editar material:', error);
                showToast('Erro ao editar material: ' + error.message, 'danger');
            }
        });
    }

    async loadMaterials() {
        try {
            // Buscar materiais com estoque calculado
            const materials = await this.materialAPI.getAllMaterials();
            console.log(materials)
            
            // Verificar se a tabela de materiais foi inicializada
            if (this.materialsTable) {
                // Limpar tabela
                this.materialsTable.clear();
                
                // Adicionar materiais à tabela
                this.materialsTable.rows.add(materials.map(material => {
                    // Usar stock_details para obter a quantidade disponível
                    const availableStock = material.stock_details ? material.stock_details.available_stock : '0';
                    const status = material.stock_details ? material.stock_details.stock_status : material.material_status;

                    return {
                        ...material,
                        status: this.formatStatus(status || (availableStock <= material.minimum_stock ? 'low_stock' : 'active')),
                        category: this.formatMaterialCategory(material.category),
                        real_quantity: availableStock,
                        actions: `
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-sm btn-info view-material" data-id="${material.id}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-warning edit-material" data-id="${material.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        `
                    };
                }));
                
                // Redesenhar tabela
                this.materialsTable.draw();
            }

            // Atualizar card de total de materiais
            if (this.totalStockMaterials) {
                this.totalStockMaterials.textContent = materials.length;
            }

            // Popular selects de materiais em outros formulários
            this.populateMaterialSelects(materials);

            return materials;
        } catch (error) {
            console.error('Erro ao carregar materiais:', error);
            showToast('Erro ao carregar materiais', 'danger');
            return [];
        }
    }

    populateMaterialSelects(materials) {
        const materialSelects = document.querySelectorAll('select[name="material_id"]');
        materialSelects.forEach(select => {
            select.innerHTML = '<option value="">Selecione um material</option>';
            
            materials.forEach(material => {
                const option = document.createElement('option');
                option.value = material.id;
                
                // Usar stock_details para obter a quantidade disponível
                const availableStock = material.stock_details ? material.stock_details.available_stock : '0';
                
                option.textContent = `${material.name} (${material.sku}) - Estoque: ${availableStock}`;
                select.appendChild(option);
            });
        });
    }

    async loadStockMovements() {
        try {
            const movements = await this.materialAPI.getMovementHistory();
            console.log(movements)
            
            // Verificar se a tabela de movimentações foi inicializada
            if (this.stockMovementsTable) {
                // Limpar tabela
                this.stockMovementsTable.clear();
                
                // Adicionar movimentações à tabela
                this.stockMovementsTable.rows.add(movements);
                this.stockMovementsTable.draw();
            }

            // Atualizar cards de entradas e saídas
            if (this.totalStockEntries && this.totalStockExits) {
                // Usar os dados de entrada e saída do primeiro movimento (se existir)
                const firstMovement = movements[0] || {};
                
                const entries = firstMovement.total_input || '0';
                const exits = firstMovement.total_output || '0';
                
                this.totalStockEntries.textContent = entries;
                this.totalStockExits.textContent = exits;
            }
        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
            showToast('Erro ao carregar movimentações', 'danger');
        }
    }

    async handleStockEntry(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const entryData = Object.fromEntries(formData.entries());

        // Mapear valores para os campos corretos
        const reasonMap = {
            'compra': 'purchase',
            'doacao': 'donation',
            'transferencia': 'transfer',
            'manutencao': 'maintenance'
        };
        
        // Adicionar campos padrão se não existirem
        entryData.reason = entryData.reason 
            ? reasonMap[entryData.reason.toLowerCase()] || 'purchase'
            : 'purchase';
        entryData.source = entryData.source || 'Sistema';
        entryData.observations = entryData.observations || 'Entrada padrão de estoque';

        try {
            const result = await this.materialAPI.registerStockEntry(entryData);
            
            // Recarregar movimentações e materiais
            await this.loadStockMovements();
            await this.loadMaterials();

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('stock-entry-modal'));
            modal.hide();
            event.target.reset();

            showToast('Entrada de estoque registrada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao registrar entrada de estoque:', error);
            showToast('Erro ao registrar entrada de estoque: ' + error.message, 'danger');
        }
    }

    async handleStockExit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const outputData = Object.fromEntries(formData.entries());

        // Mapear valores para os campos corretos
        const reasonMap = {
            'uso_interno': 'transfer',
            'manutencao': 'maintenance',
            'descarte': 'disposal',
            'transferencia': 'transfer'
        };

        console.log('aqui', outputData)
        
        // Adicionar campos padrão se não existirem
        outputData.reason = outputData.exit_reason 
            ? reasonMap[outputData.exit_reason.toLowerCase()] || 'transfer'
            : 'transfer';
        outputData.destination = outputData.destination || 'Sistema';
        outputData.observations = outputData.observations || 'Saída padrão de estoque';

        try {
            const result = await this.materialAPI.registerStockOutput(outputData);
            
            // Recarregar movimentações e materiais
            await this.loadStockMovements();
            await this.loadMaterials();

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('stock-exit-modal'));
            modal.hide();
            event.target.reset();

            showToast('Saída de estoque registrada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao registrar saída de estoque:', error);
            showToast('Erro ao registrar saída de estoque: ' + error.message, 'danger');
        }
    }

    async handleNewMaterial(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const materialData = Object.fromEntries(formData.entries());

        // Mapear valores para os campos corretos
        materialData.minimum_stock = materialData.minimum_stock || '0';
        
        // Mapear unidade para os valores permitidos
        const unitMap = {
            'unidade': 'unit',
            'caixa': 'box',
            'pacote': 'package',
            'litro': 'liter',
            'kg': 'kg'
        };
        materialData.unit = unitMap[materialData.unit.toLowerCase()] || 'unit';

        // Mapear status para os valores permitidos
        const statusMap = {
            'ativo': 'active',
            'active': 'active',
            'inativo': 'inactive',
            'inactive': 'inactive'
        };
        materialData.status = statusMap[materialData.status.toLowerCase()] || 'active';

        try {
            const result = await this.materialAPI.createMaterial(materialData);
            
            // Recarregar materiais
            await this.loadMaterials();

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('new-material-modal'));
            modal.hide();
            event.target.reset();

            showToast('Material cadastrado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao cadastrar material:', error);
            showToast('Erro ao cadastrar material: ' + error.message, 'danger');
        }
    }
}

// Função global para mostrar toast
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.warn('Contêiner de toast não encontrado');
        return;
    }

    const toast = document.createElement('div');
    toast.classList.add('toast', `text-bg-${type}`);
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Notificação</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remover o toast após alguns segundos
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Iniciar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    const stockManagement = new StockManagement();
    stockManagement.init();
});
