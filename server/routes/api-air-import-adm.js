const express = require('express');
const router = express.Router();
const { IMADM } = require('../controllers/maritime-import-adm.js');

module.exports = function (io) {

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

    router.post('/filteredProcesses', async (req, res, next) => {
        try {
            const result = await IMADM.filteredProcesses(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/getOperationals', async (req, res, next) => {
        try {
            const result = await IMADM.getOperationals();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/repurchases', async (req, res, next) => {
        try {
            const result = await IMADM.repurchases(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
};
