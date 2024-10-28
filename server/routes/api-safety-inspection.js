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

    router.get('/inspections-by-id/:id', async (req, res, next) => {
      
        try {
            const result = await safetyInspection.inspectionsById(req.params.id);

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // rota para editar inspeção
    router.put('/inspections/:id', async (req, res, next) => {
        try {
            const { id } = req.params;
            const { finished, status, description, idCollaborator } = req.body;

            const result = await safetyInspection.updateInspectionsById(id, finished, status, description, idCollaborator);
            io.emit('update-Inspections', result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json('Erro');
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

    router.post('/create-corrective-actions', async (req, res, next) => {
        try {
            const { local, date, finish, observation, idCollaborator} = req.body;
            const result = await safetyInspection.create_corrective_actions(local, date, finish, observation, idCollaborator);
            io.emit('update-corrective-actions', result);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/action-by-id/:id', async (req, res, next) => {
        try {
            const result = await safetyInspection.action_by_id(req.params.id);

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

 
    router.put('/update-corrective-actions/:id', async (req, res, next) => {
        try {
            const { id } = req.params;
            const { local, date, finish, observation, idCollaborator} = req.body;
            const result = await safetyInspection.update_corrective_actions(id, local, date, finish, observation, idCollaborator);
            io.emit('update-corrective-actions', result);
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