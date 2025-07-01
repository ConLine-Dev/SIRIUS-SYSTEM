const express = require('express');
const proceduresController = require('../controllers/procedures-management');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garante que o diretório de upload exista
const uploadDir = 'storageService/procedures/attachments';
fs.mkdirSync(uploadDir, { recursive: true });

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Garante um nome de arquivo único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // Limite de 25MB por arquivo
});

module.exports = function(io) {
    const router = express.Router();

    // Rota para upload de anexo
    router.post('/procedures/upload', upload.single('attachment'), (req, res) => {
        if (!req.file) {
            return res.status(400).send({ message: 'Nenhum arquivo enviado.' });
        }
        res.status(201).send({
            message: 'Arquivo enviado com sucesso!',
            filePath: `/storageService/procedures/attachments/${req.file.filename}`,
            fileName: req.file.originalname
        });
    });

    // Rota para obter todos os procedimentos
    router.get('/procedures', proceduresController.getProcedures);

    // Rota para obter um procedimento por ID
    router.get('/procedures/:id', proceduresController.getProcedureById);

    // Rota otimizada para carregar conteúdo de versão específica sob demanda
    router.get('/procedures/:procedureId/versions/:versionNumber/content', proceduresController.getVersionContent);

    // Rotas otimizadas para criar, atualizar e deletar
    router.post('/procedures', async (req, res) => {
        const result = await proceduresController.createProcedure(req, res);
        if (io && result && result.id) {
            // Emitir evento específico com título para notificação
            io.emit('procedure_created', { 
                id: result.id, 
                title: req.body.title || 'Novo Procedimento',
                action: 'create'
            });
        }
    });
    
    router.put('/procedures/:id', async (req, res) => {
        const result = await proceduresController.updateProcedure(req, res);
        if (io && result && result.success) {
            // Emitir evento específico com título para notificação
            io.emit('procedure_updated', { 
                id: req.params.id, 
                title: req.body.title || 'Procedimento',
                action: 'update'
            });
        }
    });
    
    router.delete('/procedures/:id', async (req, res) => {
        // Buscar título antes de deletar para notificação
        let procedureTitle = 'Procedimento';
        try {
            const procedure = await proceduresController.getProcedureTitle(req.params.id);
            if (procedure) procedureTitle = procedure.title;
        } catch (error) {
            console.error('Erro ao buscar título do procedimento:', error);
        }
        
        const result = await proceduresController.deleteProcedure(req, res);
        if (io && result && result.success) {
            // Emitir evento específico com título para notificação
            io.emit('procedure_deleted', { 
                id: req.params.id, 
                title: procedureTitle,
                action: 'delete'
            });
        }
    });

    // Novas rotas para obter metadados para os formulários
    router.get('/meta/departments', proceduresController.getDepartments);
    router.get('/meta/roles', proceduresController.getRoles);
    router.get('/meta/types', proceduresController.getProcedureTypes);
    router.get('/meta/responsibles', proceduresController.getResponsibles);

    // A rota de histórico foi removida, pois os dados agora estão embutidos em /procedures/:id

    // Reverter um procedimento para uma versão específica
    router.post('/procedures/:id/revert', async (req, res) => {
        // Buscar título para notificação
        let procedureTitle = 'Procedimento';
        try {
            const procedure = await proceduresController.getProcedureTitle(req.params.id);
            if (procedure) procedureTitle = procedure.title;
        } catch (error) {
            console.error('Erro ao buscar título do procedimento:', error);
        }
        
        const result = await proceduresController.revertToVersion(req, res);
        if (io && result && result.success) {
            // Emitir evento específico para reversão
            io.emit('procedure_updated', { 
                id: req.params.id, 
                title: procedureTitle,
                action: 'revert',
                version: req.body.version_number
            });
        }
    });

    return router;
}; 