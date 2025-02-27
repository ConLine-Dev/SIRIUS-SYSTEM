const express = require('express');
const router = express.Router();
const { commercialADM } = require('../controllers/commercial-adm.js');

module.exports = function (io) {

    router.post('/totalProcesses', async (req, res, next) => {
        try {
            const result = await commercialADM.totalProcesses(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/listAllProcesses', async (req, res, next) => {
     
        try {
           const result = await commercialADM.listAllProcesses(req.body.userId);
     
           res.status(200).json(result)
        } catch (error) {
     
           res.status(404).json('Erro')   
        }
     });

    router.post('/countProcesses', async (req, res, next) => {
     
        try {
           const result = await commercialADM.countProcesses(req.body.userId);
     
           res.status(200).json(result)
        } catch (error) {
     
           res.status(404).json('Erro')   
        }
     });

    router.post('/profitByUser', async (req, res, next) => {
     
        try {
           const result = await commercialADM.profitByUser(req.body.userId);
     
           res.status(200).json(result)
        } catch (error) {
     
           res.status(404).json('Erro')   
        }
     });

     router.get('/getCommercials', async (req, res, next) => {
      try {
          const result = await commercialADM.getCommercials();
          res.status(200).json(result)
      } catch (error) {

          res.status(404).json('Erro')
      }
  });

     router.post('/getOffers', async (req, res, next) => {
      try {
          const result = await commercialADM.getOffers(req.body.userId);
          res.status(200).json(result)
      } catch (error) {

          res.status(404).json('Erro')
      }
  });

    return router;
};