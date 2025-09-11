const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { People } = require('../controllers/people');

module.exports = function(io) {
    // Lista todas as pessoas;
    router.get('/getAllPeople', async (req, res, next) => {
        try {
            const result = await People.getAllPeople();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Cria pessoa
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

    return router;
}