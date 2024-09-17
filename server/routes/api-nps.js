const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { nps } = require('../controllers/nps.js');

module.exports = function(io) {

   router.get('/dashboard', async (req, res, next) => {
      try {
            const result = await nps.dashboard();
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('error')
      }
   });

   router.get('/answers', async (req, res, next) => {
        try {
            const result = await nps.answers();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('error')
        }
    });

   router.get('/clients', async (req, res, next) => {
        try {
            const result = await nps.clients();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('error')
        }
    });


    router.post('/answers', async (req, res, next) => {
        const answers = req.body
        try {
            const result = await nps.registerAnswers(answers);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('error')
        }
    });



   return router;
}