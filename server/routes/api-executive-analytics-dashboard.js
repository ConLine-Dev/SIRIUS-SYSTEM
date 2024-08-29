const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { executiveAnalytics } = require('../controllers/executive-analytics-dashboard.js');

module.exports = function(io) {
   // Lista todos os colaboradores;
   router.post('/totalOffers', async (req, res, next) => {
      const data = req.body;
      try {
         const result = await executiveAnalytics.totalOffers(data);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/countOffers', async (req, res, next) => {
      try {
         const result = await executiveAnalytics.countOffers();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/countProcesses', async (req, res, next) => {
      try {
         const result = await executiveAnalytics.countProcesses();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/totalProcesses', async (req, res, next) => {
      const data = req.body;
      try {
         const result = await executiveAnalytics.totalProcesses(data);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/totalInvoices', async (req, res, next) => {
      const data = req.body;
      try {
         const result = await executiveAnalytics.totalInvoices(data);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/processDetails', async (req, res, next) => {
      const { reference } = req.query;
      try {
         const result = await executiveAnalytics.processDetails(reference);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/offerDetails', async (req, res, next) => {
      const { reference } = req.query;
      try {
         const result = await executiveAnalytics.offerDetails(reference);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/conversionRates', async (req, res, next) => {
      try {
         const result = await executiveAnalytics.conversionRates();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
}