/**
 * PDI Hub - Script para a página do colaborador
 */

// Variável global para o PDI atual nesta aba
let currentPdiId = null;

// Conexão com o Socket.IO
const socket = io();

// Esperar o documento carregar
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos
    setupEventListeners();
    loadCollaboratorPDI();

    // Escutar o evento de atualização do PDI
    socket.on('pdi:updated', (data) => {
        if (data.pdiId && String(data.pdiId) === String(currentPdiId)) {
            loadPDIDetails(data.pdiId);
        }
    });
});

// Configurar os listeners de eventos
function setupEventListeners() {
    // Botão para salvar o status da ação
    document.getElementById('btnSaveActionStatus').addEventListener('click', saveActionStatus);
    
    // Quando o status da ação mudar para "Concluído", mostrar o campo de data de conclusão
    document.getElementById('actionStatus').addEventListener('change', function() {
        const completionDateSection = document.getElementById('completionDateSection');
        if (this.value === 'Concluído') {
            completionDateSection.classList.remove('d-none');
            
            // Definir a data atual como valor padrão
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            document.getElementById('completionDate').value = `${year}-${month}-${day}`;
        } else {
            completionDateSection.classList.add('d-none');
        }
    });
}

// Carregar o PDI do colaborador
async function loadCollaboratorPDI() {
    try {
        showLoader();
        // Obter dados da URL
        const urlParams = new URLSearchParams(window.location.search);
        let collaboratorId = urlParams.get('id_collaborator');
        let pdiId = urlParams.get('pdi_id');
        // Verificar se estamos acessando diretamente a página (sem parâmetros)
        const isDirectAccess = !collaboratorId && !pdiId;
        if (isDirectAccess) {
            // Obter informações do usuário logado
            const userLogged = await getInfosLogin();
            if (userLogged && userLogged.system_collaborator_id) {
                collaboratorId = userLogged.system_collaborator_id;
            } else {
                // Tentar obter da sessão
                try {
                    const sessionResponse = await fetch('/api/session/getSession');
                    const sessionData = await sessionResponse.json();
                    if (sessionData.success && sessionData.data && sessionData.data.user && sessionData.data.user.collaborator_id) {
                        collaboratorId = sessionData.data.user.collaborator_id;
                    }
                } catch (error) {
                    console.error('Erro ao obter usuário da sessão:', error);
                }
            }
        }
        // Se ainda não encontrou, mostrar erro
        if (!collaboratorId && !pdiId) {
            hideLoader();
            showErrorAlert('ID do colaborador ou do PDI não informado. Por favor, acesse através da página principal do PDI Hub.');
            return;
        }
        // Se temos o ID do PDI diretamente, carregamos direto
        if (pdiId) {
            currentPdiId = pdiId;
            await loadPDIDetails(pdiId);
            return;
        }
        // Caso contrário, buscamos o PDI mais recente do colaborador
        const response = await fetch(`/api/pdi-hub/getPDIsByCollaborator?collaborator_id=${collaboratorId}`);
        const result = await response.json();
        hideLoader();
        if (!result.success || !result.data || result.data.length === 0) {
            // Esconder conteúdo principal
            document.querySelector('.main-content').style.display = 'none';
            // Exibir mensagem amigável
            let msg = document.getElementById('noPDIMessage');
            if (!msg) {
                msg = document.createElement('div');
                msg.id = 'noPDIMessage';
                msg.className = 'alert alert-info text-center';
                msg.style.position = 'fixed';
                msg.style.top = '50%';
                msg.style.left = '50%';
                msg.style.transform = 'translate(-50%, -50%)';
                msg.style.zIndex = '9999';
                msg.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';
                msg.style.fontSize = '1.2rem';
                msg.innerHTML = '<h4 class="mb-2">Ainda não existe um PDI cadastrado para você.</h4><p>Procure seu gestor para iniciar seu desenvolvimento!</p>';
                document.body.appendChild(msg);
            } else {
                msg.style.display = 'block';
            }
            return;
        }
        // Pegar o PDI mais recente (assume que está ordenado por data de criação decrescente)
        const mostRecentPDI = result.data[0];
        currentPdiId = mostRecentPDI.id;
        // Carregar os detalhes do PDI
        await loadPDIDetails(mostRecentPDI.id);
    } catch (error) {
        console.error('Erro ao carregar PDI do colaborador:', error);
        hideLoader();
        showErrorAlert('Não foi possível carregar o PDI. Por favor, tente novamente.');
    }
}

