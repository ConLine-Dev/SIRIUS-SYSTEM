const { executeQuery } = require('../connect/mysql');

const Users = {
    getUsersByDep: async function(id){
 
        let result = await executeQuery(`SELECT
                                            dpt.id AS 'departmentID',
                                            dpt.name AS 'department',
                                            usr.id AS 'userID',
                                            user.name AS 'username',
                                            user.id_headcargo AS 'id_headcargo',
                                            user.image AS 'image',
                                            user.family_name AS 'familyName'
                                        FROM
                                            departments_relations dpt_r
                                        JOIN departments dpt ON dpt.id = dpt_r.department_id
                                        JOIN users usr ON usr.id = dpt_r.user_id
                                        JOIN collaborators user ON user.id = usr.collaborator_id
                                        WHERE
                                            dpt.id = ${id}
                                        ORDER BY
                                            user.name ASC`);
    
        return result;
    },
    getAllUsers: async function(){
 
        let result = await executeQuery(`SELECT
                            users.id AS 'userID',
                            colab.id_headcargo AS 'id_headcargo',
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
    ListUserByEmail: async function(email){
 
        let result = await executeQuery(`SELECT
                                        users.id AS 'system_userID',
                                        users.email AS 'system_email',
                                        users.email_password AS 'email_password',
                                        users.collaborator_id AS 'system_collaborator_id',
                                        colab.id_headcargo AS 'system_id_headcargo',
                                        colab.name AS 'system_username',
                                        colab.image AS 'system_image',
                                        colab.family_name AS 'system_familyName'
                                    FROM
                                        users
                                    join collaborators colab ON colab.id = users.collaborator_id
                                    WHERE users.email = '${email}'
                                    ORDER BY
                                        colab.name ASC
                                        `);
    
        return result;
    },
    getUserById: async function(id){
 
        let result = await executeQuery(`SELECT
                                        users.id AS 'system_userID',
                                        users.email AS 'system_email',
                                        users.email_password AS 'email_password',
                                        users.collaborator_id AS 'system_collaborator_id',
                                        colab.id_headcargo AS 'system_id_headcargo',
                                        colab.name AS 'system_username',
                                        colab.image AS 'system_image',
                                        colab.family_name AS 'system_familyName'
                                    FROM
                                        users
                                    join collaborators colab ON colab.id = users.collaborator_id
                                    WHERE users.id = '${id}'
                                    ORDER BY
                                        colab.name ASC
                                        `);
    
        return result;
    }
}


    module.exports = {
        Users,
    };