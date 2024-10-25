const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { reportPricing } = require('../controllers/report-pricing.js');

module.exports = function(io) {

   // Total das propostas e processos
   router.post('/totalOffersProcesses', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal} = req.body
         
         try {
            const result = await reportPricing.totalOffersProcesses(startDateGlobal, endDateGlobal);
   
            res.status(200).json(result)
         } catch (error) {
   
            res.status(404).json('Erro')
         }
      });


   // Total de processos no grafico
   router.post('/graphicProcesses', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal} = req.body
         
         try {
            const result = await reportPricing.graphicProcesses(startDateGlobal, endDateGlobal);
   
            res.status(200).json(result)
         } catch (error) {
   
            res.status(404).json('Erro')
         }
      });

   // Total de processos nos cards
   router.post('/managementPricing', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal} = req.body
         
         try {
            const result = await reportPricing.managementPricing(startDateGlobal, endDateGlobal);
   
            res.status(200).json(result)
         } catch (error) {
   
            res.status(404).json('Erro')
         }
      });

      // Total de processos nos cards
   router.post('/customerRanking', async (req, res, next) => {
      const {startDateGlobal, endDateGlobal} = req.body
         
         try {
            const result = await reportPricing.customerRanking(startDateGlobal, endDateGlobal);
   
            res.status(200).json(result)
         } catch (error) {
   
            res.status(404).json('Erro')
         }
      });
 
     return router;
 }