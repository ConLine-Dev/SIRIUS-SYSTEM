const express = require('express');
const router = express.Router();
const Users = require('./apiUsers');


// Use as rotas do arquivo apiUsers.js
router.use('/users', Users);



module.exports = router;