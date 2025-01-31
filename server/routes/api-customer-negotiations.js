const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { customerNegotiations } = require('../controllers/customer-negotiations.js');

module.exports = function(io) {

   router.get('/getServices', async (req, res, next) => {
      try {
            const result = await customerNegotiations.getServices();
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.get('/getCustomers', async (req, res, next) => {
      try {
            const result = await customerNegotiations.getCustomers();
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/saveRecord', async (req, res, next) => {

      try {
            const result = await customerNegotiations.saveRecord(req.body);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.get('/getRecords', async (req, res, next) => {
      try {
            const result = await customerNegotiations.getRecords();
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/getById', async (req, res, next) => {
      try {
            const result = await customerNegotiations.getById(req.body.id);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/getReplies', async (req, res, next) => {
      try {
            const result = await customerNegotiations.getReplies(req.body.id);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/update', async (req, res, next) => {
      try {
            const result = await customerNegotiations.update(req.body);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/addReply', async (req, res, next) => {
      try {
            const result = await customerNegotiations.addReply(req.body.reply);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   return router;
}