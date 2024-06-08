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

router.post('/create', async (req, res, next) => {
    const { title, description, status, priority, project_id, assigned_to } = req.body;
    try {
        const result = await tickets.create(title, description, status, priority, project_id, assigned_to);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;