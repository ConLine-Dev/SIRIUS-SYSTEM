const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { People } = require('../controllers/people');

module.exports = function(io) {
    router.get('/getAllPeople', async (req, res, next) => {
        try {
            const result = await People.getAllPeople();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/insertPeople', async (req, res, next) => {
        try {
            const result = await People.insertPeople(req.body);
            io.emit('insertPeople', result);
            res.status(200).json(result)
        } catch (error) {
            console.log(error);

            res.status(404).json('Erro')
        }
    });

    router.post('/getById', async (req, res, next) => {
        try {
            const result = await People.getById(req.body.id);
            res.status(200).json(result)
        } catch (error) {
            console.log(error);

            res.status(404).json('Erro')
        }
    });

    router.post('/update', async (req, res, next) => {
        try {
            const result = await People.update(req.body);
            res.status(200).json(result)
        } catch (error) {
            console.log(error);

            res.status(404).json('Erro')
        }
    });

    router.post('/getCities', async (req, res, next) => {
        try {
            const result = await People.getCities(req.body.search);
            res.status(200).json(result)
        } catch (error) {
            console.log(error);

            res.status(404).json('Erro')
        }
    });

    router.post('/getStates', async (req, res, next) => {
        try {
            const result = await People.getStates(req.body.search);
            res.status(200).json(result)
        } catch (error) {
            console.log(error);

            res.status(404).json('Erro')
        }
    });

    router.post('/getCountries', async (req, res, next) => {
        try {
            const result = await People.getCountries(req.body.search);
            res.status(200).json(result)
        } catch (error) {
            console.log(error);

            res.status(404).json('Erro')
        }
    });

    return router;
}