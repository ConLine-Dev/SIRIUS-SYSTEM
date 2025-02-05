const express = require('express');
const router = express.Router();
const { MaterialControl } = require('../controllers/material-control');

module.exports = function(io) {
    // Rota para listar todos os materiais
    router.get('/materials', async (req, res) => {
        try {
            const materials = await MaterialControl.getAllMaterials();
            res.status(200).json(materials);
        } catch (error) {
            console.error('Erro ao buscar materiais:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar materiais', 
                details: error.message 
            });
        }
    });

    // Rota para criar novo material
    router.post('/materials', async (req, res) => {
        try {
            const materialData = req.body;
            const result = await MaterialControl.createMaterial(materialData);
            io.emit('newMaterialCreated', result);
            res.status(201).json(result);
        } catch (error) {
            console.error('Erro ao criar material:', error);
            res.status(500).json({ 
                error: 'Erro ao criar material', 
                details: error.message 
            });
        }
    });

    // Rota para registrar entrada de estoque
    router.post('/stock/entry', async (req, res) => {
        try {
            const entryData = req.body;
            const result = await MaterialControl.registerStockEntry(entryData);
            io.emit('stockEntryRegistered', result);
            res.status(201).json(result);
        } catch (error) {
            console.error('Erro ao registrar entrada de estoque:', error);
            res.status(500).json({ 
                error: 'Erro ao registrar entrada de estoque', 
                details: error.message 
            });
        }
    });

    // Rota para registrar saída de estoque
    router.post('/stock/output', async (req, res) => {
        try {
            const outputData = req.body;
            const result = await MaterialControl.registerStockOutput(outputData);
            io.emit('stockOutputRegistered', result);
            res.status(201).json(result);
        } catch (error) {
            console.error('Erro ao registrar saída de estoque:', error);
            res.status(500).json({ 
                error: 'Erro ao registrar saída de estoque', 
                details: error.message 
            });
        }
    });

    // Rota para alocar material para colaborador
    router.post('/allocations', async (req, res) => {
        try {
            const allocationData = req.body;
            const result = await MaterialControl.allocateMaterial(allocationData);
            io.emit('materialAllocated', result);
            res.status(201).json(result);
        } catch (error) {
            console.error('Erro ao alocar material:', error);
            res.status(500).json({ 
                error: 'Erro ao alocar material', 
                details: error.message 
            });
        }
    });

    // Rota para devolver material alocado
    router.post('/allocations/return', async (req, res) => {
        try {
            const returnData = req.body;
            const result = await MaterialControl.returnAllocatedMaterial(returnData);
            io.emit('materialReturned', result);
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao devolver material:', error);
            res.status(500).json({ 
                error: 'Erro ao devolver material', 
                details: error.message 
            });
        }
    });

    // Rota para buscar histórico de movimentações
    router.get('/movements', async (req, res) => {
        try {
            const filters = req.query;
            const movements = await MaterialControl.getMovementHistory(filters);
            res.status(200).json(movements);
        } catch (error) {
            console.error('Erro ao buscar histórico de movimentações:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar histórico de movimentações', 
                details: error.message 
            });
        }
    });

    return router;
};
