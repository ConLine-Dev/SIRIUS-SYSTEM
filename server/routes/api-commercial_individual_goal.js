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

    router.post('/getSubcategories', async (req, res, next) => {

        try {
            const result = await commercial_individual_goal.getSubcategories(req.body.categoryId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
};