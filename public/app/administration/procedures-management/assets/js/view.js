// ===============================
// CONFIGURAÇÕES DE PERFORMANCE PARA VIEW
// ===============================
const PERFORMANCE_CONFIG = {
    // Cache
    CACHE_TTL: {
        PROCEDURES: 300000,     // 5 minutos
        USER_INFO: 600000,      // 10 minutos
    },
    
    // Delays
    DELAYS: {
        DEBOUNCE_FILTER: 300,   // 300ms para filtros
        RETRY_DELAY: 200,       // 200ms entre tentativas
        DOM_READY_WAIT: 100,    // 100ms após DOM ready
    },
    
    // Retry
    MAX_RETRIES: 3,
    
    // DOM
    USE_DOCUMENT_FRAGMENT: true,
    BATCH_SIZE: 50,
};

// ===============================
// SISTEMA DE CACHE E OTIMIZAÇÃO PARA VIEW
// ===============================
let procedureData = {};
let quill = null;

// Cache para dados carregados
let viewCache = {
    data: null,
    timestamp: 0
};
const VIEW_CACHE_TTL = PERFORMANCE_CONFIG.CACHE_TTL.PROCEDURES;

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const procedureId = urlParams.get('id');

    // Sequência otimizada de carregamento para visualização
    if (procedureId) {
        initializeViewPage(procedureId);
    } else {
        console.error('ID do procedimento não encontrado na URL');
    }
    
    // Configura o modal de imagem para limpar a imagem ao fechar, evitando cache
    $('#image-viewer-modal').on('hidden.bs.modal', function () {
        $('#modal-image').attr('src', '');
    });
});

// ===============================
// FUNÇÃO DE INICIALIZAÇÃO OTIMIZADA PARA VIEW
// ===============================
async function initializeViewPage(procedureId) {
    try {
        console.log('🚀 Iniciando carregamento da página de visualização...');
        
        // Aguardar DOM estar totalmente carregado
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });
        }
        
        // Mostrar loader
        $('body').append('<div id="loading-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>');
        
        // 1. Carregar dados do procedimento
        console.log('📡 Carregando dados do procedimento...');
        const data = await loadProcedureDataOptimized(procedureId);
        
        // 2. Inicializar Quill apenas APÓS ter os dados
        console.log('🖊️ Inicializando visualizador Quill...');
        initializeQuillViewer();
        
        // 3. Aguardar um pouco para garantir que Quill foi totalmente inicializado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 4. Popular página com dados carregados
        console.log('📝 Populando página de visualização...');
        await populateViewPage(data);
        
        console.log('✅ Página de visualização carregada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar página de visualização:', error);
        alert('Erro ao carregar o procedimento. Tente novamente.');
    } finally {
        // Remover loader
        $('#loading-overlay').remove();
    }
}

// Função otimizada para carregar dados (com cache)
async function loadProcedureDataOptimized(id) {
    // Verificar cache primeiro
    const now = Date.now();
    const cacheKey = `procedure_${id}`;
    
    if (viewCache.data && viewCache.data.id == id && (now - viewCache.timestamp) < VIEW_CACHE_TTL) {
        console.log('📦 Usando dados do cache para visualização');
        return viewCache.data;
    }
    
    console.log('📡 Fazendo request para carregar procedimento (view):', id);
    const data = await makeRequest(`/api/procedures-management/procedures/${id}`);
    
    console.log('📥 Dados recebidos do servidor (view):', data);
    console.log('🔍 Conteúdo específico recebido (view):', data.content);
    
    // Armazenar dados globalmente
    procedureData = data;
    
    // Atualizar cache
    viewCache = {
        data: data,
        timestamp: now
    };
    
    return data;
}

// Função separada para inicializar o Quill em modo visualização
function initializeQuillViewer() {
    if (quill) {
        console.log('⚠️ Quill já inicializado para visualização, pulando...');
        return;
    }
    
    // Verificar se o container existe
    const container = document.getElementById('procedure-content-quill');
    if (!container) {
        console.error('❌ Container #procedure-content-quill não encontrado!');
        return;
    }
    
    try {
        quill = new Quill('#procedure-content-quill', {
            theme: 'snow',
            modules: { toolbar: false },
            readOnly: true,
            // Configurações adicionais para visualização
            bounds: '#procedure-content-quill',
            placeholder: 'Conteúdo do procedimento...'
        });
        
        // Definir flag de pronto
        window.quillViewerReady = true;
        
        console.log('✅ Visualizador Quill inicializado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Quill para visualização:', error);
        throw error;
    }
}

// Função para popular a página com dados
async function populateViewPage(data) {
    console.log('📝 Populando página de visualização com dados...');
    
    // Popular título
    $('#title').text(data.title || 'Título não disponível');
    
    // Popular Quill com conteúdo usando função robusta (aguardar conclusão)
    await setQuillViewerContentSafely(data.content);
    
    // Renderizar outros componentes
    renderMetaInfo(data);
    renderAttachments(data.attachments);
    renderAttachmentsForPrint(data.attachments);
    renderHistory(data.versions);
    
    console.log('✅ Página de visualização populada com sucesso');
}

