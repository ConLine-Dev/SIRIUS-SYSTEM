const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Product } = require('../controllers/product');

module.exports = function(io) {
    // Lista todas os Departamentos;
    router.post('/listAllDepartments', async (req, res, next) => {
        try {
            const result = await Product.listAllDepartments();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Criar uma categoria;
    router.post('/createCategory', async (req, res, next) => {
        const {departmentId, name, textareaObservation} = req.body;
        try {
            const result = await Product.createCategory(departmentId, name, textareaObservation);

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Lista todas as categorias;
    router.post('/listAllCategories', async (req, res, next) => {
        try {
            const result = await Product.listAllCategories();

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    // Criar uma produto; 
    router.post('/createProduct', async (req, res, next) => {
        const {name, ncm, categoryId, textareaObservation} = req.body;
        try {
            const result = await Product.createProduct(name, ncm, categoryId, textareaObservation);

            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

       // Verifica se o produto já esta cadastrado
    router.post('/getTop10Products', async (req, res, next) => {
        const { productName } = req.body;
        try {
            const result = await Product.getTop10Products(productName);
            res.status(200).json(result)
        } catch (error) {
            console.log(error);
    
            res.status(404).json('Erro')
        }
    });
    

    return router;
}