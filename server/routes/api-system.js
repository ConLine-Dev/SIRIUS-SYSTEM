const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { system } = require('../controllers/system');

router.post('/listApp', async (req, res, next) => {
    try {
        const result = await system.listApp(req.body);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});



module.exports = router;