// Função auxiliar robusta para definir conteúdo no Quill visualizador
async function setQuillViewerContentSafely(content, retryCount = 0) {
    const maxRetries = 3;
    
    console.log(`🔄 setQuillViewerContentSafely - Tentativa ${retryCount + 1}/${maxRetries + 1}`, content);
    
    if (!quill) {
        console.error('❌ Quill não inicializado em setQuillViewerContentSafely');
        return false;
    }
    
    if (!window.quillViewerReady && retryCount < maxRetries) {
        console.log('⏳ Aguardando Quill visualizador ficar pronto...');
        setTimeout(() => setQuillViewerContentSafely(content, retryCount + 1), 200);
        return;
    }
    
    try {
        let contentToSet = null;
        
        // ===============================
        // VERIFICAÇÃO E FALLBACK MELHORADOS
        // ===============================
        
        // 1. Verificar se o conteúdo recebido é válido
        if (content && content.ops && Array.isArray(content.ops) && content.ops.length > 0) {
            console.log(`✅ Conteúdo válido recebido com ${content.ops.length} operações`);
            contentToSet = content;
        }
        // 2. Se conteúdo vazio, tentar buscar da versão mais recente disponível nas versões locais
        else if (procedureData && procedureData.versions && procedureData.versions.length > 0) {
            console.log('⚠️ Conteúdo vazio recebido, verificando versões disponíveis...');
            
            // Ordenar versões por número decrescente
            const sortedVersions = [...procedureData.versions].sort((a, b) => b.version_number - a.version_number);
            
            for (const version of sortedVersions) {
                console.log(`🔍 Verificando versão ${version.version_number}...`);
                
                // Se a versão já tem conteúdo carregado e é válido
                if (version.content && version.content.ops && Array.isArray(version.content.ops) && version.content.ops.length > 0) {
                    console.log(`✅ Conteúdo encontrado na versão ${version.version_number} (${version.content.ops.length} operações)`);
                    contentToSet = version.content;
                    break;
                }
                // Se a versão não tem conteúdo carregado (null), tentar carregar via API apenas se for a primeira tentativa
                else if (version.content === null && retryCount === 0) {
                    console.log(`🔄 Tentando carregar conteúdo da versão ${version.version_number} via API...`);
                    
                    try {
                        const versionContent = await makeRequest(`/api/procedures-management/procedures/${procedureData.id}/versions/${version.version_number}/content`);
                        
                        if (versionContent && versionContent.content && versionContent.content.ops && versionContent.content.ops.length > 0) {
                            console.log(`✅ Conteúdo carregado via API da versão ${version.version_number} (${versionContent.content.ops.length} operações)`);
                            
                            // Atualizar cache local
                            version.content = versionContent.content;
                            contentToSet = versionContent.content;
                            break;
                        } else {
                            console.log(`⚠️ Versão ${version.version_number} via API também retornou conteúdo vazio`);
                        }
                    } catch (apiError) {
                        console.log(`❌ Erro ao carregar versão ${version.version_number} via API:`, apiError.message);
                        // Continuar tentando outras versões
                        continue;
                    }
                } else {
                    console.log(`⚠️ Versão ${version.version_number} não tem conteúdo válido`);
                }
            }
            
            // Se chegou até aqui e não encontrou conteúdo
            if (!contentToSet) {
                console.log('⚠️ Nenhuma versão com conteúdo válido encontrada');
            }
        } else {
            console.log('⚠️ Nenhum dado de versão disponível');
        }
        
        // 3. Fallback para conteúdo padrão se ainda não encontrou nada
        if (!contentToSet) {
            contentToSet = { ops: [{ insert: 'Nenhum conteúdo disponível.\n' }] };
            console.log('📝 Usando conteúdo padrão - nenhum conteúdo válido encontrado');
        } else {
            console.log('✅ Conteúdo válido será definido no Quill');
        }
        
        console.log('🖊️ Definindo conteúdo no Quill visualizador:', contentToSet);
        
        // 4. Definir conteúdo no Quill
        quill.setContents(contentToSet);
        
        // 5. Verificar se foi definido corretamente
        setTimeout(() => {
            const verification = quill.getContents();
            console.log('🔍 Verificação pós-definição (view):', verification);
            
            if (verification.ops && verification.ops.length > 0) {
                console.log('✅ Conteúdo definido com sucesso no Quill visualizador');
                return true;
            } else {
                console.error('❌ Falha na verificação do conteúdo (view)');
                if (retryCount < maxRetries) {
                    console.log('🔄 Tentando novamente...');
                    setTimeout(() => setQuillViewerContentSafely(content, retryCount + 1), 300);
                }
                return false;
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Erro em setQuillViewerContentSafely:', error);
        if (retryCount < maxRetries) {
            setTimeout(() => setQuillViewerContentSafely(content, retryCount + 1), 300);
        }
        return false;
    }
}

// Função legacy mantida para compatibilidade (agora usa a nova estrutura)
async function fetchProcedureData(id) {
    console.log('⚠️ Usando função legacy fetchProcedureData (view), considere migrar para initializeViewPage');
    return await initializeViewPage(id);
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

// ===============================
// FUNÇÕES DE RENDERIZAÇÃO OTIMIZADAS PARA VIEW
// ===============================

function renderAttachments(attachments) {
    const container = $('#attachments-list');
    container.empty();
    
    if (!attachments || attachments.length === 0) {
        container.html('<p class="text-muted">Nenhum anexo encontrado.</p>');
        return;
    }

    // Use DocumentFragment para performance
    const fragment = document.createDocumentFragment();
    
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

        // Criar elemento DOM direto para melhor performance
        const cardDiv = document.createElement('div');
        cardDiv.className = 'attachment-card p-2 mb-2';
        cardDiv.setAttribute('data-type', type);
        
        cardDiv.innerHTML = `
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
            </div>`;
        
        fragment.appendChild(cardDiv);
    });

    // Adicionar tudo de uma vez usando fragment
    container[0].appendChild(fragment);

    // Event listener otimizado para o modal de imagem
    $('.image-attachment-view').off('click.viewModal').on('click.viewModal', function(e) {
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
    
    // Usar DocumentFragment para performance
    const fragment = document.createDocumentFragment();
    
    // Ordenar versões por número
    const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);
    
    sortedVersions.forEach(item => {
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
        
        // Criar elemento direto para melhor performance
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.innerHTML = `
            <strong>Versão ${item.version_number}</strong>
            <small class="d-block text-muted">
                por ${item.author_name || 'Desconhecido'} em ${dateStr}
            </small>
            <div class="text-secondary small mt-1"><i class='ri-chat-history-line me-1'></i> ${item.change_summary || 'Sem resumo.'}</div>
        `;
        
        fragment.appendChild(listItem);
    });
    
    // Adicionar tudo de uma vez
    list[0].appendChild(fragment);
}

// ===============================
// FUNÇÕES AUXILIARES PARA VIEW
// ===============================

// Função para impressão otimizada
function optimizedPrint() {
    console.log('🖨️ Iniciando impressão otimizada...');
    
    // Aguardar todas as imagens carregarem antes de imprimir
    const images = document.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;
    
    // Função para verificar se todas as imagens carregaram
    function checkAllImagesLoaded() {
        loadedImages++;
        console.log(`📸 Imagem carregada: ${loadedImages}/${totalImages}`);
        
        if (loadedImages === totalImages) {
            console.log('✅ Todas as imagens carregadas, iniciando impressão...');
            setTimeout(() => {
                window.print();
            }, 200); // Pequeno delay para garantir renderização
        }
    }
    
    if (totalImages === 0) {
        console.log('📄 Nenhuma imagem encontrada, imprimindo diretamente...');
        window.print();
        return;
    }
    
    console.log(`📸 Aguardando carregamento de ${totalImages} imagens...`);
    
    images.forEach((img, index) => {
        if (img.complete && img.naturalHeight !== 0) {
            console.log(`✅ Imagem ${index + 1} já carregada`);
            checkAllImagesLoaded();
        } else {
            console.log(`⏳ Aguardando imagem ${index + 1}...`);
            img.addEventListener('load', checkAllImagesLoaded, { once: true });
            img.addEventListener('error', () => {
                console.log(`❌ Erro ao carregar imagem ${index + 1}, continuando...`);
                checkAllImagesLoaded();
            }, { once: true });
        }
    });
    
    // Timeout de segurança para evitar travamento
    setTimeout(() => {
        if (loadedImages < totalImages) {
            console.log('⚠️ Timeout de segurança atingido, imprimindo mesmo assim...');
            window.print();
        }
    }, 5000); // 5 segundos de timeout
}

// Função para limpar cache (útil para desenvolvimento)
function clearViewCache() {
    viewCache = {
        data: null,
        timestamp: 0
    };
    console.log('🗑️ Cache de visualização limpo');
}

// Função para verificar status do cache
function getCacheStatus() {
    const now = Date.now();
    const isValid = viewCache.data && (now - viewCache.timestamp) < VIEW_CACHE_TTL;
    
    return {
        hasData: !!viewCache.data,
        isValid: isValid,
        age: now - viewCache.timestamp,
        ttl: VIEW_CACHE_TTL,
        data: viewCache.data
    };
}

// Função para recarregar dados forçadamente
async function forceReloadProcedure() {
    const urlParams = new URLSearchParams(window.location.search);
    const procedureId = urlParams.get('id');
    
    if (!procedureId) {
        console.error('ID do procedimento não encontrado para reload');
        return;
    }
    
    // Limpar cache
    clearViewCache();
    
    // Recarregar
    await initializeViewPage(procedureId);
}

// Expor funções úteis globalmente para debugging
if (typeof window !== 'undefined') {
    window.clearViewCache = clearViewCache;
    window.getCacheStatus = getCacheStatus;
    window.forceReloadProcedure = forceReloadProcedure;
    window.optimizedPrint = optimizedPrint;
} 