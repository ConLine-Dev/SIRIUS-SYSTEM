const { executeQuery } = require('../connect/mysql');

const Product = {
    // Lista todos os departamentos;
    listAllDepartments: async function() {
        let result = await executeQuery(`SELECT id, name FROM departments ORDER BY name`)
        return result;
    },

    // Criar Categoria
    createCategory: async function(departmentId, name, textareaObservation) {
        let result = await executeQuery(`INSERT INTO product_category (department_id, name, observation) VALUES (?, ?, ?)`, [departmentId, name, textareaObservation])
        return result;
    },

    // Lista todas as categorias;
    listAllCategories: async function() {
        let result = await executeQuery(`SELECT id, department_id, name FROM product_category ORDER BY name`)
        return result;
    },

    // Criar produto
    createProduct: async function(name, ncm, categoryId, textareaObservation) {
        // Insere o produto no banco de dados
        let insertProduct = await executeQuery(`INSERT INTO product (name, ncm, observation) VALUES (?, ?, ?)`, [name, ncm, textareaObservation])

        // Insere um registro na relação produto categoria
        let insertProductCategoryRelations = await executeQuery(`INSERT INTO product_category_relations (product_category_id, product_id) VALUES (?, ?)`, [categoryId, insertProduct.insertId])

        return insertProductCategoryRelations;
    },

    // Lista todos comerciais;
    getTop10Products: async function(productName) {
        let result = await executeQuery(
        `SELECT * FROM product WHERE name LIKE ? ORDER BY name LIMIT 10`, [`%${productName}%`])
        return result;
    },

    // Lista todos os produtos;
    listAllProducts: async function() {
        let result = await executeQuery(`SELECT 
                Pdc.id,
                Pdc.name AS Product,
                Pdc.ncm,
                Pdc.observation,
                Pct.name AS Category,
                Dpt.name AS Department
            FROM 
                product Pdc
            LEFT OUTER JOIN
                product_category_relations Pcr ON Pcr.product_id = Pdc.id
            LEFT OUTER JOIN
                product_category Pct ON Pct.id = Pcr.product_category_id
            LEFT OUTER JOIN
                departments Dpt ON Dpt.id = Pct.department_id
            ORDER BY
                Pdc.name`
        )
        return result;
    },

    // Lista o produto por ID;
    getProductById: async function(id) {
        let result = await executeQuery(`SELECT 
                Pdc.id,
                Pdc.name AS Product,
                Pdc.ncm,
                Pdc.observation,
                Pct.id AS IdCategory,
                Pct.name AS Category,
                Dpt.name AS Department
            FROM 
                product Pdc
            LEFT OUTER JOIN
                product_category_relations Pcr ON Pcr.product_id = Pdc.id
            LEFT OUTER JOIN
                product_category Pct ON Pct.id = Pcr.product_category_id
            LEFT OUTER JOIN
                departments Dpt ON Dpt.id = Pct.department_id
            WHERE
                Pdc.id = ${id}
            ORDER BY
                Pdc.name`
        )
        return result;
    },

    // Atualiza produto
    updateProduct: async function(name, ncm, categoryId, textareaObservation, idProduct) {
        // Insere o produto no banco de dados
        let update = await executeQuery(`
            UPDATE product 
            SET 
                name = ?,
                ncm = ?,
                observation = ?
            WHERE 
                id = ?`, 
            [name, ncm, textareaObservation, idProduct]
        )

        // Função para atualizar a categoria do produto
        await executeQuery(`UPDATE product_category_relations SET product_category_id = ? WHERE product_id = ?`, [categoryId, idProduct]);

        return update;
    },

    // Lista todos os produtos;
    listAllCategories: async function() {
        let result = await executeQuery(`SELECT 
                Pct.id,
                Pct.name AS Category,
                Pct.observation AS Observation,
                Dpt.name AS Department
            FROM 
                product_category Pct
            LEFT OUTER JOIN
                departments Dpt ON Dpt.id = Pct.department_id
            ORDER BY
                Pct.name`
        )
        return result;
    },

    // Lista a categoria por ID;
    getCategoryById: async function(id) {
        let result = await executeQuery(`SELECT 
                Pct.id AS IdCategory,
                Pct.name AS Category,
                Pct.observation,
                Dpt.id AS IdDepartment,
                Dpt.name AS Department
            FROM 
                product_category Pct
            LEFT OUTER JOIN
                departments Dpt ON Dpt.id = Pct.department_id
            WHERE
                Pct.id = ${id}`
        )
        return result;
    },

    // Atualiza categoria
    updateCategory: async function(departmentId, name, textareaObservation, idCategory) {
        // Insere o produto no banco de dados
        let update = await executeQuery(`
            UPDATE product_category SET 
            department_id = ?, 
            name = ?, 
            observation = ? 
            WHERE id = ?`, 
            [departmentId, name, textareaObservation, idCategory]
        )

        return update;
    },
}


module.exports = {
    Product,
};