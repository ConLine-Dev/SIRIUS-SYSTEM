/**
 * PDI Hub - Script para a página do colaborador
 */

// Esperar o documento carregar
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos
    setupEventListeners();
    loadCollaboratorPDI();
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
        
        // Se estamos acessando diretamente, ignorar os valores no localStorage
        // e buscar apenas do usuário logado
        if (isDirectAccess) {
            console.log('Acesso direto à página - buscando PDI do usuário logado');
            
            // Limpar valores antigos do localStorage para evitar confusão
            localStorage.removeItem('current_collaborator_id');
            localStorage.removeItem('current_pdi_id');
            
            // Obter informações do usuário logado
            const userLogged = await getInfosLogin();
            
            if (userLogged && userLogged.system_collaborator_id) {
                collaboratorId = userLogged.system_collaborator_id;
                console.log('Colaborador obtido do usuário logado:', collaboratorId);
            } else {
                // Tentar obter da sessão
                try {
                    const sessionResponse = await fetch('/api/session/getSession');
                    const sessionData = await sessionResponse.json();
                    
                    if (sessionData.success && sessionData.data && sessionData.data.user && sessionData.data.user.collaborator_id) {
                        collaboratorId = sessionData.data.user.collaborator_id;
                        console.log('Colaborador obtido da sessão:', collaboratorId);
                    }
                } catch (error) {
                    console.error('Erro ao obter usuário da sessão:', error);
                }
            }
        } else {
            // Se estamos acessando via parâmetros, podemos usar o localStorage como fallback
            console.log('Acesso via parâmetros URL - usando localStorage como fallback');
            
            if (!collaboratorId) {
                collaboratorId = localStorage.getItem('current_collaborator_id');
            }
            
            if (!pdiId) {
                pdiId = localStorage.getItem('current_pdi_id');
            }
        }
        
        // Se ainda não encontrou, mostrar erro
        if (!collaboratorId && !pdiId) {
            hideLoader();
            showErrorAlert('ID do colaborador ou do PDI não informado. Por favor, acesse através da página principal do PDI Hub.');
            return;
        }
        
        console.log('Usando collaboratorId:', collaboratorId, 'pdiId:', pdiId);
        
        // Se temos o ID do PDI diretamente, carregamos direto
        if (pdiId) {
            await loadPDIDetails(pdiId);
            return;
        }
        
        // Caso contrário, buscamos o PDI mais recente do colaborador
        const response = await fetch(`/api/pdi-hub/getPDIsByCollaborator?collaborator_id=${collaboratorId}`);
        const result = await response.json();
        
        hideLoader();
        
        if (!result.success || !result.data || result.data.length === 0) {
            showErrorAlert('Nenhum PDI encontrado para o colaborador.');
            return;
        }
        
        // Pegar o PDI mais recente (assume que está ordenado por data de criação decrescente)
        const mostRecentPDI = result.data[0];
        
        // Salvar o ID do PDI no localStorage para referência futura
        localStorage.setItem('current_pdi_id', mostRecentPDI.id);
        
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
            return false;
        }
        
        // Converter para números para garantir comparação correta
        const supervisorId = parseInt(pdi.supervisor_id);
        const loggedUserId = parseInt(userLogged.system_collaborator_id);
        
        console.log('Verificando permissão:');
        console.log('ID do supervisor do PDI:', supervisorId);
        console.log('ID do usuário logado:', loggedUserId);
        
        const isUserSupervisor = supervisorId === loggedUserId;
        console.log('Usuário é supervisor?', isUserSupervisor);
        
        // Se o usuário for o supervisor, mostrar o histórico de avaliações e o botão
        if (isUserSupervisor) {
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
            
            // Renderizar cada avaliação no histórico
            result.data.forEach(evaluation => {
                const row = document.createElement('tr');
                
                // Formatar o período (mês/ano)
                const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                const monthName = monthNames[evaluation.month - 1];
                const period = `${monthName}/${evaluation.year}`;
                
                // Calcular a média das avaliações
                const ratings = [
                    evaluation.attendance || 0,
                    evaluation.punctuality || 0,
                    evaluation.teamwork || 0,
                    evaluation.creativity || 0,
                    evaluation.productivity || 0,
                    evaluation.problem_solving || 0
                ];
                
                const validRatings = ratings.filter(r => r > 0);
                const average = validRatings.length > 0 
                    ? (validRatings.reduce((sum, r) => sum + parseInt(r), 0) / validRatings.length).toFixed(1)
                    : 'N/A';
                
                // Definir a classe de cor com base na média
                let badgeClass = 'bg-secondary';
                if (average !== 'N/A') {
                    const avgNum = parseFloat(average);
                    if (avgNum >= 4.5) badgeClass = 'bg-success';
                    else if (avgNum >= 3.5) badgeClass = 'bg-primary';
                    else if (avgNum >= 2.5) badgeClass = 'bg-warning';
                    else badgeClass = 'bg-danger';
                }
                
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
    // Destacar o ícone correspondente
    const items = document.querySelectorAll('.rating-item');
    items.forEach(item => {
        item.classList.remove('active');
        const img = item.querySelector('img');
        if (img) {
            img.style.opacity = '0.7';
            img.style.filter = 'grayscale(0.4)';
        }
        
        // Se for o nível selecionado, destacar
        if (item.getAttribute('data-level') === level) {
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
    
    switch(level) {
        case 'Estacionado':
            badgeClass = 'bg-danger';
            progressWidth = '20%';
            progressColor = 'var(--level-1-color)';
            break;
        case 'Ajustando a Rota':
            badgeClass = 'bg-warning';
            progressWidth = '40%';
            progressColor = 'var(--level-2-color)';
            break;
        case 'Na Rota':
            badgeClass = 'bg-success';
            progressWidth = '60%';
            progressColor = 'var(--level-3-color)';
            break;
        case 'Brilhou na Entrega':
            badgeClass = 'bg-info';
            progressWidth = '80%';
            progressColor = 'var(--level-4-color)';
            break;
        case 'Voando Alto':
            badgeClass = 'bg-primary';
            progressWidth = '100%';
            progressColor = 'var(--level-5-color)';
            break;
        default:
            badgeClass = 'bg-secondary';
            progressWidth = '60%';
            progressColor = 'var(--level-3-color)';
    }
    
    // Aplicar as classes e estilos
    performanceBadge.className = `badge ${badgeClass}`;
    progressBar.style.width = progressWidth;
    progressBar.style.backgroundColor = progressColor;
}

// Renderizar a lista de ações do PDI
function renderActionsList(actions, pdiId) {
    const actionsListElement = document.getElementById('actionsList');
    actionsListElement.innerHTML = '';
    
    if (!actions || actions.length === 0) {
        document.getElementById('noActions').classList.remove('d-none');
        return;
    }
    
    document.getElementById('noActions').classList.add('d-none');
    
    actions.forEach(action => {
        const statusClass = getStatusClass(action.status);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${action.description}</td>
            <td>${formatDate(action.deadline)}</td>
            <td><span class="badge ${statusClass}">${action.status}</span></td>
            <td>${action.completion_date ? formatDate(action.completion_date) : '-'}</td>
            <td>
                <button type="button" class="btn btn-sm btn-primary" onclick="openUpdateActionModal(${action.id}, ${pdiId}, '${action.description}', '${action.deadline}', '${action.status}')">
                    <i class="ri-edit-line me-1"></i>Atualizar
                </button>
            </td>
        `;
        
        actionsListElement.appendChild(row);
    });
}

// Abrir modal para atualizar status da ação
function openUpdateActionModal(actionId, pdiId, description, deadline, status) {
    // Preencher os dados do formulário
    document.getElementById('actionId').value = actionId;
    document.getElementById('pdiId').value = pdiId;
    document.getElementById('actionDescription').textContent = description;
    document.getElementById('actionDeadline').textContent = formatDate(deadline);
    document.getElementById('actionStatus').value = status;
    
    // Verificar se deve mostrar campo de data de conclusão
    const completionDateSection = document.getElementById('completionDateSection');
    if (status === 'Concluído') {
        completionDateSection.classList.remove('d-none');
    } else {
        completionDateSection.classList.add('d-none');
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
        
        console.log('Salvando status da ação:', { actionId, pdiId, status });
        
        // Validar
        if (!actionId || !pdiId || !status) {
            showErrorAlert('Dados incompletos. Por favor, tente novamente.');
            return;
        }
        
        showLoader();
        
        // Preparar dados para envio
        const data = {
            action_id: actionId,
            pdi_id: pdiId,
            status: status
        };
        
        // Se status for "Concluído", incluir data de conclusão
        if (status === 'Concluído') {
            data.completion_date = document.getElementById('completionDate').value;
            console.log('Ação concluída. Data de conclusão:', data.completion_date);
        }
        
        console.log('Enviando dados para a API:', data);
        
        // Enviar requisição
        const response = await fetch('/api/pdi-hub/updatePDIActionStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('Resposta da API:', result);
        
        hideLoader();
        
        if (result.success) {
            // Fechar o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateActionModal'));
            modal.hide();
            
            // Mostrar mensagem de sucesso para a ação
            showSuccessAlert('Status da ação atualizado com sucesso!');
            
            // Atualizar o status do PDI e os indicadores dinâmicos se recebemos essa informação
            if (result.pdiStatus) {
                updatePDIStatusDisplay(result.pdiStatus);
                updateActionIndicators(result.indicators);
                
                // Mostrar uma mensagem específica com base no status do PDI
                if (result.pdiStatus === 'Concluído') {
                    showSuccessAlert('🎉 Parabéns! Todas as ações foram concluídas e o PDI foi marcado como CONCLUÍDO!');
                } else if (result.pdiStatus === 'Ativo') {
                    // Verificar se há ações atrasadas
                    const hasLateActions = result.actionsPending > 0 && result.hasLateActions;
                    
                    if (hasLateActions) {
                        // Mostrar visualmente que o PDI está "Atrasado"
                        const statusElement = document.getElementById('pdiStatus');
                        if (statusElement) {
                            statusElement.innerHTML = `
                                <i class="ri-alarm-warning-line me-1"></i>
                                Status: <span class="fw-semibold">Atrasado</span>
                            `;
                            statusElement.className = `badge bg-danger`;
                        }
                        
                        // Mensagem específica sobre ações atrasadas
                        showErrorAlert('⚠️ Atenção! O PDI possui ações atrasadas. Por favor, atualize os prazos ou conclua as ações pendentes.');
                    }
                    // Verificar se tem ações em andamento
                    else if (result.pdiInProgress) {
                        // Mostrar visualmente que o PDI está "Em Andamento" (mesmo que tecnicamente seja "Ativo")
                        const statusElement = document.getElementById('pdiStatus');
                        if (statusElement) {
                            statusElement.innerHTML = `
                                <i class="ri-checkbox-multiple-line me-1"></i>
                                Status: <span class="fw-semibold">Em Andamento</span>
                            `;
                            statusElement.className = `badge bg-info`;
                        }
                        
                        // Mensagem específica sobre ações em andamento
                        showSuccessAlert('📊 O PDI está em andamento com ' + result.actionsInProgress + ' ações sendo executadas.');
                    } else {
                        // Verificar o progresso para exibir uma mensagem personalizada
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
            
            // Recarregar os detalhes do PDI para atualizar a lista de ações
            console.log('Recarregando detalhes do PDI:', pdiId);
            await loadPDIDetails(pdiId);
        } else {
            showErrorAlert(result.message || 'Não foi possível atualizar o status da ação.');
        }
        
    } catch (error) {
        console.error('Erro ao salvar status da ação:', error);
        hideLoader();
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
    
    const date = new Date(dateString);
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