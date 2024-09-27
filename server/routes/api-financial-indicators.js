const express = require('express'); //Importa o Express
const router = express.Router(); //Cria uma nova instância do router
const path = require("path");
const fs = require('fs');
const { financialIndicators } = require('../controllers/financial-indicators.js'); //Importa o módulo de gerenciamento

module.exports = function(io) {
   //Lista todas as faturas
   router.post('/totalInvoices', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal, situacao} = req.body;
      try {
         const result = await financialIndicators.totalInvoices(startDateGlobal, endDateGlobal, situacao);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   //Lista todas as Despesas administrativas
   router.post('/financial-expenses', async (req, res, next) => {
   const {startDateGlobal, endDateGlobal} = req.body
      
      try {
         const result = await financialIndicators.getFinancialExpenses(startDateGlobal, endDateGlobal);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   //Lista todas os cards do Indicadores Fin
   router.post('/outstanding', async (req, res, next) => {
   const {startDateGlobal, endDateGlobal} = req.body
      
      try {
         const result = await financialIndicators.outstanding(startDateGlobal, endDateGlobal);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   //Lista todas as faturas do card Faturado
   router.post('/listFaturado', async (req, res, next) => {
   const {startDateGlobal, endDateGlobal} = req.body
      
      try {
         const result = await financialIndicators.listFaturado(startDateGlobal, endDateGlobal);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   //Lista todas as faturas do card Antecipados
   router.post('/listAntecipados', async (req, res, next) => {
   const {startDateGlobal, endDateGlobal} = req.body
      
      try {
         const result = await financialIndicators.listAntecipados(startDateGlobal, endDateGlobal);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   //Lista todas as faturas do card Vencidos
   router.post('/listVencidos', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal} = req.body
         
         try {
            const result = await financialIndicators.listVencidos(startDateGlobal, endDateGlobal);
   
            res.status(200).json(result)
         } catch (error) {
   
            res.status(404).json('Erro')
         }
      });

   //Lista todas as faturas do card Total Recebido
   router.post('/listRecebimento', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal} = req.body
         
         try {
            const result = await financialIndicators.listRecebimento(startDateGlobal, endDateGlobal);
   
            res.status(200).json(result)
         } catch (error) {
   
            res.status(404).json('Erro')
         }
      });

   //Lista todas as faturas do card Total Pago
   router.post('/listPagamento', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal} = req.body
         
         try {
            const result = await financialIndicators.listPagamento(startDateGlobal, endDateGlobal);
   
            res.status(200).json(result)
         } catch (error) {
   
            res.status(404).json('Erro')
         }
      });

    return router;
}