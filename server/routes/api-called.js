const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { executeQuery } = require('../connect/mysql');



router.get('/categories', async (req, res, next) => {
    try {
        const categories = await executeQuery('SELECT * FROM called_categories');
        res.json(categories);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
});

router.post('/create-categories', async (req, res, next) => {
    const { name } = req.body;
    try {
        const result = await executeQuery(
        'INSERT INTO called_categories (name) VALUES (?)',
        [name]
        );
        res.json({ id: result.insertId, name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;