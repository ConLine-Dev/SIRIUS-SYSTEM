const express = require('express');
const router = express.Router();
const proceduresController = require('../controllers/procedures-management');

// Rota para obter todos os procedimentos (mock)
router.get('/procedures', proceduresController.getProcedures);

// Rota para obter um procedimento por ID (mock)
router.get('/procedures/:id', proceduresController.getProcedureById);

// Rotas para criar, atualizar e deletar (apenas para simular)
router.post('/procedures', proceduresController.createProcedure);
router.put('/procedures/:id', proceduresController.updateProcedure);
router.delete('/procedures/:id', proceduresController.deleteProcedure);

// A rota de histórico foi removida, pois os dados agora estão embutidos em /procedures/:id

module.exports = router; 