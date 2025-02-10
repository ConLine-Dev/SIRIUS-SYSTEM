const { executeQuery } = require('../connect/mysql');

const MaterialControl = {
    // Método para obter todos os materiais com detalhes de estoque
    getAllMaterials: async () => {
        try {
            // Buscar informações básicas dos materiais
            const materialQuery = `
                SELECT 
                    m.*
                FROM material_control_materials m
                ORDER BY m.id DESC
            `;
            
            const materials = await executeQuery(materialQuery);

            // Para cada material, calcular o estoque atual usando calculateAndSyncStock
            const materialsWithStock = await Promise.all(
                materials.map(async (material) => {
                    try {
                        const stockDetails = await MaterialControl.calculateAndSyncStock(material.id);
                        // console.log(`Estoque calculado para material ${material.id}:`, stockDetails);
                        return {
                            ...material,
                            available_stock: stockDetails.current_stock,
                            stock_details: {
                                available_stock: stockDetails.current_stock,
                                total_input: stockDetails.total_input,
                                total_output: stockDetails.total_output,
                                total_allocated: stockDetails.total_allocated,
                                total_returned: stockDetails.total_returned,
                                minimum_stock: stockDetails.minimum_stock,
                                status: stockDetails.status,
                                stock_warning: stockDetails.stock_warning
                            }
                        };
                    } catch (error) {
                        console.error(`Erro ao calcular estoque para material ${material.id}:`, error);
                        return {
                            ...material,
                            available_stock: 0,
                            stock_details: {
                                available_stock: 0,
                                error: 'Erro ao calcular estoque'
                            }
                        };
                    }
                })
            );

            return materialsWithStock;
        } catch (error) {
            console.error('Erro ao buscar materiais:', error);
            throw new Error(`Erro ao buscar materiais: ${error.message}`);
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
                (name, description, category, sku, unit, minimum_stock, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
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

    // Método para calcular e sincronizar estoque de um material
    calculateAndSyncStock: async function(materialId) {
        try {
            // 1. Calcular entradas e saídas da tabela material_control_movements
            const movementsQuery = `
                SELECT 
                    COALESCE(SUM(CASE WHEN movement_type = 'input' THEN quantity ELSE 0 END), 0) as total_input,
                    COALESCE(SUM(CASE WHEN movement_type = 'output' THEN quantity ELSE 0 END), 0) as total_output
                FROM material_control_movements
                WHERE material_id = ?
            `;
            
            // 2. Calcular quantidade total alocada (material_control_allocations)
            const allocationsQuery = `
                SELECT 
                    COALESCE(SUM(quantity), 0) as total_allocated
                FROM material_control_allocations
                WHERE material_id = ? 
                AND status = 'allocated'
            `;
            
            // 3. Calcular quantidade total devolvida (material_control_returns)
            const returnsQuery = `
                SELECT 
                    COALESCE(SUM(r.quantity), 0) as total_returned
                FROM material_control_returns r
                INNER JOIN material_control_allocations a ON r.allocation_id = a.id
                WHERE r.material_id = ?
            `;

            // Executar todas as queries
            const [movementsResult] = await executeQuery(movementsQuery, [materialId]);
            const [allocationsResult] = await executeQuery(allocationsQuery, [materialId]);
            const [returnsResult] = await executeQuery(returnsQuery, [materialId]);
            
            // Buscar informações do material
            const materialQuery = `
                SELECT name, minimum_stock, status 
                FROM material_control_materials 
                WHERE id = ?
            `;
            const [materialInfo] = await executeQuery(materialQuery, [materialId]);

            // Calcular estoque atual
            const totalInput = movementsResult.total_input;
            const totalOutput = movementsResult.total_output;
            const totalAllocated = allocationsResult.total_allocated;
            const totalReturned = returnsResult.total_returned;

            // Estoque atual = (Entradas - Saídas) - (Alocados - Devolvidos)
            const currentStock = (totalInput - totalOutput) - (totalAllocated - totalReturned);

            // Determinar status do estoque
            let newStatus = 'active';
            if (currentStock <= 0) {
                newStatus = 'inactive';
            }

            // Atualizar status do material se necessário
            if (newStatus !== materialInfo.status) {
                const updateStatusQuery = `
                    UPDATE material_control_materials 
                    SET status = ? 
                    WHERE id = ?
                `;
                await executeQuery(updateStatusQuery, [newStatus, materialId]);
            }

            // Retornar detalhes completos do estoque
            return {
                material_id: materialId,
                material_name: materialInfo.name,
                total_input: totalInput,
                total_output: totalOutput,
                total_allocated: totalAllocated,
                total_returned: totalReturned,
                current_stock: currentStock,
                minimum_stock: materialInfo.minimum_stock,
                status: newStatus,
                stock_warning: currentStock <= materialInfo.minimum_stock ? 'Estoque baixo' : null,
                details: {
                    movements: {
                        inputs: totalInput,
                        outputs: totalOutput
                    },
                    allocations: {
                        total_allocated: totalAllocated,
                        total_returned: totalReturned,
                        currently_allocated: totalAllocated - totalReturned
                    }
                }
            };
        } catch (error) {
            console.error(`Erro ao calcular estoque do material ${materialId}:`, error);
            throw error;
        }
    },

    // Método para sincronizar estoque de todos os materiais
    syncAllMaterialsStock: async function() {
        try {
            // Buscar todos os materiais
            const materialsQuery = `
                SELECT id 
                FROM material_control_materials
            `;
            const materials = await executeQuery(materialsQuery);

            // Sincronizar estoque de cada material
            const syncResults = [];
            for (const material of materials) {
                try {
                    const syncResult = await this.calculateAndSyncStock(material.id);
                    syncResults.push(syncResult);
                } catch (error) {
                    console.error(`Erro ao sincronizar estoque do material ${material.id}:`, error);
                }
            }

            return {
                total_materials: materials.length,
                synced_materials: syncResults.length,
                results: syncResults
            };
        } catch (error) {
            console.error('Erro ao sincronizar estoque de todos os materiais:', error);
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

            // Sincronizar estoque do material
            const stockSyncResult = await this.calculateAndSyncStock(material_id);

            // Confirmar transação
            await executeQuery('COMMIT');

            return { 
                movementId: movementResult.insertId, 
                stockSyncResult,
                message: 'Entrada de estoque registrada e sincronizada com sucesso' 
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

            // Calcular estoque disponível
            const stockQuery = `
                SELECT 
                    COALESCE(SUM(CASE WHEN movement_type = 'input' THEN quantity ELSE 0 END), 0) as total_input,
                    COALESCE(SUM(CASE WHEN movement_type = 'output' THEN quantity ELSE 0 END), 0) as total_output
                FROM material_control_movements
                WHERE material_id = ?
            `;
            const [stockResult] = await executeQuery(stockQuery, [material_id]);
            
            const availableStock = stockResult.total_input - stockResult.total_output;
            
            if (availableStock < quantity) {
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

            // Sincronizar estoque do material
            const stockSyncResult = await this.calculateAndSyncStock(material_id);

            // Confirmar transação
            await executeQuery('COMMIT');

            return { 
                movementId: movementResult.insertId, 
                stockSyncResult,
                available_stock: availableStock,
                message: 'Saída de estoque registrada e sincronizada com sucesso' 
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

            // Calcular estoque disponível usando calculateAndSyncStock
            const stockDetails = await this.calculateAndSyncStock(material_id);
            const availableStock = stockDetails.current_stock;
            
            if (availableStock < quantity) {
                throw new Error(`Estoque insuficiente. Disponível: ${availableStock}, Solicitado: ${quantity}`);
            }

            // Buscar informações do material
            const materialQuery = 'SELECT name, sku FROM material_control_materials WHERE id = ?';
            const [materialInfo] = await executeQuery(materialQuery, [material_id]);

            // Buscar informações do colaborador
            const collaboratorQuery = 'SELECT full_name FROM collaborators WHERE id = ?';
            const [collaboratorInfo] = await executeQuery(collaboratorQuery, [collaborator_id]);

            // Registrar alocação
            const allocationQuery = `
                INSERT INTO material_control_allocations 
                (material_id, collaborator_id, quantity, status, observations)
                VALUES (?, ?, ?, 'allocated', ?)
            `;
            const allocationParams = [
                material_id, 
                collaborator_id, 
                quantity, 
                observations || `Alocação de ${quantity} unidades do material ${materialInfo.name} (SKU: ${materialInfo.sku}) para ${collaboratorInfo.full_name}`
            ];
            const allocationResult = await executeQuery(allocationQuery, allocationParams);

            // Confirmar transação
            await executeQuery('COMMIT');

            return { 
                allocationId: allocationResult.insertId,
                stockAvailability: {
                    total_input: stockDetails.total_input,
                    total_output: stockDetails.total_output,
                    total_allocated: stockDetails.total_allocated,
                    total_returned: stockDetails.total_returned,
                    available_stock: availableStock - quantity,
                    minimum_stock: stockDetails.minimum_stock,
                    stock_warning: stockDetails.stock_warning
                },
                materialName: materialInfo.name,
                materialSku: materialInfo.sku,
                collaboratorName: collaboratorInfo.full_name,
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
            // Iniciar transação para garantir consistência
            await executeQuery('START TRANSACTION');

            const { 
                allocation_id, 
                material_id, 
                collaborator_id, 
                quantity, 
                material_condition, 
                observations 
            } = returnData;

            // Converter IDs para números
            const numericAllocationId = parseInt(allocation_id);
            const numericMaterialId = parseInt(material_id);
            const numericCollaboratorId = parseInt(collaborator_id);
            const numericQuantity = parseInt(quantity);

            // Verificar detalhes da alocação original
            const allocationQuery = `
                SELECT 
                    id, 
                    material_id AS allocation_material_id, 
                    collaborator_id AS allocation_collaborator_id, 
                    quantity AS allocated_quantity,
                    status
                FROM material_control_allocations
                WHERE id = ?
            `;
            const [allocation] = await executeQuery(allocationQuery, [numericAllocationId]);

            // Validações de integridade
            if (!allocation) {
                throw new Error('Alocação não encontrada');
            }

            if (allocation.allocation_material_id !== numericMaterialId) {
                throw new Error('Material ID não corresponde à alocação');
            }

            if (allocation.allocation_collaborator_id !== numericCollaboratorId) {
                throw new Error('Colaborador ID não corresponde à alocação');
            }

            if (allocation.status === 'returned') {
                throw new Error('Alocação já finalizada');
            }

            if (numericQuantity > allocation.allocated_quantity) {
                throw new Error('Quantidade de devolução maior que a quantidade alocada');
            }

            // Registrar devolução
            const returnQuery = `
                INSERT INTO material_control_returns 
                (allocation_id, material_id, collaborator_id, quantity, material_condition, observations)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const returnResult = await executeQuery(returnQuery, [
                numericAllocationId,
                numericMaterialId,
                numericCollaboratorId,
                numericQuantity,
                material_condition || 'perfeito',
                observations || ''
            ]);

            // Calcular quantidade restante
            const remainingQuantity = allocation.allocated_quantity - numericQuantity;

            // Atualizar status da alocação
            const updateAllocationQuery = `
                UPDATE material_control_allocations
                SET 
                    status = CASE 
                        WHEN ? = 0 THEN 'returned'
                        ELSE 'allocated'
                    END,
                    return_date = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            await executeQuery(updateAllocationQuery, [
                remainingQuantity, 
                numericAllocationId
            ]);

            // Confirmar transação
            await executeQuery('COMMIT');

            return { 
                success: true,
                returnId: returnResult.insertId, 
                message: 'Material devolvido com sucesso',
                remainingQuantity: remainingQuantity
            };
        } catch (error) {
            // Reverter transação em caso de erro
            await executeQuery('ROLLBACK');
            console.error('Erro ao devolver material:', error);
            throw error;
        }
    },

    // Método auxiliar para obter o último ID inserido
    _getLastInsertId: async function() {
        const [result] = await executeQuery('SELECT LAST_INSERT_ID() as id');
        return result.id;
    },

    // Buscar ID da alocação ativa
    findActiveAllocation: async function(allocationData) {
        try {
            const { 
                material_id, 
                collaborator_id, 
                quantity 
            } = allocationData;

            // Consulta para buscar alocação ativa
            const query = `
                SELECT id, quantity, allocation_date
                FROM material_control_allocations
                WHERE 
                    material_id = ? AND 
                    collaborator_id = ? AND 
                    quantity = ? AND
                    status = 'allocated'
                ORDER BY allocation_date DESC
                LIMIT 1
            `;
            
            const params = [
                material_id, 
                collaborator_id, 
                quantity
            ];

            const [allocation] = await executeQuery(query, params);

            if (!allocation) {
                throw new Error('Nenhuma alocação ativa encontrada');
            }

            return allocation;
        } catch (error) {
            console.error('Erro ao buscar alocação ativa:', error);
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

            let baseQuery = `WITH MovementData AS (
                    SELECT 
                        'movement' AS source,
                        mcm.id, 
                        mcm.material_id, 
                        m.name AS material_name,
                        mcm.movement_type AS original_movement_type, 
                        mcm.quantity, 
                        mcm.source AS movement_source, 
                        mcm.destination,
                        mcm.reason, 
                        mcm.invoice_number, 
                        mcm.observations, 
                        mcm.movement_date AS movement_date,
                        CASE 
                            WHEN mcm.movement_type = 'input' THEN NULL
                            ELSE c.name 
                        END AS collaborator_name,
                        mcm.collaborator_id,
                        CASE 
                            WHEN mcm.movement_type = 'input' THEN 'Entrada'
                            WHEN mcm.movement_type = 'output' THEN 'Saída'
                            ELSE 'Alocação'
                        END AS movement_type_label,
                        mcm.quantity AS original_quantity,
                        NULL AS real_quantity
                    FROM material_control_movements mcm
                    JOIN material_control_materials m ON mcm.material_id = m.id
                    LEFT JOIN collaborators c ON mcm.collaborator_id = c.id

                    UNION ALL

                    SELECT 
                        'allocation' AS source,
                        mca.id, 
                        mca.material_id, 
                        m.name AS material_name,
                        'allocation' AS original_movement_type, 
                        mca.quantity AS quantity,
                        NULL AS movement_source, 
                        NULL AS destination,
                        'allocation' AS reason, 
                        NULL AS invoice_number, 
                        mca.observations, 
                        mca.allocation_date AS movement_date,
                        CONCAT(c.name, ' ', c.family_name) as collaborator_name,
                        mca.collaborator_id,
                        'Alocação' AS movement_type_label,
                        mca.quantity AS original_quantity,
                        CAST((mca.quantity - COALESCE(
                            (SELECT SUM(mcr.quantity) 
                             FROM material_control_returns mcr 
                             WHERE mcr.allocation_id = mca.id), 
                            0)
                        ) AS SIGNED) AS real_quantity
                    FROM material_control_allocations mca
                    JOIN material_control_materials m ON mca.material_id = m.id
                    JOIN collaborators c ON mca.collaborator_id = c.id

                    UNION ALL

                    SELECT 
                        'return' AS source,
                        mcr.id, 
                        mcr.material_id, 
                        m.name AS material_name,
                        'return' AS original_movement_type, 
                        mcr.quantity, 
                        NULL AS movement_source, 
                        NULL AS destination,
                        mcr.material_condition AS reason, 
                        NULL AS invoice_number, 
                        mcr.observations, 
                        mcr.return_date AS movement_date,
                        CONCAT(c.name, ' ', c.family_name) as collaborator_name,
                        mcr.collaborator_id,
                        'Devolução' AS movement_type_label,
                        mcr.quantity AS original_quantity,
                        NULL AS real_quantity
                    FROM material_control_returns mcr
                    JOIN material_control_materials m ON mcr.material_id = m.id
                    JOIN collaborators c ON mcr.collaborator_id = c.id
                )
                SELECT * FROM MovementData
                WHERE 1=1`;

            const params = [];

            // Filtro por material_id
            if (material_id) {
                baseQuery += ' AND material_id = ?';
                params.push(material_id);
            }

            // Filtro por data inicial
            if (start_date) {
                baseQuery += ' AND movement_date >= ?';
                params.push(start_date);
            }

            // Filtro por data final
            if (end_date) {
                baseQuery += ' AND movement_date <= ?';
                params.push(end_date);
            }

            // Filtro por tipo de movimentação
            if (movement_type) {
                // Mapear tipos de movimentação para os valores corretos
                const movementTypeMap = {
                    'movement': 'movement',
                    'allocation': 'allocation',
                    'return': 'return',
                    'input': 'input',
                    'output': 'output'
                };

                const mappedType = movementTypeMap[movement_type];
                
                if (mappedType) {
                    // Para 'input' e 'output', usar original_movement_type
                    if (mappedType === 'input' || mappedType === 'output') {
                        baseQuery += ' AND original_movement_type = ?';
                    } else {
                        // Para outros tipos, usar source
                        baseQuery += ' AND source = ?';
                    }
                    params.push(mappedType);
                }
            }

            // Ordenação e limite
            baseQuery += ' ORDER BY movement_date DESC LIMIT 100';

            // console.log('Query de movimento:', baseQuery);
            // console.log('Parâmetros:', params);

            const results = await executeQuery(baseQuery, params);
            
            // console.log('Resultados do movimento:', results);

            return results;
        } catch (error) {
            console.error('Erro detalhado ao buscar histórico de movimentações:', {
                message: error.message,
                stack: error.stack,
                query: baseQuery,
                params: params
            });
            throw error;
        }
    },

    // Método para calcular estoque disponível considerando todas as movimentações
    calculateAvailableStock: async function(materialId) {
        try {
            // Consulta para calcular entradas de estoque
            const inputQuery = `
                SELECT COALESCE(SUM(quantity), 0) as total_input
                FROM material_control_movements
                WHERE material_id = ? AND movement_type = 'input'
            `;
            const [inputResult] = await executeQuery(inputQuery, [materialId]);

            // Consulta para calcular saídas de estoque (movimentações de saída)
            const outputQuery = `
                SELECT COALESCE(SUM(quantity), 0) as total_output
                FROM material_control_movements
                WHERE material_id = ? AND movement_type = 'output'
            `;
            const [outputResult] = await executeQuery(outputQuery, [materialId]);

            // Consulta para calcular materiais alocados
            const allocatedQuery = `
                SELECT COALESCE(SUM(quantity), 0) as total_allocated
                FROM material_control_allocations
                WHERE material_id = ? AND status = 'allocated'
            `;
            const [allocatedResult] = await executeQuery(allocatedQuery, [materialId]);

            // Calcular estoque disponível
            const totalInput = parseInt(inputResult.total_input);
            const totalOutput = parseInt(outputResult.total_output);
            const totalAllocated = parseInt(allocatedResult.total_allocated);

            // Cálculo do estoque disponível
            const availableStock = totalInput - totalOutput - totalAllocated;

            // Buscar informações do material para verificar status de estoque
            const materialQuery = `
                SELECT name, minimum_stock 
                FROM material_control_materials 
                WHERE id = ?
            `;
            const [materialInfo] = await executeQuery(materialQuery, [materialId]);

            // Determinar status do estoque
            let status = 'active';
            if (availableStock <= 0) {
                status = 'inactive';
            } else if (availableStock <= materialInfo.minimum_stock) {
                status = 'low_stock';
            }

            return {
                material_id: materialId,
                material_name: materialInfo.name,
                total_input: totalInput,
                total_output: totalOutput,
                total_allocated: totalAllocated,
                available_stock: availableStock,
                minimum_stock: materialInfo.minimum_stock,
                status: status,
                details: {
                    inputs: {
                        total: totalInput,
                        description: 'Total de entradas de estoque'
                    },
                    outputs: {
                        total: totalOutput,
                        description: 'Total de saídas de estoque'
                    },
                    allocations: {
                        total: totalAllocated,
                        description: 'Total de materiais alocados'
                    }
                },
                message: 'Estoque disponível calculado com sucesso'
            };
        } catch (error) {
            console.error(`Erro ao calcular estoque do material ${materialId}:`, error);
            throw error;
        }
    },

    // Método para sincronizar estoque de todos os materiais
    syncAllMaterialsStock: async function() {
        try {
            // Buscar todos os materiais
            const materialsQuery = `
                SELECT id 
                FROM material_control_materials
            `;
            const materials = await executeQuery(materialsQuery);

            // Sincronizar estoque de cada material
            const syncResults = [];
            for (const material of materials) {
                try {
                    const syncResult = await this.calculateAvailableStock(material.id);
                    syncResults.push(syncResult);
                } catch (error) {
                    console.error(`Erro ao sincronizar estoque do material ${material.id}:`, error);
                }
            }

            return {
                total_materials: materials.length,
                synced_materials: syncResults.length,
                results: syncResults
            };
        } catch (error) {
            console.error('Erro ao sincronizar estoque de todos os materiais:', error);
            throw error;
        }
    },

    // Método para buscar materiais alocados por colaborador
    getAllocatedMaterialsByCollaborator: async function(collaboratorId) {
        try {
            const query = `
                SELECT 
                    m.id,
                    m.name,
                    m.sku,
                    m.unit,
                    ma.id as allocation_id,
                    SUM(ma.quantity - COALESCE(mr.quantity, 0)) as available_quantity
                FROM 
                    material_control_materials m
                    INNER JOIN material_control_allocations ma ON m.id = ma.material_id
                    LEFT JOIN material_control_returns mr ON ma.id = mr.allocation_id
                WHERE 
                    ma.collaborator_id = ?
                    AND ma.status = 'allocated'
                    AND (ma.quantity - COALESCE(mr.quantity, 0)) > 0
                GROUP BY 
                    m.id, m.name, m.sku, m.unit, ma.id
                HAVING 
                    available_quantity > 0
            `;

            const materials = await executeQuery(query, [collaboratorId]);
            return materials;
        } catch (error) {
            console.error('Erro ao buscar materiais alocados:', error);
            throw new Error('Erro ao buscar materiais alocados');
        }
    },

    // Editar material existente
    editMaterial: async function(req, res) {
        try {
            const { 
                material_id, 
                name, 
                description, 
                category, 
                sku, 
                unit, 
                minimum_stock, 
                status 
            } = req.body;

            // Validar dados de entrada
            if (!material_id) {
                return res.status(400).json({ 
                    error: 'ID do material é obrigatório',
                    details: 'Não foi possível identificar o material para edição' 
                });
            }

            // Preparar query de atualização
            const updateQuery = `
                UPDATE material_control_materials 
                SET 
                    name = ?, 
                    description = ?, 
                    category = ?, 
                    sku = ?, 
                    unit = ?, 
                    minimum_stock = ?, 
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const updateParams = [
                name, 
                description || null, 
                category, 
                sku, 
                unit, 
                minimum_stock || 0, 
                status,
                material_id
            ];

            // Executar atualização
            const result = await executeQuery(updateQuery, updateParams);

            // Verificar se algum registro foi atualizado
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    error: 'Material não encontrado',
                    details: `Não foi possível encontrar material com ID ${material_id}` 
                });
            }

            // Buscar material atualizado para retornar
            const selectQuery = `
                SELECT * FROM material_control_materials 
                WHERE id = ?
            `;
            const [updatedMaterial] = await executeQuery(selectQuery, [material_id]);

            res.status(200).json({
                message: 'Material atualizado com sucesso',
                material: updatedMaterial
            });
        } catch (error) {
            console.error('Erro ao editar material:', error);
            res.status(500).json({ 
                error: 'Erro ao editar material',
                details: error.message 
            });
        }
    },

    // Método para excluir material
    deleteMaterial: async (materialId) => {
        try {
            // Primeiro, verificar se existem movimentações para este material
            const checkMovementsQuery = 'SELECT COUNT(*) as count FROM material_control_movements WHERE material_id = ?';
            const [movementsResult] = await executeQuery(checkMovementsQuery, [materialId]);
            
            if (movementsResult.count > 0) {
                throw new Error('MATERIAL_HAS_MOVEMENTS');
            }

            // Se não houver movimentações, prosseguir com a exclusão
            const deleteQuery = 'DELETE FROM material_control_materials WHERE id = ?';
            await executeQuery(deleteQuery, [materialId]);
            
            return { 
                success: true, 
                message: 'Material excluído com sucesso' 
            };
        } catch (error) {
            console.error('Erro ao excluir material:', error);
            
            if (error.message === 'MATERIAL_HAS_MOVEMENTS') {
                throw new Error('Não é possível excluir este material pois existem movimentações (entradas/saídas) associadas a ele.');
            } else if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error('Não é possível excluir este material pois ele está sendo usado em outras partes do sistema.');
            }
            
            throw new Error('Erro ao excluir material');
        }
    },

    // Método para buscar colaboradores com materiais alocados ativos
    getCollaboratorsWithAllocatedMaterials: async function() {
        try {
            const query = `
                SELECT DISTINCT 
                    c.id,
                    c.name,
                    c.family_name,
                    c.email_business as email,
                    c.department
                FROM 
                    collaborators c
                INNER JOIN 
                    material_control_allocations mca ON c.id = mca.collaborator_id
                LEFT JOIN 
                    material_control_returns mcr ON mca.id = mcr.allocation_id
                WHERE 
                    mca.status = 'allocated'
                GROUP BY 
                    c.id,
                    c.name,
                    c.family_name,
                    c.email_business,
                    c.department
                HAVING 
                    SUM(mca.quantity) - COALESCE(SUM(mcr.quantity), 0) > 0
                ORDER BY 
                    c.name ASC
            `;

            const collaborators = await executeQuery(query);
            
            // Mapear os resultados para o formato esperado pelo frontend
            return collaborators.map(collaborator => ({
                id_colab: collaborator.id, // Mantendo compatibilidade com o frontend
                name: collaborator.name,
                family_name: collaborator.family_name,
                email: collaborator.email,
                department: collaborator.department
            }));
        } catch (error) {
            console.error('Erro ao buscar colaboradores com materiais alocados:', error);
            throw error;
        }
    },
};

module.exports = {
    MaterialControl
};
