const { executeQuery } = require('../connect/mysql');
// Importa a função sendEmail do arquivo emailService.js
const { sendEmail } = require('../support/send-email');

const externalSystems = {
    getServices: async function () {
        let result = await executeQuery(`
            SELECT *
            FROM external_systems`);

        return result;
    },

    getRecords: async function () {
        let result = await executeQuery(`
            SELECT esr.id, esm.name, esr.description, esr.date_start, esr.date_end
            FROM external_systems_records esr
            LEFT OUTER JOIN external_systems esm on esm.id = esr.id_system`);

        return result;
    },

    saveRecord: async function (answer) {

        if (!answer.endDate) {
            answer.endDate = null;
        }
        await executeQuery(`
            INSERT INTO external_systems_records (id_system, description, date_start, date_end, id_collaborator) VALUES (?, ?, ?, ?, ?)`,
            [answer.service, answer.description, answer.startDate, answer.endDate, answer.collabId]);

        return true;
    },

    getById: async function (id) {

        let result = await executeQuery(`
            SELECT esr.id, esm.name, esr.description, esr.date_start, esr.date_end
            FROM external_systems_records esr
            LEFT OUTER JOIN external_systems esm on esm.id = esr.id_system
            WHERE esr.id = ${id}`);

        return result;
    },

    updateServiceRecord: async function (lineData) {
        
        await executeQuery(`
            UPDATE external_systems_records
            SET description = '${lineData.description}',
            date_start = '${lineData.startDate}',
            date_end = '${lineData.endDate}'
            WHERE id = ${lineData.lineId}`);

        return true;
    },

}

module.exports = {
    externalSystems,
};