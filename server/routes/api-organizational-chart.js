const express = require('express');
const router = express.Router();
const { organizationalChart } = require('../controllers/organizational-chart.js');

module.exports = function (io) {

    router.get('/getPeople', async (req, res, next) => {
        try {
            const result = await organizationalChart.getPeople();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
};
