const { exec } = require('child_process');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const refunds = {

    getStatus: async function () {

        const result = await executeQuery(`
            SELECT
                *
            FROM speakup_status`);
        return result;
    },
};

module.exports = {
    refunds,
};
