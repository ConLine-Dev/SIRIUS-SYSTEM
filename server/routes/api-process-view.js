const express = require('express');
const router = express.Router();
const processViewController = require('../controllers/processViewController');

module.exports = (io) => {
    // Rota para obter detalhes do processo
    router.get('/details/:processNumber', processViewController.getProcessDetails);

    // Rota para obter acompanhamentos do processo
    router.get('/follows/:processNumber', processViewController.getProcessFollows);

     // Rota para obter taxas do processo
     router.get('/fees/:processNumber', processViewController.getProcessFees);

    return router;
};
