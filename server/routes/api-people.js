const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { People } = require('../controllers/people');


router.post('/listAllPeople', async (req, res, next) => {
    try {
        const result = await People.getAllCollaborators();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')
    }
});





module.exports = router;