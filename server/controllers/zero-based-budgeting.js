const { executeQuery } = require('../connect/mysql');
const { sendEmail } = require('../support/send-email');
const { emailCustom } = require('../support/emails-template');

const zeroBasedCostCenter = {
    // ==================== Centros de Custo ====================
    
    // Obter todos os centros de custo existentes no sistema
    getAllCostCenters: async function(collaborator_id) {
        const result = await executeQuery(`
            SELECT 
                cc.*, 
                GROUP_CONCAT(
                    CONCAT(c.name, ' ', c.family_name) 
                    ORDER BY c.name
                    SEPARATOR '|'
                ) as responsibleNames,
                GROUP_CONCAT(
                    c.id_headcargo 
                    ORDER BY c.name
                    SEPARATOR '|'
                ) as responsibleAvatars
            FROM 
                zero_based_cost_centers cc
            LEFT JOIN 
                zero_based_cost_center_responsibles ccr ON ccr.cost_center_id = cc.id
            LEFT JOIN 
                collaborators c ON c.id = ccr.responsible_id
            GROUP BY cc.id
            ORDER BY cc.name ASC
        `);

        const formattedCostCenters = result.map(item => {
            const responsibleNames = item.responsibleNames ? item.responsibleNames.split('|') : [];
            const responsibleAvatars = item.responsibleAvatars ? item.responsibleAvatars.split('|') : [];
            
            return {
                id: item.id,
                name: item.name.toUpperCase(),
                description: item.description,
                responsibleNames: responsibleNames,
                responsibleAvatars: responsibleAvatars,
                responsibleCount: responsibleNames.length
            };
        });

        return formattedCostCenters;
    },
    
    // Obter apenas os centros de custo onde o usuário é responsável
    getCostCentersByUser: async function(collaborator_id) {
        const result = await executeQuery(`
            SELECT DISTINCT
                cc.id, cc.name
            FROM 
                zero_based_cost_centers cc
            JOIN 
                zero_based_cost_center_responsibles ccr ON ccr.cost_center_id = cc.id
            WHERE 
                ccr.responsible_id = ${collaborator_id}
        `);

        return result;
    },
    
    // Obter detalhes de um centro de custo específico
    getCostCenterView: async function(id) {
        const result = await executeQuery(`
            SELECT 
                cc.*,
                GROUP_CONCAT(
                    CONCAT(c.name, ' ', c.family_name) 
                    ORDER BY c.name
                    SEPARATOR '|'
                ) as responsibleNames,
                GROUP_CONCAT(
                    c.id_headcargo 
                    ORDER BY c.name
                    SEPARATOR '|'
                ) as responsibleAvatars,
                GROUP_CONCAT(
                    c.id 
                    ORDER BY c.name
                    SEPARATOR '|'
                ) as responsibleIds
            FROM 
                zero_based_cost_centers cc
            LEFT JOIN 
                zero_based_cost_center_responsibles ccr ON ccr.cost_center_id = cc.id
            LEFT JOIN 
                collaborators c ON c.id = ccr.responsible_id
            WHERE 
                cc.id = ${id}
            GROUP BY cc.id
        `);

        if (result.length === 0) {
            return null;
        }

        const item = result[0];
        const responsibleNames = item.responsibleNames ? item.responsibleNames.split('|') : [];
        const responsibleAvatars = item.responsibleAvatars ? item.responsibleAvatars.split('|') : [];
        const responsibleIds = item.responsibleIds ? item.responsibleIds.split('|') : [];
        
        return {
            id: item.id,
            name: item.name.toUpperCase(),
            description: item.description,
            responsible_ids: responsibleIds,
            responsibleNames: responsibleNames,
            responsibleAvatars: responsibleAvatars,
            created_at: this.formatDateToPtBr(item.created_at),
            updated_at: this.formatDateToPtBr(item.updated_at)
        };
    },
    
    // Criar um novo centro de custo
    createCostCenter: async function(form) {
        const created_at = new Date();
        const formattedDate = this.formatDateForDatabase(created_at);
        
        const name = form.name.toUpperCase();
        
        // Iniciar transação
        await executeQuery('START TRANSACTION');
        
        try {
            // Inserir o centro de custo
            const costCenterResult = await executeQuery(`
                INSERT INTO zero_based_cost_centers 
                (name, description, created_at, updated_at) 
                VALUES 
                (?, ?, ?, ?)
            `, [
                name,
                form.description,
                formattedDate,
                formattedDate
            ]);
            
            const costCenterId = costCenterResult.insertId;
            
            // Inserir os responsáveis
            if (form.responsibles && form.responsibles.length > 0) {
                const responsibleValues = form.responsibles.map(responsibleId => 
                    [costCenterId, responsibleId, formattedDate]
                );
                
                await executeQuery(`
                    INSERT INTO zero_based_cost_center_responsibles 
                    (cost_center_id, responsible_id, created_at) 
                    VALUES ?
                `, [responsibleValues]);
            }
            
            await executeQuery('COMMIT');
            return costCenterResult;
            
        } catch (error) {
            await executeQuery('ROLLBACK');
            throw error;
        }
    },
    
    // Atualizar um centro de custo existente
    updateCostCenter: async function(form) {
        const updated_at = new Date();
        const formattedDate = this.formatDateForDatabase(updated_at);
        
        const name = form.name.toUpperCase();
        
        // Iniciar transação
        await executeQuery('START TRANSACTION');
        
        try {
            // Atualizar o centro de custo
            await executeQuery(`
                UPDATE zero_based_cost_centers 
                SET 
                    name = ?, 
                    description = ?, 
                    updated_at = ? 
                WHERE id = ?
            `, [
                name,
                form.description,
                formattedDate,
                form.id
            ]);
            
            // Remover responsáveis existentes
            await executeQuery(`
                DELETE FROM zero_based_cost_center_responsibles 
                WHERE cost_center_id = ?
            `, [form.id]);
            
            // Inserir novos responsáveis
            if (form.responsibles && form.responsibles.length > 0) {
                const responsibleValues = form.responsibles.map(responsibleId => 
                    [form.id, responsibleId, formattedDate]
                );
                
                await executeQuery(`
                    INSERT INTO zero_based_cost_center_responsibles 
                    (cost_center_id, responsible_id, created_at) 
                    VALUES ?
                `, [responsibleValues]);
            }
            
            await executeQuery('COMMIT');
            return { success: true };
            
        } catch (error) {
            await executeQuery('ROLLBACK');
            throw error;
        }
    },
    
    // Deletar um centro de custo
    deleteCostCenter: async function(id) {
        // Primeiro verificar se existem solicitações de gastos associadas
        const checkRequests = await executeQuery(`
            SELECT COUNT(*) as count 
            FROM zero_based_expense_requests 
            WHERE cost_center_id = ?
        `, [id]);
        
        if (checkRequests[0].count > 0) {
            throw new Error('Não é possível excluir este centro de custo porque existem solicitações de gastos associadas.');
        }
        
        const result = await executeQuery(`
            DELETE FROM zero_based_cost_centers 
            WHERE id = ?
        `, [id]);
        
        return result;
    },
    
    // ==================== Solicitações de Gastos ====================
    
    // Obter todas as solicitações de gastos
    getAllExpenseRequests: async function(collaborator_id) {
        const result = await executeQuery(`
            SELECT 
                er.*,
                cc.name as costCenterName
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            ORDER BY
                er.created_at DESC
        `);

        // Processamento em lote para buscar todos os itens de todas as solicitações
        const requestIds = result.map(item => item.id);
        
        // Se não há solicitações, retornar array vazio
        if (requestIds.length === 0) {
            return [];
        }
        
        // Buscar todos os itens de todas as solicitações de uma vez
        const itemsResult = await executeQuery(`
            SELECT 
                i.*,
                zc.name as categoryName
            FROM 
                zero_based_expense_items i
            LEFT JOIN
                zero_based_categories zc ON zc.id = i.category
            WHERE 
                i.expense_request_id IN (?)
            ORDER BY
                i.expense_request_id, i.id
        `, [requestIds]);
        
        // Agrupar os itens por solicitação
        const itemsByRequest = {};
        itemsResult.forEach(item => {
            if (!itemsByRequest[item.expense_request_id]) {
                itemsByRequest[item.expense_request_id] = [];
            }
            itemsByRequest[item.expense_request_id].push(item);
        });
        
        // Formatar as solicitações com seus itens e totais
        const formattedRequests = result.map(request => {
            // Obter os itens para esta solicitação
            const items = itemsByRequest[request.id] || [];
            
            // Calcular o total da solicitação
            let totalValue = 0;
            let mainCategory = '';
            let mainDescription = '';
            
            if (items.length > 0) {
                // Calcular o total somando todos os itens
                totalValue = items.reduce((sum, item) => {
                    return sum + (parseFloat(item.quantity) * parseFloat(item.amount));
                }, 0);
                
                // Usar categoria e descrição do primeiro item como referência
                mainCategory = items[0].categoryName || `Categoria ID: ${items[0].category}`;
                mainDescription = items.length === 1 
                    ? items[0].description 
                    : `${items[0].description} e mais ${items.length - 1} ${items.length === 2 ? 'item' : 'itens'}`;
            }
            
            // Formatação do valor total para exibição
            const formattedTotalAmount = new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(totalValue);
            
            // Formatação do status com badge
            let statusBadge;
            switch(request.status) {
                case 'Aprovado':
                    statusBadge = `<span class="badge badge-approved">Aprovado</span>`;
                    break;
                case 'Rejeitado':
                    statusBadge = `<span class="badge badge-rejected">Rejeitado</span>`;
                    break;
                case 'Aprovação Parcial':
                    statusBadge = `<span class="badge badge-partial">Aprovação Parcial</span>`;
                    break;
                default: // Pendente
                    statusBadge = `<span class="badge badge-pending">Pendente</span>`;
            }
            
            return {
                id: request.id,
                month: request.month,
                costCenterName: request.costCenterName.toUpperCase(),
                category: mainCategory,
                description: mainDescription,
                item_count: items.length,
                amount: formattedTotalAmount,
                status: statusBadge,
                created_at: this.formatDateToPtBr(request.created_at),
                requesterId: request.requester_id
            };
        });

        return formattedRequests;
    },
    
    // Obter detalhes de uma solicitação de gasto específica
    getExpenseRequestView: async function(id) {
        try {
            if (!id) {
                throw new Error('ID da solicitação não informado');
            }
            
            console.log('Buscando solicitação com ID:', id);
            
            const result = await executeQuery(`
                SELECT 
                    er.*,
                    cc.name as costCenterName,
                    c.name as requesterName,
                    c.family_name as requesterFamilyName,
                    c.id_headcargo as requesterAvatar
                FROM 
                    zero_based_expense_requests er
                JOIN 
                    zero_based_cost_centers cc ON cc.id = er.cost_center_id
                JOIN
                    collaborators c ON c.id = er.requester_id
                WHERE 
                    er.id = ?
            `, [id]);

            if (result.length === 0) {
                return null;
            }

            const item = result[0];
            
            // Buscar os itens da solicitação
            const items = await executeQuery(`
                SELECT 
                    i.*,
                    zc.name as categoryName
                FROM 
                    zero_based_expense_items i
                LEFT JOIN
                    zero_based_categories zc ON zc.id = i.category
                WHERE 
                    i.expense_request_id = ?
                ORDER BY
                    i.id ASC
            `, [id]);
            
            // Formatar os itens e calcular subtotais
            const formattedItems = [];
            let totalValue = 0;
            
            for (const expenseItem of items) {
                const itemTotal = parseFloat(expenseItem.quantity) * parseFloat(expenseItem.amount);
                totalValue += itemTotal;
                
                formattedItems.push({
                    id: expenseItem.id,
                    category_id: expenseItem.category,
                    categoryName: expenseItem.categoryName || `Categoria ID: ${expenseItem.category}`,
                    description: expenseItem.description,
                    quantity: expenseItem.quantity,
                    amount: new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                    }).format(expenseItem.amount),
                    raw_amount: expenseItem.amount,
                    subtotal: new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                    }).format(itemTotal),
                    raw_subtotal: itemTotal
                });
            }
            
            // Formatação do valor total para exibição
            const totalAmount = new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(totalValue);
            
            // Buscar as aprovações
            const approvals = await executeQuery(`
                SELECT 
                    ea.*,
                    c.name as approverName,
                    c.family_name as approverFamilyName,
                    c.id_headcargo as approverAvatar
                FROM 
                    zero_based_expense_approvals ea
                JOIN
                    collaborators c ON c.id = ea.approver_id
                WHERE 
                    ea.expense_request_id = ?
                ORDER BY
                    ea.created_at ASC
            `, [id]);
            
            const formattedRequest = {
                id: item.id,
                month: item.month,
                cost_center_id: item.cost_center_id,
                costCenterName: item.costCenterName.toUpperCase(),
                strategic_contribution: item.strategic_contribution,
                status: item.status,
                requester_id: item.requester_id,
                requesterName: `${item.requesterName} ${item.requesterFamilyName}`,
                requesterAvatar: `https://cdn.conlinebr.com.br/colaboradores/${item.requesterAvatar}`,
                created_at: this.formatDateToPtBr(item.created_at),
                updated_at: this.formatDateToPtBr(item.updated_at),
                items: formattedItems,
                total_amount: totalAmount,
                raw_total_amount: totalValue,
                approvals: approvals.map(approval => ({
                    id: approval.id,
                    expense_request_id: approval.expense_request_id,
                    approver_id: approval.approver_id,
                    approverName: `${approval.approverName} ${approval.approverFamilyName}`,
                    approverAvatar: `https://cdn.conlinebr.com.br/colaboradores/${approval.approverAvatar}`,
                    status: approval.status,
                    comment: approval.comment,
                    created_at: this.formatDateToPtBr(approval.created_at)
                }))
            };
            
            return formattedRequest;
        } catch (error) {
            console.error('Erro ao buscar detalhes da solicitação:', error);
            throw error;
        }
    },
    
    // Criar uma nova solicitação de gasto
    createExpenseRequest: async function(form) {
        const created_at = new Date();
        const formattedDate = this.formatDateForDatabase(created_at);
        
        // Criar a solicitação principal (agora sem os campos de item)
        const query = `
            INSERT INTO zero_based_expense_requests 
            (month, cost_center_id, strategic_contribution, status, requester_id, created_at, updated_at) 
            VALUES 
            (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(query, [
            form.month,
            form.cost_center_id,
            form.strategic_contribution,
            'Pendente', // Status inicial
            form.requester_id,
            formattedDate,
            formattedDate
        ]);
        
        // Obter o ID da solicitação criada
        const expenseRequestId = result.insertId;
        
        // Inserir os itens da solicitação
        if (form.items && Array.isArray(form.items) && form.items.length > 0) {
            // Preparar a query para inserção em massa de itens
            const itemsValues = [];
            const itemsParams = [];
            
            for (const item of form.items) {
                itemsValues.push('(?, ?, ?, ?, ?, ?, ?)');
                itemsParams.push(
                    expenseRequestId,
                    item.category,
                    item.description,
                    item.quantity,
                    item.amount,
                    formattedDate,
                    formattedDate
                );
            }
            
            const itemsQuery = `
                INSERT INTO zero_based_expense_items 
                (expense_request_id, category, description, quantity, amount, created_at, updated_at) 
                VALUES ${itemsValues.join(', ')}
            `;
            
            await executeQuery(itemsQuery, itemsParams);
        }
        
        // Criar registros de aprovação padrão (os 3 aprovadores fixos)
        const approvers = [
            { id: 1, name: 'Eduardo Cunha' },
            { id: 174, name: 'Eduardo Cunha' }, // ID fictício, usar ID real no ambiente de produção
            // { id: 42, name: 'Natally Sagas' }, // ID fictício, usar ID real no ambiente de produção
            // { id: 37, name: 'Edson Tavares' }  // ID fictício, usar ID real no ambiente de produção
        ];
        
        // Buscar informações do solicitante e centro de custo para o email
        const [requesterInfo] = await executeQuery(`
            SELECT c.name, c.family_name, u.email
            FROM collaborators c
            JOIN users u ON u.collaborator_id = c.id
            WHERE c.id = ?
        `, [form.requester_id]);

        const [costCenterInfo] = await executeQuery(`
            SELECT cc.name as costCenterName
            FROM zero_based_cost_centers cc
            WHERE cc.id = ?
        `, [form.cost_center_id]);

        // Calcular o valor total de todos os itens para o email
        let totalValue = 0;
        const itemsInfo = [];
        
        if (form.items && Array.isArray(form.items)) {
            for (const item of form.items) {
                const itemTotal = parseFloat(item.quantity) * parseFloat(item.amount);
                totalValue += itemTotal;
                
                // Obter o nome da categoria para cada item
                const [categoryInfo] = await executeQuery(`
                    SELECT name as categoryName
                    FROM zero_based_categories
                    WHERE id = ?
                `, [item.category]);
                
                itemsInfo.push({
                    category: categoryInfo ? categoryInfo.categoryName : 'Categoria não encontrada',
                    description: item.description,
                    quantity: item.quantity,
                    unitAmount: new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                    }).format(item.amount),
                    subtotal: new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                    }).format(itemTotal)
                });
            }
        }
        
        // Formatar o valor total para exibição
        const totalAmountFormatted = new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(totalValue);

        // Preparar dados para o email
        const emailData = {
            id: expenseRequestId,
            costCenterName: costCenterInfo.costCenterName,
            total_amount: totalAmountFormatted,
            items: itemsInfo,
            requesterName: `${requesterInfo.name} ${requesterInfo.family_name}`
        };

        // Enviar email para cada aprovador
        for (const approver of approvers) {
            const [approverInfo] = await executeQuery(`
                SELECT u.email
                FROM users u
                WHERE u.collaborator_id = ?
            `, [approver.id]);

            if (approverInfo && approverInfo.email) {
                const emailContent = await emailCustom.expenseRequestNotification(emailData);
                sendEmail(
                    approverInfo.email,
                    'Nova Solicitação de Gasto - Aprovação Pendente',
                    emailContent
                );
            }

            await executeQuery(`
                INSERT INTO zero_based_expense_approvals 
                (expense_request_id, approver_id, status, created_at, updated_at) 
                VALUES 
                (?, ?, ?, ?, ?)
            `, [
                expenseRequestId,
                approver.id,
                'Pendente',
                formattedDate,
                formattedDate
            ]);
        }
        
        return { ...result, id: expenseRequestId };
    },
    
    // Atualizar uma solicitação de gasto
    updateExpenseRequest: async function(form) {
        // Verificar se a solicitação já foi aprovada
        const checkStatus = await executeQuery(`
            SELECT status FROM zero_based_expense_requests WHERE id = ?
        `, [form.id]);
        
        if (checkStatus[0].status !== 'Pendente') {
            throw new Error('Não é possível editar uma solicitação que já foi aprovada ou rejeitada.');
        }
        
        const updated_at = new Date();
        const formattedDate = this.formatDateForDatabase(updated_at);
        
        // Atualizar a solicitação principal
        const query = `
            UPDATE zero_based_expense_requests 
            SET 
                month = ?, 
                cost_center_id = ?, 
                strategic_contribution = ?, 
                updated_at = ? 
            WHERE id = ?
        `;
        
        await executeQuery(query, [
            form.month,
            form.cost_center_id,
            form.strategic_contribution,
            formattedDate,
            form.id
        ]);
        
        // Gerenciar os itens da solicitação
        if (form.items && Array.isArray(form.items)) {
            // Primeiro, vamos buscar os itens existentes
            const existingItems = await executeQuery(`
                SELECT id FROM zero_based_expense_items WHERE expense_request_id = ?
            `, [form.id]);
            
            // Mapeamos os IDs existentes para facilitar a comparação
            const existingItemIds = existingItems.map(item => item.id);
            const updatedItemIds = form.items.filter(item => item.id).map(item => parseInt(item.id));
            
            // Identificar itens para remover (existentes que não estão no update)
            const itemsToRemove = existingItemIds.filter(id => !updatedItemIds.includes(id));
            
            // Remover os itens que não existem mais no formulário
            if (itemsToRemove.length > 0) {
                await executeQuery(`
                    DELETE FROM zero_based_expense_items WHERE id IN (?)
                `, [itemsToRemove]);
            }
            
            // Atualizar ou inserir itens
            for (const item of form.items) {
                if (item.id && existingItemIds.includes(parseInt(item.id))) {
                    // Atualizar item existente
                    await executeQuery(`
                        UPDATE zero_based_expense_items 
                        SET 
                            category = ?,
                            description = ?,
                            quantity = ?,
                            amount = ?,
                            updated_at = ?
                        WHERE id = ?
                    `, [
                        item.category,
                        item.description,
                        item.quantity,
                        item.amount,
                        formattedDate,
                        item.id
                    ]);
                } else {
                    // Inserir novo item
                    await executeQuery(`
                        INSERT INTO zero_based_expense_items 
                        (expense_request_id, category, description, quantity, amount, created_at, updated_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        form.id,
                        item.category,
                        item.description,
                        item.quantity,
                        item.amount,
                        formattedDate,
                        formattedDate
                    ]);
                }
            }
        }
        
        return { success: true, message: 'Solicitação atualizada com sucesso', id: form.id };
    },
    
    // Deletar uma solicitação de gasto
    deleteExpenseRequest: async function(id) {
        // Verificar se a solicitação já foi aprovada
        const checkStatus = await executeQuery(`
            SELECT status FROM zero_based_expense_requests WHERE id = ?
        `, [id]);
        
        if (checkStatus[0].status !== 'Pendente') {
            throw new Error('Não é possível excluir uma solicitação que já foi aprovada ou rejeitada.');
        }
        
        // Excluir os registros de aprovação primeiro
        await executeQuery(`
            DELETE FROM zero_based_expense_approvals 
            WHERE expense_request_id = ?
        `, [id]);
        
        // Excluir a solicitação principal
        const result = await executeQuery(`
            DELETE FROM zero_based_expense_requests 
            WHERE id = ?
        `, [id]);
        
        return result;
    },
    
    // Processar aprovação/rejeição de uma solicitação
    processExpenseRequest: async function(form) {
        try {
            // Verificar parâmetros obrigatórios
            if (!form.expense_request_id) {
                throw new Error('ID da solicitação não informado');
            }
            
            if (!form.approver_id) {
                throw new Error('ID do aprovador não informado');
            }
            
            if (!form.status) {
                throw new Error('Status não informado');
            }
            
            console.log('Processando solicitação:', form);
            
            const updated_at = new Date();
            const formattedDate = this.formatDateForDatabase(updated_at);
            
            // Verificar se é uma alteração de status anterior
            if (form.is_change) {
                console.log('Alterando decisão anterior:', form);
                
                // Registrar a alteração no comentário
                let statusComment = form.comment || '';
                statusComment = `[ALTERAÇÃO DE DECISÃO] ${statusComment}`;
                
                // Atualizar o registro de aprovação específico
                await executeQuery(`
                    UPDATE zero_based_expense_approvals 
                    SET 
                        status = ?, 
                        comment = ?, 
                        updated_at = ? 
                    WHERE 
                        expense_request_id = ? AND approver_id = ?
                `, [
                    form.status, // 'Aprovado' ou 'Rejeitado'
                    statusComment,
                    formattedDate,
                    form.expense_request_id,
                    form.approver_id
                ]);
            } else {
                // Fluxo normal para nova aprovação/rejeição
                await executeQuery(`
                    UPDATE zero_based_expense_approvals 
                    SET 
                        status = ?, 
                        comment = ?, 
                        updated_at = ? 
                    WHERE 
                        expense_request_id = ? AND approver_id = ?
                `, [
                    form.status, // 'Aprovado' ou 'Rejeitado'
                    form.comment || '',
                    formattedDate,
                    form.expense_request_id,
                    form.approver_id
                ]);
            }
            
            // Verificar o status de todas as aprovações
            const approvals = await executeQuery(`
                SELECT status FROM zero_based_expense_approvals 
                WHERE expense_request_id = ?
            `, [form.expense_request_id]);
            
            // Definir o status geral da solicitação
            let overallStatus = 'Pendente';
            
            // Se todas foram aprovadas -> Aprovado
            if (approvals.every(approval => approval.status === 'Aprovado')) {
                overallStatus = 'Aprovado';
            } 
            // Se alguma foi rejeitada -> Rejeitado
            else if (approvals.some(approval => approval.status === 'Rejeitado')) {
                overallStatus = 'Rejeitado';
            }
            // Se algumas aprovadas e outras pendentes -> Aprovação Parcial
            else if (approvals.some(approval => approval.status === 'Aprovado')) {
                overallStatus = 'Aprovação Parcial';
            }
            
            // Atualizar o status geral da solicitação
            await executeQuery(`
                UPDATE zero_based_expense_requests 
                SET 
                    status = ?, 
                    updated_at = ? 
                WHERE id = ?
            `, [
                overallStatus,
                formattedDate,
                form.expense_request_id
            ]);

            // Buscar informações para o email
            const [requestInfo] = await executeQuery(`
                SELECT 
                    er.*,
                    cc.name as costCenterName,
                    c.name as requesterName,
                    c.family_name as requesterFamilyName,
                    u.email as requesterEmail,
                    approver.name as approverName,
                    approver.family_name as approverFamilyName
                FROM 
                    zero_based_expense_requests er
                JOIN 
                    zero_based_cost_centers cc ON cc.id = er.cost_center_id
                JOIN
                    collaborators c ON c.id = er.requester_id
                JOIN
                    users u ON u.collaborator_id = c.id
                JOIN
                    collaborators approver ON approver.id = ?
                WHERE 
                    er.id = ?
            `, [form.approver_id, form.expense_request_id]);

            // Enviar email para o solicitante
            if (requestInfo && requestInfo.requesterEmail) {
                // Buscar os itens da solicitação
                const items = await executeQuery(`
                    SELECT 
                        i.*,
                        zc.name as categoryName
                    FROM 
                        zero_based_expense_items i
                    LEFT JOIN
                        zero_based_categories zc ON zc.id = i.category
                    WHERE 
                        i.expense_request_id = ?
                    ORDER BY
                        i.id ASC
                `, [form.expense_request_id]);
                
                // Formatar os itens e calcular o total
                let totalValue = 0;
                const itemsInfo = [];
                
                for (const expenseItem of items) {
                    const itemTotal = parseFloat(expenseItem.quantity) * parseFloat(expenseItem.amount);
                    totalValue += itemTotal;
                    
                    itemsInfo.push({
                        category: expenseItem.categoryName || `Categoria ID: ${expenseItem.category}`,
                        description: expenseItem.description,
                        quantity: expenseItem.quantity,
                        unitAmount: new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                        }).format(expenseItem.amount),
                        subtotal: new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                        }).format(itemTotal)
                    });
                }
                
                // Formatar o valor total para exibição
                const totalAmount = new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }).format(totalValue);
                
                const emailData = {
                    id: requestInfo.id,
                    costCenterName: requestInfo.costCenterName,
                    total_amount: totalAmount,
                    items: itemsInfo,
                    status: form.status,
                    approverName: `${requestInfo.approverName} ${requestInfo.approverFamilyName}`,
                    comment: form.comment
                };

                const emailContent = await emailCustom.expenseRequestStatusUpdate(emailData);
                sendEmail(
                    requestInfo.requesterEmail,
                    `Atualização de Status - Solicitação de Gasto ${form.status}`,
                    emailContent
                );
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('Erro ao processar solicitação:', error);
            throw error;
        }
    },
    
    // ==================== Relatórios ====================
    
    // Relatório de gastos por centro de custo
    reportByCostCenter: async function(params = {}) {
        // Construir a cláusula WHERE com base nos parâmetros
        let whereClause = '';
        const whereParams = [];
        
        if (params.costCenterId) {
            whereClause += ' WHERE cc.id = ?';
            whereParams.push(params.costCenterId);
        }
        
        if (params.year) {
            whereClause += whereClause ? ' AND ' : ' WHERE ';
            whereClause += 'YEAR(er.created_at) = ?';
            whereParams.push(params.year);
        }
        
        // Query principal para obter dados por centro de custo
        const query = `
            SELECT 
                cc.name, 
                cc.id,
                COUNT(DISTINCT er.id) as num_requests,
                COUNT(DISTINCT CASE WHEN er.status = 'Aprovado' THEN er.id END) as approved,
                COUNT(DISTINCT CASE WHEN er.status = 'Rejeitado' THEN er.id END) as rejected,
                COUNT(DISTINCT CASE WHEN er.status = 'Pendente' THEN er.id END) as pending,
                COUNT(DISTINCT CASE WHEN er.status = 'Aprovação Parcial' THEN er.id END) as partial
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            ${whereClause}
            GROUP BY
                cc.id, cc.name
        `;
        
        const result = await executeQuery(query, whereParams);
        
        // Buscar os totais por centro de custo (considerando os itens)
        const totalsQuery = `
            SELECT 
                cc.id,
                SUM(ei.quantity * ei.amount) as total
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            JOIN
                zero_based_expense_items ei ON ei.expense_request_id = er.id
            ${whereClause}
            GROUP BY
                cc.id
        `;
        
        const totalsResult = await executeQuery(totalsQuery, whereParams);
        
        // Mapear totais por centro de custo
        const totalsByCostCenter = {};
        totalsResult.forEach(item => {
            totalsByCostCenter[item.id] = parseFloat(item.total) || 0;
        });
        
        // Preparar os dados para o gráfico de pizza de centros de custo
        const labels = result.map(item => item.name.toUpperCase());
        const values = result.map(item => totalsByCostCenter[item.id] || 0);
        
        // Preparar os dados para o gráfico de barras de status
        const statusData = {
            labels: ['Pendente', 'Aprovado', 'Rejeitado', 'Aprovação Parcial'],
            values: [0, 0, 0, 0]
        };
        
        let totalPending = 0;
        let totalApproved = 0;
        let totalRejected = 0;
        let totalPartial = 0;
        
        result.forEach(item => {
            totalPending += item.pending || 0;
            totalApproved += item.approved || 0;
            totalRejected += item.rejected || 0;
            totalPartial += item.partial || 0;
        });
        
        statusData.values = [totalPending, totalApproved, totalRejected, totalPartial];
        
        // Obter as solicitações detalhadas
        let expensesWhereClause = whereClause;
        if (!expensesWhereClause) {
            expensesWhereClause = ' WHERE 1=1';
        }
        
        const expensesQuery = `
            SELECT 
                er.id,
                er.month,
                cc.name as costCenterName,
                er.status,
                er.created_at,
                c.name as requesterName,
                GROUP_CONCAT(DISTINCT zc.name) as categories,
                SUM(ei.quantity * ei.amount) as total_amount,
                SUM(ei.quantity) as total_quantity,
                COUNT(ei.id) as item_count
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            JOIN 
                collaborators c ON c.id = er.requester_id
            JOIN
                zero_based_expense_items ei ON ei.expense_request_id = er.id
            LEFT JOIN
                zero_based_categories zc ON zc.id = ei.category
            ${expensesWhereClause}
            GROUP BY
                er.id, er.month, cc.name, er.status, er.created_at, c.name
            ORDER BY
                er.created_at DESC
            LIMIT 100
        `;
        
        const expenses = await executeQuery(expensesQuery, whereParams);
        
        const formattedExpenses = expenses.map(item => ({
            id: item.id,
            costCenterName: item.costCenterName.toUpperCase(),
            month: item.month,
            categories: item.categories ? item.categories.split(',') : [],
            item_count: parseInt(item.item_count),
            total_quantity: parseInt(item.total_quantity) || 0,
            total_amount: parseFloat(item.total_amount) || 0,
            status: item.status,
            requesterName: item.requesterName,
            created_at: this.formatDateToPtBr(item.created_at)
        }));
        
        // Calcular totais para os cards de resumo
        const summary = {
            totalRequests: formattedExpenses.length,
            totalApproved: formattedExpenses
                .filter(e => e.status === 'Aprovado')
                .reduce((sum, e) => sum + e.total_amount, 0),
            totalRejected: formattedExpenses
                .filter(e => e.status === 'Rejeitado')
                .reduce((sum, e) => sum + e.total_amount, 0)
        };
        
        return {
            summary,
            costCenterData: {
                labels,
                values
            },
            statusData,
            expenses: formattedExpenses.map(e => ({
                ...e,
                total_amount: new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }).format(e.total_amount)
            }))
        };
    },
    
    // Relatório de gastos por status
    reportByStatus: async function(params = {}) {
        // Construir a cláusula WHERE com base nos parâmetros
        let whereClause = '';
        const whereParams = [];
        
        if (params.costCenterId) {
            whereClause += ' WHERE cc.id = ?';
            whereParams.push(params.costCenterId);
        }
        
        if (params.year) {
            whereClause += whereClause ? ' AND ' : ' WHERE ';
            whereClause += 'YEAR(er.created_at) = ?';
            whereParams.push(params.year);
        }
        
        // Query principal para obter dados por status
        const query = `
            SELECT 
                er.status,
                COUNT(DISTINCT er.id) as num_requests,
                SUM(ei.quantity * ei.amount) as total_amount
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            JOIN
                zero_based_expense_items ei ON ei.expense_request_id = er.id
            ${whereClause}
            GROUP BY
                er.status
        `;
        
        const result = await executeQuery(query, whereParams);
        
        // Preparar os dados para o gráfico de pizza de status
        const statusData = {
            labels: result.map(item => item.status),
            values: result.map(item => parseFloat(item.total_amount) || 0)
        };
        
        // Obter as solicitações detalhadas
        let expensesWhereClause = whereClause;
        if (!expensesWhereClause) {
            expensesWhereClause = ' WHERE 1=1';
        }
        
        const expensesQuery = `
            SELECT 
                er.id,
                er.month,
                cc.name as costCenterName,
                er.status,
                er.created_at,
                c.name as requesterName,
                GROUP_CONCAT(DISTINCT zc.name) as categories,
                SUM(ei.quantity * ei.amount) as total_amount,
                SUM(ei.quantity) as total_quantity,
                COUNT(ei.id) as item_count
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            JOIN 
                collaborators c ON c.id = er.requester_id
            JOIN
                zero_based_expense_items ei ON ei.expense_request_id = er.id
            LEFT JOIN
                zero_based_categories zc ON zc.id = ei.category
            ${expensesWhereClause}
            GROUP BY
                er.id, er.month, cc.name, er.status, er.created_at, c.name
            ORDER BY
                er.created_at DESC
            LIMIT 100
        `;
        
        const expenses = await executeQuery(expensesQuery, whereParams);
        
        const formattedExpenses = expenses.map(item => ({
            id: item.id,
            costCenterName: item.costCenterName.toUpperCase(),
            month: item.month,
            categories: item.categories ? item.categories.split(',') : [],
            item_count: parseInt(item.item_count),
            total_quantity: parseInt(item.total_quantity) || 0,
            total_amount: parseFloat(item.total_amount) || 0,
            status: item.status,
            requesterName: item.requesterName,
            created_at: this.formatDateToPtBr(item.created_at)
        }));
        
        // Calcular totais para os cards de resumo
        const summary = {
            totalRequests: formattedExpenses.length,
            totalApproved: formattedExpenses
                .filter(e => e.status === 'Aprovado')
                .reduce((sum, e) => sum + e.total_amount, 0),
            totalRejected: formattedExpenses
                .filter(e => e.status === 'Rejeitado')
                .reduce((sum, e) => sum + e.total_amount, 0)
        };
        
        return {
            summary,
            statusData,
            expenses: formattedExpenses.map(e => ({
                ...e,
                total_amount: new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }).format(e.total_amount)
            }))
        };
    },
    
    // Relatório de gastos por mês
    reportByMonth: async function(params = {}) {
        // Construir a cláusula WHERE com base nos parâmetros
        let whereClause = '';
        const whereParams = [];
        
        if (params.costCenterId) {
            whereClause += ' WHERE cc.id = ?';
            whereParams.push(params.costCenterId);
        }
        
        if (params.year) {
            whereClause += whereClause ? ' AND ' : ' WHERE ';
            whereClause += 'YEAR(er.created_at) = ?';
            whereParams.push(params.year);
        }
        
        // Query principal para obter dados por mês
        const query = `
            SELECT 
                er.month,
                COUNT(DISTINCT er.id) as num_requests,
                COUNT(DISTINCT CASE WHEN er.status = 'Aprovado' THEN er.id END) as approved,
                COUNT(DISTINCT CASE WHEN er.status = 'Rejeitado' THEN er.id END) as rejected,
                COUNT(DISTINCT CASE WHEN er.status = 'Pendente' THEN er.id END) as pending,
                COUNT(DISTINCT CASE WHEN er.status = 'Aprovação Parcial' THEN er.id END) as partial,
                SUM(ei.quantity * ei.amount) as total_amount
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            JOIN
                zero_based_expense_items ei ON ei.expense_request_id = er.id
            ${whereClause}
            GROUP BY
                er.month
            ORDER BY
                FIELD(er.month, 
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 
                    'Maio', 'Junho', 'Julho', 'Agosto', 
                    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                )
        `;
        
        const result = await executeQuery(query, whereParams);
        
        // Preparar os dados para o gráfico de linha de gastos por mês
        const monthlyData = {
            labels: result.map(item => item.month),
            values: result.map(item => parseFloat(item.total_amount) || 0)
        };
        
        // Preparar os dados para o gráfico de barras de status por mês
        const statusData = {
            labels: result.map(item => item.month),
            approved: result.map(item => item.approved),
            rejected: result.map(item => item.rejected),
            pending: result.map(item => item.pending),
            partial: result.map(item => item.partial)
        };
        
        // Obter as solicitações detalhadas
        let expensesWhereClause = whereClause;
        if (!expensesWhereClause) {
            expensesWhereClause = ' WHERE 1=1';
        }
        
        const expensesQuery = `
            SELECT 
                er.id,
                er.month,
                cc.name as costCenterName,
                er.status,
                er.created_at,
                c.name as requesterName,
                GROUP_CONCAT(DISTINCT zc.name) as categories,
                SUM(ei.quantity * ei.amount) as total_amount,
                SUM(ei.quantity) as total_quantity,
                COUNT(ei.id) as item_count
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            JOIN 
                collaborators c ON c.id = er.requester_id
            JOIN
                zero_based_expense_items ei ON ei.expense_request_id = er.id
            LEFT JOIN
                zero_based_categories zc ON zc.id = ei.category
            ${expensesWhereClause}
            GROUP BY
                er.id, er.month, cc.name, er.status, er.created_at, c.name
            ORDER BY
                er.created_at DESC
            LIMIT 100
        `;
        
        const expenses = await executeQuery(expensesQuery, whereParams);
        
        const formattedExpenses = expenses.map(item => ({
            id: item.id,
            costCenterName: item.costCenterName.toUpperCase(),
            month: item.month,
            categories: item.categories ? item.categories.split(',') : [],
            item_count: parseInt(item.item_count),
            total_quantity: parseInt(item.total_quantity) || 0,
            total_amount: parseFloat(item.total_amount) || 0,
            status: item.status,
            requesterName: item.requesterName,
            created_at: this.formatDateToPtBr(item.created_at)
        }));
        
        // Calcular totais para os cards de resumo
        const summary = {
            totalRequests: formattedExpenses.length,
            totalApproved: formattedExpenses
                .filter(e => e.status === 'Aprovado')
                .reduce((sum, e) => sum + e.total_amount, 0),
            totalRejected: formattedExpenses
                .filter(e => e.status === 'Rejeitado')
                .reduce((sum, e) => sum + e.total_amount, 0)
        };
        
        return {
            summary,
            monthlyData,
            statusData,
            expenses: formattedExpenses.map(e => ({
                ...e,
                total_amount: new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }).format(e.total_amount)
            }))
        };
    },
    
    // Obter solicitações de gastos por centro de custo
    getExpenseRequestsByCostCenter: async function(costCenterId) {
        const result = await executeQuery(`
            SELECT 
                er.*,
                c.name as requesterName,
                c.family_name as requesterFamilyName
            FROM 
                zero_based_expense_requests er
            JOIN
                collaborators c ON c.id = er.requester_id
            WHERE 
                er.cost_center_id = ${costCenterId}
            ORDER BY
                er.created_at DESC
        `);

        // Se não houver solicitações, retornar array vazio
        if (result.length === 0) {
            return [];
        }
        
        // Obter IDs de todas as solicitações para buscar seus itens
        const requestIds = result.map(request => request.id);
        
        // Buscar todos os itens de todas as solicitações
        const itemsResult = await executeQuery(`
            SELECT 
                i.*,
                zc.name as categoryName
            FROM 
                zero_based_expense_items i
            LEFT JOIN
                zero_based_categories zc ON zc.id = i.category
            WHERE 
                i.expense_request_id IN (?)
            ORDER BY
                i.expense_request_id, i.id
        `, [requestIds]);
        
        // Agrupar os itens por solicitação
        const itemsByRequest = {};
        itemsResult.forEach(item => {
            if (!itemsByRequest[item.expense_request_id]) {
                itemsByRequest[item.expense_request_id] = [];
            }
            itemsByRequest[item.expense_request_id].push(item);
        });

        const formattedRequests = result.map(request => {
            // Obter os itens para esta solicitação
            const items = itemsByRequest[request.id] || [];
            
            // Calcular o total da solicitação
            let totalValue = 0;
            let mainCategory = '';
            let mainDescription = '';
            
            if (items.length > 0) {
                // Calcular o total somando todos os itens
                totalValue = items.reduce((sum, item) => {
                    return sum + (parseFloat(item.quantity) * parseFloat(item.amount));
                }, 0);
                
                // Usar categoria e descrição do primeiro item como referência
                mainCategory = items[0].categoryName || `Categoria ID: ${items[0].category}`;
                mainDescription = items.length === 1 
                    ? items[0].description 
                    : `${items[0].description} e mais ${items.length - 1} ${items.length === 2 ? 'item' : 'itens'}`;
            }
            
            // Formatação do valor total para exibição
            const formattedAmount = new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(totalValue);
            
            return {
                id: request.id,
                month: request.month,
                category: mainCategory,
                description: mainDescription,
                item_count: items.length,
                amount: formattedAmount,
                raw_amount: totalValue,
                status: request.status,
                requesterName: `${request.requesterName} ${request.requesterFamilyName}`,
                created_at: this.formatDateToPtBr(request.created_at)
            };
        });

        return formattedRequests;
    },
    
    // ==================== Aprovações ====================
    
    // Obter solicitações pendentes de aprovação para um usuário específico
    getPendingApprovals: async function(collaborator_id) {
        const result = await executeQuery(`
            SELECT 
                er.*,
                cc.name as costCenterName,
                ea.id as approval_id,
                c.name as requesterName,
                c.family_name as requesterFamilyName
            FROM 
                zero_based_expense_approvals ea
            JOIN 
                zero_based_expense_requests er ON er.id = ea.expense_request_id
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            JOIN
                collaborators c ON c.id = er.requester_id
            WHERE 
                ea.approver_id = ${collaborator_id}
                AND ea.status = 'Pendente'
            ORDER BY
                er.created_at DESC
        `);

        // Se não houver solicitações pendentes, retornar array vazio
        if (result.length === 0) {
            return [];
        }
        
        // Obter IDs de todas as solicitações para buscar seus itens
        const requestIds = result.map(request => request.id);
        
        // Buscar todos os itens de todas as solicitações
        const itemsResult = await executeQuery(`
            SELECT 
                i.*,
                zc.name as categoryName
            FROM 
                zero_based_expense_items i
            LEFT JOIN
                zero_based_categories zc ON zc.id = i.category
            WHERE 
                i.expense_request_id IN (?)
            ORDER BY
                i.expense_request_id, i.id
        `, [requestIds]);
        
        // Agrupar os itens por solicitação
        const itemsByRequest = {};
        itemsResult.forEach(item => {
            if (!itemsByRequest[item.expense_request_id]) {
                itemsByRequest[item.expense_request_id] = [];
            }
            itemsByRequest[item.expense_request_id].push(item);
        });

        const formattedRequests = result.map(request => {
            // Obter os itens para esta solicitação
            const items = itemsByRequest[request.id] || [];
            
            // Calcular o total da solicitação
            let totalValue = 0;
            let mainCategory = '';
            let mainDescription = '';
            
            if (items.length > 0) {
                // Calcular o total somando todos os itens
                totalValue = items.reduce((sum, item) => {
                    return sum + (parseFloat(item.quantity) * parseFloat(item.amount));
                }, 0);
                
                // Usar categoria e descrição do primeiro item como referência
                mainCategory = items[0].categoryName || `Categoria ID: ${items[0].category}`;
                mainDescription = items.length === 1 
                    ? items[0].description 
                    : `${items[0].description} e mais ${items.length - 1} ${items.length === 2 ? 'item' : 'itens'}`;
            }
            
            return {
                id: request.id,
                costCenterName: request.costCenterName.toUpperCase(),
                category: mainCategory,
                description: mainDescription,
                item_count: items.length,
                amount: new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }).format(totalValue),
                raw_amount: totalValue,
                requestDate: this.formatDateToPtBr(request.created_at),
                requesterName: `${request.requesterName} ${request.requesterFamilyName}`,
                items: items.map(item => ({
                    id: item.id,
                    categoryName: item.categoryName || `Categoria ID: ${item.category}`,
                    description: item.description,
                    quantity: parseInt(item.quantity) || 0,
                    amount: parseFloat(item.amount) || 0
                }))
            };
        });

        return formattedRequests;
    },
    
    // Obter contagem de aprovações pendentes para um usuário
    getPendingApprovalsCount: async function(collaborator_id) {
        const result = await executeQuery(`
            SELECT 
                COUNT(*) as count
            FROM 
                zero_based_expense_approvals ea
            WHERE 
                ea.approver_id = ${collaborator_id}
                AND ea.status = 'Pendente'
        `);

        return result[0].count;
    },
    
    // ==================== Categorias ====================
    
    // Obter todas as categorias
    getAllCategories: async function() {
        try {
            const result = await executeQuery(`
                SELECT * FROM zero_based_categories
                ORDER BY name ASC
            `);
            
            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('Erro ao obter categorias:', error);
            return {
                success: false,
                message: 'Erro ao obter categorias: ' + error.message
            };
        }
    },
    
    // Obter categorias ativas
    getActiveCategories: async function() {
        try {
            const result = await executeQuery(`
                SELECT * FROM zero_based_categories
                WHERE active = 1
                ORDER BY name ASC
            `);
            
            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('Erro ao obter categorias ativas:', error);
            return {
                success: false,
                message: 'Erro ao obter categorias ativas: ' + error.message
            };
        }
    },
    
    // Obter categoria por ID
    getCategoryById: async function(id) {
        try {
            const result = await executeQuery(`
                SELECT * FROM zero_based_categories
                WHERE id = ?
            `, [id]);
            
            if (result.length === 0) {
                return {
                    success: false,
                    message: 'Categoria não encontrada'
                };
            }
            
            return {
                success: true,
                data: result[0]
            };
        } catch (error) {
            console.error('Erro ao obter categoria por ID:', error);
            return {
                success: false,
                message: 'Erro ao obter categoria: ' + error.message
            };
        }
    },
    
    // Criar categoria
    createCategory: async function(categoryData) {
        try {
            const { name, description, active } = categoryData;
            
            const result = await executeQuery(`
                INSERT INTO zero_based_categories
                (name, description, active)
                VALUES (?, ?, ?)
            `, [name, description || null, active === undefined ? 1 : active]);
            
            return {
                success: true,
                message: 'Categoria criada com sucesso',
                data: {
                    id: result.insertId,
                    name,
                    description,
                    active: active === undefined ? 1 : active
                }
            };
        } catch (error) {
            console.error('Erro ao criar categoria:', error);
            return {
                success: false,
                message: 'Erro ao criar categoria: ' + error.message
            };
        }
    },
    
    // Atualizar categoria
    updateCategory: async function(id, categoryData) {
        try {
            const { name, description, active } = categoryData;
            
            await executeQuery(`
                UPDATE zero_based_categories
                SET name = ?, description = ?, active = ?
                WHERE id = ?
            `, [name, description || null, active === undefined ? 1 : active, id]);
            
            return {
                success: true,
                message: 'Categoria atualizada com sucesso',
                data: {
                    id,
                    name,
                    description,
                    active: active === undefined ? 1 : active
                }
            };
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            return {
                success: false,
                message: 'Erro ao atualizar categoria: ' + error.message
            };
        }
    },
    
    // Excluir categoria
    deleteCategory: async function(id) {
        try {
            // Verificar se a categoria está sendo usada em solicitações
            const usageCheck = await executeQuery(`
                SELECT COUNT(*) as count
                FROM zero_based_expense_requests
                WHERE category_id = ?
            `, [id]);
            
            if (usageCheck[0].count > 0) {
                // Se estiver em uso, apenas marcar como inativa
                await executeQuery(`
                    UPDATE zero_based_categories
                    SET active = 0
                    WHERE id = ?
                `, [id]);
                
                return {
                    success: true,
                    message: 'Categoria marcada como inativa pois está sendo utilizada em solicitações',
                    inactivated: true
                };
            }
            
            // Se não estiver em uso, excluir permanentemente
            await executeQuery(`
                DELETE FROM zero_based_categories
                WHERE id = ?
            `, [id]);
            
            return {
                success: true,
                message: 'Categoria excluída com sucesso'
            };
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            return {
                success: false,
                message: 'Erro ao excluir categoria: ' + error.message
            };
        }
    },
    
    // ==================== Helpers ====================
    
    // Função para formatar data para o banco de dados
    formatDateForDatabase: function(date) {
        const padToTwoDigits = (num) => num.toString().padStart(2, '0');
        
        const day = padToTwoDigits(date.getDate());
        const month = padToTwoDigits(date.getMonth() + 1);
        const year = date.getFullYear();
        const hours = padToTwoDigits(date.getHours());
        const minutes = padToTwoDigits(date.getMinutes());
        const seconds = padToTwoDigits(date.getSeconds());
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    
    // Função para formatar data para exibição
    formatDateToPtBr: function(dateString) {
        const date = new Date(dateString);
    
        const padToTwoDigits = (num) => num.toString().padStart(2, '0');
        
        const day = padToTwoDigits(date.getDate());
        const month = padToTwoDigits(date.getMonth() + 1);
        const year = date.getFullYear();
        const hours = padToTwoDigits(date.getHours());
        const minutes = padToTwoDigits(date.getMinutes());
        const seconds = padToTwoDigits(date.getSeconds());
        
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
};

module.exports = { 
    zeroBasedCostCenter, 
    ZeroBasedBudgeting: zeroBasedCostCenter // Exportar com os dois nomes para compatibilidade
}; 