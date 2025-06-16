$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const procedureId = urlParams.get('id');

    if (procedureId) {
        fetchProcedureData(procedureId);
    }
    
    // Configura o modal de imagem para limpar a imagem ao fechar, evitando cache
    $('#image-viewer-modal').on('hidden.bs.modal', function () {
        $('#modal-image').attr('src', '');
    });
});

async function fetchProcedureData(id) {
    try {
        const data = await makeRequest(`/api/procedures-management/procedures/${id}`);
        
        // Popula o título
        $('#title').text(data.title);

        // Renderiza o conteúdo com Quill em modo somente leitura
        const quill = new Quill('#procedure-content-quill', {
            theme: 'snow',
            modules: { toolbar: false },
            readOnly: true
        });
        quill.setContents(data.content);

        // Renderiza os metadados
        renderMetaInfo(data);

        // Renderiza os anexos
        renderAttachments(data.attachments);
        
        // Renderiza os anexos para impressão
        renderAttachmentsForPrint(data.attachments);
        
        // Renderiza o histórico a partir dos dados principais
        renderHistory(data.versions);

    } catch (error) {
        console.error('Erro ao buscar dados do procedimento:', error);
        alert('Não foi possível carregar os detalhes do procedimento.');
    }
}

function renderMetaInfo(data) {
    const container = $('#meta-info');
    container.empty();
    const tagsHtml = data.tags.map(tag => `<span class="badge bg-light text-primary fw-semibold me-1">${tag}</span>`).join(' ');

    // Pega a data da última versão
    let updatedStr = '-';
    if (data.versions && data.versions.length > 0) {
        data.versions.sort((a, b) => b.version_number - a.version_number);
        const lastVersion = data.versions[0];
        if (lastVersion.created_at) {
            const date = new Date(lastVersion.created_at);
            date.setHours(date.getHours() - 3);
            updatedStr = date.toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }
    }

    const metaHtml = `
        <div class="meta-info-item d-flex align-items-center"><i class="ri-user-star-line me-2 text-primary"></i> <div><strong>Responsável:</strong> ${data.responsible}</div></div>
        <div class="meta-info-item d-flex align-items-center"><i class="ri-building-line me-2 text-primary"></i> <div><strong>Departamento:</strong> <span class="badge bg-info-transparent">${data.department}</span></div></div>
        <div class="meta-info-item d-flex align-items-center"><i class="ri-briefcase-4-line me-2 text-primary"></i> <div><strong>Cargo:</strong> <span class="badge bg-success-transparent">${data.role}</span></div></div>
        <div class="meta-info-item d-flex align-items-center"><i class="ri-file-list-3-line me-2 text-primary"></i> <div><strong>Tipo:</strong> ${data.type}</div></div>
        <div class="meta-info-item d-flex align-items-center"><i class="ri-calendar-check-line me-2 text-primary"></i> <div><strong>Última Atualização:</strong> ${updatedStr}</div></div>
        <div class="mt-3"><strong class="d-flex align-items-center"><i class="ri-price-tag-3-line me-2 text-primary"></i> Tags:</strong><div class="mt-1">${tagsHtml}</div></div>
    `;
    container.html(metaHtml);
}

