const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { headcargo } = require('../controllers/headCargo');




router.post('/createRegister', async (req, res, next) => {
    const {process, type, dateFilter, user} = req.body;

    try {
        const result = await headcargo.createRegisterComission(process, type, dateFilter, user);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/getRegisterById', async (req, res, next) => {
    const {id} = req.body;

    try {
        const result = await headcargo.getRegisterById(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/sendEmailRegisters', async (req, res, next) => {
    try {
        const result = await headcargo.sendEmailRegisters(req.body);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/confirmPayment', async (req, res, next) => {
    const {id} = req.body;
    try {
        const result = await headcargo.confirmPayment(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/listRegister', async (req, res, next) => {
    try {
        const result = await headcargo.listRegisterComission();

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/filterComission', async (req, res, next) => {
    const {filters} = req.body;

    try {
        const result = await headcargo.gerenateCommission(filters);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/listSettings', async (req, res, next) => {
    const {id, type} = req.body;

    try {
        const result = await headcargo.listSettings(id, type);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/removeSetting', async (req, res, next) => {
    const {id} = req.body;
    try {
        const result = await headcargo.removeSetting(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/verifyRegisters', async (req, res, next) => {
    const {filters} = req.body;
    try {
        const result = await headcargo.verifyRegisters(filters);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/verifyPercentageComission', async (req, res, next) => {
    const {id} = req.body;
    try {

        const result = await headcargo.verifyPercentageComission(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});


router.post('/registerPercentage', async (req, res, next) => {
    try {
        const result = await headcargo.registerPercentage(req.body);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/cancelRegister', async (req, res, next) => {
    const {id} = req.body;
    try {
        const result = await headcargo.cancelRegister(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});
















module.exports = router;