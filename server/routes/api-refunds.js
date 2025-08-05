const express = require('express');
const router = express.Router();
const { refunds } = require('../controllers/refunds.js');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configuração do multer para salvar em uploads/refunds-attachments
const uploadDir = path.join(__dirname, '../../uploads/refunds-attachments');
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

module.exports = function (io) {

    router.get('/getCategories', async (req, res, next) => {

        try {
            const result = await refunds.getCategories();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getSubcategories', async (req, res, next) => {

        try {
            const result = await refunds.getSubcategories(req.body.categoryId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getRefunds', async (req, res, next) => {

        try {
            const result = await refunds.getRefunds(req.body.collabId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/getRefundsADM', async (req, res, next) => {

        try {
            const result = await refunds.getRefundsADM();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getDetails', async (req, res, next) => {

        try {
            const result = await refunds.getDetails(req.body.refundId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getFromTitle', async (req, res, next) => {

        try {
            const result = await refunds.getFromTitle(req.body.refundId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getToPay', async (req, res, next) => {

        try {
            const result = await refunds.getToPay(req.body.titleId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getAttachments', async (req, res, next) => {

        try {
            const result = await refunds.getAttachments(req.body.refundId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/approveRefund', async (req, res, next) => {

        try {
            const result = await refunds.approveRefund(req.body);
            io.emit('updateRefunds', '')
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/getKMValue', async (req, res, next) => {

        try {
            const result = await refunds.getKMValue();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/updateKMValue', async (req, res, next) => {

        try {
            const result = await refunds.updateKMValue(req.body.value);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/upload', upload.array('files[]'), async (req, res, next) => {

        try {
            const result = await refunds.upload(req);
            io.emit('updateRefunds', '')
            res.status(200).json(result)
        } catch (error) {
            console.log(error);
            res.status(404).json('Erro')
        }
    });

    router.post('/savePayment', upload.single('file'), async (req, res, next) => {

        try {
            const result = await refunds.savePayment(req);
            io.emit('updateRefunds', '')
            res.status(200).json(result)
        } catch (error) {
            console.log(error);
            res.status(404).json('Erro')
        }
    });

    return router;
};