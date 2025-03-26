const express = require('express');
const router = express.Router();
const userTracker = require('../controllers/user-tracker');

// Exportar como uma função que recebe o objeto io
module.exports = function(io) {
    // Middleware para verificar autenticação
    function checkAuth(req, res, next) {
        // if (!req.session || !req.session.user) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Usuário não autenticado'
        //     });
        // }
        next();
    }
    
    // Middleware para verificar se o rastreador está inicializado
    function checkTrackerInitialized(req, res, next) {
        if (!userTracker.io) {
            userTracker.initialize(io);
        }
        next();
    }
    
    // Obter todos os usuários ativos
    router.get('/active-users', checkAuth, checkTrackerInitialized, (req, res) => {
        try {
            const users = userTracker.getAllActiveUsers();
            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Erro ao obter usuários ativos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter usuários ativos: ' + error.message
            });
        }
    });
    
    // Obter usuários ativos por módulo
    router.get('/active-users/:module', checkAuth, checkTrackerInitialized, (req, res) => {
        try {
            const module = req.params.module;
            const users = userTracker.getActiveUsersByModule(module);
            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Erro ao obter usuários ativos por módulo:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter usuários ativos por módulo: ' + error.message
            });
        }
    });
    
    // Obter estatísticas de todas as páginas
    router.get('/page-stats', checkAuth, checkTrackerInitialized, (req, res) => {
        try {
            const stats = userTracker.getAllPageStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Erro ao obter estatísticas de páginas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter estatísticas de páginas: ' + error.message
            });
        }
    });
    
    // Obter estatísticas de páginas por módulo
    router.get('/page-stats/:module', checkAuth, checkTrackerInitialized, (req, res) => {
        try {
            const module = req.params.module;
            const stats = userTracker.getPageStatsByModule(module);
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Erro ao obter estatísticas de páginas por módulo:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter estatísticas de páginas por módulo: ' + error.message
            });
        }
    });
    
    // Obter contagem de usuários
    router.get('/user-count', checkAuth, checkTrackerInitialized, (req, res) => {
        try {
            const count = userTracker.getUserCount();
            res.json({
                success: true,
                data: count
            });
        } catch (error) {
            console.error('Erro ao obter contagem de usuários:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter contagem de usuários: ' + error.message
            });
        }
    });
    
    // Rota de dashboard para obter todos os dados de uma vez
    router.get('/dashboard', checkAuth, checkTrackerInitialized, (req, res) => {
        try {
            const data = userTracker.getDashboardData();
            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            console.error('Erro ao obter dados do dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter dados do dashboard: ' + error.message
            });
        }
    });
    
    return router;
}; 