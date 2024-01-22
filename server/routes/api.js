const express = require('express');
const router = express.Router();
const Users = require('./apiUsers');
const apiDirectMailPricing = require('./apiDirectMailPricing');


// Use as rotas do arquivo apiUsers.js
router.use('/users', Users);

// Use as rotas do arquivo direct_mail_pricing.js
router.use('/direct_mail_pricing', apiDirectMailPricing);



module.exports = router;