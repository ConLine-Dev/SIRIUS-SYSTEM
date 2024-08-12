const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Exec_Analytics } = require('../controllers/executive-analytics-dashboard.js');

module.exports = function(io) {
   // Lista todos os colaboradores;
   router.post('/getAllCollaborator', async (req, res, next) => {
      try {
         const result = await Exec_Analytics.getAllCollaborator();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
}