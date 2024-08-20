const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { controlPassword } = require('../controllers/control-password'); // Importa o módulo de gerenciamento

module.exports = function(io) {
    // Rota para obter todos os módulos
    router.get('/getAll', async (req, res, next) => {
        try {
            const result = await controlPassword.getAll();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter o cadastro
    router.post('/create', async (req, res, next) => {
        const form = req.body
        try {
            const result = await controlPassword.create(form);
            res.status(200).json(result);   
        } catch (error) {
            res.status(404).json(error);
        }
    }); 

    // Rota para obter a visualização
    router.post('/getView', async (req, res, next) => {
        const form = req.body
        try {
            const result = await controlPassword.getView(form.id_password);
            res.status(200).json(result);   
        } catch (error) {
            res.status(404).json(error);
        }
    }); 

    // Rota para obter a edição
    router.post('/update', async (req, res, next) => {
        const form = req.body
        console.log(form, 'form');
        
        try {
            const result = await controlPassword.update(form);
            res.status(200).json(result);   
        } catch (error) {
            res.status(404).json(error);
        }
        
    });

    // Rota para deletar
    router.post('/delete', async (req, res, next) => {
        const {id} = req.body
        try {
            const result = await controlPassword.delete(id);
            res.status(200).json(result);   
        } catch (error) {
            res.status(404).json(error);
        }
        
    });





    // Retorna o router configurado
    return router;
};
