const express = require('express'); //Importa o Express
const router = express.Router(); //Cria uma nova instância do router
const path = require("path");
const fs = require('fs');
const { cashFlow } = require('../controllers/cash-flow.js'); //Importa o módulo de gerenciamento

module.exports = function(io) {
    //Lista todas as faturas Operacional
   router.post('/totalOperation', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal} = req.body;
      
      try {
         const result = await cashFlow.totalOperation(startDateGlobal, endDateGlobal);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   //Lista todas as faturas ADM
   router.post('/totalAdm', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal, situacao} = req.body;

      try {
         const result = await cashFlow.totalAdm(startDateGlobal, endDateGlobal, situacao);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   //Lista todas as faturas ADM
   router.post('/listInvoiceByCategorie', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal, situacao, idCategorie} = req.body;

      try {
         const result = await cashFlow.listInvoiceByCategorie(startDateGlobal, endDateGlobal, situacao, idCategorie);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
}