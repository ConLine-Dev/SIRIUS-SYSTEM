const { executeQuery } = require('../connect/mysql');

const MaterialControl = {
    // Listar todos os materiais
    getAllMaterials: async function() {
        try {
            const query = `
                SELECT 
                    id, 
                    name, 
                    description, 
                    category, 
                    sku, 
                    unit, 
                    minimum_stock, 
                    current_stock, 
                    status
                FROM material_control_materials
                ORDER BY name
            `;
            return await executeQuery(query);
        } catch (error) {
            console.error('Erro ao buscar materiais:', error);
            throw error;
        }
    },

    // Criar novo material
    createMaterial: async function(materialData) {
        try {
            const { 
                name, 
                description, 
                category, 
                sku, 
                unit, 
                minimum_stock, 
                status 
            } = materialData;

            const query = `
                INSERT INTO material_control_materials 
                (name, description, category, sku, unit, minimum_stock, current_stock, status)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?)
            `;
            const params = [
                name, 
                description, 
                category, 
                sku, 
                unit, 
                minimum_stock, 
                status
            ];

            const result = await executeQuery(query, params);
            return { 
                id: result.insertId, 
                message: 'Material criado com sucesso' 
            };
        } catch (error) {
            console.error('Erro ao criar material:', error);
            throw error;
        }
    },

    // Registrar entrada de estoque
    registerStockEntry: async function(entryData) {
        try {
            const { 
                material_id, 
                quantity, 
                source, 
                reason, 
                invoice_number, 
                observations 
            } = entryData;

            // Iniciar transação
            await executeQuery('START TRANSACTION');

            // Registrar movimentação
            const movementQuery = `
                INSERT INTO material_control_movements 
                (material_id, movement_type, quantity, source, reason, invoice_number, observations)
                VALUES (?, 'input', ?, ?, ?, ?, ?)
            `;
            const movementParams = [
                material_id, 
                quantity, 
                source, 
                reason, 
                invoice_number, 
                observations
            ];
            const movementResult = await executeQuery(movementQuery, movementParams);

            // Atualizar estoque do material
            const updateStockQuery = `
                UPDATE material_control_materials
                SET current_stock = current_stock + ?
                WHERE id = ?
            `;
            await executeQuery(updateStockQuery, [quantity, material_id]);

            // Confirmar transação
            await executeQuery('COMMIT');

            return { 
                movementId: movementResult.insertId, 
                message: 'Entrada de estoque registrada com sucesso' 
            };
        } catch (error) {
            // Reverter transação em caso de erro
            await executeQuery('ROLLBACK');
            console.error('Erro ao registrar entrada de estoque:', error);
            throw error;
        }
    },

    // Registrar saída de estoque
    registerStockOutput: async function(outputData) {
        try {
            const { 
                material_id, 
                quantity, 
                destination, 
                reason, 
                observations 
            } = outputData;

            // Iniciar transação
            await executeQuery('START TRANSACTION');

            // Verificar estoque disponível
            const stockCheckQuery = `
                SELECT current_stock 
                FROM material_control_materials 
                WHERE id = ?
            `;
            const [stockCheck] = await executeQuery(stockCheckQuery, [material_id]);
            
            if (stockCheck.current_stock < quantity) {
                throw new Error('Quantidade insuficiente em estoque');
            }

            // Registrar movimentação
            const movementQuery = `
                INSERT INTO material_control_movements 
                (material_id, movement_type, quantity, destination, reason, observations)
                VALUES (?, 'output', ?, ?, ?, ?)
            `;
            const movementParams = [
                material_id, 
                quantity, 
                destination, 
                reason, 
                observations
            ];
            const movementResult = await executeQuery(movementQuery, movementParams);

            // Atualizar estoque do material
            const updateStockQuery = `
                UPDATE material_control_materials
                SET current_stock = current_stock - ?
                WHERE id = ?
            `;
            await executeQuery(updateStockQuery, [quantity, material_id]);

            // Confirmar transação
            await executeQuery('COMMIT');

            return { 
                movementId: movementResult.insertId, 
                message: 'Saída de estoque registrada com sucesso' 
            };
        } catch (error) {
            // Reverter transação em caso de erro
            await executeQuery('ROLLBACK');
            console.error('Erro ao registrar saída de estoque:', error);
            throw error;
        }
    },

    // Alocar material para colaborador
    allocateMaterial: async function(allocationData) {
        try {
            const { 
                material_id, 
                collaborator_id, 
                quantity, 
                observations 
            } = allocationData;

            // Iniciar transação
            await executeQuery('START TRANSACTION');

            // Verificar estoque disponível
            const stockCheckQuery = `
                SELECT current_stock 
                FROM material_control_materials 
                WHERE id = ?
            `;
            const [stockCheck] = await executeQuery(stockCheckQuery, [material_id]);
            
            if (stockCheck.current_stock < quantity) {
                throw new Error('Quantidade insuficiente em estoque');
            }

            // Registrar alocação
            const allocationQuery = `
                INSERT INTO material_control_allocations 
                (material_id, collaborator_id, quantity, observations)
                VALUES (?, ?, ?, ?)
            `;
            const allocationParams = [
                material_id, 
                collaborator_id, 
                quantity, 
                observations
            ];
            const allocationResult = await executeQuery(allocationQuery, allocationParams);

            // Atualizar estoque do material
            const updateStockQuery = `
                UPDATE material_control_materials
                SET current_stock = current_stock - ?
                WHERE id = ?
            `;
            await executeQuery(updateStockQuery, [quantity, material_id]);

            // Confirmar transação
            await executeQuery('COMMIT');

            return { 
                allocationId: allocationResult.insertId, 
                message: 'Material alocado com sucesso' 
            };
        } catch (error) {
            // Reverter transação em caso de erro
            await executeQuery('ROLLBACK');
            console.error('Erro ao alocar material:', error);
            throw error;
        }
    },

    // Devolver material alocado
    returnAllocatedMaterial: async function(returnData) {
        try {
            const { 
                allocation_id, 
                quantity 
            } = returnData;

            // Iniciar transação
            await executeQuery('START TRANSACTION');

            // Buscar detalhes da alocação
            const allocationQuery = `
                SELECT material_id, collaborator_id, quantity
                FROM material_control_allocations
                WHERE id = ? AND status = 'allocated'
            `;
            const [allocation] = await executeQuery(allocationQuery, [allocation_id]);

            if (!allocation) {
                throw new Error('Alocação não encontrada ou já devolvida');
            }

            if (quantity > allocation.quantity) {
                throw new Error('Quantidade de devolução inválida');
            }

            // Atualizar status da alocação
            const updateAllocationQuery = `
                UPDATE material_control_allocations
                SET 
                    return_date = CURRENT_TIMESTAMP,
                    status = ?,
                    quantity = quantity - ?
                WHERE id = ?
            `;
            const updateParams = [
                quantity === allocation.quantity ? 'returned' : 'allocated', 
                quantity, 
                allocation_id
            ];
            await executeQuery(updateAllocationQuery, updateParams);

            // Atualizar estoque do material
            const updateStockQuery = `
                UPDATE material_control_materials
                SET current_stock = current_stock + ?
                WHERE id = ?
            `;
            await executeQuery(updateStockQuery, [quantity, allocation.material_id]);

            // Confirmar transação
            await executeQuery('COMMIT');

            return { 
                message: 'Material devolvido com sucesso' 
            };
        } catch (error) {
            // Reverter transação em caso de erro
            await executeQuery('ROLLBACK');
            console.error('Erro ao devolver material:', error);
            throw error;
        }
    },

    // Listar movimentações de materiais
    getMovementHistory: async function(filters = {}) {
        try {
            const { 
                material_id, 
                start_date, 
                end_date, 
                movement_type 
            } = filters;

            let query = `
                SELECT 
                    mcm.id, 
                    mcm.material_id, 
                    m.name AS material_name,
                    mcm.movement_type, 
                    mcm.quantity, 
                    mcm.source, 
                    mcm.destination,
                    mcm.reason, 
                    mcm.invoice_number, 
                    mcm.observations, 
                    mcm.movement_date,
                    c.name AS collaborator_name
                FROM material_control_movements mcm
                JOIN material_control_materials m ON mcm.material_id = m.id
                LEFT JOIN collaborators c ON mcm.collaborator_id = c.id
                WHERE 1=1
            `;

            const params = [];

            if (material_id) {
                query += ' AND mcm.material_id = ?';
                params.push(material_id);
            }

            if (start_date) {
                query += ' AND mcm.movement_date >= ?';
                params.push(start_date);
            }

            if (end_date) {
                query += ' AND mcm.movement_date <= ?';
                params.push(end_date);
            }

            if (movement_type) {
                query += ' AND mcm.movement_type = ?';
                params.push(movement_type);
            }

            query += ' ORDER BY mcm.movement_date DESC';

            return await executeQuery(query, params);
        } catch (error) {
            console.error('Erro ao buscar histórico de movimentações:', error);
            throw error;
        }
    }
};

module.exports = {
    MaterialControl
};
