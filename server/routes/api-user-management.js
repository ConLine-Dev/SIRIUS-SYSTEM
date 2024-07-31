const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { userManagement } = require('../controllers/user-management'); // Importa o módulo de gerenciamento

module.exports = function(io) {
    // Rota para obter todos os módulos
    router.get('/', async (req, res, next) => {
        try {
            const result = await userManagement.getAll();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.get('/:id', async (req, res, next) => {
        try {
            const result = await userManagement.getById(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/', async (req, res, next) => {
        try {
            const result = await userManagement.create(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.put('/:id', async (req, res, next) => {
        try {
            const result = await userManagement.update(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.delete('/:id', async (req, res, next) => {
        try {
            const result = await userManagement.delete(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });




    // Retorna o router configurado
    return router;
};
