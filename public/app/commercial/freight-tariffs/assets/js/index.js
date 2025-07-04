document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/freight-tariffs';
    const socket = io();
    let allTariffs = [];
    let formData = {};

    // --- Funções de Inicialização ---
    async function initializePage() {
        setupSocketListeners();
        await loadFormData();
        initializeSearchableSelects();
        await loadTariffs();
    }
    
    window.refreshTariffs = loadTariffs;

    async function loadFormData() {
        try {
            const data = await makeRequest(`${API_URL}/meta/form-data`);
            formData = data;
            populateFilterSelects();
        } catch (error) {
            console.error('Erro ao carregar dados do formulário:', error);
            alert('Falha ao carregar dados de suporte. A página pode não funcionar corretamente.');
        }
    }

    async function loadTariffs() {
        try {
            const query = new URLSearchParams(new FormData(document.getElementById('filter-form'))).toString();
            const tariffs = await makeRequest(`${API_URL}/tariffs?${query}`);
            allTariffs = tariffs;
            renderTariffsTable(allTariffs);
        } catch (error) {
            console.error('Erro ao carregar tarifas:', error);
        }
    }

    // --- Funções de Renderização ---
    function populateFilterSelects() {
        const createOption = (item) => `<option value="${item.id}">${item.name}</option>`;
        const initialOption = '<option value="">Todos</option>';
        
        $('#filter-origin').html(initialOption + formData.locations.filter(l => l.type !== 'Destino').map(createOption).join(''));
        $('#filter-destination').html(initialOption + formData.locations.filter(l => l.type !== 'Origem').map(createOption).join(''));
        $('#filter-modality').html(initialOption + formData.modalities.map(createOption).join(''));
        $('#filter-agent').html(initialOption + formData.agents.map(createOption).join(''));
        $('#filter-shipowner').html(initialOption + formData.agents.map(createOption).join(''));
    }

    function initializeSearchableSelects() {
        const select2Options = {
            theme: 'bootstrap-5',
            width: $(this).data('width') ? $(this).data('width') : $(this).hasClass('w-100') ? '100%' : 'style'
        };
        const $filters = $('#filter-origin, #filter-destination, #filter-modality, #filter-agent, #filter-shipowner, #filter-status');
        
        $filters.select2(select2Options);

        // Adiciona o foco automático ao campo de busca ao abrir o select
        $filters.on('select2:open', () => {
            setTimeout(() => {
                document.querySelector('.select2-container--open .select2-search__field').focus();
            }, 10);
        });
    }

    function renderTariffsTable(tariffs) {
        const tbody = $('#tariffs-table-body');
        tbody.empty();
        if (tariffs.length === 0) {
            tbody.html('<tr><td colspan="12" class="text-center">Nenhuma tarifa encontrada.</td></tr>');
            return;
        }
        tariffs.forEach(t => {
            const rowHtml = createTariffRowHtml(t);
            tbody.append(rowHtml);
        });
    }

    function createTariffRowHtml(t) {
            const statusClass = t.status === 'Ativa' ? 'status-Ativa' : (t.status === 'Expira Breve' ? 'status-Expira' : 'status-Expirada');
        const detailsButton = (t.surcharges && t.surcharges.length > 0) || t.notes
            ? `<button class="btn btn-sm btn-outline-info btn-details" data-id="${t.id}" title="Ver Detalhes"><i class="ri-arrow-down-s-line"></i></button>`
            : `<span style="display: inline-block; width: 32px;"></span>`;
        
        const surchargeIndicator = (t.surcharges && t.surcharges.length > 0)
            ? `<i class="ri-add-circle-line ms-1 text-info" title="Contém sobretaxas" style="cursor: help;"></i>`
            : '';

        // Formatação do valor do frete com a moeda apropriada
        const freightCost = t.freight_cost ? parseFloat(t.freight_cost).toFixed(2) : '0.00';
        const freightCurrency = t.freight_currency || '';
        const freightDisplay = `${freightCost} <span class="badge bg-light text-dark">${freightCurrency}</span>`;

        return `
            <tr data-tariff-id="${t.id}">
                <td>${detailsButton}</td>
                    <td><span class="status-badge ${statusClass}"></span> ${t.status}</td>
                    <td>${t.origin_name}</td>
                    <td>${t.destination_name}</td>
                    <td>${t.modality_name} ${t.container_type_name ? `(${t.container_type_name})` : ''}</td>
                    <td>${new Date(t.validity_start_date).toLocaleDateString()} - ${new Date(t.validity_end_date).toLocaleDateString()}</td>
                    <td>${t.agent_name || '-'}</td>
                    <td>${t.shipowner_name || '-'}</td>
                <td>${freightDisplay} ${surchargeIndicator}</td>
                    <td>${t.transit_time || 'N/A'}</td>
                <td>${t.route_type || 'N/A'}</td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-boundary="viewport">
                            <i class="ri-more-2-fill"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item btn-clone" data-id="${t.id}" href="#"><i class="ri-file-copy-line me-2"></i>Clonar</a></li>
                            <li><a class="dropdown-item btn-edit" data-id="${t.id}" href="#"><i class="ri-pencil-line me-2"></i>Editar</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger btn-delete" data-id="${t.id}" href="#"><i class="ri-delete-bin-line me-2"></i>Excluir</a></li>
                        </ul>
                    </div>
                    </td>
                </tr>
            `;
    }

    // --- Lógica de Socket.IO ---
    function setupSocketListeners() {
        socket.on('tariff_created', (newTariff) => {
            console.log('Nova tarifa recebida:', newTariff);
            addTariffRow(newTariff);
        });

        socket.on('tariff_updated', (updatedTariff) => {
            console.log('Tarifa atualizada recebida:', updatedTariff);
            updateTariffRow(updatedTariff);
        });

        socket.on('tariff_deleted', (data) => {
            console.log('Tarifa excluída recebida:', data);
            deleteTariffRow(data.id);
        });
    }

    function addTariffRow(tariff) {
        // Remove a mensagem "Nenhuma tarifa encontrada" se ela existir
        $('#tariffs-table-body .text-center').parent().remove();
        
        const rowHtml = createTariffRowHtml(tariff);
        $('#tariffs-table-body').prepend(rowHtml);
        allTariffs.unshift(tariff); // Adiciona ao array local
    }

    function updateTariffRow(tariff) {
        const rowHtml = createTariffRowHtml(tariff);
        $(`tr[data-tariff-id="${tariff.id}"]`).replaceWith(rowHtml);
        
        // Atualiza também a linha de detalhes se ela estiver aberta
        const detailsRow = $(`#details-${tariff.id}`);
        if (detailsRow.length) {
            detailsRow.remove();
        }

        // Atualiza o array local
        const index = allTariffs.findIndex(t => t.id === tariff.id);
        if (index !== -1) {
            allTariffs[index] = tariff;
    }
    }

    function deleteTariffRow(tariffId) {
        $(`tr[data-tariff-id="${tariffId}"]`).remove();
        $(`#details-${tariffId}`).remove(); // Remove detalhes se estiverem abertos
        allTariffs = allTariffs.filter(t => t.id !== tariffId);

        if (allTariffs.length === 0) {
            $('#tariffs-table-body').html('<tr><td colspan="12" class="text-center">Nenhuma tarifa encontrada.</td></tr>');
        }
    }

    // --- Manipuladores de Eventos ---
    $('#btn-add-tariff').on('click', () => {
        window.open('edit-tariff.html', 'edit-tariff', 'width=1000,height=800,scrollbars=yes');
    });

    $('#filter-form').on('submit', (e) => { e.preventDefault(); loadTariffs(); });
    $('#btn-clear-filters').on('click', () => { $('#filter-form')[0].reset(); loadTariffs(); });

    $('#tariffs-table-body').on('click', '.btn-details', function() {
        const button = $(this);
        const icon = button.find('i');
        const tariffId = button.data('id');
        const tariffRow = $(`tr[data-tariff-id="${tariffId}"]`);
        const detailsRowId = `details-${tariffId}`;
        const existingDetailsRow = $(`#${detailsRowId}`);

        if (existingDetailsRow.length) {
            // Se a linha de detalhes já existe, remova-a e mude o ícone
            existingDetailsRow.remove();
            icon.removeClass('ri-arrow-up-s-line').addClass('ri-arrow-down-s-line');
        } else {
            // Se não existe, crie-a
            const tariff = allTariffs.find(t => t.id === tariffId);
            if (tariff) {
                let detailsHtml = `<td colspan="12" class="p-3" style="background-color: #f8f9fa;">`;

                if (tariff.notes) {
                    detailsHtml += `
                        <h6 class="mb-2">Notas Adicionais</h6>
                        <p class="text-muted" style="white-space: pre-wrap;">${tariff.notes}</p>
                    `;
                }

                if (tariff.surcharges && tariff.surcharges.length > 0) {
                    if (tariff.notes) {
                        detailsHtml += '<hr class="my-2">';
                    }
                    detailsHtml += `
                        <h6 class="mb-2">Sobretaxas</h6>
                        <table class="table table-sm table-bordered mb-0">
                            <thead class="thead-light">
                                <tr>
                                    <th>Nome</th>
                                    <th>Valor</th>
                                    <th>Moeda</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    tariff.surcharges.forEach(s => {
                        detailsHtml += `
                            <tr>
                                <td>${s.name}</td>
                                <td>${parseFloat(s.cost).toFixed(2)}</td>
                                <td><span class="badge bg-light text-dark">${s.currency}</span></td>
                            </tr>
                        `;
                    });
                    detailsHtml += `
                                </tbody>
                            </table>
                    `;
                }
                
                detailsHtml += `</td>`;
                const newDetailsRow = `<tr id="${detailsRowId}">${detailsHtml}</tr>`;
                tariffRow.after(newDetailsRow);
                icon.removeClass('ri-arrow-down-s-line').addClass('ri-arrow-up-s-line');
            }
        }
    });

    $('#tariffs-table-body').on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        window.open(`edit-tariff.html?id=${id}`, 'edit-tariff', 'width=1000,height=800,scrollbars=yes');
    });
    
    $('#tariffs-table-body').on('click', '.btn-clone', function() {
        const id = $(this).data('id');
        window.open(`edit-tariff.html?cloneId=${id}`, 'edit-tariff', 'width=1000,height=800,scrollbars=yes');
    });

    $('#tariffs-table-body').on('click', '.btn-delete', async function() {
        const id = $(this).data('id');
        if (confirm('Tem certeza que deseja excluir esta tarifa?')) {
            try {
                await makeRequest(`${API_URL}/tariffs/${id}`, 'DELETE');
                await loadTariffs();
            } catch (error) {
                console.error('Erro ao excluir tarifa:', error);
                alert('Falha ao excluir a tarifa.');
            }
        }
    });
    
    $('#btn-manage-configs').on('click', () => {
       window.open('settings.html', 'settings', 'width=900,height=700,scrollbars=yes');
    });

    $('#btn-analytics').on('click', () => {
       window.open('analytics.html', 'analytics', 'width=1200,height=800,scrollbars=yes');
    });

    $('#btn-commercial-query').on('click', () => {
       window.open('commercial.html', 'commercial', 'width=1400,height=900,scrollbars=yes,resizable=yes');
    });

    // --- Importação Excel ---
    let importData = [];
    let validationResults = [];

    // Botões de download e importação
    $('#btn-download-template, #download-template-link').on('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/excel/template`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao baixar template');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'template-tarifas-frete.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao baixar template:', error);
            alert('Erro ao baixar o template. Tente novamente.');
        }
    });

    $('#btn-import-excel').on('click', () => {
        resetImportModal();
        $('#import-modal').modal('show');
    });

    $('#btn-select-file').on('click', () => {
        $('#excel-file-input').click();
    });

    $('#excel-file-input').on('change', handleFileSelect);

    function resetImportModal() {
        $('.import-step').addClass('d-none');
        $('#upload-step').removeClass('d-none');
        $('#btn-confirm-import').addClass('d-none');
        importData = [];
        validationResults = [];
    }

    async function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Mostrar etapa de processamento
        $('.import-step').addClass('d-none');
        $('#processing-step').removeClass('d-none');

        try {
            const formData = new FormData();
            formData.append('excel', file);

            const response = await fetch(`${API_URL}/excel/import`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erro ao processar arquivo');
            }

            const result = await response.json();
            importData = result.data;
            validationResults = result.validation;

            showReviewStep();
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            alert('Erro ao processar o arquivo. Verifique se está no formato correto.');
            resetImportModal();
        }

        // Limpar input
        event.target.value = '';
    }

    function showReviewStep() {
        $('.import-step').addClass('d-none');
        $('#review-step').removeClass('d-none');

        updateValidationSummary();
        renderImportReview();
        $('#btn-confirm-import').removeClass('d-none');
    }

    function updateValidationSummary() {
        const validCount = validationResults.filter(v => v.status === 'valid').length;
        const warningCount = validationResults.filter(v => v.status === 'warning').length;
        const errorCount = validationResults.filter(v => v.status === 'error').length;
        const totalCount = validationResults.length;

        $('#total-count').text(totalCount);
        $('#valid-count').text(validCount);
        $('#warning-count').text(warningCount);
        $('#error-count').text(errorCount);

        // Desabilitar botão de confirmação se houver erros
        if (errorCount > 0) {
            $('#btn-confirm-import').prop('disabled', true).text('Corrija os erros para continuar');
        } else {
            $('#btn-confirm-import').prop('disabled', false).text('Confirmar Importação');
        }
    }

    function renderImportReview(filter = 'all') {
        const tbody = $('#import-review-tbody');
        tbody.empty();

        validationResults.forEach((validation, index) => {
            if (filter !== 'all' && validation.status !== filter) return;

            const data = importData[index];
            const statusIcon = getStatusIcon(validation.status);
            const statusClass = getStatusClass(validation.status);

            // Calcular status da validade
            const validityStatus = getValidityStatus(data.validity_start_date, data.validity_end_date);
            const validityBadge = getValidityBadge(validityStatus);

            // Formatar período de validade
            const validityPeriod = formatValidityPeriod(data.validity_start_date, data.validity_end_date);

            // Adicionar classe baseada no status de validade
            let additionalClass = '';
            if (validityStatus === 'expired') {
                additionalClass += ' table-danger-light';
            } else if (validityStatus === 'expires_soon') {
                additionalClass += ' table-warning-light';
            }

            const row = `
                <tr class="${statusClass}${additionalClass}">
                    <td>${index + 1}</td>
                    <td>
                        ${(data.notes || (data.surcharges && data.surcharges.length > 0)) ?
                            `<button class="btn btn-sm btn-outline-info btn-details-import" data-index="${index}" title="Ver Detalhes">
                                <i class="ri-arrow-down-s-line"></i>
                            </button>` :
                            `<span style="display: inline-block; width: 32px;"></span>`}
                    </td>
                    <td>${statusIcon}</td>
                    <td>${data.origin || '<span class="text-muted">-</span>'}</td>
                    <td>${data.destination || '<span class="text-muted">-</span>'}</td>
                    <td>${data.modality || '<span class="text-muted">-</span>'}</td>
                    <td>${data.agent || '<span class="text-muted">-</span>'}</td>
                    <td>${data.shipowner || '<span class="text-muted">-</span>'}</td>
                    <td><small>${validityPeriod}</small></td>
                    <td>${validityBadge}</td>
                    <td>
                        ${data.freight_cost ? 
                            `<strong>${parseFloat(data.freight_cost).toFixed(2)}</strong> <small class="text-muted">${data.freight_currency || ''}</small>` : 
                            '<span class="text-muted">-</span>'}
                        ${data.surcharges && data.surcharges.length > 0 ?
                            `<i class="ri-add-circle-line ms-1 text-info" title="Contém sobretaxas" style="cursor: help;"></i>` :
                            ''}
                    </td>
                    <td><small>${data.transit_time || '<span class="text-muted">-</span>'}</small></td>
                    <td><small>${data.route_type || '<span class="text-muted">-</span>'}</small></td>
                    <td>
                        ${validation.issues.length > 0 ? 
                            `<small class="text-muted">${validation.issues.join(', ')}</small>` : 
                            '<span class="text-success">OK</span>'}
                    </td>
                    <td>
                        ${validation.status === 'error' || validation.status === 'warning' ? 
                            `<button class="btn btn-sm btn-outline-primary btn-quick-edit" data-index="${index}" title="Editar linha">
                                <i class="ri-edit-line"></i>
                            </button>` : 
                            '<span class="text-success"><i class="ri-check-line"></i></span>'}
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    // Função para determinar o status da validade
    function getValidityStatus(startDate, endDate) {
        if (!startDate || !endDate) return 'invalid';
        
        const today = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Normalizar as datas para comparação (apenas data, sem hora)
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        if (end < today) {
            return 'expired'; // Expirada
        } else if (start > today) {
            return 'future'; // Futura
        } else {
            // Ativa - verificar se expira em breve (próximos 15 dias)
            const fifteenDaysFromNow = new Date(today);
            fifteenDaysFromNow.setDate(today.getDate() + 15);
            
            if (end <= fifteenDaysFromNow) {
                return 'expires_soon'; // Expira em breve
            } else {
                return 'active'; // Ativa
            }
        }
    }

    // Função para gerar badge do status de validade
    function getValidityBadge(status) {
        switch (status) {
            case 'active':
                return '<span class="badge bg-success">Ativa</span>';
            case 'expires_soon':
                return '<span class="badge bg-warning">Expira Breve</span>';
            case 'expired':
                return '<span class="badge bg-danger">Expirada</span>';
            case 'future':
                return '<span class="badge bg-info">Futura</span>';
            default:
                return '<span class="badge bg-secondary">Inválida</span>';
        }
    }

    // Função para formatar período de validade
    function formatValidityPeriod(startDate, endDate) {
        if (!startDate || !endDate) return '-';
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const formatDate = (date) => {
            return date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            });
        };
        
        return `${formatDate(start)} até ${formatDate(end)}`;
    }

    function getStatusIcon(status) {
        switch (status) {
            case 'valid': return '<i class="ri-check-line text-success"></i>';
            case 'warning': return '<i class="ri-alert-line text-warning"></i>';
            case 'error': return '<i class="ri-error-warning-line text-danger"></i>';
            default: return '';
        }
    }

    function getStatusClass(status) {
        switch (status) {
            case 'valid': return 'table-success';
            case 'warning': return 'table-warning';
            case 'error': return 'table-danger';
            default: return '';
        }
    }

    // Filtros de visualização
    let activeFilter = 'all';
    
    $('#btn-show-all').on('click', () => {
        activeFilter = 'all';
        renderImportReview();
        updateFilterButtons('all');
    });
    
    $('#btn-show-valid').on('click', () => {
        activeFilter = 'valid';
        renderImportReview('valid');
        updateFilterButtons('valid');
    });
    
    $('#btn-show-warnings').on('click', () => {
        activeFilter = 'warning';
        renderImportReview('warning');
        updateFilterButtons('warning');
    });
    
    $('#btn-show-errors').on('click', () => {
        activeFilter = 'error';
        renderImportReview('error');
        updateFilterButtons('error');
    });

    function updateFilterButtons(active) {
        $('#btn-show-all, #btn-show-valid, #btn-show-warnings, #btn-show-errors').removeClass('active');
        if (active === 'all') $('#btn-show-all').addClass('active');
        else if (active === 'valid') $('#btn-show-valid').addClass('active');
        else if (active === 'warning') $('#btn-show-warnings').addClass('active');
        else if (active === 'error') $('#btn-show-errors').addClass('active');
    }

    // Edição rápida
    $(document).on('click', '.btn-quick-edit', function() {
        const index = $(this).data('index');
        openQuickEditModal(index);
    });

    // Detalhes na tabela de importação
    $(document).on('click', '.btn-details-import', function() {
        const button = $(this);
        const icon = button.find('i');
        const index = button.data('index');
        const tariffRow = $(`#import-review-tbody tr`).eq(index);
        const detailsRowId = `import-details-${index}`;
        const existingDetailsRow = $(`#${detailsRowId}`);

        if (existingDetailsRow.length) {
            // Se a linha de detalhes já existe, remova-a e mude o ícone
            existingDetailsRow.remove();
            icon.removeClass('ri-arrow-up-s-line').addClass('ri-arrow-down-s-line');
        } else {
            // Se não existe, crie-a
            const data = importData[index];
            if (data) {
                let detailsHtml = `<td colspan="15" class="p-3" style="background-color: #f8f9fa;">`;

                if (data.notes) {
                    detailsHtml += `
                        <h6 class="mb-2">Notas Adicionais</h6>
                        <p class="text-muted mb-3" style="white-space: pre-wrap;">${data.notes}</p>
                    `;
                }

                if (data.surcharges && data.surcharges.length > 0) {
                    if (data.notes) {
                        detailsHtml += '<hr class="my-2">';
                    }
                    detailsHtml += `
                        <h6 class="mb-2">Sobretaxas</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Nome</th>
                                        <th style="width: 120px;">Valor</th>
                                        <th style="width: 100px;">Moeda</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;
                    data.surcharges.forEach(s => {
                        detailsHtml += `
                            <tr>
                                <td>${s.name}</td>
                                <td>${parseFloat(s.value).toFixed(2)}</td>
                                <td><span class="badge bg-light text-dark">${s.currency}</span></td>
                            </tr>
                        `;
                    });
                    detailsHtml += `
                                </tbody>
                            </table>
                        </div>
                    `;
                }
                
                detailsHtml += `</td>`;
                const newDetailsRow = `<tr id="${detailsRowId}">${detailsHtml}</tr>`;
                tariffRow.after(newDetailsRow);
                icon.removeClass('ri-arrow-down-s-line').addClass('ri-arrow-up-s-line');
            }
        }
    });

    async function openQuickEditModal(index) {
        const data = importData[index];
        
        // Popula os selects do modal
        await populateQuickEditSelects();
        
        $('#edit-row-index').val(index);
        
        // Preencher com os valores atuais (usar IDs se existirem, senão tentar encontrar pelos nomes)
        if (data.origin_id) {
            $('#edit-origin').val(data.origin_id);
        } else if (data.origin) {
            // Tentar encontrar pelo nome
            const origin = formData.locations.find(l => l.name === data.origin && l.type !== 'Destino');
            if (origin) $('#edit-origin').val(origin.id);
        }
        
        if (data.destination_id) {
            $('#edit-destination').val(data.destination_id);
        } else if (data.destination) {
            const destination = formData.locations.find(l => l.name === data.destination && l.type !== 'Origem');
            if (destination) $('#edit-destination').val(destination.id);
        }
        
        if (data.modality_id) {
            $('#edit-modality').val(data.modality_id);
        } else if (data.modality) {
            const modality = formData.modalities.find(m => m.name === data.modality);
            if (modality) $('#edit-modality').val(modality.id);
        }
        
        if (data.agent_id) {
            $('#edit-agent').val(data.agent_id);
        } else if (data.agent) {
            const agent = formData.agents.find(a => a.name === data.agent);
            if (agent) $('#edit-agent').val(agent.id);
        }
        
        if (data.shipowner_id) {
            $('#edit-shipowner').val(data.shipowner_id);
        } else if (data.shipowner) {
            const shipowner = formData.agents.find(a => a.name === data.shipowner);
            if (shipowner) $('#edit-shipowner').val(shipowner.id);
        }
        
        if (data.container_type_id) {
            $('#edit-container-type').val(data.container_type_id);
        } else if (data.container_type) {
            const containerType = formData.container_types.find(ct => ct.name === data.container_type);
            if (containerType) $('#edit-container-type').val(containerType.id);
        }
        
        $('#edit-currency').val(data.freight_currency || '');
        
        // Preencher campos de data e outros
        $('#edit-start-date').val(data.validity_start_date || '');
        $('#edit-end-date').val(data.validity_end_date || '');
        $('#edit-freight-cost').val(data.freight_cost || '');
        $('#edit-transit-time').val(data.transit_time || '');
        $('#edit-route-type').val(data.route_type || '');
        
        // Carregar sobretaxas
        loadSurchargesInEditModal(data.surcharges || []);
        
        $('#quick-edit-modal').modal('show');
    }

    async function populateQuickEditSelects() {
        if (!formData.locations) {
            await loadFormData();
        }

        populateSelect('#edit-origin', formData.locations.filter(l => l.type !== 'Destino'), 'Selecione...');
        populateSelect('#edit-destination', formData.locations.filter(l => l.type !== 'Origem'), 'Selecione...');
        populateSelect('#edit-modality', formData.modalities, 'Selecione...');
        populateSelect('#edit-agent', formData.agents, 'Selecione...');
        populateSelect('#edit-shipowner', formData.agents, 'Selecione...');
        populateSelect('#edit-container-type', formData.container_types, 'Selecione...');
        populateSelect('#edit-currency', formData.currencies, 'Selecione...');
    }

    function populateSelect(selector, data, placeholder) {
        const select = $(selector);
        select.empty().append(`<option value="">${placeholder}</option>`);
        data.forEach(item => {
            const value = item.id || item.code;
            let text;
            if (item.code && item.name) {
                // Para moedas
                text = `${item.code} - ${item.name}`;
            } else {
                // Para outros itens
                text = item.name;
            }
            select.append(`<option value="${value}">${text}</option>`);
        });
    }

    $('#btn-save-quick-edit').on('click', async function() {
        const index = $('#edit-row-index').val();
        const data = importData[index];

        console.log('Salvando edição rápida para linha:', index);
        console.log('Dados antes da edição:', JSON.parse(JSON.stringify(data)));

        // Atualiza os dados com os valores dos selects
        const originId = $('#edit-origin').val();
        const destinationId = $('#edit-destination').val();
        const modalityId = $('#edit-modality').val();
        const agentId = $('#edit-agent').val();
        const shipownerId = $('#edit-shipowner').val();
        const containerTypeId = $('#edit-container-type').val();
        const currency = $('#edit-currency').val();

        console.log('Novos valores:', { originId, destinationId, modalityId, agentId, shipownerId, containerTypeId, currency });

        // Atualizar IDs
        data.origin_id = originId;
        data.destination_id = destinationId;
        data.modality_id = modalityId;
        data.agent_id = agentId;
        data.shipowner_id = shipownerId;
        data.container_type_id = containerTypeId;
        data.freight_currency = currency;

        // Atualizar campos de data e outros
        data.validity_start_date = $('#edit-start-date').val();
        data.validity_end_date = $('#edit-end-date').val();
        data.freight_cost = parseFloat($('#edit-freight-cost').val()) || 0;
        data.transit_time = $('#edit-transit-time').val();
        data.route_type = $('#edit-route-type').val();

        // Capturar sobretaxas
        const surcharges = [];
        $('#edit-surcharges-tbody tr').each(function() {
            const row = $(this);
            const name = row.find('.surcharge-name').val();
            const value = row.find('.surcharge-value').val();
            const currency = row.find('.surcharge-currency').val();
            
            if (name && value && currency) {
                surcharges.push({
                    name: name,
                    value: parseFloat(value) || 0,
                    currency: currency
                });
            }
        });
        data.surcharges = surcharges;

        // Atualizar também os nomes textuais baseados nos IDs selecionados
        if (originId) {
            const originLocation = formData.locations.find(l => l.id == originId);
            if (originLocation) data.origin = originLocation.name;
        }
        
        if (destinationId) {
            const destinationLocation = formData.locations.find(l => l.id == destinationId);
            if (destinationLocation) data.destination = destinationLocation.name;
        }
        
        if (modalityId) {
            const modality = formData.modalities.find(m => m.id == modalityId);
            if (modality) data.modality = modality.name;
        }
        
        if (agentId) {
            const agent = formData.agents.find(a => a.id == agentId);
            if (agent) data.agent = agent.name;
        }
        
        if (shipownerId) {
            const shipowner = formData.agents.find(a => a.id == shipownerId);
            if (shipowner) data.shipowner = shipowner.name;
        }
        
        if (containerTypeId) {
            const containerType = formData.container_types.find(ct => ct.id == containerTypeId);
            if (containerType) data.container_type = containerType.name;
        }

        console.log('Dados após edição:', JSON.parse(JSON.stringify(data)));

        // Revalidar os dados localmente
        const validation = validateTariffDataLocal(data, formData);
        console.log('Resultado da validação:', validation);
        
        validationResults[index] = validation;
        
        $('#quick-edit-modal').modal('hide');
        updateValidationSummary();
        renderImportReview(activeFilter === 'all' ? undefined : activeFilter);
        
        // Mostrar feedback de sucesso
        if (validation.status === 'valid') {
            showToast('Linha corrigida com sucesso!', 'success');
        } else if (validation.status === 'warning') {
            showToast('Linha editada, mas ainda contém avisos.', 'warning');
        } else {
            showToast('Linha ainda contém erros que precisam ser corrigidos.', 'error');
        }
    });

    // Função para mostrar toasts de feedback
    function showToast(message, type = 'info') {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-warning' : 
                          type === 'error' ? 'alert-danger' : 'alert-info';
        
        const toast = $(`
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        $('body').append(toast);
        
        // Auto remove após 3 segundos
        setTimeout(() => {
            toast.alert('close');
        }, 3000);
    }

    // Função local de validação (replica a lógica do backend)
    function validateTariffDataLocal(data, formData) {
        const issues = [];
        let status = 'valid';

        // Validar campos obrigatórios
        if (!data.origin_id) {
            issues.push('Origem é obrigatória');
            status = 'error';
        }

        if (!data.destination_id) {
            issues.push('Destino é obrigatório');
            status = 'error';
        }

        if (!data.modality_id) {
            issues.push('Modal é obrigatório');
            status = 'error';
        }

        if (!data.agent_id) {
            issues.push('Agente é obrigatório');
            status = 'error';
        }

        // Validar tipo de container (opcional)
        if (data.container_type && !data.container_type_id) {
            issues.push('Tipo de container não encontrado');
            status = status === 'error' ? 'error' : 'warning';
        }

        // Validar datas
        if (!data.validity_start_date) {
            issues.push('Data de início é obrigatória');
            status = 'error';
        }

        if (!data.validity_end_date) {
            issues.push('Data de fim é obrigatória');
            status = 'error';
        }

        if (data.validity_start_date && data.validity_end_date) {
            const startDate = new Date(data.validity_start_date);
            const endDate = new Date(data.validity_end_date);
            
            if (startDate >= endDate) {
                issues.push('Data de fim deve ser posterior à data de início');
                status = 'error';
            }
        }

        // Validar custo
        if (!data.freight_cost || data.freight_cost <= 0) {
            issues.push('Custo do frete deve ser maior que zero');
            status = 'error';
        }

        // Validar moeda
        if (!data.freight_currency) {
            issues.push('Moeda é obrigatória');
            status = 'error';
        } else {
            const currency = formData.currencies.find(c => c.code === data.freight_currency);
            if (!currency) {
                issues.push('Moeda não encontrada');
                status = 'error';
            }
        }

        return {
            status: status,
            issues: issues
        };
    }

    // Confirmação da importação
    $('#btn-confirm-import').on('click', async function() {
        const validItems = importData.filter((_, index) => validationResults[index].status !== 'error');
        
        if (validItems.length === 0) {
            alert('Não há itens válidos para importar.');
            return;
        }

        if (!confirm(`Confirma a importação de ${validItems.length} tarifas?`)) {
            return;
        }

        try {
            $(this).prop('disabled', true).html('<i class="ri-loader-4-line me-1 spin"></i>Importando...');
            
            const response = await makeRequest(`${API_URL}/excel/confirm-import`, 'POST', {
                validItems: validItems
            });

            alert(`Importação concluída! ${response.imported} tarifas foram importadas com sucesso.`);
            $('#import-modal').modal('hide');
            await loadTariffs(); // Recarrega a lista

        } catch (error) {
            console.error('Erro na importação:', error);
            alert('Erro durante a importação. Verifique os dados e tente novamente.');
        } finally {
            $(this).prop('disabled', false).html('<i class="ri-check-line me-1"></i>Confirmar Importação');
        }
    });

    // CSS para spinner e modal
    const style = document.createElement('style');
    style.textContent = `
        .spin {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .table-danger-light {
            background-color: rgba(220, 53, 69, 0.1) !important;
        }
        .table-warning-light {
            background-color: rgba(255, 193, 7, 0.1) !important;
        }
        .table-success-light {
            background-color: rgba(25, 135, 84, 0.1) !important;
        }
        
        /* Estilos para o modal de importação */
        #import-modal .modal-dialog {
            margin: 1rem;
        }
        
        #import-modal .import-step.d-none {
            display: none !important;
        }
        
        #import-modal #review-step:not(.d-none) {
            display: flex !important;
            flex-direction: column;
            height: 100%;
        }
        
        @media (max-width: 991.98px) {
            #import-modal .modal-dialog {
                max-width: 100vw !important;
                margin: 0;
            }
            
            #import-modal .modal-content {
                height: 100vh !important;
            }
            
            #import-modal .table-responsive {
                max-height: calc(100vh - 250px) !important;
            }
        }
        
        /* Scroll suave para a tabela */
        #import-modal .table-responsive {
            scrollbar-width: thin;
            scrollbar-color: #6c757d #f8f9fa;
        }
        
        #import-modal .table-responsive::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        #import-modal .table-responsive::-webkit-scrollbar-track {
            background: #f8f9fa;
        }
        
        #import-modal .table-responsive::-webkit-scrollbar-thumb {
            background: #6c757d;
            border-radius: 4px;
        }
        
        #import-modal .table-responsive::-webkit-scrollbar-thumb:hover {
            background: #495057;
        }
    `;
    document.head.appendChild(style);

    // Função para carregar sobretaxas no modal de edição
    function loadSurchargesInEditModal(surcharges) {
        const tbody = $('#edit-surcharges-tbody');
        tbody.empty();
        
        if (surcharges.length === 0) {
            $('#no-surcharges-msg').show();
        } else {
            $('#no-surcharges-msg').hide();
            surcharges.forEach(surcharge => {
                addSurchargeRowEdit(surcharge);
            });
        }
    }

    // Função para adicionar linha de sobretaxa no modal de edição
    function addSurchargeRowEdit(surcharge = {}) {
        $('#no-surcharges-msg').hide();
        
        const currencyOptions = formData.currencies.map(c => 
            `<option value="${c.code}" ${surcharge.currency === c.code ? 'selected' : ''}>${c.code}</option>`
        ).join('');
        
        const newRowHtml = `
            <tr>
                <td>
                    <input type="text" class="form-control form-control-sm surcharge-name" 
                           value="${surcharge.name || ''}" placeholder="Nome da sobretaxa" required>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm surcharge-value" 
                           value="${surcharge.value || ''}" step="0.01" min="0" placeholder="0.00" required>
                </td>
                <td>
                    <select class="form-select form-select-sm surcharge-currency">
                        ${currencyOptions}
                    </select>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-danger btn-remove-surcharge-edit" title="Remover">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </td>
            </tr>
        `;
        
        $('#edit-surcharges-tbody').append(newRowHtml);
    }

    // Event listeners para sobretaxas no modal de edição
    $('#btn-add-surcharge-edit').on('click', function() {
        addSurchargeRowEdit();
    });

    $(document).on('click', '.btn-remove-surcharge-edit', function() {
        $(this).closest('tr').remove();
        
        // Mostrar mensagem se não há sobretaxas
        if ($('#edit-surcharges-tbody tr').length === 0) {
            $('#no-surcharges-msg').show();
        }
    });

    // --- Iniciar ---
    initializePage();
}); 