const { executeQuery } = require('../connect/mysql');
const { sendEmail } = require('../support/send-email');
const { emailCustom } = require('../support/emails-template');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
                created_at: item.created_at,
                updated_at: item.updated_at,
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
                created_at: item.created_at,
                updated_at: item.updated_at
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
            let attachments = [];
            if (action.attachment) {
                try {
                    attachments = JSON.parse(action.attachment);
                    if (!Array.isArray(attachments)) {
                        attachments = [attachments];
                    }
                } catch (e) {
                    attachments = [action.attachment];
                }
            }
            return {
                id: action.id,
                pdi_id: action.pdi_id,
                description: action.description,
                deadline: action.deadline,
                status: action.status,
                completion_date: action.completion_date ? this.formatDateToPtBr(action.completion_date) : null,
                attachment: attachments,
                created_at: this.formatDateToPtBr(action.created_at),
                updated_at: this.formatDateToPtBr(action.updated_at)
            };
        });
        
        // ===== NOVO: Cálculo do nível de desempenho geral =====
        let performance_level = null;
        try {
            const evaluations = await this.getEvaluationHistory(id);
            if (evaluations && evaluations.length > 0) {
                // Calcular média das médias
                const medias = evaluations.map(ev => typeof ev.media === 'number' ? ev.media : null).filter(m => m !== null);
                if (medias.length > 0) {
                    const mediaGeral = medias.reduce((a, b) => a + b, 0) / medias.length;
                    // Buscar níveis de desempenho
                    const levels = await this.getPdiPerformanceLevels(id);
                    if (levels && levels.length > 0) {
                        const percentual = (mediaGeral / 5) * 100;
                        const nivel = levels.find(lvl => percentual >= parseFloat(lvl.min_percentage) && percentual <= parseFloat(lvl.max_percentage));
                        if (nivel) {
                            performance_level = {
                                name: nivel.level_name,
                                color: nivel.color,
                                icon: nivel.icon,
                                percentual: percentual
                            };
                        }
                    }
                }
            }
        } catch (e) {
            // Se der erro, performance_level fica null
            performance_level = null;
        }
        // ===== FIM NOVO =====

        // console.log('performance_level:', performance_level);
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
            actions: formattedActions,
            performance_level
        };
    },
    
    // Criar um novo PDI
    createPDI: async function(form) {
        const created_at = new Date();
        const formattedDate = this.formatDateForDatabase(created_at);
        // Definir start_date e end_date
        const startDate = form.start_date ? form.start_date : formattedDate.split(' ')[0];
        // end_date: 1 ano após start_date
        const endDateObj = new Date(startDate);
        endDateObj.setFullYear(endDateObj.getFullYear() + 1);
        const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
        // Iniciar transação
        await executeQuery('START TRANSACTION');
        
        try {
            // Inserir o PDI
            const pdiResult = await executeQuery(`
                INSERT INTO pdi_plans 
                (collaborator_id, supervisor_id, academic_summary, who_are_you, strengths, improvement_points, 
                development_goals, profile_type, status, created_at, updated_at, start_date, end_date) 
                VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                formattedDate,
                startDate,
                endDate
            ]);
            
            const pdiId = pdiResult.insertId;

            // Inserir fatores padrão na tabela pdi_plan_factors
            const defaultFactors = await executeQuery('SELECT id, default_weight FROM pdi_factors');
            for (const factor of defaultFactors) {
                await executeQuery(
                    'INSERT INTO pdi_plan_factors (pdi_id, factor_id, weight) VALUES (?, ?, ?)',
                    [pdiId, factor.id, factor.default_weight]
                );
            }

            // Inserir níveis de desempenho padrão para o novo PDI
            const defaultLevels = [
                { name: 'Estacionado', min: 0, max: 39.99, icon: 'estacionado.png', color: 'red', order: 1 },
                { name: 'Ajustando a Rota', min: 40, max: 69.99, icon: 'ajustando-rota.png', color: 'orange', order: 2 },
                { name: 'Na Rota', min: 70, max: 89.99, icon: 'na-rota.png', color: 'blue', order: 3 },
                { name: 'Brilhou na Entrega', min: 90, max: 99.99, icon: 'brilhou-na-entrega.png', color: 'green', order: 4 },
                { name: 'Voando Alto', min: 100, max: 120, icon: 'voando-alto.png', color: 'gold', order: 5 }
            ];
            for (const lvl of defaultLevels) {
                await executeQuery(
                    `INSERT INTO pdi_performance_levels 
                    (pdi_id, level_name, min_percentage, max_percentage, icon, color, sort_order) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [pdiId, lvl.name, lvl.min, lvl.max, lvl.icon, lvl.color, lvl.order]
                );
            }
            
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
            const previousStatus = beforeUpdate?.status;
            console.log(`Status da ação ${actionId} ANTES da atualização:`, previousStatus);
            
            // Buscar detalhes completos da ação antes de atualizar (para usar no email)
            const [action] = await executeQuery('SELECT * FROM pdi_actions WHERE id = ?', [actionId]);
            
            // Verificar se o usuário pode alterar o prazo
            let canUpdateDeadline = false;
            if (form.deadline && form.logged_user_id) {
                // Buscar o PDI para verificar se o usuário é o supervisor
                const [pdi] = await executeQuery('SELECT supervisor_id FROM pdi_plans WHERE id = ?', [pdiId]);
                if (pdi && parseInt(pdi.supervisor_id) === parseInt(form.logged_user_id)) {
                    canUpdateDeadline = true;
                    console.log('Usuário é supervisor do PDI, pode alterar o prazo');
                } else {
                    console.log('Usuário não é supervisor do PDI, não pode alterar o prazo');
                }
            }
            
            // Preparar campos para atualização
            let updateFields = ['status = ?', 'completion_date = ?', 'updated_at = ?'];
            let updateValues = [form.status, completion_date, formattedDate];
            
            // Se o prazo (deadline) foi enviado E o usuário tem permissão, adicionar à atualização
            if (form.deadline && canUpdateDeadline) {
                updateFields.push('deadline = ?');
                updateValues.push(form.deadline);
                console.log('Atualizando prazo da ação para:', form.deadline);
            } else if (form.deadline && !canUpdateDeadline) {
                console.log('Tentativa de alterar prazo negada - usuário não é supervisor');
            }
            
            // Adicionar o ID da ação ao final dos valores
            updateValues.push(actionId);
            
            // Atualizar a ação
            await executeQuery(`
                UPDATE pdi_actions 
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `, updateValues);
            
            // Enviar e-mails se a ação foi concluída e o status anterior não era 'Concluído'
            if (form.status === 'Concluído' && previousStatus !== 'Concluído') {
                console.log(`Enviando emails de notificação sobre ação concluída...`);
                // Buscar detalhes da ação, colaborador e supervisor
                const [pdi] = await executeQuery('SELECT collaborator_id, supervisor_id FROM pdi_plans WHERE id = ?', [pdiId]);
                // Buscar ações pendentes desse PDI
                const pendingActions = await executeQuery('SELECT description, deadline, status FROM pdi_actions WHERE pdi_id = ? AND status != \'Concluído\'', [pdiId]);
                const pending_actions = pendingActions.map(a => ({
                    description: a.description,
                    deadline: a.deadline ? (new Date(a.deadline)).toLocaleDateString('pt-BR') : '',
                    status: a.status
                }));
                if (pdi) {
                    // Buscar nome e e-mail do colaborador
                    const [colab] = await executeQuery(`
                        SELECT c.name, c.family_name, u.email
                        FROM collaborators c
                        JOIN users u ON u.collaborator_id = c.id
                        WHERE c.id = ?
                    `, [pdi.collaborator_id]);
                    // Buscar nome e e-mail do supervisor
                    const [superv] = await executeQuery(`
                        SELECT c.name, c.family_name, u.email
                        FROM collaborators c
                        JOIN users u ON u.collaborator_id = c.id
                        WHERE c.id = ?
                    `, [pdi.supervisor_id]);
                    // Montar dados para os templates
                    const data = {
                        collaborator_name: colab ? `${colab.name} ${colab.family_name}` : '',
                        supervisor_name: superv ? `${superv.name} ${superv.family_name}` : '',
                        action_description: action.description,
                        deadline: action.deadline ? (new Date(action.deadline)).toLocaleDateString('pt-BR') : '',
                        completion_date: completion_date ? (new Date(completion_date)).toLocaleDateString('pt-BR') : '',
                        pdi_id: action.pdi_id,
                        pending_actions,
                        motivacional_msg: pending_actions.length > 0 ?
                            'Continue assim! Você está no caminho certo. Finalize as próximas ações para conquistar ainda mais resultados no seu desenvolvimento.' :
                            'Parabéns! Você concluiu todas as ações do seu PDI. Continue buscando o seu melhor!'
                    };
                    // Enviar e-mail para o supervisor
                    if (superv && superv.email) {
                        const htmlSupervisor = require('../support/emails-template').emailCustom.pdiActionCompletedSupervisor({
                            ...data,
                            supervisor_alert: pending_actions.length > 0 ?
                                'Ainda existem ações pendentes para este PDI. Veja abaixo:' :
                                'Todas as ações deste PDI foram concluídas!'
                        });
                        require('../support/send-email').sendEmail(
                            superv.email,
                            'Ação de PDI concluída por colaborador',
                            htmlSupervisor
                        );
                    }
                    // Enviar e-mail de parabéns para o colaborador
                    if (colab && colab.email) {
                        const htmlColab = require('../support/emails-template').emailCustom.pdiActionCompletedCongrats(data);
                        require('../support/send-email').sendEmail(
                            colab.email,
                            'Parabéns pela conclusão de uma ação do seu PDI!',
                            htmlColab
                        );
                    }
                }
            }
            
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
                AND c.name NOT LIKE '%test%'
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
               
            ORDER BY 
                c.name ASC
        `);

        // AND (
        //     c.job_position LIKE '%supervis%'
        //     OR c.job_position LIKE '%coordena%'
        //     OR c.job_position LIKE '%coordi%'
        //     OR c.job_position LIKE '%líder%'
        //     OR c.job_position LIKE '%speci%'
        //     OR c.job_position LIKE '%gerente%'
        //     OR c.job_position LIKE '%diretor%'
        //     OR c.job_position LIKE '%director%'
        //     OR c.job_position LIKE '%head%'
        //     OR c.job_position LIKE '%manag%'
        // )
        
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
    
    // Obter histórico de avaliações (dinâmico, com média e nível)
    getEvaluationHistory: async function(pdi_id) {
        try {
            // Garantir que existam fatores associados ao PDI
            const planFactors = await executeQuery('SELECT COUNT(*) as total FROM pdi_plan_factors WHERE pdi_id = ?', [pdi_id]);
            // console.log('planFactors', planFactors);
            if (planFactors[0].total == 0) {
                console.log('Não existem fatores associados ao PDI. Inserindo fatores padrão...');
                const defaultFactors = await executeQuery('SELECT id, default_weight FROM pdi_factors');
                for (const factor of defaultFactors) {
                    await executeQuery(
                        'INSERT INTO pdi_plan_factors (pdi_id, factor_id, weight) VALUES (?, ?, ?)',
                        [pdi_id, factor.id, factor.default_weight]
                    );
                }
            }

            // Buscar avaliações mensais
            const result = await executeQuery(`
                SELECT *
                FROM pdi_monthly_evaluations
                WHERE pdi_id = ?
                ORDER BY year DESC, month DESC
            `, [pdi_id]);

            // Buscar fatores e pesos do PDI
            const factors = await this.getPdiFactors(pdi_id);

            const factorWeights = {};
            let totalWeight = 0;
            factors.forEach(f => {
                // Usa o peso do plano se existir, senão o peso padrão do fator
                const weight = (f.weight !== undefined && f.weight !== null) ? parseFloat(f.weight) : parseFloat(f.default_weight);
                factorWeights[f.factor_id] = weight;
                totalWeight += weight;
            });

            // Buscar níveis de desempenho do PDI
            const levels = await this.getPdiPerformanceLevels(pdi_id);

            // Para cada avaliação, buscar respostas e calcular média e nível
            for (const evaluation of result) {
                // Buscar respostas dos fatores
                const answers = await executeQuery(`
                    SELECT factor_id, score
                    FROM pdi_evaluation_answers
                    WHERE evaluation_id = ?
                `, [evaluation.id]);

                // Converter score para valor numérico
                const scoreMap = { 'Ótimo': 5, 'Bom': 4, 'Regular': 3, 'Ruim': 2, 'Péssimo': 1 };
                let weightedSum = 0;
                let sumWeights = 0;


                answers.forEach(ans => {
                    if (factorWeights[ans.factor_id] && scoreMap[ans.score]) {
                        weightedSum += scoreMap[ans.score] * factorWeights[ans.factor_id];
                        sumWeights += factorWeights[ans.factor_id];
                    }
                });
                let media = null;

                if (sumWeights > 0) {
                    media = weightedSum / sumWeights;
                }
                evaluation.media = media ? parseFloat(media.toFixed(2)) : null;

                // Determinar nível de desempenho
                let nivel = null;
                if (media !== null && levels && levels.length > 0) {
                    // Calcular percentual (ex: 100% = nota máxima)
                    const percentual = (media / 5) * 100;
                    nivel = levels.find(lvl => percentual >= parseFloat(lvl.min_percentage) && percentual <= parseFloat(lvl.max_percentage));
                }
                evaluation.performance_level = nivel ? {
                    name: nivel.level_name,
                    color: nivel.color,
                    icon: nivel.icon
                } : null;
            }

            // console.log('Histórico de avaliações:', result);
            return result;
        } catch (error) {
            console.error('Erro ao obter histórico de avaliações:', error);
            throw error;
        }
    },
    
    // Salvar avaliação mensal
    saveMonthlyEvaluation: async function(data) {
        try {
            const { pdi_id, month, year, answers, comments } = data;
            const currentDate = new Date();
            const formattedDate = this.formatDateForDatabase(currentDate);

            // 1. Verificar se já existem fatores para este PDI em pdi_plan_factors
            const planFactors = await executeQuery(
                'SELECT COUNT(*) as total FROM pdi_plan_factors WHERE pdi_id = ?',
                [pdi_id]
            );
            if (planFactors[0].total === 0) {
                // Buscar todos os fatores padrão
                const defaultFactors = await executeQuery('SELECT id, default_weight FROM pdi_factors');
                // Inserir cada fator padrão em pdi_plan_factors para este PDI
                for (const factor of defaultFactors) {
                    await executeQuery(
                        'INSERT INTO pdi_plan_factors (pdi_id, factor_id, weight) VALUES (?, ?, ?)',
                        [pdi_id, factor.id, factor.default_weight]
                    );
                }
            }

            // Verificar se já existe avaliação
            const existing = await executeQuery(
                'SELECT id FROM pdi_monthly_evaluations WHERE pdi_id = ? AND month = ? AND year = ?',
                [pdi_id, month, year]
            );
            let evaluationId;
            if (existing.length > 0) {
                evaluationId = existing[0].id;
                // Atualizar avaliação
                await executeQuery(
                    'UPDATE pdi_monthly_evaluations SET comments = ?, updated_at = ? WHERE id = ?',
                    [comments || null, formattedDate, evaluationId]
                );
                // Apagar respostas antigas
                await executeQuery('DELETE FROM pdi_evaluation_answers WHERE evaluation_id = ?', [evaluationId]);
            } else {
                // Inserir nova avaliação
                const result = await executeQuery(
                    'INSERT INTO pdi_monthly_evaluations (pdi_id, month, year, comments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [pdi_id, month, year, comments || null, formattedDate, formattedDate]
                );
                evaluationId = result.insertId;
            }
            // Inserir respostas por fator
            if (answers && Array.isArray(answers)) {
                for (const ans of answers) {
                    await executeQuery(
                        'INSERT INTO pdi_evaluation_answers (evaluation_id, factor_id, score) VALUES (?, ?, ?)',
                        [evaluationId, ans.factor_id, ans.score]
                    );
                }
            }
            return { id: evaluationId };
        } catch (error) {
            console.error('Erro ao salvar avaliação mensal dinâmica:', error);
            throw error;
        }
    },
    
    // ==================== Fatores e Níveis Dinâmicos ====================

    // Buscar fatores e pesos de um PDI
    getPdiFactors: async function(pdi_id) {
        // Retorna fatores e pesos associados ao PDI
        const result = await executeQuery(`
            SELECT pf.id as plan_factor_id, f.id as factor_id, f.name, f.description, pf.weight
            FROM pdi_plan_factors pf
            JOIN pdi_factors f ON pf.factor_id = f.id
            WHERE pf.pdi_id = ?
            ORDER BY pf.id
        `, [pdi_id]);
        return result;
    },

    // Buscar níveis de desempenho de um PDI
    getPdiPerformanceLevels: async function(pdi_id) {
        const result = await executeQuery(`
            SELECT id, level_name, min_percentage, max_percentage, icon, color, sort_order
            FROM pdi_performance_levels
            WHERE pdi_id = ?
            ORDER BY sort_order ASC, min_percentage ASC
        `, [pdi_id]);
        return result;
    },

    // ==================== Avaliação Mensal Dinâmica ====================

    // Buscar avaliação mensal dinâmica (com respostas por fator)
    getMonthlyEvaluation: async function(pdi_id, month, year) {
        try {
            const [evaluation] = await executeQuery(`
                SELECT * FROM pdi_monthly_evaluations WHERE pdi_id = ? AND month = ? AND year = ?
            `, [pdi_id, month, year]);
            if (!evaluation) return null;
            // Buscar respostas por fator
            const answers = await executeQuery(`
                SELECT a.id, a.factor_id, f.name, f.description, a.score
                FROM pdi_evaluation_answers a
                JOIN pdi_factors f ON a.factor_id = f.id
                WHERE a.evaluation_id = ?
            `, [evaluation.id]);
            evaluation.answers = answers;
            return evaluation;
        } catch (error) {
            console.error('Erro ao obter avaliação mensal dinâmica:', error);
            throw error;
        }
    },

    // Salvar avaliação mensal dinâmica (respostas por fator)
    saveMonthlyEvaluation: async function(data) {
        try {
            const { pdi_id, month, year, answers, comments } = data;
            const currentDate = new Date();
            const formattedDate = this.formatDateForDatabase(currentDate);

            // 1. Verificar se já existem fatores para este PDI em pdi_plan_factors
            const planFactors = await executeQuery(
                'SELECT COUNT(*) as total FROM pdi_plan_factors WHERE pdi_id = ?',
                [pdi_id]
            );
            if (planFactors[0].total === 0) {
                // Buscar todos os fatores padrão
                const defaultFactors = await executeQuery('SELECT id, default_weight FROM pdi_factors');
                // Inserir cada fator padrão em pdi_plan_factors para este PDI
                for (const factor of defaultFactors) {
                    await executeQuery(
                        'INSERT INTO pdi_plan_factors (pdi_id, factor_id, weight) VALUES (?, ?, ?)',
                        [pdi_id, factor.id, factor.default_weight]
                    );
                }
            }

            // Verificar se já existe avaliação
            const existing = await executeQuery(
                'SELECT id FROM pdi_monthly_evaluations WHERE pdi_id = ? AND month = ? AND year = ?',
                [pdi_id, month, year]
            );
            let evaluationId;
            if (existing.length > 0) {
                evaluationId = existing[0].id;
                // Atualizar avaliação
                await executeQuery(
                    'UPDATE pdi_monthly_evaluations SET comments = ?, updated_at = ? WHERE id = ?',
                    [comments || null, formattedDate, evaluationId]
                );
                // Apagar respostas antigas
                await executeQuery('DELETE FROM pdi_evaluation_answers WHERE evaluation_id = ?', [evaluationId]);
            } else {
                // Inserir nova avaliação
                const result = await executeQuery(
                    'INSERT INTO pdi_monthly_evaluations (pdi_id, month, year, comments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [pdi_id, month, year, comments || null, formattedDate, formattedDate]
                );
                evaluationId = result.insertId;
            }
            // Inserir respostas por fator
            if (answers && Array.isArray(answers)) {
                for (const ans of answers) {
                    await executeQuery(
                        'INSERT INTO pdi_evaluation_answers (evaluation_id, factor_id, score) VALUES (?, ?, ?)',
                        [evaluationId, ans.factor_id, ans.score]
                    );
                }
            }
            return { id: evaluationId };
        } catch (error) {
            console.error('Erro ao salvar avaliação mensal dinâmica:', error);
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
                        WHEN EXISTS (
                            SELECT 1 FROM pdi_actions 
                            WHERE pdi_id = p.id AND status = 'Em Andamento'
                        )
                        AND NOT EXISTS (
                            SELECT 1 FROM pdi_actions 
                            WHERE pdi_id = p.id AND deadline < CURDATE() AND status NOT IN ('Concluído', 'Cancelado')
                        )
                        THEN 1 
                        ELSE 0 
                    END) as in_progress,
                    SUM(CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM pdi_actions 
                            WHERE pdi_id = p.id AND deadline < CURDATE() AND status NOT IN ('Concluído', 'Cancelado')
                        ) THEN 1 
                        ELSE 0 
                    END) as late
                FROM pdi_plans p
                ${supervisorId ? 'WHERE supervisor_id = ?' : ''}
            `;
            
            const countersResult = await executeQuery(countersQuery, supervisorId ? [supervisorId] : []);
            // console.log('Resultados da contagem PDIs (incluindo Em Andamento):', countersResult);
            
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
                    e.year,
                    e.month,
                    AVG(
                        CASE 
                            WHEN a.score = 'Ótimo' THEN 5
                            WHEN a.score = 'Bom' THEN 4
                            WHEN a.score = 'Regular' THEN 3
                            WHEN a.score = 'Ruim' THEN 2
                            WHEN a.score = 'Péssimo' THEN 1
                            ELSE NULL
                        END
                    ) as average
                FROM pdi_monthly_evaluations e
                JOIN pdi_evaluation_answers a ON a.evaluation_id = e.id
                WHERE e.year >= YEAR(DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
                ${supervisorId ? 'AND e.pdi_id IN (SELECT id FROM pdi_plans WHERE supervisor_id = ?)' : ''}
                GROUP BY e.year, e.month
                ORDER BY e.year, e.month
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

            // Calcular média para cada avaliação recente
            for (const evaluation of recentResults) {
                // Buscar respostas dos fatores
                const answers = await executeQuery(`
                    SELECT factor_id, score
                    FROM pdi_evaluation_answers
                    WHERE evaluation_id = ?
                `, [evaluation.id]);
                // Converter score para valor numérico
                const scoreMap = { 'Ótimo': 5, 'Bom': 4, 'Regular': 3, 'Ruim': 2, 'Péssimo': 1 };
                let sum = 0, count = 0;
                for (const ans of answers) {
                    if (scoreMap[ans.score]) {
                        sum += scoreMap[ans.score];
                        count++;
                    }
                }
                evaluation.media = count > 0 ? parseFloat((sum / count).toFixed(2)) : null;
            }

            await executeQuery('COMMIT');
            
            // Processar dados para formato adequado
            const counters = {
                total: countersResult[0]?.total || 0,
                inProgress: countersResult[0]?.in_progress || 0,
                completed: countersResult[0]?.completed || 0,
                late: countersResult[0]?.late || 0
            };
            
            // Garantir que temos dados válidos
            if (!profileResults || profileResults.length === 0) {
                profileResults = [
                    { profile_type: 'Não definido', count: 1 }
                ];
            }
            
            const profileDistribution = {
                labels: profileResults.map(p => p.profile_type || 'Não definido'),
                series: profileResults.map(p => parseInt(p.count) || 0)
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
                    created_at: evaluation.created_at // manter formato original para o frontend formatar
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
    },

    // Adicionar nova ação ao PDI
    addAction: async function(req, res) {
        try {
            const { pdi_id, description, deadline } = req.body;
            if (!pdi_id || !description || !deadline) {
                return res.status(400).json({ success: false, message: 'Dados obrigatórios não informados.' });
            }
            const now = new Date();
            const formattedDate = this.formatDateForDatabase ? this.formatDateForDatabase(now) : now.toISOString().slice(0, 19).replace('T', ' ');
            const result = await executeQuery(
                'INSERT INTO pdi_actions (pdi_id, description, deadline, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [pdi_id, description, deadline, 'Pendente', formattedDate, formattedDate]
            );
            return res.json({ success: true, actionId: result.insertId });
        } catch (error) {
            console.error('Erro ao adicionar ação:', error);
            return res.status(500).json({ success: false, message: 'Erro ao adicionar ação.' });
        }
    },

    // Salvar anexos e status da ação de forma transacional
    saveActionAttachments: async function(req, res) {
        try {
            console.log('===== INÍCIO DO PROCESSO DE SALVAMENTO DE ANEXOS =====');
            console.log('Body completo recebido:', req.body);
            
            const actionId = req.body.actionId;
            const pdiId = req.body.pdiId;
            
            // Verificações iniciais
            if (!actionId) {
                console.error('ID da ação não informado');
                return res.status(400).json({ success: false, message: 'ID da ação não informado.' });
            }
            
            // ATENÇÃO: Múltiplos métodos para capturar filesToKeep
            let filesToKeep = [];
            
            // Método 1: Verificar todas as chaves do req.body para encontrar 'filesToKeep[]'
            for (let key in req.body) {
                // Verificar se a chave é 'filesToKeep[]' ou contém esse nome (alguns frameworks alteram o nome)
                if (key === 'filesToKeep[]' || key.startsWith('filesToKeep[') || key === 'filesToKeep') {
                    const value = req.body[key];
                    
                    // Se for array, unir com o que já temos
                    if (Array.isArray(value)) {
                        filesToKeep = [...filesToKeep, ...value];
                    } 
                    // Se for string, adicionar ao array
                    else if (value) {
                        filesToKeep.push(value);
                    }
                }
            }
            
            // Método 2: Verificar se há um campo JSON alternativo
            if (req.body.filesToKeepJSON) {
                try {
                    const jsonFiles = JSON.parse(req.body.filesToKeepJSON);
                    if (Array.isArray(jsonFiles)) {
                        // Adicionar apenas os não duplicados
                        jsonFiles.forEach(file => {
                            if (!filesToKeep.includes(file)) {
                                filesToKeep.push(file);
                            }
                        });
                    }
                    console.log('Arquivos recuperados de filesToKeepJSON:', jsonFiles);
                } catch (e) {
                    console.error('Erro ao parsear filesToKeepJSON:', e);
                }
            }
            
            // Garantir que não há duplicatas
            filesToKeep = [...new Set(filesToKeep)];
            
            console.log(`Arquivos a manter (client - original): `, req.body['filesToKeep[]']);
            console.log(`Arquivos a manter (client - processado final): [${filesToKeep.join(', ')}]`);
            
            // Capturar novos uploads
            const filesUploaded = req.files ? req.files.map(f => f.filename) : [];
            console.log(`Novos uploads (client): [${filesUploaded.join(', ')}]`);
            
            // Buscar anexos antigos e status anterior
            const [action] = await executeQuery(
                'SELECT attachment, status, description, deadline, completion_date, pdi_id FROM pdi_actions WHERE id = ?', 
                [actionId]
            );
            
            if (!action) {
                console.error(`Ação com ID ${actionId} não encontrada`);
                return res.status(404).json({ success: false, message: 'Ação não encontrada.' });
            }
            
            let oldAttachments = [];
            let previousStatus = action.status;
            
            // Extrair anexos antigos do banco
            if (action.attachment) {
                try {
                    oldAttachments = JSON.parse(action.attachment);
                    if (!Array.isArray(oldAttachments)) {
                        oldAttachments = [oldAttachments];
                    }
                } catch (e) {
                    console.error('Erro ao parsear anexos antigos:', e);
                    oldAttachments = action.attachment ? [action.attachment] : [];
                }
            }
            
            console.log(`Anexos antigos no banco: [${oldAttachments.join(', ')}]`);
            
            // Calcular lista final de anexos: aqueles que o cliente quer manter + novos uploads
            const finalAttachments = [...new Set([...filesToKeep, ...filesUploaded])];
            console.log(`Lista final de anexos: [${finalAttachments.join(', ')}]`);
            
            // Remover fisicamente os arquivos que não estão mais na lista final
            const toRemove = oldAttachments.filter(f => !finalAttachments.includes(f));
            console.log(`Arquivos a remover fisicamente: [${toRemove.join(', ')}]`);
            
            for (const filename of toRemove) {
                if (!filename) continue;
                
                try {
                    const filePath = path.join(__dirname, '..', '..', 'uploads', 'pdi-hub', 'attachment_actions', filename);
                    console.log(`Tentando remover arquivo: ${filePath}`);
                    
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Arquivo removido com sucesso: ${filename}`);
                    } else {
                        console.log(`Arquivo não encontrado para remoção: ${filename}`);
                    }
                } catch (err) {
                    console.error(`Erro ao remover arquivo ${filename}:`, err);
                }
            }
            
            // Definir status da ação baseado na lógica de negócio
            let statusToSet = req.body.status || 'Em Andamento';
            let completionDateToSet = null;
            
            console.log(`Status solicitado pelo cliente: ${statusToSet}`);
            console.log(`Total de anexos finais: ${finalAttachments.length}`);
            
            // REGRA ATUALIZADA: Respeitar o status enviado pelo cliente
            // Só aplicar a regra de anexos se o status não foi explicitamente definido
            if (!req.body.status) {
                // Se não foi enviado status, aplicar regra baseada em anexos
                if (finalAttachments.length > 0) {
                    statusToSet = 'Concluído';
                    completionDateToSet = new Date();
                    console.log(`Status definido como 'Concluído' pois há anexos e nenhum status foi especificado.`);
                } else {
                    statusToSet = 'Em Andamento';
                    completionDateToSet = null;
                    console.log(`Status definido como 'Em Andamento' pois não há anexos e nenhum status foi especificado.`);
                }
            } else {
                // Respeitar o status enviado pelo cliente
                if (statusToSet === 'Concluído') {
                    completionDateToSet = req.body.completion_date || new Date();
                }
                console.log(`Mantendo status enviado pelo cliente: ${statusToSet}`);
            }
            
            // Verificar se o usuário pode alterar o prazo (deadline)
            let updateDeadline = false;
            let deadlineValue = action.deadline; // Manter o deadline atual por padrão
            
            if (req.body.deadline && req.body.logged_user_id) {
                // Buscar o PDI para verificar se o usuário é o supervisor
                const [pdi] = await executeQuery('SELECT supervisor_id FROM pdi_plans WHERE id = ?', [pdiId]);
                if (pdi && parseInt(pdi.supervisor_id) === parseInt(req.body.logged_user_id)) {
                    updateDeadline = true;
                    deadlineValue = req.body.deadline;
                    console.log('Usuário é supervisor do PDI, atualizando prazo para:', deadlineValue);
                } else {
                    console.log('Usuário não é supervisor do PDI, mantendo prazo atual');
                }
            }
            
            console.log(`Status final a ser salvo: ${statusToSet}`);
            console.log(`Data de conclusão: ${completionDateToSet}`);
            console.log(`Prazo a ser salvo: ${deadlineValue}`);
            
            // Iniciar uma transação para garantir consistência
            await executeQuery('START TRANSACTION');
            
            try {
                // Atualizar o campo attachment, status, completion_date e deadline no banco
                await executeQuery(
                    'UPDATE pdi_actions SET attachment = ?, status = ?, completion_date = ?, deadline = ? WHERE id = ?',
                    [
                        finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : null,
                        statusToSet,
                        completionDateToSet,
                        deadlineValue,
                        actionId
                    ]
                );
                
                console.log(`Ação ${actionId} atualizada com sucesso no banco`);
                
                // Enviar e-mails se a ação foi concluída e o status anterior não era 'Concluído'
                if (statusToSet === 'Concluído' && previousStatus !== 'Concluído') {
                    console.log(`Enviando emails de notificação sobre ação concluída...`);
                    // Buscar detalhes da ação, colaborador e supervisor
                    const [pdi] = await executeQuery('SELECT collaborator_id, supervisor_id FROM pdi_plans WHERE id = ?', [pdiId]);
                    // Buscar ações pendentes desse PDI
                    const pendingActions = await executeQuery('SELECT description, deadline, status FROM pdi_actions WHERE pdi_id = ? AND status != \'Concluído\'', [pdiId]);
                    const pending_actions = pendingActions.map(a => ({
                        description: a.description,
                        deadline: a.deadline ? (new Date(a.deadline)).toLocaleDateString('pt-BR') : '',
                        status: a.status
                    }));
                    if (pdi) {
                        // Buscar nome e e-mail do colaborador
                        const [colab] = await executeQuery(`
                            SELECT c.name, c.family_name, u.email
                            FROM collaborators c
                            JOIN users u ON u.collaborator_id = c.id
                            WHERE c.id = ?
                        `, [pdi.collaborator_id]);
                        // Buscar nome e e-mail do supervisor
                        const [superv] = await executeQuery(`
                            SELECT c.name, c.family_name, u.email
                            FROM collaborators c
                            JOIN users u ON u.collaborator_id = c.id
                            WHERE c.id = ?
                        `, [pdi.supervisor_id]);
                        // Montar dados para os templates
                        const data = {
                            collaborator_name: colab ? `${colab.name} ${colab.family_name}` : '',
                            supervisor_name: superv ? `${superv.name} ${superv.family_name}` : '',
                            action_description: action.description,
                            deadline: action.deadline ? (new Date(action.deadline)).toLocaleDateString('pt-BR') : '',
                            completion_date: completionDateToSet ? (new Date(completionDateToSet)).toLocaleDateString('pt-BR') : '',
                            pdi_id: action.pdi_id,
                            pending_actions,
                            motivacional_msg: pending_actions.length > 0 ?
                                'Continue assim! Você está no caminho certo. Finalize as próximas ações para conquistar ainda mais resultados no seu desenvolvimento.' :
                                'Parabéns! Você concluiu todas as ações do seu PDI. Continue buscando o seu melhor!'
                        };
                        // Enviar e-mail para o supervisor
                        if (superv && superv.email) {
                            const htmlSupervisor = require('../support/emails-template').emailCustom.pdiActionCompletedSupervisor({
                                ...data,
                                supervisor_alert: pending_actions.length > 0 ?
                                    'Ainda existem ações pendentes para este PDI. Veja abaixo:' :
                                    'Todas as ações deste PDI foram concluídas!'
                            });
                            require('../support/send-email').sendEmail(
                                superv.email,
                                'Ação de PDI concluída por colaborador',
                                htmlSupervisor
                            );
                        }
                        // Enviar e-mail de parabéns para o colaborador
                        if (colab && colab.email) {
                            const htmlColab = require('../support/emails-template').emailCustom.pdiActionCompletedCongrats(data);
                            require('../support/send-email').sendEmail(
                                colab.email,
                                'Parabéns pela conclusão de uma ação do seu PDI!',
                                htmlColab
                            );
                        }
                    }
                }
                
                // Assumir confirmação da transação quando não houver erros
                await executeQuery('COMMIT');
                console.log(`Transação confirmada com sucesso`);
            } catch (error) {
                console.error('Erro durante a atualização da ação:', error);
                await executeQuery('ROLLBACK');
                throw error;
            }
            
            // Calcular indicadores atualizados para retornar ao cliente
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
            
            // Converter para números para garantir a comparação correta
            const total = parseInt(actionStats.total || 0);
            const completed = parseInt(actionStats.completed || 0);
            const inProgress = parseInt(actionStats.in_progress || 0);
            const pending = parseInt(actionStats.pending || 0);
            const late = parseInt(actionStats.late || 0);
            
            // Verificar se todas as ações foram concluídas para atualizar status do PDI
            let pdiStatus = '';
            if (total > 0 && total === completed) {
                await executeQuery(`
                    UPDATE pdi_plans 
                    SET status = 'Concluído', updated_at = NOW() 
                    WHERE id = ?
                `, [pdiId]);
                pdiStatus = 'Concluído';
                console.log(`Todas as ações concluídas, PDI ${pdiId} atualizado para 'Concluído'`);
            } else {
                await executeQuery(`
                    UPDATE pdi_plans 
                    SET status = 'Ativo', updated_at = NOW() 
                    WHERE id = ?
                `, [pdiId]);
                pdiStatus = 'Ativo';
                console.log(`Nem todas as ações concluídas, PDI ${pdiId} mantido como 'Ativo'`);
            }
            
            // Calcular indicadores para o frontend
            const indicators = {
                totalActions: total,
                completedActions: completed,
                inProgressActions: inProgress,
                pendingActions: pending,
                lateActions: late,
                completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
                progressPercentage: total > 0 ? Math.round(((completed + (inProgress * 0.5)) / total) * 100) : 0
            };
            
            console.log(`Indicadores calculados: ${JSON.stringify(indicators)}`);
            console.log('===== FIM DO PROCESSO DE SALVAMENTO DE ANEXOS =====');
            
            return { 
                success: true, 
                pdiStatus: pdiStatus,
                pdiInProgress: inProgress > 0,
                hasLateActions: late > 0,
                actionsTotal: total,
                actionsCompleted: completed,
                actionsInProgress: inProgress,
                actionsPending: pending,
                actionsLate: late,
                indicators: indicators,
                attachments: finalAttachments
            };
        } catch (error) {
            console.error('Erro ao salvar anexos e status da ação:', error);
            await executeQuery('ROLLBACK');
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao salvar anexos/status da ação', 
                error: error.message 
            });
        }
    },

    // Obter todos os fatores padrão de avaliação
    getAllFactors: async function() {
        const result = await executeQuery('SELECT id, name, description FROM pdi_factors ORDER BY id');
        return result;
    },

    // Listar todas as ações dos PDIs do supervisor
    getAllActions: async function(supervisorId, statusFilter = null) {
        try {
            // Buscar todas as ações dos PDIs do supervisor
            let query = `
                SELECT 
                    a.id,
                    a.pdi_id,
                    a.description,
                    a.deadline,
                    a.status,
                    a.completion_date,
                    c.name as collaborator_name,
                    c.family_name as collaborator_family_name
                FROM pdi_actions a
                JOIN pdi_plans p ON a.pdi_id = p.id
                JOIN collaborators c ON p.collaborator_id = c.id
                WHERE p.supervisor_id = ?
            `;
            const params = [supervisorId];
            if (statusFilter && statusFilter !== 'Todos') {
                query += ' AND a.status = ?';
                params.push(statusFilter);
            }
            query += ' ORDER BY a.deadline DESC';
            const actions = await executeQuery(query, params);
            // Formatar nome completo do colaborador
            actions.forEach(a => {
                a.collaborator_name = `${a.collaborator_name} ${a.collaborator_family_name}`;
            });
            return actions;
        } catch (error) {
            console.error('Erro ao buscar ações dos PDIs do supervisor:', error);
            throw error;
        }
    },

    // Listar todas as ações dos PDIs (sem filtro de supervisor)
    getAllActionsGlobal: async function(statusFilter = null) {
        try {
            let query = `
                SELECT 
                    a.id,
                    a.pdi_id,
                    a.description,
                    a.deadline,
                    a.status,
                    a.completion_date,
                    c.name as collaborator_name,
                    c.family_name as collaborator_family_name
                FROM pdi_actions a
                JOIN pdi_plans p ON a.pdi_id = p.id
                JOIN collaborators c ON p.collaborator_id = c.id
            `;
            const params = [];
            if (statusFilter && statusFilter !== 'Todos') {
                query += ' WHERE a.status = ?';
                params.push(statusFilter);
            }
            query += ' ORDER BY a.deadline DESC';
            const actions = await executeQuery(query, params);
            actions.forEach(a => {
                a.collaborator_name = `${a.collaborator_name} ${a.collaborator_family_name}`;
            });
            return actions;
        } catch (error) {
            console.error('Erro ao buscar todas as ações dos PDIs:', error);
            throw error;
        }
    }
};

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'pdi-hub', 'attachment_actions');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Função para processar upload de anexo (NÃO atualiza o banco)
async function uploadActionAttachment(req, res) {
    try {
        // Apenas salva o(s) arquivo(s) no servidor, não atualiza o campo attachment
        let files = req.files.map(f => f.filename);
        if (!Array.isArray(files)) {
            files = files ? [files] : [];
        }
        res.json({ success: true, files });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao salvar anexo', error: error.message });
    }
}

module.exports = { 
    pdiHub, 
    PDIHub: pdiHub,
    upload,
    uploadActionAttachment
}; 