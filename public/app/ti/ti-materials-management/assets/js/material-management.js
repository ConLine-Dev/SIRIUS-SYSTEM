// Material Management Module
 // Inicialização das tabelas mantida
 const tables = {};

class MaterialManagement {
    constructor() {
        // Usar a instância global criada em material-api.js
        this.materialAPI = window.MaterialAPI;
        if (!this.materialAPI) {
            console.error('MaterialAPI não foi inicializado corretamente');
            this.materialAPI = new MaterialAPI();
        }

        // Dados de exemplo (serão substituídos pela API posteriormente)
        this.collaborators = [];
        this.materials = [];
        this.materialMovements = [];
        this.currentGrouping = 'none';

        // Bind methods
        const methodsToBind = [
            'initializeDOM',
            'setupFiltersAndGrouping',
            'handleCustomDateRange',
            'applyFilters',
            'applyGrouping',
            'populateFilterSelects',
            'clearFilters',
            'clearGrouping',
            'handleMaterialAllocation',
            'handleMaterialReturn',
            'updateTables',
            'loadAllocatedMaterials',  
            'populateReturnMaterialSelects'  
        ];

        methodsToBind.forEach(method => {
            if (typeof this[method] === 'function') {
                this[method] = this[method].bind(this);
            }
        });
    }

    // Inicializar elementos do DOM
    initializeDOM() {
        // Elementos de filtro
        this.filterMovementType = document.getElementById('filter-movement-type');
        this.filterMaterial = document.getElementById('filter-material');
        this.filterCollaborator = document.getElementById('filter-collaborator');
        this.filterPeriod = document.getElementById('filter-period');
        this.filterDateStart = document.getElementById('filter-date-start');
        this.filterDateEnd = document.getElementById('filter-date-end');
        this.filterQuantity = document.getElementById('filter-quantity');
        this.customDateRange = document.getElementById('custom-date-range');
        this.clearFiltersBtn = document.getElementById('clear-filters');

        // Inicializar formulário de alocação
        const allocationForm = document.getElementById('material-allocation-form');
        if (allocationForm) {
            allocationForm.addEventListener('submit', this.handleMaterialAllocation);
        }

        // Inicializar formulário de devolução
        const returnForm = document.getElementById('material-return-form');
        if (returnForm) {
            returnForm.addEventListener('submit', this.handleMaterialReturn);
        }

        // Inicializar select de colaborador para devolução
        const returnCollaboratorSelect = document.getElementById('return-collaborator-select');
        if (returnCollaboratorSelect) {
            returnCollaboratorSelect.addEventListener('change', this.loadAllocatedMaterials);
        }

        // Configurar filtros e agrupamentos
        this.setupFiltersAndGrouping();
        
        // Preencher selects de filtro
        // this.populateFilterSelects();
    }

    // Popular selects de filtro com dados da API
    populateFilterSelects() {
        try {
            // Limpar opções existentes, mantendo a opção "Todos"
            this.filterMaterial.innerHTML = '<option value="">Todos</option>';
            this.filterCollaborator.innerHTML = '<option value="">Todos</option>';

            // Obter dados da tabela
            const tableData = tables['recent_movements'].data().toArray();

            // Extrair materiais e colaboradores únicos
            const uniqueMaterials = [...new Set(tableData.map(row => row[0]))];
            const uniqueCollaborators = [...new Set(tableData.map(row => row[1]))];

            // Preencher select de materiais
            uniqueMaterials
                .filter(material => material) // Remove valores vazios
                .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                .forEach(material => {
                    const option = new Option(material, material);
                    this.filterMaterial.appendChild(option);
                });

            // Preencher select de colaboradores
            uniqueCollaborators
                .filter(collaborator => collaborator) // Remove valores vazios
                .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                .forEach(collaborator => {
                    const option = new Option(collaborator, collaborator);
                    this.filterCollaborator.appendChild(option);
                });

        } catch (error) {
            console.error('Erro ao popular selects de filtro:', error);
        }
    }

