const { executeQuery } = require('../connect/mysql');

const Products = {
    getProductCategory: async function (id) {
        console.log(id)

        const result = await executeQuery(`SELECT
                                            Pct.id,
                                            Pct.name
                                        FROM
                                            collaborators Clb
                                        JOIN
                                            inventory_control Inv ON Inv.collaborators_id = Clb.id
                                        JOIN
                                            product_category Pct ON Pct.id = Inv.product_id
                                        WHERE
                                            Clb.id = ${id}
                                        ORDER BY
                                            Pct.name
                                        `);


        return result
    }
}


module.exports = {
    Products,
};