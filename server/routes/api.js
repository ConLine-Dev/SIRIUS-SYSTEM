const express = require('express');
const router = express.Router();
const Users = require('./apiUsers');
const apiDirectMailPricing = require('./apiDirectMailPricing');


// Function to set io instance
const setIO = (io) => {
    // Pass the io instance to the apiDirectMailPricing route
    router.use('/direct_mail_pricing', apiDirectMailPricing(io));
  
    // Use as rotas do arquivo apiUsers.js
    router.use('/users', Users);
  
    return router;
  };
  
  module.exports = setIO;