const { executeQuery } = require('../connect/mysql');

const People = {
   // Lista todas as pessoas;
   getAllPeople: async function(startDate, endDate, peopleCategorySelected, peopleAllType, peopleStatusSelected, commercialValues, collaboratorResponsableValues){
      const peopleType = peopleAllType ? `peo.type_people IN ${peopleAllType}` : 'peo.type_people IN (0,1)';
      const filterCreatedDate = startDate && endDate ? `AND (peo.created_at BETWEEN '${startDate}' AND '${endDate}')` : '';
      console.log(startDate, endDate);
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
            people_category_relations prl ON prl.people_id = peo.id
         LEFT OUTER JOIN
            collaborators com ON com.id = peo.collaborators_commercial_id
         LEFT OUTER JOIN
            collaborators resp ON resp.id = peo.collaborators_responsable_id
         WHERE
            ${peopleType}
            ${filterCreatedDate}
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
                  people_category_relations prl
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

   // Lista todas as cidades do Brasil;
   getCity: async function() {
      let result = await executeQuery(
         `SELECT 
            * 
         FROM 
            city
         ORDER BY
            name ASC`)
      return result;
   },

   // Lista todos os estados do Brasil;
   getState: async function() {
      let result = await executeQuery(
         `SELECT 
            * 
         FROM 
            states
         ORDER BY
            name ASC`)
      return result;
   },

   // Lista todos os paises;
   getCountry: async function() {
      let result = await executeQuery(
         `SELECT 
            * 
         FROM 
            country
         ORDER BY
            name ASC`)
      return result;
   },

   // Pega os dados da pessoa pessada por parametro
   getPeopleById: async function(peopleSelectedId) {
      let result = await executeQuery(
         `SELECT 
            pst.name AS status,
            com.name AS commercial,
            resp.name AS collaborator_responsable,
            DATE_FORMAT(peo.opening_date, '%Y-%m-%d') AS opening_date_formated,
            cit.name AS city,
            sta.abbreviation AS state_sigla,
            sta.name AS state,
            cou.name AS country,
            peo.*
         FROM 
            people peo
         LEFT OUTER JOIN
            people_status pst ON pst.id = peo.people_status_id
         LEFT OUTER JOIN
            collaborators com ON com.id = peo.collaborators_commercial_id
         LEFT OUTER JOIN
            collaborators resp ON resp.id = peo.collaborators_responsable_id
         LEFT OUTER JOIN
            city cit ON cit.id = peo.city_id
         LEFT OUTER JOIN
            states sta ON sta.id = peo.state_id
         LEFT OUTER JOIN
            country cou ON cou.id = peo.country_id
         WHERE
            peo.id = ?`, [peopleSelectedId])
      return result;
   },

   // Pega os dados da pessoa pessada por parametro
   getPeopleCategoryById: async function(peopleSelectedId) {
      let result = await executeQuery(
         `SELECT 
            pcr.people_category_id,
            pct.id AS category_id,
            pct.name AS category
         FROM 
            people_category pct
         LEFT OUTER JOIN
            people_category_relations pcr ON pcr.people_category_id = pct.id
         WHERE
            people_id = ?`, [peopleSelectedId])
      return result;
   },

   // Pega os dados da pessoa pessada por parametro
   getCityOrStateById: async function(city) {
      let result = await executeQuery(
         `SELECT
            cit.id AS city_id,
            sta.id AS state_id,
            sta.country_id AS country_id
         FROM
            city cit
         LEFT OUTER JOIN
            states sta ON sta.id = cit.states_id
         WHERE
            cit.name = ?`, [city])
      return result;
   },
}


module.exports = {
   People,
};