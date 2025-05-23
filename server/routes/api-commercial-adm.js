const express = require('express');
const router = express.Router();
const { commercialADM } = require('../controllers/commercial-adm.js');

module.exports = function (io) {

    router.get('/getCommercialsSC', async (req, res, next) => {
        try {
            const result = await commercialADM.getCommercialsSC();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/getCommercialsSP', async (req, res, next) => {
        try {
            const result = await commercialADM.getCommercialsSP();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getUserCompany', async (req, res, next) => {
        try {
            const result = await commercialADM.getUserCompany(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getByCommercial', async (req, res, next) => {
        try {
            const result = await commercialADM.getByCommercial(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
};