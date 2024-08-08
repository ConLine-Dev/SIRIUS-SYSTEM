const { executeQuery } = require('../connect/mysql');
const { api } = require('../support/api-externa');

const People = {
   // Lista todas as pessoas;
   getAllPeople: async function(startDate, endDate, peopleCategorySelected, peopleAllType, peopleStatusSelected, commercialValues, collaboratorResponsableValues){
      const peopleType = peopleAllType ? `peo.type_people IN ${peopleAllType}` : 'peo.type_people IN (0,1)';
      const filterCreatedDate = startDate && endDate ? `AND (peo.created_at BETWEEN '${startDate}' AND '${endDate}')` : '';
      const peopleCategory = peopleCategorySelected ? `AND prl.people_category_id IN ${peopleCategorySelected}` : '';
      const peopleStatus = peopleStatusSelected ? `AND peo.people_status_id IN ${peopleStatusSelected}` : '';
      const commercialAndCollaboratorResponsable = commercialValues && collaboratorResponsableValues ? `AND ((com.id IN ${commercialValues}) OR (resp.id IN ${collaboratorResponsableValues}))` : commercialValues && !collaboratorResponsableValues ? `AND com.id IN ${commercialValues}` : !commercialValues && collaboratorResponsableValues ? `AND resp.id IN ${collaboratorResponsableValues}` : '';
      let result = await executeQuery(`
         SELECT DISTINCT
            pst.name AS people_status,
            COALESCE(CONCAT(com.name, ' ', com.family_name), '') AS commercial,
            COALESCE(CONCAT(resp.name, ' ', resp.family_name), '') AS collaborator_responsable,
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
            pst.name AS people_status,
            COALESCE(CONCAT(com.name, ' ', com.family_name), '') AS commercial,
            COALESCE(CONCAT(resp.name, ' ', resp.family_name), '') AS collaborator_responsable,
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

   // Pega os dados da pessoa pessada por parametro
   updateGetPeople: async function(body) {
      const formBody = body;

      let cpf_cnpj = formBody.cnpjCpf === '' ? null : formBody.cnpjCpf

      // Função para atualizar os dados do usuario
      let update = await executeQuery(
         `UPDATE 
            people
         SET 
            cnpj_cpf = ?,
            fantasy_name = ?,
            people_status_id = ?,
            collaborators_commercial_id = ?,
            collaborators_responsable_id = ?,
            cep = ?,
            street = ?,
            complement = ?,
            neighborhood = ?,
            city_id = ?,
            state_id = ?,
            country_id = ?,
            international = ?
         WHERE
            id = ?`, 

            [
               cpf_cnpj,
               formBody.fantasia,
               formBody.peopleStatus,
               formBody.commercial,
               formBody.collaboratorResponsable,
               formBody.cep,
               formBody.street,
               formBody.complement,
               formBody.neighborhood,
               formBody.city,
               formBody.state,
               formBody.country,
               formBody.international,
               formBody.peopleId
            ]
      )

      // Função para deletar as categorias
      await executeQuery(`DELETE FROM people_category_relations WHERE (people_id = ?)`, [formBody.peopleId]);

      // Função para inserir as categorias no banco
      for (let categoryId of formBody.peopleCategory) {
         await executeQuery(`INSERT INTO people_category_relations (people_id, people_category_id) VALUES (?, ?)`, [formBody.peopleId, categoryId]);
      };

      const people = await this.getPeopleById(formBody.peopleId);
      const categories = await this.getPeopleCategoryById(formBody.peopleId);

      return {people: people, categories: categories};
   },

   // Pega os dados da pessoa pessada por parametro
   getPeopleByCNPJ: async function(cnpj) {
      let result = await executeQuery(
         `SELECT 
            pst.name AS people_status,
            CONCAT(com.name, ' ', com.family_name) AS commercial,
            CONCAT(resp.name, ' ', resp.family_name) AS collaborator_responsable,
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
            peo.cnpj_cpf = ?`, [cnpj])

      // Se não encontrar nada na consulta, vai retornar as informações da api
      if (result.length === 0) {
         const resultApi = await api.getCnpjInfoCompany(cnpj);
         return { resultApi: resultApi}
      }

      // Se encontrar algo na consulta, vai informar que o CNPJ já está cadastrado
      return {company_exist: result};
   },

   // Função para criar pessoas
   insertPeople: async function(body) {
      const formBody = body;

      // Função para atualizar os dados do usuario
      let insert = await executeQuery(
         `INSERT INTO people (
            people_status_id,
            collaborators_commercial_id,
            collaborators_responsable_id,
            name,
            fantasy_name,
            type_people,
            cnpj_cpf,
            state_registration,
            cep,
            street,
            complement,
            neighborhood,
            city_id,
            state_id,
            country_id,
            international
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 

         [
            formBody.peopleStatus,
            formBody.commercial,
            formBody.collaboratorResponsable,
            formBody.razaoSocial,
            formBody.fantasia,
            formBody.selectPeopleType,
            formBody.cnpjCpf,
            formBody.inscricaoEstadual,
            formBody.cep,
            formBody.street,
            formBody.complement,
            formBody.neighborhood,
            formBody.city,
            formBody.state,
            formBody.country,
            formBody.international
         ]
      )

      // Função para inserir as categorias no banco
      for (let categoryId of formBody.peopleCategory) {
         await executeQuery(`INSERT INTO people_category_relations (people_id, people_category_id) VALUES (?, ?)`, [insert.insertId, categoryId]);
      };

      const people = await this.getPeopleById(insert.insertId);
      const categories = await this.getPeopleCategoryById(insert.insertId);

      return {people: people, categories: categories};
   },
}

module.exports = {
   People,
};