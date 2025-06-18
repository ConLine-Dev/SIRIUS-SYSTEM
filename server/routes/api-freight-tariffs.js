const express = require('express');
const freightTariffsController = require('../controllers/freight-tariffs');

module.exports = function(io) {
    const router = express.Router();

    // --- Rotas de Gerenciamento de Tarifas ---
    router.get('/tariffs', freightTariffsController.getTariffs);
    router.get('/tariffs/:id', freightTariffsController.getTariffById);
    router.post('/tariffs', freightTariffsController.createTariff);
    router.put('/tariffs/:id', freightTariffsController.updateTariff);
    router.delete('/tariffs/:id', freightTariffsController.deleteTariff);

    // --- Rotas de Gerenciamento de Localizações ---
    router.get('/locations', freightTariffsController.getLocations);
    router.post('/locations', freightTariffsController.createLocation);
    router.put('/locations/:id', freightTariffsController.updateLocation);
    router.delete('/locations/:id', freightTariffsController.deleteLocation);

    // --- Rotas de Gerenciamento de Agentes ---
    router.get('/agents', freightTariffsController.getAgents);
    router.post('/agents', freightTariffsController.createAgent);
    router.put('/agents/:id', freightTariffsController.updateAgent);
    router.delete('/agents/:id', freightTariffsController.deleteAgent);

    // --- Rotas de Gerenciamento de Modalidades ---
    router.get('/modalities', freightTariffsController.getModalities);
    router.post('/modalities', freightTariffsController.createModality);
    router.put('/modalities/:id', freightTariffsController.updateModality);
    router.delete('/modalities/:id', freightTariffsController.deleteModality);

    // --- Rotas de Gerenciamento de Tipos de Container ---
    router.get('/container-types', freightTariffsController.getContainerTypes);
    router.post('/container-types', freightTariffsController.createContainerType);
    router.put('/container-types/:id', freightTariffsController.updateContainerType);
    router.delete('/container-types/:id', freightTariffsController.deleteContainerType);

    // --- Rota de Metadados ---
    // Rota otimizada para buscar todos os dados necessários para os formulários
    router.get('/meta/form-data', freightTariffsController.getFormData);

    return router;
}; 