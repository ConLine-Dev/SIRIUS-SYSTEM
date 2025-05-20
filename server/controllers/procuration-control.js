const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const { sendEmail } = require('../support/send-email');
const fs = require('fs');
const path = require('path');

const procurationControl = {

    procurationData: async function () {

        const result = await executeQuery(`
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
                    ph.description,
                    cl.name,
                    cl.family_name,
                    cl.email_business
                FROM procuration_control pc
                LEFT JOIN latest_history ph ON ph.id_procuration = pc.id AND ph.rn = 1
                LEFT JOIN collaborators cl ON cl.id = ph.id_responsible;`);

        return result;
    },

    expired: async function (value) {

        let devBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Atualize a validade do documento!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Um dos documentos cadastrados está vencido.</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Aqui estão os detalhes do que foi inserido no sistema, já para agilizar seu trabalho:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Documento:</td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${value.title}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Último Responsável:</td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${value.name} ${value.family_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição:</td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(value.description)}</td>
                        </tr>
                    </table>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`

        await sendEmail(value.email_business, '[Sirius System] Um documento está vencido!', devBody);
        return true;
    },

    futureExpired: async function (value) {

        let devBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Atualize a validade do documento!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Um dos documentos cadastrados está quase vencendo.</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Aqui estão os detalhes do que foi inserido no sistema, já para agilizar seu trabalho:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Documento:</td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${value.title}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Último Responsável:</td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${value.name} ${value.family_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição:</td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(value.description)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Data de Validade:</td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(value.deadline.toLocaleDateString('pt-BR'))}</td>
                        </tr>
                    </table>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`

        await sendEmail(value.email_business, '[Sirius System] Um documento vai vencer em breve!', devBody);
        return true;
    },

    documentHistory: async function (documentId) {

        const result = await executeQuery(`
            SELECT
                ph.id,
                ph.created_time,
                ph.file,
                ph.description,
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
            'INSERT INTO procuration_history (id_procuration, created_time, id_responsible, file, description) VALUES (?, ?, ?, ?, ?)',
            [eventData.documentId, dateTime, eventData.userId, eventData.fileName, eventData.newDescription]
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

    removeAttachment: async function ({ historyId, fileName }) {
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

    updateTitle: async function ({ id, title }) {
        await executeQuery(
            'UPDATE procuration_control SET name = ? WHERE id = ?',
            [title, id]
        );
        return true;
    },

    removeDoc: async function ({ id }) {
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

    createDocument: async function (details) {

        const result = await executeQuery(
            'INSERT INTO procuration_control (name, deadline, description) VALUES (?, ?, ?)',
            [details.newTitle, details.newDeadline, details.newDetails]
        );

        return result.insertId;
    },
};

let dailySend = setInterval(async () => {
    let data = await procurationControl.procurationData();

    let actualDate = new Date();
    let futureDate = new Date();
    futureDate.setDate(actualDate.getDate() + 10);

    for (let index = 0; index < data.length; index++) {
        let element = data[index];
        console.log(element);
        if (actualDate >= element.deadline) {
            procurationControl.expired(element);
        } else if (futureDate >= element.deadline) {
            procurationControl.futureExpired(element);
        }
    }
}, 12*60*60*1000)

module.exports = {
    procurationControl,
};