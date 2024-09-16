const express = require('express'); //Importa o Express
const router = express.Router(); //Cria uma nova instância do router
const path = require("path");
const fs = require('fs');
const { financialIndicators } = require('../controllers/financial-indicators.js'); //Importa o módulo de gerenciamento

module.exports = function(io) {
    //Lista todas as faturas
    router.post('/totalInvoices', async (req, res, next) => {
        const {situacao} = req.body;
        console.log(situacao)
        try {
           const result = await financialIndicators.totalInvoices(situacao);
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    router.get('/financial-summary', async (req, res, next) => {
        
        try {
           const result = await financialIndicators.financialSummary();
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    router.get('/financial-expenses', async (req, res, next) => {
        
        try {
           const result = await financialIndicators.getFinancialExpenses();
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    router.get('/invoiced', async (req, res, next) => {
        
        try {
           const result = await financialIndicators.invoiced();
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    router.get('/billingReleased', async (req, res, next) => {
        
        try {
           const result = await financialIndicators.billingReleased();
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    router.get('/losers', async (req, res, next) => {
       
        try {
           const result = await financialIndicators.losers();
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    router.get('/totalReceived', async (req, res, next) => {

        try {
           const result = await financialIndicators.totalReceived();
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    router.get('/totalPaid', async (req, res, next) => {

        try {
           const result = await financialIndicators.totalPaid();
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    router.get('/totalAdm', async (req, res, next) => {

        try {
           const result = await financialIndicators.totalAdm();
  
           res.status(200).json(result)
        } catch (error) {
  
           res.status(404).json('Erro')
        }
    });

    return router;
}