function renderAttachments(attachments) {
    const container = $('#attachments-list');
    container.empty();
    if (!attachments || attachments.length === 0) {
        container.html('<p class="text-muted">Nenhum anexo encontrado.</p>');
        return;
    }

    attachments.forEach(att => {
        const type = att.type || 'file';
        const description = att.description || (type === 'file' ? att.url.split('/').pop() : att.url);
        const url = att.url || '';
        const isFile = type === 'file';
        const isImage = type === 'image';
        const isVideo = type === 'video';

        let iconHtml = '';
        if (isImage) {
            iconHtml = `<img src="${url}" class="attachment-thumbnail" alt="Anexo">`;
        } else {
            const iconClass = {
                link: 'ri-links-line',
                video: 'ri-film-line',
                file: 'ri-file-text-line'
            }[type] || 'ri-links-line';
            iconHtml = `<div class="attachment-icon"><i class="${iconClass}"></i></div>`;
        }

        let buttonsHtml = '';
        if (isFile) {
            buttonsHtml = `
                <a href="${url}" target="_blank" class="btn btn-light" title="Visualizar"><i class="ri-eye-line"></i></a>
                <a href="${url}" download class="btn btn-light" title="Baixar"><i class="ri-download-2-line"></i></a>`;
        } else if (isImage) {
            buttonsHtml = `<a href="#" class="btn btn-light image-attachment-view" data-url="${url}" title="Visualizar"><i class="ri-eye-line"></i></a>`;
        } else { // Link e Vídeo
            buttonsHtml = `<a href="${url}" target="_blank" class="btn btn-light" title="Abrir Link"><i class="ri-external-link-line"></i></a>`;
        }

        const cardHtml = `
            <div class="attachment-card p-2 mb-2" data-type="${type}">
                <div class="d-flex align-items-center">
                    <div class="me-2">${iconHtml}</div>
                    <div class="flex-grow-1 mx-2" style="min-width: 0;">
                        <p class="m-0 text-truncate attachment-description">${description}</p>
                        ${isFile ? `<small class="text-muted text-truncate d-block attachment-filename">${url.split('/').pop()}</small>` : ''}
                        ${isVideo ? `<small class="text-muted text-truncate d-block attachment-filename">${url}</small>` : ''}
                    </div>
                    <div class="ms-auto">
                        <div class="btn-group btn-group-sm">
                            ${buttonsHtml}
                        </div>
                    </div>
                </div>
            </div>`;
        container.append(cardHtml);
    });

    // Event listener para o modal de imagem (agora aplicado na classe dos novos botões)
    $('.image-attachment-view').on('click', function(e) {
        e.preventDefault();
        const imageUrl = $(this).data('url');
        $('#modal-image').attr('src', imageUrl);
        const imageModal = new bootstrap.Modal(document.getElementById('image-viewer-modal'));
        imageModal.show();
    });
}

function renderAttachmentsForPrint(attachments) {
    const container = $('#attachments-list-print');
    container.empty();
    if (!attachments || attachments.length === 0) {
        // Não exibe nada se não houver anexos
        return;
    }

    let attachmentsHtml = '<ul class="list-unstyled">';
    attachments.forEach(att => {
        let iconClass = 'ri-links-line'; // Default para link
        if (att.type === 'image') iconClass = 'ri-image-line';
        if (att.type === 'video') iconClass = 'ri-film-line';
        if (att.type === 'file') iconClass = 'ri-download-2-line';

        attachmentsHtml += `
            <li class="mb-2">
                <i class="${iconClass} me-2"></i>
                <span>${att.description || att.url}</span>
            </li>
        `;
    });
    attachmentsHtml += '</ul>';
    container.html(attachmentsHtml);
}

function renderHistory(versions) {
    const list = $('#version-history-list');
    list.empty();
    if (!versions || versions.length === 0) {
        list.html('<li class="list-group-item text-muted">Nenhum histórico de versão encontrado.</li>');
        return;
    }
    versions.sort((a, b) => b.version_number - a.version_number).forEach(item => {
        let dateStr = '-';
        if (item.created_at) {
            const date = new Date(item.created_at);
            date.setHours(date.getHours() - 3);
            dateStr = date.toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }
        const listItem = `
            <li class="list-group-item">
                <strong>Versão ${item.version_number}</strong>
                <small class="d-block text-muted">
                    por ${item.author_name || 'Desconhecido'} em ${dateStr}
                </small>
                <div class="text-secondary small mt-1"><i class='ri-chat-history-line me-1'></i> ${item.change_summary || 'Sem resumo.'}</div>
            </li>
        `;
        list.append(listItem);
    });
} 