const express = require('express');
const router = express.Router();
const { pricingMain } = require('../controllers/pricing-main.js');

module.exports = function (io) {

    router.get('/getOffers', async (req, res, next) => {
        try {
            const result = await pricingMain.getOffers();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/getProcessesCountries', async (req, res, next) => {

        try {
            const result = await pricingMain.getProcessesCountries(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/getProcessesTotal', async (req, res, next) => {

        try {
            const result = await pricingMain.getProcessesTotal(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/getProcessesMonth', async (req, res, next) => {
        try {
            const result = await pricingMain.getProcessesMonth(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/processesByAgent', async (req, res, next) => {
        try {
            const result = await pricingMain.processesByAgent(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/processesByCarrier', async (req, res, next) => {
        try {
            const result = await pricingMain.processesByCarrier(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/processesByTerminal', async (req, res, next) => {
        try {
            const result = await pricingMain.processesByTerminal(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/processesByCustomer', async (req, res, next) => {
        try {
            const result = await pricingMain.processesByCustomer(req.body);
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

    router.post('/getClients', async (req, res, next) => {
        try {
            const result = await pricingMain.getClients(req.body.search);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/getOrigins', async (req, res, next) => {
        try {
            const result = await pricingMain.getOrigins(req.body.search);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/getDestinations', async (req, res, next) => {
        try {
            const result = await pricingMain.getDestinations(req.body.search);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    return router;
};
