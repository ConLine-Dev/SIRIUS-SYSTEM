const { executeQuery } = require('../connect/mysql');

const People = {
   // Lista todas as pessoas;
   getAllPeople: async function(peopleCategorySelected, peopleAllType, peopleStatusSelected, commercialValues, collaboratorResponsableValues){
      console.log(collaboratorResponsableValues);
      const peopleType = peopleAllType ? `peo.type_people IN ${peopleAllType}` : 'peo.type_people IN (0,1)';
      const peopleCategory = peopleCategorySelected ? `AND prl.people_category_id IN ${peopleCategorySelected}` : '';
      const peopleStatus = peopleStatusSelected ? `AND peo.people_status_id IN ${peopleStatusSelected}` : '';
      const commercialAndCollaboratorResponsable = commercialValues && collaboratorResponsableValues ? `AND ((com.id IN ${commercialValues}) OR (resp.id IN ${collaboratorResponsableValues}))` : commercialValues && !collaboratorResponsableValues ? `AND com.id IN ${commercialValues}` : !commercialValues && collaboratorResponsableValues ? `AND resp.id IN ${collaboratorResponsableValues}` : '';
      let result = await executeQuery(`
         SELECT DISTINCT
            pst.name AS people_status,
            CONCAT(com.name, ' ', com.family_name) AS commercial,
            CONCAT(resp.name, ' ', resp.family_name) AS collaborator_responsable,
            peo.*
         FROM 
            people peo
         LEFT OUTER JOIN
            people_status pst ON pst.id = peo.people_status_id
         LEFT OUTER JOIN
            people_relations prl ON prl.people_id = peo.id
         LEFT OUTER JOIN
            collaborators com ON com.id = peo.collaborators_commercial_id
         LEFT OUTER JOIN
            collaborators resp ON resp.id = peo.collaborators_responsable_id
         WHERE
            ${peopleType}
            ${peopleCategory}
            ${peopleStatus}
            ${commercialAndCollaboratorResponsable}
         ORDER BY peo.fantasy_name ASC`);

         const allPeople = [];

         for (let i = 0; i < result.length; i++) {
            const item = result[i];

            let resultPeopleRelations = await executeQuery(`
               SELECT
                  prl.people_id,
                  prl.people_category_id,
                  pct.name AS category
               FROM 
                  people_relations prl
               LEFT OUTER JOIN
                  people_category pct ON pct.id = prl.people_category_id
               WHERE
                  prl.people_id = ${item.id}
               ORDER BY
                  pct.name ASC`)

            allPeople.push({people: item, categories: resultPeopleRelations})
         }

         // Retornar um objeto contendo os dois resultados
         return allPeople
   },

   // Lista todas as categorias;
   getAllPeopleCategory: async function() {
      let result = await executeQuery(`SELECT * FROM people_category ORDER BY name ASC`)
      return result;
   },

   // Lista todos status;
   getAllPeopleStatus: async function() {
      let result = await executeQuery(`SELECT * FROM people_status ORDER BY name ASC`)
      return result;
   },

   // Lista todos comerciais;
   getAllCommercial: async function() {
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

   // Lista todos os funcionarios responsáveis(inside sales);
   getAllCollaboratorsResponsable: async function() {
      let result = await executeQuery(
         `SELECT
            clb.id AS collaborator_responsable_id,
            CONCAT(clb.name, ' ', clb.family_name) AS collaborator_responsable,
            dpt.id AS department_id,
            dpt.name AS department
         FROM
            collaborators clb
         LEFT OUTER JOIN
            departments_relations drl ON drl.collaborator_id = clb.id
         LEFT OUTER JOIN
            departments dpt ON dpt.id = drl.department_id
         WHERE
            drl.department_id = 2 /*INSIDE SALES*/
         ORDER BY
            clb.name ASC`)
      return result;
   },
}


    module.exports = {
      People,
    };