const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { AppMonitor } = require('../controllers/AppMonitor');

router.post('/add', async (req, res, next) => {
    try {
        const result = await AppMonitor.add(req.body);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});



module.exports = router;