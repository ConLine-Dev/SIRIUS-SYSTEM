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

    return router;
};
