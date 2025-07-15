document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/freight-tariffs';
    const params = new URLSearchParams(window.location.search);
    const tariffId = params.get('id');
    const isClone = params.get('clone') === 'true';
    let formData = {}; // Para armazenar dados de selects

    // --- Funções de Inicialização ---
    async function initializePage() {
        try {
            const data = await makeRequest(`${API_URL}/meta/form-data`);
            formData = data;
            populateAllSelects();

            if (tariffId && isClone) {
                document.title = "Clonar Tarifa";
                $('#page-title').text('Clonar Tarifa');
                loadTariff(tariffId, true);
            } else if (tariffId) {
                document.title = "Editar Tarifa";
                $('#page-title').text('Editar Tarifa');
                loadTariff(tariffId);
            } else {
                document.title = "Nova Tarifa";
                $('#page-title').text('Adicionar Nova Tarifa');
            }
        } catch (error) {
            console.error('Erro ao inicializar a página:', error);
            alert('Falha ao carregar dados essenciais. A página pode não funcionar corretamente.');
        }
    }

    function populateAllSelects() {
        populateSelect('origin_id', formData.locations.filter(l => l.type !== 'Destino'), 'Selecione a Origem');
        populateSelect('destination_id', formData.locations.filter(l => l.type !== 'Origem'), 'Selecione o Destino');
        populateSelect('modality_id', formData.modalities, 'Selecione a Modalidade');
        populateSelect('agent_id', formData.agents, 'Selecione o Agente');
        populateSelect('shipowner_id', formData.agents, 'Selecione o Armador');
        populateSelect('container_type_id', [], 'Selecione o Tipo de Container'); // Inicia vazio
        populateCurrencySelect('freight_currency');
        
        // Inicializa o Select2 nos selects principais
        const $selects = $('.form-select');
        $selects.select2({
            theme: 'bootstrap-5',
            width: $(this).data('width') ? $(this).data('width') : $(this).hasClass('w-100') ? '100%' : 'style'
        });
        
        // Adiciona o foco automático
        $selects.on('select2:open', () => {
            setTimeout(() => {
                document.querySelector('.select2-container--open .select2-search__field').focus();
            }, 10);
        });
    }

    function populateSelect(selectId, data, placeholder) {
        const select = $(`#${selectId}`);
        select.empty().append(`<option value="">${placeholder}</option>`);
        data.forEach(item => {
            select.append(`<option value="${item.id}">${item.name}</option>`);
        });
    }

    function populateCurrencySelect(selectId, selectedValue = 'USD') {
        const select = $(`#${selectId}`);
        select.empty();
        if (formData.currencies) {
            formData.currencies.forEach(currency => {
                const option = `<option value="${currency.code}">${currency.code} - ${currency.name}</option>`;
                select.append(option);
            });
            select.val(selectedValue);
        }
    }

    function updateContainerTypes(modalityId) {
        const applicableTypes = formData.container_types.filter(ct => {
            return ct.applicable_modalities && ct.applicable_modalities.split(',').includes(modalityId);
        });
        populateSelect('container_type_id', applicableTypes, 'Selecione o Tipo de Container');
    }

    // --- Funções de Carregamento e Salvamento de Dados ---
    async function loadTariff(id, isClone = false) {
        try {
            const tariff = await makeRequest(`${API_URL}/tariffs/${id}`);
            
            $('#origin_id').val(tariff.origin_id).trigger('change');
            $('#destination_id').val(tariff.destination_id).trigger('change');
            $('#modality_id').val(tariff.modality_id).trigger('change');
            
            // O 'change' da modalidade já aciona o update dos containers,
            // mas precisamos esperar um pouco para que as opções sejam carregadas antes de setar o valor.
            setTimeout(() => {
                $('#container_type_id').val(tariff.container_type_id).trigger('change');
            }, 100);

            $('#agent_id').val(tariff.agent_id).trigger('change');
            $('#shipowner_id').val(tariff.shipowner_id).trigger('change');
            $('#route_type').val(tariff.route_type);
            $('#validity_start_date').val(tariff.validity_start_date.split('T')[0]);
            $('#validity_end_date').val(tariff.validity_end_date.split('T')[0]);
            $('#transit_time').val(tariff.transit_time);
            $('#free_time').val(tariff.free_time);
            $('#freight_cost').val(tariff.freight_cost);
            $('#freight_currency').val(tariff.freight_currency).trigger('change');
            $('#notes').val(tariff.notes);

            if (isClone) {
                $('#tariff-id').val(''); // Limpar o ID para criar um novo
                 document.title = "Clonar Tarifa";
                $('#page-title').text('Clonar Tarifa');
                $('#page-subtitle').text(`Clonando a partir da tarifa #${id}`);
            } else {
                $('#tariff-id').val(tariff.id);
                $('#page-subtitle').text(`Editando a tarifa #${tariff.id}`);
            }
            
            if (tariff.surcharges) {
                tariff.surcharges.forEach(addSurchargeRow);
            }

        } catch (error) {
            console.error('Erro ao carregar tarifa:', error);
            alert('Falha ao carregar os dados da tarifa.');
        }
    }

    $('#tariff-form').on('submit', async function (e) {
        e.preventDefault();
        const id = $('#tariff-id').val();

        // Validar campos obrigatórios
        const container_type_id = $('#container_type_id').val();
        if (!container_type_id) {
            alert('O tipo de container é obrigatório.');
            $('#container_type_id').focus();
            return;
        }

        const surcharges = [];
        $('#surcharges-tbody tr').each(function () {
            const row = $(this);
            surcharges.push({
                name: row.find('.surcharge-name').val(),
                value: row.find('.surcharge-value').val(),
                currency: row.find('.surcharge-currency').val()
            });
        });

        const tariffData = {
            origin_id: $('#origin_id').val(),
            destination_id: $('#destination_id').val(),
            modality_id: $('#modality_id').val(),
            container_type_id: container_type_id,
            agent_id: $('#agent_id').val(),
            shipowner_id: $('#shipowner_id').val(),
            validity_start_date: $('#validity_start_date').val(),
            validity_end_date: $('#validity_end_date').val(),
            freight_cost: $('#freight_cost').val(),
            freight_currency: $('#freight_currency').val(),
            transit_time: $('#transit_time').val(),
            free_time: $('#free_time').val(),
            route_type: $('#route_type').val(),
            notes: $('#notes').val(),
            surcharges: surcharges
        };

        try {
            if (id) {
                await makeRequest(`${API_URL}/tariffs/${id}`, 'PUT', tariffData);
            } else {
                await makeRequest(`${API_URL}/tariffs`, 'POST', tariffData);
            }

            if (window.opener && window.opener.refreshTariffs) {
                window.opener.refreshTariffs();
            }
            window.close();
        } catch (error) {
            console.error('Erro ao salvar tarifa:', error);
            alert(`Erro ao salvar: ${error.message}`);
        }
    });

    // --- Lógica de Surcharges ---
    $('#btn-add-surcharge').on('click', () => {
        addSurchargeRow();
    });

    function addSurchargeRow(surcharge = {}) {
        const currencyOptions = formData.currencies.map(c => `<option value="${c.code}" ${surcharge.currency === c.code ? 'selected' : ''}>${c.code}</option>`).join('');
        const newRowHtml = `
            <tr>
                <td><input type="text" class="form-control surcharge-name" value="${surcharge.name || ''}" placeholder="Nome da Sobretaxa" required></td>
                <td><input type="number" class="form-control surcharge-value" value="${surcharge.value || ''}" step="0.01" required></td>
                <td><select class="form-select surcharge-currency">${currencyOptions}</select></td>
                <td><button type="button" class="btn btn-danger btn-sm btn-remove-surcharge"><i class="ri-delete-bin-line"></i></button></td>
            </tr>
        `;
        const newRow = $(newRowHtml);
        const $currencySelect = newRow.find('.surcharge-currency');

        // Inicializa o Select2 no novo seletor de moeda antes de adicionar a linha à tabela
        $currencySelect.select2({
            theme: 'bootstrap-5',
            width: $(this).data('width') ? $(this).data('width') : $(this).hasClass('w-100') ? '100%' : 'style'
        });
        
        // Adiciona o foco automático
        $currencySelect.on('select2:open', () => {
            setTimeout(() => {
                document.querySelector('.select2-container--open .select2-search__field').focus();
            }, 10);
        });

        $('#surcharges-tbody').append(newRow);
    }

    $('#surcharges-tbody').on('click', '.btn-remove-surcharge', function () {
        $(this).closest('tr').remove();
    });
    
    // --- Event Listeners ---
    $('#modality_id').on('change', function() {
        const modalityId = $(this).val();
        updateContainerTypes(modalityId);
    });

    // --- Iniciar ---
    initializePage();
}); 