// Carregar os detalhes do PDI
async function loadPDIDetails(pdiId) {
    try {
        console.log('Carregando detalhes do PDI:', pdiId);
        showLoader();
        
        const response = await fetch('/api/pdi-hub/getPDIView', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: pdiId })
        });
        
        const result = await response.json();
        console.log('Resposta da API getPDIView:', result);
        
        hideLoader();
        
        if (!result.success || !result.data) {
            showErrorAlert('Não foi possível carregar os detalhes do PDI.');
            return;
        }
        
        const pdi = result.data;
        console.log('Detalhes do PDI carregados:', pdi);
        console.log('Status do PDI:', pdi.status);
        console.log('Ações do PDI:', pdi.actions);
        
        // Preencher os dados do perfil
        document.getElementById('collaboratorName').textContent = pdi.collaborator_name || 'Nome não informado';
        document.getElementById('jobPosition').textContent = pdi.job_position || 'Cargo não informado';
        document.getElementById('supervisorName').textContent = pdi.supervisor_name || 'Não informado';
        
        // Verificar se o usuário atual é o supervisor deste PDI
        await checkIfCurrentUserIsSupervisor(pdi);
        
        // Configurar o tipo de perfil e imagem
        const profileType = pdi.profile_type || 'Não definido';
        document.getElementById('profileType').textContent = profileType;
        setupProfileType(profileType);
        
        // Configurar nível de desempenho
        const performanceLevel = pdi.performance_level || 'Na Rota';
        document.getElementById('performanceLevel').textContent = performanceLevel;
        setupPerformanceLevel(performanceLevel);
        
        // Verificar e definir o avatar do colaborador
        if (pdi.collaborator_avatar) {
            document.getElementById('collaboratorAvatar').src = pdi.collaborator_avatar;
        } else {
            document.getElementById('collaboratorAvatar').src = '../../assets/images/brand-logos/toggle-logo.png';
        }
        
        // Preencher os dados do PDI
        document.getElementById('academicSummary').textContent = pdi.academic_summary || 'Não informado';
        document.getElementById('whoAreYou').textContent = pdi.who_are_you || 'Não informado';
        document.getElementById('strengths').textContent = pdi.strengths || 'Não informado';
        document.getElementById('improvementPoints').textContent = pdi.improvement_points || 'Não informado';
        document.getElementById('developmentGoals').textContent = pdi.development_goals || 'Não informado';
        
        // Atualizar o status exibido
        updatePDIStatusDisplay(pdi.status);
        
        // Renderizar a lista de ações
        renderActionsList(pdi.actions, pdi.id);
        
        // Calcular e exibir os indicadores
        if (pdi.actions && pdi.actions.length > 0) {
            const indicators = calculateIndicators(pdi.actions);
            updateActionIndicators(indicators);
            
            // Verificar se há ações atrasadas (prazo vencido e não concluídas)
            const now = new Date();
            const hasLateActions = pdi.actions.some(action => 
                new Date(action.deadline) < now && action.status !== 'Concluído'
            );
            
            // Verificar se há ações em andamento para mostrar o indicador visual no status
            const hasActionsInProgress = indicators.inProgressActions > 0;
            const statusElement = document.getElementById('pdiStatus');
            
            if (statusElement) {
                if (pdi.status === 'Ativo' && hasLateActions) {
                    // Mostrar status como "Atrasado"
                    statusElement.innerHTML = `
                        <i class="ri-alarm-warning-line me-1"></i>
                        Status: <span class="fw-semibold">Atrasado</span>
                    `;
                    statusElement.className = `badge bg-danger`;
                    console.log('Status atualizado para "Atrasado"');
                } else if (pdi.status === 'Ativo' && hasActionsInProgress) {
                    // Mostrar status como "Em Andamento"
                    statusElement.innerHTML = `
                        <i class="ri-checkbox-multiple-line me-1"></i>
                        Status: <span class="fw-semibold">Em Andamento</span>
                    `;
                    statusElement.className = `badge bg-info`;
                    console.log('Status atualizado para "Em Andamento"');
                }
            }
        }
        
        // Carregar histórico de avaliações para todos os usuários
        await loadEvaluationHistory(pdi.id);
        
        // Mostrar ou esconder o botão Adicionar Ação conforme permissão
        const btnAddAction = document.getElementById('btnAddAction');
        if (btnAddAction) {
            if (window.isSupervisorPDI) {
                btnAddAction.classList.remove('d-none');
            } else {
                btnAddAction.classList.add('d-none');
            }
            // Adiciona o listener apenas uma vez
            if (!btnAddAction._listenerAdded) {
                btnAddAction.addEventListener('click', function() {
                    addNewAction();
                });
                btnAddAction._listenerAdded = true;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes do PDI:', error);
        hideLoader();
        showErrorAlert('Não foi possível carregar os detalhes do PDI. Por favor, tente novamente.');
    }
}

// Calcular indicadores a partir das ações
function calculateIndicators(actions) {
    if (!actions || !actions.length) return null;
    
    const total = actions.length;
    const completed = actions.filter(a => a.status === 'Concluído').length;
    const inProgress = actions.filter(a => a.status === 'Em Andamento').length;
    const pending = actions.filter(a => a.status === 'Pendente').length;
    
    return {
        totalActions: total,
        completedActions: completed,
        inProgressActions: inProgress,
        pendingActions: pending,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        progressPercentage: total > 0 ? Math.round(((completed + (inProgress * 0.5)) / total) * 100) : 0
    };
}

