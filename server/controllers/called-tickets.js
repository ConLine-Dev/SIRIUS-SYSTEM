const nodemailer = require('nodemailer');
const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');
const ExcelJS = require('exceljs');


const tickets = {
    listAll: async function(value){
        const ticketsList = []
        const tickets = await executeQuery(`SELECT ct.*,collab.name,collab.family_name,collab.family_name, collab.id_headcargo FROM called_tickets ct
        JOIN collaborators collab ON collab.id = ct.collaborator_id`);

        for (let index = 0; index < tickets.length; index++) {
            const element = tickets[index];
    

            const atribuido = await executeQuery(`SELECT car.*, collab.name,collab.family_name,collab.family_name, collab.id_headcargo FROM called_assigned_relations car
            JOIN collaborators collab ON collab.id = car.collaborator_id WHERE ticket_id = ${element.id}`);

            const msg = await executeQuery(`SELECT clm.*,collab.name, collab.family_name,collab.family_name, collab.id_headcargo 
                                    FROM called_messages clm
                                    JOIN collaborators collab ON collab.id = clm.collab_id 
                                    WHERE clm.ticket_id = ${element.id}`);

            ticketsList.push({
                id:element.id,
                title:element.title,
                description:element.description,
                status:element.status,
                responsible:element.collaborator_id,
                start_forecast:element.start_forecast,
                end_forecast:element.end_forecast,
                finished_at:element.finished_at,
                atribuido:atribuido,
                messageCount: msg.length
            })
        }

        return ticketsList
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

        const result = await executeQuery(
            'INSERT INTO called_tickets (title,status, description, collaborator_id, start_forecast, end_forecast, finished_at) VALUES (?,?, ?, ?, ?, ?, ?)',
            [value.title,'new-tasks-draggable', value.description, value.responsible.id, timeInit, timeEnd, finished_at]
          );


        await executeQuery(
            'INSERT INTO called_ticket_categories (ticket_id, category_id) VALUES (?, ?)',
            [result.insertId, value.categories.id]
          );

        const atribuido = value.atribuido;
        for (let index = 0; index < atribuido.length; index++) {
            const element = atribuido[index];

           await executeQuery(
                'INSERT INTO called_assigned_relations (ticket_id, collaborator_id) VALUES (?, ?)',
                [result.insertId, element.id]
              );
            
        }


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