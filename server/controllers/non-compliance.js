require('dotenv').config();
const nodemailer = require('nodemailer');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const {emailCustom} = require('../support/emails-template');
const {sendEmail} = require('../support/send-email');
const {Users} = require('./users');

const non_compliance = {
    sendEmail: async function(subject, CustomHTML, templateName = 'complete', allFiles, occurenceID){
        const transporter = nodemailer.createTransport({
            name: 'ocorrencia@conlinebr.com.br',
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const Ocurrence = await this.getOcurrenceById(occurenceID)
        
        // Verifica se há responsáveis e cria a lista de emails para CC
        const ccEmails = Ocurrence.responsibles.map(responsible => responsible.email);

        const mailOptions = {
            from: 'ocorrencia@conlinebr.com.br',
            to: 'ocorrencia@conlinebr.com.br',
            cc: ccEmails,
            subject: subject,
            html: CustomHTML ? CustomHTML : await emailCustom[templateName](Ocurrence),
            attachments: allFiles != null ? allFiles.map(dados => ({ filename: dados.filename, content: dados.content })) : false
        };
        

        // Envia o e-mail para o destinatário atual
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                const { response } = error;
                console.error('Erro ao enviar email:', response);
            }else{
                const { messageId, envelope, accepted, rejected, pending, response } = info;

                console.log('Email enviado:', response);
            }
        })

    },
    sendEmailToEmail: async function(to,subject, CustomHTML, templateName = 'complete', allFiles, occurenceID, actions){
        const transporter = nodemailer.createTransport({
            name: 'ocorrencia@conlinebr.com.br',
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const Ocurrence = await this.getOcurrenceById(occurenceID)

        const mailOptions = {
            from: 'ocorrencia@conlinebr.com.br',
            to: to,
            cc: 'ocorrencia@conlinebr.com.br',
            subject: subject,
            html: CustomHTML ? CustomHTML : await emailCustom[templateName](Ocurrence, actions ? actions : null),
            attachments: allFiles != null ? allFiles.map(dados => ({ filename: dados.filename, content: dados.content })) : false
        };
        

        // Envia o e-mail para o destinatário atual
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                const { response } = error;
                console.error('Erro ao enviar email:', response);
            }else{
                const { messageId, envelope, accepted, rejected, pending, response } = info;

                console.log('Email enviado:', response);
            }
        })

    },
    getAllCompanies: async function(){
        const result = await executeQuery(`SELECT * from companies WHERE office = 1`);
        
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
    getOccurenceByColab:async function(id, type) {
        const status = {
            0: 'Pendente - Aprovação 1ª etapa',
            1: 'Reprovado - Aguardando Ajuste 1ª etapa',
            2: 'Aprovado - Liberado Preenchimento 2ª etapa',
            3: 'Pendente - aprovação 2ª etapa',
            4: 'Reprovado - Aguardando Ajuste 2ª etapa',
            5: 'Desenvolvimento - Ação Corretiva',
            6: 'Desenvolvimento - Avaliação de Eficácia',
            7: 'Finalizado'
        }
    
        // Consulta otimizada para buscar todas as informações necessárias em uma única query
        const occurrenceQuery = `SELECT DISTINCT
                        o.editing,
                        o.id AS occurrence_id,
                        LEFT(o.title, 100) as title,
                        o.status,
                        o.reference,
                        LEFT(o.description, 100) AS description,
                        ot.name AS type,
                        o.occurrence_date AS date_occurrence,
                        clt.id AS collaborator_id,
                        clt.name AS collaborator_name,
                        clt.family_name,
                        clt.id_headcargo
                    FROM 
                        occurrences o
                    LEFT JOIN 
                        occurrences_type ot ON o.type_id = ot.id
                    LEFT JOIN
                        occurrences_responsibles orb ON o.id = orb.occurrence_id
                    LEFT JOIN
                        collaborators clt ON orb.collaborator_id = clt.id
                    LEFT JOIN 
                        occurrences_corrective_actions oca ON oca.occurrence_id = o.id AND oca.responsible_id = clt.id
                    WHERE 
                        (o.status IN (${type}) AND o.id IN (SELECT occurrence_id FROM occurrences_responsibles WHERE collaborator_id = ${id}))
                    OR 
                        o.id IN (SELECT occurrence_id FROM occurrences_corrective_actions WHERE responsible_id = ${id})`;

    
        const occurrence = await executeQuery(occurrenceQuery);
    
        // Organizar os dados das ocorrências e responsáveis
        const occurrencesMap = new Map();
    
        occurrence.forEach(item => {
            if (!occurrencesMap.has(item.occurrence_id)) {
                occurrencesMap.set(item.occurrence_id, {
                    editing: item.editing,
                    id: item.occurrence_id,
                    title: item.title,
                    status: item.status,
                    reference: item.reference,
                    description: item.description,
                    type: item.type,
                    date_occurrence: item.date_occurrence,
                    responsibles: []
                });
            }
            const occurrenceItem = occurrencesMap.get(item.occurrence_id);
            if (item.collaborator_id) {
                occurrenceItem.responsibles.push({
                    id: item.collaborator_id,
                    name: item.collaborator_name,
                    family_name: item.family_name,
                    id_headcargo: item.id_headcargo
                });
            }
        });
    
        const formattedOccurrences = Array.from(occurrencesMap.values()).map(item => {
            let users = ``;
    
            item.responsibles.forEach(responsible => {
                users += `<span class="avatar avatar-rounded" title="${responsible.name} ${responsible.family_name}"> 
                            <img src="https://cdn.conlinebr.com.br/colaboradores/${responsible.id_headcargo}" alt="img"> 
                          </span>`;
            });
    
            const actions = `
                <div class="btn-list"> 
                    <a data-bs-toggle="offcanvas" href="#offcanvasExample" role="button" aria-controls="offcanvasExample" class="btn btn-sm btn-warning-light btn-icon"><i class="ri-eye-line"></i></a>
                    <button class="btn btn-sm btn-info-light btn-icon"><i class="ri-pencil-line"></i></button>
                    <button class="btn btn-sm btn-danger-light btn-icon contact-delete"><i class="ri-delete-bin-line"></i></button>
                </div>`;
    
            return {
                title: `<span style="display: inline-block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${item.title}</span>`,
                editing: item.editing,
                id: item.id,
                status: `<span class="badge bg-danger-transparent">${status[item.status]}</span>`,
                reference: `<span class="text-success fw-semibold">#${item.reference}</span>`,
                responsibles: `<div class="avatar-list-stacked">${users}</div>`,
                date_occurrence: `<span class="icon-text-align">
                                    <i class="las la-calendar-alt fs-5"></i> ${non_compliance.formatDate(item.date_occurrence)}
                                  </span>`,
                description: `<span style="display: inline-block; max-width: 281px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${item.description}</span>`,
                type: item.type,
                action: actions
            };
        });
    
        return formattedOccurrences;
    },
    getPendingOccurrences: async function(){
        const status = {
            0: 'Pendente - Aprovação 1ª etapa',
            1: 'Reprovado - Aguardando Ajuste 1ª etapa',
            2: 'Aprovado - Liberado Preenchimento 2ª etapa',
            3: 'Pendente - aprovação 2ª etapa',
            4: 'Reprovado - Aguardando Ajuste 2ª etapa',
            5: 'Desenvolvimento - Ação Corretiva',
            6: 'Desenvolvimento - Avaliação de Eficácia',
            7: 'Finalizado'
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
        WHERE o.status IN (0,3,5,6)`)



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
            title:`<span style="display: inline-block; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${item.title}</span>`,
            editing:item.editing,
            id:item.id,
            status: `<span class="badge bg-danger-transparent">${status[item.status]}</span>`,
            reference: `<span class="text-success fw-semibold">#${item.reference}</span>`,
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
            5: 'Desenvolvimento - Ação Corretiva',
            6: 'Desenvolvimento - Avaliação de Eficácia',
            7: 'Finalizado'
        }
     

        const occurrence = await executeQuery(`
        SELECT 
            o.editing,
            o.id,
            LEFT(o.title, 100) as title,
            o.status,
            o.company_id,
            o.reference,
            LEFT(o.description, 100) AS description,
            ot.name AS type,
            ot.id AS typeID,
            o.occurrence_date AS date_occurrence,
            CONCAT(cp.city, ', ', cp.country) AS company_name
        FROM 
            occurrences o
        JOIN 
            occurrences_type ot ON o.type_id = ot.id
		JOIN 
            companies cp ON cp.id = o.company_id
        ORDER BY o.id DESC`)



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
                company_id:item.company_id,
                company_name:item.company_name,
                id:item.id,
                statusID:parseInt(item.status),
                status: `<span class="badge bg-danger-transparent">${status[item.status]}</span>`,
                reference: `<span class="text-success fw-semibold">#${item.reference}</span>`,
                responsibles: `<div class="avatar-list-stacked">${users}</div>`,
                date_occurrence_noformat:item.date_occurrence,
                date_occurrence: `<span class="icon-text-align">
                    <i class="las la-calendar-alt fs-5"></i> ${non_compliance.formatDate(item.date_occurrence)}
                </span>`,
                description: `<span style="display: inline-block; max-width: 281px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${item.description}</span>`,
                type: item.type,
                typeID:item.typeID,
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
            5: 'Desenvolvimento - Ação Corretiva',
            6: 'Desenvolvimento - Avaliação de Eficácia',
            7: 'Finalizado'
        }

        const occurrence = await executeQuery(`
            SELECT 
                o.second_part,
                o.editing,
                o.title,
                o.id,
                o.status,
                o.openTo,
                o.loss_value,
                o.client_id,
                o.reference,
                o.ROMFN,
                o.create_at,
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
                oia.root_cause,
                oo.name as 'originName',
                cmp.city as 'companycity',
                cmp.country as 'companycountry',
               CONCAT(c.name, ' ', c.family_name) AS openToName -- Nome completo do criador
            FROM 
                occurrences o
            JOIN 
                occurrences_type ot ON o.type_id = ot.id
            JOIN 
                occurrences_origin oo ON o.origin_id = oo.id    
			JOIN 
                companies cmp ON o.company_id = cmp.id 
            LEFT JOIN 
                occurrences_ishikawa_analysis oia ON oia.occurrence_id = o.id
			LEFT JOIN 
                collaborators c ON c.id = o.openTo
            WHERE o.id = ${id}`)



        const formtOccurrence = await Promise.all(occurrence.map(async function(item) {

        const responsibles = await executeQuery(`
        SELECT usr.email, ors.*, clt.* FROM occurrences_responsibles ors
        join collaborators clt ON clt.id = ors.collaborator_id
        join users usr ON usr.collaborator_id = ors.collaborator_id
        WHERE ors.occurrence_id = ${item.id}`)


        const Actions = await non_compliance.getActionsByOccurrence(item.id)
        let actionAllStatus = Actions.length > 0 ? true : false
        
        for (let index = 0; index < Actions.length; index++) {
            const element = Actions[index];
            if(element.evidence == '[]'){
                actionAllStatus = false
                break;
            }
        }


        const Effectivenes = await non_compliance.getEffectivenessByOccurrence(item.id)
        let EffectivenesAllStatus = Effectivenes.length > 0 ? true : false
        for (let index = 0; index < Effectivenes.length; index++) {
            const element = Effectivenes[index];
            if(element.evidence == '[]'){
                EffectivenesAllStatus = false
                break;
            }
        }


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
                typeId: item.typeId,
                actionAllStatus:actionAllStatus,
                EffectivenesAllStatus:EffectivenesAllStatus
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
        (title, company_id, origin_id, type_id, occurrence_date, description, correction, create_at, client_id, loss_value, openTo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            formBody.occurrence,
            formBody.company_id,
            formBody.origin_id,
            formBody.type_id,
            formBody.occurrence_date,
            formBody.description,
            formBody.correction,
            date,
            formBody.client_id,
            formBody.loss_value,
            formBody.openTo,
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

            this.sendEmail(`[INTERNO] ${reference} - Nova ocorrência aberta`, null, 'open', null, insertOccurrence.insertId)
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

      return true
    },
    saveOccurence: async function(body) {
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
            
            // this.sendEmail(`[INTERNO] ${reference} - 1° Etapa da corrência foi alterada.`, null, 'open', null, occurrence_id)
        }
        // console.log(manpower || method || material || environment || machine || root_cause)
        // Verificar se pelo menos um dos campos obrigatórios está presente e não está vazio
        if (manpower || method || material || environment || machine || root_cause) {
            console.log('dsadsaentrou')
            await non_compliance.setIshikawaAnalysis(body.formBody)
            // this.sendEmail(`[INTERNO] ${reference} - 2° Etapa da corrência foi alterada.`, null, 'open', null, occurrence_id)
        }


        return true
     
    },    
    getHistory: async function(id){
        const history = await executeQuery(`SELECT * FROM occurrences_history oh
            JOIN collaborators clt ON clt.id = oh.collaborator_id
            WHERE oh.occurrence_id = ${id} ORDER BY oh.id_history desc`)

        return history;
    },
    changeBlock: async function(body){
        const {type,prop, id, obs, userId} = body
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

        const ocurrence = await this.getOcurrenceById(occurrence_id);
        const colabId = await Users.getColabById(action_responsible)


       try {
        const actions = await non_compliance.getActionsByOccurrence(occurrence_id)
        this.sendEmailToEmail(colabId[0].system_email, `[INTERNO] ${ocurrence.reference} - Ação Corretiva vinculada a você.`, null, 'action', null, occurrence_id, actions)

        const result = await executeQuery(sql, values);

        const verifyResponsible = await executeQuery(`SELECT * FROM occurrences_responsibles WHERE occurrence_id = ? AND collaborator_id = ?`, [occurrence_id, action_responsible]);

        if(verifyResponsible.length == 0){
            await executeQuery(`INSERT INTO occurrences_responsibles (occurrence_id, collaborator_id) VALUES (?, ?)`,
            [occurrence_id, action_responsible])
        }

        
        return result
       } catch (error) {
        console.log(error)
       }

        
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
    getActionsPendentsByUser: async function(userID) {
        const sql = `SELECT occ.reference, oca.*,clt.family_name, clt.name, clt.id_headcargo FROM occurrences_corrective_actions oca
        JOIN collaborators clt ON clt.id = oca.responsible_id
        JOIN occurrences occ ON occ.id = oca.occurrence_id
        WHERE 
        responsible_id = ?
        ORDER BY oca.id desc`;

        

        const result = await executeQuery(sql, [userID]);


        const status = {
            0: 'Pendente',
            1: 'Aguardando Aprovação',
            2: 'Aguardando Ajuste',
            3: 'Finalizado',
        }


        const Actions = await Promise.all(result.map(async function(item) {
            let statusTemp = item.evidence == '[]' ? 0 : 3
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
                status: `<span class="badge bg-danger-transparent">${status[statusTemp]}</span>`,
                action: item.action,
                deadline: `<span class="badge bg-danger-transparent"><i class="bi bi-clock me-1"></i>${non_compliance.formatDate(item.deadline)}</span>`,
                responsible:users,
                statusID: item.evidence == '[]' ? 0 : 3,
                verifyEvidence: JSON.parse(item.evidence).length > 0 ? '<span class="badge bg-success-transparent">Sim</span>' : '<span class="badge bg-danger-transparent">Não</span>'
            };
        }));

        return Actions;
    },
    getAllActions: async function() {
        const sql = `SELECT occ.reference, oca.*,clt.family_name, clt.name, clt.id_headcargo FROM occurrences_corrective_actions oca
        JOIN collaborators clt ON clt.id = oca.responsible_id
        JOIN occurrences occ ON occ.id = oca.occurrence_id
        ORDER BY oca.id desc`;

        const result = await executeQuery(sql);


        const status = {
            0: 'Pendente',
            1: 'Ag. Aprovação',
            2: 'Ag. Ajuste',
            3: 'Finalizado',
        }

        
        
        
        const Actions = await Promise.all(result.map(async function(item) {
            let statusTemp = item.evidence == '[]' ? 0 : 3
            const users = `<div class="d-flex align-items-center">
                                <span class="avatar avatar-sm  me-1 bg-light avatar-rounded" title="${item.name} ${item.family_name}"> 
                                    <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt=""> 
                                </span>
                                <a href="javascript:void(0);" class="fw-semibold mb-0">
                                    ${item.name} ${item.family_name}
                                </a>
                            </div>`

                            // console.log(statusTemp)
            return {
                ...item, // mantém todas as propriedades existentes
                status: ` <span class="text-muted float-end fs-11 fw-normal"> ${status[statusTemp]}</span>`,
                action: item.action,
                deadline: `<span class="badge bg-danger-transparent"><i class="bi bi-clock me-1"></i>${non_compliance.formatDate(item.deadline)}</span>`,
                responsible:users,
                statusID: item.evidence == '[]' ? 0 : 3,
                verifyEvidence: JSON.parse(item.evidence).length > 0 ? '<span class="badge bg-success-transparent">Sim</span>' : '<span class="badge bg-danger-transparent">Não</span>'
            };
        }));

        return Actions;
    },
    getActionsByOccurrence: async function(occurrenceId) {
        const sql = `SELECT oca.*,clt.family_name, clt.name, clt.id_headcargo FROM occurrences_corrective_actions oca
        JOIN collaborators clt ON clt.id = oca.responsible_id
        WHERE occurrence_id = ? ORDER BY oca.id desc`;

        const result = await executeQuery(sql, [occurrenceId]);


      
        const status = {
            0: 'Pendente',
            1: 'Ag. Aprovação',
            2: 'Ag. Ajuste',
            3: 'Finalizado',
        }

        const Actions = await Promise.all(result.map(async function(item) {
            let statusTemp = item.evidence == '[]' ? 0 : 3
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
                actionLimit:`<span class="limitText">${item.action}</span>`,
                status: `<span class="badge bg-danger-transparent">${status[statusTemp]}</span>`,
                action: item.action,
                deadline: `<span class="badge bg-danger-transparent"><i class="bi bi-clock me-1"></i>${non_compliance.formatDate(item.deadline)}</span>`,
                responsible:users,
                statusID: item.evidence == '[]' ? 0 : 3,
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
            1: 'Ag. Aprovação',
            2: 'Ag. Ajuste',
            3: 'Finalizado',
        }

        const Effectiveness = await Promise.all(result.map(async function(item) {
            let statusTemp = item.evidence == '[]' ? 0 : 3;
      
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
                status: `<span class="badge bg-danger-transparent">${status[statusTemp]}</span>`,
                action: item.action,
                deadline: `<span class="badge bg-danger-transparent"><i class="bi bi-clock me-1"></i>${non_compliance.formatDate(item.deadline)}</span>`,
                responsible:users,
                statusID: item.status,
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
    getAllClients: async function () {
        const sql = `SELECT Psa.IdPessoa AS IDCLIENTE,
                              Psa.Nome AS CLIENTE,
                              Psa.Cpf_Cnpj AS CNPJ
                           FROM
                              cad_Pessoa Psa`;

        const result = await executeQuerySQL(sql);
        return result;
    },
    VerifyDeadLine: async function () {
        // função para verificar os prazos se eles estiverem vencidos

        const sql = `SELECT * FROM occurrences_effectiveness_evaluation WHERE evidence = '[]' AND deadline < CURDATE();`;
        const sql3 = `SELECT * FROM occurrences_corrective_actions WHERE evidence = '[]' AND deadline < CURDATE();`;

        const result = await executeQuery(sql);
        const result2 = await executeQuery(sql3);


        let templateEmail = ``;

        



        sendEmail('petryck.leite@conlinebr.com.br',`[INTERNO] - Lembrete de prazos vencidos.`, templateEmail)
        // recipient, subject, htmlContent

        console.log({ result, result2 })
        return { result, result2 };
    },
}



// non_compliance.VerifyDeadLine()

module.exports = {
    non_compliance,
};