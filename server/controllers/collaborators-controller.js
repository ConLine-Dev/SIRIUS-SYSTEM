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
        const query = `INSERT INTO collaborators 
        (full_name, birth_date, gender, marital_status, nationality, cpf, rg, rg_issuer, rg_issue_date, 
        voter_title, passport_number, birth_city, birth_state, mother_name, father_name, job_position, department, 
        admission_date, resignation_date, employee_id, salary, contract_type, weekly_hours, immediate_supervisor, 
        pis_pasep_number, work_card_number, work_card_series, education) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const result = await executeQuery(query, [
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
            collaborator.education
        ]);

        return result.insertId;
    },

    getCollaboratorById: async function(id) {
        const query = `SELECT * FROM collaborators WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
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
