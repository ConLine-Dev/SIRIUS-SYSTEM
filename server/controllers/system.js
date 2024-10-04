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
        const query = `
            SELECT modules.*,
                   ma.user_id,
                   mc.name AS category_name
            FROM modules
            JOIN modules_acess ma ON ma.modules_id = modules.id
            JOIN module_category_relations mcr ON mcr.module_id = modules.id
            JOIN module_categories mc ON mc.id = mcr.category_id
            WHERE ma.user_id = ${user.system_userID} AND modules.searchable = 1
        `;

        const acessModules = await executeQuery(query);

        return acessModules;
    }

}



module.exports = {
    system,
};