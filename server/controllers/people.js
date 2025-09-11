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
}

module.exports = {
   People,
};