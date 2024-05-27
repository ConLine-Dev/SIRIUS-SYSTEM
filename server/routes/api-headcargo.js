const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { headcadgo } = require('../controllers/headCargo');



// router.post('/', async (req, res, next) => {
//     const body = req.body;

//     try {
//         const result = await headcadgo.gerenateCommission(body);

//         res.status(200).json(result)
//     } catch (error) {
//         console.log(error)

//         res.status(404).json('Erro')   
//     }
// });

router.post('/filterComission', async (req, res, next) => {
    const {filters} = req.body;

    try {
        const result = await headcadgo.gerenateCommission(filters);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});








module.exports = router;