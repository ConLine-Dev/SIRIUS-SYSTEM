const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { meetingControl } = require('../controllers/meeting-control'); // Importa o módulo de gerenciamento

module.exports = function(io) {
    // Rota para obter todos os módulos
    router.post('/getAllCategoryCalendar', async (req, res, next) => {
        try {
            const result = await meetingControl.getAllCategoryCalendar();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });


    // Retorna o router configurado
    return router;
};
