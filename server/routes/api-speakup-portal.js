const express = require('express');
const router = express.Router();
const { speakUpPortal } = require('../controllers/speakup-portal.js');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configuração do multer para salvar em uploads/speakup-attachments
const uploadDir = path.join(__dirname, '../../uploads/speakup-attachments');
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

    router.get('/getOffers', async (req, res, next) => {
        try {
            const result = await speakUpPortal.getOffers();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/saveOccurrence', async (req, res, next) => {
        try {
            const result = await speakUpPortal.saveOccurrence(req.body);
            io.emit('updateOccurrences', '')
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/upload', upload.array('fileList'), async (req, res) => {

        try {
            const result = await speakUpPortal.saveOccurrence(req);
            io.emit('updateOccurrences', '')
            res.status(200).json(result);
        } catch (error) {
            console.log(error);
            res.status(404).json(error);
        }
    });

    router.post('/getOccurrences', async (req, res, next) => {

        try {
            const result = await speakUpPortal.getOccurrences(req.body.collabId);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getComments', async (req, res, next) => {

        try {
            const result = await speakUpPortal.getComments(req.body.id);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/saveComment', async (req, res, next) => {

        try {
            const result = await speakUpPortal.saveComment(req.body);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getDetails', async (req, res, next) => {

        try {
            const result = await speakUpPortal.getDetails(req.body.id);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/getAttachments', async (req, res, next) => {

        try {
            const result = await speakUpPortal.getAttachments(req.body.id);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.post('/updateStatus', async (req, res, next) => {

        try {
            const result = await speakUpPortal.updateStatus(req.body);
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    router.get('/getStatus', async (req, res, next) => {

        try {
            const result = await speakUpPortal.getStatus();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
};
