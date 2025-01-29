const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { externalSystems } = require('../controllers/external-systems.js');

module.exports = function(io) {

   router.get('/getServices', async (req, res, next) => {
      try {
            const result = await externalSystems.getServices();
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.get('/getRecords', async (req, res, next) => {
      try {
            const result = await externalSystems.getRecords();
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/saveRecord', async (req, res, next) => {
      try {
            const result = await externalSystems.saveRecord(req.body);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/getById', async (req, res, next) => {
      try {
            const result = await externalSystems.getById(req.body.id);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/updateServiceRecord', async (req, res, next) => {
      try {
            const result = await externalSystems.updateServiceRecord(req.body);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   return router;
}