const express = require('express');
const router = express.Router();
const { procurationControl } = require('../controllers/procuration-control.js');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configuração do multer para salvar em uploads/procuration-control/anexos
const uploadDir = path.join(__dirname, '../../uploads/procuration-control/anexos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Garante nome único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

module.exports = function(io) {

    router.get('/procurationData', async (req, res, next) => {
        try {
            const result = await procurationControl.procurationData();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/documentHistory', async (req, res, next) => {
        try {
            const result = await procurationControl.documentHistory(req.body.documentId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/saveEvent', async (req, res, next) => {
        try {
            const result = await procurationControl.saveEvent(req.body);

            io.emit('updateDocuments', '')
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/upload', upload.single('file'), async (req, res) => {
        try {
            const { documentId, userId, newDeadline } = req.body;
            const fileName = req.file ? req.file.filename : null;
            if (!fileName) {
                return res.status(400).json({ success: false, message: 'Arquivo não enviado.' });
            }
            // Salva evento no banco
            await procurationControl.saveEvent({
                documentId,
                userId,
                newDeadline,
                fileName
            });
            io.emit('updateDocuments', '')
            res.status(200).json({ success: true, message: 'Arquivo enviado e evento salvo com sucesso!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao salvar evento.', error });
        }
    });

    router.post('/removeAttachment', async (req, res) => {
        try {
            const { historyId, fileName } = req.body;
            await procurationControl.removeAttachment({ historyId, fileName });
            res.status(200).json({ success: true, message: 'Anexo removido com sucesso!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao remover anexo.', error });
        }
    });

    router.post('/updateTitle', async (req, res) => {
        try {
            await procurationControl.updateTitle(req.body);
            res.status(200).json({ success: true, message: 'Nome atualizado com sucesso!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao atualizar nome.', error });
        }
    });

    router.post('/removeDoc', async (req, res) => {
        try {
            await procurationControl.removeDoc(req.body);
            res.status(200).json({ success: true, message: 'Documento removido com sucesso!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao remover documento.', error });
        }
    });

    return router;
};