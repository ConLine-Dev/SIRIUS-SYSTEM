const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { processQueryFilter } = require('../controllers/process-query-filter'); // Importa o módulo de gerenciamento

module.exports = function(io) {
    // Rota para obter os dados da tabela com filtros
    router.post('/getData', async (req, res, next) => {
        const form = req.body;
        try {
            const result = await processQueryFilter.getData(form);
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            res.status(404).json(error);
        }
    });

    // Rota para obter os dados para os filtros
    router.get('/getFilterOptions', async (req, res, next) => {
        try {
            const result = await processQueryFilter.getFilterOptions();
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            res.status(404).json(error);
        }
    });

    // Rota para obter dados de distribuição de documentos
    router.post('/getDocumentosDistribuicao', async (req, res, next) => {
        try {
            const result = await processQueryFilter.getDocumentosDistribuicao();
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            res.status(404).json(error);
        }
    });

    // Retorna o router configurado
    return router;
}; 