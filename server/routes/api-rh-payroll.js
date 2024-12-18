const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { rhPayroll } = require('../controllers/rh-payroll.js');

module.exports = function(io) {

    // Rota para obter os tipos de descontos
    router.get('/categoryDiscount', async (req, res, next) => {
        try {
            const result = await rhPayroll.categoryDiscount(req.body);
    
            res.status(200).json(result)
        } catch (error) {
    
            res.status(404).json('Erro')   
        }
    });

    // Rota para obter o cadastro
    router.post('/create', async (req, res, next) => {
        const form = req.body

        try {
            const result = await rhPayroll.create(form);
            io.emit('updateRhPayroll', '')
            res.status(200).json(result);   
        } catch (error) {
            console.log(error)
            res.status(404).json(error);
        }
    });

    // Rota para obter o cadastro
    router.post('/fixedDiscount', async (req, res, next) => {
        const form = req.body
        try {
            const result = await rhPayroll.fixedDiscount(form);
            io.emit('updateRhPayroll', '')
            res.status(200).json(result);   
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter os descontos associados a um usuário específico.
    router.get('/getAllByUser', async (req, res, next) => {
        const form = req.query
        try {
            const result = await rhPayroll.getAllByUser(form.id_collaborator);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter os descontos associados a um usuário específico.
    router.get('/getDiscountById', async (req, res, next) => {
        const form = req.query
        try {
            const result = await rhPayroll.getDiscountById(form.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    // Rota para obter a visualização
    router.post('/getView', async (req, res, next) => {
        const form = req.body
        try {
            const result = await rhPayroll.getView(form.id);
            res.status(200).json(result);   
        } catch (error) {
            res.status(404).json(error);
        }
    }); 

    // Rota para deletar
    router.post('/update', async (req, res, next) => {
        const {id} = req.body
        try {
            const result = await rhPayroll.update(id);
            io.emit('updateRhPayroll', '')
            res.status(200).json(result);   
        } catch (error) {
            res.status(404).json(error);
        }
        
    });

    // Rota para deletar
    router.post('/delete', async (req, res, next) => {
        const {id} = req.body
        try {
            const result = await rhPayroll.delete(id);
            io.emit('updateRhPayroll', '')
            res.status(200).json(result);   
        } catch (error) {
            res.status(404).json(error);
        }
        
    });

     // Retorna o router configurado
     return router;
    
}