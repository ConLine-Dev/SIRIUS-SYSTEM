const express = require('express');
const router = express.Router();
const { MaterialControl } = require('../controllers/material-control');

module.exports = function(io) {
    // Rota para listar todos os materiais
    router.get('/materials', async (req, res) => {
        try {
            const materials = await MaterialControl.getAllMaterials();
            res.json(materials);
        } catch (error) {
            console.error('Erro ao buscar materiais:', error);
            res.status(500).json({ 
                error: true, 
                message: 'Erro ao buscar materiais',
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

    // Rota para buscar materiais alocados por colaborador
    router.get('/allocations/materials/:collaboratorId', async (req, res) => {
        try {
            const { collaboratorId } = req.params;
            const materials = await MaterialControl.getAllocatedMaterialsByCollaborator(collaboratorId);
            res.json(materials);
        } catch (error) {
            console.error('Erro ao buscar materiais alocados:', error);
            res.status(500).json({ 
                error: true, 
                message: 'Erro ao buscar materiais alocados',
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

    // Rota para buscar ID da alocação
    router.get('/allocations/find', async (req, res) => {
        try {
            const { material_id, collaborator_id, quantity } = req.query;

            // Converter para números inteiros
            const allocationData = {
                material_id: parseInt(material_id, 10),
                collaborator_id: parseInt(collaborator_id, 10),
                quantity: parseInt(quantity, 10)
            };

            // Validar parâmetros
            if (!allocationData.material_id || !allocationData.collaborator_id || !allocationData.quantity) {
                return res.status(400).json({ 
                    error: 'Parâmetros inválidos', 
                    details: 'Material, colaborador e quantidade são obrigatórios' 
                });
            }

            // Buscar alocação usando o método do controlador
            const allocation = await MaterialControl.findActiveAllocation(allocationData);

            res.status(200).json([allocation]);
        } catch (error) {
            console.error('Erro ao buscar ID da alocação:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar alocação', 
                details: error.message 
            });
        }
    });

    // Rota para sincronizar estoque de um material específico
    router.post('/materials/:id/sync-stock', async (req, res) => {
        try {
            const materialId = req.params.id;
            const result = await MaterialControl.calculateAndSyncStock(materialId);
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao sincronizar estoque do material:', error);
            res.status(500).json({ 
                error: 'Erro ao sincronizar estoque do material', 
                details: error.message 
            });
        }
    });

    // Rota para sincronizar estoque de todos os materiais
    router.post('/materials/sync-stock', async (req, res) => {
        try {
            const result = await MaterialControl.syncAllMaterialsStock();
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao sincronizar estoque de todos os materiais:', error);
            res.status(500).json({ 
                error: 'Erro ao sincronizar estoque de todos os materiais', 
                details: error.message 
            });
        }
    });

    // Rota para calcular estoque disponível de um material específico
    router.get('/materials/:id/available-stock', async (req, res) => {
        try {
            const materialId = req.params.id;
            const result = await MaterialControl.calculateAvailableStock(materialId);
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao calcular estoque disponível do material:', error);
            res.status(500).json({ 
                error: 'Erro ao calcular estoque disponível do material', 
                details: error.message 
            });
        }
    });

    // Rota para calcular estoque disponível de todos os materiais
    router.get('/materials/available-stock', async (req, res) => {
        try {
            const result = await MaterialControl.syncAllMaterialsStock();
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao calcular estoque disponível de todos os materiais:', error);
            res.status(500).json({ 
                error: 'Erro ao calcular estoque disponível de todos os materiais', 
                details: error.message 
            });
        }
    });

    // Rota para obter detalhes de estoque de um material específico
    router.get('/materials/:id/stock-details', async (req, res) => {
        try {
            const materialId = req.params.id;
            const stockDetails = await MaterialControl.calculateAvailableStock(materialId);
            res.status(200).json(stockDetails);
        } catch (error) {
            console.error('Erro ao buscar detalhes de estoque do material:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar detalhes de estoque do material', 
                details: error.message 
            });
        }
    });

    // Rota para buscar materiais alocados por colaborador
    router.get('/allocations/collaborator/:collaboratorId', async (req, res) => {
        try {
            const collaboratorId = parseInt(req.params.collaboratorId, 10);

            // Validar parâmetro
            if (!collaboratorId || isNaN(collaboratorId)) {
                return res.status(400).json({ 
                    error: 'Parâmetro inválido', 
                    details: 'ID do colaborador é obrigatório' 
                });
            }

            // Buscar materiais alocados usando o método do controlador
            const allocatedMaterials = await MaterialControl.getAllocatedMaterialsByCollaborator(collaboratorId);

            res.status(200).json(allocatedMaterials);
        } catch (error) {
            console.error('Erro ao buscar materiais alocados por colaborador:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar materiais alocados', 
                details: error.message 
            });
        }
    });

    // Rota para buscar colaboradores com materiais alocados ativos
    router.get('/allocations/active-collaborators', async (req, res) => {
        try {
            const collaborators = await MaterialControl.getCollaboratorsWithAllocatedMaterials();
            res.status(200).json(collaborators);
        } catch (error) {
            console.error('Erro ao buscar colaboradores com materiais alocados:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar colaboradores com materiais alocados', 
                details: error.message 
            });
        }
    });

    // Rota para editar material
    router.put('/edit-material', MaterialControl.editMaterial);

    // Rota para excluir material
    router.delete('/materials/:id', async (req, res) => {
        try {
            const materialId = req.params.id;
            const result = await MaterialControl.deleteMaterial(materialId);
            io.emit('materialDeleted', { id: materialId });
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao excluir material:', error);
            res.status(500).json({ 
                error: 'Erro ao excluir material', 
                details: error.message 
            });
        }
    });

    return router;
};
