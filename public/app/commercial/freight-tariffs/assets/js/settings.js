document.addEventListener('DOMContentLoaded', function() {
    const API_URL = '/api/freight-tariffs';
    let allData = { agents: [], locations: [], modalities: [], container_types: [] };

    const entityConfig = {
        agent: { plural: 'agents', title: 'Agente' },
        location: { plural: 'locations', title: 'Localização' },
        modality: { plural: 'modalities', title: 'Modalidade' },
        container_type: { plural: 'container_types', title: 'Tipo de Container' }
    };

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
        data.forEach(item => {
            let rowHtml = '<tr>';
            if (type === 'agent') {
                rowHtml += `<td>${item.name}</td><td>${item.contact_person || ''}</td><td>${item.contact_email || ''}</td><td>${item.contact_phone || ''}</td>`;
            } else if (type === 'location') {
                rowHtml += `<td>${item.name}</td><td>${item.type}</td>`;
            } else if (type === 'modality') {
                rowHtml += `<td>${item.name}</td><td>${item.description || ''}</td>`;
            } else if (type === 'container_type') {
                 rowHtml += `<td>${item.name}</td><td>${item.modality_names || 'Todas'}</td>`;
            }
            rowHtml += `
                <td>
                    <button class="btn btn-sm btn-warning btn-edit" data-type="${type}" data-id="${item.id}"><i class="ri-pencil-line"></i></button>
                    <button class="btn btn-sm btn-danger btn-delete" data-type="${type}" data-id="${item.id}"><i class="ri-delete-bin-line"></i></button>
                </td>
            </tr>`;
            tbody.append(rowHtml);
        });
    }

    // --- Manipuladores de Eventos ---
    $('.btn-add').on('click', function() {
        const type = $(this).data('type');
        window.open(`edit-setting.html?type=${type}`, 'edit-setting', 'width=600,height=500,scrollbars=yes');
    });

    $('#settings-tabs-content').on('click', '.btn-edit', function() {
        const type = $(this).data('type');
        const id = $(this).data('id');
        window.open(`edit-setting.html?type=${type}&id=${id}`, 'edit-setting', 'width=600,height=500,scrollbars=yes');
    });
    
    $('#settings-tabs-content').on('click', '.btn-delete', async function() {
        const id = $(this).data('id');
        const type = $(this).data('type');
        const config = entityConfig[type];
        
        if (confirm(`Tem certeza que deseja excluir este(a) ${config.title}?`)) {
            try {
                await makeRequest(`${API_URL}/${config.plural}/${id}`, 'DELETE');
                await loadAllData();
            } catch (error) {
                console.error(`Erro ao excluir ${config.title}:`, error);
                alert(error.message || `Falha ao excluir ${config.title}. Verifique se não está em uso.`);
            }
        }
    });

    // --- Iniciar ---
    loadAllData();
}); 