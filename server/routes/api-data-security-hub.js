const express = require('express');
const router = express.Router();
const { dataSecurityHub } = require('../controllers/data-security-hub.js');

module.exports = function(io) {

    // Rota para listar todos os backups
    router.get('/backups', async (req, res) => {
        try {
            const backups = await dataSecurityHub.listBackups();
            res.json(backups);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch backups' });
        }
    });

    // Rota para obter detalhes de um backup específico
    router.get('/backups/:id', async (req, res) => {
        try {
            const backup = await dataSecurityHub.getBackupDetails(req.params.id);
            res.json(backup);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch backup details' });
        }
    });

    // Rota para criar um novo backup
    router.post('/backups', async (req, res) => {
        try {
            const backupData = req.body;
            const newBackup = await dataSecurityHub.createBackup(backupData);
            res.status(201).json(newBackup);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create backup' });
        }
    });

    // Rota para deletar um backup específico
    router.delete('/backups/:id', async (req, res) => {
        try {
            await dataSecurityHub.deleteBackup(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete backup' });
        }
    });

    // Rota para listar todos os destinos de backup
    router.get('/destinations', async (req, res) => {
        try {
            const destinations = await dataSecurityHub.listDestinations();
            res.json(destinations);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch destinations' });
        }
    });

    return router;
};
