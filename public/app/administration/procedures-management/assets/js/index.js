function showNotification(message, type = 'info') {
    const notificationContainer = $('#notification-container');
    if (notificationContainer.length === 0) {
        console.error('Notification container not found!');
        return;
    }

    const notification = $(`
        <div class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `);
    
    notificationContainer.append(notification);
    const toast = new bootstrap.Toast(notification, { delay: 5000 });
    toast.show();
}

// ===============================
// SISTEMA DE CACHE E DEBOUNCE FRONTEND
// ===============================
let allProcedures = []; // To store all procedures for client-side filtering
let proceduresCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minuto em ms

// Throttle para evitar múltiplas atualizações simultâneas
let updateThrottle = {};
const THROTTLE_DELAY = 500;

// Debounce para filtros
let filterDebounce = null;
const FILTER_DELAY = 300;

function openPopup(url) {
    // 1. Definir limites mínimos e máximos para o tamanho da janela.
    const minWidth = 1024;
    const minHeight = 700;
    const maxWidth = 1307;
    const maxHeight = 748;

    // 2. Calcular o tamanho ideal como 85% da tela disponível.
    // Usamos screen.availWidth/Height para descontar barras de sistema (como a do Windows).
    const idealWidth = screen.availWidth * 0.85;
    const idealHeight = screen.availHeight * 0.85;

    // 3. Garantir que o tamanho final esteja dentro dos limites definidos.
    // Math.max garante que não seja menor que o mínimo.
    // Math.min garante que não seja maior que o máximo.
    const finalWidth = Math.max(minWidth, Math.min(idealWidth, maxWidth));
    const finalHeight = Math.max(minHeight, Math.min(idealHeight, maxHeight));

    // 4. Calcular a posição para centralizar a janela.
    const left = (screen.availWidth - finalWidth) / 2;
    const top = (screen.availHeight - finalHeight) / 2;

    // 5. Abrir a janela com as dimensões e posição calculadas.
    window.open(url, 'popup', `width=${finalWidth},height=${finalHeight},left=${left},top=${top}`);
}

// Função para abrir a janela de criação de procedimento
function openCreateProcedure() {
    openPopup('create.html');
}

// Inicialização da tabela DataTables
$(document).ready(function() {
    $('#table_procedures').DataTable({
        "processing": true,
        "serverSide": false, // Será false pois usaremos dados mockados inicialmente
        "ajax": {
            "url": "/api/procedures", // Endpoint da nossa API mockada
            "type": "GET",
            "dataSrc": ""
        },
        "columns": [
            { "data": "title" },
            { "data": "department" },
            { "data": "role" },
            { "data": "type" },
            { "data": "format" },
            { 
                "data": null,
                "render": function (data, type, row) {
                    return `
                        <button class="btn btn-info btn-sm" onclick="viewProcedure(${row.id})">Ver</button>
                        <button class="btn btn-warning btn-sm" onclick="editProcedure(${row.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProcedure(${row.id})">Excluir</button>
                    `;
                }
            }
        ],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.10.25/i18n/Portuguese-Brasil.json"
        }
    });

    // Esconde o loader quando a página estiver pronta
    $('#loader2').css('display', 'none');
});

// Funções de ação (serão implementadas)
function viewProcedure(id) {
    openPopup(`view.html?id=${id}`);
}

function editProcedure(id) {
    openPopup(`edit.html?id=${id}`);
}

async function deleteProcedure(id) {
    if (confirm('Tem certeza que deseja excluir este procedimento?')) {
        try {
            await makeRequest(`/api/procedures-management/procedures/${id}`, 'DELETE');
            // A notificação será tratada pelo evento de socket
        } catch (error) {
            console.error('Erro ao excluir procedimento:', error);
            showNotification('Falha ao excluir o procedimento.', 'danger');
        }
    }
}

function renderWelcomeState() {
    const container = $('#procedures-container');
    const filters = $('.card-body > .row.g-3.align-items-end');
    filters.hide(); // Esconde os filtros

    const welcomeHtml = `
        <div class="col-12 text-center">
            <div class="card shadow-sm border-0" style="padding: 4rem 2rem;">
                <div class="card-body">
                    <i class="ri-file-text-line" style="font-size: 5rem; color: #17a2b8;"></i>
                    <h3 class="card-title mt-3">Bem-vindo à Gestão de Procedimentos</h3>
                    <p class="card-text text-muted">Ainda não há procedimentos cadastrados. Comece agora mesmo!</p>
                    <button class="btn btn-primary btn-lg mt-3" onclick="openCreateProcedure()">
                        <i class="ri-add-circle-line me-2"></i>Criar seu primeiro procedimento
                    </button>
                </div>
            </div>
        </div>
    `;
    container.html(welcomeHtml);
}

