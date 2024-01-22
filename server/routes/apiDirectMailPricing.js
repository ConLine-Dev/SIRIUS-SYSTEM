const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { direct_mail_pricing } = require('../controllers/direct_mail_pricing');



router.get('/getGroups', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getGroups();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});

router.get('/getContactsByGroup/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getContactsByGroup(req.params.id);

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});





module.exports = router;