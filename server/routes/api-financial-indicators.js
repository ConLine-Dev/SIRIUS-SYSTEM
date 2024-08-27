const express = require('express'); //Importa o Express
const router = express.Router(); //Cria uma nova instância do router
const path = require("path");
const fs = require('fs');
const { financialIndicators } = require('../controllers/financial-indicators.js'); //Importa o módulo de gerenciamento

module.exports = function(io) {
    //Lista todas as faturas
    router.post('/totalInvoices', async (req, res, next) => {
        const {situacao} = req.body;
        console.log(situacao)
        try {
           const result = await financialIndicators.totalInvoices(situacao);
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    return router;
}