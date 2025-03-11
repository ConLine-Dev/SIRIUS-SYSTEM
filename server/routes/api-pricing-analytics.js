const express = require('express');
const router = express.Router();
const { pricingAnalytics } = require('../controllers/pricing-analytics.js');

module.exports = function(io) {

    router.get('/getOffers', async (req, res, next) => {
        try {
            const result = await pricingAnalytics.getOffers();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/commentsByModule', async (req, res, next) => {

        try {
              const result = await pricingAnalytics.commentsByModule(req.body.moduleId);
              res.status(200).json(result)
        } catch (error) {
  
              res.status(404).json('Erro')
        }
     });

    return router;
};
