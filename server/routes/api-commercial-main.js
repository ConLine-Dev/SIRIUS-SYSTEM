const express = require('express');
const router = express.Router();
const { commercialMain } = require('../controllers/commercial-main.js');

module.exports = function (io) {

   router.get('/totalProcesses', async (req, res, next) => {

      try {
         const result = await commercialMain.totalProcesses();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/clientsDetails', async (req, res, next) => {

      try {
         const result = await commercialMain.clientsDetails();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/activeClients', async (req, res, next) => {

      try {
         const result = await commercialMain.activeClients();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/newClients', async (req, res, next) => {

      try {
         const result = await commercialMain.newClients();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/teusAndProfit', async (req, res, next) => {

      try {
         const result = await commercialMain.teusAndProfit();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/teusAndProfitByUser', async (req, res, next) => {
      try {
         const result = await commercialMain.teusAndProfitByUser(req.body.userId);
         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/processesByUser', async (req, res, next) => {
      try {
         const result = await commercialMain.processesByUser(req.body.userId);
         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
};
