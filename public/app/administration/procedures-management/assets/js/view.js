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
        // Ordena para garantir que a última versão é a primeira
        data.versions.sort((a, b) => b.version_number - a.version_number);
        const lastVersion = data.versions[0];
        if (lastVersion.created_at) {
            const date = new Date(lastVersion.created_at);
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
    
    let attachmentsHtml = '<div class="list-group">';
    attachments.forEach(att => {
        let itemHtml = '';

        // Tenta extrair ID de vídeo do YouTube/Vimeo
        const youtubeId = (url => {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        })(att.url);
        
        const vimeoId = (url => {
            const regExp = /vimeo.*\/(\d+)/i;
            const match = url.match(regExp);
            return match ? match[1] : null;
        })(att.url);

        if (att.type === 'video' && (youtubeId || vimeoId)) {
            const embedUrl = youtubeId 
                ? `https://www.youtube.com/embed/${youtubeId}` 
                : `https://player.vimeo.com/video/${vimeoId}`;
            itemHtml = `
                <div class="list-group-item attachment-item">
                    <h6><i class="ri-film-line me-2 text-danger"></i> ${att.description || 'Vídeo Anexado'}</h6>
                    <div class="ratio ratio-16x9 mt-2">
                        <iframe src="${embedUrl}" title="Video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                </div>
            `;
        } else if (att.type === 'image') {
            itemHtml = `
                <a href="#" class="list-group-item list-group-item-action attachment-item image-attachment" data-url="${att.url}" data-bs-toggle="modal" data-bs-target="#image-viewer-modal">
                    <i class="ri-image-line me-2 text-success"></i> ${att.description || 'Imagem Anexada'}
                </a>
            `;
        } else { // 'link' or default
            itemHtml = `
                <a href="${att.url}" target="_blank" rel="noopener noreferrer" class="list-group-item list-group-item-action attachment-item">
                    <i class="ri-links-line me-2 text-info"></i> ${att.description || att.url}
                </a>
            `;
        }
        attachmentsHtml += itemHtml;
    });
    attachmentsHtml += '</div>';
    container.html(attachmentsHtml);

    // Event listener para o modal de imagem
    $('.image-attachment').on('click', function(e) {
        e.preventDefault();
        const imageUrl = $(this).data('url');
        $('#modal-image').attr('src', imageUrl);
        // A inicialização do modal foi movida para dentro do manipulador de clique para garantir que funcione
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
    // Ordena da mais nova para a mais antiga
    versions.sort((a, b) => b.version_number - a.version_number).forEach(item => {
        let dateStr = '-';
        if (item.created_at) {
            const date = new Date(item.created_at);
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