const express = require('express');
const router = express.Router();
const { IMMain } = require('../controllers/maritime-import-main.js');

module.exports = function (io) {

    router.get('/getOffers', async (req, res, next) => {
        try {
            const result = await IMMain.getOffers();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/commentsByModule', async (req, res, next) => {
        try {
            const result = await IMMain.commentsByModule(req.body.moduleId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/openedProcesses', async (req, res, next) => {
        try {
            const result = await IMMain.commentsByModule(req.body.userId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });



    return router;
};
