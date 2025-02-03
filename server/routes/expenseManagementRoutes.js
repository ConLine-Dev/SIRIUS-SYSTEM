const express = require('express');
const { ExpenseManagement } = require('../controllers/expenseManagementController');

/**
 * Expense Management Routes
 * Provides API endpoints for managing department expenses
 */

module.exports = (io) => {
    const router = express.Router();

    // Create a new expense
    router.post('/expenses', (req, res) => {
        ExpenseManagement.createExpense(req, res);
    });

    // Get all expenses with optional filtering
    router.get('/expenses', (req, res) => {
        ExpenseManagement.getAllExpenses(req, res);
    });

    // Update an existing expense
    router.put('/expenses/:id', (req, res) => {
        ExpenseManagement.updateExpense(req, res);
    });

    // Delete an expense
    router.delete('/expenses/:id', (req, res) => {
        ExpenseManagement.deleteExpense(req, res);
    });

    // Get expense summary by department
    router.get('/expenses/summary', (req, res) => {
        ExpenseManagement.getExpenseSummaryByDepartment(req, res);
    });

    // List departments
    router.get('/departments', (req, res) => {
        ExpenseManagement.listDepartments(req, res);
    });

    // Criar despesa recorrente
    router.post('/expenses/recurring', (req, res) => {
        ExpenseManagement.createRecurringExpense(req, res);
    });

    // Marcar despesa como paga
    router.patch('/expenses/:id/pay', (req, res) => {
        ExpenseManagement.markExpenseAsPaid(req, res);
    });

    // Rota para marcar despesa como paga
    router.post('/expenses/:id/mark-paid', (req, res) => {
        ExpenseManagement.markExpenseAsPaid(req, res);
    });

    // Listar despesas pendentes
    router.get('/expenses/pending', (req, res) => {
        ExpenseManagement.getPendingExpenses(req, res);
    });

    return router;
};
