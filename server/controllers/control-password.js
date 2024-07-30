const { executeQuery } = require('../connect/mysql'); // Importa a função para executar consultas SQL

const controlPassword = {
    // Função para obter todos os módulos
    getAll: async function() {
        const result = await executeQuery(`SELECT * FROM password_control`);
        return result;
    },
    
    create: async function(form) {
        console.log(form)
        const result = await executeQuery(`INSERT INTO password_control (title, login, password, responsible, link, observation) VALUES ('${form.title}', '${form.login}', '${form.password}', '${form.responsible}', '${form.link}', '${form.observation}')`)

        return result;
    }
}

// Exporta o objeto moduleManagement para uso em outros módulos
module.exports = {
    controlPassword,
};
