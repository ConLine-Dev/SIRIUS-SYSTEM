const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { projects } = require('../controllers/called-projects');


router.get('/listAll', async (req, res, next) => {
    try {
        const result = await projects.listAll();

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/create', async (req, res, next) => {
    const { name, description, start_date, end_date, status } = req.body;
    try {
        const result = await projects.create(name, description, start_date, end_date, status);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;