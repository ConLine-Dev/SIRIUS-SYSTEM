const express = require('express');
const router = express.Router();
const Users = require('./apiUsers');
const apiDirectMailPricing = require('./apiDirectMailPricing');
const administration_launches_adm = require('./administration_launches_adm');
const api_non_compliance = require('./api-non-compliance');
const api_user_headcargo = require('./api-user-headcargo');
const api_headcargo = require('./api-headcargo');

const apiAppMonitor = require('./apiAppMonitor');
const apiSystem = require('./api-system');
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

     // Use as rotas do arquivo api-non-compliance.js
     router.use('/non-compliance', api_non_compliance(io));

     // Use as rotas do arquivo apiAppMonitor.js
     router.use('/AppMonitor', apiAppMonitor);

    // Use as rotas do arquivo apiAppMonitor.js
    router.use('/system', apiSystem);

     // Use as rotas do arquivo apiAppMonitor.js
     router.use('/headcargo/user', api_user_headcargo);

     // Use as rotas do arquivo apiAppMonitor.js
     router.use('/headcargo/commission', api_headcargo);
  
    return router;
  };
  
  module.exports = setIO;