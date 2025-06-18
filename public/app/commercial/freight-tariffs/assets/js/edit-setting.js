document.addEventListener('DOMContentLoaded', function() {
    const API_URL = '/api/freight-tariffs';
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const id = params.get('id');
    const isEdit = !!id;

    const entityConfig = {
        agent: { plural: 'agents', title: 'Agente' },
        location: { plural: 'locations', title: 'Localização' },
        modality: { plural: 'modalities', title: 'Modalidade' },
        container_type: { plural: 'container_types', title: 'Tipo de Container' }
    };
    
    const config = entityConfig[type];

    async function initializePage() {
        const actionText = isEdit ? 'Editar' : 'Adicionar';
        $('#page-title').text(`${actionText} ${config.title}`);
        $('#page-subtitle').text(`Gerencie um(a) ${config.title.toLowerCase()} existente ou crie um(a) novo(a)`);
        $('#edit-type').val(type);
        if (isEdit) {
            $('#edit-id').val(id);
            const item = await makeRequest(`${API_URL}/${config.plural}/${id}`);
            buildFormFields(item);
        } else {
            // Para 'container_type', precisamos das modalidades para construir o formulário
            if (type === 'container_type') {
                const modalities = await makeRequest(`${API_URL}/modalities`);
                buildFormFields({}, modalities);
            } else {
                buildFormFields();
            }
        }
    }

    function buildFormFields(item = {}, modalities = []) {
        const fieldsContainer = $('#settings-form-fields');
        let fieldsHtml = `<div class="mb-3"><label class="form-label">Nome*</label><input type="text" name="name" class="form-control" value="${item.name || ''}" required></div>`;

        if (type === 'agent') {
            fieldsHtml += `<div class="mb-3"><label class="form-label">Pessoa de Contato</label><input type="text" name="contact_person" class="form-control" value="${item.contact_person || ''}"></div>`;
            fieldsHtml += `<div class="mb-3"><label class="form-label">Email</label><input type="email" name="contact_email" class="form-control" value="${item.contact_email || ''}"></div>`;
            fieldsHtml += `<div class="mb-3"><label class="form-label">Telefone</label><input type="text" name="contact_phone" class="form-control" value="${item.contact_phone || ''}"></div>`;
        } else if (type === 'location') {
            fieldsHtml += `
                <div class="mb-3">
                    <label class="form-label">Tipo*</label>
                    <select name="type" class="form-select" required>
                        <option value="Origem" ${item.type === 'Origem' ? 'selected' : ''}>Origem</option>
                        <option value="Destino" ${item.type === 'Destino' ? 'selected' : ''}>Destino</option>
                        <option value="Ambos" ${item.type === 'Ambos' ? 'selected' : ''}>Ambos</option>
                    </select>
                </div>`;
        } else if (type === 'modality') {
            fieldsHtml += `<div class="mb-3"><label class="form-label">Descrição</label><textarea name="description" class="form-control">${item.description || ''}</textarea></div>`;
        } else if (type === 'container_type') {
            fieldsHtml += `<div class="mb-3"><label class="form-label">Modalidades Aplicáveis</label>`;
            modalities.forEach(modality => {
                const checked = item.applicable_modalities && item.applicable_modalities.split(',').includes(String(modality.id));
                fieldsHtml += `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="applicable_modalities" value="${modality.id}" id="modality-${modality.id}" ${checked ? 'checked' : ''}>
                        <label class="form-check-label" for="modality-${modality.id}">${modality.name}</label>
                    </div>`;
            });
            fieldsHtml += `</div>`;
        }
        fieldsContainer.html(fieldsHtml);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const form = document.getElementById('settings-form');
        const formData = new FormData(form);
        let body = Object.fromEntries(formData.entries());

        if (type === 'container_type') {
            body.applicable_modalities = formData.getAll('applicable_modalities');
        }

        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${API_URL}/${config.plural}/${id}` : `${API_URL}/${config.plural}`;

        try {
            await makeRequest(url, method, body);
            alert(`${config.title} salvo(a) com sucesso!`);
            if (window.opener && window.opener.refreshSettings) {
                window.opener.refreshSettings();
            }
            window.close();
        } catch (error) {
            console.error(`Erro ao salvar ${config.title}:`, error);
            alert(`Falha ao salvar ${config.title}.`);
        }
    }

    // --- Handlers ---
    $('#settings-form').on('submit', handleFormSubmit);

    // --- Iniciar ---
    initializePage();
}); 