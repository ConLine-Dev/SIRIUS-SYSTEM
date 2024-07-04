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
    getAllOccurrence: async function(){
        const occurrence = await executeQuery(`
                    SELECT 
                        o.reference,
                        o.description AS description,
                        ot.name AS type,
                        o.occurrence_date AS date_occurrence
                    FROM 
                        occurrences o
                    JOIN 
                        occurrences_type ot ON o.type_id = ot.id`)



        const formtOccurrence = await Promise.all(occurrence.map(async function(item) {
        
            // const inside = `<div class="d-flex align-items-center gap-2">
            // <div class="lh-1">
            //     <span class="avatar avatar-rounded avatar-sm">
            //     <img src="${item.insideID ? `https://cdn.conlinebr.com.br/colaboradores/${item.insideID}` : `https://conlinebr.com.br/assets/img/icon-semfundo.png`}" alt="">
            //     </span>
            // </div>
            // <div>
            //     <span class="d-block fw-semibold">${item.inside ? item.inside : 'Sem vinculação'}</span>
            // </div>
            // </div>`

            

            return {
                ...item, // mantém todas as propriedades existentes
                reference: item.reference,
                date_occurrence: `<span class="icon-text-align">
                    <i class="las la-calendar-alt fs-5"></i> ${non_compliance.formatDate(item.date_occurrence)}
                </span>`,
                description: item.description,
                type: item.type,
                lastQuote: `<span style="display:none"></span><span class="d-block"><i class="ri-calendar-2-line me-2 align-middle fs-14 text-muted"></i></span>`,
                lastProcess: `<span style="display:none"></span><span class="d-block"><i class="ri-calendar-2-line me-2 align-middle fs-14 text-muted"></i></span>`,
            };
        }));
                   

        return formtOccurrence; 
    },
    generateReference: async function(occurrenceId){
        const currentDate = new Date();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adiciona zero à esquerda se o mês tiver apenas um dígito
        const year = String(currentDate.getFullYear()).slice(-2); // Pega os últimos dois dígitos do ano
        const formattedId = String(occurrenceId).padStart(3, '0'); // Formata o ID da ocorrência com 4 dígitos
      
        const reference = `OC${month}${formattedId}/${year}`;
        return reference;
    },
    NewOccurrence: async function(body){
        const formBody = body.formBody

        console.log(formBody)
        const occurrence_responsible = formBody.occurrence_responsible
        // const listReasons = body.listReasons
        // const listActions = body.listActions

        const date = new Date()
        const insertOccurrence = await executeQuery(`INSERT INTO occurrences (company_id, origin_id, type_id, occurrence_date, description, correction, create_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [formBody.company_id, formBody.origin_id, formBody.type_id, formBody.occurrence_date, formBody.description, formBody.correction, date])


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
    NewReason: async function(body){
        const result = await executeQuery(`INSERT INTO occurrences_reason (reason, occurrences_id) VALUES (?, ?)`,
        [body.reason, body.occurrences_id])
    },
    NewActions: async function(body){
        const result = await executeQuery(`INSERT INTO occurrences_actions (action, responsible, expiration, status) VALUES (?, ?, ?, ?)`,
        [body.action, body.responsible, body.expiration, body.status])
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