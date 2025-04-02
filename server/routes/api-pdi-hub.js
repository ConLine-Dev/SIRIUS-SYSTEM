const express = require('express');
const router = express.Router();
const path = require('path');
const { pdiHub } = require('../controllers/pdi-hub');

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
    
    // Deletar um PDI
    router.post('/deletePDI', async (req, res) => {
        try {
            const id = req.body.id;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do PDI não informado'
                });
            }
            
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
    
    return router;
}; 