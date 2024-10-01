const { executeQuery } = require('../connect/mysql');

const Stock = {
   // Função para criar pessoas
   insertProduct: async function(body) {
      const formBody = body;

      // Função para atualizar os dados do usuario
      let insert = await executeQuery(
         `INSERT INTO product (name, ncm) VALUES (?, ?);`, 

         [
            formBody.inputProduct,
            formBody.inputNcm
         ]
      )

      return insert;
   },

   // Lista todos comerciais;
   getTop10Products: async function(productName) {
      let result = await executeQuery(
         `SELECT * FROM product WHERE name LIKE ? ORDER BY name LIMIT 10`, [`%${productName}%`])
      return result;
   },

   // Lista todos comerciais;
   getAllCollaborator: async function() {
      let result = await executeQuery(
         `SELECT * FROM collaborators ORDER BY name`)
      return result;
   },
}

module.exports = {
   Stock,
};