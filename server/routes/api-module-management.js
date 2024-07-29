const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { moduleManagement } = require('../controllers/module-management'); // Importa o módulo de gerenciamento

module.exports = function(io) {
    // Rota para obter todos os módulos
    router.get('/getAll', async (req, res, next) => {
        try {
            const result = await moduleManagement.getAll();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter módulos agrupados por categoria
    router.get('/getModulesByCategory', async (req, res, next) => {
        try {
            const result = await moduleManagement.getModulesByCategory();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter todas as categorias
    router.get('/getAllCategories', async (req, res, next) => {
        try {
            const result = await moduleManagement.getAllCategories();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para criar um novo módulo
    router.post('/createModule', async (req, res, next) => {
        try {
            const moduleData = req.body;
            const result = await moduleManagement.createModule(moduleData);
            res.status(201).json(result); // 201 Created
        } catch (error) {
            res.status(400).json(error); // 400 Bad Request
        }
    });

    // Rota para editar um módulo existente
    router.put('/updateModule/:id', async (req, res, next) => {
        try {
            const moduleId = req.params.id;
            const moduleData = req.body;
            const result = await moduleManagement.updateModule(moduleId, moduleData);
            res.status(200).json(result); // 200 OK
        } catch (error) {
            res.status(400).json(error); // 400 Bad Request
        }
    });

    // Rota para excluir um módulo
    router.delete('/deleteModule/:id', async (req, res, next) => {
        try {
            const moduleId = req.params.id;
            const result = await moduleManagement.deleteModule(moduleId);
            res.status(200).json(result); // 200 OK
        } catch (error) {
            res.status(400).json(error); // 400 Bad Request
        }
    });

    // Rota para gerenciar o acesso de um usuário a um módulo
    router.post('/manageUserAccess', async (req, res, next) => {
        try {
            const { userId, moduleId, action } = req.body;
            let result;

            if (action === 'add') {
                result = await moduleManagement.addUserAccessToModule(userId, moduleId);
            } else if (action === 'remove') {
                result = await moduleManagement.removeUserAccessFromModule(userId, moduleId);
            } else {
                return res.status(400).json({ message: 'Invalid action' }); // 400 Bad Request
            }

            res.status(200).json(result); // 200 OK
        } catch (error) {
            res.status(400).json(error); // 400 Bad Request
        }
    });

    // Rota para obter módulos de um usuário agrupados por categoria
    router.get('/getUserModulesByCategory/:userId', async (req, res, next) => {
        try {
            const userId = req.params.userId;
            const result = await moduleManagement.getUserModulesByCategory(userId);
            res.status(200).json(result); // 200 OK
        } catch (error) {
            console.log(error)
            res.status(400).json(error); // 400 Bad Request
        }
    });

    // Rota para adicionar ou remover o acesso de um usuário a um módulo
    router.post('/userModuleAccess', async (req, res, next) => {
        try {
            const { userId, moduleId, action } = req.body;
            await moduleManagement.updateUserModuleAccess(userId, moduleId, action);
            res.status(200).json({ message: 'Module access updated successfully' }); // 200 OK
        } catch (error) {
            res.status(400).json(error); // 400 Bad Request
        }
    });

    // Retorna o router configurado
    return router;
};
