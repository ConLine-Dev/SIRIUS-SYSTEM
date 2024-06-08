const nodemailer = require('nodemailer');
const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');



const projects = {
    listAll: async function(value){
        const projects = await executeQuery('SELECT * FROM called_projects');

        return projects
    },
    create: async function(name, description, start_date, end_date, status){
        const result = await executeQuery(
            'INSERT INTO called_projects (name, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
            [name, description, start_date, end_date, status]
          );
        
        return { 
            id: result.insertId, 
            name, 
            description, 
            start_date, 
            end_date, 
            status 
        };
    }
}


module.exports = {
    projects,
};