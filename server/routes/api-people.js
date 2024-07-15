const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { People } = require('../controllers/people');

// Lista todas as pessoas;
router.post('/listAllPeople', async (req, res, next) => {
    const {peopleCategorySelected, peopleAllType, peopleStatusSelected, commercialValues, collaboratorResponsableValues} = req.body;
    try {
        const result = await People.getAllPeople(peopleCategorySelected, peopleAllType, peopleStatusSelected, commercialValues, collaboratorResponsableValues);

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')
    }
});

// Lista todas as categorias;
router.post('/getAllPeopleCategory', async (req, res, next) => {
    try {
        const result = await People.getAllPeopleCategory();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')
    }
});

// Lista todos os status;
router.post('/getAllPeopleStatus', async (req, res, next) => {
    try {
        const result = await People.getAllPeopleStatus();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')
    }
});

// Lista todos os comerciais;
router.post('/getAllCommercial', async (req, res, next) => {
    try {
        const result = await People.getAllCommercial();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')
    }
});

// Lista todos os funcionarios responsáveis(inside sales);
router.post('/getAllCollaboratorsResponsable', async (req, res, next) => {
    try {
        const result = await People.getAllCollaboratorsResponsable();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')
    }
});

module.exports = router;