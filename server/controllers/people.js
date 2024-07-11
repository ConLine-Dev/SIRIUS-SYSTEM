const { executeQuery } = require('../connect/mysql');

const People = {
   getAllPeople: async function(peopleCategorySelected, peopleAllType){
      const peopleType = peopleAllType ? `type_people IN ${peopleAllType}` : 'type_people IN (0,1)';
      const peopleCategory = peopleCategorySelected ? `AND people_category_id IN ${peopleCategorySelected}` : '';
      let result = await executeQuery(`
         SELECT 
            *
         FROM 
            people
         WHERE
            ${peopleType}
            ${peopleCategory}
         ORDER BY fantasy_name ASC`);
      return result;
   },

   getAllPeopleCategory: async function() {
      let result = await executeQuery(`SELECT * FROM people_category ORDER BY name ASC`)
      return result;
   }
}


    module.exports = {
      People,
    };