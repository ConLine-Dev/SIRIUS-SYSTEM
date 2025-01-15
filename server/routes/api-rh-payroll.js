const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rhPayroll = require('../controllers/rh-payroll');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../storageService/administration/rh-payroll/discounts'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

module.exports = function (io) {
    // Rota para obter categorias de desconto
    router.get('/categoryDiscount', async (req, res) => {
        try {
            const result = await rhPayroll.categoryDiscount();
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            res.status(500).json({ error: 'Erro ao buscar categorias de desconto' });
        }
    });

    // Rota para criar desconto individual
    router.post('/discount/create', upload.single('attachment'), async (req, res) => {
        try {
            const data = req.body;
            if (req.file) {
                data.attachment_path = `${req.file.filename}`;
            }
            
            const result = await rhPayroll.createDiscount(data);
            io.emit('updateDiscounts');
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao criar desconto:', error);
            res.status(500).json({ error: 'Erro ao criar desconto' });
        }
    });

    // Rota para criar desconto em lote
    router.post('/discount/batch/create', async (req, res) => {
        try {
            const result = await rhPayroll.createBatchDiscount(req.body);
            io.emit('updateDiscounts');
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao criar desconto em lote:', error);
            res.status(500).json({ error: 'Erro ao criar desconto em lote' });
        }
    });

    // Rota para buscar descontos pendentes
    router.get('/discount/pending', async (req, res) => {
        try {
            const result = await rhPayroll.getPendingDiscounts();
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Erro ao buscar descontos pendentes:', error);
            res.status(500).json({ error: 'Erro ao buscar descontos pendentes' });
        }
    });

    // Rota para processar descontos
    router.post('/discount/process', async (req, res) => {
        try {
            const data = {
                ...req.body
            };
            const result = await rhPayroll.processDiscounts(data);
            io.emit('updateDiscounts');
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao processar descontos:', error);
            res.status(500).json({ error: 'Erro ao processar descontos' });
        }
    });

    // Rota para upload de arquivo
    router.post('/upload', upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                throw new Error('Nenhum arquivo enviado');
            }
            
            const result = await rhPayroll.handleFileUpload(req.file);
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro no upload do arquivo:', error);
            res.status(500).json({ error: 'Erro no upload do arquivo' });
        }
    });

    // Rota para listar todos os descontos
    router.get('/discount/list', async (req, res) => {
        try {
            const result = await rhPayroll.getAllDiscounts();
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao listar descontos:', error);
            res.status(500).json({ error: 'Erro ao listar descontos' });
        }
    });

    // Rota para cancelar desconto
    router.post('/discount/cancel', async (req, res) => {
        try {
            const result = await rhPayroll.cancelDiscount(req.body);
            io.emit('updateDiscounts');
            res.status(200).json(result);
        } catch (error) {
            console.error('Erro ao cancelar desconto:', error);
            res.status(500).json({ error: 'Erro ao cancelar desconto' });
        }
    });


    router.get('/download-file/:filename', (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../storageService/administration/rh-payroll/discounts', filename);
        res.download(filePath, (err) => {
            if (err) {
                res.status(500).send('Erro ao baixar o arquivo.');
            }
        });
    });
    
    router.get('/view-file/:filename', (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../storageService/administration/rh-payroll/discounts', filename);
    
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

    return router;
};