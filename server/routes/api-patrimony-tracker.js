const express = require('express');
const router = express.Router();
const patrimonyController = require('../controllers/patrimony-tracker');

// Rotas para gerenciamento de itens
router.get('/items', patrimonyController.getItems);
router.get('/items/:id', patrimonyController.getItemById);
router.post('/items', patrimonyController.createItem);
router.put('/items/:id', patrimonyController.updateItem);

// Rota para obter opções para campos de formulário (localizações, estados, funcionários)
router.get('/options', patrimonyController.getOptions);

// Rotas para ações específicas sobre itens
router.post('/items/:id/assign', patrimonyController.assignItem);
router.post('/items/:id/return', patrimonyController.returnItem);
router.post('/items/:id/maintenance/send', patrimonyController.sendToMaintenance);
router.post('/items/:id/maintenance/return', patrimonyController.returnFromMaintenance);
router.post('/items/:id/damage', patrimonyController.markAsDamaged);
router.post('/items/:id/discard', patrimonyController.discardItem);
router.post('/items/:id/audit', patrimonyController.auditItem);

module.exports = router; 