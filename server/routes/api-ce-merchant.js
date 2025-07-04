const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { ceMerchant } = require('../controllers/ce-merchant'); // Importa o módulo de gerenciamento

module.exports = function(io) {
    // Rota para obter todos os registros de CE-Mercante
    router.get('/getAll', async (req, res, next) => {
        try {
            const result = await ceMerchant.getAll();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter dados para os indicadores
    router.get('/getAllCE', async (req, res, next) => {
        try {
            const result = await ceMerchant.getAllCE();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter dados para os indicadores
    router.get('/getIndicators', async (req, res, next) => {
        try {
            const result = await ceMerchant.getIndicators();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter dados por tipo de divergência
    router.get('/getByDivergence', async (req, res, next) => {
        const { divergence } = req.query;
        try {
            const result = await ceMerchant.getByDivergence(divergence);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter dados por período
    router.post('/getByPeriod', async (req, res, next) => {
        const { startDate, endDate } = req.body;
        try {
            const result = await ceMerchant.getByPeriod(startDate, endDate);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Retorna o router configurado
    return router;
}; 