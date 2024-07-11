const { executeQuery } = require('../connect/mysql');


const non_compliance = {
    getAllCompanies: async function(){
        const result = await executeQuery(`SELECT * from companies`);
        
        return result;
    },
    getAllOrigin: async function(){
        const result = await executeQuery(`SELECT * from occurrences_origin`);
    
        return result;
    },
    getAllTypes: async function(){
        const result = await executeQuery(`SELECT * from occurrences_type`);
    
        return result;
    },
    getPendingOccurrences: async function(){
        const status = {
            0: 'Pendente - Aprovação 1ª etapa',
            1: 'Reprovado - Aguardando Ajuste 1ª etapa',
            2: 'Aprovado - Liberado Preenchimento 2ª etapa',
            3: 'Pendente - aprovação 2ª etapa',
            4: 'Reprovado - Aguardando Ajuste 2ª etapa',
            5: 'Finalizado'
        }
     

        const occurrence = await executeQuery(`
        SELECT 
            o.editing,
            o.id,
            o.title,
            o.status,
            o.reference,
            o.description AS description,
            ot.name AS type,
            o.occurrence_date AS date_occurrence
        FROM 
            occurrences o
        JOIN 
            occurrences_type ot ON o.type_id = ot.id
        WHERE o.status NOT IN (5, 4, 1)`)



        const formtOccurrence = await Promise.all(occurrence.map(async function(item) {

        const responsibles = await executeQuery(`
        SELECT * FROM siriusDBO.occurrences_responsibles ors
        join collaborators clt ON clt.id = ors.collaborator_id
        WHERE ors.occurrence_id = ${item.id}`)

        let users = ``;
        for (let index = 0; index < responsibles.length; index++) {
            const element = responsibles[index];

            users += `<span class="avatar avatar-rounded" title="${element.name} ${element.family_name}" > 
                            <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt="img"> 
                    </span>`
            
        }

        const actions = `
        <div class="btn-list"> 
            <a data-bs-toggle="offcanvas" href="#offcanvasExample" role="button" aria-controls="offcanvasExample" class="btn btn-sm btn-warning-light btn-icon"><i class="ri-eye-line"></i></a>
            <button class="btn btn-sm btn-info-light btn-icon"><i class="ri-pencil-line"></i></button>
            <button class="btn btn-sm btn-danger-light btn-icon contact-delete"><i class="ri-delete-bin-line"></i></button>
        </div>`;



        return {
            ...item, // mantém todas as propriedades existentes
            title:item.title,
            editing:item.editing,
            id:item.id,
            status: `<span class="badge bg-danger-transparent">${status[item.status]}</span>`,
            reference: `<b>${item.reference}</b>`,
            responsibles: `<div class="avatar-list-stacked">${users}</div>`,
            date_occurrence: `<span class="icon-text-align">
                <i class="las la-calendar-alt fs-5"></i> ${non_compliance.formatDate(item.date_occurrence)}
            </span>`,
            description: item.description,
            type: item.type,
            action:actions
        };
        }));
            

        return formtOccurrence; 
    },
    getAllOccurrence: async function(){
        const status = {
            0: 'Pendente - Aprovação 1ª etapa',
            1: 'Reprovado - Aguardando Ajuste 1ª etapa',
            2: 'Aprovado - Liberado Preenchimento 2ª etapa',
            3: 'Pendente - aprovação 2ª etapa',
            4: 'Reprovado - Aguardando Ajuste 2ª etapa',
            5: 'Finalizado'
        }
     

        const occurrence = await executeQuery(`
        SELECT 
            o.editing,
            o.id,
            o.title,
            o.status,
            o.reference,
            o.description AS description,
            ot.name AS type,
            o.occurrence_date AS date_occurrence
        FROM 
            occurrences o
        JOIN 
            occurrences_type ot ON o.type_id = ot.id
        `)



        const formtOccurrence = await Promise.all(occurrence.map(async function(item) {

        const responsibles = await executeQuery(`
        SELECT * FROM siriusDBO.occurrences_responsibles ors
        join collaborators clt ON clt.id = ors.collaborator_id
        WHERE ors.occurrence_id = ${item.id}`)

        let users = ``;
        for (let index = 0; index < responsibles.length; index++) {
            const element = responsibles[index];

            users += `<span class="avatar avatar-rounded" title="${element.name} ${element.family_name}" > 
                            <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt="img"> 
                    </span>`
            
        }

        const actions = `
        <div class="btn-list"> 
            <a data-bs-toggle="offcanvas" href="#offcanvasExample" role="button" aria-controls="offcanvasExample" class="btn btn-sm btn-warning-light btn-icon"><i class="ri-eye-line"></i></a>
            <button class="btn btn-sm btn-info-light btn-icon"><i class="ri-pencil-line"></i></button>
            <button class="btn btn-sm btn-danger-light btn-icon contact-delete"><i class="ri-delete-bin-line"></i></button>
        </div>`;



        return {
            ...item, // mantém todas as propriedades existentes
            title:item.title,
            editing:item.editing,
            id:item.id,
            status: `<span class="badge bg-danger-transparent">${status[item.status]}</span>`,
            reference: `<b>${item.reference}</b>`,
            responsibles: `<div class="avatar-list-stacked">${users}</div>`,
            date_occurrence: `<span class="icon-text-align">
                <i class="las la-calendar-alt fs-5"></i> ${non_compliance.formatDate(item.date_occurrence)}
            </span>`,
            description: item.description,
            type: item.type,
            action:actions
        };
        }));
            

        return formtOccurrence; 
    },
    getOcurrenceById: async function(id){
        const status = {
            0: 'Pendente de Aprovação',
            1: 'Aguardando Preenchimento',
        }

        const occurrence = await executeQuery(`
        SELECT 
            o.second_part,
            o.editing,
            o.title,
            o.id,
            o.status,
            o.reference,
            o.correction,
            o.company_id,
            o.origin_id,
            o.description AS description,
            ot.id AS typeId,
            ot.name AS type,
            o.occurrence_date AS date_occurrence
        FROM 
            occurrences o
        JOIN 
            occurrences_type ot ON o.type_id = ot.id
        WHERE o.id = ${id}`)



        const formtOccurrence = await Promise.all(occurrence.map(async function(item) {

        const responsibles = await executeQuery(`
        SELECT * FROM siriusDBO.occurrences_responsibles ors
        join collaborators clt ON clt.id = ors.collaborator_id
        WHERE ors.occurrence_id = ${item.id}`)


        return {
            ...item, // mantém todas as propriedades existentes
            id:item.id,
            second_part:item.second_part,
            editing:item.editing,
            statusName: status[item.status],
            status: item.status,
            correction:item.correction,
            company_id:item.company_id,
            origin_id:item.origin_id,
            reference: item.reference,
            responsibles: responsibles,
            date_occurrence: item.date_occurrence,
            description: item.description,
            type: item.type,
            typeId: item.typeId
        };
        }));
            

        return formtOccurrence[0]; 
    },
    generateReference: async function(occurrenceId){
        const currentDate = new Date();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adiciona zero à esquerda se o mês tiver apenas um dígito
        const year = String(currentDate.getFullYear()).slice(-2); // Pega os últimos dois dígitos do ano
        const formattedId = String(occurrenceId).padStart(3, '0'); // Formata o ID da ocorrência com 4 dígitos
      
        const reference = `OC${month}${formattedId}/${year}`;
        return reference;
    },
    newOccurrence: async function(body){
        const formBody = body.formBody

        console.log(formBody)
        const occurrence_responsible = formBody.occurrence_responsible
        // const listReasons = body.listReasons
        // const listActions = body.listActions

        const date = new Date()
        const insertOccurrence = await executeQuery(`INSERT INTO occurrences (title,company_id, origin_id, type_id, occurrence_date, description, correction, create_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
         [formBody.occurrence, formBody.company_id, formBody.origin_id, formBody.type_id, formBody.occurrence_date, formBody.description, formBody.correction, date])


        // Criando a referência com o ID inserido e o ano atual
        const reference = await this.generateReference(insertOccurrence.insertId);

        await executeQuery('UPDATE occurrences SET reference = ? WHERE id = ?', [reference, insertOccurrence.insertId]);

        if(insertOccurrence.insertId){

            for (let index = 0; index < occurrence_responsible.length; index++) {
                const element = occurrence_responsible[index];
    
                await executeQuery(`INSERT INTO occurrences_responsibles (occurrence_id, collaborator_id) VALUES (?, ?)`,
                    [insertOccurrence.insertId, element])
            }

        }
        
         
        return insertOccurrence

    },
    getHistory: async function(id){
        const history = await executeQuery(`SELECT * FROM occurrences_history oh
            JOIN collaborators clt ON clt.id = oh.collaborator_id
            WHERE oh.occurrence_id = ${id} ORDER BY oh.id_history desc`)

        return history;
    },
    changeBlock: async function(body){
        const {type,prop, id, obs, userId} = body
        console.log(type,prop, id, obs, userId)
        const date = new Date()
        const occurrence = await executeQuery(`UPDATE occurrences SET ${prop} = ${type} WHERE (id = ${id})`)

        await executeQuery(`INSERT INTO occurrences_history 
        (occurrence_id, collaborator_id, body, create_at) VALUES (?, ?, ?, ?)`, [id, userId, obs, date])
        

        return occurrence;
    },
    // Função para formatar uma data no formato pt-BR (dd/mm/aaaa)
    formatDate: function (dateString) {
        const date = new Date(dateString); // Cria um objeto Date a partir da string de data
        const day = String(date.getDate()).padStart(2, '0'); // Garante que o dia tenha dois dígitos
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Garante que o mês tenha dois dígitos
        const year = date.getFullYear(); // Obtém o ano
        return `${day}/${month}/${year}`; // Retorna a data formatada
    },
}



module.exports = {
    non_compliance,
};