const express = require('express');
const router = express.Router();
const { commercial_individual_goal } = require('../controllers/commercial-individual-goal.js');
const fs = require('fs');
const path = require('path');

module.exports = function (io) {

    router.get('/getCategories', async (req, res, next) => {

        try {
            const result = await commercial_individual_goal.getCategories();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getTEUsAndProfit', async (req, res, next) => {

        try {
            const result = await commercial_individual_goal.getTEUsAndProfit(req.body);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getClients', async (req, res, next) => {

        try {
            const result = await commercial_individual_goal.getClients(req.body);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getGoals', async (req, res, next) => {

        try {
            const result = await commercial_individual_goal.getGoals(req.body);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getCommercial', async (req, res, next) => {

        try {
            const result = await commercial_individual_goal.getCommercial(req.body.collabId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/saveNewGoal', async (req, res, next) => {

        try {
            const result = await commercial_individual_goal.saveNewGoal(req.body);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
};