const express = require('express'); //Importa o Express
const router = express.Router(); //Cria uma nova instância do router
const path = require("path");
const fs = require('fs');
const { cashFlow } = require('../controllers/cash-flow.js'); //Importa o módulo de gerenciamento

module.exports = function(io) {
    //Lista todas as faturas
   router.post('/totalOperation', async (req, res, next) => {
      try {
         const result = await cashFlow.totalOperation();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
}