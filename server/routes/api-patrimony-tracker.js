const express = require('express');
const router = express.Router();

module.exports = (io) => {
    const patrimonyController = require('../controllers/patrimony-tracker')(io);

    // Rotas para gerenciamento de itens
    router.get('/items', patrimonyController.getItems);
    router.get('/items/export', patrimonyController.exportItems);
    router.get('/items/:id', patrimonyController.getItemById);
    router.post('/items', patrimonyController.createItem);
    router.put('/items/:id', patrimonyController.updateItem);

    // Rota para obter opções para campos de formulário (localizações, estados, funcionários)
    router.get('/options', patrimonyController.getOptions);

    // Rotas para ações específicas sobre itens
    router.post('/items/:id/assign', patrimonyController.assignItem);
    router.post('/items/:id/return', patrimonyController.returnItem);
    router.post('/items/:id/maintenance', patrimonyController.markAsMaintenance);
    router.post('/items/:id/return-from-maintenance', patrimonyController.returnFromMaintenance);
    router.post('/items/:id/damaged', patrimonyController.markAsDamaged);

    // Rotas para gerenciamento de Localizações
    router.get('/locations', patrimonyController.getLocations);
    router.get('/locations/:id', patrimonyController.getLocationById);
    router.post('/locations', patrimonyController.createLocation);
    router.put('/locations/:id', patrimonyController.updateLocation);
    router.delete('/locations/:id', patrimonyController.deleteLocation);

    // Rotas para gerenciamento de Categorias
    router.get('/categories', patrimonyController.getCategories);
    router.get('/categories/:id', patrimonyController.getCategoryById);
    router.post('/categories', patrimonyController.createCategory);
    router.put('/categories/:id', patrimonyController.updateCategory);
    router.delete('/categories/:id', patrimonyController.deleteCategory);

    return router;
}; 