// Verificar se o usuário atual é o supervisor do PDI
async function checkIfCurrentUserIsSupervisor(pdi) {
    try {
        // Obter informações do usuário logado
        const userLogged = await getInfosLogin();
        if (!userLogged || !userLogged.system_collaborator_id) {
            console.log('Não foi possível identificar o usuário logado para verificação de supervisor');
            window.isSupervisorPDI = false;
            window.isColaboradorPDI = false;
            return false;
        }

        // Converter para números para garantir comparação correta
        const supervisorId = parseInt(pdi.supervisor_id);
        const loggedUserId = parseInt(userLogged.system_collaborator_id);
        const collaboratorId = parseInt(pdi.collaborator_id);
        
        // Flags globais
        window.isSupervisorPDI = supervisorId === loggedUserId;
        window.isColaboradorPDI = collaboratorId === loggedUserId;
        console.log('Usuário é supervisor?', window.isSupervisorPDI);
        console.log('Usuário é colaborador do PDI?', window.isColaboradorPDI);
        
        // Se o usuário for o supervisor, mostrar o histórico de avaliações e o botão
        if (window.isSupervisorPDI) {
            console.log('Exibindo seção de avaliações para o supervisor');
            
            // Exibir a seção de histórico de avaliações
            const evaluationHistorySection = document.getElementById('evaluationHistorySection');
            if (evaluationHistorySection) {
                evaluationHistorySection.classList.remove('d-none');
            }
            
            // Adicionar evento ao botão de nova avaliação
            const btnOpenEvaluation = document.getElementById('btnOpenEvaluation');
            if (btnOpenEvaluation) {
                btnOpenEvaluation.addEventListener('click', () => openEvaluationWindow(pdi));
            }
            
            // Carregar histórico de avaliações
            await loadEvaluationHistory(pdi.id);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Erro ao verificar se o usuário é supervisor:', error);
        window.isSupervisorPDI = false;
        window.isColaboradorPDI = false;
        return false;
    }
}

// Abrir janela de avaliação em uma nova aba
function openEvaluationWindow(pdi) {
    // Criar URL com parâmetros necessários
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() retorna 0-11
    const currentYear = currentDate.getFullYear();
    
    const url = `evaluation.html?pdi_id=${pdi.id}&collaborator_name=${encodeURIComponent(pdi.collaborator_name)}&month=${currentMonth}&year=${currentYear}`;
    window.open(url, '_blank', 'width=800,height=800,resizable=yes,scrollbars=yes');
}

// No modal de avaliação (que será uma página separada agora)
function initializeEvaluation(pdi) {
    // Será movido para a página evaluation.html
}

// Carregar histórico de avaliações
async function loadEvaluationHistory(pdiId) {
    try {
        showLoader();
        // Buscar histórico de avaliações
        const response = await fetch(`/api/pdi-hub/getEvaluationHistory?pdi_id=${pdiId}`);
        const result = await response.json();
        hideLoader();
        const historyList = document.getElementById('evaluationHistoryList');
        historyList.innerHTML = '';
        const noEvaluations = document.getElementById('noEvaluations');
        if (result.success && result.data && result.data.length > 0) {
            noEvaluations.classList.add('d-none');
            // Renderizar cada avaliação no histórico (sem coluna de nível)
            console.log('result.data', result.data);
            result.data.forEach(evaluation => {
                const row = document.createElement('tr');
                const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                const monthName = monthNames[evaluation.month - 1];
                const period = `${monthName}/${evaluation.year}`;
                const average = (typeof evaluation.media === 'number') ? evaluation.media.toFixed(2) : 'N/A';
                let badgeClass = 'bg-secondary';
                // Truncar observações muito longas
                const comments = evaluation.comments || 'Sem observações';
                const truncatedComments = comments.length > 50 
                    ? comments.substring(0, 50) + '...' 
                    : comments;
                row.innerHTML = `
                    <td>${period}</td>
                    <td><span class="badge ${badgeClass}">${average}</span></td>
                    <td>${truncatedComments}</td>
                    <td>${formatDate(evaluation.created_at)}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline-primary" 
                                onclick="openEditEvaluationWindow(${pdiId}, ${evaluation.month}, ${evaluation.year}, '${encodeURIComponent(document.getElementById('collaboratorName').textContent)}')">
                            <i class="ri-edit-line"></i>
                        </button>
                    </td>
                `;
                historyList.appendChild(row);
            });
        } else {
            noEvaluations.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Erro ao carregar histórico de avaliações:', error);
        hideLoader();
        showErrorAlert('Não foi possível carregar o histórico de avaliações.');
    }
}

// Função para abrir janela de edição de avaliação
function openEditEvaluationWindow(pdiId, month, year, collaboratorName) {
    const url = `evaluation.html?pdi_id=${pdiId}&collaborator_name=${collaboratorName}&month=${month}&year=${year}&edit=true`;
    window.open(url, '_blank', 'width=800,height=800,resizable=yes,scrollbars=yes');
}

// Configurar a exibição do tipo de perfil
function setupProfileType(profileType) {
    // Limpar o conteúdo anterior
    const profileImage = document.getElementById('profileImage');
    profileImage.innerHTML = '';
    
    // Definir o nome do tipo de perfil
    const profileTypeName = document.getElementById('profileTypeName');
    profileTypeName.textContent = getProfileTypeName(profileType);
    
    // Adicionar a imagem do perfil
    const img = document.createElement('img');
    img.src = `./assets/img/${profileType.toLowerCase()}-1.png`;
    img.alt = profileTypeName.textContent;
    img.className = 'img-fluid';
    img.style.maxHeight = '200px';
    profileImage.appendChild(img);
    
    // Definir a descrição do perfil
    const profileDescription = document.getElementById('profileDescription');
    profileDescription.textContent = getProfileDescription(profileType);
}

// Obter o nome formatado do tipo de perfil
function getProfileTypeName(profileType) {
    const types = {
        'EXECUTOR': 'Executor',
        'COMUNICADOR': 'Comunicador',
        'PLANEJADOR': 'Planejador',
        'ANALISTA': 'Analista'
    };
    
    return types[profileType] || profileType;
}

// Obter a descrição do tipo de perfil
function getProfileDescription(profileType) {
    const descriptions = {
        'EXECUTOR': 'Pessoa ativa, competitiva, otimista e dinâmica. Gosta de desafios, liderança e assumir riscos.',
        'COMUNICADOR': 'Pessoa extrovertida, falante, adaptável e ativa. Gosta de falta de rotina, autonomia e trabalho em equipe.',
        'PLANEJADOR': 'Pessoa calma, prudente e com autocontrole. Gosta de rotina, planejamento e ajudar os outros.',
        'ANALISTA': 'Pessoa detalhista, precisa, cautelosa e crítica. Gosta de perfeição, métodos e ambientes calmos.'
    };
    
    return descriptions[profileType] || 'Descrição não disponível';
}

// Configurar a exibição do nível de desempenho
function setupPerformanceLevel(level) {
    // Ícones padrão para cada nível
    const levelIcons = {
        'Estacionado': 'estacionado.png',
        'Ajustando a Rota': 'ajustando-rota.png',
        'Na Rota': 'na-rota.png',
        'Brilhou na Entrega': 'brilhou-na-entrega.png',
        'Voando Alto': 'voando-alto.png'
    };
    // Se vier objeto, extrair dados
    let levelName = level, color = null, icon = null;
    if (level && typeof level === 'object') {
        levelName = level.name;
        color = level.color;
        icon = level.icon;
    }
    // Se não houver avaliação, padrão é 'Na Rota'
    if (!levelName) {
        levelName = 'Na Rota';
    }
    // Se não houver ícone, usa o padrão do nível
    if (!icon && levelIcons[levelName]) {
        icon = levelIcons[levelName];
    }
    // Destacar o ícone correspondente
    const items = document.querySelectorAll('.rating-item');
    items.forEach(item => {
        item.classList.remove('active');
        const img = item.querySelector('img');
        if (img) {
            img.style.opacity = '0.7';
            img.style.filter = 'grayscale(0.4)';
        }
        if (item.getAttribute('data-level') === levelName) {
            item.classList.add('active');
            if (img) {
                img.style.opacity = '1';
                img.style.filter = 'grayscale(0) saturate(1.3) brightness(1.05)';
            }
        }
    });
    // Configurar a cor do badge
    const performanceBadge = document.getElementById('performanceBadge');
    const progressBar = document.getElementById('performanceProgressBar');
    // Definir a cor e o progresso de acordo com o nível
    let badgeClass, progressWidth, progressColor;
    switch(levelName) {
        case 'Estacionado':
            badgeClass = 'bg-danger';
            progressWidth = '20%';
            progressColor = color || 'var(--level-1-color)';
            break;
        case 'Ajustando a Rota':
            badgeClass = 'bg-warning';
            progressWidth = '40%';
            progressColor = color || 'var(--level-2-color)';
            break;
        case 'Na Rota':
            badgeClass = 'bg-success';
            progressWidth = '60%';
            progressColor = color || 'var(--level-3-color)';
            break;
        case 'Brilhou na Entrega':
            badgeClass = 'bg-info';
            progressWidth = '80%';
            progressColor = color || 'var(--level-4-color)';
            break;
        case 'Voando Alto':
            badgeClass = 'bg-primary';
            progressWidth = '100%';
            progressColor = color || 'var(--level-5-color)';
            break;
        default:
            badgeClass = 'bg-secondary';
            progressWidth = '60%';
            progressColor = color || 'var(--level-3-color)';
    }
    // Aplicar as classes e estilos
    performanceBadge.className = `badge ${badgeClass}`;
    // Exibir nome e ícone se houver
    performanceBadge.innerHTML = `${icon ? `<img src='./assets/img/${icon}' style='height:18px;vertical-align:middle;margin-right:4px;'>` : ''}Desempenho: <span id='performanceLevel' class='fw-semibold'>${levelName}</span>`;
    progressBar.style.width = progressWidth;
    progressBar.style.backgroundColor = progressColor;
}

// Função auxiliar para escapar strings HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Renderizar lista de ações na tabela
function renderActionsList(actions, pdiId) {
    const actionsListElement = document.getElementById('actionsList');
    if (!actionsListElement) return;
    
    actionsListElement.innerHTML = '';
    
    if (!actions || actions.length === 0) {
        const noActionsElement = document.getElementById('noActions');
        if (noActionsElement) {
            noActionsElement.classList.remove('d-none');
        }
        return;
    }
    
    const noActionsElement = document.getElementById('noActions');
    if (noActionsElement) {
        noActionsElement.classList.add('d-none');
    }
    
    actions.forEach(action => {
        const statusClass = getStatusClass(action.status);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${escapeHtml(action.description)}</td>
            <td>${formatDate(action.deadline)}</td>
            <td><span class="badge ${statusClass}">${escapeHtml(action.status)}</span></td>
            <td>${action.completion_date ? formatDate(action.completion_date) : '-'}</td>
            <td>
                <button type="button" 
                        class="btn btn-primary btn-icon btn-sm btn-edit-action" 
                        data-action-id="${action.id}"
                        data-pdi-id="${pdiId}"
                        data-description="${escapeHtml(action.description)}"
                        data-deadline="${action.deadline || ''}"
                        data-status="${action.status || 'Pendente'}">
                    <i class="ri-edit-line"></i>
                </button>
                ${window.isSupervisorPDI ? `<button type="button" class="btn btn-danger btn-icon btn-sm" onclick="confirmRemoveAction(${action.id}, ${pdiId})"><i class="ri-delete-bin-5-line"></i></button>` : ''}
            </td>
        `;
        actionsListElement.appendChild(row);
    });
    
    // Adicionar event listeners para os botões de edição
    document.querySelectorAll('.btn-edit-action').forEach(btn => {
        btn.addEventListener('click', function() {
            const actionId = this.getAttribute('data-action-id');
            const pdiId = this.getAttribute('data-pdi-id');
            const description = this.getAttribute('data-description');
            const deadline = this.getAttribute('data-deadline');
            const status = this.getAttribute('data-status');
            openUpdateActionModalWithFetch(actionId, pdiId, description, deadline, status);
        });
    });
}

// Registrar o plugin de download do FilePond
if (typeof FilePondPluginGetFile !== 'undefined') {
    FilePond.registerPlugin(FilePondPluginGetFile);
}

// Forçar download ao clicar no ícone de download do FilePond
// (agora usando .filepond--download-icon conforme o HTML gerado pelo plugin)
document.addEventListener('click', function(e) {
    const downloadIcon = e.target.closest('.filepond--download-icon');
    if (downloadIcon) {
        e.preventDefault();
        e.stopPropagation();

        // Descobrir o nome do arquivo exibido ao lado do ícone
        const fileInfoMain = downloadIcon.parentElement.querySelector('.filepond--file-info-main');
        if (!fileInfoMain) return;

        const filename = fileInfoMain.textContent.trim();

        // Encontrar o objeto FilePond correspondente
        const pondFiles = window.filepondInstance ? window.filepondInstance.getFiles() : [];
        const fileObj = pondFiles.find(f => f.filename === filename || (f.file && f.file.name === filename));
        let url = null;
        if (fileObj && fileObj.source) {
            url = fileObj.source;
        } else if (fileObj && fileObj.file) {
            url = URL.createObjectURL(fileObj.file);
        }
        if (!url) return;

        // Forçar download
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Se for URL temporária, liberar depois
        if (fileObj && fileObj.file) {
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        return false;
    }
}, true);

function setupFilePondForAction(actionId, existingFiles = []) {
    // Remover instância anterior se existir
    if (window.filepondInstance) {
        try { 
            window.filepondInstance.destroy(); 
        } catch(e) {
            console.error('Erro ao destruir instância FilePond existente:', e);
        }
        window.filepondInstance = null;
    }
    
    const input = document.getElementById('actionAttachment');
    if (!input) {
        console.error('Elemento de input para FilePond não encontrado');
        return;
    }

    // Guardar a lista original de anexos ao abrir o modal
    const normalizedFiles = (existingFiles || []).map(f => {
        if (typeof f === 'string') return f;
        if (f && f.name) return f.name;
        return String(f);
    });
    
    window._originalAttachments = [...normalizedFiles];
    console.log('Configurando FilePond com anexos existentes:', window._originalAttachments);

    // Mapear os arquivos existentes para o formato que o FilePond espera
    const formattedFiles = normalizedFiles.map(filename => {
        console.log('Configurando arquivo existente:', filename);
        // Criar URL completa para o arquivo
        const fileUrl = `/uploads/pdi-hub/attachment_actions/${filename}`;
        
        return {
            source: fileUrl,
            options: {
                type: 'local',
                file: {
                    name: filename,
                    size: 1234, // tamanho fictício
                    type: 'application/octet-stream'
                },
                metadata: {
                    filename: filename,
                    posterUrl: fileUrl
                }
            }
        };
    });
    
    console.log('FilePond será inicializado com arquivos:', formattedFiles);

    // Configurações do FilePond
    const pondOptions = {
        allowMultiple: true,
        allowDownloadByUrl: true,
        labelButtonDownloadItem: 'Baixar',
        instantUpload: false, // Upload manual
        files: formattedFiles, // Usar os arquivos formatados
        labelIdle: 'Arraste ou <span class="filepond--label-action">clique para anexar</span> (múltiplos arquivos)',
        // Adicionar metadados aos arquivos para facilitar identificação depois
        onaddfile: (error, file) => {
            if (error) {
                console.error('Erro ao adicionar arquivo ao FilePond:', error);
                return;
            }
            
            // Adicionar metadados que ajudarão a identificar arquivos existentes vs. novos
            if (file && formattedFiles.some(f => f.options.file.name === file.filename)) {
                file.setMetadata('isExistingFile', true);
                file.setMetadata('serverFilename', file.filename);
                console.log('Arquivo existente identificado e marcado:', file.filename);
            } else {
                file.setMetadata('isExistingFile', false);
                console.log('Novo arquivo adicionado:', file.filename || (file.file ? file.file.name : 'desconhecido'));
            }
        }
    };

    // Inicializar FilePond
    window.filepondInstance = FilePond.create(input, pondOptions);

    // Após inicializar o FilePond, adicionar o botão de visualização (olho) em cada item
    window.filepondInstance.on('addfile', (e) => {
        setTimeout(() => {
            const fileItems = document.querySelectorAll('.filepond--item');
            fileItems.forEach(item => {
                // Evitar duplicidade
                if (item.querySelector('.filepond--view-icon')) return;
                const infoMain = item.querySelector('.filepond--file-info-main');
                if (infoMain) {
                    const viewIcon = document.createElement('span');
                    viewIcon.className = 'filepond--view-icon';
                    viewIcon.title = 'Visualizar anexo';
                    viewIcon.style.cursor = 'pointer';
                    viewIcon.innerHTML = '<i class="ri-eye-line"></i>';
                    infoMain.parentNode.insertBefore(viewIcon, infoMain);
                }
            });
        }, 100);
    });
    
    // Monitorar remoção de arquivos para debugging
    window.filepondInstance.on('removefile', (error, file) => {
        if (error) {
            console.error('Erro ao remover arquivo do FilePond:', error);
            return;
        }
        
        console.log('Arquivo removido do FilePond:', file.filename || (file.file ? file.file.name : 'desconhecido'));
        console.log('Atributos do arquivo removido:', file);
    });
    
    // Verificar se os arquivos foram corretamente adicionados após inicialização
    setTimeout(() => {
        const files = window.filepondInstance.getFiles();
        console.log('FilePond arquivos após inicialização:', files);
        files.forEach(file => {
            console.log('Arquivo carregado:', {
                filename: file.filename,
                origem: file.origin,
                source: file.source,
                metadata: file.getMetadata()
            });
        });
    }, 500);
}

// Remover anexos temporários ao sair da página
window.addEventListener('beforeunload', async function (e) {
    if (window._pendingUploads && window._pendingUploads.length > 0) {
        const actionId = document.getElementById('actionId') ? document.getElementById('actionId').value : null;
        for (const filename of window._pendingUploads) {
            try {
                await fetch('/api/pdi-hub/deleteActionAttachment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actionId, filename })
                });
            } catch (err) {}
        }
        window._pendingUploads = [];
    }
});

function setActionStatusConcluido() {
    const statusSelect = document.getElementById('actionStatus');
    statusSelect.value = 'Concluído';
    statusSelect.setAttribute('disabled', 'disabled');
}

function setActionStatusManual() {
    const statusSelect = document.getElementById('actionStatus');
    statusSelect.removeAttribute('disabled');
    // Se estava como concluído, volta para pendente
    if (statusSelect.value === 'Concluído') {
        statusSelect.value = 'Pendente';
    }
}

// Ajustar openUpdateActionModal para remover todos os arquivos e destruir a instância FilePond corretamente usando input._pond.removeFiles() e FilePond.destroy(inputElement), antes de recriar o input. Isso garante que não haja anexos duplicados ou erros ao reabrir o modal.
function openUpdateActionModal(actionId, pdiId, description, deadline, status, attachments = [], completion_date = '') {
    // Limpar campos do modal
    document.getElementById('actionId').value = '';
    document.getElementById('pdiId').value = '';
    document.getElementById('actionDescription').textContent = '';
    document.getElementById('actionDeadlineInput').value = '';
    document.getElementById('actionStatus').value = 'Pendente';

    // Remover todos os arquivos e destruir FilePond da forma mais robusta possível
    const input = document.getElementById('actionAttachment');
    if (input && input._pond) {
        try {
            input._pond.removeFiles();
            input._pond.destroy();
        } catch (e) {
            console.error('Erro ao destruir FilePond:', e);
        }
    }
    
    try {
        if (input) FilePond.destroy(input);
    } catch (e) {
        console.error('Erro ao destruir FilePond (segunda tentativa):', e);
    }

    // Remover e recriar o input para garantir uma instância limpa
    const parent = input.parentNode;
    if (parent) {
        const newInput = document.createElement('input');
        newInput.type = 'file';
        newInput.id = 'actionAttachment';
        newInput.name = 'actionAttachment';
        newInput.multiple = true;
        parent.replaceChild(newInput, input);
    }

    // Garantir que attachments é array
    let filesArr = attachments;
    if (typeof filesArr === 'string') {
        try {
            filesArr = JSON.parse(filesArr);
            if (!Array.isArray(filesArr)) filesArr = [filesArr];
        } catch (e) {
            filesArr = [filesArr];
        }
    } else if (!Array.isArray(filesArr)) {
        filesArr = filesArr ? [filesArr] : [];
    }
    
    console.log('Anexos recebidos:', filesArr);
    
    // Preencher os dados do formulário
    document.getElementById('actionId').value = actionId;
    document.getElementById('pdiId').value = pdiId;
    document.getElementById('actionDescription').textContent = description;
    
    // Configurar o campo de prazo
    const deadlineInput = document.getElementById('actionDeadlineInput');
    const deadlineHelp = document.getElementById('deadlineHelp');
    
    // Formatar a data para o formato correto do input date (YYYY-MM-DD)
    if (deadline) {
        let dateObj = new Date(deadline);
        if (!isNaN(dateObj)) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            deadlineInput.value = `${year}-${month}-${day}`;
        }
    }
    
    // Configurar permissão de edição do prazo
    if (window.isSupervisorPDI) {
        // Supervisor pode editar o prazo
        deadlineInput.disabled = false;
        deadlineInput.classList.remove('form-control-plaintext');
        deadlineInput.classList.add('form-control');
        deadlineHelp.classList.add('d-none');
    } else {
        // Outros usuários não podem editar o prazo
        deadlineInput.disabled = true;
        deadlineInput.classList.add('form-control-plaintext');
        deadlineInput.classList.remove('form-control');
        deadlineHelp.classList.remove('d-none');
    }
    
    document.getElementById('actionStatus').value = status;
    
    // Inicializar FilePond antes de qualquer outra coisa para garantir que os anexos sejam carregados corretamente
    setupFilePondForAction(actionId, filesArr);
    
    // Preencher o campo de data de conclusão corretamente
    const completionDateInput = document.getElementById('completionDate');
    if (completionDateInput) {
        if (completion_date) {
            // Tenta converter para YYYY-MM-DD
            let dateObj = new Date(completion_date);
            if (!isNaN(dateObj)) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                completionDateInput.value = `${year}-${month}-${day}`;
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(completion_date)) {
                completionDateInput.value = completion_date;
            } else {
                completionDateInput.value = '';
            }
        } else {
            completionDateInput.value = '';
        }
    }
    
    // Verificar se deve mostrar campo de data de conclusão
    const completionDateSection = document.getElementById('completionDateSection');
    if (status === 'Concluído') {
        completionDateSection.classList.remove('d-none');
        setActionStatusConcluido();
    } else {
        completionDateSection.classList.add('d-none');
        setActionStatusManual();
    }
    
    // Desabilitar botão salvar se não for supervisor nem colaborador
    const btnSave = document.getElementById('btnSaveActionStatus');
    if (btnSave) {
        if (!window.isSupervisorPDI && !window.isColaboradorPDI) {
            btnSave.disabled = true;
            btnSave.title = 'Apenas o supervisor ou o colaborador podem salvar alterações.';
        } else {
            btnSave.disabled = false;
            btnSave.title = '';
        }
    }
    
    // Abrir o modal
    const modal = new bootstrap.Modal(document.getElementById('updateActionModal'));
    modal.show();
}

// Salvar o status atualizado da ação
async function saveActionStatus() {
    try {
        // Obter dados do formulário
        const actionId = document.getElementById('actionId').value;
        const pdiId = document.getElementById('pdiId').value;
        const status = document.getElementById('actionStatus').value;
        const btnSave = document.getElementById('btnSaveActionStatus');
        
        if (!actionId || !pdiId || !status) {
            showErrorAlert('Dados incompletos. Por favor, tente novamente.');
            return;
        }
        
        showLoader();
        if (btnSave) btnSave.disabled = true;
        
        // Obter instância do FilePond
        const pond = window.filepondInstance;
        if (!pond) {
            console.error('FilePond não inicializado corretamente');
            showErrorAlert('Erro ao processar anexos. Por favor, tente novamente.');
            hideLoader();
            if (btnSave) btnSave.disabled = false;
            return;
        }
        
        // Coletar TODOS os arquivos atuais no FilePond (independente da origem)
        const allFilesInPond = pond.getFiles();
        console.log('Todos os arquivos no FilePond:', allFilesInPond);
        
        // IMPORTANTE: Criar arrays separados para arquivos existentes e novos
        const existingFiles = [];
        const newFiles = [];
        
        // Classificar cada arquivo encontrado no pond
        allFilesInPond.forEach(file => {
            // Se o arquivo tem um source que aponta para o servidor, é um arquivo existente
            if (file.source && typeof file.source === 'string' && 
                file.source.includes('/uploads/pdi-hub/attachment_actions/')) {
                // Extrair o nome do arquivo da URL
                const filename = file.source.split('/').pop();
                console.log('Arquivo existente detectado:', filename);
                existingFiles.push(filename);
            } 
            // Se tem arquivo mas não tem source adequado, é um novo upload
            else if (file.file) {
                console.log('Novo arquivo detectado:', file.file.name);
                newFiles.push(file.file);
            }
        });
        
        console.log('Arquivos existentes a manter:', existingFiles);
        console.log('Novos arquivos a enviar:', newFiles.map(f => f.name));
        
        // Montar FormData
        const formData = new FormData();
        formData.append('actionId', actionId);
        formData.append('pdiId', pdiId);
        formData.append('status', status);
        
        // Adicionar informações do usuário logado para validação no backend
        const userLogged = await getInfosLogin();
        if (userLogged && userLogged.system_collaborator_id) {
            formData.append('logged_user_id', userLogged.system_collaborator_id);
            formData.append('is_supervisor', window.isSupervisorPDI ? 'true' : 'false');
        }
        
        // Adicionar prazo se o usuário for supervisor e o campo foi alterado
        if (window.isSupervisorPDI) {
            const deadlineInput = document.getElementById('actionDeadlineInput');
            if (deadlineInput && deadlineInput.value) {
                formData.append('deadline', deadlineInput.value);
                console.log('Prazo atualizado pelo supervisor:', deadlineInput.value);
            }
        }
        
        // Adicionar data de conclusão se status for Concluído
        if (status === 'Concluído') {
            formData.append('completion_date', document.getElementById('completionDate').value);
        }
        
        // IMPORTANTE: Adicionar files to keep como array - usamos um formato específico para o nome do campo
        if (existingFiles.length > 0) {
            // Método 1: Adicionar como campo separado para cada arquivo
            existingFiles.forEach(filename => {
                formData.append('filesToKeep[]', filename);
                console.log('Adicionado arquivo para manter:', filename);
            });
            
            // Método 2 (alternativo): Adicionar também em formato JSON para garantir
            formData.append('filesToKeepJSON', JSON.stringify(existingFiles));
        }
        
        // Adicionar novos arquivos
        newFiles.forEach(file => {
            formData.append('files[]', file);
            console.log('Adicionado novo arquivo:', file.name);
        });
        
        // Debugging - verificar o conteúdo do FormData
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
            if (key === 'files[]') {
                console.log(key, value.name);
            } else {
                console.log(key, value);
            }
        }
        
        // Enviar para backend
        const response = await fetch('/api/pdi-hub/saveActionAttachments', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        hideLoader();
        
        if (btnSave) btnSave.disabled = false;
        
        if (result.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateActionModal'));
            modal.hide();
            
            // Verificar se o prazo foi atualizado
            let successMessage = 'Status da ação e anexos atualizados com sucesso!';
            if (window.isSupervisorPDI) {
                const deadlineInput = document.getElementById('actionDeadlineInput');
                if (deadlineInput && deadlineInput.value && formData.get('deadline')) {
                    successMessage = 'Status da ação, prazo e anexos atualizados com sucesso!';
                }
            }
            
            showSuccessAlert(successMessage);
            
            // Registrar os anexos mantidos/adicionados para validação
            console.log('Anexos retornados pelo servidor:', result.attachments);
            
            if (result.pdiStatus) {
                updatePDIStatusDisplay(result.pdiStatus);
                updateActionIndicators(result.indicators);
                if (result.pdiStatus === 'Concluído') {
                    showSuccessAlert('🎉 Parabéns! Todas as ações foram concluídas e o PDI foi marcado como CONCLUÍDO!');
                } else if (result.pdiStatus === 'Ativo') {
                    const hasLateActions = result.actionsPending > 0 && result.hasLateActions;
                    if (hasLateActions) {
                        const statusElement = document.getElementById('pdiStatus');
                        if (statusElement) {
                            statusElement.innerHTML = `
                                <i class="ri-alarm-warning-line me-1"></i>
                                Status: <span class="fw-semibold">Atrasado</span>
                            `;
                            statusElement.className = `badge bg-danger`;
                        }
                        showErrorAlert('⚠️ Atenção! O PDI possui ações atrasadas. Por favor, atualize os prazos ou conclua as ações pendentes.');
                    } else if (result.pdiInProgress) {
                        const statusElement = document.getElementById('pdiStatus');
                        if (statusElement) {
                            statusElement.innerHTML = `
                                <i class="ri-checkbox-multiple-line me-1"></i>
                                Status: <span class="fw-semibold">Em Andamento</span>
                            `;
                            statusElement.className = `badge bg-info`;
                        }
                        showSuccessAlert('📊 O PDI está em andamento com ' + result.actionsInProgress + ' ações sendo executadas.');
                    } else {
                        const completionPercentage = result.indicators?.completionPercentage || 0;
                        if (completionPercentage >= 75) {
                            showSuccessAlert('👍 Ótimo progresso! Você já completou ' + completionPercentage + '% das ações deste PDI.');
                        } else if (completionPercentage >= 50) {
                            showSuccessAlert('👏 Bom progresso! Você já completou ' + completionPercentage + '% das ações deste PDI.');
                        } else if (completionPercentage > 0) {
                            showSuccessAlert('📊 O PDI está progredindo. ' + completionPercentage + '% das ações foram concluídas.');
                        } else {
                            showSuccessAlert('ℹ️ O PDI está Ativo. Comece trabalhando nas ações pendentes.');
                        }
                    }
                } else if (result.pdiStatus === 'Cancelado') {
                    showInfoAlert('⚠️ Este PDI está cancelado.');
                }
            }
            await loadPDIDetails(pdiId);
        } else {
            showErrorAlert(result.message || 'Não foi possível atualizar o status da ação e anexos.');
        }
    } catch (error) {
        console.error('Erro ao salvar status da ação:', error);
        hideLoader();
        if (document.getElementById('btnSaveActionStatus')) document.getElementById('btnSaveActionStatus').disabled = false;
        showErrorAlert('Não foi possível atualizar o status da ação. Por favor, tente novamente.');
    }
}

// Atualizar o display do status do PDI
function updatePDIStatusDisplay(status) {
    const statusElement = document.getElementById('pdiStatus');
    if (statusElement) {
        const statusClass = getStatusClass(status);
        statusElement.innerHTML = `
            <i class="ri-checkbox-multiple-line me-1"></i>
            Status: <span class="fw-semibold">${status}</span>
        `;
        statusElement.className = `badge ${statusClass}`;
        console.log('Status do PDI atualizado no DOM:', status);
    }
}

// Atualizar os indicadores de progresso das ações
function updateActionIndicators(indicators) {
    if (!indicators) return;
    
    console.log('Atualizando indicadores:', indicators);
    
    // Verificar se já existe o container de progresso
    const progressContainer = document.querySelector('.action-progress-container');
    
    if (!progressContainer) {
        // Criar container de progresso se não existir
        // Usar um seletor mais específico para ser compatível com todos os navegadores
        const actionsCard = document.querySelector('.card');
        if (actionsCard) {
            const actionsListElement = actionsCard.querySelector('#actionsList');
            if (actionsListElement) {
                const actionsListParent = actionsListElement.parentNode;
                
                const newProgressContainer = document.createElement('div');
                newProgressContainer.className = 'action-progress-container mb-3';
                newProgressContainer.innerHTML = `
                    <div class="d-flex justify-content-between mb-1">
                        <span>Progresso das Ações</span>
                        <span>${indicators.completionPercentage}% concluído</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-success" role="progressbar" 
                             style="width: ${indicators.completionPercentage}%" 
                             aria-valuenow="${indicators.completionPercentage}" 
                             aria-valuemin="0" 
                             aria-valuemax="100"></div>
                    </div>
                    <div class="d-flex justify-content-between mt-2 small text-muted">
                        <span>Concluídas: ${indicators.completedActions}</span>
                        <span>Em Andamento: ${indicators.inProgressActions}</span>
                        <span>Pendentes: ${indicators.pendingActions}</span>
                    </div>
                `;
                
                // Inserir o container antes da lista de ações
                actionsListParent.insertBefore(newProgressContainer, actionsListElement);
                
                console.log('Container de progresso criado com indicações de Em Andamento:', indicators.inProgressActions);
            }
        }
    } else {
        // Atualizar container existente
        progressContainer.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span>Progresso das Ações</span>
                <span>${indicators.completionPercentage}% concluído</span>
            </div>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-success" role="progressbar" 
                     style="width: ${indicators.completionPercentage}%" 
                     aria-valuenow="${indicators.completionPercentage}" 
                     aria-valuemin="0" 
                     aria-valuemax="100"></div>
            </div>
            <div class="d-flex justify-content-between mt-2 small text-muted">
                <span>Concluídas: ${indicators.completedActions}</span>
                <span>Em Andamento: ${indicators.inProgressActions}</span>
                <span>Pendentes: ${indicators.pendingActions}</span>
            </div>
        `;
        
        console.log('Container de progresso atualizado com indicações de Em Andamento:', indicators.inProgressActions);
    }
}

// Mostrar alerta informativo
function showInfoAlert(message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'info-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-info alert-dismissible fade show" role="alert">
            <i class="ri-information-line me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.innerHTML += alertHTML;
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }
    }, 5000);
}

