const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { People } = require('../controllers/people');

module.exports = function(io) {
    // Lista todas as pessoas;
    router.post('/listAllPeople', async (req, res, next) => {
        const {startDate, endDate, peopleCategorySelected, peopleAllType, peopleStatusSelected, commercialValues, collaboratorResponsableValues} = req.body;
        try {
            const result = await People.getAllPeople(startDate, endDate, peopleCategorySelected, peopleAllType, peopleStatusSelected, commercialValues, collaboratorResponsableValues);

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

    // Lista todos os funcionarios responsáveis(inside sales);
    router.post('/getCity', async (req, res, next) => {
        try {
            const result = await People.getCity();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Lista todos os funcionarios responsáveis(inside sales);
    router.post('/getState', async (req, res, next) => {
        try {
            const result = await People.getState();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Lista todos os funcionarios responsáveis(inside sales);
    router.post('/getCountry', async (req, res, next) => {
        try {
            const result = await People.getCountry();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Lista todas as pessoas;
    router.post('/getPeopleById', async (req, res, next) => {
        const {peopleSelectedId} = req.body;
        try {
            const result = await People.getPeopleById(peopleSelectedId);

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Lista todas as pessoas;
    router.post('/getPeopleCategoryById', async (req, res, next) => {
        const {peopleSelectedId} = req.body;
        try {
            const result = await People.getPeopleCategoryById(peopleSelectedId);

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Lista todas as pessoas;
    router.post('/getCityOrStateById', async (req, res, next) => {
        const {city} = req.body;
        try {
            const result = await People.getCityOrStateById(city);

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Lista todas as pessoas;
    router.post('/updateGetPeople', async (req, res, next) => {
        const { formBody } = req.body;
        try {
            const result = await People.updateGetPeople(formBody);
            io.emit('updatePeople', result);
            res.status(200).json(result)
        } catch (error) {
            console.log(error);

            res.status(404).json('Erro')
        }
    });

    // Lista a pessoa com o cnpj foi passado por parametro;
    router.post('/getPeopleByCNPJ', async (req, res, next) => {
        const { cnpj } = req.body;
        try {
            const result = await People.getPeopleByCNPJ(cnpj);

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('error')
        }
    });

    return router;
}