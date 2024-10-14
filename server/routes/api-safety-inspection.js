const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { safetyInspection } = require('../controllers/safety-inspection');

module.exports = function(io) {
    // Lista todas os Departamentos;
    router.post('/listAllDepartments', async (req, res, next) => {
        try {
            const result = await Product.listAllDepartments();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
}