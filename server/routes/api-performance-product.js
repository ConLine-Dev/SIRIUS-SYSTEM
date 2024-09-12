const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { PerformanceProducts } = require('../controllers/performance-product');

module.exports = function(io) {
   // Lista todas as pessoas;
   router.post('/listResults', async (req, res, next) => {
      const {startDate, endDate, selectAgencySituation, selectModal, selectTypeLoad, courier, selectClients} = req.body;
      try {
         const result = await PerformanceProducts.listResults(startDate, endDate, selectAgencySituation, selectModal, selectTypeLoad, courier, selectClients);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   // Lista todas as pessoas;
   router.post('/listClients', async (req, res, next) => {
      try {
         const result = await PerformanceProducts.listClients();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
}