const nodemailer = require('nodemailer');
const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');
const ExcelJS = require('exceljs');
// Importa a função sendEmail do arquivo emailService.js
const { sendEmail } = require('../support/send-email');


const tickets = {
    listAll: async function(value){
        const ticketsList = [];

        const tickets = await executeQuery(`
        SELECT ct.*, collab.name, collab.family_name, collab.id_headcargo 
        FROM called_tickets ct
        JOIN collaborators collab ON collab.id = ct.collaborator_id
        `);

        // Obter todos os dados relacionados a atribuições de uma vez
        const allAtribuidos = await executeQuery(`
        SELECT car.*, collab.name, collab.family_name, collab.id_headcargo 
        FROM called_assigned_relations car
        JOIN collaborators collab ON collab.id = car.collaborator_id
        WHERE car.ticket_id IN (${tickets.map(t => t.id).join(',')})
        `);

        // Obter todas as mensagens relacionadas de uma vez
        const allMessages = await executeQuery(`
        SELECT clm.*, collab.name, collab.family_name, collab.id_headcargo 
        FROM called_messages clm
        JOIN collaborators collab ON collab.id = clm.collab_id
        WHERE clm.ticket_id IN (${tickets.map(t => t.id).join(',')})
        `);

        // Organizar atribuições e mensagens por ticket_id
        const atribuidoMap = {};
        allAtribuidos.forEach(atribuido => {
        if (!atribuidoMap[atribuido.ticket_id]) {
            atribuidoMap[atribuido.ticket_id] = [];
        }
        atribuidoMap[atribuido.ticket_id].push(atribuido);
        });

        const messageMap = {};
        allMessages.forEach(msg => {
        if (!messageMap[msg.ticket_id]) {
            messageMap[msg.ticket_id] = [];
        }
        messageMap[msg.ticket_id].push(msg);
        });

        // Construir a lista de tickets com as informações agregadas
        tickets.forEach(ticket => {
        ticketsList.push({
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            responsible: ticket.collaborator_id,
            start_forecast: ticket.start_forecast,
            end_forecast: ticket.end_forecast,
            finished_at: ticket.finished_at,
            atribuido: atribuidoMap[ticket.id] || [],
            messageCount: messageMap[ticket.id] ? messageMap[ticket.id].length : 0
        });
        });

        return ticketsList;
    },
    getById: async function(id){
        const ticketsList = []
        const tickets = await executeQuery(`SELECT ct.*,cc.name as categorie,cc.id as categorieID, collab.name,collab.family_name,collab.family_name, collab.id_headcargo 
        FROM called_tickets ct
        JOIN collaborators collab ON collab.id = ct.collaborator_id
        JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
        JOIN called_categories cc ON cc.id = ctc.category_id
        WHERE ct.id = ${id}`);

      

        for (let index = 0; index < tickets.length; index++) {
            const element = tickets[index];
    

            const atribuido = await executeQuery(`SELECT car.*, collab.name,collab.family_name,collab.family_name, collab.id_headcargo FROM called_assigned_relations car
            JOIN collaborators collab ON collab.id = car.collaborator_id WHERE ticket_id = ${element.id}`);

            ticketsList.push({
                id:element.id,
                title:element.title,
                categorieName:element.categorie,
                categorieID:element.categorieID,
                description:element.description,
                status:element.status,
                responsible:element.collaborator_id,
                start_forecast:element.start_forecast,
                end_forecast:element.end_forecast,
                finished_at:element.finished_at,
                atribuido:atribuido
            })
        }

        return ticketsList
    },
    listMessage: async function(id){
        const msg = await executeQuery(`SELECT clm.*,collab.name, collab.family_name,collab.family_name, collab.id_headcargo 
        FROM called_messages clm
        JOIN collaborators collab ON collab.id = clm.collab_id 
        WHERE clm.ticket_id = ${id}`);

        return msg
    },
    createMessage: async function(body){

        const date = new Date()

        const addmsg = await executeQuery(
            'INSERT INTO called_messages (ticket_id, body, create_at, collab_id) VALUES (?, ?, ?, ?)',
            [body.ticketId, body.body, date, body.collab_id]
          );

          const colaboradores = await executeQuery(`SELECT * FROM collaborators WHERE id = ${body.collab_id}`)
    

          return {
            colab_name: tickets.formatarNome(colaboradores[0].name),
            colab_id: body.collab_id,
            id:addmsg.insertId,
            date:date
          }

    },
    removeTicket: async function(id){

        await executeQuery(`DELETE FROM called_assigned_relations WHERE (ticket_id = ${id})`);
        await executeQuery(`DELETE FROM called_ticket_categories WHERE (ticket_id = ${id})`);
        await executeQuery(`DELETE FROM called_tickets WHERE (id = ${id})`);

        return true
        
    },
    create: async function(value){
        const timeInit = value.timeInit ? value.timeInit : null;
        const timeEnd = value.timeEnd ?  value.timeEnd : null;
        const finished_at = value.finished_at ? value.finished_at : null;

        const userMail = await executeQuery(
            `SELECT * FROM siriusDBO.users usr
            WHERE usr.collaborator_id = ${value.responsible.id};`
        )
        let destinationMail = userMail[0].email;

        const result = await executeQuery(
            'INSERT INTO called_tickets (title,status, description, collaborator_id, start_forecast, end_forecast, finished_at) VALUES (?,?, ?, ?, ?, ?, ?)',
            [value.title,'new-tasks-draggable', value.description, value.responsible.id, timeInit, timeEnd, finished_at]
          );

        await executeQuery(
            'INSERT INTO called_ticket_categories (ticket_id, category_id) VALUES (?, ?)',
            [result.insertId, value.categories.id]
          );
        
        if (value.atribuido.length > 0) {
            const atribuido = value.atribuido;
            for (let index = 0; index < atribuido.length; index++) {
                const element = atribuido[index];
                await executeQuery(
                    'INSERT INTO called_assigned_relations (ticket_id, collaborator_id) VALUES (?, ?)',
                    [result.insertId, element.id]
                );
            }
        } else {
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
        }

        let userDescription = value.description;
        if (value.description.length == 0){
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
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${value.title}</td>
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
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${value.title}</td>
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
        return { id: result.insertId};
    },
    saveTicket: async function(value){
        const timeInit = value.timeInit ? value.timeInit : null;
        const timeEnd = value.timeEnd ? value.timeEnd : null;
        const finished_at = value.finished_at ? value.finished_at : null;

        // Atualiza as informações básicas do ticket
        await executeQuery(
            'UPDATE called_tickets SET title = ?, description = ?, collaborator_id = ?, start_forecast = ?, end_forecast = ?, finished_at = ? WHERE id = ?',
            [value.title, value.description, value.responsible.id, timeInit, timeEnd, finished_at, value.id]
        );

        // Atualiza a categoria do ticket
        await executeQuery(
            'UPDATE called_ticket_categories SET category_id = ? WHERE ticket_id = ?',
            [value.categories.id, value.id]
        );

        // Remove as relações atuais de atribuição do ticket
        await executeQuery(
            'DELETE FROM called_assigned_relations WHERE ticket_id = ?',
            [value.id]
        );

        // Insere as novas relações de atribuição
        const atribuido = value.atribuido;
        for (let index = 0; index < atribuido.length; index++) {
            const element = atribuido[index];

            await executeQuery(
                'INSERT INTO called_assigned_relations (ticket_id, collaborator_id) VALUES (?, ?)',
                [value.id, element.id]
            );
        }

        return { id: value.id };
    },
    updateStatus: async function(id, status){
        await executeQuery(`UPDATE called_tickets SET status = '${status}' WHERE id = ${id}`);
        return true

    },
    formatarNome: function(nome) {
        const preposicoes = new Set(["de", "do", "da", "dos", "das"]);
        const palavras = nome?.split(" ");
        
        if(!palavras){
           
            if(!nome){
                return 'Sem Registro'
            }else{
                return nome.toLowerCase();
            }
            
        }
        
        const palavrasFormatadas = palavras.map((palavra, index) => {
            // Se a palavra for uma preposição e não é a primeira palavra
            if (preposicoes.has(palavra.toLowerCase()) && index !== 0) {
                return palavra.toLowerCase();
            } else {
                return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
            }
        });
        
        return palavrasFormatadas.join(" ");
    },
    exportTicketsToExcel: async function(filePath){
        const statusMapping = {
            'new-tasks-draggable': 'Novos',
            'completed-tasks-draggable': 'Finalizada',
            'todo-tasks-draggable': 'Em análise',
            'inprogress-tasks-draggable': 'Em andamento',
            'inreview-tasks-draggable': 'Em revisão'
        };
    
        const ticketsList = [];
        const tickets = await executeQuery(`SELECT ct.*, collab.name AS collab_name, collab.family_name AS collab_family_name, collab.id_headcargo 
                                            FROM called_tickets ct
                                            JOIN collaborators collab ON collab.id = ct.collaborator_id`);
    
        for (let index = 0; index < tickets.length; index++) {
            const element = tickets[index];
    
            const atribuidoQuery = await executeQuery(`SELECT collab.name, collab.family_name 
                                                       FROM called_assigned_relations car
                                                       JOIN collaborators collab ON collab.id = car.collaborator_id 
                                                       WHERE ticket_id = ${element.id}`);
    
            const atribuido = atribuidoQuery.map(a => `${a.name} ${a.family_name}`).join(', ');
    
            const msgQuery = await executeQuery(`SELECT clm.*,collab.name, collab.family_name,collab.family_name, collab.id_headcargo 
                                                FROM called_messages clm
                                                JOIN collaborators collab ON collab.id = clm.collab_id 
                                                WHERE clm.ticket_id = ${element.id}`);
    
            const messages = msgQuery.map(m => `${m.name} ${m.family_name}: ${m.body}`).join('\n');
    
            ticketsList.push({
                id: element.id,
                title: element.title,
                description: element.description,
                status: statusMapping[element.status] || element.status,
                responsible: `${element.collab_name} ${element.collab_family_name}`,
                start_forecast: element.start_forecast,
                end_forecast: element.end_forecast,
                finished_at: element.finished_at,
                atribuido: atribuido,
                messages: messages
            });
        }
    
        // Criar um novo workbook e worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tickets');
    
        // Adicionar cabeçalhos das colunas
        worksheet.columns = [
            // { header: 'ID', key: 'id', width: 10 },
            { header: 'Título', key: 'title', width: 30 },
            { header: 'Descrição', key: 'description', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Responsável', key: 'responsible', width: 30 },
            { header: 'Previsão de Início', key: 'start_forecast', width: 20 },
            { header: 'Previsão de Término', key: 'end_forecast', width: 20 },
            { header: 'Finalizado em', key: 'finished_at', width: 20 },
            { header: 'Atribuído', key: 'atribuido', width: 30 },
            { header: 'Mensagens', key: 'messages', width: 50 }
        ];
    
        // Adicionar dados das linhas
        ticketsList.forEach(ticket => {
            worksheet.addRow(ticket);
        });
    
        // Salvar o arquivo
        await workbook.xlsx.writeFile(filePath);
    }
}

// Chamar a função e exportar os tickets para um arquivo Excel
// tickets.exportTicketsToExcel('tickets.xlsx')
//     .then(() => {
//         console.log('Arquivo Excel gerado com sucesso.');
//     })
//     .catch(error => {
//         console.error('Erro ao gerar o arquivo Excel:', error);
//     });


module.exports = {
    tickets,
};