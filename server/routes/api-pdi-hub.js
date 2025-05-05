const express = require('express');
const router = express.Router();
const path = require('path');
const { pdiHub, upload, uploadActionAttachment } = require('../controllers/pdi-hub');

// Exportar como uma função que recebe o objeto io
module.exports = function(io) {
    // Middleware para verificar autenticação
    function checkAuth(req, res, next) {
        // if (!req.session || !req.session.user) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Usuário não autenticado'
        //     });
        // }
        next();
    }
    
    // Middleware para garantir que campos de array sejam sempre tratados como arrays
    function ensureArrays(req, res, next) {
        // Verificar campos que devem ser arrays
        const arrayFields = ['filesToKeep[]'];
        
        arrayFields.forEach(field => {
            // Verificar todas as chaves que podem corresponder ao campo de array
            Object.keys(req.body).forEach(key => {
                // Se o campo existe e não é um array, converter para array
                if ((key === field || key.startsWith(field.replace('[]', '['))) && req.body[key] && !Array.isArray(req.body[key])) {
                    console.log(`Convertendo campo ${key} para array`);
                    req.body[key] = [req.body[key]];
                }
            });
        });
        
        next();
    }
    
    // ------------------- PDIs -------------------
    
    // Obter todos os PDIs
    router.get('/getAllPDIs', async (req, res) => {
        try {
            const supervisor_id = req.query.supervisor_id;
            const pdis = await pdiHub.getAllPDIs(supervisor_id);
            
            res.json({
                success: true,
                data: pdis
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter PDIs: ' + error.message
            });
        }
    });
    
    // Obter PDIs por colaborador
    router.get('/getPDIsByCollaborator', async (req, res) => {
        try {
            const collaborator_id = req.query.collaborator_id;
            
            if (!collaborator_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do colaborador não informado'
                });
            }
            
            const pdis = await pdiHub.getPDIsByCollaborator(collaborator_id);
            res.json({
                success: true,
                data: pdis
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter PDIs do colaborador: ' + error.message
            });
        }
    });
    
    // Obter detalhes de um PDI específico
    router.post('/getPDIView', async (req, res) => {
        try {
            const id = req.body.id;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do PDI não informado'
                });
            }
            
            const pdi = await pdiHub.getPDIView(id);
            
            if (!pdi) {
                return res.status(404).json({
                    success: false,
                    message: 'PDI não encontrado'
                });
            }
            
            res.json({
                success: true,
                data: pdi
            });
        } catch (error) {
            console.error('Erro ao obter detalhes do PDI:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter detalhes do PDI: ' + error.message
            });
        }
    });
    
    // Criar um novo PDI
    router.post('/createPDI', async (req, res) => {
        try {
            const result = await pdiHub.createPDI(req.body);
            res.json({
                success: true,
                message: 'PDI criado com sucesso',
                id: result.id
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao criar PDI: ' + error.message
            });
        }
    });
    
    // Atualizar um PDI existente
    router.post('/updatePDI', async (req, res) => {
        try {
            const result = await pdiHub.updatePDI(req.body);
            res.json({
                success: true,
                message: 'PDI atualizado com sucesso',
                id: result.id
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar PDI: ' + error.message
            });
        }
    });
    
    // Deletar um PDI e remover arquivos físicos de todas as ações vinculadas
    router.post('/deletePDI', async (req, res) => {
        try {
            const id = req.body.id;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do PDI não informado'
                });
            }
            // Buscar todas as ações do PDI
            const actions = await require('../connect/mysql').executeQuery('SELECT attachment FROM pdi_actions WHERE pdi_id = ?', [id]);
            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(__dirname, '../../uploads/pdi-hub/attachment_actions');
            for (const action of actions) {
                let attachments = [];
                if (action && action.attachment) {
                    try {
                        attachments = JSON.parse(action.attachment);
                        if (!Array.isArray(attachments)) attachments = [attachments];
                    } catch (e) {
                        attachments = [action.attachment];
                    }
                }
                for (const filename of attachments) {
                    if (!filename) continue;
                    const filePath = path.join(uploadDir, filename);
                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                            console.log('Arquivo removido ao deletar PDI:', filePath);
                        } catch (err) {
                            console.error('Erro ao remover arquivo ao deletar PDI:', err);
                        }
                    }
                }
            }
            // Deletar o PDI (e ações, se não houver ON DELETE CASCADE)
            await pdiHub.deletePDI(id);
            res.json({
                success: true,
                message: 'PDI excluído com sucesso'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao excluir PDI: ' + error.message
            });
        }
    });
    
    // Atualizar status de uma ação de PDI
    router.post('/updatePDIActionStatus', async (req, res) => {
        try {
            console.log('Recebida requisição para atualizar status da ação:', req.body);
            
            // Validar dados
            if (!req.body.action_id || !req.body.pdi_id || !req.body.status) {
                console.error('Erro: Dados incompletos', req.body);
                return res.status(400).json({
                    success: false,
                    message: 'Dados incompletos. É necessário informar action_id, pdi_id e status.'
                });
            }
            
            // Chamar o controller
            const result = await pdiHub.updatePDIActionStatus(req.body);
            console.log('Status da ação atualizado com sucesso:', result);
            
            res.json({
                success: true,
                message: 'Status da ação atualizado com sucesso',
                pdiStatus: result.pdiStatus,
                pdiInProgress: result.pdiInProgress,
                hasLateActions: result.hasLateActions,
                actionsTotal: result.actionsTotal,
                actionsCompleted: result.actionsCompleted,
                actionsInProgress: result.actionsInProgress,
                actionsPending: result.actionsPending,
                actionsLate: result.actionsLate,
                indicators: result.indicators
            });
        } catch (error) {
            console.error('Erro ao atualizar status da ação:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar status da ação: ' + error.message
            });
        }
    });
    
    // Obter todos os colaboradores ativos
    router.get('/getAllActiveCollaborators', async (req, res) => {
        try {
            const collaborators = await pdiHub.getAllActiveCollaborators();
            res.json({
                success: true,
                data: collaborators
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter colaboradores: ' + error.message
            });
        }
    });
    
    // Obter todos os supervisores
    router.get('/getSupervisors', async (req, res) => {
        try {
            const supervisors = await pdiHub.getSupervisors();
            res.json({
                success: true,
                data: supervisors
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter supervisores: ' + error.message
            });
        }
    });
    
    // ------------------- Avaliações Mensais -------------------
    
    // Obter uma avaliação mensal específica
    router.get('/getMonthlyEvaluation', async (req, res) => {
        try {
            const pdi_id = req.query.pdi_id;
            const month = req.query.month;
            const year = req.query.year;
            
            if (!pdi_id || !month || !year) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do PDI, mês e ano são obrigatórios'
                });
            }
            
            const evaluation = await pdiHub.getMonthlyEvaluation(pdi_id, month, year);
            
            res.json({
                success: true,
                data: evaluation
            });
        } catch (error) {
            console.error('Erro ao obter avaliação mensal:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter avaliação mensal: ' + error.message
            });
        }
    });
    
    // Obter histórico de avaliações
    router.get('/getEvaluationHistory', async (req, res) => {
        try {
            const pdi_id = req.query.pdi_id;
            
            if (!pdi_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do PDI é obrigatório'
                });
            }
            
            const evaluations = await pdiHub.getEvaluationHistory(pdi_id);
            
            res.json({
                success: true,
                data: evaluations
            });
        } catch (error) {
            console.error('Erro ao obter histórico de avaliações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter histórico de avaliações: ' + error.message
            });
        }
    });
    
    // Salvar avaliação mensal
    router.post('/saveMonthlyEvaluation', async (req, res) => {
        try {
            const result = await pdiHub.saveMonthlyEvaluation(req.body);
            
            res.json({
                success: true,
                message: 'Avaliação mensal salva com sucesso',
                id: result.id
            });
        } catch (error) {
            console.error('Erro ao salvar avaliação mensal:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao salvar avaliação mensal: ' + error.message
            });
        }
    });
    
    // Obter indicadores do dashboard
    router.get('/getDashboardIndicators', async (req, res) => {
        try {
            const result = await pdiHub.getDashboardIndicators(req, res);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Erro ao obter indicadores do dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter indicadores do dashboard: ' + error.message
            });
        }
    });
    
    // ------------------- Fatores e Níveis Dinâmicos -------------------
    
    // Buscar fatores e pesos de um PDI
    router.get('/getPdiFactors', async (req, res) => {
        try {
            const pdi_id = req.query.pdi_id;
            if (!pdi_id) {
                return res.status(400).json({ success: false, message: 'ID do PDI não informado' });
            }
            const factors = await pdiHub.getPdiFactors(pdi_id);
            res.json({ success: true, data: factors });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao buscar fatores: ' + error.message });
        }
    });

    // Buscar níveis de desempenho de um PDI
    router.get('/getPdiPerformanceLevels', async (req, res) => {
        try {
            const pdi_id = req.query.pdi_id;
            if (!pdi_id) {
                return res.status(400).json({ success: false, message: 'ID do PDI não informado' });
            }
            const levels = await pdiHub.getPdiPerformanceLevels(pdi_id);
            res.json({ success: true, data: levels });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao buscar níveis de desempenho: ' + error.message });
        }
    });

    // ------------------- Avaliação Mensal Dinâmica -------------------

    // Buscar avaliação mensal dinâmica (com respostas por fator)
    router.get('/getMonthlyEvaluation', async (req, res) => {
        try {
            const { pdi_id, month, year } = req.query;
            if (!pdi_id || !month || !year) {
                return res.status(400).json({ success: false, message: 'ID do PDI, mês e ano são obrigatórios' });
            }
            const evaluation = await pdiHub.getMonthlyEvaluation(pdi_id, month, year);
            res.json({ success: true, data: evaluation });
        } catch (error) {
            console.error('Erro ao obter avaliação mensal dinâmica:', error);
            res.status(500).json({ success: false, message: 'Erro ao obter avaliação mensal dinâmica: ' + error.message });
        }
    });

    // Salvar avaliação mensal dinâmica (respostas por fator)
    router.post('/saveMonthlyEvaluation', async (req, res) => {
        try {
            const result = await pdiHub.saveMonthlyEvaluation(req.body);
            res.json({ success: true, message: 'Avaliação mensal salva com sucesso', id: result.id });
        } catch (error) {
            console.error('Erro ao salvar avaliação mensal dinâmica:', error);
            res.status(500).json({ success: false, message: 'Erro ao salvar avaliação mensal dinâmica: ' + error.message });
        }
    });
    
    // Endpoint para upload de anexos de ação do PDI
    router.post('/uploadActionAttachment', upload.array('actionAttachment', 10), uploadActionAttachment);
    
    // Novo endpoint para salvar anexos e status da ação de forma transacional
    router.post('/saveActionAttachments', upload.array('files[]', 10), ensureArrays, async (req, res) => {
        try {
            // Verificar os dados recebidos antes de processar
            console.log('Dados recebidos no middleware:');
            console.log('body:', Object.keys(req.body).map(k => ({ key: k, value: req.body[k] })));
            console.log('files:', req.files ? req.files.map(f => f.filename) : []);
            
            // Garantir que campos de array sejam tratados corretamente
            if (req.body['filesToKeep[]'] && !Array.isArray(req.body['filesToKeep[]'])) {
                req.body['filesToKeep[]'] = [req.body['filesToKeep[]']];
            }
            
            // Chamar o controlador com os dados processados
            const result = await pdiHub.saveActionAttachments(req, res);
            
            // Se o resultado for um objeto (não uma resposta HTTP direta)
            if (result && typeof result === 'object') {
                return res.json(result);
            }
        } catch (error) {
            console.error('Erro no middleware de saveActionAttachments:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao processar anexos',
                error: error.message
            });
        }
    });
    
    // Atualizar anexos de uma ação (remover fisicamente e atualizar banco)
    router.post('/updateActionAttachments', async (req, res) => {
        try {
            let { actionId, attachments } = req.body;
            if (!actionId) return res.status(400).json({ success: false, message: 'ID da ação não informado.' });
            if (!Array.isArray(attachments)) attachments = attachments ? [attachments] : [];
            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(__dirname, '../../uploads/pdi-hub/attachment_actions');
            const db = require('../connect/mysql');
            // Buscar anexos antigos
            const [action] = await db.executeQuery('SELECT attachment FROM pdi_actions WHERE id = ?', [actionId]);
            let oldAttachments = [];
            if (action && action.attachment) {
                try {
                    oldAttachments = JSON.parse(action.attachment);
                    if (!Array.isArray(oldAttachments)) oldAttachments = [oldAttachments];
                } catch (e) {
                    oldAttachments = [action.attachment];
                }
            }
            // Remover fisicamente os arquivos que não estão mais na lista
            const toRemove = oldAttachments.filter(f => !attachments.includes(f));
            for (const filename of toRemove) {
                if (!filename) continue;
                const filePath = path.join(uploadDir, filename);
                if (fs.existsSync(filePath)) {
                    try { fs.unlinkSync(filePath); } catch (err) { /* ignora erro */ }
                }
            }
            // Atualizar o campo attachment no banco
            let status = 'Em Andamento';
            let completion_date = null;
            if (attachments.length > 0) {
                status = 'Concluído';
                completion_date = new Date();
            }
            await db.executeQuery('UPDATE pdi_actions SET attachment = ?, status = ?, completion_date = ? WHERE id = ?', [JSON.stringify(attachments), status, completion_date ? completion_date : null, actionId]);
            return res.json({ success: true, status });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao atualizar anexos', error: error.message });
        }
    });
    
    // Remover fisicamente um anexo do servidor e atualizar o banco
    router.post('/deleteActionAttachment', async (req, res) => {
        try {
            let { actionId, filename } = req.body;
            if (!filename) return res.status(400).json({ success: false, message: 'Nome do arquivo não informado.' });
            if (!actionId) return res.status(400).json({ success: false, message: 'ID da ação não informado.' });
            if (Array.isArray(filename)) {
                filename = filename[0];
            }
            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(__dirname, '../../uploads/pdi-hub/attachment_actions');
            const filePath = path.join(uploadDir, filename);

            // LOG para depuração
            console.log('[deleteActionAttachment] Tentando remover arquivo:', filename);
            console.log('[deleteActionAttachment] Caminho completo:', filePath);
            console.log('[deleteActionAttachment] Arquivo existe?', fs.existsSync(filePath));

            // Remover arquivo físico
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log('[deleteActionAttachment] Arquivo removido com sucesso:', filePath);
                } catch (err) {
                    console.error('[deleteActionAttachment] Erro ao remover arquivo físico:', err);
                    return res.status(500).json({ success: false, message: 'Erro ao remover arquivo físico', error: err.message });
                }
            } else {
                console.warn('[deleteActionAttachment] Arquivo não encontrado para remoção:', filePath);
                // Retorna sucesso, pois o arquivo já não existe
                return res.json({ success: true, message: 'Arquivo já não existe.' });
            }

            // Atualizar o campo attachment no banco
            const db = require('../connect/mysql');
            const [action] = await db.executeQuery('SELECT attachment FROM pdi_actions WHERE id = ?', [actionId]);
            let attachments = [];
            if (action && action.attachment) {
                try {
                    attachments = JSON.parse(action.attachment);
                    if (!Array.isArray(attachments)) attachments = [attachments];
                } catch (e) {
                    attachments = [action.attachment];
                }
            }
            // Remover o arquivo da lista
            attachments = attachments.filter(f => f !== filename);
            await db.executeQuery('UPDATE pdi_actions SET attachment = ? WHERE id = ?', [JSON.stringify(attachments), actionId]);

            return res.json({ success: true });
        } catch (error) {
            console.error('[deleteActionAttachment] Erro inesperado ao remover arquivo:', error);
            res.status(500).json({ success: false, message: 'Erro inesperado ao remover arquivo', error: error.message });
        }
    });
    
    // Buscar ação individual pelo ID
    router.get('/getActionById', async (req, res) => {
        const { actionId } = req.query;
        const [action] = await require('../connect/mysql').executeQuery('SELECT * FROM pdi_actions WHERE id = ?', [actionId]);
        if (!action) return res.json({ success: false });
        // Parse attachment para array
        let attachments = [];
        if (action.attachment) {
            try {
                attachments = JSON.parse(action.attachment);
                if (!Array.isArray(attachments)) attachments = [attachments];
            } catch (e) {
                attachments = [action.attachment];
            }
        }
        action.attachment = attachments;
        res.json({ success: true, data: action });
    });
    
    // Remover uma ação do banco de dados e seus arquivos físicos
    router.post('/deleteAction', async (req, res) => {
        const { actionId } = req.body;
        if (!actionId) return res.json({ success: false, message: 'ID da ação não informado.' });
        try {
            // Buscar anexos da ação
            const [action] = await require('../connect/mysql').executeQuery('SELECT attachment FROM pdi_actions WHERE id = ?', [actionId]);
            let attachments = [];
            if (action && action.attachment) {
                try {
                    attachments = JSON.parse(action.attachment);
                    if (!Array.isArray(attachments)) attachments = [attachments];
                } catch (e) {
                    attachments = [action.attachment];
                }
            }
            // Remover arquivos físicos
            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(__dirname, '../../uploads/pdi-hub/attachment_actions');
            for (const filename of attachments) {
                if (!filename) continue;
                const filePath = path.join(uploadDir, filename);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log('Arquivo removido ao deletar ação:', filePath);
                    } catch (err) {
                        console.error('Erro ao remover arquivo ao deletar ação:', err);
                    }
                }
            }
            // Deletar a ação do banco
            await require('../connect/mysql').executeQuery('DELETE FROM pdi_actions WHERE id = ?', [actionId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao remover ação', error: error.message });
        }
    });
    
    // Adicionar nova ação ao PDI
    router.post('/addAction', async (req, res) => {
        await pdiHub.addAction(req, res);
    });
    
    // Buscar fatores padrão do sistema (todos os fatores cadastrados)
    router.get('/getAllFactors', async (req, res) => {
        try {
            const factors = await pdiHub.getAllFactors();
            res.json({ success: true, data: factors });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao buscar fatores padrão: ' + error.message });
        }
    });
    
    // Listar todas as ações dos PDIs do supervisor
    router.get('/getAllActions', async (req, res) => {
        try {
            const supervisorId = req.query.supervisor_id;
            const status = req.query.status || null;
            if (!supervisorId) {
                return res.status(400).json({ success: false, message: 'ID do supervisor não informado' });
            }
            const actions = await pdiHub.getAllActions(supervisorId, status);
            res.json({ success: true, data: actions });
        } catch (error) {
            console.error('Erro ao buscar ações dos PDIs do supervisor:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar ações dos PDIs do supervisor: ' + error.message });
        }
    });
    
    // Listar todas as ações dos PDIs (sem filtro de supervisor)
    router.get('/getAllActionsGlobal', async (req, res) => {
        try {
            const status = req.query.status || null;
            const actions = await pdiHub.getAllActionsGlobal(status);
            res.json({ success: true, data: actions });
        } catch (error) {
            console.error('Erro ao buscar todas as ações dos PDIs:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar todas as ações dos PDIs: ' + error.message });
        }
    });
    
    return router;
}; 