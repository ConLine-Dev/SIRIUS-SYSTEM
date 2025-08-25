const nodemailer = require('nodemailer');
const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');
const ExcelJS = require('exceljs');
// Importa a função sendEmail do arquivo emailService.js
const { sendEmail } = require('../support/send-email');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { AutoDetectSourceLanguagesOpenRangeOptionName } = require('microsoft-cognitiveservices-speech-sdk/distrib/lib/src/common.speech/Exports');


const tickets = {
    listAll: async function(value){
        const ticketsList = [];

        const tickets = await executeQuery(`
            SELECT
                ct.id,
                ct.title,
                SUBSTRING(ct.description, 1, 300) AS description, -- Limita a descrição a 100 caracteres
                ct.status,
                ct.collaborator_id,
                ct.start_forecast,
                ct.end_forecast,
                ct.created_at,
                ct.finished_at,
                ct.approved_at,
                ct.priority,
                ctg.name as 'category',
                collab.name,
                collab.family_name,
                collab.id_headcargo 
            FROM called_tickets ct
            JOIN collaborators collab ON collab.id = ct.collaborator_id
            JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
            JOIN called_categories ctg ON ctg.id = ctc.category_id
            ORDER BY
            CASE ct.priority
                WHEN 'critical' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
                ELSE 5
            END,
            ctg.id ASC,
            ct.created_at`);
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

        // Obter todos os envolvidos de uma vez
        const allInvolved = await executeQuery(`
        SELECT cti.*, collab.name, collab.family_name, collab.id_headcargo 
        FROM called_tickets_involved cti
        JOIN collaborators collab ON collab.id = cti.collaborator_id
        WHERE cti.ticket_id IN (${tickets.map(t => t.id).join(',')})
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

        // Organizar envolvidos por ticket_id
        const involvedMap = {};
        allInvolved.forEach(involved => {
        if (!involvedMap[involved.ticket_id]) {
            involvedMap[involved.ticket_id] = [];
        }
        involvedMap[involved.ticket_id].push(involved);
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
            created_at: ticket.created_at,
            finished_at: ticket.finished_at,
            approved_at: ticket.approved_at,
            priority: ticket.priority,
            category: ticket.category,
            atribuido: atribuidoMap[ticket.id] || [],
            messageCount: messageMap[ticket.id] ? messageMap[ticket.id].length : 0,
            responsible_name: ticket.name,
            responsible_family_name: ticket.family_name,
            involved: involvedMap[ticket.id] || []
        });
        });

        return ticketsList;
    },
    getById: async function(id){
        const ticketsList = []
        const tickets = await executeQuery(`SELECT 
            ct.*,cc.name as categorie,
            cc.id as categorieID, 
            collab.name,
            collab.family_name,
            collab.id_headcargo,
           CONCAT(collab.name, ' ', collab.family_name) AS fullName -- Nome completo do criador
        FROM called_tickets ct
        JOIN collaborators collab ON collab.id = ct.collaborator_id
        JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
        JOIN called_categories cc ON cc.id = ctc.category_id
        WHERE ct.id = ${id}`);

      

        for (let index = 0; index < tickets.length; index++) {
            const element = tickets[index];
    

            const atribuido = await executeQuery(`SELECT car.*, collab.name,collab.family_name,collab.family_name, collab.id_headcargo FROM called_assigned_relations car
            JOIN collaborators collab ON collab.id = car.collaborator_id WHERE ticket_id = ${element.id}`);

            const steps = await executeQuery(`SELECT * FROM called_ticket_steps WHERE call_id = ${element.id}`);


            const msg = await executeQuery(`SELECT clm.*,collab.name, collab.family_name,collab.family_name, collab.id_headcargo 
                FROM called_messages clm
                JOIN collaborators collab ON collab.id = clm.collab_id 
                WHERE clm.ticket_id = ${element.id} ORDER BY id ASC`);


            const involved = await executeQuery(`
                            SELECT cti.*, 
                            collab.name, 
                            collab.family_name,
                            collab.family_name, 
                            CONCAT(collab.name, ' ', collab.family_name) AS fullName,
                            collab.id_headcargo FROM 
                            called_tickets_involved  cti
                            JOIN collaborators collab ON collab.id = cti.collaborator_id 
                            WHERE ticket_id = ${element.id}`);

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
                atribuido:atribuido,
                priority:element.priority,
                created_at:element.created_at,
                name:element.name,
                fullName:element.fullName,
                steps:steps,
                id_headcargo:element.id_headcargo,
                files:JSON.parse(element.files),
                comments:msg,
                involved:involved
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
    listAllMessage: async function(){
        const msg = await executeQuery(`SELECT clm.*,collab.name, collab.family_name,collab.family_name, collab.id_headcargo 
        FROM called_messages clm
        JOIN collaborators collab ON collab.id = clm.collab_id ORDER BY id DESC`);

        return msg
    },
    saveBase64Image: async function(base64String, ticketId) {
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        if (!matches) throw new Error('Formato Base64 inválido');
    
        const ext = matches[1].split('/')[1];
        const data = matches[2];
    
        // Gerar um hash único para a imagem
        const hash = crypto.createHash('sha256').update(data).digest('hex');
    
        // Nome do arquivo baseado no ticketId e no hash da imagem
        const fileName = `${ticketId}_${hash}.${ext}`;
    
        // Ajuste o caminho base para salvar na pasta correta
        const uploadsDir = path.join(__dirname, '../../uploads'); // Ajuste conforme necessário
        const filePath = path.join(uploadsDir, fileName);
    
        // Verificar se o arquivo já existe
        try {
            await fs.access(filePath, fs.constants.F_OK);
            // Arquivo existe, retornar URL
            return `https://sirius-system.conlinebr.com.br/uploads/${fileName}`;
        } catch (err) {
            // Arquivo não existe, prosseguir para salvar
        }
    
        // Garantir que o diretório 'uploads' exista
        await fs.mkdir(uploadsDir, { recursive: true }); // Criar pasta se não existir
    
        // Salvar o arquivo no servidor
        await fs.writeFile(filePath, Buffer.from(data, 'base64'));
    
        // Retornar o caminho ou URL público da imagem
        return `https://sirius-system.conlinebr.com.br/uploads/${fileName}`;
    },
    createMessage_sendEmails: async function(body, type = 'message'){

     

        // Função para processar e substituir imagens Base64 no texto
        async function processBase64Images(text) {
            // Atualizar a regex para capturar qualquer src com Base64
            const base64Regex = /src="data:image\/(png|jpeg|jpg|gif|bmp);base64,([^"]+)"/gi;
            let match;
            const promises = [];

            while ((match = base64Regex.exec(text)) !== null) {
                const fullMatch = match[0]; // O texto completo que será substituído
                const base64String = `data:image/${match[1]};base64,${match[2]}`; // String completa Base64

                // Salvar imagem e substituir no texto
                const promise = tickets.saveBase64Image(base64String, body.ticketId).then((url) => {
                    text = text.replace(fullMatch, `src="${url}"`); // Substituir pelo URL gerado
                });

                promises.push(promise);
            }

            // Aguarde todas as promessas
            await Promise.all(promises);

            // Verificar se ainda restam imagens Base64 não processadas
            if (base64Regex.test(text)) {
                return processBase64Images(text); // Reaplicar até processar todas
            }

            return text;
        }


        // Realizar as consultas SQL otimizadas
        const messagesByTicket = await executeQuery(`
            SELECT 
                cm.id,
                cm.body,
                cm.create_at,
                cl.name,
                cl.family_name,
                ct.title,
                ct.description,
                rs.email_business AS responsible_email,
                rs.name AS responsible_name,
                rs.family_name AS responsible_family_name
            FROM called_messages cm
            LEFT JOIN collaborators cl ON cl.id = cm.collab_id
            LEFT JOIN called_tickets ct ON ct.id = cm.ticket_id
            LEFT JOIN collaborators rs ON rs.id = ct.collaborator_id
            WHERE cm.ticket_id = ?
            ORDER BY cm.create_at DESC
        `, [body.ticketId]);

        const ByTicket = await executeQuery(`
        SELECT 
        cl.name,
        cl.family_name,
        ct.title,
        ct.description,
        rs.email_business AS responsible_email,
        rs.name AS responsible_name,
        rs.family_name AS responsible_family_name
        FROM called_tickets ct
        LEFT JOIN collaborators cl ON cl.id = ct.collaborator_id
        LEFT JOIN collaborators rs ON rs.id = ct.collaborator_id
        WHERE ct.id = ?
        `, [body.ticketId]);
    
        // Gerar HTML otimizado
        const allMessages = messagesByTicket.map((msg, index) => {
            const font = index === 0 ? 'bold' : 'normal';
            const formattedDate = new Date(msg.create_at).toLocaleString("pt-BR", {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
    
            return `
                <tr>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        <h6 style="margin: 0px; font-weight: ${font}">Remetente:</h6>
                        <h4 style="margin: 0px; font-weight: ${font}">${msg.name} ${msg.family_name}</h4>
                    </td>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        <h6 style="margin: 0px; font-weight: ${font}">Data:</h6>
                        <h4 style="margin: 0px; font-weight: ${font}">${formattedDate}</h4>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="font-weight: ${font}; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        ${msg.body.replace(/\n/g, '<br>')}
                    </td>
                </tr>`;
        }).join('');

  
      // Uso na função principal
        let description = ByTicket[0] ? await processBase64Images(ByTicket[0].description) : '';

    
        // Construir o corpo do e-mail
        const mailBody = `
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
                        <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${ByTicket[0].responsible_name} ${ByTicket[0].responsible_family_name}</td>
                    </tr>
                    <tr>
                        <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                        <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${ByTicket[0].title}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                            <h5 style="margin: 0px; margin-bottom: 10px; font-weight: bold">Detalhes do Chamado:</h5>
                            <h4 style="margin: 0px; font-weight: bold">${(description).replace(/\n/g, '<br>')}</h4>
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
            </div>`;

            if(type == 'message'){
                // Enviar e-mails somente quando necessário
                if (
                    messagesByTicket[0].name !== messagesByTicket[0].responsible_name || 
                    messagesByTicket[0].family_name !== messagesByTicket[0].responsible_family_name
                ) {
                    sendEmail(
                        messagesByTicket[0].responsible_email, 
                        '[Sirius System] Viemos com atualizações 🫡', 
                        mailBody
                    );
                }

                sendEmail(
                    'ti@conlinebr.com.br', 
                    '[Sirius System] Viemos com atualizações 🫡', 
                    mailBody
                );
            } else if(type == 'open'){
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const dia = String(hoje.getDate()).padStart(2, '0');
                const horas = String(hoje.getHours()).padStart(2, '0');
                const minutos = String(hoje.getMinutes()).padStart(2, '0');
        
                const dataHoraFormatada = `${ano}-${mes}-${dia} - ${horas}:${minutos}`;
                const dataHoraFormatadaBR = `${dia}-${mes}-${ano} - ${horas}:${minutos}`;

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
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${ByTicket[0].title}</td>
                        </tr>
                        <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(description).replace(/\n/g, '<br>')}</td>
                        </tr>
                        <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Data da Abertura:</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${dataHoraFormatadaBR}</td>
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
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${ByTicket[0].name} ${ByTicket[0].family_name}</td>
                        </tr>
                        <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${ByTicket[0].title}</td>
                        </tr>
                        <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(description).replace(/\n/g, '<br>')}</td>
                        </tr>
                        <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Data da Abertura:</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${dataHoraFormatadaBR}</td>
                        </tr>
                        </table>
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">Boa sorte desde já! 🤠</p>
                    </div>
                    <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                        <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                    </div>
                </div>`

                sendEmail(ByTicket[0].responsible_email, '[Sirius System] Seu pedido foi registrado! 🎉', userBody);
                sendEmail('ti@conlinebr.com.br', '[Sirius System] Um novo chamado foi aberto!', devBody);


            }
    
        
    },
    createMessage: async function (body) {

        const date = new Date();
        console.time('createMessage')
        // Inserir a nova mensagem no banco de dados
        const addMsg = await executeQuery(
            'INSERT INTO called_messages (ticket_id, body, create_at, collab_id) VALUES (?, ?, ?, ?)',
            [body.ticketId, body.body, date, body.collab_id]
        );
   
        this.createMessage_sendEmails(body);

        // Retornar a mensagem criada
        const msg = await executeQuery(`
            SELECT clm.*, collab.name, collab.family_name, collab.id_headcargo 
            FROM called_messages clm
            JOIN collaborators collab ON collab.id = clm.collab_id 
            WHERE clm.id = ?
        `, [addMsg.insertId]);


        console.timeEnd('createMessage')

        return {
            colab_name: tickets.formatarNome(msg[0].name),
            colab_id: body.collab_id,
            id: addMsg.insertId,
            date: date,
            ticketId:body.ticketId,
            default_msg: msg[0],
        };
    },
    removeTicket: async function(id){

        await executeQuery(`DELETE FROM called_assigned_relations WHERE (ticket_id = ${id})`);
        await executeQuery(`DELETE FROM called_ticket_categories WHERE (ticket_id = ${id})`);
        await executeQuery(`DELETE FROM called_tickets WHERE (id = ${id})`);

        return true
        
    },
    uploadFileTicket: async function (ticketId, Files) {
        // console.log(Files)
        // Recupera os dados atuais do ticket
        let currentTicket = await this.getById(ticketId); // Certifique-se de que `getById` está implementado
        currentTicket = currentTicket[0]
      
        // Verifica se há arquivos atuais
        let currentFiles = [];
        if (currentTicket && currentTicket.files) {
            currentFiles = currentTicket.files
        }
   
    
        // Prepara os novos dados de arquivos
        let newFilesData = [];
        if (Files && Files.length > 0) {
            newFilesData = Files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                path: file.path,
                size: file.size
            }));
        }

        // console.log(newFilesData.length, newFilesData)
    
        // Combina os dados atuais com os novos dados de arquivos
        const combinedFiles = [...currentFiles, ...newFilesData];
    
        // Monta a query SQL para atualizar os arquivos do ticket
        const sql = `UPDATE called_tickets SET files = ? WHERE id = ?`;
    
        const values = [
            JSON.stringify(combinedFiles),
            ticketId
        ];
    
        try {
            // Executa a query SQL
            await executeQuery(sql, values);
            return newFilesData; // Retorna os arquivos combinados para exibição no frontend
        } catch (error) {
            throw new Error('Erro ao atualizar os arquivos no banco de dados.');
        }
    },
    removeFileFromTicket: async function (ticketId, filename) {
        // Recupera os dados atuais do ticket
        let currentTicket = await this.getById(ticketId); // Certifique-se de que `getById` está implementado
        currentTicket = currentTicket[0];
    
        if (!currentTicket || !currentTicket.files) {
            throw new Error('Ticket ou arquivos não encontrados.');
        }
    
        // Filtra os arquivos, removendo o arquivo especificado
        const updatedFiles = currentTicket.files.filter(file => file.filename !== filename);
    
        // Atualiza o banco de dados com os arquivos restantes
        const sql = `UPDATE called_tickets SET files = ? WHERE id = ?`;
        const values = [
            JSON.stringify(updatedFiles),
            ticketId
        ];
    
        try {
            await executeQuery(sql, values);
    
            // Opcional: Remova o arquivo do sistema de arquivos
            const fileToRemove = currentTicket.files.find(file => file.filename === filename);
            if (fileToRemove) {
                const fs = require('fs');
                fs.unlink(fileToRemove.path, (err) => {
                    if (err) console.error('Erro ao remover o arquivo do sistema de arquivos:', err);
                });
            }
    
            return {ticketId, filename};
        } catch (error) {
            throw new Error('Erro ao remover o arquivo no banco de dados.');
        }
    },
    teamByTicket: async function(id){
        const team = await executeQuery(`SELECT car.*, collab.name, collab.family_name, collab.id_headcargo FROM called_assigned_relations car
        JOIN collaborators collab ON collab.id = car.collaborator_id WHERE ticket_id = ${id}`);

        return team
    },
    updateTeam: async function(value){
        await executeQuery(`DELETE FROM called_assigned_relations WHERE (ticket_id = ${value.ticketId})`);
        
        for (let index = 0; index < value.teamIds.length; index++) {
            const element = value.teamIds[index];
            await executeQuery(
                'INSERT INTO called_assigned_relations (ticket_id, collaborator_id) VALUES (?, ?)',
                [value.ticketId, element]
            );
        }

        const atribuido = await executeQuery(`SELECT car.*, collab.name,collab.family_name,collab.family_name, collab.id_headcargo FROM called_assigned_relations car
        JOIN collaborators collab ON collab.id = car.collaborator_id WHERE ticket_id = ${value.ticketId}`);

        return atribuido
    },
    createTicket: async function(data) {
        try {
            const { formData, files } = data;
    
            // Desestruturar os campos do formulário
            const responsible = JSON.parse(formData.responsible);
            const priority = JSON.parse(formData.priority);
            const categories = JSON.parse(formData.categories);
            const involved = JSON.parse(formData.involved);
            const title = formData.title;
            const description = formData.description;
    
            // Exemplo de estrutura para salvar os dados no banco
            const ticket = {
                responsibleId: responsible.id,
                responsibleName: responsible.name,
                priorityId: priority.id,
                priorityName: priority.name,
                categoryId: categories.id,
                categoryName: categories.name,
                title: title,
                description: description,
                involvedUsers: involved.map(user => ({ id: user.id, name: user.name })),
                createdAt: new Date(),
            };

            // Processar arquivos enviados
            const uploadedFiles = files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                path: file.path,
                size: file.size
            }));
    
            const result = await executeQuery(
                'INSERT INTO called_tickets (title, status, description, collaborator_id, start_forecast, end_forecast, finished_at, approved_at, priority, files) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [ticket.title, 'new-tasks-draggable', ticket.description, ticket.responsibleId, null, null, null, null, ticket.priorityId, JSON.stringify(uploadedFiles)]
              );
            await executeQuery(
                'INSERT INTO called_ticket_categories (ticket_id, category_id) VALUES (?, ?)',
                [result.insertId, ticket.categoryId]
                );

            const tiList = await executeQuery(`
                SELECT *
                FROM departments_relations
                WHERE department_id = 7`);

            for (let index = 0; index < tiList.length; index++) {
                await executeQuery(
                    'INSERT INTO called_assigned_relations (ticket_id, collaborator_id) VALUES (?, ?)',
                    [result.insertId, tiList[index].collaborator_id]
                    );
            }

            for (let index = 0; index < ticket.involvedUsers.length; index++) {
                const element = ticket.involvedUsers[index];
                await executeQuery(
                    'INSERT INTO called_tickets_involved (ticket_id, collaborator_id) VALUES (?, ?)',
                    [result.insertId, element.id]
                );
            }
    
            this.createMessage_sendEmails({ticketId:result.insertId}, 'open');
            return { message: 'Chamado criado com sucesso', ticket, uploadedFiles };
        } catch (error) {
            console.error('Erro ao criar chamado:', error);
            throw error;
        }
    },
    create: async function(value){
        // FUNÇÃO ANTIGA NÃO UTILIZAR AGORA A NOVA SE CHAMA CREATETICKET
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
        const dataHoraFormatadaBR = `${dia}-${mes}-${ano} - ${horas}:${minutos}`;

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
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(value.description).replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Data da Abertura:</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${dataHoraFormatadaBR}</td>
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
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(userDescription).replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Data da Abertura:</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${dataHoraFormatadaBR}</td>
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
    removeAssigned: async function(AssignedId){
        const result = await executeQuery(
            'DELETE FROM called_assigned_relations WHERE id = ?',
            [AssignedId]
        );

        return result;
    },
    deleteStepStatus: async function(stepId){
        const result = await executeQuery(
            'DELETE FROM called_ticket_steps WHERE id = ?',
            [stepId]
        );

        return result;
    },
    updateStepStatus: async function(stepId, status){
        const result = await executeQuery(
            'UPDATE called_ticket_steps SET status = ? WHERE id = ?',
            [status, stepId]
        );

        return result;
    },
    createStep: async function(ticketId, step){
        const result = await executeQuery(
            'INSERT INTO called_ticket_steps (call_id, step_name) VALUES (?, ?)',
            [ticketId, step]
            );

            return result;
    },
    changeColumn: async function (column, value, ticketId) {
        if (column === 'categories_id') {
            // Atualiza a categoria do ticket na tabela called_ticket_categories
            const result = await executeQuery(
                'UPDATE called_ticket_categories SET category_id = ? WHERE ticket_id = ?',
                [value, ticketId]
            );
    
            return result;
        } else if (column === 'called_tickets_involved') {
    
            // Remove os colaboradores existentes para o ticket
            await executeQuery(
                'DELETE FROM called_tickets_involved WHERE ticket_id = ?',
                [ticketId]
            );
    
            if(Array.isArray(value)){
                // Insere os novos colaboradores
                const insertPromises = value.map(collaboratorId =>
                    executeQuery(
                        'INSERT INTO called_tickets_involved (ticket_id, collaborator_id) VALUES (?, ?)',
                        [ticketId, collaboratorId]
                    )
                );

                const insertResults = await Promise.all(insertPromises);
            }
           
    
            
    
            return true;
        } else {
            // Atualiza a coluna na tabela called_tickets
            const result = await executeQuery(
                `UPDATE called_tickets SET ${column} = ? WHERE id = ?`,
                [value, ticketId]
            );
    
            return result;
        }
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
    updateStartForecast: async function (id, date) {
        
        if (date == ''){
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            const horas = String(hoje.getHours()).padStart(2, '0');
            const minutos = String(hoje.getMinutes()).padStart(2, '0');
            
            date = `${ano}-${mes}-${dia} ${horas}:${minutos}`;
        }

        const newDate = new Date(date);
        const day = String(newDate.getDate()).padStart(2, '0');
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const year = newDate.getFullYear();
        const hours = String(newDate.getHours()).padStart(2, '0');
        const minutes = String(newDate.getMinutes()).padStart(2, '0');

        let dateString = `${day}-${month}-${year} ${hours}:${minutes}`;

        await executeQuery(`UPDATE called_tickets SET start_forecast = '${date}' WHERE id = ${id}`);

        const responsibleData = await executeQuery(`
            SELECT ct.*, usr.email
            FROM called_tickets ct
            LEFT OUTER JOIN users usr on usr.collaborator_id = ct.collaborator_id
            WHERE ct.id = ${id}`);

        let mailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Verificando...</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Já estamos pensando em como resolver seu problema 🕵️</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">E já trouxemos uma data prevista para dar início a este pedido.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${responsibleData[0].title}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(responsibleData[0].description).replace(/\n/g, '<br>')}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Previsão de Início:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${dateString}</td>
                    </tr>
                    </table>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`
    
            await sendEmail(responsibleData[0].email, '[Sirius System] Chamado em análise! ', mailBody);

        return true;
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

        const newDate = new Date(date);
        const day = String(newDate.getDate()).padStart(2, '0');
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const year = newDate.getFullYear();
        const hours = String(newDate.getHours()).padStart(2, '0');
        const minutes = String(newDate.getMinutes()).padStart(2, '0');

        let dateString = `${day}-${month}-${year} ${hours}:${minutes}`;

        await executeQuery(`UPDATE called_tickets SET end_forecast = '${date}' WHERE id = ${id}`);

        const responsibleData = await executeQuery(`
            SELECT ct.*, usr.email
            FROM called_tickets ct
            LEFT OUTER JOIN users usr on usr.collaborator_id = ct.collaborator_id
            WHERE ct.id = ${id}`);

        let mailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Mãos à obra!</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Estamos trabalhando no seu chamado 👷</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">E já trouxemos uma data prevista para finalizar essa missão.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Assunto do Chamado:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${responsibleData[0].title}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Descrição do Pedido:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(responsibleData[0].description).replace(/\n/g, '<br>')}</td>
                    </tr>
                    <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Previsão de Conclusão:</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${dateString}</td>
                    </tr>
                    </table>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`
    
            await sendEmail(responsibleData[0].email, '[Sirius System] Chamado em andamento! 🤩', mailBody);

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
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${ (responsibleData[0].description).replace(/\n/g, '<br>')}</td>
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
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(responsibleData[0].description).replace(/\n/g, '<br>')}</td>
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
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(responsibleData[0].description).replace(/\n/g, '<br>')}</td>
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
                    <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">${(pendingTickets[index].description).replace(/\n/g, '<br>')}</td>
                    </tr>
                    </table>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`
            console.log('Ticket:', pendingTickets[index].id, pendingTickets[index].email_business);
            const teste = await sendEmail(pendingTickets[index].email_business, '[Sirius System] Seguimos no aguardo da sua aprovação! 🫠', mailBody);
            if (teste.success == true) {
                await executeQuery(`UPDATE called_tickets SET review_notification = DATE_SUB(CURDATE(), INTERVAL 6 DAY) WHERE id = ${pendingTickets[index].id}`);
            }
        }
        return true;
    },
    notificateExpiringTickets: async function(){
        // const today = new Date();
        // const weekDay = today.getDay();
        // if (weekDay != 1){
        //     return false;
        // }

        const pendingTickets = await executeQuery(`
            SELECT *
            FROM pending_tickets
            WHERE date = DATE(NOW())`);

        const expiringTickets = await executeQuery(`
            SELECT *
            FROM siriusDBO.called_tickets
            WHERE status NOT LIKE '%completed%'
            AND status NOT LIKE '%progress%'
            AND status NOT LIKE '%review%'
            AND week(end_forecast) = week(now())
            ORDER BY end_forecast`);

        const startingTickets = await executeQuery(`
            SELECT *
            FROM siriusDBO.called_tickets
            WHERE status NOT LIKE '%completed%'
            AND status NOT LIKE '%progress%'
            AND status NOT LIKE '%review%'
            AND week(start_forecast) = week(now())
            ORDER BY start_forecast`);

        const ticketsByDev = await executeQuery(`
            SELECT ct.id, ct.title, ct.priority, rp.name as 'resp_name', rp.family_name as 'resp_family_name',
            cl.name, cl.family_name, cl.email_business, ct.end_forecast, cr.collaborator_id
            FROM called_tickets ct
            LEFT OUTER JOIN called_assigned_relations cr on cr.ticket_id = ct.id
            LEFT OUTER JOIN collaborators cl on cl.id = cr.collaborator_id
            LEFT OUTER JOIN collaborators rp on rp.id = ct.collaborator_id
            WHERE status LIKE '%progress%'
            ORDER BY cr.collaborator_id
            AND ct.end_forecast`);

        if (pendingTickets.length != 0) {
            return;
        }
        await executeQuery(`
                INSERT INTO pending_tickets (expiringTickets, startingTickets, progressTickets, date)
                VALUES (${expiringTickets.length}, ${startingTickets.length}, ${ticketsByDev.length}, DATE(NOW()))`
            );

        const devTeam = await executeQuery(`
            SELECT *
            FROM departments_relations
            WHERE department_id = 7`);

        let expiringLine = '';
        for (let index = 0; index < expiringTickets.length; index++) {
            const formattedTitle = expiringTickets[index].title.charAt(0).toUpperCase() + expiringTickets[index].title.slice(1).toLowerCase();
            const formattedDate = new Date(expiringTickets[index].end_forecast).toLocaleString("pt-BR", {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            expiringLine += `
                <tr>
                    <td style="width: 75%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        <h6 style="margin: 0px;">Título:</h6>
                        <h4 style="margin: 0px; font-weight: normal;">${formattedTitle}</h4>
                    </td>
                    <td style="width: 25%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        <h6 style="margin: 0px;">Previsão de Conclusão:</h6>
                        <h4 style="margin: 0px; font-weight: normal;">${formattedDate}</h4>
                    </td>
                </tr>`;
        }

        let startingLine = '';
        for (let index = 0; index < startingTickets.length; index++) {
            const formattedTitle = startingTickets[index].title.charAt(0).toUpperCase() + startingTickets[index].title.slice(1).toLowerCase();
            const formattedDate = new Date(startingTickets[index].start_forecast).toLocaleString("pt-BR", {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            startingLine += `
                <tr>
                    <td style="width: 75%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        <h6 style="margin: 0px;">Título:</h6>
                        <h4 style="margin: 0px; font-weight: normal;">${formattedTitle}</h4>
                    </td>
                    <td style="width: 25%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                        <h6 style="margin: 0px;">Previsão de Início:</h6>
                        <h4 style="margin: 0px; font-weight: normal;">${formattedDate}</h4>
                    </td>
                </tr>`;
        }

        let devBody = '';
        for (let i = 0; i < devTeam.length; i++) {
            let assignedLine = '';
            let devLine = '';
            for (let index = 0; index < ticketsByDev.length; index++) {
                if (ticketsByDev[index].collaborator_id == devTeam[i].collaborator_id) {
                    devLine = `
                        <tr>
                            <td colspan="2" style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h4 style="margin: 0px;">Chamados em andamento - ${ticketsByDev[index].name} ${ticketsByDev[index].family_name}</h4>
                            </td>
                        </tr>`
                    const formattedTitle = ticketsByDev[index].title.charAt(0).toUpperCase() + ticketsByDev[index].title.slice(1).toLowerCase();
                    const formattedDate = new Date(ticketsByDev[index].end_forecast).toLocaleString("pt-BR", {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                    assignedLine += `
                        <tr>
                            <td style="width: 75%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h6 style="margin: 0px;">Título:</h6>
                                <h4 style="margin: 0px; font-weight: normal;">${formattedTitle}</h4>
                            </td>
                            <td style="width: 25%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h6 style="margin: 0px;">Previsão de Conclusão:</h6>
                                <h4 style="margin: 0px; font-weight: normal;">${formattedDate}</h4>
                            </td>
                        </tr>`;
                }
            }
            devBody += `${devLine} ${assignedLine} <br>`;
        }

        const mailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Tickets da Semana</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Estes são alguns dos chamados em aberto. 🤯</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Os que devemos iniciar ou concluir essa semana e os que estão em andamento:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td colspan="2" style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h4 style="margin: 0px;">Chamados para começar essa semana:</h4>
                            </td>
                        </tr>
                        ${startingLine}
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td colspan="2" style="padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                <h4 style="margin: 0px;">Chamados para concluir essa semana:</h4>
                            </td>
                        </tr>
                        ${expiringLine}
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    ${devBody}
                    </table>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`;

        await sendEmail('ti@conlinebr.com.br', '[Sirius System] Só um lembrete 💭', mailBody);
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
    getAverageCompletionTimeByCategory: async function(){
        try {
            const result = await executeQuery(`
                SELECT 
                    cc.name as category_name,
                    cc.id as category_id,
                    COUNT(ct.id) as total_tickets,
                    COUNT(CASE WHEN ct.status = 'completed-tasks-draggable' THEN 1 END) as completed_tickets,
                    AVG(CASE 
                        WHEN ct.status = 'completed-tasks-draggable' THEN
                            CASE 
                                WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                                    TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                                WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167 -- 10 minutos em horas
                                ELSE NULL 
                            END
                        ELSE NULL 
                    END) as avg_completion_hours,
                    AVG(CASE 
                        WHEN ct.status = 'completed-tasks-draggable' THEN
                            CASE 
                                WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                                    TIMESTAMPDIFF(DAY, ct.start_forecast, ct.end_forecast)
                                WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.007 -- 10 minutos em dias
                                ELSE NULL 
                            END
                        ELSE NULL 
                    END) as avg_completion_days
                FROM called_tickets ct
                JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
                JOIN called_categories cc ON cc.id = ctc.category_id
                GROUP BY cc.id, cc.name
                HAVING completed_tickets > 0
                ORDER BY avg_completion_hours ASC
            `);

            return result.map(item => ({
                category: item.category_name,
                categoryId: item.category_id,
                totalTickets: item.total_tickets,
                completedTickets: item.completed_tickets,
                avgCompletionHours: Math.round((item.avg_completion_hours || 0) * 100) / 100,
                avgCompletionDays: Math.round((item.avg_completion_days || 0) * 100) / 100,
                completionRate: item.total_tickets > 0 ? Math.round((item.completed_tickets / item.total_tickets) * 100) : 0
            }));
        } catch (error) {
            console.error('Erro ao calcular tempo médio por categoria:', error);
            throw error;
        }
    },
    getProjectsAnalysisByYear: async function(year = 2024){
        try {
            const result = await executeQuery(`
                SELECT 
                    MONTH(ct.created_at) as month,
                    CASE MONTH(ct.created_at)
                        WHEN 1 THEN 'Janeiro'
                        WHEN 2 THEN 'Fevereiro'
                        WHEN 3 THEN 'Marco'
                        WHEN 4 THEN 'Abril'
                        WHEN 5 THEN 'Maio'
                        WHEN 6 THEN 'Junho'
                        WHEN 7 THEN 'Julho'
                        WHEN 8 THEN 'Agosto'
                        WHEN 9 THEN 'Setembro'
                        WHEN 10 THEN 'Outubro'
                        WHEN 11 THEN 'Novembro'
                        WHEN 12 THEN 'Dezembro'
                    END as month_name,
                    cc.name as category_name,
                    COUNT(ct.id) as total_tickets
                FROM called_tickets ct
                LEFT JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
                LEFT JOIN called_categories cc ON cc.id = ctc.category_id
                WHERE YEAR(ct.created_at) = ?
                GROUP BY MONTH(ct.created_at), cc.name
                ORDER BY month ASC, total_tickets DESC
            `, [year]);

            // Organizar dados por mês e categoria
            const monthlyData = {};
            const categories = new Set();
            
            result.forEach(item => {
                const month = item.month;
                const category = item.category_name || 'Sem Categoria';
                
                categories.add(category);
                
                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        month: month,
                        monthName: item.month_name,
                        totalTickets: 0,
                        categories: {}
                    };
                }
                
                monthlyData[month].totalTickets += parseInt(item.total_tickets);
                monthlyData[month].categories[category] = parseInt(item.total_tickets);
            });

            return {
                monthlyData: Object.values(monthlyData),
                categories: Array.from(categories).sort(),
                year: year
            };
        } catch (error) {
            console.error('Erro ao buscar dados de análise de projetos:', error);
            throw error;
        }
    },
    getCompletionTimeTargetByCategory: async function(year = 2024){
        try {
            // Calcular o tempo médio real por mês no ano selecionado (geral, não por categoria)
            const actualResult = await executeQuery(`
                SELECT 
                    MONTH(ct.finished_at) as month,
                    CASE MONTH(ct.finished_at)
                        WHEN 1 THEN 'Janeiro'
                        WHEN 2 THEN 'Fevereiro'
                        WHEN 3 THEN 'Marco'
                        WHEN 4 THEN 'Abril'
                        WHEN 5 THEN 'Maio'
                        WHEN 6 THEN 'Junho'
                        WHEN 7 THEN 'Julho'
                        WHEN 8 THEN 'Agosto'
                        WHEN 9 THEN 'Setembro'
                        WHEN 10 THEN 'Outubro'
                        WHEN 11 THEN 'Novembro'
                        WHEN 12 THEN 'Dezembro'
                    END as month_name,
                    AVG(CASE 
                        WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                            TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167 -- 10 minutos em horas
                        ELSE NULL 
                    END) as actual_hours,
                    COUNT(ct.id) as completed_tickets
                FROM called_tickets ct
                WHERE YEAR(ct.finished_at) = ? 
                AND ct.status = 'completed-tasks-draggable'
                AND ct.finished_at IS NOT NULL
                GROUP BY MONTH(ct.finished_at)
                HAVING completed_tickets > 0
                ORDER BY month ASC
            `, [year]);

            // Calcular dados detalhados por categoria para o tooltip
            const categoryDetailsResult = await executeQuery(`
                SELECT 
                    MONTH(ct.finished_at) as month,
                    COALESCE(cc.name, 'Sem Categoria') as category_name,
                    AVG(CASE 
                        WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                            TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167 -- 10 minutos em horas
                        ELSE NULL 
                    END) as category_hours,
                    COUNT(ct.id) as category_tickets
                FROM called_tickets ct
                LEFT JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
                LEFT JOIN called_categories cc ON cc.id = ctc.category_id
                WHERE YEAR(ct.finished_at) = ? 
                AND ct.status = 'completed-tasks-draggable'
                AND ct.finished_at IS NOT NULL
                AND cc.name IS NOT NULL
                AND cc.name != ''
                GROUP BY MONTH(ct.finished_at), cc.name
                HAVING category_tickets > 0
                ORDER BY month ASC, category_tickets DESC
            `, [year]);

            // Calcular meta adaptativa para cada mês (média histórica + fator de crescimento)
            const monthlyTargets = [];
            for (let month = 1; month <= 12; month++) {
                if (actualResult.some(item => item.month === month)) {
                    // 1. Calcular média histórica dos meses anteriores
                    const avgResult = await executeQuery(`
                        SELECT 
                            AVG(CASE 
                                WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                                    TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                                WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167 -- 10 minutos em horas
                                ELSE NULL 
                            END) as avg_hours,
                            COUNT(ct.id) as total_tickets
                        FROM called_tickets ct
                        WHERE ct.status = 'completed-tasks-draggable'
                        AND ct.finished_at IS NOT NULL
                        AND YEAR(ct.finished_at) = ?
                        AND MONTH(ct.finished_at) < ?
                    `, [year, month]);
                    
                    const avgHours = parseFloat(avgResult[0]?.avg_hours || 0);
                    const totalTickets = parseInt(avgResult[0]?.total_tickets || 0);
                    
                    // 2. Calcular crescimento de volume (do início do ano até o mês anterior)
                    let growthFactor = 0;
                    let currentMonthTickets = 0;
                    let avgTicketsPerMonth = 0;
                    
                    if (totalTickets > 0 && month > 1) {
                        // Buscar tickets do mês atual para comparação
                        const growthResult = await executeQuery(`
                            SELECT 
                                COUNT(ct.id) as current_month_tickets
                            FROM called_tickets ct
                            WHERE ct.status = 'completed-tasks-draggable'
                            AND ct.finished_at IS NOT NULL
                            AND YEAR(ct.finished_at) = ?
                            AND MONTH(ct.finished_at) = ?
                        `, [year, month]);
                        
                        currentMonthTickets = parseInt(growthResult[0]?.current_month_tickets || 0);
                        
                        if (currentMonthTickets > 0) {
                            // Calcular média de tickets por mês do início do ano até o mês anterior
                            avgTicketsPerMonth = totalTickets / (month - 1);
                            
                            // Calcular fator de crescimento (limitado a 50% para evitar metas irrealistas)
                            const growthPercent = (currentMonthTickets - avgTicketsPerMonth) / avgTicketsPerMonth;
                            growthFactor = Math.min(Math.max(growthPercent * 0.3, -0.2), 0.5); // Limita entre -20% e +50%
                        }
                    }
                    
                    // 3. Calcular meta adaptativa
                    const adaptiveTarget = avgHours * (1 + growthFactor);
                    
                    monthlyTargets.push({
                        month: month,
                        targetHours: adaptiveTarget,
                        avgHours: avgHours,
                        growthFactor: growthFactor,
                        totalTickets: totalTickets,
                        currentMonthTickets: currentMonthTickets,
                        avgTicketsPerMonth: avgTicketsPerMonth
                    });
                }
            }

            // Calcular meta adaptativa por categoria (média histórica + fator de crescimento)
            const categoryTargets = {};
            const uniqueCategories = [...new Set(categoryDetailsResult.map(item => item.category_name))];
            
            for (const category of uniqueCategories) {
                // Para cada categoria, calcular a meta adaptativa baseada nos meses anteriores do ano atual
                const categoryAvgResult = await executeQuery(`
                    SELECT 
                        AVG(CASE 
                            WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                                TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                            WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167 -- 10 minutos em horas
                            ELSE NULL 
                        END) as category_avg_hours,
                        COUNT(ct.id) as category_total_tickets
                    FROM called_tickets ct
                    LEFT JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
                    LEFT JOIN called_categories cc ON cc.id = ctc.category_id
                    WHERE ct.status = 'completed-tasks-draggable'
                    AND ct.finished_at IS NOT NULL
                    AND cc.name = ?
                    AND YEAR(ct.finished_at) = ?
                    AND MONTH(ct.finished_at) < (
                        SELECT MAX(MONTH(finished_at)) 
                        FROM called_tickets 
                        WHERE YEAR(finished_at) = ? 
                        AND status = 'completed-tasks-draggable'
                    )
                `, [category, year, year]);
                
                const categoryAvgHours = parseFloat(categoryAvgResult[0]?.category_avg_hours || 0);
                const categoryTotalTickets = parseInt(categoryAvgResult[0]?.category_total_tickets || 0);
                
                // Calcular fator de crescimento para a categoria (simplificado - usa fator geral)
                let categoryGrowthFactor = 0;
                if (categoryTotalTickets > 0) {
                    // Usar o fator de crescimento médio dos meses com dados
                    const monthsWithData = monthlyTargets.filter(mt => mt.growthFactor !== 0);
                    if (monthsWithData.length > 0) {
                        categoryGrowthFactor = monthsWithData.reduce((sum, mt) => sum + mt.growthFactor, 0) / monthsWithData.length;
                    }
                }
                
                // Calcular meta adaptativa por categoria
                const categoryAdaptiveTarget = categoryAvgHours * (1 + categoryGrowthFactor);
                
                categoryTargets[category] = categoryAdaptiveTarget;
            }

            // Organizar dados gerais por mês com metas específicas por mês
            const monthlyData = [];
            actualResult.forEach(item => {
                const monthTarget = monthlyTargets.find(mt => mt.month === item.month);
                const targetHours = monthTarget ? monthTarget.targetHours : 0;
                
                monthlyData.push({
                    month: item.month,
                    monthName: item.month_name,
                    actualHours: parseFloat(item.actual_hours),
                    targetHours: targetHours,
                    completedTickets: parseInt(item.completed_tickets),
                    growthFactor: monthTarget ? monthTarget.growthFactor : 0,
                    totalTickets: monthTarget ? monthTarget.totalTickets : 0,
                    currentMonthTickets: monthTarget ? monthTarget.currentMonthTickets : 0,
                    avgTicketsPerMonth: monthTarget ? monthTarget.avgTicketsPerMonth : 0,
                    categories: {}
                });
            });
            
            // Adicionar detalhes por categoria
            for (const item of categoryDetailsResult) {
                const monthData = monthlyData.find(m => m.month === item.month);
                                    if (monthData) {
                        const categoryName = item.category_name && item.category_name.trim() !== '' ? item.category_name : 'Sem Categoria';
                    const categoryTarget = categoryTargets[categoryName] || monthData.targetHours;
                    
                    // Calcular fator de crescimento para a categoria específica
                    let categoryGrowthFactor = 0;
                    let categoryAvgHours = 0;
                    
                    if (categoryTargets[categoryName]) {
                        // Buscar dados históricos da categoria para calcular média e crescimento
                        const categoryHistoryResult = await executeQuery(`
                            SELECT 
                                AVG(CASE 
                                    WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                                        TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                                    WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167
                                    ELSE NULL 
                                END) as category_avg_hours,
                                COUNT(ct.id) as category_total_tickets
                            FROM called_tickets ct
                            LEFT JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
                            LEFT JOIN called_categories cc ON cc.id = ctc.category_id
                            WHERE ct.status = 'completed-tasks-draggable'
                            AND ct.finished_at IS NOT NULL
                            AND cc.name = ?
                            AND YEAR(ct.finished_at) = ?
                            AND MONTH(ct.finished_at) < ?
                        `, [categoryName, year, item.month]);
                        
                        categoryAvgHours = parseFloat(categoryHistoryResult[0]?.category_avg_hours || 0);
                        const categoryTotalTickets = parseInt(categoryHistoryResult[0]?.category_total_tickets || 0);
                        
                        if (categoryTotalTickets > 0 && categoryAvgHours > 0) {
                            // Calcular fator de crescimento da categoria
                            const avgTicketsPerMonth = categoryTotalTickets / (item.month - 1);
                            const currentMonthTickets = parseInt(item.category_tickets);
                            
                            if (avgTicketsPerMonth > 0) {
                                const growthPercent = (currentMonthTickets - avgTicketsPerMonth) / avgTicketsPerMonth;
                                categoryGrowthFactor = Math.min(Math.max(growthPercent * 0.3, -0.2), 0.5);
                            }
                        }
                    }
                    
                    monthData.categories[categoryName] = {
                        hours: parseFloat(item.category_hours),
                        tickets: parseInt(item.category_tickets),
                        targetHours: categoryTarget,
                        avgHours: categoryAvgHours,
                        growthFactor: categoryGrowthFactor
                    };
                }
            }

            return {
                monthlyData: monthlyData,
                targetHours: 0, // Não mais usado, cada mês tem sua própria meta
                categoryTargets: categoryTargets,
                year: year
            };
        } catch (error) {
            console.error('Erro ao buscar dados de meta vs realizado:', error);
            throw error;
        }
    },
    getAvailableYears: async function(){
        try {
            const result = await executeQuery(`
                SELECT DISTINCT YEAR(ct.finished_at) as year
                FROM called_tickets ct
                WHERE ct.status = 'completed-tasks-draggable'
                AND ct.finished_at IS NOT NULL
                ORDER BY year DESC
            `);
            
            return result.map(item => item.year);
        } catch (error) {
            console.error('Erro ao buscar anos disponíveis:', error);
            throw error;
        }
    },
    getCompletionTimeByMonthAndCategory: async function(year = 2024){
        try {
            const result = await executeQuery(`
                SELECT 
                    MONTH(ct.finished_at) as month,
                    CASE MONTH(ct.finished_at)
                        WHEN 1 THEN 'Janeiro'
                        WHEN 2 THEN 'Fevereiro'
                        WHEN 3 THEN 'Março'
                        WHEN 4 THEN 'Abril'
                        WHEN 5 THEN 'Maio'
                        WHEN 6 THEN 'Junho'
                        WHEN 7 THEN 'Julho'
                        WHEN 8 THEN 'Agosto'
                        WHEN 9 THEN 'Setembro'
                        WHEN 10 THEN 'Outubro'
                        WHEN 11 THEN 'Novembro'
                        WHEN 12 THEN 'Dezembro'
                    END as month_name,
                    cc.name as category_name,
                    cc.id as category_id,
                    COUNT(ct.id) as completed_tickets,
                    AVG(CASE 
                        WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                            TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167 -- 10 minutos em horas
                        ELSE NULL 
                    END) as avg_completion_hours
                FROM called_tickets ct
                JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
                JOIN called_categories cc ON cc.id = ctc.category_id
                WHERE ct.status = 'completed-tasks-draggable'
                AND YEAR(ct.finished_at) = ?
                AND ct.finished_at IS NOT NULL
                GROUP BY MONTH(ct.finished_at), cc.id, cc.name
                HAVING completed_tickets > 0
                ORDER BY month ASC, avg_completion_hours ASC
            `, [year]);

            // Organizar dados por mês e categoria
            const monthlyData = {};
            const categories = new Set();
            
            result.forEach(item => {
                const month = item.month;
                const category = item.category_name;
                
                categories.add(category);
                
                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        month: month,
                        monthName: item.month_name,
                        categories: {}
                    };
                }
                
                monthlyData[month].categories[category] = {
                    completedTickets: item.completed_tickets,
                    avgCompletionHours: Math.round((item.avg_completion_hours || 0) * 100) / 100
                };
            });

            return {
                monthlyData: Object.values(monthlyData),
                categories: Array.from(categories).sort(),
                year: year
            };
        } catch (error) {
            console.error('Erro ao buscar dados de tempo por mês e categoria:', error);
            throw error;
        }
    },
    exportCompletionTimeChartData: async function(year = 2024){
        try {
            const result = await executeQuery(`
                SELECT 
                    ct.id,
                    ct.title,
                    cc.name as category_name,
                    ct.start_forecast,
                    ct.end_forecast,
                    ct.created_at,
                    ct.finished_at,
                    MONTH(ct.finished_at) as month,
                    CASE MONTH(ct.finished_at)
                        WHEN 1 THEN 'Janeiro'
                        WHEN 2 THEN 'Fevereiro'
                        WHEN 3 THEN 'Março'
                        WHEN 4 THEN 'Abril'
                        WHEN 5 THEN 'Maio'
                        WHEN 6 THEN 'Junho'
                        WHEN 7 THEN 'Julho'
                        WHEN 8 THEN 'Agosto'
                        WHEN 9 THEN 'Setembro'
                        WHEN 10 THEN 'Outubro'
                        WHEN 11 THEN 'Novembro'
                        WHEN 12 THEN 'Dezembro'
                    END as month_name,
                    CASE 
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 'Sem Previsão'
                        ELSE 'Com Previsão'
                    END as has_forecast,
                    CASE 
                        WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                            TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167 -- 10 minutos em horas
                        ELSE NULL 
                    END as completion_hours,
                    CASE 
                        WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                            TIMESTAMPDIFF(DAY, ct.start_forecast, ct.end_forecast)
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.007 -- 10 minutos em dias
                        ELSE NULL 
                    END as completion_days
                FROM called_tickets ct
                JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
                JOIN called_categories cc ON cc.id = ctc.category_id
                WHERE ct.status = 'completed-tasks-draggable'
                AND YEAR(ct.finished_at) = ?
                AND ct.finished_at IS NOT NULL
                ORDER BY ct.finished_at ASC, cc.name ASC
            `, [year]);

            return result.map(item => ({
                id: item.id,
                title: item.title,
                category: item.category_name,
                month: item.month,
                monthName: item.month_name,
                startForecast: item.start_forecast,
                endForecast: item.end_forecast,
                createdAt: item.created_at,
                finishedAt: item.finished_at,
                hasForecast: item.has_forecast,
                completionHours: Math.round((item.completion_hours || 0) * 100) / 100,
                completionDays: Math.round((item.completion_days || 0) * 100) / 100
            }));
        } catch (error) {
            console.error('Erro ao exportar dados do gráfico:', error);
            throw error;
        }
    },
    exportAverageCompletionTimeDetails: async function(){
        try {
            const result = await executeQuery(`
                SELECT 
                    ct.id,
                    ct.title,
                    cc.name as category_name,
                    ct.start_forecast,
                    ct.end_forecast,
                    ct.created_at,
                    ct.finished_at,
                    CASE 
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 'Sem Previsão'
                        ELSE 'Com Previsão'
                    END as has_forecast,
                    CASE 
                        WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                            TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167 -- 10 minutos em horas
                        ELSE NULL 
                    END as completion_hours,
                    CASE 
                        WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                            TIMESTAMPDIFF(DAY, ct.start_forecast, ct.end_forecast)
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.007 -- 10 minutos em dias
                        ELSE NULL 
                    END as completion_days
                FROM called_tickets ct
                JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
                JOIN called_categories cc ON cc.id = ctc.category_id
                WHERE ct.status = 'completed-tasks-draggable'
                ORDER BY ct.id ASC
            `);

            return result.map(item => ({
                id: item.id,
                title: item.title,
                category: item.category_name,
                startForecast: item.start_forecast,
                endForecast: item.end_forecast,
                createdAt: item.created_at,
                finishedAt: item.finished_at,
                hasForecast: item.has_forecast,
                completionHours: Math.round((item.completion_hours || 0) * 100) / 100,
                completionDays: Math.round((item.completion_days || 0) * 100) / 100
            }));
        } catch (error) {
            console.error('Erro ao exportar detalhes de tempo médio:', error);
            throw error;
        }
    },
    getOnTimeCompletionRate: async function(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
        try {
            // Buscar chamados concluídos no mês especificado
            const result = await executeQuery(`
                SELECT 
                    ct.id,
                    ct.title,
                    ct.start_forecast,
                    ct.end_forecast,
                    ct.finished_at,
                    cc.name as category_name,
                    CASE 
                        WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL THEN
                            TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.end_forecast)
                        WHEN ct.start_forecast IS NULL OR ct.end_forecast IS NULL THEN 0.167
                        ELSE NULL 
                    END as forecast_hours,
                    CASE 
                        WHEN ct.start_forecast IS NOT NULL AND ct.end_forecast IS NOT NULL AND ct.finished_at IS NOT NULL THEN
                            TIMESTAMPDIFF(HOUR, ct.start_forecast, ct.finished_at)
                        ELSE NULL 
                    END as actual_hours
                FROM called_tickets ct
                LEFT JOIN called_ticket_categories ctc ON ctc.ticket_id = ct.id
                LEFT JOIN called_categories cc ON cc.id = ctc.category_id
                WHERE ct.status = 'completed-tasks-draggable'
                AND ct.finished_at IS NOT NULL
                AND YEAR(ct.finished_at) = ?
                AND MONTH(ct.finished_at) = ?
                AND cc.name IS NOT NULL
                AND cc.name != ''
            `, [year, month]);

            // Calcular estatísticas gerais
            let totalTickets = result.length;
            let onTimeTickets = 0;
            let categoryStats = {};

            result.forEach(ticket => {
                const categoryName = ticket.category_name || 'Sem Categoria';
                const forecastHours = parseFloat(ticket.forecast_hours || 0);
                const actualHours = parseFloat(ticket.actual_hours || 0);

                // Inicializar estatísticas da categoria se não existir
                if (!categoryStats[categoryName]) {
                    categoryStats[categoryName] = {
                        total: 0,
                        onTime: 0,
                        percentage: 0
                    };
                }

                categoryStats[categoryName].total++;

                // Verificar se está dentro do prazo (tempo real <= tempo previsto)
                if (actualHours <= forecastHours) {
                    onTimeTickets++;
                    categoryStats[categoryName].onTime++;
                }
            });

            // Calcular porcentagens
            const overallPercentage = totalTickets > 0 ? (onTimeTickets / totalTickets) * 100 : 0;

            // Calcular porcentagens por categoria
            Object.keys(categoryStats).forEach(category => {
                const stats = categoryStats[category];
                stats.percentage = stats.total > 0 ? (stats.onTime / stats.total) * 100 : 0;
            });

            // Ordenar categorias por porcentagem (maior primeiro)
            const sortedCategories = Object.entries(categoryStats)
                .sort(([,a], [,b]) => b.percentage - a.percentage)
                .map(([name, stats]) => ({
                    category: name,
                    total: stats.total,
                    onTime: stats.onTime,
                    percentage: Math.round(stats.percentage * 100) / 100
                }));

            return {
                year: year,
                month: month,
                monthName: new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long' }),
                totalTickets: totalTickets,
                onTimeTickets: onTimeTickets,
                overallPercentage: Math.round(overallPercentage * 100) / 100,
                categories: sortedCategories,
                details: await Promise.all(result.map(async ticket => {
                    // Buscar colaboradores atribuídos ao ticket
                    const assignedResult = await executeQuery(`
                        SELECT 
                            collab.name, 
                            collab.family_name,
                            collab.id_headcargo
                        FROM called_assigned_relations car
                        JOIN collaborators collab ON collab.id = car.collaborator_id 
                        WHERE car.ticket_id = ?
                    `, [ticket.id]);
                    
                    const assignedCollaborators = assignedResult.map(collab => ({
                        name: `${collab.name} ${collab.family_name}`,
                        idHeadcargo: collab.id_headcargo
                    }));
                    
                    return {
                        id: ticket.id,
                        title: ticket.title,
                        category: ticket.category_name || 'Sem Categoria',
                        startForecast: ticket.start_forecast,
                        endForecast: ticket.end_forecast,
                        finishedAt: ticket.finished_at,
                        forecastHours: parseFloat(ticket.forecast_hours || 0),
                        actualHours: parseFloat(ticket.actual_hours || 0),
                        isOnTime: parseFloat(ticket.actual_hours || 0) <= parseFloat(ticket.forecast_hours || 0),
                        assignedCollaborators: assignedCollaborators
                    };
                }))
            };
        } catch (error) {
            console.error('Erro ao calcular taxa de conclusão no prazo:', error);
            throw error;
        }
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