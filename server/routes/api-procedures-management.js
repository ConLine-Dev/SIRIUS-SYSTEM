const express = require('express');
const proceduresController = require('../controllers/procedures-management');

module.exports = function(io) {
    const router = express.Router();

    // Rota para obter todos os procedimentos
    router.get('/procedures', proceduresController.getProcedures);

    // Rota para obter um procedimento por ID
    router.get('/procedures/:id', proceduresController.getProcedureById);

    // Rotas para criar, atualizar e deletar
    router.post('/procedures', async (req, res) => {
        const result = await proceduresController.createProcedure(req, res);
        if (io && result && result.id) io.emit('updateProcedures', { action: 'create', id: result.id });
    });
    router.put('/procedures/:id', async (req, res) => {
        const result = await proceduresController.updateProcedure(req, res);
        if (io && result && result.success) io.emit('updateProcedures', { action: 'update', id: req.params.id });
    });
    router.delete('/procedures/:id', async (req, res) => {
        const result = await proceduresController.deleteProcedure(req, res);
        if (io && result && result.success) io.emit('updateProcedures', { action: 'delete', id: req.params.id });
    });

    // Novas rotas para obter metadados para os formulários
    router.get('/meta/departments', proceduresController.getDepartments);
    router.get('/meta/roles', proceduresController.getRoles);
    router.get('/meta/types', proceduresController.getProcedureTypes);
    router.get('/meta/responsibles', proceduresController.getResponsibles);

    // A rota de histórico foi removida, pois os dados agora estão embutidos em /procedures/:id

    // Reverter um procedimento para uma versão específica
    router.post('/procedures/:id/revert', async (req, res) => {
        const result = await proceduresController.revertToVersion(req, res);
        if (io && result && result.success) {
            io.emit('updateProcedures', { action: 'update', id: req.params.id });
        }
    });

    return router;
}; 