const express = require('express');
const router = express.Router();
const { strategyHub } = require('../controllers/strategy-hub.js');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// // Configuração do multer para salvar em uploads/refunds-attachments
// const uploadDir = path.join(__dirname, '../../uploads/refunds-attachments');
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, uploadDir);
//     },
//     filename: function (req, file, cb) {
//         // Garante nome único
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const ext = path.extname(file.originalname);
//         cb(null, file.fieldname + '-' + uniqueSuffix + ext);
//     }
// });
// const upload = multer({ storage: storage });

module.exports = function (io) {

    router.get('/getCategories', async (req, res, next) => {

        try {
            const result = await strategyHub.getCategories();
            res.status(200).json(result)
        } catch (error) {

            res.status(404).json('Erro')
        }
    });

    return router;
};