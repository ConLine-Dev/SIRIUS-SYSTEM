const { executeQuery } = require('../connect/mysql');
// Importa a função sendEmail do arquivo emailService.js
const { sendEmail } = require('../support/send-email');

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

      const userData = await executeQuery(`
         SELECT usr.*, cl.name, cl.family_name FROM users usr
         LEFT OUTER JOIN collaborators cl on cl.id = usr.collaborator_id
         WHERE usr.collaborator_id = ${idCollaborator};`
     )
     let name = userData[0].name;
     let familyName = userData[0].family_name;
     let destinationMail = userData[0].email;

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

      let userDescription = description;
      if (description.length == 0){
         userDescription = '(O usuário não escreveu nada 😔)'
      }

      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const horas = String(hoje.getHours()).padStart(2, '0');
      const minutos = String(hoje.getMinutes()).padStart(2, '0');

      const dataHoraFormatada = `${ano}-${mes}-${dia} - ${horas}:${minutos}`;

      let userBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Chamado aberto com sucesso!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
              <p style="color: #333; font-size: 16px;">Olá,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Viemos te avisar que deu tudo certo na abertura do ticket! 🥳</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Aqui estão os detalhes do que foi inserido no sistema, só para deixarmos registrado:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${title}</td>
              </tr>
              <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${description}</td>
              </tr>
              <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Data da Abertura:</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${dataHoraFormatada}</td>
              </tr>
              </table>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
          </div>
          <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
              <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
          </div>
      </div>`

      let devBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
         <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Tem um novo ticket te esperando!</h1>
         </div>
         <div style="padding: 20px; background-color: #f9f9f9;">
            <p style="color: #333; font-size: 16px;">Olá,</p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Um usuário acabou de abrir um novo ticket no Sirius! 🥳</p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Aqui estão os detalhes do que foi inserido no sistema, já para agilizar seu trabalho:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Funcionário Responsável:</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${name} ${familyName}</td>
            </tr>
            <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${title}</td>
            </tr>
            <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${userDescription}</td>
            </tr>
            <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Data da Abertura:</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${dataHoraFormatada}</td>
            </tr>
            </table>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Boa sorte desde já! 🤠</p>
         </div>
         <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
         </div>
      </div>`

      await sendEmail(destinationMail, '[Sirius System] Seu pedido foi registrado! 🎉', userBody);
      await sendEmail('ti@conlinebr.com.br', '[Sirius System] Um novo chamado foi aberto!', devBody);
      return { id: result.insertId };
   },

   updateStatus: async function(value){

      const id = value.id;
      const status = value.status;

      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const horas = String(hoje.getHours()).padStart(2, '0');
      const minutos = String(hoje.getMinutes()).padStart(2, '0');
      const segundos = String(hoje.getSeconds()).padStart(2, '0');

      const dataHoraFormatada = `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

      await executeQuery(`UPDATE called_tickets SET status = '${status}' WHERE id = ${id}`);
      if (status == 'completed-tasks-draggable'){
         await executeQuery(`UPDATE called_tickets SET finished_at = '${dataHoraFormatada}' WHERE id = ${id}`);
      }
      return true;
  },
}

module.exports = {
   userTickets,
};