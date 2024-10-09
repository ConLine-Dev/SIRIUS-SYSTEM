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
            approved_at: ticket.approved_at,
            atribuido: atribuidoMap[ticket.id] || [],
            messageCount: messageMap[ticket.id] ? messageMap[ticket.id].length : 0,
            responsible_name: ticket.name,
            responsible_family_name: ticket.family_name
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
                approved_at:element.approved_at,
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
    createMessage: async function (body) {

        const date = new Date()

        const addmsg = await executeQuery(
            'INSERT INTO called_messages (ticket_id, body, create_at, collab_id) VALUES (?, ?, ?, ?)',
            [body.ticketId, body.body, date, body.collab_id]
        );

        const colaboradores = await executeQuery(`SELECT * FROM collaborators WHERE id = ${body.collab_id}`)

        const messagesByTicket = await executeQuery(`
            SELECT ct.title, ct.description, cm.body, cm.create_at, cl.name, cl.family_name, rs.email_business as 'responsible_email', rs.name as 'responsible_name', rs.family_name as 'responsible_family_name'
            FROM called_messages cm
            LEFT OUTER JOIN collaborators cl ON cl.id = cm.collab_id
            LEFT OUTER JOIN called_tickets ct ON ct.id = cm.ticket_id
            LEFT OUTER JOIN collaborators rs ON rs.id = ct.collaborator_id
            WHERE cm.ticket_id = ${body.ticketId}
            ORDER BY create_at DESC`)

        let allMessages = '';
        let font = '';
        for (let index = 0; index < messagesByTicket.length; index++) {

            if (index == 0) {
                font = 'bold'
            } else {
                font = 'normal'
            }

            let date = messagesByTicket[index].create_at;
            const formattedDate = date.toLocaleString("pt-BR", {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            allMessages += `
                <tr>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        <h6 style="margin: 0px; font-weight: ${font}">Remetente:</h6>
                        <h4 style="margin: 0px; font-weight: ${font}">${messagesByTicket[index].name} ${messagesByTicket[index].family_name}</h4>
                    </td>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        <h6 style="margin: 0px; font-weight: ${font}">Data:</h6>
                        <h4 style="margin: 0px; font-weight: ${font}">${formattedDate}</h4>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="font-weight: ${font}; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        ${messagesByTicket[index].body}
                    </td>
                </tr>`
        }

        let mailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Nova mensagem no seu ticket!</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
                <p style="color: #333; font-size: 16px;">Olá,</p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Alguém escreveu em um chamado que você está envolvido. 📩</p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Aqui está todo o loop de mensagens, já para adiantar as novidades:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Funcionário Responsável:</td>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${messagesByTicket[0].responsible_name} ${messagesByTicket[0].responsible_family_name}</td>
                </tr>
                <tr>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${messagesByTicket[0].title}</td>
                </tr>
                <tr>
                    <td colspan="2" style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        <h5 style="margin: 0px; margin-bottom: 10px; font-weight: bold">Detalhes do Chamado:</h5>
                        <h4 style="margin: 0px; font-weight: bold">${messagesByTicket[0].description}</h4>
                    </td>
                </tr>
                </table>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                ${allMessages}
                </table>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
            </div>
            <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
            </div>
        </div>`

        if (messagesByTicket[0].name != messagesByTicket[0].responsible_name && messagesByTicket[0].family_name != messagesByTicket[0].responsible_family_name){
            sendEmail(messagesByTicket[0].responsible_email, '[Sirius System] Viemos com atualizações 🫡', mailBody);
            
        }
        sendEmail('ti@conlinebr.com.br', '[Sirius System] Viemos com atualizações 🫡', mailBody);
        
        return {
            colab_name: tickets.formatarNome(colaboradores[0].name),
            colab_id: body.collab_id,
            id: addmsg.insertId,
            date: date
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
        const approved_at = value.approved_at ? value.approved_at : null;

        let status = 'new-tasks-draggable';
        if (approved_at != null){
            status = 'completed-tasks-draggable';
        }

        const userData = await executeQuery(`
            SELECT usr.*, cl.name, cl.family_name FROM users usr
            LEFT OUTER JOIN collaborators cl on cl.id = usr.collaborator_id
            WHERE usr.collaborator_id = ${value.responsible.id};`
        )
        let name = userData[0].name;
        let familyName = userData[0].family_name;
        let destinationMail = userData[0].email;

        const result = await executeQuery(
            'INSERT INTO called_tickets (title, status, description, collaborator_id, start_forecast, end_forecast, finished_at, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [value.title, status, value.description, value.responsible.id, timeInit, timeEnd, finished_at, approved_at]
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
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${value.description}</td>
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
        const approved_at = value.approved_at ? value.approved_at : null;

        // Atualiza as informações básicas do ticket
        await executeQuery(
            'UPDATE called_tickets SET title = ?, description = ?, collaborator_id = ?, start_forecast = ?, end_forecast = ?, finished_at = ?, approved_at = ? WHERE id = ?',
            [value.title, value.description, value.responsible.id, timeInit, timeEnd, finished_at, approved_at, value.id]
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

    updateEndForecast: async function (id, date) {
        
        if (date == ''){
            const hoje = new Date();
            hoje.setDate(hoje.getDate() + 2);
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            
            date = `${ano}-${mes}-${dia} 17:00`;
        }
        console.log(id, date);
        
        await executeQuery(`UPDATE called_tickets SET end_forecast = '${date}' WHERE id = ${id}`);

        return true;
    },

    updateStatus: async function(id, status){
        await executeQuery(`UPDATE called_tickets SET status = '${status}' WHERE id = ${id}`);
        
        const responsibleData = await executeQuery(`
            SELECT ct.*, usr.email
            FROM called_tickets ct
            LEFT OUTER JOIN users usr on usr.collaborator_id = ct.collaborator_id
            WHERE ct.id = ${id}`
        );
        let responsibleMail = responsibleData[0].email;

        if (status == 'todo-tasks-draggable' && responsibleData[0].start_forecast == null) {

            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            const horas = String(hoje.getHours()).padStart(2, '0');
            const minutos = String(hoje.getMinutes()).padStart(2, '0');
            const segundos = String(hoje.getSeconds()).padStart(2, '0');
        
            const dataHoraFormatada = `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

            await executeQuery(`UPDATE called_tickets SET start_forecast = '${dataHoraFormatada}' WHERE id = ${id}`);
        }

        if (status == 'inreview-tasks-draggable') {

            if (responsibleData[0].finished_at == null){
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const dia = String(hoje.getDate()).padStart(2, '0');
                const horas = String(hoje.getHours()).padStart(2, '0');
                const minutos = String(hoje.getMinutes()).padStart(2, '0');
                const segundos = String(hoje.getSeconds()).padStart(2, '0');
          
                const dataHoraFormatada = `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
            
                await executeQuery(`UPDATE called_tickets SET finished_at = '${dataHoraFormatada}' WHERE id = ${id}`);
            }

            await executeQuery(`UPDATE called_tickets SET review_notification = CURDATE() WHERE id = ${id}`);
    
            let mailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Agora só falta a sua aprovação!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Viemos avisar que o seu chamado foi atendido! 🧞</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Aguardamos sua aprovação para seguir com os próximos tickets.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${responsibleData[0].title}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${responsibleData[0].description}</td>
                    </tr>
                    </table>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`
    
            await sendEmail(responsibleMail, '[Sirius System] Tem um ticket esperando por você! 🫣', mailBody);
    
        }

        if (status == 'completed-tasks-draggable') {

            if (responsibleData[0].approved_at == null){
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const dia = String(hoje.getDate()).padStart(2, '0');
                const horas = String(hoje.getHours()).padStart(2, '0');
                const minutos = String(hoje.getMinutes()).padStart(2, '0');
                const segundos = String(hoje.getSeconds()).padStart(2, '0');
          
                const dataHoraFormatada = `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
            
                await executeQuery(`UPDATE called_tickets SET approved_at = '${dataHoraFormatada}' WHERE id = ${id}`);
            }
    
            let userBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Ticket Finalizado!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Viemos confirmar que seu chamado foi finalizado! 😇</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Se bater a saudade, ele está na aba 'Concluído' com os dados abaixo:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${responsibleData[0].title}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${responsibleData[0].description}</td>
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
                    <h1 style="margin: 0; font-size: 24px;">+1 -1</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Ficou sabendo? O melhor time finalizou mais um chamado! 🤫</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Tem mais esse renderizando na aba de concluídos agora:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${responsibleData[0].title}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${responsibleData[0].description}</td>
                    </tr>
                    </table>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Agora bora pro próximo! 😝</p>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`
    
            await sendEmail(responsibleMail, '[Sirius System] Mais um pedido foi concluído 😎', userBody);
            await sendEmail('ti@conlinebr.com.br', '[Sirius System] Mais um pedido foi concluído 😎', devBody);
    
        }

        return true;
    },
    notificatePendingTickets: async function(){
        const pendingTickets = await executeQuery(`
            SELECT ct.*, cl.email_business
            FROM called_tickets ct
            LEFT OUTER JOIN collaborators cl on cl.id = ct.collaborator_id
            WHERE ct.status = 'inreview-tasks-draggable'
            AND ct.review_notification <= DATE_SUB(CURDATE(), INTERVAL 7 DAY);`
        );
        for (let index = 0; index < pendingTickets.length; index++) {

            let mailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Só precisamos do seu OK!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Viemos te lembrar que tem um chamado aguardando aprovação! ⏳</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Para continuar melhorando o sistema precisamos que dê uma atenção neste aqui:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${pendingTickets[index].title}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${pendingTickets[index].description}</td>
                    </tr>
                    </table>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`
    
            await sendEmail(pendingTickets[index].email_business, '[Sirius System] Seguimos no aguardo da sua aprovação! 🫠', mailBody);

            await executeQuery(`UPDATE called_tickets SET review_notification = DATE_SUB(CURDATE(), INTERVAL 6 DAY) WHERE id = ${pendingTickets[index].id}`);
        }

        return true;
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
                approved_at: element.approved_at,
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
            { header: 'Aprovado em', key: 'approved_at', width: 20 },
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