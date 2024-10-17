const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { safetyInspection } = require('../controllers/safety-inspection');

module.exports = function(io) {
    // Lista todas os Departamentos;
    router.get('/safety_monitoring', async (req, res, next) => {
        try {
            const result = await safetyInspection.safety_monitoring();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/inspections', async (req, res, next) => {
        try {
            const result = await safetyInspection.inspections();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/corrective-actions', async (req, res, next) => {
        try {
            const result = await safetyInspection.corrective_actions();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/corrective-actions-pending', async (req, res, next) => {
        try {
            const result = await safetyInspection.corrective_actions_pending();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/corrective-actions-completed', async (req, res, next) => {
        try {
            const result = await safetyInspection.corrective_actions_completed();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
}