const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { reportPricing } = require('../controllers/report-pricing.js');

module.exports = function(io) {
        // Lista total das ofertas
        router.post('/totalOffers', async (req, res, next) => {
            const data = req.body;
            try {
            const result = await reportPricing.totalOffers(data);

            res.status(200).json(result)
            } catch (error) {

            res.status(404).json('Erro')
            }
        });

        // Conta todas as ofertas
        router.get('/countOffers', async (req, res, next) => {
            try {
               const result = await reportPricing.countOffers();
      
               res.status(200).json(result)
            } catch (error) {
      
               res.status(404).json('Erro')
            }
         });
 
     return router;
 }