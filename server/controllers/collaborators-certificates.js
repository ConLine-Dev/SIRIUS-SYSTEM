const { executeQuery } = require('../connect/mysql');

const CollaboratorsByCertificates = {
    // Gerenciamento de Certificados

    // Lista todos os certificados
    getAllCertificate: async function () {
        const result = await executeQuery(`SELECT * FROM certificates`);
        return result;
    },
    
    // Cria um novo certificado
    createCertificate: async function (name) {
        const result = await executeQuery(`INSERT INTO certificates (name) VALUES (?)`, [name]);
        return result;
    },

    // Remove um certificado
    removeCertificate: async function (id) {
        const result = await executeQuery(`DELETE FROM certificates WHERE id = ?`, [id]);
        return result;
    },

    // Vinculação de Certificados aos Colaboradores

    // Lista todos os colaboradores com seus certificados
    getCollaboratorsWithCertificates: async function() {
        const query = `
            SELECT 
                cc.id,
                c.id AS collaborator_id,
                cert.name AS certificate_name, 
                cc.reason, 
                cc.installed,
                c.id_headcargo,
                CONCAT(c.name, ' ', c.family_name) as ColabFullName 
            FROM collaborators c
            JOIN collaborators_certificates cc ON cc.collaborator_id = c.id
            JOIN certificates cert ON cc.certificate_id = cert.id
        `;
        const result = await executeQuery(query);
        return result;
    },
    getCollaboratorsWithCertificatesById: async function(id) {
        const query = `
            SELECT 
                cc.id,
                c.id AS collaborator_id,
                cert.id as certificate_id,
                cert.name AS certificate_name, 
                cc.reason, 
                cc.installed,
                c.id_headcargo,
                CONCAT(c.name, ' ', c.family_name) as ColabFullName 
            FROM collaborators c
            JOIN collaborators_certificates cc ON cc.collaborator_id = c.id
            JOIN certificates cert ON cc.certificate_id = cert.id
            WHERE cc.id = ${id}
        `;
        const result = await executeQuery(query);
        return result[0];
    },

    // Cria um novo vínculo de certificado a colaborador
    createCollaboratorCertificate: async function (collaborator_id, certificate_id, reason) {
        const query = `
            INSERT INTO collaborators_certificates 
            (collaborator_id, certificate_id, reason) 
            VALUES (?, ?, ?)
        `;
        const result = await executeQuery(query, [collaborator_id, certificate_id, reason]);
        return result;
    },

    // Atualiza um vínculo de certificado a colaborador
    updateCollaboratorCertificate: async function (id, collaborator_id, certificate_id, reason) {
        const query = `
            UPDATE collaborators_certificates 
            SET collaborator_id = ?, certificate_id = ?, reason = ?
            WHERE id = ?
        `;
        const result = await executeQuery(query, [collaborator_id, certificate_id, reason, id]);
        return result;
    },

    // Remove um vínculo de certificado a colaborador
    removeCollaboratorCertificate: async function (id) {
        const query = `DELETE FROM collaborators_certificates WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result;
    }
};

module.exports = {
    CollaboratorsByCertificates,
};
