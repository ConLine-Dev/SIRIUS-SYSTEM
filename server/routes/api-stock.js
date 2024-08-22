const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Stock } = require('../controllers/stock.js');

module.exports = function(io) {
   // Cria Produto
   router.post('/insertProduct', async (req, res, next) => {
   const { formBody } = req.body;
      try {
            const result = await Stock.insertProduct(formBody);
            res.status(200).json(result)
      } catch (error) {
            console.log(error);

            res.status(404).json('Erro')
      }
   });

   // Verifica se o produto já esta cadastrado
   router.post('/getTop5Products', async (req, res, next) => {
   const { productName } = req.body;
      try {
            const result = await Stock.getTop5Products(productName);
            res.status(200).json(result)
      } catch (error) {
            console.log(error);

            res.status(404).json('Erro')
      }
   });

   // Lista todos os colaboradores;
   router.post('/getAllCollaborator', async (req, res, next) => {
      try {
         const result = await Stock.getAllCollaborator();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   return router;
}