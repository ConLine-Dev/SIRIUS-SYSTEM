const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const reportPricing = {
        // Lista todos os departamentos;
        listAllDepartments: async function() {
            let result = await executeQuery(`SELECT id, name FROM departments ORDER BY name`)
            return result;
        },
}


module.exports = {
    reportPricing,
 };