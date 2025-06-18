document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/freight-tariffs';
    let allTariffs = [];
    let formData = {};

    // --- Funções de Inicialização ---
    async function initializePage() {
        await loadFormData();
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
    }

    function renderTariffsTable(tariffs) {
        const tbody = $('#tariffs-table-body');
        tbody.empty();
        if (tariffs.length === 0) {
            tbody.html('<tr><td colspan="9" class="text-center">Nenhuma tarifa encontrada.</td></tr>');
            return;
        }

        tariffs.forEach(t => {
            const statusClass = t.status === 'Ativa' ? 'status-Ativa' : (t.status === 'Expira Breve' ? 'status-Expira' : 'status-Expirada');
            const row = `
                <tr>
                    <td><span class="status-badge ${statusClass}"></span> ${t.status}</td>
                    <td>${t.origin_name}</td>
                    <td>${t.destination_name}</td>
                    <td>${t.modality_name} ${t.container_type_name ? `(${t.container_type_name})` : ''}</td>
                    <td>${new Date(t.validity_start_date).toLocaleDateString()} - ${new Date(t.validity_end_date).toLocaleDateString()}</td>
                    <td>${t.agent_name}</td>
                    <td>${t.total_cost ? t.total_cost.toFixed(2) : '0.00'} ${t.freight_currency}</td>
                    <td>${t.transit_time || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-info btn-clone" data-id="${t.id}" title="Clonar"><i class="ri-file-copy-line"></i></button>
                        <button class="btn btn-sm btn-warning btn-edit" data-id="${t.id}" title="Editar"><i class="ri-pencil-line"></i></button>
                        <button class="btn btn-sm btn-danger btn-delete" data-id="${t.id}" title="Excluir"><i class="ri-delete-bin-line"></i></button>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    // --- Manipuladores de Eventos ---
    $('#btn-add-tariff').on('click', () => {
        window.open('edit-tariff.html', 'edit-tariff', 'width=1000,height=800,scrollbars=yes');
    });

    $('#filter-form').on('submit', (e) => { e.preventDefault(); loadTariffs(); });
    $('#btn-clear-filters').on('click', () => { $('#filter-form')[0].reset(); loadTariffs(); });

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

    // --- Iniciar ---
    initializePage();
}); 