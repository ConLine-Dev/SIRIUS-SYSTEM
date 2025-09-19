const { executeQuery } = require('../connect/mysql');

const People = {
   // Lista todas as pessoas;
   getAllPeople: async function(){
      let result = await executeQuery(`
         SELECT *
         FROM people;`);

         return result;
   },
   insertPeople: async function(details){

      let result = await executeQuery(`
         INSERT INTO people (name, fantasy_name, type_people, cnpj_cpf, created_by)
         VALUES ('${details.realName}', '${details.fantasyName}', '${details.type}', '${details.cpfCnpj}', '${details.userId}');`);

      for (let index = 0; index < details.name.length; index++) {
         if (details.email[index].length > 0) {
            let contact = await executeQuery(`
               INSERT INTO people_contacts (people_id, name, cpf, email, created_by)
               VALUES ('${result.insertId}', '${details.name[index]}', '${details.cpf[index]}', '${details.email[index]}', '${details.userId}');`);
         } else if (details.email[index].length == 0) {
            let contact = await executeQuery(`
               INSERT INTO people_contacts (people_id, name, cpf, created_by)
               VALUES ('${result.insertId}', '${details.name[index]}', '${details.cpf[index]}', '${details.userId}');`);
         }
      }

      return true;
   },
   getById: async function(id){
      let result = await executeQuery(`
         SELECT
            pl.name AS real_name,
            pl.fantasy_name,
            pl.type_people,
            pl.cnpj_cpf,
            cl.name,
            cl.family_name,
            pa.cep,
            pa.address,
            pa.complement,
            ct.name AS city,
            st.name AS state,
            cn.name AS country,
            pa.email,
            pa.phone
         FROM people pl
         LEFT OUTER JOIN collaborators cl ON cl.id = pl.created_by
         LEFT OUTER JOIN people_address pa ON pa.id_people = pl.id
         LEFT OUTER JOIN city ct ON ct.id = pa.city
         LEFT OUTER JOIN states st ON st.id = pa.state
         LEFT OUTER JOIN country cn ON cn.id = pa.country
         WHERE pl.id = ${id}`);

      return result;
   },
   update: async function(details){

      let result = await executeQuery(`
         UPDATE people SET
            name = '${details.realName}',
            fantasy_name = '${details.fantasyName}',
            cnpj_cpf = '${details.cpfCnpj}',
            WHERE (id = '${details.id}');`);
      
      let address = await executeQuery(`
         SELECT * FROM people_address
         WHERE people_id = '${details.id}'`);
      if (address) {
         
      }

      return result;
   },
   getCities: async function(search){

      let result = await executeQuery(`
         SELECT *
         FROM city
         WHERE name like '%${search}%';`);

      return result;
   },
   getStates: async function(search){

      let result = await executeQuery(`
         SELECT *
         FROM states
         WHERE name like '%${search}%';`);

      return result;
   },
   getCountries: async function(search){

      let result = await executeQuery(`
         SELECT *
         FROM country
         WHERE name like '%${search}%';`);

      return result;
   },
}

module.exports = {
   People,
};