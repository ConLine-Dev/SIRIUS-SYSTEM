const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const linkTree = require('../controllers/link-tree');

// Configuração do multer para upload do guia do agente
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/marketing/link-tree/temp';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// Filtro para aceitar apenas arquivos PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos PDF são permitidos'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB
    }
});

// Rota para obter todos os dados do link-tree
router.get('/data', async (req, res) => {
    try {
        const data = await linkTree.getLinkTreeData();
        res.json(data);
    } catch (error) {
        console.error('Erro ao obter dados do link-tree:', error);
        res.status(500).json({ error: 'Erro ao obter dados do link-tree' });
    }
});

// Rota para adicionar um novo botão
router.post('/button', async (req, res) => {
    try {
        const { title, url, downloadUrl, active } = req.body;
        
        // Validação básica
        if (!title || !url) {
            return res.status(400).json({ error: 'Título e URL são obrigatórios' });
        }
        
        const newButton = await linkTree.addButton({ title, url, downloadUrl, active });
        res.status(201).json(newButton);
    } catch (error) {
        console.error('Erro ao adicionar botão:', error);
        res.status(500).json({ error: 'Erro ao adicionar botão' });
    }
});

// Rota para atualizar um botão existente
router.put('/button/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, downloadUrl, active } = req.body;
        
        // Validação básica
        if (!id) {
            return res.status(400).json({ error: 'ID do botão é obrigatório' });
        }
        
        const updatedButton = await linkTree.updateButton(id, { title, url, downloadUrl, active });
        res.json(updatedButton);
    } catch (error) {
        console.error('Erro ao atualizar botão:', error);
        
        if (error.message === 'Botão não encontrado') {
            return res.status(404).json({ error: 'Botão não encontrado' });
        }
        
        res.status(500).json({ error: 'Erro ao atualizar botão' });
    }
});

// Rota para remover um botão
router.delete('/button/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validação básica
        if (!id) {
            return res.status(400).json({ error: 'ID do botão é obrigatório' });
        }
        
        const result = await linkTree.deleteButton(id);
        res.json(result);
    } catch (error) {
        console.error('Erro ao remover botão:', error);
        
        if (error.message === 'Botão não encontrado') {
            return res.status(404).json({ error: 'Botão não encontrado' });
        }
        
        res.status(500).json({ error: 'Erro ao remover botão' });
    }
});

// Rota para reordenar botões
router.post('/buttons/reorder', async (req, res) => {
    try {
        const { buttonIds } = req.body;
        
        // Validação básica
        if (!buttonIds || !Array.isArray(buttonIds) || buttonIds.length === 0) {
            return res.status(400).json({ error: 'Lista de IDs de botões é obrigatória' });
        }
        
        const reorderedButtons = await linkTree.reorderButtons(buttonIds);
        res.json(reorderedButtons);
    } catch (error) {
        console.error('Erro ao reordenar botões:', error);
        
        if (error.message === 'Um ou mais botões não foram encontrados' || 
            error.message === 'A quantidade de botões não corresponde') {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Erro ao reordenar botões' });
    }
});

// Rota para fazer upload do guia do agente
router.post('/agent-guide', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }
        
        const result = await linkTree.uploadAgentGuide(req.file);
        res.status(201).json(result);
    } catch (error) {
        console.error('Erro ao fazer upload do guia do agente:', error);
        res.status(500).json({ error: 'Erro ao fazer upload do guia do agente' });
    }
});

// Rota para remover o guia do agente
router.delete('/agent-guide', async (req, res) => {
    try {
        const result = await linkTree.deleteAgentGuide();
        res.json(result);
    } catch (error) {
        console.error('Erro ao remover guia do agente:', error);
        
        if (error.message === 'Guia do agente não encontrado') {
            return res.status(404).json({ error: 'Guia do agente não encontrado' });
        }
        
        res.status(500).json({ error: 'Erro ao remover guia do agente' });
    }
});

// Rota para visualizar o guia do agente (URL fixa)
router.get('/agent-guide/view', async (req, res) => {
    try {
        const guideInfo = await linkTree.getAgentGuidePath();
        
        // Enviar o arquivo como resposta
        res.setHeader('Content-Disposition', `inline; filename="${guideInfo.fileName}"`);
        res.setHeader('Content-Type', guideInfo.mimeType);
        res.sendFile(guideInfo.filePath);
    } catch (error) {
        console.error('Erro ao obter guia do agente para visualização:', error);
        
        if (error.message === 'Guia do agente não encontrado') {
            return res.status(404).json({ error: 'Guia do agente não encontrado' });
        }
        
        res.status(500).json({ error: 'Erro ao obter guia do agente para visualização' });
    }
});

/**
 * @api {get} /api/link-tree/public Obter Links Públicos
 * @apiVersion 1.0.0
 * @apiName GetPublicLinks
 * @apiGroup LinkTree
 * @apiDescription Obtém todos os links ativos do Link Tree para exibição em front-ends externos.
 * Esta API é pública e pode ser acessada sem autenticação.
 *
 * @apiSuccess {Object[]} links Lista de links ativos
 * @apiSuccess {String} links.id ID único do link
 * @apiSuccess {String} links.title Título do link
 * @apiSuccess {String} links.url URL principal do link
 * @apiSuccess {String} [links.downloadUrl] URL de download opcional
 * @apiSuccess {Object} [agentGuide] Informações do guia do agente (se existir)
 * @apiSuccess {String} agentGuide.title Título do guia do agente
 * @apiSuccess {String} agentGuide.url URL para acessar o guia do agente
 *
 * @apiSuccessExample {json} Exemplo de Resposta:
 *     HTTP/1.1 200 OK
 *     {
 *       "links": [
 *         {
 *           "id": "123e4567-e89b-12d3-a456-426614174000",
 *           "title": "Site Oficial",
 *           "url": "https://www.siriussystem.com.br"
 *         },
 *         {
 *           "id": "523e4567-e89b-12d3-a456-426614174023",
 *           "title": "Materiais de Treinamento",
 *           "url": "https://treinamento.siriussystem.com.br",
 *           "downloadUrl": "https://recursos.siriussystem.com.br/treinamento-2023.zip"
 *         }
 *       ],
 *       "agentGuide": {
 *         "title": "Guia do Agente",
 *         "url": "/api/link-tree/agent-guide/view"
 *       }
 *     }
 *
 * @apiError (Erro 500) {String} error Mensagem de erro
 */
// API pública para obter links ativos para front-ends externos
router.get('/public', async (req, res) => {
    try {
        // Configurar CORS para permitir acesso externo
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Cache-Control', 'max-age=300'); // Cache de 5 minutos
        
        const publicLinks = await linkTree.getPublicLinks();
        res.json(publicLinks);
    } catch (error) {
        console.error('Erro ao obter links públicos:', error);
        res.status(500).json({ error: 'Erro ao obter links públicos' });
    }
});

module.exports = router; 