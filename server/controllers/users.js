const { executeQuery } = require('../connect/mysql');

const Users = {
    getUsersByDep: async function(id){
 
        let result = await executeQuery(`SELECT
                                            dpt.id AS 'departmentID',
                                            dpt.name AS 'department',
                                            usr.id AS 'userID',
                                            user.name AS 'username',
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
}


    module.exports = {
        Users,
    };