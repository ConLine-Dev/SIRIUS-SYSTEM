const express = require('express');
const router = express.Router();
const { procurationControl } = require('../controllers/procuration-control.js');

module.exports = function(io) {

    router.get('/procurationData', async (req, res, next) => {
        try {
            const result = await procurationControl.procurationData();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/documentHistory', async (req, res, next) => {
        try {
            const result = await procurationControl.documentHistory(req.body.documentId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/saveEvent', async (req, res, next) => {
        try {
            const result = await procurationControl.saveEvent(req.body);
    
            // io.emit('updateCalendarEvents', '')
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    return router;
};