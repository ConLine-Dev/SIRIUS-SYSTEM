const { executeQuery } = require('../connect/mysql');

const Collaborators = {
    getAllCollaborators: async function () {

        let result = await executeQuery(`SELECT * FROM collaborators ORDER BY name;`);

        return result;
    },
}


module.exports = {
    Collaborators,
};