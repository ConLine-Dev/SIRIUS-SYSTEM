const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { ManagePosts } = require('../controllers/ManagePosts');
const { executeQuerySQL } = require('../connect/sqlServer');



module.exports = function(io) {
    // io.on('connection', (socket) => {
    //     // Handle socket events
    //     console.log('conectado')
    //   });
    
    router.get('/listAll', async (req, res, next) => {
        try {
            const result = await ManagePosts.listAll();
            res.status(200).json(result)
            
        } catch (error) {
            res.status(404).json(error)   
        }
    });

    return router;

};
