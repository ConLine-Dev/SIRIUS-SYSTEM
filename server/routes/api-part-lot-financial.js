const express = require('express'); //Importa o Express
const router = express.Router(); //Cria uma nova instância do router
const path = require("path");
const fs = require('fs');
const { partLotFinancial } = require('../controllers/part-lot-financial.js'); //Importa o módulo de gerenciamento

module.exports = function(io) {
    // Lista todos os processos de acordo com a referencia externa
   router.post('/processByRef', async (req, res, next) => {
      const { externalRef } = req.body;
      
      try {
         const result = await partLotFinancial.processByRef(externalRef);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });


   // Lista as taxas de todos os processos
   router.post('/listAllPaymentRates', async (req, res, next) => {
      const { IdLogistica_House } = req.body;
      
      try {
         const result = await partLotFinancial.listAllPaymentRates(IdLogistica_House);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
}