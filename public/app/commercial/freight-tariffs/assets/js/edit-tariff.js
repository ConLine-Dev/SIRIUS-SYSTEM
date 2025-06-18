document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/freight-tariffs';
    const params = new URLSearchParams(window.location.search);
    const tariffId = params.get('id');
    const cloneId = params.get('cloneId');
    const isEdit = !!tariffId;
    const isClone = !!cloneId;

    let formData = {};

    // --- Funções de Inicialização ---
    async function initializePage() {
        await loadFormData();
        if (isEdit || isClone) {
            const idToLoad = isEdit ? tariffId : cloneId;
            await loadTariffData(idToLoad);
        } else {
            $('#page-title').text('Adicionar Nova Tarifa');
            $('#page-subtitle').text('Crie uma nova tarifa de frete');
        }
    }

    async function loadFormData() {
        try {
            const data = await makeRequest(`${API_URL}/meta/form-data`);
            formData = data;
            populateFormSelects();
        } catch (error) {
            console.error('Erro ao carregar dados do formulário:', error);
            alert('Falha ao carregar dados de suporte.');
        }
    }
    
    function populateFormSelects() {
        const createOption = (item) => `<option value="${item.id}">${item.name}</option>`;
        const initialOption = '<option value="">Selecione...</option>';

        $('#origin_id').html(initialOption + formData.locations.filter(l => l.type !== 'Destino').map(createOption).join(''));
        $('#destination_id').html(initialOption + formData.locations.filter(l => l.type !== 'Origem').map(createOption).join(''));
        $('#modality_id').html(initialOption + formData.modalities.map(createOption).join(''));
        $('#agent_id').html(initialOption + formData.agents.map(createOption).join(''));
        
        updateContainerTypeOptions();
    }
    
    function updateContainerTypeOptions() {
        const modalityId = $('#modality_id').val();
        const applicableTypes = formData.container_types.filter(ct => 
            !modalityId || ct.applicable_modalities.split(',').includes(modalityId)
        );
        const options = '<option value="">Selecione...</option>' + applicableTypes.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
        $('#container_type_id').html(options);
    }

    async function loadTariffData(id) {
         try {
            const tariff = await makeRequest(`${API_URL}/tariffs/${id}`);
            
            if (isClone) {
                $('#page-title').text('Clonar Tarifa');
                $('#page-subtitle').text(`Clonando tarifa de ${tariff.origin_name} para ${tariff.destination_name}`);
            } else {
                $('#page-title').text('Editar Tarifa');
                $('#page-subtitle').text(`Editando tarifa de ${tariff.origin_name} para ${tariff.destination_name}`);
            }

            if (isEdit) {
                 $('#tariff-id').val(tariff.id);
            }
            
            Object.keys(tariff).forEach(key => {
                const el = $(`#${key}`);
                if (el.length) {
                     if (key.includes('_date')) {
                        el.val(tariff[key].split('T')[0]);
                    } else {
                        el.val(tariff[key]);
                    }
                }
            });

            updateContainerTypeOptions();
            $('#container_type_id').val(tariff.container_type_id);

            const surchargesContainer = $('#surcharges-container');
            surchargesContainer.empty();
            if (tariff.surcharges) {
                tariff.surcharges.forEach(s => addSurchargeRow(s.name, s.value, s.currency));
            }
        } catch (error) {
            console.error('Erro ao buscar tarifa para edição:', error);
            alert('Falha ao carregar dados da tarifa.');
        }
    }

    function addSurchargeRow(name = '', value = '', currency = 'USD') {
        const row = `
            <div class="row g-2 mb-2 surcharge-row">
                <div class="col-5"><input type="text" class="form-control form-control-sm surcharge-name" placeholder="Nome" value="${name}" required></div>
                <div class="col-3"><input type="number" class="form-control form-control-sm surcharge-value" placeholder="Valor" step="0.01" value="${value}" required></div>
                <div class="col-3"><input type="text" class="form-control form-control-sm surcharge-currency" placeholder="Moeda" value="${currency}" required></div>
                <div class="col-1"><button type="button" class="btn btn-danger btn-sm btn-remove-surcharge w-100">X</button></div>
            </div>
        `;
        $('#surcharges-container').append(row);
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        const id = $('#tariff-id').val();
        const surcharges = $('.surcharge-row').map(function() {
            return {
                name: $(this).find('.surcharge-name').val(),
                value: parseFloat($(this).find('.surcharge-value').val()),
                currency: $(this).find('.surcharge-currency').val(),
            };
        }).get().filter(s => s.name && s.value);

        const tariffData = {
            ...Object.fromEntries(new FormData(document.getElementById('tariff-form'))),
            surcharges
        };

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/tariffs/${id}` : `${API_URL}/tariffs`;
            await makeRequest(url, method, tariffData);
            
            alert('Tarifa salva com sucesso!');
            if (window.opener && window.opener.refreshTariffs) {
                window.opener.refreshTariffs();
            }
            window.close();
        } catch (error) {
            console.error('Erro ao salvar tarifa:', error);
            alert('Falha ao salvar a tarifa. Verifique os dados e tente novamente.');
        }
    }

    // --- Handlers ---
    $('#tariff-form').on('submit', handleFormSubmit);
    $('#modality_id').on('change', updateContainerTypeOptions);
    $('#btn-add-surcharge').on('click', () => addSurchargeRow());
    $('#surcharges-container').on('click', '.btn-remove-surcharge', function() {
        $(this).closest('.surcharge-row').remove();
    });

    // --- Iniciar ---
    initializePage();
}); 