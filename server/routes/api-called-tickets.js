const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { tickets } = require('../controllers/called-tickets');


router.get('/listAll', async (req, res, next) => {
    try {
        const result = await tickets.listAll();

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/getById', async (req, res, next) => {
    const { id } = req.body
    try {
        const result = await tickets.getById(id);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/removeTicket', async (req, res, next) => {
    const { id } = req.body
    try {
        const result = await tickets.removeTicket(id);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/createMessage', async (req, res, next) => {
    try {
        const result = await tickets.createMessage(req.body);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/listMessage', async (req, res, next) => {
    try {
        const result = await tickets.listMessage(req.body.id);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/saveTicket', async (req, res, next) => {
    try {
        const result = await tickets.saveTicket(req.body);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/create', async (req, res, next) => {
    try {
        const result = await tickets.create(req.body);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/updateStatus', async (req, res, next) => {
    const {id, status} = req.body
    try {
        const result = await tickets.updateStatus(id, status);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/updateEndForecast', async (req, res, next) => {
    const {id, date} = req.body
    try {
        const result = await tickets.updateEndForecast(id, date);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get('/notificatePendingTickets', async (req, res, next) => {
    try {
        const result = await tickets.notificatePendingTickets();

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json(error);
    }
});


module.exports = router;