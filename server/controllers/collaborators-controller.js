// controllers/collaborators-controller.js
const { executeQuery } = require('../connect/mysql');

const collaboratorsController = {
    getAllDepartments: async function(){
        const query = `SELECT * FROM departments`;
        const result = await executeQuery(query);
        return result;
    },
    getAllContractType: async function(){
        const query = `SELECT * FROM collaborators_contract_type`;
        const result = await executeQuery(query);
        return result;
    },
    // CRUD para 'collaborators'
    createCollaborator: async function(collaborator) {
        console.log(collaborator)
        
        const query = `INSERT INTO collaborators 
        (name, family_name,id_headcargo, birth_date, gender, marital_status, nationality, cpf, rg, rg_issuer, rg_issue_date, 
        voter_title, passport_number, birth_city, mother_name, father_name, job_position, department, 
        admission_date, resignation_date, employee_id, salary, contract_type, weekly_hours, immediate_supervisor, 
        pis_pasep_number, work_card_number, work_card_series, education, email_personal, email_business, cnpj, pix, work_card_issue_date, additional_observations, companie_id, id_headcargo, languages) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await executeQuery(query, [
        collaborator.name,
        collaborator.family_name,
        collaborator.id_headcargo || null,
        collaborator.birthdate || null,
        collaborator.gender,
        collaborator.maritalStatus,
        collaborator.nationality,
        collaborator.cpf,
        collaborator.rg,
        collaborator.rgIssuer,
        collaborator.rgIssueDate || null,
        collaborator.voterTitle,
        collaborator.passportNumber,
        collaborator.birthCity,
        collaborator.motherName,
        collaborator.fatherName,
        collaborator.jobTitle,
        collaborator.department,
        collaborator.admissionDate || null,
        collaborator.terminationDate || null,
        collaborator.registrationNumber || null, // Ajuste se 'employee_id' for correto ou se precisa ser outro campo
        collaborator.salary || null,
        collaborator.contractType,
        collaborator.workload || null, // Ajuste se 'weekly_hours' for o nome correto da coluna
        collaborator.immediateSupervisor,
        collaborator.pisNumber,
        collaborator.workCardNumber,
        collaborator.workCardSeries,
        collaborator.educationLevel, // Verifique se 'educationLevel' corresponde à coluna 'education' na tabela
        collaborator.personalEmail,
        collaborator.emailBusiness,
        collaborator.cnpj,
        collaborator.pix,
        collaborator.workCardIssueDate,
        collaborator.additionalObservations,
        collaborator.companie,
        collaborator.id_headcargo,
        collaborator.languages,
    ]);

        return result.insertId;
    },

    getCollaboratorById: async function(id) {
        const query = `SELECT * FROM collaborators WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },

    getCollaboratorBirthDate: async function(){
        const result = await executeQuery(`SELECT 
        id, 
        name,
        family_name,
        id_headcargo,
        birth_date, 
        DATE_FORMAT(birth_date, '%d/%m') AS birthday, 
        DATE_FORMAT(birth_date, '%d/%m') AS birthday_formated, 
        DATE_FORMAT(CONCAT(YEAR(CURDATE()), '-', MONTH(birth_date), '-', DAY(birth_date)), '%Y-%m-%d') AS next_birthday
      FROM 
        collaborators
      WHERE 
        birth_date IS NOT NULL
      ORDER BY 
        CASE
          -- Se o aniversário ainda não aconteceu este ano, ordena pela data de aniversário
          WHEN DATE_FORMAT(birth_date, '%m-%d') >= DATE_FORMAT(CURDATE(), '%m-%d') THEN 
            DATE_FORMAT(CONCAT(YEAR(CURDATE()), '-', MONTH(birth_date), '-', DAY(birth_date)), '%Y-%m-%d')
          -- Caso contrário, ordena pelo próximo aniversário no próximo ano
          ELSE 
            DATE_FORMAT(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(birth_date), '-', DAY(birth_date)), '%Y-%m-%d')
        END ASC;
      `)

      return result;
    },

    getCollaboratorAdmissionDate: async function(){
        const result = await executeQuery(`SELECT 
        id, 
        name,
        family_name,
        id_headcargo,
        admission_date, 
        DATE_FORMAT(admission_date, '%d/%m') AS admission_anniversary, 
        DATE_FORMAT(CONCAT(YEAR(CURDATE()), '-', MONTH(admission_date), '-', DAY(admission_date)), '%Y-%m-%d') AS next_admission_anniversary,
      
        -- Cálculo do tempo de empresa em anos, meses e dias
        CONCAT(
          CASE 
            -- Anos completos
            WHEN TIMESTAMPDIFF(YEAR, admission_date, CURDATE()) > 0 
            THEN CONCAT(TIMESTAMPDIFF(YEAR, admission_date, CURDATE()), ' ano(s) ') 
            ELSE '' 
          END,
          CASE 
            -- Meses completos, sem contar os anos já considerados
            WHEN TIMESTAMPDIFF(MONTH, DATE_ADD(admission_date, INTERVAL TIMESTAMPDIFF(YEAR, admission_date, CURDATE()) YEAR), CURDATE()) > 0
            THEN CONCAT(TIMESTAMPDIFF(MONTH, DATE_ADD(admission_date, INTERVAL TIMESTAMPDIFF(YEAR, admission_date, CURDATE()) YEAR), CURDATE()), ' mês(es) ')
            ELSE '' 
          END,
          CASE 
            -- Dias restantes, após anos e meses terem sido contabilizados
            WHEN DATEDIFF(CURDATE(), 
                          DATE_ADD(
                            DATE_ADD(admission_date, INTERVAL TIMESTAMPDIFF(YEAR, admission_date, CURDATE()) YEAR),
                            INTERVAL TIMESTAMPDIFF(MONTH, DATE_ADD(admission_date, INTERVAL TIMESTAMPDIFF(YEAR, admission_date, CURDATE()) YEAR), CURDATE()) MONTH
                          )) > 0 
            THEN CONCAT(DATEDIFF(CURDATE(), 
                          DATE_ADD(
                            DATE_ADD(admission_date, INTERVAL TIMESTAMPDIFF(YEAR, admission_date, CURDATE()) YEAR),
                            INTERVAL TIMESTAMPDIFF(MONTH, DATE_ADD(admission_date, INTERVAL TIMESTAMPDIFF(YEAR, admission_date, CURDATE()) YEAR), CURDATE()) MONTH
                          )), ' dia(s)')
            ELSE '' 
          END
        ) AS tempo_de_empresa
        
      FROM 
        collaborators
      WHERE 
        admission_date IS NOT NULL
      ORDER BY 
        CASE
          -- Se o aniversário de admissão ainda não aconteceu este ano, ordena pela data de admissão
          WHEN DATE_FORMAT(admission_date, '%m-%d') >= DATE_FORMAT(CURDATE(), '%m-%d') THEN 
            DATE_FORMAT(CONCAT(YEAR(CURDATE()), '-', MONTH(admission_date), '-', DAY(admission_date)), '%Y-%m-%d')
          -- Caso contrário, ordena pelo próximo aniversário de admissão no próximo ano
          ELSE 
            DATE_FORMAT(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(admission_date), '-', DAY(admission_date)), '%Y-%m-%d')
        END ASC;
      `)

      return result;
    },

    getAllCollaborators: async function() {
        const query = `SELECT 
        clt.*,
        DATE_FORMAT(clt.admission_date, '%d/%m') AS admission_day_month,
        CASE
            WHEN TIMESTAMPDIFF(YEAR, clt.admission_date, CURDATE()) > 0 THEN 
                CONCAT(TIMESTAMPDIFF(YEAR, clt.admission_date, CURDATE()), ' Anos')
            WHEN TIMESTAMPDIFF(MONTH, clt.admission_date, CURDATE()) > 0 THEN 
                CONCAT(TIMESTAMPDIFF(MONTH, clt.admission_date, CURDATE()), ' Meses')
            ELSE 
                CONCAT(TIMESTAMPDIFF(DAY, clt.admission_date, CURDATE()), ' Dias')
            END AS time_with_company,
            CONCAT(cmp.city, ' | ', cmp.country) as companie_name,
            cnt.name as contract_name
        FROM 
            collaborators clt
        LEFT JOIN companies cmp ON cmp.id = clt.companie_id
        LEFT JOIN collaborators_contract_type cnt ON cnt.id = clt.contract_type`;
        const result = await executeQuery(query);
        return result;
    },

    turnoverGeneral: async function(){
        const result = await executeQuery(`
        SELECT 
            ((admissoes.total_admissoes + desligamentos.total_desligamentos) / 2) / total_colaboradores.total_colaboradores * 100 AS turnover
        FROM
            (SELECT COUNT(*) AS total_admissoes
             FROM collaborators
             WHERE admission_date BETWEEN '2024-08-01' AND '2024-08-31') AS admissoes,
            (SELECT COUNT(*) AS total_desligamentos
             FROM collaborators
             WHERE resignation_date BETWEEN '2024-08-01' AND '2024-08-01') AS desligamentos,
            (SELECT COUNT(*) AS total_colaboradores
             FROM collaborators
             WHERE admission_date <= '2024-08-01'
               AND (resignation_date is null OR resignation_date > '2024-08-01')) AS total_colaboradores;`);
               
        return result[0].turnover;
    },

    turnoverMonth: async function(){
        const result = await executeQuery(`SELECT 
        DATE_FORMAT(STR_TO_DATE(CONCAT('2024-', month_table.month, '-01'), '%Y-%m-%d'), '%M') AS month,
        COALESCE(admissoes.total_admissoes, 0) AS total_admissoes,
        COALESCE(desligamentos.total_desligamentos, 0) AS total_desligamentos,
        CONCAT(
            FORMAT(
                (
                    (COALESCE(admissoes.total_admissoes, 0) + COALESCE(desligamentos.total_desligamentos, 0)) / 2
                ) / 
                COALESCE(total_colaboradores.total_colaboradores, 1) * 100
            , 2), '%'
        ) AS turnover
    FROM
        (SELECT 1 AS month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
         SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION
         SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) AS month_table
    LEFT JOIN
        (SELECT 
             MONTH(admission_date) AS month,
             COUNT(*) AS total_admissoes
         FROM collaborators
         WHERE YEAR(admission_date) = 2024
         GROUP BY MONTH(admission_date)) AS admissoes
    ON month_table.month = admissoes.month
    LEFT JOIN
        (SELECT 
             MONTH(resignation_date) AS month,
             COUNT(*) AS total_desligamentos
         FROM collaborators
         WHERE YEAR(resignation_date) = 2024
         GROUP BY MONTH(resignation_date)) AS desligamentos
    ON month_table.month = desligamentos.month
    LEFT JOIN
        (SELECT 
             month_table.month,
             COUNT(*) AS total_colaboradores
         FROM collaborators, (SELECT 1 AS month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
                              SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION
                              SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) AS month_table
         WHERE admission_date <= STR_TO_DATE(CONCAT('2024-', month_table.month, '-01'), '%Y-%m-%d')
           AND (resignation_date IS NULL OR resignation_date > STR_TO_DATE(CONCAT('2024-', month_table.month, '-01'), '%Y-%m-%d'))
         GROUP BY month_table.month) AS total_colaboradores
    ON month_table.month = total_colaboradores.month
    ORDER BY month_table.month;

    `);
               
        return result;
    },

    getAllCollaboratorsActive: async function() {
        const query = `SELECT 
        c.*,
        GROUP_CONCAT(d.name ORDER BY d.name ASC SEPARATOR ', ') AS departments_names
    FROM 
        collaborators c
    JOIN 
        departments_relations dr ON c.id = dr.collaborator_id
    JOIN 
        departments d ON dr.department_id = d.id
    WHERE 
        c.resignation_date IS NULL -- Somente colaboradores ativos
    GROUP BY 
        c.id, c.full_name
    ORDER BY 
        c.full_name ASC
        `;
        const result = await executeQuery(query);
        return result;
    },

    updateCollaborator: async function(id, collaborator) {
        const query = `UPDATE collaborators SET 
        full_name = ?, birth_date = ?, gender = ?, marital_status = ?, nationality = ?, cpf = ?, rg = ?, rg_issuer = ?, 
        rg_issue_date = ?, voter_title = ?, passport_number = ?, birth_city = ?, birth_state = ?, mother_name = ?, 
        father_name = ?, job_position = ?, department = ?, admission_date = ?, resignation_date = ?, employee_id = ?, 
        salary = ?, contract_type = ?, weekly_hours = ?, immediate_supervisor = ?, pis_pasep_number = ?, 
        work_card_number = ?, work_card_series = ?, education = ? WHERE id = ?`;

        await executeQuery(query, [
            collaborator.full_name,
            collaborator.birth_date,
            collaborator.gender,
            collaborator.marital_status,
            collaborator.nationality,
            collaborator.cpf,
            collaborator.rg,
            collaborator.rg_issuer,
            collaborator.rg_issue_date,
            collaborator.voter_title,
            collaborator.passport_number,
            collaborator.birth_city,
            collaborator.birth_state,
            collaborator.mother_name,
            collaborator.father_name,
            collaborator.job_position,
            collaborator.department,
            collaborator.admission_date,
            collaborator.resignation_date,
            collaborator.employee_id,
            collaborator.salary,
            collaborator.contract_type,
            collaborator.weekly_hours,
            collaborator.immediate_supervisor,
            collaborator.pis_pasep_number,
            collaborator.work_card_number,
            collaborator.work_card_series,
            collaborator.education,
            id
        ]);
    },

    deleteCollaborator: async function(id) {
        const query = `DELETE FROM collaborators WHERE id = ?`;
        await executeQuery(query, [id]);
    },

    // CRUD para 'collaborators_addresses'
    createCollaboratorAddress: async function(address) {
        const query = `INSERT INTO collaborators_addresses 
        (collaborator_id, address_type, street, number, complement, neighborhood, city, state, postal_code) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const result = await executeQuery(query, [
            address.collaborator_id,
            address.address_type,
            address.street,
            address.number,
            address.complement,
            address.neighborhood,
            address.city,
            address.state,
            address.postal_code
        ]);

        return result.insertId;
    },

    getCollaboratorAddressById: async function(id) {
        const query = `SELECT * FROM collaborators_addresses WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },

    getAllCollaboratorAddresses: async function() {
        const query = `SELECT * FROM collaborators_addresses`;
        const result = await executeQuery(query);
        return result;
    },

    updateCollaboratorAddress: async function(id, address) {
        const query = `UPDATE collaborators_addresses SET 
        collaborator_id = ?, address_type = ?, street = ?, number = ?, complement = ?, neighborhood = ?, city = ?, 
        state = ?, postal_code = ? WHERE id = ?`;

        await executeQuery(query, [
            address.collaborator_id,
            address.address_type,
            address.street,
            address.number,
            address.complement,
            address.neighborhood,
            address.city,
            address.state,
            address.postal_code,
            id
        ]);
    },

    deleteCollaboratorAddress: async function(id) {
        const query = `DELETE FROM collaborators_addresses WHERE id = ?`;
        await executeQuery(query, [id]);
    },

    // CRUD para 'collaborators_contacts'
    createCollaboratorContact: async function(contact) {
        const query = `INSERT INTO collaborators_contacts 
        (collaborator_id, contact_type, contact_value) VALUES (?, ?, ?)`;
        
        const result = await executeQuery(query, [
            contact.collaborator_id,
            contact.contact_type,
            contact.contact_value
        ]);

        return result.insertId;
    },

    getCollaboratorContactById: async function(id) {
        const query = `SELECT * FROM collaborators_contacts WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },

    getAllCollaboratorContacts: async function() {
        const query = `SELECT * FROM collaborators_contacts`;
        const result = await executeQuery(query);
        return result;
    },

    updateCollaboratorContact: async function(id, contact) {
        const query = `UPDATE collaborators_contacts SET 
        collaborator_id = ?, contact_type = ?, contact_value = ? WHERE id = ?`;

        await executeQuery(query, [
            contact.collaborator_id,
            contact.contact_type,
            contact.contact_value,
            id
        ]);
    },

    deleteCollaboratorContact: async function(id) {
        const query = `DELETE FROM collaborators_contacts WHERE id = ?`;
        await executeQuery(query, [id]);
    },

    // CRUD para 'collaborators_qualifications'
    createCollaboratorQualification: async function(qualification) {
        const query = `INSERT INTO collaborators_qualifications 
        (collaborator_id, qualification_type, institution, course, completion_date) 
        VALUES (?, ?, ?, ?, ?)`;
        
        const result = await executeQuery(query, [
            qualification.collaborator_id,
            qualification.qualification_type,
            qualification.institution,
            qualification.course,
            qualification.completion_date
        ]);

        return result.insertId;
    },

    getCollaboratorQualificationById: async function(id) {
        const query = `SELECT * FROM collaborators_qualifications WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },

    getAllCollaboratorQualifications: async function() {
        const query = `SELECT * FROM collaborators_qualifications`;
        const result = await executeQuery(query);
        return result;
    },

    updateCollaboratorQualification: async function(id, qualification) {
        const query = `UPDATE collaborators_qualifications SET 
        collaborator_id = ?, qualification_type = ?, institution = ?, course = ?, completion_date = ? WHERE id = ?`;

        await executeQuery(query, [
            qualification.collaborator_id,
            qualification.qualification_type,
            qualification.institution,
            qualification.course,
            qualification.completion_date,
            id
        ]);
    },

    deleteCollaboratorQualification: async function(id) {
        const query = `DELETE FROM collaborators_qualifications WHERE id = ?`;
        await executeQuery(query, [id]);
    },

    // CRUD para 'collaborators_bank_info'
    createCollaboratorBankInfo: async function(bankInfo) {
        const query = `INSERT INTO collaborators_bank_info 
        (collaborator_id, bank_name, agency, account_number, account_type) VALUES (?, ?, ?, ?, ?)`;
        
        const result = await executeQuery(query, [
            bankInfo.collaborator_id,
            bankInfo.bank_name,
            bankInfo.agency,
            bankInfo.account_number,
            bankInfo.account_type
        ]);

        return result.insertId;
    },

    getCollaboratorBankInfoById: async function(id) {
        const query = `SELECT * FROM collaborators_bank_info WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },

    getAllCollaboratorBankInfo: async function() {
        const query = `SELECT * FROM collaborators_bank_info`;
        const result = await executeQuery(query);
        return result;
    },

    updateCollaboratorBankInfo: async function(id, bankInfo) {
        const query = `UPDATE collaborators_bank_info SET 
        collaborator_id = ?, bank_name = ?, agency = ?, account_number = ?, account_type = ? WHERE id = ?`;

        await executeQuery(query, [
            bankInfo.collaborator_id,
            bankInfo.bank_name,
            bankInfo.agency,
            bankInfo.account_number,
            bankInfo.account_type,
            id
        ]);
    },

    deleteCollaboratorBankInfo: async function(id) {
        const query = `DELETE FROM collaborators_bank_info WHERE id = ?`;
        await executeQuery(query, [id]);
    },

    // CRUD para 'collaborators_benefits'
    createCollaboratorBenefit: async function(benefit) {
        const query = `INSERT INTO collaborators_benefits 
        (collaborator_id, benefit_name, benefit_value, benefit_type) VALUES (?, ?, ?, ?)`;
        
        const result = await executeQuery(query, [
            benefit.collaborator_id,
            benefit.benefit_name,
            benefit.benefit_value,
            benefit.benefit_type
        ]);

        return result.insertId;
    },

    getCollaboratorBenefitById: async function(id) {
        const query = `SELECT * FROM collaborators_benefits WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },

    getAllCollaboratorBenefits: async function() {
        const query = `SELECT * FROM collaborators_benefits`;
        const result = await executeQuery(query);
        return result;
    },

    updateCollaboratorBenefit: async function(id, benefit) {
        const query = `UPDATE collaborators_benefits SET 
        collaborator_id = ?, benefit_name = ?, benefit_value = ?, benefit_type = ? WHERE id = ?`;

        await executeQuery(query, [
            benefit.collaborator_id,
            benefit.benefit_name,
            benefit.benefit_value,
            benefit.benefit_type,
            id
        ]);
    },

    deleteCollaboratorBenefit: async function(id) {
        const query = `DELETE FROM collaborators_benefits WHERE id = ?`;
        await executeQuery(query, [id]);
    },

    // CRUD para 'collaborators_documents'
    createCollaboratorDocument: async function(document) {
        const query = `INSERT INTO collaborators_documents 
        (collaborator_id, document_type, document_name, document_path) VALUES (?, ?, ?, ?)`;
        
        const result = await executeQuery(query, [
            document.collaborator_id,
            document.document_type,
            document.document_name,
            document.document_path
        ]);

        return result.insertId;
    },

    getCollaboratorDocumentById: async function(id) {
        const query = `SELECT * FROM collaborators_documents WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },

    getAllCollaboratorDocuments: async function() {
        const query = `SELECT * FROM collaborators_documents`;
        const result = await executeQuery(query);
        return result;
    },

    updateCollaboratorDocument: async function(id, document) {
        const query = `UPDATE collaborators_documents SET 
        collaborator_id = ?, document_type = ?, document_name = ?, document_path = ? WHERE id = ?`;

        await executeQuery(query, [
            document.collaborator_id,
            document.document_type,
            document.document_name,
            document.document_path,
            id
        ]);
    },

    deleteCollaboratorDocument: async function(id) {
        const query = `DELETE FROM collaborators_documents WHERE id = ?`;
        await executeQuery(query, [id]);
    },

    // CRUD para 'collaborators_notes'
    createCollaboratorNote: async function(note) {
        const query = `INSERT INTO collaborators_notes 
        (collaborator_id, note_text, note_date) VALUES (?, ?, ?)`;
        
        const result = await executeQuery(query, [
            note.collaborator_id,
            note.note_text,
            note.note_date
        ]);

        return result.insertId;
    },

    getCollaboratorNoteById: async function(id) {
        const query = `SELECT * FROM collaborators_notes WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },

    getAllCollaboratorNotes: async function() {
        const query = `SELECT * FROM collaborators_notes`;
        const result = await executeQuery(query);
        return result;
    },

    updateCollaboratorNote: async function(id, note) {
        const query = `UPDATE collaborators_notes SET 
        collaborator_id = ?, note_text = ?, note_date = ? WHERE id = ?`;

        await executeQuery(query, [
            note.collaborator_id,
            note.note_text,
            note.note_date,
            id
        ]);
    },

    deleteCollaboratorNote: async function(id) {
        const query = `DELETE FROM collaborators_notes WHERE id = ?`;
        await executeQuery(query, [id]);
    },

    // CRUD para 'collaborators_other_info'
    createCollaboratorOtherInfo: async function(otherInfo) {
        const query = `INSERT INTO collaborators_other_info 
        (collaborator_id, info_type, info_value) VALUES (?, ?, ?)`;
        
        const result = await executeQuery(query, [
            otherInfo.collaborator_id,
            otherInfo.info_type,
            otherInfo.info_value
        ]);

        return result.insertId;
    },

    getCollaboratorOtherInfoById: async function(id) {
        const query = `SELECT * FROM collaborators_other_info WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    },

    getAllCollaboratorOtherInfo: async function() {
        const query = `SELECT * FROM collaborators_other_info`;
        const result = await executeQuery(query);
        return result;
    },

    updateCollaboratorOtherInfo: async function(id, otherInfo) {
        const query = `UPDATE collaborators_other_info SET 
        collaborator_id = ?, info_type = ?, info_value = ? WHERE id = ?`;

        await executeQuery(query, [
            otherInfo.collaborator_id,
            otherInfo.info_type,
            otherInfo.info_value,
            id
        ]);
    },

    deleteCollaboratorOtherInfo: async function(id) {
        const query = `DELETE FROM collaborators_other_info WHERE id = ?`;
        await executeQuery(query, [id]);
    }
};

module.exports = collaboratorsController;
