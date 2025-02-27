const express = require('express');
const router = express.Router();
const { commercialMain } = require('../controllers/commercial-main.js');

module.exports = function (io) {

    router.post('/totalProcesses', async (req, res, next) => {
        try {
            const result = await commercialMain.totalProcesses(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/listAllProcesses', async (req, res, next) => {
     
        try {
           const result = await commercialMain.listAllProcesses(req.body.userId);
     
           res.status(200).json(result)
        } catch (error) {
     
           res.status(404).json('Erro')   
        }
     });

    router.post('/countProcesses', async (req, res, next) => {
     
        try {
           const result = await commercialMain.countProcesses(req.body.userId);
     
           res.status(200).json(result)
        } catch (error) {
     
           res.status(404).json('Erro')   
        }
     });

    router.post('/profitByUser', async (req, res, next) => {
     
        try {
           const result = await commercialMain.profitByUser(req.body.userId);
     
           res.status(200).json(result)
        } catch (error) {
     
           res.status(404).json('Erro')   
        }
     });

     router.post('/getOffers', async (req, res, next) => {
      try {
          const result = await commercialMain.getOffers(req.body.userId);
          res.status(200).json(result)
      } catch (error) {

          res.status(404).json('Erro')
      }
  });

    return router;
};
