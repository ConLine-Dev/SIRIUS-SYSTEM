const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Users } = require('../controllers/users');
const { non_compliance } = require('../controllers/non-compliance');
const { executeQuerySQL } = require('../connect/sqlServer');



module.exports = function(io) {
  
    router.get('/AllResponsible', async (req, res, next) => {
        try {
            const result = await Users.getAllUsers();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllUnit', async (req, res, next) => {
        try {
            const result = await non_compliance.getAllCompanies();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllOrigin', async (req, res, next) => {
        try {
            const result = await non_compliance.getAllOrigin();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllApproval', async (req, res, next) => {
        try {
            const result = await Users.getAllUsers();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllTypes', async (req, res, next) => {
        try {
            const result = await non_compliance.getAllTypes();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/getPendingOccurrences', async (req, res, next) => {
        try {
            const result = await non_compliance.getPendingOccurrences();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    
    router.post('/getOcurrenceById', async (req, res, next) => {
        const {id} = req.body
        console.log(id)
        try {
            const result = await non_compliance.getOcurrenceById(id);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllOccurrence', async (req, res, next) => {
        try {
            const result = await non_compliance.getAllOccurrence();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/NewOccurrence', async (req, res, next) => {
        const body = req.body
        try {
            const result = await non_compliance.newOccurrence(body);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/NewReason', async (req, res, next) => {
        const body = req.body
        // body.reason, body.occurrences_id
        try {
            const result = await non_compliance.NewReason(body);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/changeBlock', async (req, res, next) => {
        const body = req.body
        // body.reason, body.occurrences_id
        try {
            const result = await non_compliance.changeBlock(body);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/NewActions', async (req, res, next) => {
        const body = req.body
        // body.action, body.responsible, body.expiration, body.status
        try {
            const result = await non_compliance.NewActions(body);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    




    return router;

};