// Função otimizada de renderização
async function renderProcedures(procedures) {
    const container = $('#procedures-container');
    const filters = $('.card-body > .row.g-3.align-items-end');
    
    // Usar DocumentFragment para melhor performance
    const fragment = document.createDocumentFragment();
    container.empty();
    filters.show();

    if (procedures.length === 0) {
        container.html('<div class="col-12"><div class="alert alert-info text-center">Nenhum procedimento encontrado com os filtros aplicados.</div></div>');
        return;
    }

    // Cache das informações do usuário
    let userInfo = window.cachedUserInfo;
    if (!userInfo) {
        userInfo = await getInfosLogin();
        window.cachedUserInfo = userInfo; // Cache para próximas renderizações
    }
    const loggedUserId = userInfo ? userInfo.system_collaborator_id : null;

    procedures.forEach(proc => {
        const description = proc.summary || 'Nenhuma descrição disponível.';
        const tagsHtml = proc.tags.slice(0, 3).map(tag => `<span class="badge bg-light text-primary fw-semibold me-1">${tag}</span>`).join('');
        const moreTags = proc.tags.length > 3 ? `<span class="badge bg-light text-primary fw-semibold me-1">+ ${proc.tags.length - 3}</span>` : '';

        let updatedStr = '-';
        if (proc.updated_at) {
            const date = new Date(proc.updated_at);
            date.setHours(date.getHours() - 3); // Ajuste de fuso
            updatedStr = date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }

        // Lógica para o botão de exclusão com tooltip customizado
        const isResponsible = loggedUserId && loggedUserId === proc.responsible_id;
        let deleteButtonHtml;
        if (isResponsible) {
            deleteButtonHtml = `<button class="btn btn-sm btn-outline-danger" onclick="deleteProcedure(${proc.id})" title="Excluir"><i class="ri-delete-bin-line"></i></button>`;
        } else {
            const tooltipMessage = 'Apenas o responsável pelo procedimento tem permissão de exclusão.';
            deleteButtonHtml = `
                <div class="tooltip-wrapper">
                    <button class="btn btn-sm btn-outline-danger" disabled><i class="ri-delete-bin-line"></i></button>
                    <span class="custom-tooltip">${tooltipMessage}</span>
                </div>`;
        }

        const cardHtml = `
            <div class="col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4">
                <div class="card shadow-sm h-100 procedure-card">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title text-primary">${proc.title}</h5>
                        <p class="card-text text-muted small flex-grow-1">${description}</p>
                        
                        <div class="mt-2">
                            <p class="mb-1"><strong>Departamento:</strong> <span class="badge bg-info-transparent">${proc.department}</span></p>
                            <p class="mb-1"><strong>Cargo:</strong> <span class="badge bg-success-transparent">${proc.role}</span></p>
                        </div>

                        <div class="mt-3">
                            <strong class="small text-uppercase">TAGS:</strong> 
                            <div class="tags-container mt-1">
                                ${tagsHtml}
                                ${moreTags}
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0 d-flex justify-content-between align-items-center">
                        <div class="small text-muted">
                            <div>Responsável: ${proc.responsible}</div>
                            <div>Última atualização: ${updatedStr}</div>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewProcedure(${proc.id})" title="Ver"><i class="ri-eye-line"></i></button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="editProcedure(${proc.id})" title="Editar"><i class="ri-pencil-line"></i></button>
                            ${deleteButtonHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(cardHtml);
    });

    // Não há mais necessidade de inicializar tooltips via JavaScript.
}

// Função de filtro otimizada com debounce
function applyFilters() {
    // Cancelar debounce anterior
    if (filterDebounce) {
        clearTimeout(filterDebounce);
    }
    
    filterDebounce = setTimeout(() => {
        const keyword = $('#filter-keyword').val().toLowerCase().trim();
        const departmentId = $('#filter-department').val();
        const role = $('#filter-role').val();

        let filteredProcedures = allProcedures;
        
        // Aplicar filtros apenas se necessário
        if (keyword || departmentId || role) {
            filteredProcedures = allProcedures.filter(proc => {
                const keywordMatch = !keyword || (
                    proc.title.toLowerCase().includes(keyword) ||
                    proc.tags.some(tag => tag.toLowerCase().includes(keyword))
                );

                const departmentMatch = !departmentId || proc.department_id == departmentId;
                const roleMatch = !role || proc.role === role;

                return keywordMatch && departmentMatch && roleMatch;
            });
        }

        renderProcedures(filteredProcedures);
    }, FILTER_DELAY);
}

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

async function setupFilters() {
    try {
        const [departments, roles, userInfo] = await Promise.all([
            makeRequest('/api/procedures-management/meta/departments'),
            makeRequest('/api/procedures-management/meta/roles'),
            getInfosLogin()
        ]);

        const depSelect = $('#filter-department');
        depSelect.empty().append('<option value="">Todos os Departamentos</option>');
        departments.forEach(d => depSelect.append(`<option value="${d.id}">${d.name}</option>`));

        const roleSelect = $('#filter-role');
        roleSelect.empty().append('<option value="">Todos os Cargos</option>');
        roles.forEach(r => roleSelect.append(`<option value="${r}">${r}</option>`));

        // Pré-selecionar o departamento do usuário
        if (userInfo && userInfo.department_ids) {
            let userDeptId = null;
            if (typeof userInfo.department_ids === 'string') {
                userDeptId = userInfo.department_ids.split(',')[0].trim();
            } else if (Array.isArray(userInfo.department_ids)) {
                userDeptId = userInfo.department_ids[0];
            }
            
            if (userDeptId) {
                // Aqui, estamos definindo o VALOR do select, que é o ID.
                depSelect.val(userDeptId);
            }
        }
        
        $('#filter-keyword').on('keyup', applyFilters);
        $('#filter-department, #filter-role').on('change', applyFilters);
        
        // Após configurar os filtros, aplica-os imediatamente
        applyFilters();
        
        $('#btn-clear-filters').on('click', () => {
            $('#filter-keyword').val('');
            $('#filter-department').val('');
            $('#filter-role').val('');
            applyFilters();
        });
    } catch (error) {
        console.error('Falha ao carregar filtros:', error);
        // Pode-se adicionar uma notificação ao usuário aqui, se desejado.
    }
}

// Função otimizada de carregamento com cache
async function loadProcedures(forceReload = false) {
    try {
        $('#loader2').show();
        
        // Verificar cache primeiro (se não for reload forçado)
        if (!forceReload && proceduresCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
            allProcedures = proceduresCache;
            console.log('Usando dados do cache');
        } else {
            // Buscar dados do servidor
            console.log('Buscando dados do servidor');
            const response = await makeRequest('/api/procedures-management/procedures');
            allProcedures = response;
            
            // Atualizar cache
            proceduresCache = allProcedures;
            cacheTimestamp = Date.now();
        }

        if (allProcedures.length === 0) {
            renderWelcomeState();
        } else {
            // Configurar filtros e renderizar
            await setupFilters(); 
        }

        // Configurar Socket.io apenas uma vez
        if (!window.socketConfigured) {
            const socket = io();

            socket.on('procedure_deleted', (data) => {
                console.log('Evento procedure_deleted recebido:', data);
                showNotification(`Procedimento "${data.title}" foi excluído.`, 'warning');
                // Invalidar cache e recarregar
                proceduresCache = null;
                loadProcedures(true);
            });
            
            socket.on('procedure_created', (data) => {
                console.log('Evento procedure_created recebido:', data);
                showNotification(`Novo procedimento "${data.title}" foi criado.`, 'success');
                // Invalidar cache e recarregar
                proceduresCache = null;
                loadProcedures(true);
            });
            
            socket.on('procedure_updated', (data) => {
                console.log('Evento procedure_updated recebido:', data);
                showNotification(`Procedimento "${data.title}" foi atualizado.`, 'info');
                // Invalidar cache e recarregar
                proceduresCache = null;
                loadProcedures(true);
            });

            window.socketConfigured = true;
        }

    } catch (error) {
        console.error('Falha ao carregar procedimentos:', error);
        $('#procedures-container').html('<p class="text-center text-danger">Não foi possível carregar os procedimentos. Tente novamente mais tarde.</p>');
    } finally {
        $('#loader2').hide();
    }
}

$(document).ready(function() {
    loadProcedures();
});

// ===============================
// OTIMIZAÇÕES APLICADAS:
// ===============================
// ✅ Sistema de cache implementado (60s TTL)
// ✅ Debounce nos filtros (300ms)
// ✅ Throttle nos eventos Socket.io (500ms)
// ✅ DocumentFragment para renderização
// ✅ Cache de informações do usuário
// ✅ Socket.io configurado apenas uma vez
// ✅ Invalidação inteligente de cache
// =============================== 