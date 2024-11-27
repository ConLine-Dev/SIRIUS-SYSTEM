const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require("path");
const fs = require('fs');
const { tickets } = require('../controllers/called-tickets');

const uploadQueue = []; // Fila para requisições
let isProcessing = false; // Controle para processamento


// Configuração do multer para armazenar arquivos no sistema de arquivos
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'storageService/ti/tickets/files';
        try {
            await fs.promises.mkdir(uploadDir, { recursive: true });
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
const upload = multer({ storage });


async function processQueue() {
    if (isProcessing || uploadQueue.length === 0) return;

    isProcessing = true;

    while (uploadQueue.length > 0) {
        const { ticketId, Files, resolve, reject } = uploadQueue.shift();

        try {
            // Processa os arquivos do ticket
            const result = await tickets.uploadFileTicket(ticketId, Files);
            resolve(result);
        } catch (error) {
            reject(error);
        }
    }

    isProcessing = false;
}

// Função que adiciona requisições à fila
function addToQueue(ticketId, Files) {
    return new Promise((resolve, reject) => {
        uploadQueue.push({ ticketId, Files, resolve, reject });
        processQueue(); // Inicia o processamento da fila
    });
}


module.exports = function(io) {

    router.get('/listAll', async (req, res, next) => {
        try {
            const result = await tickets.listAll();
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    router.post('/getById', async (req, res, next) => {
        const { id } = req.body
        try {
            const result = await tickets.getById(id);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.post('/removeTicket', async (req, res, next) => {
        const { id } = req.body
        try {
            const result = await tickets.removeTicket(id);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.post('/createMessage', async (req, res, next) => {
        try {
            const result = await tickets.createMessage(req.body);
            io.emit('new-message-ticket', result);
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.post('/listAllMessage', async (req, res, next) => {
        try {
            const result = await tickets.listAllMessage();
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.post('/listMessage', async (req, res, next) => {
        try {
            const result = await tickets.listMessage(req.body.id);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.post('/saveTicket', async (req, res, next) => {
        try {
            const result = await tickets.saveTicket(req.body);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.get('/download-file/:filename', (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../storageService/ti/tickets/files', filename);
    w
        res.download(filePath, (err) => {
            if (err) {
                res.status(500).send('Erro ao baixar o arquivo.');
            }
        });
    });
    
    router.get('/view-file/:filename', (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../storageService/ti/tickets/files', filename);
    
        // Mapeamento das extensões para os tipos MIME
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.txt': 'text/plain',
            '.html': 'text/html'
        };

    
        // Verifica se o arquivo existe
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                res.status(404).send('Arquivo não encontrado.');
                return;
            }
    
            // Define o cabeçalho para exibir o arquivo no navegador
            res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
    
            // Define o tipo de conteúdo baseado na extensão do arquivo
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = mimeTypes[ext] || 'application/octet-stream'; // Tipo padrão para extensões desconhecidas
            res.setHeader('Content-Type', mimeType);
    
            // Envia o arquivo como stream para visualização
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        });
    });
    
    router.post('/create-ticket', upload.array('attachments'), async (req, res, next) => {
    
        try {
            // Dados enviados no corpo
            const formData = req.body;
    
            // Arquivos enviados
            const files = req.files;
    
            // Passa os dados e arquivos para a função createTicket
            const result = await tickets.createTicket({ formData, files });
    
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao criar chamado:', error);
            res.status(500).json({ error: 'Erro ao criar chamado', details: error.message });
        }
    });
    
    router.post('/upload-file-ticket', upload.array('filepond'), async (req, res) => {
        const { ticketId } = req.body;
    
        if (!ticketId || !req.files) {
            return res.status(400).json({ success: false, message: 'ticketId ou arquivos não fornecidos.' });
        }
    
        try {
            const Files = req.files;
    
            // Adiciona a requisição à fila
            const result = await addToQueue(ticketId, Files);
    
            const saida = { success: true, data: result, id: ticketId };
            io.emit('new-file-ticket', saida);
            res.status(200).json({ success: true, message: 'Arquivo(s) adicionado(s) com sucesso!', data: result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao adicionar arquivos.', error });
        }
    });
    
    router.post('/teamByTicket', async (req, res, next) => {
        const { ticketId } = req.body;

        try {
            
            const updatedFiles = await tickets.teamByTicket(ticketId);
            // io.emit('remove-file-ticket', updatedFiles);
            res.status(200).json({ success: true, message: 'Arquivo removido com sucesso!', data: updatedFiles });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao remover o arquivo.', error });
        }
    });

    router.post('/update-team', async (req, res, next) => {

        try {
            
            const updatedFiles = await tickets.updateTeam(req.body);
            io.emit('update-team', updatedFiles);
            res.status(200).json({ success: true, message: 'Arquivo removido com sucesso!', data: updatedFiles });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao remover o arquivo.', error });
        }
    });

    router.delete('/reverse-file-ticket', async (req, res, next) => {
        const { ticketId, filename } = req.body;

    
        if (!ticketId || !filename) {
            return res.status(400).json({ success: false, message: 'ticketId ou filename não fornecidos.' });
        }
    
        try {
            
            const updatedFiles = await tickets.removeFileFromTicket(ticketId, filename);
            io.emit('remove-file-ticket', updatedFiles);
            res.status(200).json({ success: true, message: 'Arquivo removido com sucesso!', data: updatedFiles });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao remover o arquivo.', error });
        }
    });

    router.post('/remove-assigned', async (req, res) => {
        const { userId, ticketId } = req.body;
    
        // Valida os dados recebidos
        if (!userId || !ticketId) {
            return res.status(400).json({
                success: false,
                message: 'ID do usuário ou ID do ticket não fornecido.',
            });
        }
    
        try {
           
            const removeUser = await tickets.removeAssigned(userId, ticketId);

            io.emit('remove-assigned', { userId, ticketId });
            // Retorna sucesso para o frontend
            res.status(200).json({
                success: true,
                message: 'Usuário removido com sucesso da equipe.',
            });
        } catch (error) {
            console.error('Erro ao remover o usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao remover o usuário.',
            });
        }
    });

    router.post('/delete-step-status', async (req, res, next) => {
        const { stepId } = req.body

        if (!stepId) {
            return res.status(400).json({ success: false, message: 'Dados inválidos.' });
        }



        try {
            const result = await tickets.deleteStepStatus(stepId);
            io.emit('delete-step-status', {stepId});
            res.status(200).json({ success: true, message: 'Etapa removida com sucesso.' });
        } catch (error) {
            console.error('Erro ao atualizar o status da etapa:', error);
            res.status(500).json({ success: false, message: 'Erro ao remover o etapa.' });
        }
    });
    
    router.post('/update-step-status', async (req, res, next) => {
        const { stepId, completed } = req.body

        if (!stepId || completed === undefined) {
            return res.status(400).json({ success: false, message: 'Dados inválidos.' });
        }

        // Define o status com base no valor do checkbox
        const status = completed ? 'completed' : 'pending';

        try {
            const result = await tickets.updateStepStatus(stepId, status);
            io.emit('update-step-status', {result, stepId, completed});
            res.status(200).json({ success: true, message: 'Status atualizado com sucesso.' });
        } catch (error) {
            console.error('Erro ao atualizar o status da etapa:', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar o status.' });
        }
    });

    router.post('/changeColumn', async (req, res, next) => {
        const { column, value, ticketId } = req.body

        try {
            const result = await tickets.changeColumn(column, value, ticketId);
            io.emit('changeColumn', {column, value, ticketId});
            res.status(200).json({ success: true, message: 'Status atualizado com sucesso.' });
        } catch (error) {
            console.error('Erro ao atualizar o status da etapa:', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar o status.' });
        }
    });

    router.post('/create-step', async (req, res, next) => {
        const { ticketId, step } = req.body
        try {
            const result = await tickets.createStep(ticketId, step);
            io.emit('create-step', {result, ticketId, step});
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.post('/create', async (req, res, next) => {
        try {
            const result = await tickets.create(req.body);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.post('/updateStatus', async (req, res, next) => {
        const {id, status} = req.body
        try {
            const result = await tickets.updateStatus(id, status);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.post('/updateStartForecast', async (req, res, next) => {
        const {id, date} = req.body
        try {
            const result = await tickets.updateStartForecast(id, date);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.post('/updateEndForecast', async (req, res, next) => {
        const {id, date} = req.body
        try {
            const result = await tickets.updateEndForecast(id, date);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });
    
    router.get('/notificatePendingTickets', async (req, res, next) => {
        try {
            const result = await tickets.notificatePendingTickets();
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });



    return router
}

