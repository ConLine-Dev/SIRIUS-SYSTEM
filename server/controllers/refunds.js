const { exec } = require('child_process');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
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

    getAttachments: async function (id) {

        const result = await executeQuery(`
            SELECT
                *
            FROM refunds_attachments
            WHERE title_id = ${id}`);
        return result;
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
};

module.exports = {
    refunds,
};
