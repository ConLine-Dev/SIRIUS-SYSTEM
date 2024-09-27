const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { incentiveManagement } = require('../controllers/incentive-management'); // Importa o módulo de gerenciamento

module.exports = function(io) {
    // Rota para obter todos os módulos de Seguro
    router.get('/getAllSecurity', async (req, res, next) => {
        try {
            const result = await incentiveManagement.getAllSecurity();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter todos os módulos de Incentivo
    router.get('/getAllComission', async (req, res, next) => {
        try {
            const result = await incentiveManagement.getAllComission();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter todos os módulos de Agente
    router.get('/getAllAgent', async (req, res, next) => {
        try {
            const result = await incentiveManagement.getAllAgent();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    

    // Retorna o router configurado
    return router;
};
