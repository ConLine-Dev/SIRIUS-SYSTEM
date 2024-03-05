const { executeQuery } = require('../connect/mysql');


const ManagePosts = {
    listAll: async function(){
    const result = await executeQuery(`SELECT 
    blg.*, 
    clt.name, 
    clt.family_name, 
    clt.id_headcargo,
    COUNT(bl.id) AS num_likes
    FROM 
        blog_posts blg
    JOIN 
        users usr ON blg.author = usr.id
    JOIN 
        collaborators clt ON usr.collaborator_id = clt.id
    LEFT JOIN 
        blog_likes bl ON blg.id = bl.post_id
    GROUP BY 
        blg.id, clt.name, clt.family_name, clt.id_headcargo;`);

    return result;
    }
}



module.exports = {
    ManagePosts,
};