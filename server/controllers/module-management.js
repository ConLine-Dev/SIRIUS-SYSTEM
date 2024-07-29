const { executeQuery } = require('../connect/mysql'); // Importa a função para executar consultas SQL

const moduleManagement = {
    // Função para obter todos os módulos
    getAll: async function() {
        const result = await executeQuery(`SELECT * FROM modules`);
        return result;
    },
    
    // Função para obter módulos agrupados por categoria
    getModulesByCategory: async function() {
        const result = await executeQuery(`
            SELECT 
                mc.name as category_name, 
                m.id as module_id, 
                m.title as module_title, 
                m.description as module_description, 
                m.path as module_path
            FROM 
                modules m
            JOIN 
                module_category_relations mcr ON m.id = mcr.module_id
            JOIN 
                module_categories mc ON mcr.category_id = mc.id
            ORDER BY 
                mc.name
        `);
        return result;
    },
    
    // Função para obter todas as categorias
    getAllCategories: async function() {
        const result = await executeQuery(`SELECT * FROM module_categories`);
        return result;
    },
    
    // Função para criar um novo módulo
    createModule: async function(moduleData) {
        const { title, description, path, height, width, resizable, fixed, searchable, icon, categoryId } = moduleData;
        
        // Cria o módulo
        const createModuleResult = await executeQuery(`
            INSERT INTO modules (title, description, path, height, width, resizable, fixed, searchable, icon)
            VALUES ('${title}', '${description}', '${path}', '${height}', '${width}', ${resizable}, ${fixed}, ${searchable}, '${icon}')
        `);
        
        // Obtém o ID do módulo recém-criado
        const moduleId = createModuleResult.insertId;
        
        // Associa o módulo à categoria
        const associateCategoryResult = await executeQuery(`
            INSERT INTO module_category_relations (module_id, category_id)
            VALUES (${moduleId}, ${categoryId})
        `);
        
        return {
            createModuleResult,
            associateCategoryResult
        };
    },
    
    // Função para editar um módulo existente
    updateModule: async function(moduleId, moduleData) {
        const { title, description, path, height, width, resizable, fixed, searchable, icon, categoryId } = moduleData;
        
        // Atualiza o módulo
        const updateModuleResult = await executeQuery(`
            UPDATE modules
            SET title = '${title}', description = '${description}', path = '${path}', height = '${height}', width = '${width}', resizable = ${resizable}, fixed = ${fixed}, searchable = ${searchable}, icon = '${icon}'
            WHERE id = ${moduleId}
        `);
        
        // Atualiza a categoria do módulo
        const updateCategoryResult = await executeQuery(`
            UPDATE module_category_relations
            SET category_id = ${categoryId}
            WHERE module_id = ${moduleId}
        `);
        
        return {
            updateModuleResult,
            updateCategoryResult
        };
    },
    
    // Função para excluir um módulo
    deleteModule: async function(moduleId) {
        // Exclui a relação do módulo com a categoria
        const deleteCategoryRelationResult = await executeQuery(`
            DELETE FROM module_category_relations WHERE module_id = ${moduleId}
        `);
        
        // Exclui o módulo
        const deleteModuleResult = await executeQuery(`DELETE FROM modules WHERE id = ${moduleId}`);
        
        return {
            deleteCategoryRelationResult,
            deleteModuleResult
        };
    },
    
    // Função para adicionar acesso de um usuário a um módulo
    addUserAccessToModule: async function(userId, moduleId) {
        const result = await executeQuery(`
            INSERT INTO user_module_access (user_id, module_id)
            VALUES (${userId}, ${moduleId})
        `);
        return result;
    },
    
    // Função para remover acesso de um usuário a um módulo
    removeUserAccessFromModule: async function(userId, moduleId) {
        const result = await executeQuery(`
            DELETE FROM user_module_access 
            WHERE user_id = ${userId} AND module_id = ${moduleId}
        `);
        return result;
    },

    // Função para adicionar ou remover o acesso de um usuário a um módulo
    updateUserModuleAccess: async function(userId, moduleId, action) {
        if (action === 'add') {
            await executeQuery(`
                INSERT INTO modules_acess (user_id, modules_id)
                VALUES (${userId}, ${moduleId})
                ON DUPLICATE KEY UPDATE user_id = user_id
            `);
        } else if (action === 'remove') {
            await executeQuery(`
                DELETE FROM modules_acess
                WHERE user_id = ${userId} AND modules_id = ${moduleId}
            `);
        }
    },
    
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
    moduleManagement,
};
