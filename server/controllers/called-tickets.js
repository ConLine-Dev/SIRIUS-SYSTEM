const nodemailer = require('nodemailer');
const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');



const tickets = {
    listAll: async function(value){
        const tickets = await executeQuery('SELECT * FROM called_tickets');

        return tickets
    },
    create: async function(title, description, status, priority, project_id, assigned_to){
        const result = await executeQuery(
            'INSERT INTO called_tickets (title, description, status, priority, project_id, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, status, priority, project_id, assigned_to]
          );
        
        return { id: result.insertId, title, description, status, priority, project_id, assigned_to };
    }
}


module.exports = {
    tickets,
};