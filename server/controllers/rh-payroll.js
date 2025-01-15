const { executeQuery } = require('../connect/mysql');

const rhPayroll = {

    // Busca as categorias de desconto
    categoryDiscount: async function () {
        const result = await executeQuery(`SELECT * FROM rh_payroll_discount_categories`);
        return result;
    },

    // Cria um novo desconto individual
    createDiscount: async function (data) {
        try {
            const result = await executeQuery(`
                INSERT INTO rh_payroll_discount_individual 
                (collaborator_id, category_id, amount, description, status, 
                attachment_path, reference_month, payment_date, discount_type) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.collaborator_id,
                    data.category_id,
                    data.amount,
                    data.description,
                    'pending',
                    data.attachment_path || null,
                    data.reference_month,
                    data.payment_date,
                    data.discount_type
                ]
            );
            return { success: true, id: result.insertId };
        } catch (error) {
            console.error('Erro ao criar desconto:', error);
            throw error;
        }
    },

    // Cria um novo desconto em lote
    createBatchDiscount: async function (data) {
        try {
            // Inicia uma transação
            await executeQuery('START TRANSACTION');

            // Insere o desconto em lote
            const batchResult = await executeQuery(`
                INSERT INTO rh_payroll_discount_batch 
                (category_id, amount, description, status, reference_month, 
                payment_date, discount_type) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.category_id,
                    data.amount,
                    data.description,
                    'pending',
                    data.reference_month,
                    data.payment_date,
                    data.discount_type
                ]
            );

            const batchId = batchResult.insertId;

            // Insere os colaboradores do lote
            for (const collaborator of data.collaborators) {
                await executeQuery(`
                    INSERT INTO rh_payroll_discount_batch_collaborators 
                    (batch_discount_id, collaborator_id, status) 
                    VALUES (?, ?, 'pending')`,
                    [batchId, collaborator.collaborator_id]
                );
            }

            // Confirma a transação
            await executeQuery('COMMIT');
            return { success: true, id: batchId };
        } catch (error) {
            // Em caso de erro, reverte a transação
            await executeQuery('ROLLBACK');
            console.error('Erro ao criar desconto em lote:', error);
            throw error;
        }
    },

    // Busca descontos pendentes
    getPendingDiscounts: async function () {
        try {
            // Busca descontos individuais pendentes
            const individualDiscounts = await executeQuery(`
                SELECT 
                    d.id,
                    d.collaborator_id,
                    d.category_id,
                    d.amount,
                    d.description,
                    d.status,
                    d.reference_month,
                    d.payment_date,
                    c.name_discount as category_name,
                    CONCAT(col.name, ' ', col.family_name) as collaborator_name,
                    'individual' as type
                FROM rh_payroll_discount_individual d
                JOIN rh_payroll_discount_categories c ON c.id = d.category_id
                JOIN collaborators col ON col.id = d.collaborator_id
                WHERE d.status = 'pending'
            `);

            // Busca descontos em lote pendentes
            const batchDiscounts = await executeQuery(`
                SELECT 
                    b.id,
                    bc.collaborator_id,
                    b.category_id,
                    b.amount,
                    b.description,
                    b.status,
                    b.reference_month,
                    b.payment_date,
                    c.name_discount as category_name,
                    CONCAT(col.name, ' ', col.family_name) as collaborator_name,
                    'batch' as type
                FROM rh_payroll_discount_batch b
                JOIN rh_payroll_discount_batch_collaborators bc ON bc.batch_discount_id = b.id
                JOIN rh_payroll_discount_categories c ON c.id = b.category_id
                JOIN collaborators col ON col.id = bc.collaborator_id
                WHERE b.status = 'pending' AND bc.status = 'pending'
            `);

            return [...individualDiscounts, ...batchDiscounts];
        } catch (error) {
            console.error('Erro ao buscar descontos pendentes:', error);
            throw error;
        }
    },

    // Processa descontos selecionados
    processDiscounts: async function (data) {
        try {
            await executeQuery('START TRANSACTION');

            
            const processingDate = new Date();

            for (const item of data.discounts) {
                const processedBy = item.processed_by;
                console.log(item.type === 'individual')
                if (item.type === 'individual') {
                    // Processa desconto individual
                    await executeQuery(`
                        UPDATE rh_payroll_discount_individual 
                        SET status = 'processed', 
                            processed_by = ?,
                            processing_date = ?
                        WHERE id = ?`,
                        [processedBy, processingDate, item.id]
                    );

                    // Registra no histórico
                    const discount = await executeQuery(
                        'SELECT * FROM rh_payroll_discount_individual WHERE id = ?',
                        [item.id]
                    );

                    await executeQuery(`
                        INSERT INTO rh_payroll_discount_processing_history
                        (discount_id, collaborator_id, processed_amount, processed_by, 
                        status, reference_month)
                        VALUES (?, ?, ?, ?, 'success', ?)`,
                        [
                            item.id,
                            discount[0].collaborator_id,
                            discount[0].amount,
                            processedBy,
                            discount[0].reference_month
                        ]
                    );
                } else {
                    // Processa desconto em lote
                    await executeQuery(`
                        UPDATE rh_payroll_discount_batch 
                        SET status = 'processed',
                            processed_by = ?,
                            processing_date = ?
                        WHERE id = ?`,
                        [processedBy, processingDate, item.id]
                    );

                    // Atualiza status dos colaboradores do lote
                    await executeQuery(`
                        UPDATE rh_payroll_discount_batch_collaborators
                        SET status = 'processed'
                        WHERE batch_discount_id = ?`,
                        [item.id]
                    );

                    // Registra no histórico para cada colaborador do lote
                    const batchCollaborators = await executeQuery(`
                        SELECT * FROM rh_payroll_discount_batch_collaborators
                        WHERE batch_discount_id = ?`,
                        [item.id]
                    );

                    const batchDiscount = await executeQuery(
                        'SELECT * FROM rh_payroll_discount_batch WHERE id = ?',
                        [item.id]
                    );

                    for (const collab of batchCollaborators) {
                        await executeQuery(`
                            INSERT INTO rh_payroll_discount_processing_history
                            (batch_discount_id, collaborator_id, processed_amount, 
                            processed_by, status, reference_month)
                            VALUES (?, ?, ?, ?, 'success', ?)`,
                            [
                                item.id,
                                collab.collaborator_id,
                                batchDiscount[0].amount,
                                processedBy,
                                batchDiscount[0].reference_month
                            ]
                        );
                    }
                }
            }

            await executeQuery('COMMIT');
            return { success: true };
        } catch (error) {
            await executeQuery('ROLLBACK');
            console.error('Erro ao processar descontos:', error);
            throw error;
        }
    },

    // Lista todos os descontos
    getAllDiscounts: async function () {
        try {
            // Busca descontos individuais
            const individualDiscounts = await executeQuery(`
                SELECT 
                    d.id,
                    d.collaborator_id,
                    d.category_id,
                    d.amount,
                    d.description,
                    d.status,
                    d.reference_month,
                    d.payment_date,
                    d.processing_date,
                    d.processed_by,
                    c.name_discount as category_name,
                    CONCAT(col.name, ' ', col.family_name) as collaborator_name,
                    CONCAT(proc.name, ' ', proc.family_name) as processed_by_name,
                    'individual' as type
                FROM rh_payroll_discount_individual d
                JOIN rh_payroll_discount_categories c ON c.id = d.category_id
                JOIN collaborators col ON col.id = d.collaborator_id
                LEFT JOIN collaborators proc ON proc.id = d.processed_by
                ORDER BY d.reference_month DESC, col.name ASC
            `);

            // Busca descontos em lote
            const batchDiscounts = await executeQuery(`
                SELECT 
                    b.id,
                    bc.collaborator_id,
                    b.category_id,
                    b.amount,
                    b.description,
                    b.status,
                    b.reference_month,
                    b.payment_date,
                    b.processing_date,
                    b.processed_by,
                    c.name_discount as category_name,
                    CONCAT(col.name, ' ', col.family_name) as collaborator_name,
                    CONCAT(proc.name, ' ', proc.family_name) as processed_by_name,
                    'batch' as type
                FROM rh_payroll_discount_batch b
                JOIN rh_payroll_discount_batch_collaborators bc ON bc.batch_discount_id = b.id
                JOIN rh_payroll_discount_categories c ON c.id = b.category_id
                JOIN collaborators col ON col.id = bc.collaborator_id
                LEFT JOIN collaborators proc ON proc.id = b.processed_by
                ORDER BY b.reference_month DESC, col.name ASC
            `);

            return { success: true, data: [...individualDiscounts, ...batchDiscounts] };
        } catch (error) {
            console.error('Erro ao buscar descontos:', error);
            throw error;
        }
    },

    // Cancela um desconto
    cancelDiscount: async function (data) {
        try {
            await executeQuery('START TRANSACTION');

            if (data.type === 'individual') {
                await executeQuery(`
                    UPDATE rh_payroll_discount_individual 
                    SET status = 'cancelled'
                    WHERE id = ? AND status = 'pending'`,
                    [data.id]
                );
            } else {
                // Cancela o desconto em lote
                await executeQuery(`
                    UPDATE rh_payroll_discount_batch 
                    SET status = 'cancelled'
                    WHERE id = ? AND status = 'pending'`,
                    [data.id]
                );

                // Cancela para todos os colaboradores do lote
                await executeQuery(`
                    UPDATE rh_payroll_discount_batch_collaborators
                    SET status = 'cancelled'
                    WHERE batch_discount_id = ? AND status = 'pending'`,
                    [data.id]
                );
            }

            await executeQuery('COMMIT');
            return { success: true };
        } catch (error) {
            await executeQuery('ROLLBACK');
            console.error('Erro ao cancelar desconto:', error);
            throw error;
        }
    },

    // Upload de arquivo
    handleFileUpload: async function (file) {
        try {
            // Aqui você implementaria a lógica de upload do arquivo
            // Por exemplo, salvando em um diretório específico e retornando o caminho
            const filePath = `/uploads/${file.filename}`;
            return { success: true, filePath };
        } catch (error) {
            console.error('Erro no upload do arquivo:', error);
            throw error;
        }
    }
};

module.exports = rhPayroll;