// Obter a classe CSS para o status do PDI ou ação
function getStatusClass(status) {
    switch(status) {
        case 'Pendente': return 'bg-warning text-dark';
        case 'Em Andamento': return 'bg-info';
        case 'Ativo': return 'bg-primary';
        case 'Concluído': return 'bg-success';
        case 'Cancelado': return 'bg-danger';
        case 'Atrasado': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// Formatar data para exibição
function formatDate(dateString) {
    if (!dateString) return '-';
    // Se já estiver no formato dd/mm/yyyy, apenas retorna
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
    // Se estiver no formato yyyy-mm-dd, converte para pt-BR
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    }
    // Tenta converter normalmente
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    return date.toLocaleDateString('pt-BR');
}

// Mostrar o loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Esconder o loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Mostrar alerta de erro
function showErrorAlert(message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'error-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="ri-error-warning-line me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.innerHTML += alertHTML;
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }
    }, 5000);
}

// Mostrar alerta de sucesso
function showSuccessAlert(message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'success-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="ri-checkbox-circle-line me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.innerHTML += alertHTML;
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }
    }, 5000);
}

// Obtém as informações do usuário logado do localStorage (modo padrão do sistema)
async function getInfosLogin() {
    try {
        const StorageGoogleData = localStorage.getItem('StorageGoogle');
        if (!StorageGoogleData) {
            return null;
        }
        
        const StorageGoogle = JSON.parse(StorageGoogleData);
        return StorageGoogle;
    } catch (error) {
        console.error('Erro ao obter informações de login:', error);
        return null;
    }
} 

