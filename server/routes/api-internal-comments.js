const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { internalComments } = require('../controllers/internal-comments.js');

module.exports = function(io) {

   router.post('/deptsByUser', async (req, res, next) => {
      try {
            const result = await internalComments.deptsByUser(req.body.collabId);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/modulesByUser', async (req, res, next) => {
      try {
            const result = await internalComments.modulesByUser(req.body.userId);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/commentsByDept', async (req, res, next) => {
      try {
            const result = await internalComments.commentsByDept(req.body.deptId);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   router.post('/saveComment', async (req, res, next) => {
      try {
            const result = await internalComments.saveComment(req.body);
            res.status(200).json(result)
      } catch (error) {

            res.status(404).json('Erro')
      }
   });

   return router;
}