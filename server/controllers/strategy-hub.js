const { exec } = require('child_process');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const { sendEmail } = require('../support/send-email');
const fs = require('fs');
const path = require('path');

const strategyHub = {

    getCategories: async function () {
        const result = await executeQuery(`
            SELECT *
            FROM refunds_categories`);
        return result;
    },
};

module.exports = {
    strategyHub,
};
