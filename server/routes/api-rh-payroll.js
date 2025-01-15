const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const rhPayroll = require('../controllers/rh-payroll');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/discounts'));
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
                data.attachment_path = `/uploads/discounts/${req.file.filename}`;
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
            console.log(data)
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

    return router;
};