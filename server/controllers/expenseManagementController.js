const { executeQuery } = require('../connect/mysql');

const ExpenseManagement = {
    // Criar uma nova despesa
    createExpense: async function(req, res) {
        try {
            const { 
                description, 
                amount, 
                department_id, 
                payment_date, 
                status, 
                frequency 
            } = req.body;

            const query = `
                INSERT INTO expense_management 
                (description, amount, department_id, payment_date, status, frequency) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const result = await executeQuery(query, [
                description, 
                amount, 
                department_id, 
                payment_date, 
                status, 
                frequency
            ]);

            res.status(201).json({
                message: 'Despesa criada com sucesso',
                expenseId: result.insertId
            });
        } catch (error) {
            console.error('Erro ao criar despesa:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message 
            });
        }
    },

    // Obter todas as despesas com filtros opcionais
    getAllExpenses: async function(req, res) {
        try {
            const { 
                department_id, 
                status, 
                start_date, 
                end_date 
            } = req.query;

            let query = `
                SELECT * FROM expense_management 
                WHERE 1=1
            `;
            const params = [];

            if (department_id) {
                query += ` AND department_id = ?`;
                params.push(department_id);
            }

            if (status) {
                query += ` AND status = ?`;
                params.push(status);
            }

            if (start_date && end_date) {
                query += ` AND payment_date BETWEEN ? AND ?`;
                params.push(start_date, end_date);
            }

            const expenses = await executeQuery(query, params);

            res.status(200).json(expenses);
        } catch (error) {
            console.error('Erro ao buscar despesas:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message 
            });
        }
    },

    // Atualizar uma despesa existente
    updateExpense: async function(req, res) {
        try {
            const { id } = req.params;
            const { 
                description, 
                amount, 
                department_id, 
                payment_date, 
                status, 
                frequency 
            } = req.body;

            const query = `
                UPDATE expense_management 
                SET description = ?, 
                    amount = ?, 
                    department_id = ?, 
                    payment_date = ?, 
                    status = ?, 
                    frequency = ? 
                WHERE id = ?
            `;

            const result = await executeQuery(query, [
                description, 
                amount, 
                department_id, 
                payment_date, 
                status, 
                frequency, 
                id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Despesa não encontrada' });
            }

            res.status(200).json({ message: 'Despesa atualizada com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar despesa:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message 
            });
        }
    },

    // Excluir uma despesa
    deleteExpense: async function(req, res) {
        try {
            const { id } = req.params;

            const query = `DELETE FROM expense_management WHERE id = ?`;
            const result = await executeQuery(query, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Despesa não encontrada' });
            }

            res.status(200).json({ message: 'Despesa excluída com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir despesa:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message 
            });
        }
    },

    // Obter resumo de despesas por departamento
    getExpenseSummaryByDepartment: async function(req, res) {
        try {
            const { start_date, end_date } = req.query;

            let query = `
                SELECT 
                    department_id, 
                    COUNT(*) as total_expenses,
                    SUM(amount) as total_amount,
                    AVG(amount) as average_expense
                FROM expense_management
                WHERE 1=1
            `;
            const params = [];

            if (start_date && end_date) {
                query += ` AND payment_date BETWEEN ? AND ?`;
                params.push(start_date, end_date);
            }

            query += ` GROUP BY department_id`;

            const summary = await executeQuery(query, params);

            res.status(200).json(summary);
        } catch (error) {
            console.error('Erro ao obter resumo de despesas:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message 
            });
        }
    }
}

module.exports = {
    ExpenseManagement,
};
