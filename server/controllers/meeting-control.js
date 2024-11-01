const { executeQuery } = require('../connect/mysql'); // Importa a função para executar consultas SQL
const { sendEmail } = require('../support/send-email');

const meetingControl = {

    // Esta função busca todas as catgorias do calendario no banco de dados
    getAllCategoryCalendar: async function () {
        const result = await executeQuery(`
            SELECT * FROM calendar_category`)

        return result;
    },

    getEventsByUser: async function (loggedInfo) {

        let result = await executeQuery(`
            SELECT ce.id, ce.title, cc.color, date_format(ce.init_date, '%Y-%m-%d') as 'start', date_format(ce.end_date, '%Y-%m-%d') as 'end', 
            GROUP_CONCAT(DISTINCT cr.collaborator_id) AS collaborator_ids, GROUP_CONCAT(DISTINCT cd.department_id) AS department_ids
            FROM calendar_events ce
            LEFT OUTER JOIN calendar_category cc ON cc.id = ce.id_category
            LEFT OUTER JOIN calendar_events_resps cr ON cr.event_id = ce.id
            LEFT OUTER JOIN calendar_event_depts cd ON cd.event_id = ce.id
            WHERE ce.id_collaborator = ${loggedInfo.system_collaborator_id}
            OR cr.collaborator_id = ${loggedInfo.system_collaborator_id}
            OR cd.department_id = ${loggedInfo.department_ids}
            GROUP BY ce.id, ce.title, cc.color, ce.init_date, ce.end_date;`);

        return result;
    },

    getAllEventsFull: async function () {
        let result = await executeQuery(`
            SELECT ce.id, ce.title, ce.description, cc.id as 'id_category', cc.name as 'category', cc.color, date_format(ce.init_date, '%Y-%m-%d') as 'start',
            date_format(ce.end_date, '%Y-%m-%d') as 'end', ce.init_date, ce.end_date, cl.name as 'collaborator'
            FROM calendar_events ce
            LEFT OUTER JOIN calendar_category cc on cc.id = ce.id_category
            LEFT OUTER JOIN collaborators cl on cl.id = ce.id_collaborator
            ORDER BY init_date`)

        return result;
    },

    getResponsiblesCallendar: async function (data) {

        const collabList = data.responsibles.map(id => `'${String(id).replace(/'/g, "''")}'`).join(', ');

        let result = await executeQuery(`
            SELECT cer.*, cl.name, cl.family_name
            FROM calendar_events_resps cer
            LEFT OUTER JOIN collaborators cl on cl.id = cer.collaborator_id
            WHERE cer.collaborator_id IN (${collabList})
            AND (('${data.start}' <= cer.event_end_date AND '${data.end}' >= cer.event_init_date));`)

        return result;
    },

    subtractByOne: async function (datetime, param) {
        const date = new Date(datetime.replace(' ', 'T'));
        
        if (param == 'minute') {
            date.setMinutes(date.getMinutes() - 1);
        }

        if (param == 'day') {
            date.setDate(date.getDate() - 1);
        }
        
        // Formata de volta para "YYYY-MM-DD HH:MM"
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    
    saveEvent: async function (eventData) {

        eventData.timeEnd = await this.subtractByOne(eventData.timeEnd, 'minute');
        const notificationDate = await this.subtractByOne(eventData.timeInit, 'day');

        const result = await executeQuery(
            'INSERT INTO calendar_events (id_category, title, description, id_collaborator, init_date, end_date, notification_date, notificate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [eventData.eventCategory, eventData.title, eventData.description, eventData.responsible, eventData.timeInit, eventData.timeEnd, notificationDate, 0]
        );

        if (eventData.departments.length > 0) {
            const departments = eventData.departments;
            for (let index = 0; index < departments.length; index++) {
                await executeQuery(`
                    INSERT INTO calendar_event_depts (event_id, department_id) VALUES (?, ?)`, [result.insertId, departments[index]]);
            }
        }

        if (eventData.responsibles.length > 0) {
            const responsibles = eventData.responsibles;
            for (let index = 0; index < responsibles.length; index++) {
                await executeQuery(`
                    INSERT INTO calendar_events_resps (event_id, collaborator_id, event_init_date, event_end_date) VALUES (?, ?, ?, ?)`, [result.insertId, responsibles[index], eventData.timeInit, eventData.timeEnd]);
            }
        }
        this.createMessage(eventData);

        return { id: result.insertId};
    },

    notificateMessage: async function () {
        const result = await executeQuery(`
            SELECT ce.*, cl.name, cl.family_name, cl.email_business
            FROM calendar_events ce
            LEFT OUTER JOIN collaborators cl on cl.id = ce.id_collaborator
            WHERE (
                CASE 
                    WHEN DAYOFWEEK(NOW()) = 6 THEN DATE(init_date) IN (DATE(NOW() + INTERVAL 1 DAY), DATE(NOW() + INTERVAL 2 DAY), DATE(NOW() + INTERVAL 3 DAY))
                    ELSE DATE(init_date) = DATE(NOW() + INTERVAL 1 DAY)
                END
            )
            AND notificate = 0;`);
        
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };

        for (let index = 0; index < result.length; index++) {
            result[index].init_date = new Date(result[index].init_date);
            result[index].init_date = result[index].init_date.toLocaleString('pt-BR', options);
            const emailsArray = [];

            const responsibles = await executeQuery(`
                SELECT cer.*, cl.email_business
                FROM siriusDBO.calendar_events_resps cer
                LEFT OUTER JOIN collaborators cl on cl.id = cer.collaborator_id
                WHERE event_id = ${result[index].id}`);
            for (let index = 0; index < responsibles.length; index++) {
                emailsArray[index] = responsibles[index].email_business;
            }

            await executeQuery(`UPDATE calendar_events SET notificate = 1, notification_date = NOW() WHERE id = ${result[index].id}`);

            let mailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;"></h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="color: #333; font-size: 16px;">Olá,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Você está envolvido em um evento que acontecerá em breve! 😎</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Aqui estão os detalhes do agendamento, se precisar de algo pode nos chamar!</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Funcionário Responsável:</td>
                        <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${result[index].name} ${result[index].family_name}</td>
                    </tr>
                    <tr>
                        <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Evento:</td>
                        <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${result[index].title}</td>
                    </tr>
                    <tr>
                        <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Previsão de Início:</td>
                        <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${result[index].init_date}</td>
                    </tr>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
                </div>
                <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
                </div>
            </div>`
    
            sendEmail('lucas@conlinebr.com.br', '[Sirius System] Um evento se aproxima! ', mailBody);
        }

        return true;
    },

    updateEvent: async function (eventData) {

        const result = await executeQuery(`
            UPDATE calendar_events SET
            id_category = ${eventData.eventCategory},
            title = '${eventData.title}',
            id_collaborator = ${eventData.responsible},
            description = '${eventData.description}',
            init_date =  '${eventData.timeInit}',
            end_date = '${eventData.timeEnd}'
            WHERE id = ${eventData.id};`);

        await executeQuery(`DELETE FROM calendar_event_depts WHERE event_id = ${eventData.id}`);
        await executeQuery(`DELETE FROM calendar_events_resps WHERE event_id = ${eventData.id}`);

        if (eventData.departments.length > 0) {
            const departments = eventData.departments;
            for (let index = 0; index < departments.length; index++) {
                await executeQuery(`
                    INSERT INTO calendar_event_depts (event_id, department_id) VALUES (?, ?)`, [eventData.id, departments[index]]);
            }
        }

        if (eventData.responsibles.length > 0) {
            const responsibles = eventData.responsibles;
            for (let index = 0; index < responsibles.length; index++) {
                await executeQuery(`
                    INSERT INTO calendar_events_resps (event_id, collaborator_id, event_init_date, event_end_date) VALUES (?, ?, ?, ?)`, [eventData.id, responsibles[index], eventData.timeInit, eventData.timeEnd]);
            }
        }
        return result;
    },

    verifyFreeRoom: async function (firstDate, lastDate){
        const result = await executeQuery(`
            SELECT *
            FROM calendar_events
            WHERE id_category = 3
            AND (('${firstDate}' < end_date AND '${lastDate}' > init_date));`);

        return result.length;
    },

    verifyFreeBooth: async function (firstDate, lastDate){
        const result = await executeQuery(`
            SELECT *
            FROM calendar_events
            WHERE id_category = 5
            AND (('${firstDate}' < end_date AND '${lastDate}' > init_date));`);

        return result.length;
    },

    deleteEvent: async function (id) {

        await executeQuery(`
            DELETE FROM calendar_events WHERE id = ${id}`);

        await executeQuery(`
            DELETE FROM calendar_event_depts WHERE event_id = ${id}`);

        await executeQuery(`
            DELETE FROM calendar_events_resps WHERE event_id = ${id}`);

        return true;
    },

    getCollabData: async function (collabData) {
        const result = await executeQuery(`
            SELECT *
            FROM collaborators
            WHERE email_business = '${collabData.email}'`);

        const resultArray = result.map(item => ({
            name: item.name,
            family_name: item.family_name,
            email: item.email_business,
            collabId: item.id,
            headcargoId: item.id_headcargo
        }));

        return resultArray;
    },

    updateEventDate: async function (id, days) {
        const result = await executeQuery(`
            UPDATE calendar_events SET init_date =  DATE_ADD(init_date, INTERVAL ${days} DAY), end_date = DATE_ADD(end_date, INTERVAL ${days} DAY) WHERE id = ${id}`);

        return result;
    },

    getById: async function (id) {

        const result = await executeQuery(`
            SELECT * FROM calendar_events
            WHERE id = ${id}`);

        return result;
    },

    getDepartmentsbyEvent: async function (id) {

        const result = await executeQuery(`
            SELECT * FROM calendar_event_depts
            WHERE event_id = ${id}`);

        return result;
    },

    getResponsiblesbyEvent: async function (id) {

        const result = await executeQuery(`
            SELECT * FROM calendar_events_resps
            WHERE event_id = ${id}`);

        return result;
    },

    createMessage: async function (eventData) {

        const collabData = await executeQuery(`
            SELECT cl.id, cl.name, cl.family_name, cl.email_business, dr.department_id
            FROM collaborators cl
            LEFT OUTER JOIN departments_relations dr on dr.collaborator_id = cl.id
            WHERE cl.id = ${eventData.responsible}`);

        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        eventData.timeInit = new Date(eventData.timeInit);
        eventData.timeInit = eventData.timeInit.toLocaleString('pt-BR', options);

        const deptsArray = [];
        let departmentsLine = '';
        if (eventData.departments.length > 0){
            for (let index = 0; index < eventData.departments.length; index++) {
                const department = await executeQuery(`
                    SELECT * FROM departments
                    WHERE id = ${eventData.departments[index]}`);
                    deptsArray[index] = ' ' + department[0].name;
            }
            departmentsLine = `
                            <tr>
                                <td colspan="2" style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                    <h5 style="margin: 0px; margin-bottom: 10px; font-weight: bold">Departamentos envolvidos:</h5>
                                    <h4 style="margin: 0px; font-weight: bold">${deptsArray}</h4>
                                </td>
                            </tr>`
        }

        const respsArray = [];
        const emailsArray = [];
        let responsiblesLine = '';
        if (eventData.responsibles.length > 0){
            for (let index = 0; index < eventData.responsibles.length; index++) {
                const responsibles = await executeQuery(`
                    SELECT cl.id, cl.name, cl.family_name, cl.email_business, dr.department_id
                    FROM collaborators cl
                    LEFT OUTER JOIN departments_relations dr on dr.collaborator_id = cl.id
                    WHERE cl.id = ${eventData.responsibles[index]}`);
                    respsArray[index] = ' ' + responsibles[0].name + ' ' + responsibles[0].family_name;
                    emailsArray[index] = responsibles[0].email_business;
            }
            responsiblesLine = `
                            <tr>
                                <td colspan="2" style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5;">
                                    <h5 style="margin: 0px; margin-bottom: 10px; font-weight: bold">Pessoas envolvidas:</h5>
                                    <h4 style="margin: 0px; font-weight: bold">${respsArray}</h4>
                                </td>
                            </tr>`
        }

        let mailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <div style="background-color: #F9423A; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;"></h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
                <p style="color: #333; font-size: 16px;">Olá,</p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Tem um novo evento em que você está atrelado! 😎</p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Aqui estão os detalhes da reserva, te avisaremos de novo quando a data estiver próxima:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Funcionário Responsável:</td>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${collabData[0].name} ${collabData[0].family_name}</td>
                </tr>
                <tr>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Evento:</td>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${eventData.title}</td>
                </tr>
                <tr>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">Previsão de Início:</td>
                    <td style="width: 50%; padding: 10px; border: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold;">${eventData.timeInit}</td>
                </tr>
                ${departmentsLine}
                ${responsiblesLine}
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Atenciosamente, equipe de suporte! 🤗</p>
            </div>
            <div style="background-color: #F9423A; padding: 10px; text-align: center; color: white;">
                <p style="margin: 0; font-size: 14px;">Sirius System - Do nosso jeito</p>
            </div>
        </div>`

        sendEmail(emailsArray, '[Sirius System] Novo evento criado! ', mailBody);

        return true;
    },

    getCollabsByDept: async function(deptId){

        if (deptId.deptId.length == 0){
            deptId.deptId[0] = 0;
        }

        let where = '';
        for (let index = 0; index < deptId.deptId.length; index++) {
            if (index == 0) {
                where += deptId.deptId[index];
            }
            if (index > 0) {
                where += ' OR department_id = ' + deptId.deptId[index];
            }
        }

        const result = await executeQuery(`
            SELECT *
            FROM departments_relations
            WHERE department_id = ${where}`);
        return result;
    }
}

// Exporta o objeto moduleManagement para uso em outros módulos
module.exports = {
    meetingControl,
};
