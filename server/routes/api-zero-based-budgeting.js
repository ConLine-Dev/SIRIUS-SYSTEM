const express = require('express');
const router = express.Router();
const path = require('path');
const { zeroBasedCostCenter } = require('../controllers/zero-based-budgeting');

const { ZeroBasedBudgeting } = require('../controllers/zero-based-budgeting');

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
    
 
    
    // ------------------- Centros de Custo -------------------
    
    // Obter todos os centros de custo
    router.get('/getAllCostCenters', async (req, res) => {
        try {
            const collaborator_id = req.query.id_collaborator;
            const costCenters = await zeroBasedCostCenter.getAllCostCenters(collaborator_id);
            res.json(costCenters);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter centros de custo: ' + error.message
            });
        }
    });
    
    // Obter centros de custo por usuário
    router.get('/getCostCentersByUser', async (req, res) => {
        try {
            const collaborator_id = req.query.id_collaborator;
            const costCenters = await zeroBasedCostCenter.getCostCentersByUser(collaborator_id);
            res.json({
                success: true,
                data: costCenters
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter centros de custo: ' + error.message
            });
        }
    });
    
    // Obter detalhes de um centro de custo
    router.post('/getCostCenterView', async (req, res) => {
        try {
            const id = req.body.id;
            const costCenter = await zeroBasedCostCenter.getCostCenterView(id);
            
            if (!costCenter) {
                return res.status(404).json({
                    success: false,
                    message: 'Centro de custo não encontrado'
                });
            }
            
            res.json({
                success: true,
                data: costCenter
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter detalhes do centro de custo: ' + error.message
            });
        }
    });
    
    // Criar centro de custo
    router.post('/createCostCenter', checkAuth, async (req, res) => {
        try {
            const result = await zeroBasedCostCenter.createCostCenter(req.body);
            
            // Emitir evento para atualização em tempo real
            io.emit('updateCostCenters', { action: 'create' });
            
            res.json({
                success: true,
                message: 'Centro de custo criado com sucesso',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao criar centro de custo: ' + error.message
            });
        }
    });
    
    // Atualizar centro de custo
    router.post('/updateCostCenter', checkAuth, async (req, res) => {
        try {
            const result = await zeroBasedCostCenter.updateCostCenter(req.body);
            
            // Emitir evento para atualização em tempo real
            io.emit('updateCostCenters', { action: 'update' });
            
            res.json({
                success: true,
                message: 'Centro de custo atualizado com sucesso',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar centro de custo: ' + error.message
            });
        }
    });
    
    // Deletar centro de custo
    router.post('/deleteCostCenter', checkAuth, async (req, res) => {
        try {
            const result = await zeroBasedCostCenter.deleteCostCenter(req.body.id);
            
            // Emitir evento para atualização em tempo real
            io.emit('updateCostCenters', { action: 'delete' });
            
            res.json({
                success: true,
                message: 'Centro de custo excluído com sucesso',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao excluir centro de custo: ' + error.message
            });
        }
    });
    
    // ------------------- Solicitações de Gastos -------------------
    
    // Obter todas as solicitações de gastos
    router.get('/getAllExpenseRequests', async (req, res) => {
        try {
            const collaborator_id = req.query.id_collaborator;
            const expenseRequests = await zeroBasedCostCenter.getAllExpenseRequests(collaborator_id);
            res.json(expenseRequests);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter solicitações de gastos: ' + error.message
            });
        }
    });
    
    // Obter detalhes de uma solicitação de gasto
    router.post('/getExpenseRequestView', async (req, res) => {
        try {
            const id = req.body.id;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID da solicitação não informado'
                });
            }
            
            console.log('API - Buscando solicitação:', id);
            
            const expenseRequest = await zeroBasedCostCenter.getExpenseRequestView(id);
            
            if (!expenseRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitação de gasto não encontrada'
                });
            }
            
            res.json({
                success: true,
                data: expenseRequest
            });
        } catch (error) {
            console.error('Erro ao obter detalhes da solicitação:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter detalhes da solicitação de gasto: ' + error.message
            });
        }
    });
    
    // Criar solicitação de gasto
    router.post('/createExpenseRequest', checkAuth, async (req, res) => {
        try {
            const result = await zeroBasedCostCenter.createExpenseRequest(req.body);
            
            // Emitir evento para atualização em tempo real
            io.emit('updateExpenseRequests', { action: 'create' });
            
            res.json({
                success: true,
                message: 'Solicitação de gasto criada com sucesso',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao criar solicitação de gasto: ' + error.message
            });
        }
    });
    
    // Atualizar solicitação de gasto
    router.post('/updateExpenseRequest', checkAuth, async (req, res) => {
        try {
            const result = await zeroBasedCostCenter.updateExpenseRequest(req.body);
            
            // Emitir evento para atualização em tempo real
            io.emit('updateExpenseRequests', { action: 'update' });
            
            res.json({
                success: true,
                message: 'Solicitação de gasto atualizada com sucesso',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar solicitação de gasto: ' + error.message
            });
        }
    });
    
    // Deletar solicitação de gasto
    router.post('/deleteExpenseRequest', checkAuth, async (req, res) => {
        try {
            const result = await zeroBasedCostCenter.deleteExpenseRequest(req.body.id);
            
            // Emitir evento para atualização em tempo real
            io.emit('updateExpenseRequests', { action: 'delete' });
            
            res.json({
                success: true,
                message: 'Solicitação de gasto excluída com sucesso',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao excluir solicitação de gasto: ' + error.message
            });
        }
    });
    
    // Processar aprovação/rejeição de solicitação
    router.post('/processExpenseRequest', checkAuth, async (req, res) => {
        try {
            const { expense_request_id, approver_id, status } = req.body;
            
            if (!expense_request_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID da solicitação não informado'
                });
            }
            
            if (!approver_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do aprovador não informado'
                });
            }
            
            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Status não informado'
                });
            }
            
            console.log('API - Processando aprovação:', req.body);
            
            const result = await zeroBasedCostCenter.processExpenseRequest(req.body);
            
            // Emitir evento para atualização em tempo real
            io.emit('updateExpenseRequests', { action: 'process' });
            
            res.json({
                success: true,
                message: 'Solicitação de gasto processada com sucesso',
                data: result
            });
        } catch (error) {
            console.error('Erro ao processar solicitação:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao processar solicitação de gasto: ' + error.message
            });
        }
    });
    
    // ------------------- Relatórios -------------------
    
    // Relatório por centro de custo
    router.post('/reportByCostCenter', async (req, res) => {
        try {
            const report = await zeroBasedCostCenter.reportByCostCenter(req.body);
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar relatório por centro de custo: ' + error.message
            });
        }
    });
    
    // Relatório por status
    router.post('/reportByStatus', async (req, res) => {
        try {
            const report = await zeroBasedCostCenter.reportByStatus(req.body);
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar relatório por status: ' + error.message
            });
        }
    });
    
    // Relatório por mês
    router.post('/reportByMonth', async (req, res) => {
        try {
            const report = await zeroBasedCostCenter.reportByMonth(req.body);
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar relatório por mês: ' + error.message
            });
        }
    });
    
    // Obter solicitações de gastos por centro de custo
    router.post('/getExpenseRequestsByCostCenter', async (req, res) => {
        try {
            const costCenterId = req.body.cost_center_id;
            const expenseRequests = await zeroBasedCostCenter.getExpenseRequestsByCostCenter(costCenterId);
            
            res.json({
                success: true,
                data: expenseRequests
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter solicitações de gastos por centro de custo: ' + error.message
            });
        }
    });
    
    // ------------------- Aprovações -------------------
    
    // Obter aprovações pendentes para um usuário
    router.get('/getPendingApprovals', async (req, res) => {
        try {
            const collaborator_id = req.query.id_collaborator;
            const pendingApprovals = await zeroBasedCostCenter.getPendingApprovals(collaborator_id);
            res.json(pendingApprovals);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter aprovações pendentes: ' + error.message
            });
        }
    });
    
    // Obter contagem de aprovações pendentes para um usuário
    router.get('/getPendingApprovalsCount', async (req, res) => {
        try {
            const collaborator_id = req.query.id_collaborator;
            const count = await zeroBasedCostCenter.getPendingApprovalsCount(collaborator_id);
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter contagem de aprovações pendentes: ' + error.message
            });
        }
    });
    
    // Aprovar uma solicitação de gasto
    router.post('/approveExpenseRequest', checkAuth, async (req, res) => {
        try {
            const requestData = {
                id: req.body.id,
                approver_id: req.body.approver_id,
                comments: req.body.comments,
                action: 'approve'
            };
            
            const result = await zeroBasedCostCenter.processExpenseRequest(requestData);
            
            // Emitir evento para atualização em tempo real
            io.emit('updateExpenseRequests', { action: 'approve' });
            
            res.json({
                success: true,
                message: 'Solicitação aprovada com sucesso',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao aprovar solicitação: ' + error.message
            });
        }
    });
    
    // Rejeitar uma solicitação de gasto
    router.post('/rejectExpenseRequest', checkAuth, async (req, res) => {
        try {
            const requestData = {
                id: req.body.id,
                approver_id: req.body.approver_id,
                comments: req.body.comments,
                action: 'reject'
            };
            
            const result = await zeroBasedCostCenter.processExpenseRequest(requestData);
            
            // Emitir evento para atualização em tempo real
            io.emit('updateExpenseRequests', { action: 'reject' });
            
            res.json({
                success: true,
                message: 'Solicitação rejeitada com sucesso',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Erro ao rejeitar solicitação: ' + error.message
            });
        }
    });
    
    // ------------------- Categorias -------------------
    
    // Obter todas as categorias
    router.get('/getAllCategories', async (req, res) => {
        try {
            const result = await ZeroBasedBudgeting.getAllCategories();
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Erro na rota /getAllCategories:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor ao buscar categorias' 
            });
        }
    });
    
    // Obter categorias ativas
    router.get('/getActiveCategories', async (req, res) => {
        try {
            const result = await zeroBasedCostCenter.getActiveCategories();
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Erro na rota /getActiveCategories:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor ao buscar categorias ativas' 
            });
        }
    });
    
    // Obter categoria por ID
    router.get('/getCategoryById', async (req, res) => {
        try {
            const id = req.query.id;
            if (!id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID da categoria não fornecido' 
                });
            }
            
            const result = await zeroBasedCostCenter.getCategoryById(id);
            res.status(result.success ? 200 : 404).json(result);
        } catch (error) {
            console.error('Erro na rota /getCategoryById:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor ao buscar categoria' 
            });
        }
    });
    
    // Criar nova categoria
    router.post('/createCategory', async (req, res) => {
        try {
            const categoryData = req.body;
            
            // Validar dados recebidos
            if (!categoryData.name) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Nome da categoria é obrigatório' 
                });
            }
            
            const result = await zeroBasedCostCenter.createCategory(categoryData);
            
            // Notificar clientes sobre a alteração via socket.io
            if (result.success) {
                io.emit('category-updated');
            }
            
            res.status(result.success ? 201 : 400).json(result);
        } catch (error) {
            console.error('Erro na rota /createCategory:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor ao criar categoria' 
            });
        }
    });
    
    // Atualizar categoria existente
    router.post('/updateCategory', async (req, res) => {
        try {
            const { id, name, description, active } = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID da categoria é obrigatório'
                });
            }
            
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome da categoria é obrigatório'
                });
            }
            
            // Atualizar a categoria
            const result = await zeroBasedCostCenter.updateCategory(id, {
                name,
                description,
                active
            });
            
            // Notificar clientes sobre a alteração via socket.io
            if (result.success) {
                io.emit('category-updated');
            }
            
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Erro na rota /updateCategory:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao atualizar categoria'
            });
        }
    });
    
    // Excluir categoria
    router.post('/deleteCategory', async (req, res) => {
        try {
            const { id } = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID da categoria é obrigatório'
                });
            }
            
            const result = await zeroBasedCostCenter.deleteCategory(id);
            
            // Notificar clientes sobre a alteração via socket.io
            if (result.success) {
                io.emit('category-updated');
            }
            
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Erro na rota /deleteCategory:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao excluir categoria'
            });
        }
    });
    
    return router;
}; 