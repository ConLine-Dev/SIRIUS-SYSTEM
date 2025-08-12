const express = require('express');
const router = express.Router();
const { commercialMain } = require('../controllers/commercial-main.js');

module.exports = function (io) {

   router.get('/totalLCLProcesses', async (req, res, next) => {

      try {
         const result = await commercialMain.totalLCLProcesses();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/totalAirProcesses', async (req, res, next) => {

      try {
         const result = await commercialMain.totalAirProcesses();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/clientsDetails', async (req, res, next) => {

      try {
         const result = await commercialMain.clientsDetails(req.body);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/clientsLCLDetails', async (req, res, next) => {

      try {
         const result = await commercialMain.clientsLCLDetails(req.body);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/clientsAirDetails', async (req, res, next) => {

      try {
         const result = await commercialMain.clientsAirDetails(req.body);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/activeClients', async (req, res, next) => {

      try {
         const result = await commercialMain.activeClients(req.body);

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/newClients', async (req, res, next) => {

      try {
         const result = await commercialMain.newClients(req.body);

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
         const result = await commercialMain.teusAndProfitByUser(req.body);
         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/LCLProcessesByUser', async (req, res, next) => {
      try {
         const result = await commercialMain.LCLProcessesByUser(req.body);
         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.post('/AirProcessesByUser', async (req, res, next) => {
      try {
         const result = await commercialMain.AirProcessesByUser(req.body);
         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
};
