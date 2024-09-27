const { executeQuery } = require('../connect/mysql');

const Product = {
    // Lista todos os departamentos;
    listAllDepartments: async function() {
        let result = await executeQuery(`SELECT id, name FROM departments ORDER BY name`)
        return result;
    },

    // Criar Categoria
    createCategory: async function(departmentId, name) {
        let result = await executeQuery(`INSERT INTO product_category (department_id, name) VALUES (?, ?)`, [departmentId, name])
        return result;
    },

    // Lista todos os departamentos;
    listAllCategories: async function() {
        let result = await executeQuery(`SELECT id, department_id, name FROM product_category ORDER BY name`)
        return result;
    },

    // Criar produto
    createProduct: async function(name, ncm, categoryId) {
        // Insere o produto no banco de dados
        let insertProduct = await executeQuery(`INSERT INTO product (name, ncm) VALUES (?, ?)`, [name, ncm])

        // Insere um registro na relação produto categoria
        let insertProductCategoryRelations = await executeQuery(`INSERT INTO product_category_relations (product_category_id, product_id) VALUES (?, ?)`, [categoryId, insertProduct.insertId])

        return insertProductCategoryRelations;
    },
}


module.exports = {
    Product,
};