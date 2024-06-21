const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Collaborators } = require('../controllers/collaborators');


router.post('/listAllCollaborators', async (req, res, next) => {
    try {
        const result = await Collaborators.getAllCollaborators();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')
    }
});





module.exports = router;