const { executeQuery } = require('../connect/mysql');
const { api } = require('../support/api-externa');

const Stock = {
   // Lista todos comerciais;
   getAllCollaborator: async function() {
      let result = await executeQuery(
         `SELECT
            clb.id AS commercial_id,
            CONCAT(clb.name, ' ', clb.family_name) AS commercial,
            dpt.id AS department_id,
            dpt.name AS department
         FROM
            collaborators clb
         LEFT OUTER JOIN
            departments_relations drl ON drl.collaborator_id = clb.id
         LEFT OUTER JOIN
            departments dpt ON dpt.id = drl.department_id
         WHERE
            drl.department_id = 1 /*COMERCIAL*/
         ORDER BY
            clb.name ASC`)
      return result;
   },
}

module.exports = {
   Stock,
};