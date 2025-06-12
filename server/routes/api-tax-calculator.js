const express = require('express');
const router = express.Router();
const taxCalculatorController = require('../controllers/tax-calculator');

// Rota para obter o histórico de cálculos
router.get('/history', taxCalculatorController.getHistory);

// Rota para salvar um novo cálculo
router.post('/history', taxCalculatorController.saveCalculation);

// Rota para limpar o histórico
router.delete('/history', taxCalculatorController.clearHistory);

// Rota para deletar um registro específico do histórico
router.delete('/history/:id', taxCalculatorController.deleteHistoryEntry);

// Rota para obter as configurações do usuário
router.get('/settings', taxCalculatorController.getSettings);

// Rota para salvar as configurações do usuário
router.post('/settings', taxCalculatorController.saveSettings);

module.exports = router; 