const express = require('express');
const router = express.Router();
const MarketingTicketsController = require('../controllers/marketing-tickets');
const { commentEmailScheduler } = require('../controllers/marketing-tickets');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = function(io) {

// Configuração do multer para uploads em /storageService/marketing-tickets/
const uploadDir = path.join(__dirname, '../../storageService/marketing-tickets');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

// Middleware para adicionar io ao req
const addIoToReq = (req, res, next) => {
    req.io = io;
    next();
};

// Buscar usuários para Select2
router.get('/users', MarketingTicketsController.getUsers);

// Buscar tipos de chamado
router.get('/types', MarketingTicketsController.getTypes);

// Buscar status
router.get('/statuses', MarketingTicketsController.getStatuses);

// Listar chamados
router.get('/', MarketingTicketsController.list);

// Listar chamados do colaborador
router.get('/collaborator', MarketingTicketsController.listCollaborator);

// Criar chamado (com múltiplos anexos)
router.post('/', addIoToReq, upload.array('attachments'), MarketingTicketsController.create);

// Atualizar ordem dos cards no Kanban
router.put('/kanban-order', addIoToReq, MarketingTicketsController.updateKanbanOrder);

// Detalhes do chamado
router.get('/:id', MarketingTicketsController.get);

// Atualizar status do chamado (para o time de marketing)
router.put('/:id/status', addIoToReq, MarketingTicketsController.updateStatus);

// Atualizar chamado completo (para administradores)
router.put('/:id', addIoToReq, upload.array('attachments'), MarketingTicketsController.update);

// Excluir chamado
router.delete('/:id', addIoToReq, MarketingTicketsController.delete);

// Listar comentários
router.get('/:id/comments', MarketingTicketsController.listComments);

// Adicionar comentário
router.post('/:id/comments', addIoToReq, MarketingTicketsController.addComment);

// Upload de anexos adicionais
router.post('/:id/attachments', upload.array('attachments'), MarketingTicketsController.uploadAttachment);

// Remover anexo específico
router.delete('/attachments/:attachmentId', MarketingTicketsController.removeAttachment);

// Listar envolvidos
router.get('/:id/involved', MarketingTicketsController.listInvolved);

// Adicionar envolvido
router.post('/:id/involved', MarketingTicketsController.addInvolved);

// Rota para verificar status dos lotes de e-mails (apenas para administradores)
router.get('/email-batches/status', (req, res) => {
    try {
        const stats = commentEmailScheduler.getBatchStats();
        const retryConfig = commentEmailScheduler.getRetryConfig();
        res.json({
            success: true,
            stats: stats,
            retryConfig: retryConfig,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter status dos lotes' });
    }
});

// Rota para forçar processamento de lotes (apenas para administradores)
router.post('/email-batches/process', async (req, res) => {
    try {
        await commentEmailScheduler.forceProcessBatches();
        res.json({ success: true, message: 'Processamento de lotes forçado com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao processar lotes' });
    }
});

    return router;
}; 