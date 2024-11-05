const express = require('express');
const router = express.Router();
const { pricingMain } = require('../controllers/pricing-main.js');

module.exports = function(io) {

    // Rota para listar todos os backups
    router.get('/backups', async (req, res) => {
        try {
            const backups = await pricingMain.listBackups();
            res.json(backups);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch backups' });
        }
    });

    return router;
};
