const express = require('express');
const router = express.Router();
const processViewController = require('../controllers/processViewController');

// Rota para obter detalhes do processo
router.get('/process/details/:processNumber', processViewController.getProcessDetails);

// Rota para obter acompanhamentos do processo
router.get('/process/follows/:processNumber', processViewController.getProcessFollows);

module.exports = router;
