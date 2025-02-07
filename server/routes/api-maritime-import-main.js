const express = require('express');
const router = express.Router();
const { IMMain } = require('../controllers/maritime-import-main.js');

module.exports = function (io) {

    router.post('/openedProcesses', async (req, res, next) => {
        try {
            const result = await IMMain.openedProcesses(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/canceledProcesses', async (req, res, next) => {
        try {
            const result = await IMMain.canceledProcesses(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/totalEmails', async (req, res, next) => {
        try {
            const result = await IMMain.totalEmails(req.body.email);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/totalProcesses', async (req, res, next) => {
        try {
            const result = await IMMain.totalProcesses(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/repurchases', async (req, res, next) => {
        try {
            const result = await IMMain.repurchases(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });



    return router;
};
