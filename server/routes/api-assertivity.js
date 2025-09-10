const express = require('express');
const router = express.Router();
const { assertivity } = require('../controllers/assertivity.js');
const fs = require('fs');
const path = require('path');

module.exports = function (io) {

    router.get('/getOffers', async (req, res, next) => {

        try {
            const result = await assertivity.getOffers();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
};