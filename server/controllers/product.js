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

    // Lista todos os departamentos;
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
}


module.exports = {
    Product,
};