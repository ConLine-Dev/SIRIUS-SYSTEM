const express = require('express');
const router = express.Router();
const Users = require('./apiUsers');
const apiDirectMailPricing = require('./apiDirectMailPricing');
const administration_launches_adm = require('./administration_launches_adm');
const apiAppMonitor = require('./apiAppMonitor');
const Posts = require('./apiPosts');
// const Posts = require('./apiPosts');


// Function to set io instance
const setIO = (io) => {
    // Pass the io instance to the apiDirectMailPricing route
    router.use('/direct_mail_pricing', apiDirectMailPricing(io));
  
    // Use as rotas do arquivo apiUsers.js
    router.use('/users', Users);

     // Use as rotas do arquivo apiUsers.js
     router.use('/launches_adm', administration_launches_adm(io));

     // Use as rotas do arquivo apiPosts.js
     router.use('/posts', Posts(io));

     // Use as rotas do arquivo apiAppMonitor.js
     router.use('/AppMonitor', apiAppMonitor);
  
    return router;
  };
  
  module.exports = setIO;