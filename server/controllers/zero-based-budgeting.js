const { executeQuery } = require('../connect/mysql');

const zeroBasedCostCenter = {
    // ==================== Centros de Custo ====================
    
    // Obter todos os centros de custo relacionados ao usuário (responsável ou visualizador)
    getAllCostCenters: async function(collaborator_id) {
        const result = await executeQuery(`
            SELECT 
                cc.*, 
                c.name as responsibleName, 
                c.id_headcargo,
                c.family_name as responsibleFamilyName
            FROM 
                zero_based_cost_centers cc
            JOIN 
                collaborators c ON c.id = cc.responsible_id
            WHERE 
                c.id = ${collaborator_id}
                OR cc.id IN (
                    SELECT cost_center_id FROM zero_based_expense_requests 
                    WHERE requester_id = ${collaborator_id}
                )
            GROUP BY
                cc.id
        `);

        const formattedCostCenters = result.map(item => {
            const users = `${item.responsibleName} ${item.responsibleFamilyName}`;
            
            return {
                id: item.id,
                name: item.name.toUpperCase(),
                description: item.description,
                responsibleName: `<div class="d-flex align-items-center">
                    <div class="me-2 lh-1">
                        <span class="avatar avatar-sm">
                            <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt="">
                        </span>
                    </div>
                    <div class="fs-14">${users}</div>
                </div>`
            };
        });

  

        return formattedCostCenters;
    },
    
    // Obter apenas os centros de custo onde o usuário é responsável
    getCostCentersByUser: async function(collaborator_id) {
        const result = await executeQuery(`
            SELECT 
                cc.id, cc.name
            FROM 
                zero_based_cost_centers cc
            WHERE 
                cc.responsible_id = ${collaborator_id}
        `);

        return result;
    },
    
    // Obter detalhes de um centro de custo específico
    getCostCenterView: async function(id) {
        const result = await executeQuery(`
            SELECT 
                cc.*, 
                c.name as responsibleName, 
                c.id_headcargo,
                c.family_name as responsibleFamilyName
            FROM 
                zero_based_cost_centers cc
            JOIN 
                collaborators c ON c.id = cc.responsible_id
            WHERE 
                cc.id = ${id}
        `);

        if (result.length === 0) {
            return null;
        }

        const item = result[0];
        const users = `${item.responsibleName} ${item.responsibleFamilyName}`;
        
        return {
            id: item.id,
            name: item.name.toUpperCase(),
            description: item.description,
            responsible_id: item.responsible_id,
            responsibleName: users,
            responsibleAvatar: `https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}`,
            created_at: this.formatDateToPtBr(item.created_at),
            updated_at: this.formatDateToPtBr(item.updated_at)
        };
    },
    
    // Criar um novo centro de custo
    createCostCenter: async function(form) {
        const created_at = new Date();
        const formattedDate = this.formatDateForDatabase(created_at);
        
        const name = form.name.toUpperCase();
        
        const query = `
            INSERT INTO zero_based_cost_centers 
            (name, responsible_id, description, created_at, updated_at) 
            VALUES 
            (?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(query, [
            name,
            form.responsible,
            form.description,
            formattedDate,
            formattedDate
        ]);
        
        return result;
    },
    
    // Atualizar um centro de custo existente
    updateCostCenter: async function(form) {
        const updated_at = new Date();
        const formattedDate = this.formatDateForDatabase(updated_at);
        
        const name = form.name.toUpperCase();
        
        const query = `
            UPDATE zero_based_cost_centers 
            SET 
                name = ?, 
                responsible_id = ?, 
                description = ?, 
                updated_at = ? 
            WHERE id = ?
        `;
        
        const result = await executeQuery(query, [
            name,
            form.responsible,
            form.description,
            formattedDate,
            form.id
        ]);
        
        return result;
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
    
    // Obter todas as solicitações de gastos relacionadas ao usuário
    getAllExpenseRequests: async function(collaborator_id) {
        const result = await executeQuery(`
            SELECT 
                er.*,
                cc.name as costCenterName
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            LEFT JOIN 
                zero_based_expense_approvals ea ON ea.expense_request_id = er.id
            WHERE 
                er.requester_id = ${collaborator_id}
                OR cc.responsible_id = ${collaborator_id}
                OR ea.approver_id = ${collaborator_id}
            GROUP BY
                er.id
            ORDER BY
                er.created_at DESC
        `);

        const formattedRequests = result.map(item => {
            // Formatação do valor para exibição
            const amount = new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(item.amount);
            
            // Formatação do status com badge
            let statusBadge;
            switch(item.status) {
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
                id: item.id,
                month: item.month,
                costCenterName: item.costCenterName.toUpperCase(),
                category: item.category,
                description: item.description,
                quantity: item.quantity,
                amount: amount,
                status: statusBadge,
                created_at: this.formatDateToPtBr(item.created_at)
            };
        });

        return formattedRequests;
    },
    
    // Obter detalhes de uma solicitação de gasto específica
    getExpenseRequestView: async function(id) {
        const result = await executeQuery(`
            SELECT 
                er.*,
                cc.name as costCenterName,
                c.name as requesterName,
                c.family_name as requesterFamilyName,
                c.id_headcargo as requesterAvatar,
                zc.name as categoryName
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            JOIN
                collaborators c ON c.id = er.requester_id
            LEFT JOIN
                zero_based_categories zc ON zc.id = er.category
            WHERE 
                er.id = ${id}
        `);

        if (result.length === 0) {
            return null;
        }

        const item = result[0];
        
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
                ea.expense_request_id = ${id}
            ORDER BY
                ea.created_at ASC
        `);
        
        // Formatação do valor para exibição
        const amount = new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(item.amount);
        
        const formattedRequest = {
            id: item.id,
            month: item.month,
            cost_center_id: item.cost_center_id,
            costCenterName: item.costCenterName.toUpperCase(),
            category: item.categoryName || `Categoria ID: ${item.category}`,
            category_id: item.category,
            description: item.description,
            quantity: item.quantity,
            amount: amount,
            raw_amount: item.amount,
            strategic_contribution: item.strategic_contribution,
            status: item.status,
            requester_id: item.requester_id,
            requesterName: `${item.requesterName} ${item.requesterFamilyName}`,
            requesterAvatar: `https://cdn.conlinebr.com.br/colaboradores/${item.requesterAvatar}`,
            created_at: this.formatDateToPtBr(item.created_at),
            updated_at: this.formatDateToPtBr(item.updated_at),
            approvals: approvals.map(approval => ({
                id: approval.id,
                approver_id: approval.approver_id,
                approverName: `${approval.approverName} ${approval.approverFamilyName}`,
                approverAvatar: `https://cdn.conlinebr.com.br/colaboradores/${approval.approverAvatar}`,
                status: approval.status,
                comment: approval.comment,
                created_at: this.formatDateToPtBr(approval.created_at)
            }))
        };
        
        return formattedRequest;
    },
    
    // Criar uma nova solicitação de gasto
    createExpenseRequest: async function(form) {
        const created_at = new Date();
        const formattedDate = this.formatDateForDatabase(created_at);
        
        // Verificar se o categoria_id está sendo recebido
        const categoryId = form.category_id || form.category;
        
        // Criar a solicitação principal
        const query = `
            INSERT INTO zero_based_expense_requests 
            (month, cost_center_id, category, description, quantity, amount, 
            strategic_contribution, status, requester_id, created_at, updated_at) 
            VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(query, [
            form.month,
            form.cost_center_id,
            categoryId,
            form.description,
            form.quantity,
            form.amount,
            form.strategic_contribution,
            'Pendente', // Status inicial
            form.requester_id,
            formattedDate,
            formattedDate
        ]);
        
        // Criar registros de aprovação padrão (os 3 aprovadores fixos)
        const expenseRequestId = result.insertId;
        const approvers = [
            { id: 174, name: 'Eduardo Cunha' }, // ID fictício, usar ID real no ambiente de produção
            { id: 42, name: 'Natally Sagas' }, // ID fictício, usar ID real no ambiente de produção
            { id: 37, name: 'Edson Tavares' }  // ID fictício, usar ID real no ambiente de produção
        ];
        
        for (const approver of approvers) {
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
        
        return result;
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
        
        const query = `
            UPDATE zero_based_expense_requests 
            SET 
                month = ?, 
                cost_center_id = ?, 
                category = ?, 
                description = ?, 
                quantity = ?, 
                amount = ?, 
                strategic_contribution = ?, 
                updated_at = ? 
            WHERE id = ?
        `;
        
        const result = await executeQuery(query, [
            form.month,
            form.cost_center_id,
            form.category,
            form.description,
            form.quantity,
            form.amount,
            form.strategic_contribution,
            formattedDate,
            form.id
        ]);
        
        return result;
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
        const updated_at = new Date();
        const formattedDate = this.formatDateForDatabase(updated_at);
        
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
            form.comment,
            formattedDate,
            form.expense_request_id,
            form.approver_id
        ]);
        
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
        const result = await executeQuery(`
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
        
        return result;
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
        
        const query = `
            SELECT 
                cc.name, 
                SUM(er.amount) as total,
                COUNT(er.id) as num_requests,
                COUNT(CASE WHEN er.status = 'Aprovado' THEN 1 END) as approved,
                COUNT(CASE WHEN er.status = 'Rejeitado' THEN 1 END) as rejected,
                COUNT(CASE WHEN er.status = 'Pendente' OR er.status = 'Aprovação Parcial' THEN 1 END) as pending
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            ${whereClause}
            GROUP BY
                cc.id
            ORDER BY
                total DESC
        `;
        
        const result = await executeQuery(query, whereParams);
        
        // Preparar os dados para o gráfico de pizza de centros de custo
        const labels = result.map(item => item.name.toUpperCase());
        const values = result.map(item => parseFloat(item.total));
        
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
            totalPending += item.pending;
            totalApproved += item.approved;
            totalRejected += item.rejected;
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
                er.category,
                er.description,
                er.amount,
                er.status,
                er.created_at
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            ${expensesWhereClause}
            ORDER BY
                er.created_at DESC
            LIMIT 100
        `;
        
        const expenses = await executeQuery(expensesQuery, whereParams);
        
        const formattedExpenses = expenses.map(item => ({
            id: item.id,
            costCenterName: item.costCenterName.toUpperCase(),
            month: item.month,
            category: item.category,
            description: item.description,
            amount: item.amount,
            status: item.status,
            created_at: this.formatDateToPtBr(item.created_at)
        }));
        
        // Calcular totais para os cards de resumo
        const summary = {
            totalRequests: formattedExpenses.length,
            totalApproved: formattedExpenses.filter(e => e.status === 'Aprovado').reduce((sum, e) => sum + parseFloat(e.amount), 0),
            totalRejected: formattedExpenses.filter(e => e.status === 'Rejeitado').reduce((sum, e) => sum + parseFloat(e.amount), 0)
        };
        
        return {
            summary,
            costCenterData: {
                labels,
                values
            },
            statusData,
            expenses: formattedExpenses
        };
    },
    
    // Relatório de gastos por status
    reportByStatus: async function(params = {}) {
        // Construir a cláusula WHERE com base nos parâmetros
        let whereClause = '';
        const whereParams = [];
        
        if (params.statusFilter) {
            whereClause += ' WHERE er.status = ?';
            whereParams.push(params.statusFilter);
        }
        
        if (params.days) {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(params.days));
            const formattedDate = this.formatDateForDatabase(daysAgo);
            
            whereClause += whereClause ? ' AND ' : ' WHERE ';
            whereClause += 'er.created_at >= ?';
            whereParams.push(formattedDate);
        }
        
        // Obter contagem por status
        const statusQuery = `
            SELECT 
                er.status, 
                COUNT(er.id) as count
            FROM 
                zero_based_expense_requests er
            ${whereClause}
            GROUP BY
                er.status
        `;
        
        const statusResult = await executeQuery(statusQuery, whereParams);
        
        // Preparar os dados para o gráfico de distribuição por status
        const statusLabels = [];
        const statusValues = [];
        
        let pendingCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;
        let partialCount = 0;
        
        statusResult.forEach(item => {
            statusLabels.push(item.status);
            statusValues.push(item.count);
            
            switch(item.status) {
                case 'Pendente':
                    pendingCount = item.count;
                    break;
                case 'Aprovado':
                    approvedCount = item.count;
                    break;
                case 'Rejeitado':
                    rejectedCount = item.count;
                    break;
                case 'Aprovação Parcial':
                    partialCount = item.count;
                    break;
            }
        });
        
        // Obter dados para o gráfico de linha (evolução no tempo)
        const timelineQuery = `
            SELECT 
                DATE(er.created_at) as date,
                er.status,
                COUNT(er.id) as count
            FROM 
                zero_based_expense_requests er
            ${whereClause}
            GROUP BY
                DATE(er.created_at), er.status
            ORDER BY
                date ASC
        `;
        
        const timelineResult = await executeQuery(timelineQuery, whereParams);
        
        // Organizar os dados por data e status
        const timelineData = {};
        const statusSet = new Set();
        
        timelineResult.forEach(item => {
            const dateStr = this.formatDateToPtBr(item.date).split(' ')[0]; // Apenas a data
            
            if (!timelineData[dateStr]) {
                timelineData[dateStr] = {};
            }
            
            timelineData[dateStr][item.status] = item.count;
            statusSet.add(item.status);
        });
        
        // Preparar os dados para o Chart.js
        const timelineDates = Object.keys(timelineData);
        const allStatus = Array.from(statusSet);
        
        const datasets = allStatus.map(status => {
            let color;
            switch(status) {
                case 'Pendente':
                    color = '#ffc107';
                    break;
                case 'Aprovado':
                    color = '#28a745';
                    break;
                case 'Rejeitado':
                    color = '#dc3545';
                    break;
                case 'Aprovação Parcial':
                    color = '#17a2b8';
                    break;
                default:
                    color = '#6c757d';
            }
            
            return {
                label: status,
                data: timelineDates.map(date => timelineData[date][status] || 0),
                borderColor: color,
                backgroundColor: color + '33',
                tension: 0.1
            };
        });
        
        // Obter as solicitações detalhadas
        const expensesQuery = `
            SELECT 
                er.id,
                er.month,
                cc.name as costCenterName,
                er.category,
                er.description,
                er.amount,
                er.status,
                er.created_at
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            ${whereClause}
            ORDER BY
                er.created_at DESC
            LIMIT 100
        `;
        
        const expenses = await executeQuery(expensesQuery, whereParams);
        
        const formattedExpenses = expenses.map(item => ({
            id: item.id,
            costCenterName: item.costCenterName.toUpperCase(),
            month: item.month,
            category: item.category,
            description: item.description,
            amount: item.amount,
            status: item.status,
            created_at: this.formatDateToPtBr(item.created_at)
        }));
        
        return {
            summary: {
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                partial: partialCount
            },
            statusDistribution: {
                labels: statusLabels,
                values: statusValues
            },
            timeline: {
                labels: timelineDates,
                datasets: datasets
            },
            expenses: formattedExpenses
        };
    },
    
    // Relatório de gastos por mês
    reportByMonth: async function(params = {}) {
        // Construir a cláusula WHERE com base nos parâmetros
        let whereClause = '';
        const whereParams = [];
        
        if (params.monthFilter) {
            whereClause += ' WHERE er.month = ?';
            whereParams.push(params.monthFilter);
        }
        
        if (params.yearFilter) {
            whereClause += whereClause ? ' AND ' : ' WHERE ';
            whereClause += 'YEAR(er.created_at) = ?';
            whereParams.push(params.yearFilter);
        }
        
        // Obter dados de gastos por mês
        const monthQuery = `
            SELECT 
                er.month, 
                COUNT(er.id) as count,
                SUM(er.amount) as total
            FROM 
                zero_based_expense_requests er
            ${whereClause}
            GROUP BY
                er.month
        `;
        
        const monthResult = await executeQuery(monthQuery, whereParams);
        
        // Ordenar os meses corretamente
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        monthResult.sort((a, b) => {
            return months.indexOf(a.month) - months.indexOf(b.month);
        });
        
        // Preparar os dados para o gráfico de barras de gastos por mês
        const monthLabels = monthResult.map(item => item.month);
        const monthValues = monthResult.map(item => parseFloat(item.total));
        
        // Obter dados de gastos por categoria
        const categoryQuery = `
            SELECT 
                er.category, 
                SUM(er.amount) as total
            FROM 
                zero_based_expense_requests er
            ${whereClause}
            GROUP BY
                er.category
        `;
        
        const categoryResult = await executeQuery(categoryQuery, whereParams);
        
        // Preparar os dados para o gráfico de pizza de categorias
        const categoryLabels = categoryResult.map(item => item.category);
        const categoryValues = categoryResult.map(item => parseFloat(item.total));
        
        // Obter as solicitações detalhadas
        const expensesQuery = `
            SELECT 
                er.id,
                er.month,
                cc.name as costCenterName,
                er.category,
                er.description,
                er.amount,
                er.status,
                er.created_at,
                c.name as requesterName
            FROM 
                zero_based_expense_requests er
            JOIN 
                zero_based_cost_centers cc ON cc.id = er.cost_center_id
            JOIN 
                collaborators c ON c.id = er.requester_id
            ${whereClause}
            ORDER BY
                er.created_at DESC
            LIMIT 100
        `;
        
        const expenses = await executeQuery(expensesQuery, whereParams);
        
        const formattedExpenses = expenses.map(item => ({
            id: item.id,
            costCenterName: item.costCenterName.toUpperCase(),
            month: item.month,
            category: item.category,
            description: item.description,
            amount: item.amount,
            status: item.status,
            requesterName: item.requesterName,
            created_at: this.formatDateToPtBr(item.created_at)
        }));
        
        // Calcular totais para os cards de resumo
        const totalRequests = formattedExpenses.length;
        const totalApproved = formattedExpenses
            .filter(e => e.status === 'Aprovado')
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const totalAmount = formattedExpenses
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        return {
            summary: {
                totalRequests,
                totalApproved,
                totalAmount
            },
            monthlyData: {
                labels: monthLabels,
                values: monthValues
            },
            categoryData: {
                labels: categoryLabels,
                values: categoryValues
            },
            expenses: formattedExpenses
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

        const formattedRequests = result.map(item => {
            // Formatação do valor para exibição
            const amount = parseFloat(item.amount).toFixed(2);
            
            return {
                id: item.id,
                month: item.month,
                category: item.category,
                description: item.description,
                quantity: item.quantity,
                amount: amount,
                status: item.status,
                requesterName: `${item.requesterName} ${item.requesterFamilyName}`,
                created_at: item.created_at
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

        const formattedRequests = result.map(item => {
            return {
                id: item.id,
                costCenterName: item.costCenterName.toUpperCase(),
                category: item.category,
                description: item.description,
                amount: item.amount,
                requestDate: item.created_at,
                requesterName: `${item.requesterName} ${item.requesterFamilyName}`,
                approval_id: item.approval_id
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