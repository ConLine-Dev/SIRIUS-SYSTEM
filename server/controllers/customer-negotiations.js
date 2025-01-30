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
            select cli.Tipo_Cliente
            from cad_Cliente cli
            where cli.IdPessoa = ${answer.customer}`)

        await executeQuery(`
            INSERT INTO customer_negotiations_records (id_type, id_customer, date, description, id_collaborator, customer_type) VALUES (?, ?, ?, ?, ?, ?)`,
            [answer.type, answer.customer, answer.date, answer.description, answer.collabId, customerType[0].Tipo_Cliente]);

        return true;
    },
    getRecords: async function () {

        let records = [];

        let result = await executeQuery(`
            SELECT cnr.id, cn.name, cnr.date, cnr.description, cnr.id_customer
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
}

module.exports = {
    customerNegotiations,
};