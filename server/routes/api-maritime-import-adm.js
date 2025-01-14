const express = require('express');
const router = express.Router();
const { IMADM } = require('../controllers/maritime-import-main.js');

module.exports = function (io) {

    router.get('/getOffers', async (req, res, next) => {
        try {
            const result = await IMADM.getOffers();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/commentsByModule', async (req, res, next) => {
        try {
            const result = await IMADM.commentsByModule(req.body.moduleId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/openedProcesses', async (req, res, next) => {
        try {
            const result = await IMADM.openedProcesses(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/canceledProcesses', async (req, res, next) => {
        try {
            const result = await IMADM.canceledProcesses(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/totalEmails', async (req, res, next) => {
        try {
            const result = await IMADM.totalEmails(req.body.email);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/totalProcesses', async (req, res, next) => {
        try {
            const result = await IMADM.totalProcesses(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });



    return router;
};
