function showGlobalNotification(message, type = 'success') {
    const container = $('.card-body').first();
    const alertId = `global-alert-${Date.now()}`;
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert" style="position: absolute; top: 80px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Anexa a notificação ao container principal do card
    container.prepend(alertHtml);

    // Remove o alerta após 5 segundos
    setTimeout(() => {
        $(`#${alertId}`).fadeOut('slow', function() { $(this).remove(); });
    }, 5000);
}

let allProcedures = []; // To store all procedures for client-side filtering

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
            showGlobalNotification('Procedimento excluído com sucesso.', 'success');
            loadProcedures(); // Recarrega a lista
        } catch (error) {
            console.error('Erro ao excluir procedimento:', error);
            showGlobalNotification('Falha ao excluir o procedimento.', 'danger');
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

function renderProcedures(procedures) {
    const container = $('#procedures-container');
    const filters = $('.card-body > .row.g-3.align-items-end');
    container.empty();
    filters.show(); // Garante que os filtros estejam visíveis

    if (procedures.length === 0) {
        container.html('<div class="col-12"><div class="alert alert-info text-center">Nenhum procedimento encontrado com os filtros aplicados.</div></div>');
        return;
    }

    procedures.forEach(proc => {
        // Usa o campo 'summary' para a descrição do card.
        const description = proc.summary || 'Nenhuma descrição disponível.';

        const tagsHtml = proc.tags.slice(0, 3).map(tag => `<span class="badge bg-light text-primary fw-semibold me-1">${tag}</span>`).join('');
        const moreTags = proc.tags.length > 3 ? `<span class="badge bg-light text-primary fw-semibold me-1">+ ${proc.tags.length - 3}</span>` : '';

        // Ajuste: pega a data da última versão se disponível
        let updatedStr = '-';
        if (proc.versions && proc.versions.length > 0) {
            const lastVersion = proc.versions.reduce((a, b) => (a.version_number > b.version_number ? a : b));
            if (lastVersion.created_at) {
                const date = new Date(lastVersion.created_at);
                date.setHours(date.getHours() - 3);
                updatedStr = date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
        } else if (proc.updated_at) {
            // fallback para updated_at se não houver versões
            const date = new Date(proc.updated_at);
            date.setHours(date.getHours() - 3);
            updatedStr = date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteProcedure(${proc.id})" title="Excluir"><i class="ri-delete-bin-line"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(cardHtml);
    });
}

function applyFilters() {
    const keyword = $('#filter-keyword').val().toLowerCase();
    const department = $('#filter-department').val();
    const role = $('#filter-role').val();

    let filteredProcedures = allProcedures.filter(proc => {
        const keywordMatch = keyword === '' ||
            proc.title.toLowerCase().includes(keyword) ||
            proc.tags.some(tag => tag.toLowerCase().includes(keyword));

        const departmentMatch = department === '' || proc.department === department;
        const roleMatch = role === '' || proc.role === role;

        return keywordMatch && departmentMatch && roleMatch;
    });

    renderProcedures(filteredProcedures);
}

async function setupFilters() {
    try {
        const [departments, roles] = await Promise.all([
            makeRequest('/api/procedures-management/meta/departments'),
            makeRequest('/api/procedures-management/meta/roles')
        ]);

        const depSelect = $('#filter-department');
        depSelect.empty().append('<option value="">Todos os Departamentos</option>');
        departments.forEach(d => depSelect.append(`<option value="${d.name}">${d.name}</option>`));

        const roleSelect = $('#filter-role');
        roleSelect.empty().append('<option value="">Todos os Cargos</option>');
        roles.forEach(r => roleSelect.append(`<option value="${r}">${r}</option>`));

        $('#filter-keyword').on('keyup', applyFilters);
        $('#filter-department, #filter-role').on('change', applyFilters);
        
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

async function loadProcedures() {
    try {
        $('#loader2').show();
        const response = await makeRequest('/api/procedures-management/procedures');
        allProcedures = await response;

        if (allProcedures.length === 0) {
            renderWelcomeState();
        } else {
            renderProcedures(allProcedures);
            setupFilters(); // Chamará a nova função assíncrona
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

// --- Atualização em tempo real via socket.io ---
// Certifique-se de que o socket.io está incluído no HTML:
// <script src="/socket.io/socket.io.js"></script>
const socket = io();
socket.on('updateProcedures', async (data) => {
    if (data.action === 'delete') {
        allProcedures = allProcedures.filter(p => p.id != data.id);
        renderProcedures(allProcedures);
    } else if (data.action === 'update' || data.action === 'create') {
        try {
            const proc = await makeRequest(`/api/procedures-management/procedures/${data.id}`);
            const idx = allProcedures.findIndex(p => p.id == data.id);
            if (idx >= 0) {
                allProcedures[idx] = proc;
            } else {
                allProcedures.push(proc);
            }
            renderProcedures(allProcedures);
        } catch (e) {
            // Se não encontrar, remove da lista (caso tenha sido deletado)
            allProcedures = allProcedures.filter(p => p.id != data.id);
            renderProcedures(allProcedures);
        }
    }
}); 