const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
// const { executeQuery } = require('../connect/mysql');


router.get('/:path(*)', async (req, res, next) => {
    const fullPath = req.params.path || '';
    const segments = fullPath.split('/').filter(Boolean);
    const isDirectory = fullPath.endsWith('/'); // Verifica se a URL termina com barra

    if (segments.length === 0) {
        res.status(404).send('Página não encontrada');
        return;
    }

    const fileName = isDirectory ? 'index' : segments.pop();
    const folderPath = path.join(...segments);

    let pagePath = path.join(__dirname, '../../', 'public/app', folderPath, `${fileName}.html`);


    console.log(pagePath, fs.existsSync(pagePath))

    if (fs.existsSync(pagePath)) {

        res.sendFile(pagePath);
    } else {
        res.status(404).send('Página não encontrada');
    }
});

module.exports = router;