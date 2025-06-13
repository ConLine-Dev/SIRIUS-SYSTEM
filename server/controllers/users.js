const { executeQuery } = require('../connect/mysql');

const Users = {
    getUsersByDep: async function(id){
 
        let result = await executeQuery(`SELECT
                        dpt.id AS 'departmentID',
                        dpt.name AS 'department',
                        collab.id AS 'collab_id',
                        usr.id AS 'userID',
                        collab.name AS 'username',
                        collab.id_headcargo AS 'id_headcargo',
                        collab.image AS 'image',
                        collab.family_name AS 'familyName'
                    FROM
                        departments_relations dpt_r
                    JOIN departments dpt ON dpt.id = dpt_r.department_id
                    JOIN collaborators collab ON collab.id = dpt_r.collaborator_id
                    JOIN users usr ON usr.collaborator_id = collab.id
                    WHERE
                        dpt.id = ${id}
                    ORDER BY
                        collab.name ASC`);
    
        return result;
    },
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
    listAllUsersActive: async function(){
 
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
                        WHERE colab.resignation_date is null
                        ORDER BY
                            colab.name ASC`);
    
        return result;
    },
    ListUserByEmail: async function(email){
 
        let result = await executeQuery(`SELECT
                            u.id AS 'system_userID',
                            u.email AS 'system_email',
                            u.email_password AS 'email_password',
                            u.collaborator_id AS 'system_collaborator_id',
                            c.id_headcargo AS 'system_id_headcargo',
                            c.name AS 'system_username',
                            c.image AS 'system_image',
                            c.job_position,
                            c.family_name AS 'system_familyName',
                            d.department_ids
                        FROM
                            users u
                        JOIN
                            collaborators c ON c.id = u.collaborator_id
                        LEFT JOIN (
                            SELECT collaborator_id, GROUP_CONCAT(department_id) AS department_ids
                            FROM departments_relations
                            GROUP BY collaborator_id
                        ) d ON d.collaborator_id = c.id
                        WHERE
                            u.email = '${email}'
                        ORDER BY
                            c.name ASC`);
    
        return result;
    },
    ListUserByEmailAndPassword: async function(email, password){
 
        let result = await executeQuery(`SELECT
                                            u.id AS 'system_userID',
                                            u.email AS 'system_email',
                                            u.email_password AS 'email_password',
                                            u.collaborator_id AS 'system_collaborator_id',
                                            c.id_headcargo AS 'system_id_headcargo',
                                            c.name AS 'system_username',
                                            c.image AS 'system_image',
                                            c.family_name AS 'system_familyName',
                                            CONCAT('https://cdn.conlinebr.com.br/colaboradores/', c.id_headcargo) AS ImgCollaborator,
                                            d.department_ids
                                        FROM
                                            users u
                                        JOIN
                                            collaborators c ON c.id = u.collaborator_id
                                        LEFT JOIN (
                                            SELECT collaborator_id, GROUP_CONCAT(department_id) AS department_ids
                                            FROM departments_relations
                                            GROUP BY collaborator_id
                                        ) d ON d.collaborator_id = c.id
                                        WHERE
                                            u.email = '${email}'
                                            AND u.email_password = '${password}'
                                            AND c.resignation_date IS NULL
                                        ORDER BY
                                            c.name ASC`);
    
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
    },
    getColabById: async function(id){
 
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
                                    WHERE colab.id = '${id}'
                                    ORDER BY
                                        colab.name ASC
                                        `);
    
        return result;
    },
    getAllDept: async function(){
 
        let result = await executeQuery(`SELECT * FROM departments`);
    
        return result;
    },
    getAllColab: async function(){
        let result = await executeQuery(`SELECT *, CONCAT(collaborators.name, ' ', collaborators.family_name) as ColabFullName  FROM collaborators`);

        return result;
    }
}


    module.exports = {
        Users,
    };