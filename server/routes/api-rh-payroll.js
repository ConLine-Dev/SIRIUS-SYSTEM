const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { rhPayroll } = require('../controllers/rh-payroll.js');

module.exports = function(io) {

    router.get('/getAllUsers', async (req, res, next) => {
        try {
            const result = await rhPayroll.getAllUsers();
    
            res.status(200).json(result)
        } catch (error) {
    
            res.status(404).json('Erro')   
        }
    });

     // Retorna o router configurado
     return router;
    
}