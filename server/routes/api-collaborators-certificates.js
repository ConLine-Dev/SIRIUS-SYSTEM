const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { CollaboratorsByCertificates } = require('../controllers/collaborators-certificates.js'); // Importa o módulo de gerenciamento

module.exports = function(io) {
    // CRUD para Certificados

    // Rota para listar todos os certificados
    router.get('/certificates', async (req, res) => {
        try {
            const result = await CollaboratorsByCertificates.getAllCertificate();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Rota para adicionar um novo certificado
    router.post('/certificates', async (req, res) => {
        const { name } = req.body;
        try {
            const result = await CollaboratorsByCertificates.createCertificate(name);
            res.status(201).json({ id: result.insertId, name });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Rota para excluir um certificado
    router.delete('/certificates/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await CollaboratorsByCertificates.removeCertificate(id);
            res.status(200).json({ message: 'Certificado excluído com sucesso' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // CRUD para Vinculação de Certificados aos Colaboradores

    // Rota para listar todos os colaboradores com seus certificados
    router.get('/collaborators-certificates', async (req, res) => {
        try {
            const result = await CollaboratorsByCertificates.getCollaboratorsWithCertificates();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

     // Rota para pegar um vínculo de certificado
     router.get('/collaborators-certificates-id/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await CollaboratorsByCertificates.getCollaboratorsWithCertificatesById(id);

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Rota para vincular um certificado a um colaborador
    router.post('/collaborators-certificates', async (req, res) => {
        const { collaborator_id, certificate_id, reason } = req.body;
        try {
            const result = await CollaboratorsByCertificates.createCollaboratorCertificate(collaborator_id, certificate_id, reason);
            io.emit('table_collaborators_certificates', '')
            res.status(201).json({ id: result.insertId, collaborator_id, certificate_id, reason });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Rota para atualizar um vínculo de certificado
    router.put('/collaborators-certificates/:id', async (req, res) => {
        const { id } = req.params;
        const { collaborator_id, certificate_id, reason } = req.body;
        try {
            await CollaboratorsByCertificates.updateCollaboratorCertificate(id, collaborator_id, certificate_id, reason);
            io.emit('table_collaborators_certificates', '')
            res.status(200).json({ message: 'Vínculo atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Rota para excluir um vínculo de certificado
    router.delete('/collaborators-certificates/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await CollaboratorsByCertificates.removeCollaboratorCertificate(id);
            io.emit('table_collaborators_certificates', '')
            res.status(200).json({ message: 'Vínculo excluído com sucesso' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
