const fs = require('fs');
const { executeQuery } = require('../connect/mysql');

const AppMonitor = {
    add: async function(values){
        const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
        const flattenedValues = values.flatMap(item => [item.processo, item.data, item.milissegundos, 1]);

        const query = `INSERT INTO app_monitor (processo, data, time_total, user) VALUES ${placeholders}`;

        await executeQuery(query, flattenedValues);
    }
}



module.exports = {
    AppMonitor,
};