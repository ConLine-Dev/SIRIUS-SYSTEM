const { executeQuery } = require('../connect/mysql');

const rhPayroll = {

    // Busca as categorias de desconto
    categoryDiscount: async function () {
        const result = await executeQuery(`SELECT * FROM rh_payroll_discount_categories`);
        return result;
    },

    // Cria um novo desconto individual
    createDiscount: async function (data) {
        console.log(data, 'createDiscount')
        try {
            const result = await executeQuery(`
                INSERT INTO rh_payroll_discount_individual 
                (collaborator_id, category_id, amount, date, description, status, 
                attachment_path, reference_month) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.collaborator_id,
                    data.category_id,
                    data.amount,
                    data.date,
                    data.description,
                    'pending',
                    data.attachment_path || null,
                    data.reference_month
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


           for (const collaborator of data.collaborators) {
                await executeQuery(`
                    INSERT INTO rh_payroll_discount_individual 
                    (collaborator_id, category_id, amount,date, description, status, reference_month) 
                    VALUES (?, ?, ?, ?, ?,?, ?)`,
                    [
                        collaborator.collaborator_id,
                        data.category_id,
                        data.amount,
                        data.date,
                        data.description,
                        'pending',
                        data.reference_month
                    ]
                );
            }
        
            // Confirma a transação
            await executeQuery('COMMIT');
            return { success: true };
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
                    d.attachment_path,
                    d.reference_month,
                    d.date,
                    c.name_discount as category_name,
                    CONCAT(col.name, ' ', col.family_name) as collaborator_name,
                    'individual' as type
                FROM rh_payroll_discount_individual d
                JOIN rh_payroll_discount_categories c ON c.id = d.category_id
                JOIN collaborators col ON col.id = d.collaborator_id
                WHERE d.status = 'pending'
            `);

            return [...individualDiscounts];
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
            console.log(data, 'processDiscounts')
            for (const item of data.discounts) {
                const processedBy = item.processed_by;
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
                    d.date,
                    d.processing_date,
                    d.processed_by,
                    d.attachment_path,
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

           
            return { success: true, data: [...individualDiscounts] };
        } catch (error) {
            console.error('Erro ao buscar descontos:', error);
            throw error;
        }
    },

    // Cancela um desconto
    cancelDiscount: async function (data) {
        try {
            await executeQuery('START TRANSACTION');

            await executeQuery(`
                UPDATE rh_payroll_discount_individual 
                SET status = 'cancelled'
                WHERE id = ? AND status = 'pending'`,
                [data.id]
            );

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
            const filePath = `${file.filename}`;
            return { success: true, filePath };
        } catch (error) {
            console.error('Erro no upload do arquivo:', error);
            throw error;
        }
    }
};

module.exports = rhPayroll;