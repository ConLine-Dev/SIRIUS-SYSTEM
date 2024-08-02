const express = require('express');
const router = express.Router();

const { collaboratorsController } = require('../controllers/collaborators-controller');




module.exports = function(io) {
    
    router.get('/collaborators', async (req, res, next) => {
        try {
            const collaborators = await collaboratorsController.getAllCollaborators();
            res.status(200).json(collaborators);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar colaboradores' });
        }
    });

    router.get('/collaborators/:id', async (req, res, next) => {
        try {
            const id = req.params.id;
            const collaborator = await collaboratorsController.getCollaboratorById(id);
            if (collaborator) {
                res.status(200).json(collaborator);
            } else {
                res.status(404).json({ message: 'Colaborador não encontrado' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar colaborador' });
        }
    });

    return router;

};
