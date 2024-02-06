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

router.get('/getAllModel', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getAllModel();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});

router.get('/getModelById/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getModelById(req.params.id);

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});

router.post('/getProposal', async (req, res, next) => {
    const {body} = req.body;
    try {
        const refProposalDecoded = decodeURIComponent(body);
        const result = await direct_mail_pricing.getProposal(refProposalDecoded);
        const table = await direct_mail_pricing.getProposalDetails(refProposalDecoded);

        res.status(200).json({result,table})
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/sendMail', async (req, res, next) => {
    const {body, EmailTO, subject, ccAddress, system_userID} = req.body;
    try {

        const result = await direct_mail_pricing.sendMail(body, EmailTO, subject, ccAddress, system_userID);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/registerGroup', async (req, res, next) => {
    const {body} = req.body;
    try {
        const result = await direct_mail_pricing.registerGroup(body);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/registerContact', async (req, res, next) => {
    const {name, email, groupID} = req.body;
    try {
        const result = await direct_mail_pricing.registerContact(name, email, groupID);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});



router.get('/getAllGroups', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getAllGroups();
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/getContactByGroup/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getContactByGroup(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/removeContact/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.removeContact(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/getContactByID/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getContactByID(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/removeGroup/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.removeGroup(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});




router.post('/editContact', async (req, res, next) => {
    const {body} = req.body
    try {
        const result = await direct_mail_pricing.editContact(body);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});


router.post('/registerModelEmail', async (req, res, next) => {
    const {body} = req.body;
    try {
        const result = await direct_mail_pricing.registerModelEmail(body);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/editModelEmail', async (req, res, next) => {
    const {body} = req.body
    try {
        const result = await direct_mail_pricing.editModelEmail(body);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});


router.get('/removeModelEmail/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.removeModelEmail(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/ListAllEmails', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.ListAllEmails();
  
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/getEmailById/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getEmailById(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});
















module.exports = router;