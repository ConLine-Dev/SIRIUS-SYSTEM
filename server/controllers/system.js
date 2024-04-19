const fs = require('fs');
const { executeQuery } = require('../connect/mysql');

const system = {
    add: async function(values){
        const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
        const flattenedValues = values.flatMap(item => [item.processo, item.data, item.milissegundos, 1]);

        const query = `INSERT INTO app_monitor (processo, data, time_total, user) VALUES ${placeholders}`;

        await executeQuery(query, flattenedValues);
    },
    listApp: async function(user){

        const acessModules = await executeQuery(`SELECT modules.*,
                                                        ma.user_id
                                                FROM modules
                                                JOIN modules_acess ma ON ma.modules_id = modules.id
                                                WHERE user_id = ${user.system_userID} AND searchable = 1`);

        return acessModules;
    }

}



module.exports = {
    system,
};