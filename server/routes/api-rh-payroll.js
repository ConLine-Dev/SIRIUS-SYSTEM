const express = require('express');
const router = express.Router();
const { rhPayroll } = require('../controllers/rh-payroll');

module.exports = function(io) {

    // Rota para obter módulos de um usuário agrupados por categoria
    router.get('/getUserModulesByCategory/:userId', async (req, res, next) => {
        try {
            const userId = req.params.userId;
            const result = await rhPayroll.getUserModulesByCategory(userId);
            res.status(200).json(result); // 200 OK
        } catch (error) {
            console.log(error)
            res.status(400).json(error); // 400 Bad Request
        }
    });

     // Retorna o router configurado
     return router;
    
}