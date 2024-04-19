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
        const occurrence = await executeQuery(`SELECT ocr.*, 
                            clt.id_headcargo as approvalHeadCargo,
                            clt.name as approvalName,
                            clt.family_name as approvalFamilyName,
                            org.name as OriginName,
                            cpn.name as companieName,
                            cpn.city as companieCity,
                            cpn.country as companieCountry
                            FROM occurrences_list ocr
                    JOIN collaborators clt ON clt.id = ocr.approval
                    JOIN occurrences_origin org ON org.id = ocr.origin
                    JOIN companies cpn ON cpn.id = ocr.unit`)

        return {"data": occurrence}; 
    },
    NewOccurrence: async function(body){
        const formBody = body.formBody
        const occurrence_responsible = formBody.occurrence_responsible
        const listReasons = body.listReasons
        const listActions = body.listActions


        const insertOccurrence = await executeQuery(`INSERT INTO occurrences_list (occurrence, date_occurrence, unit, origin, approval, description) VALUES (?, ?, ?, ?, ?, ?)`,
         [formBody.occurrence, formBody.date_occurrence, formBody.unit, formBody.origin, formBody.approval, formBody.description])

        // Obtendo o ano atual
        const now = new Date();
        const anoAtual = now.getFullYear() % 100;

        // Criando a referência com o ID inserido e o ano atual
        const reference = `OC${insertOccurrence.insertId <= 9 ? '0'+insertOccurrence.insertId : insertOccurrence.insertId}/${anoAtual}`;

        await executeQuery('UPDATE occurrences_list SET reference = ? WHERE id = ?', [reference, insertOccurrence.insertId]);

        if(insertOccurrence.insertId){

            for (let index = 0; index < occurrence_responsible.length; index++) {
                const element = occurrence_responsible[index];
    
                await executeQuery(`INSERT INTO occurrences_responsibles_relations (occurrence_id, responsible_id) VALUES (?, ?)`,
                    [insertOccurrence.insertId, element])
            }

            for (let index = 0; index < listReasons.length; index++) {
                const element = listReasons[index];
    
                await executeQuery(`INSERT INTO occurrences_reason (reason, occurrences_id) VALUES (?, ?)`,
                    [element, insertOccurrence.insertId])
            }


            for (let index = 0; index < listActions.length; index++) {
                const element = listActions[index];
    
                await executeQuery(`INSERT INTO occurrences_actions (action, responsible, expiration, status, occurrences_id) VALUES (?, ?, ?, ?, ?)`,
                    [element.description,element.responsible_id,element.expiration, 0, insertOccurrence.insertId])
            }

    
        }
        
         


    },
    NewReason: async function(body){
        const result = await executeQuery(`INSERT INTO occurrences_reason (reason, occurrences_id) VALUES (?, ?)`,
        [body.reason, body.occurrences_id])
    },
    NewActions: async function(body){
        const result = await executeQuery(`INSERT INTO occurrences_actions (action, responsible, expiration, status) VALUES (?, ?, ?, ?)`,
        [body.action, body.responsible, body.expiration, body.status])
    }
}



module.exports = {
    non_compliance,
};