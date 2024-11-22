const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const rhPayroll = {

    // Função para obter módulos de um usuário agrupados por categoria
    getAllUsers: async function(){
 
        let result = await executeQuery(`SELECT
                            users.id AS 'userID',
                            colab.id_headcargo AS 'id_headcargo',
                            colab.id AS 'id_colab',
                            colab.name AS 'username',
                            colab.image AS 'image',
                            colab.family_name AS 'familyName'
                        FROM
                            users
                        join collaborators colab ON colab.id = users.collaborator_id
                        ORDER BY
                            colab.name ASC`);
    
        return result;
    },
}

// Exporta o objeto moduleManagement para uso em outros módulos
module.exports = {
    rhPayroll,
};