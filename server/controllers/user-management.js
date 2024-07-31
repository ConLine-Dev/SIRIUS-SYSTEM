const { executeQuery } = require('../connect/mysql');


const userManagement = {
    getAll: async function(){
        const result = await executeQuery('SELECT * FROM users');

        return result
    },
    getById: async function(id){
        const result = await executeQuery('SELECT * FROM users WHERE id = ?', [id]);

        return result[0]
    },
    create: async function(data){
        console.log(data)
        const { username, password, email, emailPassword, collaborator } = data;
        const result = await executeQuery('INSERT INTO users (username, password, email, email_password, collaborator_id) VALUES (?, ?, ?, ?, ?)',
        [username, password, email, emailPassword, collaborator]);

        return result.insertId
    },
    update: async function(id, data){
        const { username, password, email, email_password, collaborator_id } = data;
        const result = await executeQuery('UPDATE users SET username = ?, password = ?, email = ?, email_password = ?, collaborator_id = ? WHERE id = ?',
        [username, password, email, email_password, collaborator_id, id]);

        return result
    },
    delete: async function(id){
        const result = await executeQuery('DELETE FROM users WHERE id = ?', [id]);

        return result
    }
}


module.exports = {
    userManagement,
};
