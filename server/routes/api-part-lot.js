const express = require('express'); //Importa o Express
const router = express.Router(); //Cria uma nova instância do router
const path = require("path");
const fs = require('fs');
const { partLot } = require('../controllers/part-lot.js'); //Importa o módulo de gerenciamento

module.exports = function(io) {
    // Lista todos os processos de acordo com a referencia externa
   router.post('/processByRef', async (req, res, next) => {
      const { externalRef } = req.body;
      
      try {
         const result = await partLot.processByRef(externalRef);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   // Lista as taxas por processo
   router.post('/listRatesByProcess', async (req, res, next) => {
      const { IdLogistica_House } = req.body;
      
      try {
         const result = await partLot.listRatesByProcess(IdLogistica_House);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   // Lista as taxas de todos os processos
   router.post('/listAllRates', async (req, res, next) => {
      const { IdLogistica_House } = req.body;
      
      try {
         const result = await partLot.listAllRates(IdLogistica_House);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   // Lista as taxas por processo
   router.post('/createParteLote', async (req, res, next) => {
      const { processData } = req.body;
      
      try {
         const result = await partLot.createParteLote(processData);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   // Lista todos os parte lotes que encontrar no Sirius
   router.post('/listAllParteLote', async (req, res, next) => {
      
      try {
         const result = await partLot.listAllParteLote();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
}