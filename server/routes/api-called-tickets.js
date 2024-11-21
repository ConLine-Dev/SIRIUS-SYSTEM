const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require("path");
const fs = require('fs');
const { tickets } = require('../controllers/called-tickets');


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
    console.log(filePath)

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


module.exports = router;