const { exec } = require('child_process');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const commercial_individual_goal = {

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
};

module.exports = {
    commercial_individual_goal,
};
