const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { direct_mail_pricing } = require('../controllers/direct_mail_pricing');
const { executeQuerySQL } = require('../connect/sqlServer');



module.exports = function(io) {
    // io.on('connection', (socket) => {
    //     // Handle socket events
    //     console.log('conectado')
    //   });


    return router;

};
