const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const procurationControl = {

    procurationData: async function() {

        const result = executeQuery(`
            WITH latest_history AS (
                SELECT
                    ph.*, 
                    ROW_NUMBER() OVER (PARTITION BY ph.id_procuration ORDER BY ph.created_time DESC) AS rn
                FROM procuration_history ph
            )
                SELECT
                    pc.id,
                    pc.name AS title, 
                    pc.deadline, 
                    pc.created_at, 
                    pc.updated_at, 
                    cl.name, 
                    cl.family_name
                FROM procuration_control pc
                LEFT JOIN latest_history ph ON ph.id_procuration = pc.id AND ph.rn = 1
                LEFT JOIN collaborators cl ON cl.id = ph.id_responsible;`);

        return result;
    },

    documentHistory: async function(documentId) {

        const result = executeQuery(`
            SELECT
                ph.id,
                ph.created_time,
                ph.file,
                cl.name,
                cl.family_name,
                cl.id_headcargo
            FROM procuration_history ph
            LEFT OUTER JOIN collaborators cl ON cl.id = ph.id_responsible
            WHERE ph.id_procuration = ${documentId}`);

        return result;
    },

    saveEvent: async function (eventData) {

        const now = new Date();

        const pad = num => String(num).padStart(2, '0');
        const formattedDate = [
            now.getFullYear(),
            pad(now.getMonth() + 1),
            pad(now.getDate())
        ].join('-');

        const formattedHour = [
            pad(now.getHours()),
            pad(now.getMinutes()),
            pad(now.getSeconds())
        ].join(':');

        let dateTime = `${formattedDate} ${formattedHour}`

        await executeQuery(
            'INSERT INTO procuration_history (id_procuration, created_time, id_responsible, file) VALUES (?, ?, ?, ?)',
            [eventData.documentId, dateTime, eventData.userId, eventData.fileName]
        );

        await executeQuery(
            `UPDATE procuration_control
            SET deadline = '${eventData.newDeadline}',
                updated_at = NOW()
            WHERE id = ${eventData.documentId}`,
            []
        );

        return true;
    },

    removeAttachment: async function({ historyId, fileName }) {
        // Remove registro do banco
        await executeQuery(
            'DELETE FROM procuration_history WHERE id = ?',
            [historyId]
        );
        // Remove arquivo físico
        const filePath = path.join(__dirname, '../../uploads/procuration-control/anexos', fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return true;
    },

    updateTitle: async function({ id, title }) {
        await executeQuery(
            'UPDATE procuration_control SET name = ? WHERE id = ?',
            [title, id]
        );
        return true;
    },

    removeDoc: async function({ id }) {
        // Remove todos os históricos e arquivos relacionados
        const history = await executeQuery(
            'SELECT file FROM procuration_history WHERE id_procuration = ?',
            [id]
        );
        for (const h of history) {
            const filePath = path.join(__dirname, '../../uploads/procuration-control/anexos', h.file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await executeQuery('DELETE FROM procuration_history WHERE id_procuration = ?', [id]);
        await executeQuery('DELETE FROM procuration_control WHERE id = ?', [id]);
        return true;
    },

};

module.exports = {
    procurationControl,
};