async function openUpdateActionModalWithFetch(actionId, pdiId, description, deadline, status) {
    try {
        // Converter strings para números se necessário
        actionId = parseInt(actionId);
        pdiId = parseInt(pdiId);
        
        // Decodificar HTML entities se necessário
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        description = tempDiv.textContent || tempDiv.innerText || '';
        
        // Buscar dados atualizados da ação
        const response = await fetch(`/api/pdi-hub/getActionById?actionId=${actionId}`);
        const result = await response.json();
        let attachments = [];
        let completion_date = '';
        
        if (result.success && result.data) {
            attachments = result.data.attachment || [];
            description = result.data.description;
            deadline = result.data.deadline;
            status = result.data.status;
            completion_date = result.data.completion_date;
        }
        
        openUpdateActionModal(actionId, pdiId, description, deadline, status, attachments, completion_date);
    } catch (error) {
        console.error('Erro ao abrir modal de edição:', error);
        showErrorAlert('Erro ao carregar dados da ação. Por favor, tente novamente.');
    }
}

async function confirmRemoveAction(actionId, pdiId) {
    if (confirm('Tem certeza que deseja remover esta ação? Esta operação não pode ser desfeita.')) {
        try {
            showLoader();
            const response = await fetch('/api/pdi-hub/deleteAction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionId })
            });
            const result = await response.json();
            hideLoader();
            if (result.success) {
                showSuccessAlert('Ação removida com sucesso!');
                await loadPDIDetails(pdiId);
            } else {
                showErrorAlert(result.message || 'Não foi possível remover a ação.');
            }
        } catch (error) {
            hideLoader();
            showErrorAlert('Erro ao remover a ação.');
        }
    }
}

