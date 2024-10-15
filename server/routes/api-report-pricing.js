const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { reportPricing } = require('../controllers/report-pricing.js');

module.exports = function(io) {
        // Lista todas os Departamentos;
        router.get('/listAllDepartments', async (req, res, next) => {
            try {
                const result = await reportPricing.listAllDepartments();
    
                res.status(200).json(result)
            } catch (error) {
    
                res.status(404).json('Erro')
            }
        });
 
     return router;
 }