    // Configurar filtros e agrupamentos
    setupFiltersAndGrouping() {
        // Configurar listeners para filtros
        const filters = [
            this.filterMovementType,
            this.filterMaterial,
            this.filterCollaborator,
            this.filterPeriod,
            this.filterQuantity,
            this.filterDateStart,
            this.filterDateEnd
        ];

        filters.forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
            }
        });

        // Configurar listener para datas customizadas
        this.filterPeriod?.addEventListener('change', this.handleCustomDateRange);

        // Configurar listener para limpar filtros
        this.clearFiltersBtn?.addEventListener('click', this.clearFilters);

        // Configurar listeners para agrupamento
        const groupingLinks = document.querySelectorAll('[data-group]');
        groupingLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentGrouping = e.target.dataset.group;
                this.applyGrouping();
            });
        });
    }

    // Limpar todos os filtros
    clearFilters() {
        const filters = [
            this.filterMovementType,
            this.filterMaterial,
            this.filterCollaborator,
            this.filterPeriod,
            this.filterQuantity,
            this.filterDateStart,
            this.filterDateEnd
        ];

        filters.forEach(filter => {
            if (filter) {
                filter.value = '';
            }
        });

        this.customDateRange.classList.add('d-none');
        this.applyFilters();
    }

    // Manipular exibição do range de datas customizado
    handleCustomDateRange(e) {
        if (this.customDateRange) {
            this.customDateRange.classList.toggle('d-none', e.target.value !== 'custom');
        }
    }

    // Aplicar filtros à tabela
    applyFilters() {
        if (!tables['recent_movements']) return;

        // Limpar filtros anteriores
        $.fn.dataTable.ext.search = [];

        // Adicionar novo filtro
        $.fn.dataTable.ext.search.push((settings, data) => {
            if (settings.nTable.id !== 'recent-movements-table') return true;

            const movementType = this.filterMovementType?.value || '';
            const material = this.filterMaterial?.value || '';
            const collaborator = this.filterCollaborator?.value || '';
            const period = this.filterPeriod?.value || '';
            const quantityRange = this.filterQuantity?.value || '';

            // Filtro de material
            if (material && data[0] !== material) return false;

            // Filtro de colaborador
            if (collaborator && data[1] !== collaborator) return false;

            // Filtro de tipo de movimentação
            if (movementType) {
                const type = data[2].toLowerCase();
                switch (movementType) {
                    case 'input':
                        if (!type.includes('entrada')) return false;
                        break;
                    case 'output':
                        if (!type.includes('saída')) return false;
                        break;
                    case 'allocation':
                        if (!type.includes('alocação')) return false;
                        break;
                    case 'return':
                        if (!type.includes('devolução')) return false;
                        break;
                }
            }

            // Filtro de período
            const rowDate = new Date(data[4]);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (period) {
                switch (period) {
                    case 'today':
                        if (rowDate.toDateString() !== today.toDateString()) return false;
                        break;
                    case 'yesterday':
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        if (rowDate.toDateString() !== yesterday.toDateString()) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        if (rowDate < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date(today);
                        monthAgo.setDate(monthAgo.getDate() - 30);
                        if (rowDate < monthAgo) return false;
                        break;
                    case 'custom':
                        const startDate = this.filterDateStart?.value ? new Date(this.filterDateStart.value) : null;
                        const endDate = this.filterDateEnd?.value ? new Date(this.filterDateEnd.value) : null;
                        
                        if (startDate) {
                            startDate.setHours(0, 0, 0, 0);
                            if (rowDate < startDate) return false;
                        }
                        
                        if (endDate) {
                            endDate.setHours(23, 59, 59, 999);
                            if (rowDate > endDate) return false;
                        }
                        break;
                }
            }

            // Filtro de quantidade
            const quantity = parseInt(data[3]);
            if (quantityRange) {
                const [min, max] = quantityRange.split('-').map(n => parseInt(n));
                if (quantityRange === '51+') {
                    if (quantity <= 50) return false;
                } else {
                    if (quantity < min || (max && quantity > max)) return false;
                }
            }

            return true;
        });

        tables['recent_movements'].draw();
    }

    // Aplicar agrupamento à tabela
    applyGrouping() {
        if (!tables['recent_movements']) return;

        const table = tables['recent_movements']
        // Atualizar indicador de agrupamento
        const $indicator = $('#grouping-indicator');
        const $currentGrouping = $('#current-grouping');
        
        if (this.currentGrouping === 'none') {
            $indicator.hide();
        } else {
            const groupLabels = {
                'type': 'Tipo',
                'material': 'Material',
                'collaborator': 'Colaborador',
                'date': 'Data'
            };
            $currentGrouping.text(groupLabels[this.currentGrouping]);
            $indicator.show();
        }

        // Remover agrupamento anterior e restaurar ordenação padrão
        if (table.rowGroup) {
            table.rowGroup().disable();
        }
        
        // Se não houver agrupamento selecionado, mostrar todas as linhas e retornar
        if (this.currentGrouping === 'none') {
            table.order([4, 'desc']); // Ordenação padrão por data
            $('#recent-movements-table tbody tr').show();
            $('#recent-movements-table tbody tr').removeClass('group-header');
            table.draw();
            return;
        }

        // Configurar rowGroup baseado no tipo de agrupamento
        const groupConfig = {
            'material': {
                dataSrc: 0,
                icon: 'ti-box',
                className: 'bg-light'
            },
            'collaborator': {
                dataSrc: 1,
                icon: 'ti-user',
                className: 'bg-light'
            },
            'type': {
                dataSrc: 2,
                icon: 'ti-tag',
                className: (group) => this.getTypeClass(group)
            },
            'date': {
                dataSrc: 4,
                icon: 'ti-calendar',
                className: 'bg-light',
                formatter: (value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('pt-BR');
                }
            }
        };

        const config = groupConfig[this.currentGrouping];
        if (config) {
            // Configurar rowGroup
            table.rowGroup({
                dataSrc: (row) => {
                    const value = row[config.dataSrc];
                    return config.formatter ? config.formatter(value) : value;
                },
                startRender: (rows, group) => {
                    const count = rows.count();
                    const className = typeof config.className === 'function' ? 
                        config.className(group) : config.className;

                    // Retornar HTML do grupo
                    return $('<tr/>')
                        .addClass('group-header ' + className)
                        .append(
                            $('<td/>')
                                .attr('colspan', 5)
                                .append(
                                    $('<div/>')
                                        .addClass('d-flex align-items-center')
                                        .append(
                                            $('<button/>')
                                                .addClass('btn btn-sm btn-icon me-2 toggle-group')
                                                .append($('<i/>').addClass('ti ' + config.icon + ' ti-chevron-right')),
                                            $('<span/>').addClass('fw-bold').text(group),
                                            $('<span/>')
                                                .addClass('badge bg-primary ms-2')
                                                .text(count + (count === 1 ? ' item' : ' itens'))
                                        )
                                )
                        )[0];
                }
            }).enable();

            // Ordenar pela coluna do grupo
            table.order([config.dataSrc, 'asc']);

            // Adicionar listener para toggle dos grupos
            $('#recent-movements-table tbody').off('click', 'tr.group-header').on('click', 'tr.group-header', function() {
                const $this = $(this);
                const $icon = $this.find('.toggle-group i');
                const $rows = $this.nextUntil('tr.group-header');
                
                // Toggle das linhas do grupo
                $rows.toggle();
                
                // Toggle do ícone
                $icon.toggleClass('ti-chevron-right ti-chevron-down');
            });

            // Esconder todas as linhas de dados inicialmente
            setTimeout(() => {
                const $rows = $('#recent-movements-table tbody tr:not(.group-header)');
                $rows.hide();
            }, 100);
        }

        // Redesenhar a tabela
        table.draw();
    }

    // Método para limpar agrupamento
    clearGrouping() {
        $('#group-select').val('none').trigger('change');
    }

    // Obter classe CSS baseada no tipo de movimentação
    getTypeClass(type) {
        const typeClasses = {
            'Entrada de Estoque': 'bg-success-subtle',
            'Saída de Estoque': 'bg-danger-subtle',
            'Alocação': 'bg-primary-subtle',
            'Devolução': 'bg-warning-subtle'
        };
        return typeClasses[type] || 'bg-light';
    }

    // Inicializar tabelas
    initializeTables() {
        // Configurar tabela de movimentações recentes
        tables['recent_movements'] = $('#recent-movements-table').DataTable({
            processing: true,
            serverSide: false,
            dom: 'frt', // Remove elementos desnecessários
            paging: false, // Desativa a paginação
            fixedHeader: true, // Cabeçalho fixo
            info: false, // Remove a informação de quantidade de registros
            scrollY: 'calc(100vh - 240px)', // Define a altura dinamicamente
            scrollCollapse: false, // Permite que a rolagem seja usada somente quando necessário
            ajax: {
                url: '/api/material-control/movements',
                dataSrc: function (json) {
                    return json.map(item => {
                        // Determinar o tipo de movimentação
                        let type = '';
                        
                        // Primeiro, verificar o movement_type_label se existir
                        if (item.movement_type_label) {
                            type = item.movement_type_label;
                        }
                        // Se não tiver label, verificar source e movement_type
                        else if (item.source === 'return') {
                            type = 'Devolução';
                        } else if (item.source === 'allocation') {
                            type = 'Alocação';
                        } else if (item.movement_type === 'input' || item.type === 'input') {
                            type = 'Entrada de Estoque';
                        } else if (item.movement_type === 'output' || item.type === 'output') {
                            type = 'Saída de Estoque';
                        } else if (item.type) {
                            // Se tiver apenas o type, usar ele
                            type = item.type.charAt(0).toUpperCase() + item.type.slice(1);
                        }

                        // Formatar a data
                        const date = new Date(item.created_at || item.movement_date);
                        const formattedDate = date.toLocaleString('pt-BR');

                        // Log para debug
                        console.log('Processando item:', {
                            original: item,
                            processedType: type
                        });

                        return [
                            item.material_name || 'Material não identificado',
                            item.collaborator_name || '-',
                            type || 'Tipo não identificado',
                            item.quantity || 0,
                            formattedDate
                        ];
                    });
                }
            },
            columns: [
                { 
                    title: 'Material',
                    className: 'align-middle'
                },
                { 
                    title: 'Colaborador',
                    className: 'align-middle'
                },
                { 
                    title: 'Tipo',
                    className: 'align-middle',
                    render: function(data) {
                        const typeClasses = {
                            'Entrada de Estoque': 'success',
                            'Saída de Estoque': 'danger',
                            'Alocação': 'primary',
                            'Devolução': 'warning'
                        };
                        const badgeClass = typeClasses[data] || 'secondary';
                        return `<span class="badge bg-${badgeClass}">${data}</span>`;
                    }
                },
                { 
                    title: 'Quantidade',
                    className: 'align-middle text-center'
                },
                { 
                    title: 'Data',
                    className: 'align-middle',
                    render: (data) => this.formatDateToBrazilianTime(data)
                }
            ],
            order: [[4, 'desc']], // Ordenar por data decrescente
            responsive: true,
            language: {
                url: '../../assets/libs/datatables/pt-BR.json',
                search: '',
                searchPlaceholder: 'Pesquisar...'
            },
            rowGroup: {
                enable: false,
                startRender: function(rows, group) {
                    const count = rows.count();
                    let icon = 'ti-chevron-right';
                    let groupClass = '';
                    
                    // Definir ícone e classe baseado no tipo de agrupamento
                    switch(this.currentGrouping) {
                        case 'type':
                            icon = 'ti-tag';
                            groupClass = this.getTypeClass(group);
                            break;
                        case 'material':
                            icon = 'ti-box';
                            groupClass = 'bg-light';
                            break;
                        case 'collaborator':
                            icon = 'ti-user';
                            groupClass = 'bg-light';
                            break;
                        case 'date':
                            icon = 'ti-calendar';
                            groupClass = 'bg-light';
                            break;
                    }

                    // Retornar HTML do grupo
                    return $('<tr/>')
                        .addClass('group-header ' + groupClass)
                        .append(
                            $('<td/>')
                                .attr('colspan', 5)
                                .append(
                                    $('<div/>')
                                        .addClass('d-flex align-items-center')
                                        .append(
                                            $('<button/>')
                                                .addClass('btn btn-sm btn-icon me-2 toggle-group')
                                                .append($('<i/>').addClass('ti ' + icon + ' ti-chevron-right')),
                                            $('<span/>').addClass('fw-bold').text(group),
                                            $('<span/>')
                                                .addClass('badge bg-primary ms-2')
                                                .text(count + (count === 1 ? ' item' : ' itens'))
                                        )
                                )
                        )[0];
                }
            },
            initComplete: () => {
                // Após a tabela ser inicializada e preenchida, popular os filtros
                this.populateFilterSelects();
            }
        });
    }

    // Função auxiliar para formatar data para horário brasileiro
    formatDateToBrazilianTime(dateStr) {
        if (!dateStr) return '';
        
        try {
            // Separa data e hora
            const [data, hora] = dateStr.split(', ');
            
            // Separa dia, mês e ano
            const [dia, mes, ano] = data.split('/');
            
            // Cria a data no formato correto
            const date = new Date(`${ano}-${mes}-${dia}T${hora}`);
            
            // Verifica se a data é válida
            if (isNaN(date.getTime())) {
                console.error('Data inválida:', dateStr);
                return dateStr;
            }
            
            // Ajusta para UTC-3 (horário do Brasil)
            const dataLocal = new Date(date.getTime() - (3 * 60 * 60 * 1000));
            
            const diaFormatado = String(dataLocal.getDate()).padStart(2, '0');
            const mesFormatado = String(dataLocal.getMonth() + 1).padStart(2, '0');
            const anoFormatado = dataLocal.getFullYear();
            const horaFormatada = String(dataLocal.getHours()).padStart(2, '0');
            const minutoFormatado = String(dataLocal.getMinutes()).padStart(2, '0');
            const segundoFormatado = String(dataLocal.getSeconds()).padStart(2, '0');
            
            return `${diaFormatado}/${mesFormatado}/${anoFormatado} ${horaFormatada}:${minutoFormatado}:${segundoFormatado}`;
        } catch (error) {
            console.error('Erro ao formatar data:', error, dateStr);
            return dateStr; // Retorna a data original em caso de erro
        }
    }

    // Método para popular selects de alocação e alocar material
    async populateAllocationSelects() {
        try {
            // Buscar colaboradores
            const collaborators = await this.materialAPI.getCollaborators();
            const collaboratorSelect = document.querySelector('#material-allocation-modal select[name="collaborator_id"]');
            
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
             // Atualizar os cards de estatísticas
            this.updateStatisticsCards(materialsResponse);


            const materialSelect = document.querySelector('#material-allocation-modal select[name="material_id"]');
            const quantityInput = document.querySelector('#material-allocation-modal input[name="quantity"]');
            
            if (materialSelect) {
                materialSelect.innerHTML = '<option value="">Selecione um material</option>';
                console.log('Materiais recebidos:', materialsResponse);
                
                // Acessar o array de materiais de forma mais flexível
                const materials = materialsResponse.materials || materialsResponse;

                console.log('Materiais processados:', materials);
                
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
                    option.dataset.maxQuantity = availableStock;
                    
                    // Desabilitar materiais sem estoque
                    if (availableStock <= 0) {
                        option.disabled = true;
                        option.textContent += ' (Sem estoque)';
                    }
                    
                    materialSelect.appendChild(option);
                });

                // Adicionar evento para validar quantidade quando selecionar material
                materialSelect.addEventListener('change', () => {
                    if (quantityInput) {
                        const selectedOption = materialSelect.options[materialSelect.selectedIndex];
                        const maxQuantity = selectedOption.dataset.maxQuantity;
                        
                        if (maxQuantity && parseInt(maxQuantity) > 0) {
                            quantityInput.max = maxQuantity;
                            quantityInput.value = '';
                            quantityInput.placeholder = `Máximo: ${maxQuantity}`;

                            // Adicionar validação de quantidade
                            quantityInput.addEventListener('input', (event) => {
                                const value = parseInt(event.target.value);
                                const max = parseInt(maxQuantity);
                                
                                if (value > max) {
                                    event.target.value = max;
                                    showToast('Atenção', `A quantidade máxima disponível é ${max}`, 'warning');
                                } else if (value < 1) {
                                    event.target.value = 1;
                                    showToast('Atenção', 'A quantidade mínima é 1', 'warning');
                                }
                            });
                        }
                    }
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

        // Verificar se this.materialAPI está definido
        if (!this.materialAPI) {
            console.error('MaterialAPI não está disponível');
            showToast('Erro', 'Erro interno do sistema. Por favor, tente novamente.', 'error');
            return;
        }

        this.materialAPI.allocateMaterial(allocationData)
            .then(response => {
                showToast('Sucesso', 'Material alocado com sucesso!', 'success');

                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('material-allocation-modal'));
                if (modal) modal.hide();

                // Limpar formulário
                form.reset();

                // Atualizar tabelas
                this.updateTables();
            })
            .catch(error => {
                console.error('Erro ao alocar material:', error);
                showToast('Erro', 'Erro ao alocar material. Por favor, tente novamente.', 'error');
            });
    }

    // Método para popular selects de devolução de materiais
    async populateReturnMaterialSelects() {
        try {
            // Buscar colaboradores com materiais alocados
            const collaborators = await this.materialAPI.getCollaboratorsWithAllocatedMaterials();
            console.log('Colaboradores recebidos:', collaborators);
            
            const collaboratorSelect = document.querySelector('#material-return-modal select[name="collaborator_id"]');
            
            if (collaboratorSelect) {
                collaboratorSelect.innerHTML = '<option value="">Selecione um colaborador</option>';
                console.log('Colaboradores processados:', collaborators);
                if (collaborators && collaborators.length > 0) {
                    collaborators.forEach(collaborator => {
                        const option = document.createElement('option');
                        option.value = collaborator.id_colab;
                        option.textContent = `${collaborator.name} ${collaborator.family_name}`;
                        collaboratorSelect.appendChild(option);
                    });
                } else {
                    collaboratorSelect.innerHTML = '<option value="">Nenhum colaborador com materiais alocados</option>';
                }

                // Adicionar evento de mudança para carregar materiais do colaborador
                collaboratorSelect.removeEventListener('change', this.loadAllocatedMaterials);
                collaboratorSelect.addEventListener('change', this.loadAllocatedMaterials);
            }

            // Adicionar evento de submissão do formulário de devolução
            const returnForm = document.getElementById('material-return-form');
            if (returnForm) {
                returnForm.removeEventListener('submit', this.handleMaterialReturn);
                returnForm.addEventListener('submit', this.handleMaterialReturn);
            }
        } catch (error) {
            console.error('Erro ao popular selects de devolução:', error);
            showToast('Erro', 'Não foi possível carregar colaboradores', 'error');
            
            // Limpar e desabilitar o select em caso de erro
            if (collaboratorSelect) {
                collaboratorSelect.innerHTML = '<option value="">Erro ao carregar colaboradores</option>';
                collaboratorSelect.disabled = true;
            }
        }
    }

    // Método para carregar materiais alocados de um colaborador específico
    async loadAllocatedMaterials(event) {
        const collaboratorId = event.target.value;
        const materialSelect = document.querySelector('#material-return-modal select[name="material_id"]');
        
        if (collaboratorId) {
            materialSelect.disabled = true;
            materialSelect.innerHTML = '<option value="">Carregando materiais...</option>';
            
            try {
                const materials = await this.materialAPI.getAllocatedMaterialsByCollaborator(collaboratorId);
                
                if (materials && materials.length > 0) {
                    materialSelect.innerHTML = '<option value="">Selecione um material</option>';
                    materials.forEach(material => {
                        const option = document.createElement('option');
                        option.value = JSON.stringify({
                            material_id: material.id,
                            allocation_id: material.allocation_id
                        });
                        option.textContent = `${material.name} (${material.sku}) - Disponível: ${material.available_quantity} ${material.unit}`;
                        option.dataset.maxQuantity = material.available_quantity;
                        materialSelect.appendChild(option);
                    });

                    // Reabilitar input de quantidade quando um material for selecionado
                    const quantityInput = document.querySelector('#material-return-modal input[name="quantity"]');
                    materialSelect.addEventListener('change', (e) => {
                        if (quantityInput) {
                            const selectedOption = e.target.options[e.target.selectedIndex];
                            const maxQuantity = selectedOption.dataset.maxQuantity;
                            
                            if (maxQuantity) {
                                quantityInput.disabled = false;
                                quantityInput.max = maxQuantity;
                                quantityInput.min = 1;
                                quantityInput.value = '';
                                quantityInput.placeholder = `Máximo: ${maxQuantity}`;
                            } else {
                                quantityInput.disabled = true;
                                quantityInput.value = '';
                                quantityInput.placeholder = '';
                            }
                        }
                    });
                } else {
                    materialSelect.innerHTML = '<option value="">Nenhum material disponível para devolução</option>';
                }
            } catch (error) {
                console.error('Erro ao carregar materiais:', error);
                materialSelect.innerHTML = '<option value="">Erro ao carregar materiais</option>';
                showToast('Erro', 'Não foi possível carregar os materiais', 'error');
            } finally {
                materialSelect.disabled = false;
            }
        }
    }

    // Método para lidar com a devolução de material
    async handleMaterialReturn(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        try {
            const materialData = JSON.parse(formData.get('material_id') || '{}');
            
            const returnData = {
                collaborator_id: formData.get('collaborator_id'),
                material_id: materialData.material_id,
                allocation_id: materialData.allocation_id,
                quantity: parseInt(formData.get('quantity')),
                material_condition: formData.get('material_condition'),
                observations: formData.get('observations')
            };

            // Validar dados
            if (!returnData.collaborator_id || !returnData.material_id || !returnData.allocation_id || !returnData.quantity) {
                showToast('Erro', 'Por favor, preencha todos os campos obrigatórios', 'error');
                return;
            }

            // Enviar requisição para a API
            const response = await this.materialAPI.returnMaterial(returnData);

            if (response.success) {
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('material-return-modal'));
                modal.hide();

                // Limpar formulário
                form.reset();

                // Atualizar tabelas
                await this.updateTables();

                showToast('Sucesso', 'Material devolvido com sucesso!', 'success');
            } else {
                throw new Error(response.message || 'Erro ao devolver material');
            }
        } catch (error) {
            console.error('Erro ao devolver material:', error);
            showToast('Erro', error.message || 'Não foi possível devolver o material', 'error');
        }
    }

    // Método para atualizar os cards de estatísticas
    updateStatisticsCards(materials) {
        try {
            // Total de Materiais
            const totalMaterials = materials.length;
            document.getElementById('total-materials').textContent = totalMaterials;

            // Materiais em Uso (com alocações ativas)
            const materialsInUse = materials.filter(material => 
                material.stock_details && 
                material.stock_details.total_allocated > 0 && 
                material.stock_details.total_allocated > material.stock_details.total_returned
            ).length;
            document.getElementById('materials-in-use').textContent = materialsInUse;

            // Materiais com Baixo Estoque
            const lowStockMaterials = materials.filter(material => 
                material.stock_details && 
                material.stock_details.stock_warning && 
                material.status !== 'inactive'
            ).length;
            document.getElementById('low-stock-materials').textContent = lowStockMaterials;
        } catch (error) {
            console.error('Erro ao atualizar cards de estatísticas:', error);
        }
    }

    // Método para atualizar tabelas de forma segura
    updateTables() {
        // Atualizar tabela de movimentações recentes
        if (tables['recent_movements']) {
            tables['recent_movements'].ajax.reload();
        }

        // Atualizar tabela de materiais
        if (tables['materials']) {
            tables['materials'].ajax.reload();
        }

        // Atualizar tabela de alocações
        if (tables['allocations']) {
            tables['allocations'].ajax.reload();
        }
    }

    // Método para carregar materiais
    async loadMaterials() {
        try {
            // Buscar materiais com estoque calculado
            const response = await this.materialAPI.getAllMaterials();
            
            // Garantir que temos um array de materiais
            const materials = Array.isArray(response) ? response : 
                            response?.materials ? response.materials : 
                            response ? [response] : [];
            
            console.log('Materiais carregados:', materials);
            
            this.materials = materials; // Armazenando os materiais
            
            console.log('Materiais armazenados2:', this.materials);
           
            
            // Verificar se a tabela de materiais foi inicializada
            if (this.materialsTable) {
                // Limpar tabela
                this.materialsTable.clear();
                
                // Adicionar dados atualizados
                this.materialsTable.rows.add(materials.map(material => {
                    return [
                        material.name,
                        material.sku,
                        material.description,
                        material.total_input,
                        material.total_output,
                        material.total_allocated,
                        material.total_returned,
                        material.available_stock,
                        material.unit
                    ];
                })).draw();
            }
        } catch (error) {
            console.error('Erro ao carregar materiais:', error);
        }
    }

    // Inicialização
    init() {
        // Bind methods
        const methodsToBind = [
            'initializeDOM',
            'setupFiltersAndGrouping',
            'handleCustomDateRange',
            'applyFilters',
            'applyGrouping',
            'populateFilterSelects',
            'clearFilters',
            'clearGrouping',
            'handleMaterialAllocation',
            'handleMaterialReturn',
            'updateTables',
            'loadAllocatedMaterials',  
            'populateReturnMaterialSelects'  
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
