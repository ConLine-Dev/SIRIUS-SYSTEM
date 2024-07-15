
const { executeQuery } = require('../connect/mysql');
// Configuração do multer para armazenar arquivos em memória



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
            LEFT(o.title, 100) as title,
            o.status,
            o.reference,
            LEFT(o.description, 100) AS description,
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
            title:`<span style="display: inline-block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${item.title}</span>`,
            editing:item.editing,
            id:item.id,
            status: `<span class="badge bg-danger-transparent">${status[item.status]}</span>`,
            reference: `<b>${item.reference}</b>`,
            responsibles: `<div class="avatar-list-stacked">${users}</div>`,
            date_occurrence: `<span class="icon-text-align">
                <i class="las la-calendar-alt fs-5"></i> ${non_compliance.formatDate(item.date_occurrence)}
            </span>`,
            description: `<span style="display: inline-block; max-width: 281px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${item.description}</span>`,
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
            LEFT(o.title, 100) as title,
            o.status,
            o.reference,
            LEFT(o.description, 100) AS description,
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
            title:`<span style="display: inline-block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${item.title}</span>`,
            editing:item.editing,
            id:item.id,
            status: `<span class="badge bg-danger-transparent">${status[item.status]}</span>`,
            reference: `<b>${item.reference}</b>`,
            responsibles: `<div class="avatar-list-stacked">${users}</div>`,
            date_occurrence: `<span class="icon-text-align">
                <i class="las la-calendar-alt fs-5"></i> ${non_compliance.formatDate(item.date_occurrence)}
            </span>`,
            description: `<span style="display: inline-block; max-width: 281px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${item.description}</span>`,
            type: item.type,
            action:actions
        };
        }));
            

        return formtOccurrence; 
    },
    getOcurrenceById: async function(id){
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
                o.second_part,
                o.editing,
                o.title,
                o.id,
                o.status,
                o.reference,
                o.ROMFN,
                o.correction,
                o.company_id,
                o.origin_id,
                o.description AS description,
                ot.id AS typeId,
                ot.name AS type,
                o.occurrence_date AS date_occurrence,
                oia.manpower,
                oia.method,
                oia.material,
                oia.environment,
                oia.machine,
                oia.machine,
                oia.root_cause
            FROM 
                occurrences o
            JOIN 
                occurrences_type ot ON o.type_id = ot.id
            LEFT JOIN 
                occurrences_ishikawa_analysis oia ON oia.occurrence_id = o.id
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

 
        const occurrence_responsible = formBody.occurrence_responsible
  
        const date = new Date()
        const insertOccurrence = await executeQuery(`
        INSERT INTO occurrences
        (title, company_id, origin_id, type_id, occurrence_date, description, correction, create_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            formBody.occurrence,
            formBody.company_id,
            formBody.origin_id,
            formBody.type_id,
            formBody.occurrence_date,
            formBody.description,
            formBody.correction,
            date
        ]);


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
    setIshikawaAnalysis: async function (body){
        const date = new Date();
        const { occurrence_id, manpower, method, material, environment, machine, root_cause, occurrence_responsible } = body;

        // Verificar se já existe um registro com o occurrence_id
        const existingAnalysis = await executeQuery(`
        SELECT 1 FROM occurrences_ishikawa_analysis WHERE occurrence_id = ?
        `, [occurrence_id]);

        if (existingAnalysis.length > 0) {
        // Se existir, faça um UPDATE
        const updateQuery = `
            UPDATE occurrences_ishikawa_analysis
            SET
                manpower = ?,
                method = ?,
                material = ?,
                environment = ?,
                machine = ?,
                root_cause = ?,
                updated_at = ?
            WHERE
                occurrence_id = ?
        `;
        await executeQuery(updateQuery, [manpower, method, material, environment, machine, root_cause, date, occurrence_id]);
        } else {
        // Se não existir, faça um INSERT
        const insertQuery = `
            INSERT INTO occurrences_ishikawa_analysis
            (occurrence_id, manpower, method, material, environment, machine, root_cause, create_at)
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await executeQuery(insertQuery, [occurrence_id, manpower, method, material, environment, machine, root_cause, date]);
        }
    },
    updateOccurrence: async function (body, status){
        const date = new Date();
        let { occurrence_id, occurrence, company_id, origin_id, type_id, occurrence_date, description, correction, occurrence_responsible, ROMFN } = body;
       
         status = status == 2 ? 3 : status == 1 ? 0 : status == 4 ? 3 : status == 5 ? 5 : status
         // Se existir, faça um UPDATE
         const updateQuery = `
         UPDATE occurrences
         SET
             title = ?,
             company_id = ?,
             origin_id = ?,
             type_id = ?,
             occurrence_date = ?,
             description = ?,
             correction = ?,
             ROMFN = ?,
             updated_at = ?,
             status = ?
         WHERE
             id = ?`;
        await executeQuery(updateQuery, [
            occurrence,
            company_id,
            origin_id,
            type_id,
            occurrence_date,
            description,
            correction,
            ROMFN,
            date,
            status,
            occurrence_id
        ]);

      // Atualizar os responsáveis
      await executeQuery(`DELETE FROM occurrences_responsibles WHERE occurrence_id = ?`, [occurrence_id]);

      for (let index = 0; index < occurrence_responsible.length; index++) {
          const element = occurrence_responsible[index];
          await executeQuery(`INSERT INTO occurrences_responsibles (occurrence_id, collaborator_id) VALUES (?, ?)`, [occurrence_id, element]);
      }

    },
    saveOccurence: async function(body) {
        console.log(body)
        const { occurrence_id, manpower, method, material, environment, machine, root_cause, occurrence_responsible, ROMFN } = body.formBody;
        const { occurrence, company_id, origin_id, type_id, occurrence_date, description, correction } = body.formBody;

    
        // Verificar se já existe uma ocorrência com o occurrence_id
        const existingOccurrence = await executeQuery(`
        SELECT * FROM occurrences WHERE id = ?
        `, [occurrence_id]);
     

        const veryfiOcurrence = occurrence || company_id || origin_id || type_id || occurrence_date || description || correction || ROMFN

        // Verificar se pelo menos um dos campos obrigatórios está presente e a occurrencia exista no banco.
        if (existingOccurrence.length > 0 && veryfiOcurrence) {
            await non_compliance.updateOccurrence(body.formBody, existingOccurrence[0].status);
        }

        // Verificar se pelo menos um dos campos obrigatórios está presente e não está vazio
        if (manpower || method || material || environment || machine || root_cause) {
            await non_compliance.setIshikawaAnalysis(body.formBody)
        }
     
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
    addAction: async function(body, evidenceFiles){
        const { occurrence_id, action_responsible, action_expiration, action_description } = body;
        
    
        const evidenceData = evidenceFiles.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            path: file.path
        }));
    
        const sql = `INSERT INTO occurrences_corrective_actions (occurrence_id, responsible_id, deadline, action, evidence) VALUES (?, ?, ?, ?, ?)`;
        const values = [
            occurrence_id,
            action_responsible,
            action_expiration,
            action_description,
            JSON.stringify(evidenceData)
        ];

        await executeQuery(sql, values);
    },
    editAction: async function(body, evidenceFiles) {
        const { action_id, action_responsible, action_expiration, action_description } = body;

    
        // Recupera os dados atuais da evidência
        const currentAction = await non_compliance.getAction(action_id); // Suponha que você tenha uma função para buscar a ação pelo ID
    
        // Verifica se há evidências atuais
        let currentEvidence = [];
        if (currentAction && currentAction.evidence) {
            currentEvidence = JSON.parse(currentAction.evidence);
        }
    
        // Prepara os novos dados de evidência
        let newEvidenceData = [];
        if (evidenceFiles && evidenceFiles.length > 0) {
            newEvidenceData = evidenceFiles.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                path: file.path
            }));
        }
    
        // Combina os dados atuais com os novos dados de evidência
        const combinedEvidence = [...currentEvidence, ...newEvidenceData];
    
        // Monta a query SQL para atualizar a ação corretiva
        const sql = `UPDATE occurrences_corrective_actions 
                     SET responsible_id = ?, deadline = ?, action = ?, evidence = ? 
                     WHERE id = ?`;
        const values = [
            action_responsible,
            action_expiration,
            action_description,
            JSON.stringify(combinedEvidence),
            action_id
        ];
    
        // Executa a query SQL
        await executeQuery(sql, values);
    },
    getAction: async function(actionId){
        const sql = `SELECT * FROM occurrences_corrective_actions WHERE id = ?`;
        const result = await executeQuery(sql, [actionId]);

        return result[0];
    },
    addEffectiveness: async function(body, evidenceFiles){
        const { occurrence_id, effectiveness_responsible, effectiveness_expiration, effectiveness_description } = body;
        

        const evidenceData = evidenceFiles.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            path: file.path
        }));
    
        const sql = `INSERT INTO occurrences_effectiveness_evaluation (occurrence_id, responsible_id, deadline, action, evidence) VALUES (?, ?, ?, ?, ?)`;
        const values = [
            occurrence_id,
            effectiveness_responsible,
            effectiveness_expiration,
            effectiveness_description,
            JSON.stringify(evidenceData)
        ];

        const result = await executeQuery(sql, values);
    },
    editEffectiveness: async function(body, evidenceFiles) {
        const { effectivenes_id, effectiveness_responsible, effectiveness_expiration, effectiveness_description } = body;
 
        // Recupera os dados atuais da eficácia
        const currentEffectiveness = await non_compliance.getEffectivenes(effectivenes_id); // Suponha que você tenha uma função para buscar a eficácia pelo ID
    
        // Verifica se há evidências atuais
        let currentEvidence = [];
        if (currentEffectiveness && currentEffectiveness.evidence) {
            currentEvidence = JSON.parse(currentEffectiveness.evidence);
        }
    
        // Prepara os novos dados de evidência
        let newEvidenceData = [];
        if (evidenceFiles && evidenceFiles.length > 0) {
            newEvidenceData = evidenceFiles.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                path: file.path
            }));
        }
    
        // Combina os dados atuais com os novos dados de evidência
        const combinedEvidence = [...currentEvidence, ...newEvidenceData];
    
        // Monta a query SQL para atualizar a eficácia
        const sql = `UPDATE occurrences_effectiveness_evaluation 
                     SET responsible_id = ?, deadline = ?, action = ?, evidence = ? 
                     WHERE id = ?`;
        const values = [
            effectiveness_responsible,
            effectiveness_expiration,
            effectiveness_description,
            JSON.stringify(combinedEvidence),
            effectivenes_id
        ];
    
        // Executa a query SQL
        const result = await executeQuery(sql, values);
        return result; // Retorna o resultado da execução da query, se necessário
    }, 
    getEffectivenes: async function(effectivenesId){
        const sql = `SELECT * FROM occurrences_effectiveness_evaluation WHERE id = ?`;
        const result = await executeQuery(sql, [effectivenesId]);
        return result[0];
    },
    updateActionEvidence: async function(actionId, evidence) {
        const sql = `UPDATE occurrences_corrective_actions SET evidence = ? WHERE id = ?`;
        await executeQuery(sql, [evidence, actionId]);
    },
    getActionsByOccurrence: async function(occurrenceId) {
        const sql = `SELECT oca.*,clt.family_name, clt.name, clt.id_headcargo FROM occurrences_corrective_actions oca
        JOIN collaborators clt ON clt.id = oca.responsible_id
        WHERE occurrence_id = ? ORDER BY oca.id desc`;

        const result = await executeQuery(sql, [occurrenceId]);


        const status = {
            0: 'Pendente',
            1: 'Reprovado - Aguardando Ajuste 1ª etapa',
        }

        const Actions = await Promise.all(result.map(async function(item) {
            const users = `<div class="d-flex align-items-center">
                                <span class="avatar avatar-sm  me-1 bg-light avatar-rounded" title="${item.name} ${item.family_name}"> 
                                    <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt=""> 
                                </span>
                                <a href="javascript:void(0);" class="fw-semibold mb-0">
                                    ${item.name} ${item.family_name}
                                </a>
                            </div>`
            return {
                ...item, // mantém todas as propriedades existentes
                status: `<span class="badge bg-danger-transparent">${status[item.status]}</span>`,
                action: item.action,
                deadline: `<span class="badge bg-danger-transparent"><i class="bi bi-clock me-1"></i>${non_compliance.formatDate(item.deadline)}</span>`,
                responsible:users,
                verifyEvidence: JSON.parse(item.evidence).length > 0 ? '<span class="badge bg-success-transparent">Sim</span>' : '<span class="badge bg-danger-transparent">Não</span>'
            };
        }));

        return Actions;
    },
    getEffectivenessByOccurrence: async function(occurrenceId) {
        const sql = `SELECT oee.*,clt.family_name, clt.name, clt.id_headcargo FROM occurrences_effectiveness_evaluation oee
        JOIN collaborators clt ON clt.id = oee.responsible_id
        WHERE occurrence_id = ? ORDER BY oee.id desc`;

        const result = await executeQuery(sql, [occurrenceId]);

        const status = {
            0: 'Pendente',
            1: 'Reprovado - Aguardando Ajuste 1ª etapa',
        }

        const Effectiveness = await Promise.all(result.map(async function(item) {
            const users = `<div class="d-flex align-items-center">
                                <span class="avatar avatar-sm  me-1 bg-light avatar-rounded" title="${item.name} ${item.family_name}"> 
                                    <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt=""> 
                                </span>
                                <a href="javascript:void(0);" class="fw-semibold mb-0">
                                    ${item.name} ${item.family_name}
                                </a>
                            </div>`
            return {
                ...item, // mantém todas as propriedades existentes
                status: `<span class="badge bg-danger-transparent">${status[item.status]}</span>`,
                action: item.action,
                deadline: `<span class="badge bg-danger-transparent"><i class="bi bi-clock me-1"></i>${non_compliance.formatDate(item.deadline)}</span>`,
                responsible:users,
                verifyEvidence: JSON.parse(item.evidence).length > 0 ? '<span class="badge bg-success-transparent">Sim</span>' : '<span class="badge bg-danger-transparent">Não</span>'
            };
        }));

        return Effectiveness;
    },
    updateEffectivenessEvidence: async function(effectivenesId, evidence) {
        const sql = `UPDATE occurrences_effectiveness_evaluation SET evidence = ? WHERE id = ?`;
        await executeQuery(sql, [evidence, effectivenesId]);
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