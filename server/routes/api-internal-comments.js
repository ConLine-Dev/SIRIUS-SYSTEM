const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { internalComments } = require('../controllers/internal-comments.js');

module.exports = function(io) {

   router.get('/simplifiedTicketCategories', async (req, res, next) => {
      try {
            const result = await internalComments.simplifiedTicketCategories();
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   return router;
}