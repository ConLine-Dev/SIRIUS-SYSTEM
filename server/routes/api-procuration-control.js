const express = require('express');
const router = express.Router();
const { pricingMain } = require('../controllers/pricing-main.js');

module.exports = function(io) {

    router.get('/getOffers', async (req, res, next) => {
        try {
            const result = await pricingMain.getOffers();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/commentsByModule', async (req, res, next) => {

        try {
              const result = await pricingMain.commentsByModule(req.body.moduleId);
              res.status(200).json(result)
        } catch (error) {
  
              res.status(404).json('Erro')
        }
     });

    return router;
};