// Event listener global para abrir o anexo ao clicar no olho
// (abre o arquivo em nova aba ao clicar no olho)
document.addEventListener('click', function(e) {
    const viewIcon = e.target.closest('.filepond--view-icon');
    if (viewIcon) {
        e.preventDefault();
        e.stopPropagation();
        // O nome do arquivo é o próximo irmão do ícone de visualização
        const fileInfoMain = viewIcon.nextElementSibling;
        if (!fileInfoMain || !fileInfoMain.classList.contains('filepond--file-info-main')) return;
        const filename = fileInfoMain.textContent.trim();
        console.log('Clicou no olho para visualizar o arquivo FilePond:', filename);
        const pondFiles = window.filepondInstance ? window.filepondInstance.getFiles() : [];
        const fileObj = pondFiles.find(f => f.filename === filename || (f.file && f.file.name === filename));
        let url = null;
        if (fileObj && fileObj.source) {
            url = fileObj.source;
        } else if (fileObj && fileObj.file) {
            url = URL.createObjectURL(fileObj.file);
        }
        if (!url) return;
        window.open(url, '_blank');
        if (fileObj && fileObj.file) {
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
        return false;
    }
}, true); 

// Função para abrir o modal de nova ação
function addNewAction() {
    const form = document.getElementById('addActionForm');
    if (form) {
        form.reset();
    }
    // Definir data mínima do prazo como hoje
    const deadlineInput = document.getElementById('newActionDeadline');
    if (deadlineInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        deadlineInput.min = `${year}-${month}-${day}`;
    }
    // Abrir modal somente se existir
    const modalEl = document.getElementById('addActionModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        showErrorAlert('Modal de adicionar ação não encontrado no DOM.');
    }
}

// Listener para salvar nova ação
if (document.getElementById('btnSaveNewAction')) {
    document.getElementById('btnSaveNewAction').addEventListener('click', async function() {
        const form = document.getElementById('addActionForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        const description = document.getElementById('newActionDescription').value.trim();
        const deadline = document.getElementById('newActionDeadline').value;
        // Obter o ID do PDI atual
        let pdiId = null;
        if (window.location.search.includes('pdi_id=')) {
            const urlParams = new URLSearchParams(window.location.search);
            pdiId = urlParams.get('pdi_id');
        } else {
            pdiId = localStorage.getItem('current_pdi_id');
        }
        if (!pdiId) {
            showErrorAlert('Não foi possível identificar o PDI para adicionar a ação.');
            return;
        }
        try {
            showLoader();
            const response = await fetch('/api/pdi-hub/addAction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdi_id: pdiId,
                    description,
                    deadline
                })
            });
            const result = await response.json();
            hideLoader();
            if (result.success) {
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addActionModal'));
                modal.hide();
                showSuccessAlert('Ação adicionada com sucesso!');
                // Atualizar lista de ações
                await loadPDIDetails(pdiId);
            } else {
                showErrorAlert(result.message || 'Não foi possível adicionar a ação.');
            }
        } catch (error) {
            hideLoader();
            showErrorAlert('Erro ao adicionar a ação.');
        }
    });
} 