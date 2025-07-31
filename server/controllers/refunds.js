const { exec } = require('child_process');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const { sendEmail } = require('../support/send-email');
const fs = require('fs');
const path = require('path');

const refunds = {

    getCategories: async function () {
        const result = await executeQuery(`
            SELECT *
            FROM refunds_categories`);
        return result;
    },

    getSubcategories: async function (categoryId) {
        const result = await executeQuery(`
            SELECT *
            FROM refunds_subcategories
            WHERE id_category = ${categoryId}`);
        return result;
    },

    getRefunds: async function (collabId) {
        const result = await executeQuery(`
            SELECT
                rf.id,
                rf.title_id,
                rt.title,
                rt.pix,
                rf.category_id,
                rc.description AS category,
                rf.subcategory_id,
                rs.description AS subcategory,
                rf.description,
                CASE rf.status
                    WHEN 1 THEN 'Em aberto'
                    WHEN 2 THEN 'Aprovado'
                    WHEN 3 THEN 'Pago'
                    END AS status,
                rf.create_date AS createDate
            FROM refunds rf
            LEFT OUTER JOIN refunds_title rt ON rt.id = rf.title_id
            LEFT OUTER JOIN refunds_categories rc ON rc.id = rf.category_id
            LEFT OUTER JOIN refunds_subcategories rs ON rs.id = rf.subcategory_id
            WHERE
                rf.collaborator_id = '${collabId}'`);
        return result;
    },

    getRefundsADM: async function () {
        const result = await executeQuery(`
            SELECT
                rf.id,
                rf.title_id,
                rt.title,
                rt.pix,
                rf.category_id,
                rc.description AS category,
                rf.subcategory_id,
                rs.description AS subcategory,
                rf.description,
                CASE rf.status
                    WHEN 1 THEN 'Em aberto'
                    WHEN 2 THEN 'Aprovado'
                    WHEN 3 THEN 'Pago'
                    END AS status,
                rf.create_date AS createDate
            FROM refunds rf
            LEFT OUTER JOIN refunds_title rt ON rt.id = rf.title_id
            LEFT OUTER JOIN refunds_categories rc ON rc.id = rf.category_id
            LEFT OUTER JOIN refunds_subcategories rs ON rs.id = rf.subcategory_id`);
        return result;
    },

    getDetails: async function (refundId) {

        const result = await executeQuery(`
            SELECT
                rf.id,
                rf.title_id,
                rt.title,
                rt.pix,
                rf.category_id,
                rc.description AS category,
                rf.subcategory_id,
                rs.description AS subcategory,
                rf.description,
                rf.value,
                cl.name,
                cl.family_name,
                rf.status AS status_id,
                CASE rf.status
                    WHEN 1 THEN 'Em aberto'
                    WHEN 2 THEN 'Aprovado'
                    WHEN 3 THEN 'Pago'
                    END AS status,
                rf.create_date AS createDate
            FROM refunds rf
            LEFT OUTER JOIN refunds_title rt ON rt.id = rf.title_id
            LEFT OUTER JOIN refunds_categories rc ON rc.id = rf.category_id
            LEFT OUTER JOIN refunds_subcategories rs ON rs.id = rf.subcategory_id
            LEFT OUTER JOIN collaborators cl ON cl.id = rf.collaborator_id
            WHERE
                rf.id = '${refundId}'`);
        return result;
    },

    getFromTitle: async function (filter) {

        const result = await executeQuery(`
            SELECT
                rf.id,
                rf.category_id,
                rc.description AS category,
                rf.subcategory_id,
                rs.description AS subcategory,
                rf.description,
                rf.value,
                CASE rf.status
                    WHEN 1 THEN 'Em aberto'
                    WHEN 2 THEN 'Aprovado'
                    WHEN 3 THEN 'Pago'
                    END AS status
            FROM refunds rf
            LEFT OUTER JOIN refunds_title rt ON rt.id = rf.title_id
            LEFT OUTER JOIN refunds_categories rc ON rc.id = rf.category_id
            LEFT OUTER JOIN refunds_subcategories rs ON rs.id = rf.subcategory_id
            WHERE
                rf.title_id = ${filter.titleId}
                AND rf.id NOT IN (${filter.id})`);
        return result;
    },

    getToPay: async function (titleId) {

        const result = await executeQuery(`
            SELECT
                rf.id,
                rt.title,
                rt.pix,
                cl.name,
                cl.family_name,
                rc.description AS category,
                rs.description AS subcategory,
                rf.description,
                rf.value
            FROM refunds rf
            LEFT OUTER JOIN refunds_title rt ON rt.id = rf.title_id
            LEFT OUTER JOIN refunds_categories rc ON rc.id = rf.category_id
            LEFT OUTER JOIN refunds_subcategories rs ON rs.id = rf.subcategory_id
            LEFT OUTER JOIN collaborators cl ON cl.id = rf.collaborator_id
            WHERE
                rf.title_id = ${titleId}
                AND rf.status = 2`);
        return result;
    },

    getAttachments: async function (id) {

        const result = await executeQuery(`
            SELECT
                *
            FROM refunds_attachments
            WHERE title_id = ${id}`);
        return result;
    },

    approveRefund: async function (data) {

        if (data.input1) {
            await executeQuery(`UPDATE refunds SET status = '2', value = '${data.input1}' WHERE (id = '${data.refundId}');`)
            this.updateNotification(data);
        }
        else {
            await executeQuery(`UPDATE refunds SET status = '2' WHERE (id = '${data.refundId}');`)
        }

        const titleId = await executeQuery(`
            SELECT title_id AS titleId
            FROM refunds
            WHERE id = ${data.refundId}`);

        const total = await executeQuery(`
            SELECT *
            FROM refunds rf
            WHERE rf.title_id = ${titleId[0].titleId}
                AND rf.status = 1`)

        if (total == 0) {
            this.releaseToPay(titleId[0].titleId);
        }

    },

    releaseToPay: async function (titleId) {
        const data = await executeQuery(`
            SELECT
                rt.id,
                rt.title,
                rt.pix,
                rc.description AS category,
                rs.description AS subcategory,
                rf.description,
                rf.value,
                cl.name,
                cl.family_name
            FROM refunds rf
            LEFT OUTER JOIN refunds_title rt ON rt.id = rf.title_id
            LEFT OUTER JOIN refunds_categories rc ON rc.id = rf.category_id
            LEFT OUTER JOIN refunds_subcategories rs ON rs.id = rf.subcategory_id
            LEFT OUTER JOIN collaborators cl ON cl.id = rf.collaborator_id
            WHERE
                rf.title_id = ${titleId}`);

        let tableBody = '';
        let totalValue = 0;

        for (let index = 0; index < data.length; index++) {
            if (!data[index].subcategory) {
                data[index].subcategory = 'Não informada';
            }
            tableBody += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                            <h5 style="margin: 0px; font-weight: bold">Categoria:</h5>
                            <h4 style="margin: 0px; font-weight: normal">${data[index].category}</h4>
                        </td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                            <h5 style="margin: 0px; font-weight: bold">Subcategoria:</h5>
                            <h4 style="margin: 0px; font-weight: normal">${data[index].subcategory}</h4>
                        </td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                            <h5 style="margin: 0px; font-weight: bold">Valor:</h5>
                            <h4 style="margin: 0px; font-weight: normal">${data[index].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3" style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">Descrição: ${data[index].description}</td>
                    </tr>`
            totalValue += data[index].value;
            if (index == data.length - 1) {
                tableBody += `
                        <tr>
                            <td colspan="3" style="text-align: center; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Valor Total: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>`
            }
        }

        let mailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Todos os valores já foram aprovados!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Todos os lançamentos desse título foram liberados para pagamento.</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Lembrando que qualquer custo que tenha sido revisado já foi informado ao solicitante.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Título:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${data[0].title} - #${titleId}</h4>
                            </td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Solicitante:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${data[0].name} ${data[0].family_name}</h4>
                            </td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Pix:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${data[0].pix}</h4>
                            </td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        ${tableBody}
                    </table>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`

        await sendEmail('lucas@conlinebr.com.br', '[Sirius System] Novo conjunto disponível para pagamento!', mailBody);
        return true;
    },

    updateNotification: async function (data) {

        const result = await executeQuery(`
            SELECT
                rt.title,
                rc.description AS category,
                rs.description AS subcategory,
                rf.description,
                cl.email_business,
                rf.value
            FROM refunds rf
            LEFT OUTER JOIN
                refunds_title rt ON rt.id = rf.title_id
            LEFT OUTER JOIN
                refunds_categories rc ON rc.id = rf.category_id
            LEFT OUTER JOIN
                refunds_subcategories rs ON rs.id = rf.subcategory_id
            LEFT OUTER JOIN
                collaborators cl ON cl.id = rf.collaborator_id
            WHERE rf.id = ${data.refundId}`);

        if (!result[0].subcategory) {
            result[0].subcategory = 'Não informada';
        }

        let mailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Seu pedido de reembolso foi revisado!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Um dos valores lançados precisou ser ajustado.</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Aqui estão os detalhes do que aconteceu, em breve você receberá novidades sobre o pagamento.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td colspan="2" style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Título:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${result[0].title} - #${data.refundId}</h4>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Categoria:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${result[0].category}</h4>
                            </td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Subcategoria:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${result[0].subcategory}</h4>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Descrição:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${result[0].description}</h4>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Novo valor:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${result[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
                            </td>
                            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Motivo da alteração:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${data.input2}</h4>
                            </td>
                        </tr>
                    </table>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`

        await sendEmail(result[0].email_business, '[Sirius System] Novidades sobre seu pedido de reembolso!', mailBody);
        return true;
    },

    upload: async function (req) {

        let formData = req.body;

        const refundTitle = await executeQuery(`
            INSERT INTO refunds_title (title, pix) VALUES (?, ?)`,
            [formData.title, formData.pix]
        );

        for (let index = 0; index < formData.category.length; index++) {
            const refund = await executeQuery(`
                INSERT INTO refunds (title_id, category_id, subcategory_id, description, collaborator_id, value) VALUES (?, ?, ?, ?, ?, ?)`,
                [refundTitle.insertId, formData.category[index], formData.subcategory[index], formData.description[index], formData.collabId, formData.value[index]]
            );
        }

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await executeQuery(`
            INSERT INTO refunds_attachments (title_id, file, attach_date) VALUES (?, ?, NOW())`,
                    [refundTitle.insertId, file.filename]);
            }
        }

        return true;
    },

    savePayment: async function (req) {

        let formData = req.body;

        const selectedLines = JSON.parse(req.body.selectedLines);

        if (req.file) {
            await executeQuery(`
                INSERT INTO refunds_attachments (title_id, file, attach_date) VALUES (?, ?, NOW())`,
                [formData.titleId, req.file.filename]);
        }

        for (let index = 0; index < selectedLines.length; index++) {
            await executeQuery(`
                UPDATE refunds SET status = '3', payment_date = NOW() WHERE (id = ${selectedLines[index]})`)
        }

        this.confirmPayment(formData.titleId);

        return true;
    },

    confirmPayment: async function (titleId) {
        const data = await executeQuery(`
            SELECT
                rt.id,
                rt.title,
                rt.pix,
                rc.description AS category,
                rs.description AS subcategory,
                rf.description,
                rf.value,
                cl.name,
                cl.family_name,
                cl.email_business,
                rf.payment_date
            FROM refunds rf
            LEFT OUTER JOIN refunds_title rt ON rt.id = rf.title_id
            LEFT OUTER JOIN refunds_categories rc ON rc.id = rf.category_id
            LEFT OUTER JOIN refunds_subcategories rs ON rs.id = rf.subcategory_id
            LEFT OUTER JOIN collaborators cl ON cl.id = rf.collaborator_id
            WHERE
                rf.title_id = ${titleId}
            AND rf.status = 3`);

        let tableBody = '';
        let totalValue = 0;

        for (let index = 0; index < data.length; index++) {
            if (!data[index].subcategory) {
                data[index].subcategory = 'Não informada';
            }
            tableBody += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                            <h5 style="margin: 0px; font-weight: bold">Categoria:</h5>
                            <h4 style="margin: 0px; font-weight: normal">${data[index].category}</h4>
                        </td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                            <h5 style="margin: 0px; font-weight: bold">Subcategoria:</h5>
                            <h4 style="margin: 0px; font-weight: normal">${data[index].subcategory}</h4>
                        </td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                            <h5 style="margin: 0px; font-weight: bold">Valor:</h5>
                            <h4 style="margin: 0px; font-weight: normal">${data[index].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
                        </td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                            <h5 style="margin: 0px; font-weight: bold">Pagamento:</h5>
                            <h4 style="margin: 0px; font-weight: normal">${data[index].payment_date.toLocaleDateString('pt-BR')}</h4>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4" style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">Descrição: ${data[index].description}</td>
                    </tr>`
            totalValue += data[index].value;
            if (index == data.length - 1) {
                tableBody += `
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Valor Total: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>`
            }
        }

        let mailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Pagamento realizado!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Os reembolsos solicitados abaixo foram pagos.</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Caso ainda tenha algum valor em aberto ele se manterá na tela de reembolsos.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td colspan="2" style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Título:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${data[0].title} - #${titleId}</h4>
                            </td>
                            <td colspan="2" style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h5 style="margin: 0px; font-weight: bold">Pix:</h5>
                                <h4 style="margin: 0px; font-weight: normal">${data[0].pix}</h4>
                            </td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        ${tableBody}
                    </table>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`

        await sendEmail(data[0].email_business, '[Sirius System] Seu pedido foi concluído!', mailBody);
        return true;
    },

};

module.exports = {
    refunds,
};
