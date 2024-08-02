const { executeQuery } = require('../connect/mysql');

const collaboratorsController = {
    getCollaboratorById: async function(){
        const query = `SELECT * FROM collaborators WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },
    getAllCollaborators: async function(){
        const query = `SELECT * FROM collaborators`;
    const result = await executeQuery(query);
    return result;
    },

}

module.exports = {
    collaboratorsController,
};