const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
// Importa a função sendEmail do arquivo emailService.js
const { sendEmail } = require('../support/send-email');

const customerNegotiations = {
    getServices: async function () {
        let result = await executeQuery(`
            SELECT *
            FROM customer_negotiations`);

        return result;
    },
    getCustomers: async function () {
        let result = await executeQuerySQL(`
            select pss.IdPessoa, pss.Nome
            from cad_Cliente cli
            left outer join cad_Pessoa pss on pss.IdPessoa = cli.IdPessoa
            where pss.IdPais = 22
            and (cli.Tipo_Cliente = 1 or cli.Tipo_Cliente = 2)
            order by pss.Nome`);

        return result;
    },
    saveRecord: async function (answer) {

        let customerType = await executeQuerySQL(`
            select cli.Tipo_Cliente, pss.Nome
            from cad_Cliente cli
            left outer join cad_Pessoa pss on pss.IdPessoa = cli.IdPessoa
            where cli.IdPessoa = ${answer.customer}`)

        await executeQuery(`
            INSERT INTO customer_negotiations_records (id_type, id_customer, date, description, id_collaborator, customer_type) VALUES (?, ?, ?, ?, ?, ?)`,
            [answer.type, answer.customer, answer.date, answer.description, answer.collabId, customerType[0].Tipo_Cliente]);

        let collab = await executeQuery(`
            SELECT *
            FROM collaborators
            WHERE id = ${answer.collabId}`);
        let CTypeInfo = 'Cliente';
        if (customerType[0].Tipo_Cliente == 1) {
            CTypeInfo = 'Prospect'
        }

        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        const horas = String(hoje.getHours()).padStart(2, '0');
        const minutos = String(hoje.getMinutes()).padStart(2, '0');

        const date = `${dia}-${mes}-${ano} - ${horas}:${minutos}`;

        let userBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Nova solicitação!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Viemos te avisar que um novo pedido foi aberto para aprovação! 🥳</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Aqui estão os detalhes do que foi enviado, só para deixarmos registrado:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Solicitante:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${collab[0].name} ${collab[0].family_name}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Cliente Vinculado:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${customerType[0].Nome}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Tipo do Cliente:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${CTypeInfo}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(answer.description)}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Data:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${date}</td>
                    </tr>
                    </table>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`

        sendEmail(['lucas@conlinebr.com.br'], '[Sirius System] Um novo pedido foi recebido! 🫡', userBody);
        return true;
    },
    getRecords: async function () {

        let records = [];

        let result = await executeQuery(`
            SELECT cnr.id, cn.name, cnr.date, cnr.description, cnr.id_customer, cnr.status
            FROM customer_negotiations_records cnr
            LEFT OUTER JOIN customer_negotiations cn on cn.id = cnr.id_type`);

        for (let index = 0; index < result.length; index++) {
            let customer = await executeQuerySQL(`
                SELECT pss.Nome
                FROM cad_pessoa pss
                WHERE pss.IdPessoa = ${result[index].id_customer}`);

            let customerName = 0;

            if (customer.length > 0){
                customerName = customer[0].Nome;
            }
            records.push({
                ...result[index],
                customerName: customerName
            });
        }

        return records;
    },
    getById: async function (id) {

        let records = [];

        let result = await executeQuery(`
            SELECT cnr.id, cn.name, cnr.date, cnr.description, cnr.id_customer,
            cl.name as 'collabName', cl.family_name as 'collabFName', cnr.status
            FROM customer_negotiations_records cnr
            LEFT OUTER JOIN customer_negotiations cn on cn.id = cnr.id_type
            LEFT OUTER JOIN collaborators cl on cl.id = cnr.id_collaborator
            WHERE cnr.id = ${id}`);

        let customer = await executeQuerySQL(`
            SELECT pss.Nome
            FROM cad_pessoa pss
            WHERE pss.IdPessoa = ${result[0].id_customer}`);

        let customerName = 0;

        if (customer.length > 0){
            customerName = customer[0].Nome;
        }
        records.push({
            ...result[0],
            customerName: customerName
        });

        return records;
    },
    getReplies: async function (id) {

        let result = await executeQuery(`
            SELECT crp.id, crp.id_negotiation, crp.reply, cl.name, cl.family_name
            FROM customer_negotiations_replies crp
            LEFT OUTER JOIN collaborators cl on cl.id = crp.id_collaborator
            WHERE id_negotiation = ${id}`);

        return result;
    },
    update: async function (details) {

        let result = await executeQuery(`
            UPDATE customer_negotiations_records
            SET status = '${details.status}'
            WHERE id = ${details.id}`);

        return result;
    },
    addReply: async function (reply) {

        let result = await executeQuery(`
            INSERT INTO customer_negotiations_replies (id_negotiation, reply, id_collaborator)
            VALUES (${reply.id}, '${reply.description}', ${reply.collabId})`);

        return result;
    },
}

module.exports = {
    customerNegotiations,
};