const { executeQuery } = require('../connect/mysql');
const { api } = require('../support/api-externa');

const userTickets = {
   simplifiedTicketCategories: async function () {
      let result = await executeQuery(
         `SELECT * FROM simplified_ticket_categories;`)
      return result;
   },

   simplifiedTicketSubcategories: async function () {
      let result = await executeQuery(
         `SELECT * FROM simplified_ticket_subcategories;;`)
      return result;
   },

   getAllCollaborator: async function () {
      let result = await executeQuery(
         `SELECT * FROM collaborators ORDER BY name`)
      return result;
   },

   getById: async function (id) {
      const ticketsList = []
      const tickets = await executeQuery(`
         SELECT ct.*,cc.name as categorie,cc.id as categorieID, collab.name,collab.family_name,collab.family_name, collab.id_headcargo 
         FROM called_tickets ct
         JOIN collaborators collab ON collab.id = ct.collaborator_id
         JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
         JOIN called_categories cc ON cc.id = ctc.category_id
         WHERE ct.id = ${id}`)

      for (let index = 0; index < tickets.length; index++) {
         const element = tickets[index];
         const atribuido = await executeQuery(`
            SELECT car.*, collab.name,collab.family_name,collab.family_name, collab.id_headcargo
            FROM called_assigned_relations car
            JOIN collaborators collab ON collab.id = car.collaborator_id WHERE ticket_id = ${element.id}`);

         ticketsList.push({
            id: element.id,
            title: element.title,
            categorieName: element.categorie,
            categorieID: element.categorieID,
            description: element.description,
            status: element.status,
            responsible: element.collaborator_id,
            start_forecast: element.start_forecast,
            end_forecast: element.end_forecast,
            finished_at: element.finished_at,
            atribuido: atribuido
         })
      }

      return ticketsList;
   },

   create: async function (value) {

      const description = value.description;
      const title = `Chamado Simplificado - ${value.categoryName}`
      const idCollaborator = value.idCollaborator;

      const result = await executeQuery(
         'INSERT INTO called_tickets (title, status, description, collaborator_id, start_forecast, end_forecast, finished_at) VALUES (?,?, ?, ?, ?, ?, ?)',
         [title, 'new-tasks-draggable', description, idCollaborator, null, null, null]
      );
      await executeQuery(
         'INSERT INTO called_ticket_categories (ticket_id, category_id) VALUES (?, ?)',
         [result.insertId, 2]
      );
      await executeQuery(
         'INSERT INTO called_assigned_relations (ticket_id, collaborator_id) VALUES (?, ?)',
         [result.insertId, 1]
      );
      await executeQuery(
         'INSERT INTO called_assigned_relations (ticket_id, collaborator_id) VALUES (?, ?)',
         [result.insertId, 2]
      );
      await executeQuery(
         'INSERT INTO called_assigned_relations (ticket_id, collaborator_id) VALUES (?, ?)',
         [result.insertId, 3]
      );
      await executeQuery(
         'INSERT INTO called_assigned_relations (ticket_id, collaborator_id) VALUES (?, ?)',
         [result.insertId, 35]
      );
      return { id: result.insertId };
   }
}

module.exports = {
   userTickets,
};