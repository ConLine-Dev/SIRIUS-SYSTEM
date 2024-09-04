const { executeQuery } = require('../connect/mysql'); // Importa a função para executar consultas SQL


const meetingControl = {

    // Esta função busca todas as catgorias do calendario no banco de dados
    getAllCategoryCalendar: async function() {
        const result = await executeQuery(`SELECT * FROM calendar_category`)

        return result;
    },
    

}

// Exporta o objeto moduleManagement para uso em outros módulos
module.exports = {
    meetingControl,
};
