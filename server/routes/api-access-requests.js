const express = require('express');
const router = express.Router();
const AccessRequestsController = require('../controllers/access-requests');

// Middleware para verificar se o usuário é administrador
const requireAdmin = (req, res, next) => {
    // Aqui você deve implementar a verificação de permissão de administrador
    // Por enquanto, vamos assumir que o usuário está autenticado
    if (!req.user_id) {
        return res.status(401).json({
            success: false,
            message: 'Acesso negado'
        });
    }
    next();
};

// Rota pública para criar solicitação de acesso
router.post('/', AccessRequestsController.create);

// Rotas administrativas (requerem autenticação de admin)
router.get('/', requireAdmin, AccessRequestsController.list);
router.get('/clients', requireAdmin, AccessRequestsController.getClients);
router.get('/:id', requireAdmin, AccessRequestsController.get);
router.post('/:id/approve-link', requireAdmin, AccessRequestsController.approveAndLink);
router.post('/:id/approve-create', requireAdmin, AccessRequestsController.approveAndCreateClient);
router.post('/:id/reject', requireAdmin, AccessRequestsController.reject);

module.exports = router; 