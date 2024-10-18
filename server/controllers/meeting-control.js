const { executeQuery } = require('../connect/mysql'); // Importa a função para executar consultas SQL

const meetingControl = {

    // Esta função busca todas as catgorias do calendario no banco de dados
    getAllCategoryCalendar: async function () {
        const result = await executeQuery(`
            SELECT * FROM calendar_category`)

        return result;
    },

    getAllEvents: async function () {
        let result = await executeQuery(`
            SELECT ce.id, ce.title, cc.color, date_format(ce.init_date, '%Y-%m-%d') as 'start', date_format(ce.end_date, '%Y-%m-%d') as 'end'
            FROM calendar_events ce
            LEFT OUTER JOIN calendar_category cc on cc.id = ce.id_category`)

        return result;
    },

    saveEvent: async function (eventData) {

        const result = await executeQuery(
            'INSERT INTO calendar_events (id_category, title, description, id_collaborator, init_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [eventData.eventCategory, eventData.title, eventData.description, eventData.responsible, eventData.timeInit, eventData.timeEnd]
        );

        if (eventData.departments.length > 0) {
            const departments = eventData.departments;
            for (let index = 0; index < departments.length; index++) {
                await executeQuery(`
                    INSERT INTO calendar_event_depts (event_id, department_id) VALUES (?, ?)`, [result.insertId, departments[index]]);
            }
        }

        return { id: result.insertId};
    },

    updateEvent: async function (eventData) {

        console.log(eventData);

        return false;

        
            'UPDATE INTO calendar_events (id_category, title, description, id_collaborator, init_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [eventData.eventCategory, eventData.title, eventData.description, eventData.responsible, eventData.timeInit, eventData.timeEnd]

        const result = await executeQuery(`
            UPDATE calendar_events SET

            init_date =  ${eventData.timeInit},
            end_date = ${eventData.timeEnd},
            WHERE id = ${eventData.id};`)

        if (eventData.departments.length > 0) {
            const departments = eventData.departments;
            for (let index = 0; index < departments.length; index++) {
                await executeQuery(`
                    INSERT INTO calendar_event_depts (event_id, department_id) VALUES (?, ?)`, [result.insertId, departments[index]]);
            }
        }

        return { id: result.insertId};
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
            SELECT * FROM siriusDBO.calendar_event_depts
            WHERE event_id = ${id}`);

        return result;
    }

}

// Exporta o objeto moduleManagement para uso em outros módulos
module.exports = {
    meetingControl,
};
