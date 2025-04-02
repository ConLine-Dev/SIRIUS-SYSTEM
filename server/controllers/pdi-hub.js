const { executeQuery } = require('../connect/mysql');
const { sendEmail } = require('../support/send-email');
const { emailCustom } = require('../support/emails-template');

const pdiHub = {
    // ==================== PDIs ====================
    
    // Obter todos os PDIs existentes no sistema
    getAllPDIs: async function(supervisor_id) {
        const result = await executeQuery(`
            SELECT 
                p.*,
                c.name as collaborator_name,
                c.family_name as collaborator_family_name,
                c.id_headcargo as collaborator_avatar,
                c.job_position as job_position,
                CONCAT(s.name, ' ', s.family_name) as supervisor_name
            FROM 
                pdi_plans p
            JOIN 
                collaborators c ON c.id = p.collaborator_id
            LEFT JOIN 
                collaborators s ON s.id = p.supervisor_id
            ${supervisor_id ? `WHERE p.supervisor_id = ${supervisor_id}` : ''}
            ORDER BY 
                p.created_at DESC
        `);

        const formattedPDIs = [];
        
        // Para cada PDI, buscar estatísticas das ações
        for (const item of result) {
            // Obter estatísticas das ações
            const [actionStats] = await executeQuery(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Concluído' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'Em Andamento' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN deadline < CURDATE() AND status != 'Concluído' THEN 1 ELSE 0 END) as late
                FROM 
                    pdi_actions
                WHERE 
                    pdi_id = ?
            `, [item.id]);
            
            // Converter para números para evitar problemas
            const total = parseInt(actionStats.total || 0);
            const completed = parseInt(actionStats.completed || 0);
            const inProgress = parseInt(actionStats.in_progress || 0);
            const pending = parseInt(actionStats.pending || 0);
            const late = parseInt(actionStats.late || 0);
            
            // Determinar se o PDI está "Em Andamento" ou "Atrasado" com base nas ações
            const hasActionsInProgress = inProgress > 0;
            const hasLateActions = late > 0;
            const allActionsCompleted = total > 0 && completed === total;
            
            formattedPDIs.push({
                id: item.id,
                collaborator_id: item.collaborator_id,
                collaborator_name: `${item.collaborator_name} ${item.collaborator_family_name}`,
                collaborator_avatar: item.collaborator_avatar,
                job_position: item.job_position,
                supervisor_id: item.supervisor_id,
                supervisor_name: item.supervisor_name,
                profile_type: item.profile_type,
                status: item.status,
                created_at: this.formatDateToPtBr(item.created_at),
                updated_at: this.formatDateToPtBr(item.updated_at),
                actionStats: {
                    total,
                    completed,
                    inProgress,
                    pending,
                    late,
                    hasActionsInProgress,
                    hasLateActions,
                    allActionsCompleted
                }
            });
        }

        return formattedPDIs;
    },
    
    // Obter PDIs de um colaborador específico
    getPDIsByCollaborator: async function(collaborator_id) {
        const result = await executeQuery(`
            SELECT 
                p.*,
                c.name as collaborator_name,
                c.family_name as collaborator_family_name,
                c.id_headcargo as collaborator_avatar,
                c.job_position as job_position,
                CONCAT(s.name, ' ', s.family_name) as supervisor_name
            FROM 
                pdi_plans p
            JOIN 
                collaborators c ON c.id = p.collaborator_id
            LEFT JOIN 
                collaborators s ON s.id = p.supervisor_id
            WHERE 
                p.collaborator_id = ${collaborator_id}
            ORDER BY 
                p.created_at DESC
        `);

        const formattedPDIs = result.map(item => {
            return {
                id: item.id,
                collaborator_id: item.collaborator_id,
                collaborator_name: `${item.collaborator_name} ${item.collaborator_family_name}`,
                collaborator_avatar: item.collaborator_avatar,
                job_position: item.job_position,
                supervisor_id: item.supervisor_id,
                supervisor_name: item.supervisor_name,
                profile_type: item.profile_type,
                status: item.status,
                created_at: this.formatDateToPtBr(item.created_at),
                updated_at: this.formatDateToPtBr(item.updated_at)
            };
        });

        return formattedPDIs;
    },
    
    // Obter detalhes de um PDI específico
    getPDIView: async function(id) {
        const result = await executeQuery(`
            SELECT 
                p.*,
                c.name as collaborator_name,
                c.family_name as collaborator_family_name,
                c.id_headcargo as collaborator_avatar,
                c.job_position as job_position,
                CONCAT(s.name, ' ', s.family_name) as supervisor_name
            FROM 
                pdi_plans p
            JOIN 
                collaborators c ON c.id = p.collaborator_id
            LEFT JOIN 
                collaborators s ON s.id = p.supervisor_id
            WHERE 
                p.id = ${id}
        `);

        if (result.length === 0) {
            return null;
        }

        const item = result[0];
        
        // Buscar as ações do PDI
        const actions = await executeQuery(`
            SELECT 
                *
            FROM 
                pdi_actions
            WHERE 
                pdi_id = ${id}
            ORDER BY 
                created_at ASC
        `);
        
        const formattedActions = actions.map(action => {
            return {
                id: action.id,
                pdi_id: action.pdi_id,
                description: action.description,
                deadline: action.deadline,
                status: action.status,
                completion_date: action.completion_date ? this.formatDateToPtBr(action.completion_date) : null,
                created_at: this.formatDateToPtBr(action.created_at),
                updated_at: this.formatDateToPtBr(action.updated_at)
            };
        });
        
        return {
            id: item.id,
            collaborator_id: item.collaborator_id,
            collaborator_name: `${item.collaborator_name} ${item.collaborator_family_name}`,
            collaborator_avatar: `https://cdn.conlinebr.com.br/colaboradores/${item.collaborator_avatar}`,
            job_position: item.job_position,
            academic_summary: item.academic_summary,
            supervisor_id: item.supervisor_id,
            supervisor_name: item.supervisor_name,
            who_are_you: item.who_are_you,
            strengths: item.strengths,
            improvement_points: item.improvement_points,
            development_goals: item.development_goals,
            profile_type: item.profile_type,
            status: item.status,
            created_at: this.formatDateToPtBr(item.created_at),
            updated_at: this.formatDateToPtBr(item.updated_at),
            actions: formattedActions
        };
    },
    
    // Criar um novo PDI
    createPDI: async function(form) {
        const created_at = new Date();
        const formattedDate = this.formatDateForDatabase(created_at);
        
        // Iniciar transação
        await executeQuery('START TRANSACTION');
        
        try {
            // Inserir o PDI
            const pdiResult = await executeQuery(`
                INSERT INTO pdi_plans 
                (collaborator_id, supervisor_id, academic_summary, who_are_you, strengths, improvement_points, 
                development_goals, profile_type, status, created_at, updated_at) 
                VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                form.collaborator_id,
                form.supervisor_id,
                form.academic_summary || '',
                form.who_are_you || '',
                form.strengths || '',
                form.improvement_points || '',
                form.development_goals || '',
                form.profile_type || '',
                'Ativo',
                formattedDate,
                formattedDate
            ]);
            
            const pdiId = pdiResult.insertId;
            
            // Inserir as ações do PDI
            if (form.actions && form.actions.length > 0) {
                const actionValues = form.actions.map(action => 
                    [pdiId, action.description, action.deadline, 'Pendente', null, formattedDate, formattedDate]
                );
                
                await executeQuery(`
                    INSERT INTO pdi_actions 
                    (pdi_id, description, deadline, status, completion_date, created_at, updated_at) 
                    VALUES ?
                `, [actionValues]);
            }
            
            // Buscar informações adicionais do colaborador e supervisor para o email
            const [collaboratorInfo] = await executeQuery(`
                SELECT c.name, c.family_name, u.email
                FROM collaborators c
                JOIN users u ON u.collaborator_id = c.id
                WHERE c.id = ?
            `, [form.collaborator_id]);

            const [supervisorInfo] = await executeQuery(`
                SELECT u.email
                FROM collaborators c
                JOIN users u ON u.collaborator_id = c.id
                WHERE c.id = ?
            `, [form.supervisor_id]);

            // Enviar email de notificação para o colaborador
            if (collaboratorInfo && collaboratorInfo.email) {
                const emailData = {
                    collaborator_name: `${collaboratorInfo.name} ${collaboratorInfo.family_name}`,
                    supervisor_name: form.supervisor_name,
                    pdi_id: pdiId
                };

                const emailContent = await emailCustom.pdiNotification(emailData);
                sendEmail(
                    collaboratorInfo.email,
                    'Novo Plano de Desenvolvimento Individual (PDI) Criado',
                    emailContent
                );
            }
            
            await executeQuery('COMMIT');
            return { success: true, id: pdiId };
            
        } catch (error) {
            await executeQuery('ROLLBACK');
            throw error;
        }
    },
    
    // Atualizar um PDI existente
    updatePDI: async function(form) {
        const updated_at = new Date();
        const formattedDate = this.formatDateForDatabase(updated_at);
        
        // Iniciar transação
        await executeQuery('START TRANSACTION');
        
        try {
            // Atualizar o PDI
            await executeQuery(`
                UPDATE pdi_plans 
                SET 
                    academic_summary = ?, 
                    who_are_you = ?, 
                    strengths = ?, 
                    improvement_points = ?, 
                    development_goals = ?, 
                    profile_type = ?, 
                    updated_at = ? 
                WHERE id = ?
            `, [
                form.academic_summary || '',
                form.who_are_you || '',
                form.strengths || '',
                form.improvement_points || '',
                form.development_goals || '',
                form.profile_type || '',
                formattedDate,
                form.id
            ]);
            
            // Atualizar as ações existentes e adicionar novas
            if (form.actions && form.actions.length > 0) {
                for (const action of form.actions) {
                    if (action.id) {
                        // Atualizar ação existente
                        await executeQuery(`
                            UPDATE pdi_actions 
                            SET 
                                description = ?, 
                                deadline = ?, 
                                updated_at = ? 
                            WHERE id = ?
                        `, [
                            action.description,
                            action.deadline,
                            formattedDate,
                            action.id
                        ]);
                    } else {
                        // Inserir nova ação
                        await executeQuery(`
                            INSERT INTO pdi_actions 
                            (pdi_id, description, deadline, status, created_at, updated_at) 
                            VALUES (?, ?, ?, ?, ?, ?)
                        `, [
                            form.id,
                            action.description,
                            action.deadline,
                            'Pendente',
                            formattedDate,
                            formattedDate
                        ]);
                    }
                }
            }
            
            // Se há ações para excluir
            if (form.actions_to_delete && form.actions_to_delete.length > 0) {
                await executeQuery(`
                    DELETE FROM pdi_actions 
                    WHERE id IN (?)
                `, [form.actions_to_delete]);
            }
            
            await executeQuery('COMMIT');
            return { success: true, id: form.id };
            
        } catch (error) {
            await executeQuery('ROLLBACK');
            throw error;
        }
    },
    
    // Deletar um PDI
    deletePDI: async function(id) {
        // Iniciar transação
        await executeQuery('START TRANSACTION');
        
        try {
            // Excluir as ações associadas
            await executeQuery(`
                DELETE FROM pdi_actions 
                WHERE pdi_id = ?
            `, [id]);
            
            // Excluir o PDI principal
            await executeQuery(`
                DELETE FROM pdi_plans 
                WHERE id = ?
            `, [id]);
            
            await executeQuery('COMMIT');
            return { success: true };
            
        } catch (error) {
            await executeQuery('ROLLBACK');
            throw error;
        }
    },
    
    // ==================== Ações do PDI ====================
    
    // Atualizar status de uma ação de PDI pelo colaborador
    updatePDIActionStatus: async function(form) {
        try {
            console.log('Atualizando status da ação:', form);
            
            const updated_at = new Date();
            const formattedDate = this.formatDateForDatabase(updated_at);
            
            // Converter action_id para número se for string
            const actionId = parseInt(form.action_id);
            const pdiId = parseInt(form.pdi_id);
            
            console.log('IDs convertidos:', { actionId, pdiId });
            
            // Iniciar transação para garantir consistência
            await executeQuery('START TRANSACTION');
            
            // Definir completion_date se o status for "Concluído"
            let completion_date = null;
            if (form.status === 'Concluído') {
                completion_date = formattedDate;
            }
            
            // DEBUG: Verificar o status antes da atualização
            const [beforeUpdate] = await executeQuery('SELECT status FROM pdi_actions WHERE id = ?', [actionId]);
            console.log(`Status da ação ${actionId} ANTES da atualização:`, beforeUpdate?.status);
            
            // Atualizar a ação
            await executeQuery(`
                UPDATE pdi_actions 
                SET 
                    status = ?, 
                    completion_date = ?,
                    updated_at = ? 
                WHERE id = ?
            `, [
                form.status,
                completion_date,
                formattedDate,
                actionId
            ]);
            
            // DEBUG: Verificar o status após a atualização
            const [afterUpdate] = await executeQuery('SELECT status FROM pdi_actions WHERE id = ?', [actionId]);
            console.log(`Status da ação ${actionId} APÓS a atualização:`, afterUpdate?.status);
            
            console.log(`Ação ${actionId} atualizada para status: ${form.status}`);
            
            // DEBUG: Listar todas as ações do PDI com seus status
            const allActions = await executeQuery(`
                SELECT id, status FROM pdi_actions WHERE pdi_id = ? ORDER BY id
            `, [pdiId]);
            console.log(`Lista de todas as ações do PDI ${pdiId}:`, allActions);
            
            // Verificar o status de todas as ações para decidir o status do PDI
            const [actionStats] = await executeQuery(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Concluído' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'Em Andamento' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN deadline < CURDATE() AND status != 'Concluído' THEN 1 ELSE 0 END) as late
                FROM 
                    pdi_actions
                WHERE 
                    pdi_id = ?
            `, [pdiId]);
            
            console.log('Estatísticas das ações (SQL result):', actionStats);
            console.log('Tipo de in_progress:', typeof actionStats.in_progress);
            console.log('Valor de in_progress:', actionStats.in_progress);
            
            // Verificar se o actionStats está funcionando corretamente
            if (!actionStats || typeof actionStats.total === 'undefined') {
                console.error('Erro: actionStats inválido:', actionStats);
                await executeQuery('ROLLBACK');
                return { success: false, message: 'Erro ao verificar contagem de ações' };
            }
            
            // Converter para números para garantir a comparação correta
            const total = parseInt(actionStats.total || 0);
            const completed = parseInt(actionStats.completed || 0);
            const inProgress = parseInt(actionStats.in_progress || 0);
            const pending = parseInt(actionStats.pending || 0);
            const late = parseInt(actionStats.late || 0);
            
            console.log(`Total de ações: ${total}, Concluídas: ${completed}, Em Andamento: ${inProgress}, Pendentes: ${pending}, Atrasadas: ${late}`);
            
            // Obter o status atual do PDI
            const [pdiStatusResult] = await executeQuery(`
                SELECT status FROM pdi_plans WHERE id = ?
            `, [pdiId]);
            
            if (!pdiStatusResult) {
                console.error('Erro: PDI não encontrado:', pdiId);
                await executeQuery('ROLLBACK');
                return { success: false, message: 'PDI não encontrado' };
            }
            
            const currentStatus = pdiStatusResult.status;
            console.log(`Status atual do PDI: ${currentStatus}`);
            
            // Determinar se o status do PDI precisa ser atualizado
            // De acordo com a regra, PDIs só podem ter os status: Ativo, Concluído ou Cancelado
            let newStatus = currentStatus;
            
            if (total > 0 && total === completed && currentStatus !== 'Concluído') {
                // Todas as ações foram concluídas, atualizar o PDI para 'Concluído'
                newStatus = 'Concluído';
                console.log(`Todas as ${total} ações foram concluídas. Atualizando PDI ${pdiId} para Concluído`);
                
                await executeQuery(`
                    UPDATE pdi_plans 
                    SET 
                        status = 'Concluído',
                        updated_at = ? 
                    WHERE id = ?
                `, [
                    formattedDate,
                    pdiId
                ]);
            } else if ((inProgress > 0 || (completed > 0 && completed < total)) && currentStatus !== 'Ativo') {
                // Se algumas ações estão em andamento ou algumas foram concluídas (mas não todas),
                // considerar o PDI como 'Ativo', já que "Em Andamento" não é um status válido para PDIs
                newStatus = 'Ativo';
                console.log(`Algumas ações estão em progresso. PDI ${pdiId} permanece/atualizado para Ativo`);
                
                // Atualizamos apenas se o status atual for diferente de 'Ativo'
                if (currentStatus !== 'Ativo') {
                    await executeQuery(`
                        UPDATE pdi_plans 
                        SET 
                            status = 'Ativo',
                            updated_at = ? 
                        WHERE id = ?
                    `, [
                        formattedDate,
                        pdiId
                    ]);
                }
            } else {
                console.log(`Status do PDI ${pdiId} permanece como ${currentStatus}`);
            }
            
            // Confirmar a transação
            await executeQuery('COMMIT');
            
            // Calcular indicadores dinâmicos com base no status das ações
            const indicators = {
                totalActions: total,
                completedActions: completed,
                inProgressActions: inProgress,
                pendingActions: pending,
                lateActions: late,
                completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
                progressPercentage: total > 0 ? Math.round(((completed + (inProgress * 0.5)) / total) * 100) : 0
            };
            
            // Determinar se o PDI está "Em Andamento" para indicadores
            // Mesmo que o status oficial seja "Ativo"
            const isPDIInProgress = inProgress > 0;
            const hasPDILateActions = late > 0;
            
            console.log('Indicadores calculados para envio ao frontend:', indicators);
            console.log('PDI está Em Andamento (para indicadores):', isPDIInProgress);
            console.log('PDI tem ações atrasadas:', hasPDILateActions);
            
            return { 
                success: true, 
                pdiStatus: newStatus,
                pdiInProgress: isPDIInProgress,
                hasLateActions: hasPDILateActions,
                actionsTotal: total,
                actionsCompleted: completed,
                actionsInProgress: inProgress,
                actionsPending: pending,
                actionsLate: late,
                indicators: indicators
            };
        } catch (error) {
            console.error('Erro ao atualizar status da ação:', error);
            await executeQuery('ROLLBACK');
            throw error;
        }
    },
    
    // Obter todos os colaboradores ativos para o dropdown de seleção
    getAllActiveCollaborators: async function() {
        const result = await executeQuery(`
            SELECT 
                c.id,
                c.name,
                c.family_name,
                c.job_position,
                MAX(d.name) as department_name
            FROM 
                collaborators c
            LEFT JOIN 
                departments_relations dr ON dr.collaborator_id = c.id
            LEFT JOIN 
                departments d ON d.id = dr.department_id
            WHERE 
                c.resignation_date IS NULL
            GROUP BY 
                c.id, c.name, c.family_name, c.job_position
            ORDER BY 
                c.name ASC
        `);
        
        return result.map(item => ({
            id: item.id,
            name: `${item.name} ${item.family_name}`,
            job_position: item.job_position,
            department: item.department_name
        }));
    },
    
    // Obter todos os colaboradores com cargo de supervisão/coordenação
    getSupervisors: async function() {
        const result = await executeQuery(`
            SELECT 
                c.id,
                c.name,
                c.family_name,
                c.job_position
            FROM 
                collaborators c
            WHERE 
                c.resignation_date IS NULL
                AND (
                    c.job_position LIKE '%supervis%'
                    OR c.job_position LIKE '%coordena%'
                    OR c.job_position LIKE '%líder%'
                    OR c.job_position LIKE '%gerente%'
                    OR c.job_position LIKE '%diretor%'
                )
            ORDER BY 
                c.name ASC
        `);
        
        return result.map(item => ({
            id: item.id,
            name: `${item.name} ${item.family_name}`,
            job_position: item.job_position
        }));
    },
    
    // ==================== Avaliações Mensais ====================
    
    // Obter uma avaliação mensal específica
    getMonthlyEvaluation: async function(pdi_id, month, year) {
        try {
            const result = await executeQuery(`
                SELECT *
                FROM pdi_monthly_evaluations
                WHERE pdi_id = ? AND month = ? AND year = ?
            `, [pdi_id, month, year]);
            
            if (result.length === 0) {
                return null;
            }
            
            return result[0];
        } catch (error) {
            console.error('Erro ao obter avaliação mensal:', error);
            throw error;
        }
    },
    
    // Obter histórico de avaliações
    getEvaluationHistory: async function(pdi_id) {
        try {
            const result = await executeQuery(`
                SELECT *
                FROM pdi_monthly_evaluations
                WHERE pdi_id = ?
                ORDER BY year DESC, month DESC
            `, [pdi_id]);
            
            return result;
        } catch (error) {
            console.error('Erro ao obter histórico de avaliações:', error);
            throw error;
        }
    },
    
    // Salvar avaliação mensal
    saveMonthlyEvaluation: async function(data) {
        try {
            const { 
                pdi_id, month, year, attendance, punctuality, teamwork, 
                creativity, productivity, problem_solving, comments 
            } = data;
            
            const currentDate = new Date();
            const formattedDate = this.formatDateForDatabase(currentDate);
            
            // Verificar se já existe uma avaliação para este mês/ano
            const existing = await this.getMonthlyEvaluation(pdi_id, month, year);
            
            if (existing) {
                // Atualizar a avaliação existente
                await executeQuery(`
                    UPDATE pdi_monthly_evaluations
                    SET 
                        attendance = ?,
                        punctuality = ?,
                        teamwork = ?,
                        creativity = ?,
                        productivity = ?,
                        problem_solving = ?,
                        comments = ?,
                        updated_at = ?
                    WHERE id = ?
                `, [
                    attendance || null,
                    punctuality || null,
                    teamwork || null,
                    creativity || null,
                    productivity || null,
                    problem_solving || null,
                    comments || null,
                    formattedDate,
                    existing.id
                ]);
                
                return { id: existing.id };
            } else {
                // Inserir nova avaliação
                const result = await executeQuery(`
                    INSERT INTO pdi_monthly_evaluations
                    (pdi_id, month, year, attendance, punctuality, teamwork, 
                     creativity, productivity, problem_solving, comments, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    pdi_id,
                    month,
                    year,
                    attendance || null,
                    punctuality || null,
                    teamwork || null,
                    creativity || null,
                    productivity || null,
                    problem_solving || null,
                    comments || null,
                    formattedDate,
                    formattedDate
                ]);
                
                return { id: result.insertId };
            }
        } catch (error) {
            console.error('Erro ao salvar avaliação mensal:', error);
            throw error;
        }
    },
    
    // ==================== Helpers ====================
    
    // Função para formatar data para o banco de dados
    formatDateForDatabase: function(date) {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    
    // Função para formatar data para exibição
    formatDateToPtBr: function(date) {
        if (!date) return null;
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    },

    // Obter indicadores para o dashboard
    getDashboardIndicators: async function(req, res) {
        try {
            // Obtém o ID do usuário da sessão ou do objeto StorageGoogle
            let supervisorId = null;
            if (req.session && req.session.StorageGoogle) {
                supervisorId = req.session.StorageGoogle.system_collaborator_id;
            } else {
                // Tentar obter da query como fallback para testes
                supervisorId = req.query.supervisor_id || null;
            }
            
            // Conecta ao banco de dados
            const conn = await executeQuery('START TRANSACTION');
            
            // 1. Contadores
            const countersQuery = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE 
                        WHEN p.status = 'Concluído' THEN 1 
                        ELSE 0 
                    END) as completed,
                    SUM(CASE 
                        WHEN p.status = 'Ativo' AND EXISTS (
                            SELECT 1 FROM pdi_actions 
                            WHERE pdi_id = p.id AND status = 'Em Andamento'
                        ) THEN 1 
                        ELSE 0 
                    END) as in_progress,
                    SUM(CASE 
                        WHEN p.status = 'Ativo' AND EXISTS (
                            SELECT 1 FROM pdi_actions 
                            WHERE pdi_id = p.id AND deadline < CURDATE() AND status != 'Concluído'
                        ) THEN 1 
                        ELSE 0 
                    END) as late
                FROM pdi_plans p
                ${supervisorId ? 'WHERE supervisor_id = ?' : ''}
            `;
            
            const countersResult = await executeQuery(countersQuery, supervisorId ? [supervisorId] : []);
            console.log('Resultados da contagem PDIs (incluindo Em Andamento):', countersResult);
            
            // 2. Distribuição por perfil
            const profileQuery = `
                SELECT 
                    IFNULL(profile_type, 'Não definido') as profile_type, 
                    COUNT(*) as count
                FROM pdi_plans
                ${supervisorId ? 'WHERE supervisor_id = ?' : ''}
                GROUP BY profile_type
                ORDER BY count DESC
            `;
            
            const profileResults = await executeQuery(profileQuery, supervisorId ? [supervisorId] : []);
            
            // 3. Avaliações mensais (agora agrupadas por mês/ano avaliados, não pela data da avaliação)
            const monthlyQuery = `
                SELECT 
                    year,
                    month,
                    AVG(
                        (IFNULL(attendance, 0) + 
                         IFNULL(punctuality, 0) + 
                         IFNULL(teamwork, 0) + 
                         IFNULL(creativity, 0) + 
                         IFNULL(productivity, 0) + 
                         IFNULL(problem_solving, 0)) / 
                        NULLIF(
                            (CASE WHEN attendance IS NOT NULL THEN 1 ELSE 0 END) +
                            (CASE WHEN punctuality IS NOT NULL THEN 1 ELSE 0 END) +
                            (CASE WHEN teamwork IS NOT NULL THEN 1 ELSE 0 END) +
                            (CASE WHEN creativity IS NOT NULL THEN 1 ELSE 0 END) +
                            (CASE WHEN productivity IS NOT NULL THEN 1 ELSE 0 END) +
                            (CASE WHEN problem_solving IS NOT NULL THEN 1 ELSE 0 END),
                            0
                        )
                    ) as average
                FROM pdi_monthly_evaluations
                WHERE year >= YEAR(DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
                ${supervisorId ? 'AND pdi_id IN (SELECT id FROM pdi_plans WHERE supervisor_id = ?)' : ''}
                GROUP BY year, month
                ORDER BY year, month
                LIMIT 12
            `;
            
            const monthlyResults = await executeQuery(monthlyQuery, supervisorId ? [supervisorId] : []);
            
            // 4. Avaliações recentes
            const recentQuery = `
                SELECT 
                    e.*,
                    p.collaborator_id,
                    c.name as collaborator_name,
                    c.family_name as collaborator_family_name,
                    c.id_headcargo as collaborator_avatar,
                    CONCAT(s.name, ' ', s.family_name) as supervisor_name
                FROM pdi_monthly_evaluations e
                JOIN pdi_plans p ON e.pdi_id = p.id
                JOIN collaborators c ON p.collaborator_id = c.id
                JOIN collaborators s ON p.supervisor_id = s.id
                ${supervisorId ? 'WHERE p.supervisor_id = ?' : ''}
                ORDER BY e.created_at DESC
                LIMIT 10
            `;
            
            const recentResults = await executeQuery(recentQuery, supervisorId ? [supervisorId] : []);
            
            await executeQuery('COMMIT');
            
            // Processar dados para formato adequado
            const counters = {
                total: countersResult[0]?.total || 0,
                inProgress: countersResult[0]?.in_progress || 0,
                completed: countersResult[0]?.completed || 0,
                late: countersResult[0]?.late || 0
            };
            
            const profileDistribution = {
                labels: profileResults.map(p => p.profile_type),
                series: profileResults.map(p => p.count)
            };
            
            const monthNames = [
                'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
            ];
            
            // Ordenar as avaliações por data (mais recentes para mais antigas)
            const sortedMonthlyResults = [...monthlyResults].sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });
            
            const monthlyEvaluations = {
                months: sortedMonthlyResults.map(m => `${monthNames[m.month - 1]}/${m.year}`),
                averages: sortedMonthlyResults.map(m => parseFloat(m.average || 0).toFixed(2))
            };

            // Formatar as avaliações recentes
            const formattedRecentEvaluations = recentResults.map(evaluation => {
                return {
                    ...evaluation,
                    collaborator_name: `${evaluation.collaborator_name} ${evaluation.collaborator_family_name}`,
                    collaborator_avatar: evaluation.collaborator_avatar,
                    created_at: this.formatDateToPtBr(evaluation.created_at)
                };
            });
            
            return {
                counters,
                profileDistribution,
                monthlyEvaluations,
                recentEvaluations: formattedRecentEvaluations
            };
            
        } catch (error) {
            console.error('Erro ao obter indicadores do dashboard:', error);
            await executeQuery('ROLLBACK');
            throw error;
        }
    }
};

module.exports = { 
    pdiHub, 
    PDIHub: pdiHub // Exportar com os dois nomes para compatibilidade
}; 