const express = require('express');
const router = express.Router();
const freightTariffsController = require('../controllers/freight-tariffs');

module.exports = function(io) {
    // Rotas de Configurações (não precisam de socket em tempo real, mantidas como estão)
    router.get('/locations', freightTariffsController.getLocations);
    router.post('/locations', freightTariffsController.createLocation);
    router.put('/locations/:id', freightTariffsController.updateLocation);
    router.delete('/locations/:id', freightTariffsController.deleteLocation);

    router.get('/agents', freightTariffsController.getAgents);
    router.post('/agents', freightTariffsController.createAgent);
    router.put('/agents/:id', freightTariffsController.updateAgent);
    router.delete('/agents/:id', freightTariffsController.deleteAgent);

    router.get('/modalities', freightTariffsController.getModalities);
    router.post('/modalities', freightTariffsController.createModality);
    router.put('/modalities/:id', freightTariffsController.updateModality);
    router.delete('/modalities/:id', freightTariffsController.deleteModality);

    router.get('/container-types', freightTariffsController.getContainerTypes);
    router.post('/container-types', freightTariffsController.createContainerType);
    router.put('/container-types/:id', freightTariffsController.updateContainerType);
    router.delete('/container-types/:id', freightTariffsController.deleteContainerType);

    // Rota para metadados de formulários (não precisa de socket)
    router.get('/meta/form-data', freightTariffsController.getFormData);

    // Rotas de Tarifas (precisam de socket para emitir eventos)
    router.get('/tariffs', freightTariffsController.getTariffs);
    router.get('/tariffs/datatable', freightTariffsController.getTariffsDataTable);
    router.get('/tariffs/commercial', freightTariffsController.getCommercialTariffs);
    
    // Rotas de Administração (devem vir ANTES das rotas com parâmetros dinâmicos)
    router.get('/tariffs/statistics', freightTariffsController.getTariffStatistics);
    router.delete('/tariffs/clear-all', (req, res) => freightTariffsController.clearAllTariffs(req, res, io));
    
    // Rota para buscar rotas populares
    router.get('/popular-routes', freightTariffsController.getPopularRoutes);
    router.get('/market-analysis', freightTariffsController.getMarketAnalysis);
    
    // Rotas com parâmetros dinâmicos (devem vir DEPOIS das rotas específicas)
    router.get('/tariffs/:id', freightTariffsController.getTariffById);

    // Rotas para Excel Import/Export
    router.get('/excel/template', freightTariffsController.downloadExcelTemplate);
    router.post('/excel/import', freightTariffsController.processExcelImport);
    router.post('/excel/validate-row', freightTariffsController.validateExcelRow);
    router.post('/excel/confirm-import', freightTariffsController.confirmExcelImport);

    // Passa a instância 'io' para as funções do controlador que irão emitir eventos.
    router.post('/tariffs', (req, res) => freightTariffsController.createTariff(req, res, io));
    router.put('/tariffs/:id', (req, res) => freightTariffsController.updateTariff(req, res, io));
    router.delete('/tariffs/:id', (req, res) => freightTariffsController.deleteTariff(req, res, io));

    return router;
}; 