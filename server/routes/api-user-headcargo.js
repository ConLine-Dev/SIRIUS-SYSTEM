const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Users } = require('../controllers/users-headCargo');



router.get('/ByDep/:id', async (req, res, next) => {
    try {
        const result = await Users.getUsersByDep(req.params.id);

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});








module.exports = router;