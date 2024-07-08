const { executeQuery } = require('../connect/mysql');

const People = {
   getAllPeople: async function(){

      let result = await executeQuery(`SELECT * FROM people ORDER BY name ASC`);
   
      return result;
   }
}


    module.exports = {
      People,
    };