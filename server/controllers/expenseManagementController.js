const { executeQuery } = require('../connect/mysql');
const cron = require('node-cron');

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

            // Gerar um nome para a despesa se não for fornecido
            const name = description ? description.substring(0, 50) : `Despesa ${new Date().toLocaleDateString()}`;

            const query = `
                INSERT INTO expense_management 
                (name, description, amount, department_id, payment_date, status, frequency, last_generated_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await executeQuery(query, [
                name,
                description, 
                amount, 
                department_id, 
                payment_date, 
                status, 
                frequency,
                frequency !== 'once' ? new Date(payment_date).toISOString().split('T')[0] : null
            ]);

            ExpenseManagement.generateRecurringExpenses();

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

    // Método para criar despesa recorrente
    createRecurringExpense: async function(req, res) {
        try {
            const { 
                name,
                description, 
                amount, 
                department_id, 
                payment_day,  // Dia do mês para pagamento
                frequency,    // 'monthly'
                status = 'pending'
            } = req.body;

            // Inserir modelo de despesa recorrente
            const insertQuery = `
                INSERT INTO expense_management 
                (name, description, amount, department_id, payment_date, status, frequency, is_template)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            // Definir data inicial como próximo mês
            const initialDate = new Date();
            initialDate.setDate(payment_day);
            initialDate.setMonth(initialDate.getMonth() + 1);

            const result = await executeQuery(insertQuery, [
                name,
                description, 
                amount, 
                department_id, 
                initialDate.toISOString().split('T')[0],
                status,
                frequency,
                1  // Marca como template de despesa recorrente
            ]);

            res.status(201).json({
                message: 'Despesa recorrente criada com sucesso',
                expenseId: result.insertId
            });
        } catch (error) {
            console.error('Erro ao criar despesa recorrente:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message 
            });
        }
    },


    // Novo método para gerar despesas recorrentes
    generateRecurringExpenses: async function() {
        try {
            // Buscar despesas recorrentes que precisam ser geradas
            const queryRecurring = `
                SELECT * FROM expense_management 
                WHERE frequency IN ('monthly', 'yearly') 
                AND (
                    (frequency = 'monthly' AND 
                     (last_generated_date IS NULL OR 
                      (YEAR(CURRENT_DATE) > YEAR(last_generated_date)) OR 
                      (YEAR(CURRENT_DATE) = YEAR(last_generated_date) AND 
                       MONTH(CURRENT_DATE) > MONTH(last_generated_date)))
                    ) 
                    OR 
                    (frequency = 'yearly' AND 
                     (last_generated_date IS NULL OR 
                      YEAR(CURRENT_DATE) > YEAR(last_generated_date))
                    )
                )
            `;
    
            const recurringExpenses = await executeQuery(queryRecurring);
            // console.log('Despesas recorrentes encontradas:', recurringExpenses);
    
            for (const expense of recurringExpenses) {
                // Calcular próxima data de pagamento baseado na frequência
                let nextPaymentDate;
                if (expense.frequency === 'monthly') {
                    nextPaymentDate = new Date(expense.payment_date);
                    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
                    nextPaymentDate.setDate(expense.payment_date.getDate());
                } else if (expense.frequency === 'yearly') {
                    nextPaymentDate = new Date();
                    nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
                    nextPaymentDate.setMonth(expense.payment_date.getMonth());
                    nextPaymentDate.setDate(expense.payment_date.getDate());
                }
    
                // Inserir nova despesa recorrente
                const insertQuery = `
                    INSERT INTO expense_management 
                    (name, description, amount, department_id, payment_date, status, frequency, 
                     last_generated_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
    
                await executeQuery(insertQuery, [
                    expense.name,
                    expense.description,
                    expense.amount,
                    expense.department_id,
                    nextPaymentDate.toISOString().split('T')[0],
                    'pending',
                    expense.frequency,
                    new Date().toISOString().split('T')[0]
                ]);
    
                // console.log(`: ${expense.name}`);
            }
    
            // console.log('Processo de geração de despesas recorrentes concluído');
        } catch (error) {
            console.error('Erro ao gerar despesas recorrentes:', error);
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
                SELECT 
                    e.id, 
                    e.name,
                    e.description, 
                    e.amount, 
                    e.payment_date, 
                    e.status,
                    e.frequency,
                    d.name AS department_name,
                    CASE 
                        WHEN e.frequency = 'monthly' THEN 'Mensal'
                        WHEN e.frequency = 'yearly' THEN 'Anual'
                        ELSE 'Único' 
                    END AS frequency_label,
                    CASE 
                        WHEN e.frequency != 'once' AND e.status = 'pending' THEN 
                            DATEDIFF(CURRENT_DATE, e.payment_date) 
                        ELSE NULL 
                    END AS days_overdue
                FROM 
                    expense_management e
                LEFT JOIN 
                    departments d ON e.department_id = d.id
                WHERE 1=1
            `;

            const params = [];

            // Adicionar filtros
            if (department_id) {
                query += ' AND e.department_id = ?';
                params.push(department_id);
            }

            if (status) {
                query += ' AND e.status = ?';
                params.push(status);
            }

            if (start_date && end_date) {
                query += ' AND e.payment_date BETWEEN ? AND ?';
                params.push(start_date, end_date);
            }

            query += ` ORDER BY days_overdue DESC, e.payment_date DESC`;

            const expenses = await executeQuery(query, params);

       

            res.status(200).json(expenses);
        } catch (error) {
            console.error('Erro detalhado ao listar despesas:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message,
                stack: error.stack 
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

            // Gerar um nome para a despesa se não for fornecido
            const name = description ? description.substring(0, 50) : `Despesa ${new Date().toLocaleDateString()}`;

            const query = `
                UPDATE expense_management 
                SET name = ?, 
                    description = ?, 
                    amount = ?, 
                    department_id = ?, 
                    payment_date = ?, 
                    status = ?, 
                    frequency = ? 
                WHERE id = ?
            `;

            const result = await executeQuery(query, [
                name,
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
    },

    // Método para listar departamentos
    listDepartments: async function(req, res) {
        try {
            const query = `
                SELECT 
                    id, 
                    name 
                FROM departments 
                ORDER BY name ASC
            `;

            const departments = await executeQuery(query);

            res.status(200).json(departments);
        } catch (error) {
            console.error('Erro ao listar departamentos:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message 
            });
        }
    },

    // Marcar despesa como paga
    markExpenseAsPaid: async function(req, res) {
        try {
            const { id } = req.params;
            const { payment_date } = req.body;

            const query = `
                UPDATE expense_management 
                SET 
                    status = 'paid', 
                    actual_payment_date = ?, 
                    paid_amount = amount
                WHERE id = ?
            `;

            const result = await executeQuery(query, [
                payment_date || new Date().toISOString().split('T')[0],
                id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Despesa não encontrada' });
            }

            res.status(200).json({ 
                message: 'Despesa marcada como paga com sucesso',
                updatedExpenseId: id
            });
        } catch (error) {
            console.error('Erro ao marcar despesa como paga:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message 
            });
        }
    },

    // Listar despesas pendentes
    getPendingExpenses: async function(req, res) {
        try {
            const query = `
                SELECT 
                    e.*, 
                    d.name AS department_name,
                    DATEDIFF(CURRENT_DATE, e.payment_date) AS days_overdue
                FROM 
                    expense_management e
                LEFT JOIN 
                    departments d ON e.department_id = d.id
                WHERE 
                    e.status = 'pending'
                ORDER BY 
                    days_overdue DESC, 
                    e.payment_date ASC
            `;

            const pendingExpenses = await executeQuery(query);

            res.status(200).json(pendingExpenses);
        } catch (error) {
            console.error('Erro ao buscar despesas pendentes:', error);
            res.status(500).json({ 
                message: 'Erro interno ao processar a solicitação', 
                error: error.message 
            });
        }
    },
}

cron.schedule('0 * * * *', async () => {
    ExpenseManagement.generateRecurringExpenses();
});

ExpenseManagement.generateRecurringExpenses();

module.exports = {
    ExpenseManagement,
};
