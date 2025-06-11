const { exec } = require('child_process');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const speakUpPortal = {

    getOffers: async function () {
        const result = executeQuerySQL(`
            SELECT
                DATEPART(MONTH, prf.Data_Proposta) AS 'mes',
                SUM(CASE WHEN prf.Situacao = 2 THEN 1 ELSE 0 END) AS 'aprovadas',
                SUM(CASE WHEN prf.Situacao = 3 THEN 1 ELSE 0 END) AS 'reprovadas',
                SUM(CASE WHEN prf.Situacao NOT IN (2, 3) THEN 1 ELSE 0 END) AS 'pendentes',
                CASE pfc.Tipo_Carga 
                    WHEN 1 THEN 'AIR' 
                    WHEN 3 THEN 'FCL' 
                    WHEN 4 THEN 'LCL' 
                END AS 'tipo'
            FROM 
                mov_Proposta_Frete prf
            LEFT OUTER JOIN
                mov_Proposta_Frete_Carga pfc ON pfc.IdProposta_Frete = prf.IdProposta_Frete
            LEFT OUTER JOIN
                mov_Oferta_Frete oft ON oft.IdProposta_Frete = prf.IdProposta_Frete
            WHERE 
                DATEPART(YEAR, prf.Data_Proposta) = 2025
                AND pfc.Tipo_Carga IN (1, 3, 4)
                AND oft.Tipo_Operacao = 2
            GROUP BY 
                DATEPART(MONTH, prf.Data_Proposta),
                pfc.Tipo_Carga
            ORDER BY 
                mes;`);

        return result;
    },
    saveOccurrence: async function (req) {

        const details = req.body

        const occurrence = await executeQuery(`
            INSERT INTO speakup (create_date, occurrence_date, description, collaborator_id) VALUES (NOW(), ?, ?, ?)`,
            [details.date, details.description, details.collabId]
        );

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await executeQuery(`
            INSERT INTO speakup_attachments (id_speakup, file, create_date) VALUES (?, ?, NOW())`,
            [occurrence.insertId, file.filename]); // ou file.path, se preferir salvar o caminho completo
            }
        }
        return true;
    },
    getOccurrences: async function (userId) {
        const result = await executeQuery(`
            SELECT
                sp.id,
                sp.create_date,
                sp.occurrence_date,
                sp.description,
                st.description AS status
            FROM speakup sp
                LEFT OUTER JOIN speakup_status st ON st.id = sp.status
            WHERE sp.collaborator_id = ${userId}`);
        return result;
    },
    getOccurrencesADM: async function () {
        const result = await executeQuery(`
            SELECT
                sp.id,
                sp.create_date,
                sp.occurrence_date,
                sp.description,
                st.description AS status
            FROM speakup sp
                LEFT OUTER JOIN speakup_status st ON st.id = sp.status`);
        return result;
    },
    getComments: async function (id) {
        const result = await executeQuery(`
            SELECT
                sc.comment,
                sc.collaborator_id,
                sc.create_date,
                st.description,
                sc.screen
            FROM speakup_comments sc
                LEFT OUTER JOIN speakup_status st ON st.id = sc.currentStatus
            WHERE sc.speakup_id = ${id}`);
        return result;
    },
    saveComment: async function (details) {
        const currentStatus = await executeQuery(`
            SELECT
                status,
                collaborator_id
            FROM speakup
            WHERE id = ${details.id}`);

        let screen = ''
        if (currentStatus[0].collaborator_id == details.collabId) {
            screen = 'main'
        } else {
            screen = 'adm'
        }

        await executeQuery(`
                INSERT INTO speakup_comments (speakup_id, comment, currentStatus, collaborator_id, screen, create_date) VALUES (?, ?, ?, ?, ?, NOW())`,
            [details.id, details.comment, currentStatus[0].status, details.collabId, screen]
        );
        return true;
    },
    getDetails: async function (id) {
        const result = await executeQuery(`
                SELECT
                    sp.occurrence_date,
                    sp.description,
                    st.id AS 'id_status',
                    st.description AS 'status'
                FROM speakup sp
                    LEFT OUTER JOIN speakup_status st ON st.id = sp.status
                WHERE sp.id = ${id}`);
        return result;
    },
    getAttachments: async function (id) {

        const result = await executeQuery(`
            SELECT
                *
            FROM speakup_attachments
            WHERE id_speakup = ${id}`);
        return result;
    },
    updateStatus: async function (data) {

        const result = await executeQuery(`
            UPDATE speakup SET status = '${data.status}' WHERE (id = '${data.id}');`);
        return result;
    },
    getStatus: async function () {

        const result = await executeQuery(`
            SELECT
                *
            FROM speakup_status`);
        return result;
    },
};

module.exports = {
    speakUpPortal,
};
