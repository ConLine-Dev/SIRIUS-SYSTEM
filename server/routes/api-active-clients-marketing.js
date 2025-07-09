const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { activeClientsMarketing } = require('../controllers/active-clients-marketing'); // Importa o controlador

module.exports = function(io) {
    // Rota para obter todos os clientes ativos
    router.get('/getAll', async (req, res, next) => {
        try {
            const result = await activeClientsMarketing.getAll();
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro na rota /getAll:', error);
            res.status(500).json({ error: 'Erro ao buscar clientes ativos' });
        }
    });

    // Retorna o router configurado
    return router;
}; 