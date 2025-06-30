document.addEventListener('DOMContentLoaded', function() {
    const API_URL = '/api/freight-tariffs';
    let allData = { agents: [], locations: [], modalities: [], container_types: [] };
    let settingsModal;

    const entityConfig = {
        agent: {
            plural: 'agents',
            title: 'Agente',
            fields: [
                { name: 'name', label: 'Nome', type: 'text', required: true },
                { name: 'contact_person', label: 'Pessoa de Contato', type: 'text' },
                { name: 'contact_email', label: 'Email', type: 'email' },
                { name: 'contact_phone', label: 'Telefone', type: 'text' },
            ]
        },
        location: {
            plural: 'locations',
            title: 'Localização',
            fields: [
                { name: 'name', label: 'Nome', type: 'text', required: true },
                { name: 'type', label: 'Tipo', type: 'select', required: true, options: ['Origem', 'Destino', 'Ambos'] },
            ]
        },
        modality: {
            plural: 'modalities',
            title: 'Modalidade',
            fields: [
                { name: 'name', label: 'Nome', type: 'text', required: true },
                { name: 'description', label: 'Descrição', type: 'textarea' },
            ]
        },
        container_type: {
            plural: 'container_types',
            title: 'Tipo de Container',
            fields: [
                { name: 'name', label: 'Nome', type: 'text', required: true },
                { name: 'applicable_modalities', label: 'Modalidades Aplicáveis', type: 'select_multiple' },
            ]
        }
    };

    // --- Funções de Inicialização ---
    function initializePage() {
        settingsModal = new bootstrap.Modal(document.getElementById('settings-modal'));
        loadAllData();
        setupEventListeners();
    }

    // --- Funções de Carregamento e Renderização ---
    async function loadAllData() {
        try {
            const [agents, locations, modalities, container_types] = await Promise.all([
                makeRequest(`${API_URL}/agents`),
                makeRequest(`${API_URL}/locations`),
                makeRequest(`${API_URL}/modalities`),
                makeRequest(`${API_URL}/container-types`)
            ]);
            allData = { agents, locations, modalities, container_types };
            renderAllTables();
        } catch (error) {
            console.error('Erro ao carregar todos os dados de configuração:', error);
            alert('Falha ao carregar dados de configuração.');
        }
    }
    
    window.refreshSettings = loadAllData;

    function renderAllTables() {
        renderTable('agent', allData.agents);
        renderTable('location', allData.locations);
        renderTable('modality', allData.modalities);
        renderTable('container_type', allData.container_types);
    }

    function renderTable(type, data) {
        const config = entityConfig[type];
        const tbody = $(`#${config.plural}-table-body`);
        tbody.empty();
        if (data.length === 0) {
            const colspan = (config.fields?.length || 0) + 1;
            tbody.html(`<tr><td colspan="${colspan}" class="text-center">Nenhum item encontrado.</td></tr>`);
            return;
        }

        data.forEach(item => {
            let rowHtml = '<tr>';
            if (type === 'agent') {
                rowHtml += `<td>${item.name || ''}</td><td>${item.contact_person || ''}</td><td>${item.contact_email || ''}</td><td>${item.contact_phone || ''}</td>`;
            } else if (type === 'location') {
                rowHtml += `<td>${item.name || ''}</td><td>${item.type || ''}</td>`;
            } else if (type === 'modality') {
                rowHtml += `<td>${item.name || ''}</td><td>${item.description || ''}</td>`;
            } else if (type === 'container_type') {
                 rowHtml += `<td>${item.name || ''}</td><td>${item.modality_names || 'Todas'}</td>`;
            }
            rowHtml += `
                <td class="text-center">
                    <button class="btn btn-sm btn-light btn-edit" data-type="${type}" data-id="${item.id}" title="Editar"><i class="ri-pencil-line"></i></button>
                    <button class="btn btn-sm btn-light btn-delete" data-type="${type}" data-id="${item.id}" title="Excluir"><i class="ri-delete-bin-line text-danger"></i></button>
                </td>
            </tr>`;
            tbody.append(rowHtml);
        });
    }

    // --- Funções do Modal ---
    function openModal(type, id = null) {
        const config = entityConfig[type];
        const form = $('#modal-form');
        form[0].reset();
        $('#edit-type').val(type);

        let item = {};
        if (id) {
            item = allData[config.plural].find(i => i.id === id) || {};
            $('#modal-title').text(`Editar ${config.title}`);
            $('#edit-id').val(id);
        } else {
            $('#modal-title').text(`Adicionar ${config.title}`);
            $('#edit-id').val('');
        }
        
        generateFormFields(type, item);
        settingsModal.show();
    }

    function generateFormFields(type, item) {
        const config = entityConfig[type];
        const container = $('#modal-form-content');
        container.empty();
    
        config.fields.forEach(field => {
            const value = item[field.name] || '';
            const required = field.required ? 'required' : '';
            let formGroup;
    
            if (field.type === 'textarea') {
                formGroup = `
                    <div class="mb-3">
                        <label for="field-${field.name}" class="form-label">${field.label}</label>
                        <textarea class="form-control" id="field-${field.name}" name="${field.name}" ${required}>${value}</textarea>
                    </div>`;
            } else if (field.type === 'select') {
                const optionsHtml = field.options.map(opt => `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`).join('');
                formGroup = `
                    <div class="mb-3">
                        <label for="field-${field.name}" class="form-label">${field.label}</label>
                        <select class="form-select" id="field-${field.name}" name="${field.name}" ${required}>${optionsHtml}</select>
                    </div>`;
            } else if (field.type === 'select_multiple') {
                const selectedModalities = (value || '').split(',').map(Number);
                const optionsHtml = allData.modalities.map(mod => 
                    `<div class="form-check">
                        <input class="form-check-input" type="checkbox" name="applicable_modalities" value="${mod.id}" id="mod-${mod.id}" ${selectedModalities.includes(mod.id) ? 'checked' : ''}>
                        <label class="form-check-label" for="mod-${mod.id}">${mod.name}</label>
                    </div>`
                ).join('');
                formGroup = `
                    <div class="mb-3">
                        <label class="form-label">${field.label}</label>
                        ${optionsHtml || '<p class="text-muted fs-13">Nenhuma modalidade cadastrada.</p>'}
                    </div>`;
            } else { // text, email, etc.
                formGroup = `
                    <div class="mb-3">
                        <label for="field-${field.name}" class="form-label">${field.label}</label>
                        <input type="${field.type}" class="form-control" id="field-${field.name}" name="${field.name}" value="${value}" ${required}>
                    </div>`;
            }
            container.append(formGroup);
        });
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const id = $(form).find('#edit-id').val();
        const type = $(form).find('#edit-type').val();
        const config = entityConfig[type];
        
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (key === 'applicable_modalities') {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });

        const method = id ? 'PUT' : 'POST';
        const url = `${API_URL}/${config.plural}` + (id ? `/${id}` : '');

        try {
            await makeRequest(url, method, data);
            settingsModal.hide();
            await loadAllData();
        } catch (error) {
            console.error(`Erro ao salvar ${config.title}:`, error);
            alert(error.message || `Falha ao salvar ${config.title}.`);
        }
    }

    // --- Manipuladores de Eventos ---
    function setupEventListeners() {
        // Abrir modal para adicionar
        $('.btn-add').on('click', function() {
            const type = $(this).data('type');
            openModal(type);
        });

        // Abrir modal para editar
        $('#settings-tabs-content').on('click', '.btn-edit', function() {
            const type = $(this).data('type');
            const id = $(this).data('id');
            openModal(type, id);
        });
        
        // Excluir
        $('#settings-tabs-content').on('click', '.btn-delete', async function() {
            const id = $(this).data('id');
            const type = $(this).data('type');
            const config = entityConfig[type];
            
            if (confirm(`Tem certeza que deseja excluir este(a) ${config.title}? Esta ação não pode ser desfeita.`)) {
                try {
                    await makeRequest(`${API_URL}/${config.plural}/${id}`, 'DELETE');
                    await loadAllData();
                } catch (error) {
                    console.error(`Erro ao excluir ${config.title}:`, error);
                    alert(error.message || `Falha ao excluir ${config.title}. Verifique se não está em uso.`);
                }
            }
        });

        // Submit do formulário do modal
        $('#modal-form').on('submit', handleFormSubmit);

        // Pesquisa nas tabelas
        $('input[type="search"]').on('keyup', function() {
            const searchTerm = $(this).val().toLowerCase();
            const tableBodyId = $(this).data('table');
            $(`#${tableBodyId} tr`).each(function() {
                const rowText = $(this).text().toLowerCase();
                $(this).toggle(rowText.includes(searchTerm));
            });
        });
    }

    // --- Iniciar ---
    initializePage();
}); 