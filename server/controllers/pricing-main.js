const { executeQuery } = require('../connect/mysql');
const fs = require('fs');
const path = require('path');

const pricingMain = {
    
    // Consulta para listar todos os backups
    async listBackups() {
        const query = 'SELECT * FROM bkp_data';
        return executeQuery(query);
    },
};

module.exports = {
    pricingMain,
};
