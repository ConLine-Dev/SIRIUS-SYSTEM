const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { userTickets } = require('../controllers/user-tickets.js');

module.exports = function(io) {

   router.get('/simplifiedTicketCategories', async (req, res, next) => {
      try {
            const result = await userTickets.simplifiedTicketCategories();
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.get('/simplifiedTicketSubcategories', async (req, res, next) => {
      try {
            const result = await userTickets.simplifiedTicketSubcategories();
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   // Lista todos os colaboradores;
   router.get('/getAllCollaborator', async (req, res, next) => {
      try {
         const result = await userTickets.getAllCollaborator();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/getAllTickets', async (req, res, next) => {
      try {
         const result = await userTickets.getAllTickets();

         res.status(200).json(result)
      } catch (error) {

         res.status(404).json('Erro')
      }
   });

   router.get('/getById', async (req, res, next) => {
      const { id } = req.query
      try {
          const result = await userTickets.getById(id);
  
          res.status(200).json(result)
      } catch (error) {
          res.status(500).json(error);
      }
  });

   router.post('/create', async (req, res, next) => {
      try {
         const result = await userTickets.create(req.body);

         res.status(200).json(result)
      } catch (error) {
         res.status(500).json(error);
      }
   });

   router.post('/updateStatus', async (req, res, next) => {
      try {
         const result = await userTickets.updateStatus(req.body);

         res.status(200).json(result)
      } catch (error) {
         res.status(500).json(error);
      }
   });

   return router;
}