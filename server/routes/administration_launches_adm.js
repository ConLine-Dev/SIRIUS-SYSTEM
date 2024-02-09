const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { launches_adm } = require('../controllers/launches_adm');
const { executeQuerySQL } = require('../connect/sqlServer');



module.exports = function(io) {
    // io.on('connection', (socket) => {
    //     // Handle socket events
    //     console.log('conectado')
    //   });
    
    router.get('/getAllLaunches', async (req, res, next) => {
        try {
            const result = await launches_adm.getAllLaunches();
            res.status(200).json(result)
        } catch (error) {
        
            // const result = await launches_adm.getAllLaunches();
            res.status(404).json(error)   
        }
    });

    return router;

};
