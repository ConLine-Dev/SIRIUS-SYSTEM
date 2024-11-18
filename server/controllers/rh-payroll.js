const { executeQuery } = require('../connect/mysql');

const rhPayroll = {

    // Função para obter módulos de um usuário agrupados por categoria
    getUserModulesByCategory: async function(userId) {
        const result = await executeQuery(`
            SELECT 
                mc.id AS category_id,
                mc.name AS category_name,
                m.id AS module_id,
                m.title AS module_title,
                IF(uma.user_id IS NULL, 0, 1) AS has_access
            FROM 
                module_categories mc
            LEFT JOIN 
                module_category_relations mcr ON mc.id = mcr.category_id
            LEFT JOIN 
                modules m ON mcr.module_id = m.id
            LEFT JOIN 
                modules_acess uma ON m.id = uma.modules_id AND uma.user_id = ${userId}
            ORDER BY 
                mc.name, m.title
        `);
        return result;
    }
}

// Exporta o objeto moduleManagement para uso em outros módulos
module.exports = {
    rhPayroll,
};