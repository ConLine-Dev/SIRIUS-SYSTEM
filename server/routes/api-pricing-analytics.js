const express = require('express');
const router = express.Router();
const { pricingAnalytics } = require('../controllers/pricing-analytics.js');

module.exports = function (io) {

      router.get('/getVolumes', async (req, res, next) => {
            try {
                  const result = await pricingAnalytics.getVolumes();
                  res.status(200).json(result);
            } catch (error) {
                  res.status(404).json(error);
            }
      });

      router.post('/updateTable', async (req, res, next) => {

            try {
                  const result = await pricingAnalytics.updateTable(req.body);
                  res.status(200).json(result)
            } catch (error) {

                  res.status(404).json('Erro')
            }
      });

      router.get('/getAgents', async (req, res, next) => {

            try {
                  const result = await pricingAnalytics.getAgents();
                  res.status(200).json(result)
            } catch (error) {

                  res.status(404).json('Erro')
            }
      });

      router.get('/getCountries', async (req, res, next) => {

            try {
                  const result = await pricingAnalytics.getCountries();
                  res.status(200).json(result)
            } catch (error) {

                  res.status(404).json('Erro')
            }
      });

      router.get('/getYears', async (req, res, next) => {

            try {
                  const result = await pricingAnalytics.getYears();
                  res.status(200).json(result)
            } catch (error) {

                  res.status(404).json('Erro')
            }
      });

      router.post('/getMoveByOrigin', async (req, res, next) => {

            try {
                  const result = await pricingAnalytics.getMoveByOrigin(req.body.year);
                  res.status(200).json(result)
            } catch (error) {

                  res.status(404).json('Erro')
            }
      });

      router.post('/getMoveByAgent', async (req, res, next) => {

            try {
                  const result = await pricingAnalytics.getMoveByAgent(req.body);
                  res.status(200).json(result)
            } catch (error) {

                  res.status(404).json('Erro')
            }
      });
      return router;
};
