const { executeQuery } = require('../connect/mysql');
// Importa a função sendEmail do arquivo emailService.js
const { sendEmail } = require('../support/send-email');

const internalComments = {
   simplifiedTicketCategories: async function () {
      let result = await executeQuery(
         `SELECT * FROM simplified_ticket_categories;`)
      return result;
   },
}

module.exports = {
    internalComments,
};