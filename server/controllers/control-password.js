const { executeQuery } = require('../connect/mysql'); // Importa a função para executar consultas SQL


const controlPassword = {
    // Esta função busca todas as senhas associadas a um colaborador específico
    getAllByUser: async function(collaborator_id) {
        const result = await executeQuery(`SELECT 
                                            p.*, 
                                            c.name as ResponsibleName, 
                                            c.id_headcargo, 
                                            c.family_name as ResponsibleFamilyName
                                        FROM 
                                            password_control p
                                        JOIN 
                                            collaborators c 
                                            ON c.id = p.responsible
                                        LEFT JOIN 
                                            password_relation_department prd 
                                            ON p.id = prd.password_id
                                        LEFT JOIN 
                                            departments_relations dr 
                                            ON dr.department_id = prd.department_id
                                        WHERE 
                                            c.id = ${collaborator_id}
                                            OR dr.collaborator_id = ${collaborator_id}
                                        GROUP BY
                                            p.id
                                        `);

        const formattedPassword = await Promise.all(result.map(async item => {
            const buttons = `<div class="hstack gap-2 fs-15" id="intro-btn-action"> 
                                <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-info-light edit-password" data-id="${item.id}">
                                    <i class="ri-edit-line"></i>
                                </a> 
                                <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-danger-light product-btn delete-password" data-id="${item.id}">
                                    <i class="ri-delete-bin-line"></i>
                                </a> 
                            </div>`;   

        const departments = await controlPassword.getDepartmentsByIdPassword(item.id);
        const departmentNames = departments.map(department => `<span class="badge bg-primary px-1 py-2 fs-10">${department.name}</span>`).join(' ');
        const users = `${item.ResponsibleName} ${item.ResponsibleFamilyName}`

        return {
            ...item, 
                title: `${(item.title).toUpperCase()}  <span style="display: none;">${item.observation}</span>`,
                update_at: controlPassword.formatDateToPtBr(item.update_at),
                departmentNames: departmentNames,
                responsibleName: `<div class="d-flex align-items-center"> <div class="me-2 lh-1"> <span class="avatar avatar-sm"> <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt=""> </span> </div> <div class="fs-14">${users}</div> </div>`,
                action: buttons
            };
        }));

        return formattedPassword;
        
    },

    // Esta função busca todas as senhas registradas no banco de dados, junto com informações detalhadas sobre os responsáveis e os departamentos associados. Ela também formata os dados para exibição
    getAll: async function() {
        const result = await executeQuery(`SELECT 
                                                p.*, c.name as ResponsibleName, 
                                                c.id_headcargo,
                                                c.family_name as ResponsibleFamilyName 
                                            FROM password_control p 
                                            JOIN collaborators c on c.id = p.responsible`);

        const formattedPassword = await Promise.all(result.map(async item => {
            const buttons = `<div class="hstack gap-2 fs-15"> 
                                <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-info-light edit-password" data-id="${item.id}">
                                    <i class="ri-edit-line"></i>
                                </a> 
                                <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-danger-light product-btn delete-password" data-id="${item.id}">
                                    <i class="ri-delete-bin-line"></i>
                                </a> 
                            </div>`;   
                            
            const departments = await controlPassword.getDepartmentsByIdPassword(item.id);
            const departmentNames = departments.map(department => `<span class="badge bg-primary px-1 py-2 fs-10">${department.name}</span>`).join(' ');
            const users = `${item.ResponsibleName} ${item.ResponsibleFamilyName}`
                
            return {
                ...item,
                update_at: controlPassword.formatDateToPtBr(item.update_at),
                departmentNames: departmentNames,
                responsibleName: `<div class="d-flex align-items-center"> <div class="me-2 lh-1"> <span class="avatar avatar-sm"> <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt=""> </span> </div> <div class="fs-14">${users}</div> </div>`,
                action: buttons
            };
        }));

        return formattedPassword;
    },

    // Esta função busca os departamentos associados a uma senha específica no banco de dados
    getDepartmentsByIdPassword: async function(id) {
        const result = await executeQuery(`SELECT * 
                                            FROM password_relation_department p 
                                            JOIN departments d ON d.id = p.department_id
                                            WHERE password_id = ${id}`)

        return result;
    },
    
    // Esta função cria uma nova entrada de senha no banco de dados, juntamente com as relações de departamentos associados
    create: async function(form) {
        const create_at = new Date();
        const formattedCreateAt = controlPassword.formatDateForDatabase(create_at);

        const title = (form.title).toUpperCase();

        // Primeiro, insere na tabela password_control
        const passwordInsertQuery = `
            INSERT INTO password_control (title, login, password, responsible, link, observation, create_at, update_at) 
            VALUES ('${title}', '${form.login}', '${form.password}', '${form.responsible}', '${form.link}', '${form.observation}', '${formattedCreateAt}', '${formattedCreateAt}')
        `;

        // Executa a consulta e obtém o ID do password inserido
        const result = await executeQuery(passwordInsertQuery);
        const passwordId = result.insertId; // Supondo que executeQuery retorne um objeto com insertId

        // Agora, insere na tabela password_relation_department para cada departamento
        const departmentInsertQueries = form.departments.map(departmentId => {
            return `
                INSERT INTO password_relation_department (password_id, department_id) 
                VALUES (${passwordId}, ${departmentId})
            `;
        });

        // Executa todas as inserções de departamento
        for (const query of departmentInsertQueries) {
            await executeQuery(query);
        }

        return result;


    },

    //Esta função formata um objeto `Date` para o formato de data e hora aceito pelo banco de dados
    formatDateForDatabase: function(date){
        const padToTwoDigits = (num) => num.toString().padStart(2, '0');
        
        const day = padToTwoDigits(date.getDate());
        const month = padToTwoDigits(date.getMonth() + 1); // getMonth() retorna o mês de 0 a 11
        const year = date.getFullYear();
        const hours = padToTwoDigits(date.getHours());
        const minutes = padToTwoDigits(date.getMinutes());
        const seconds = padToTwoDigits(date.getSeconds());
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    //Esta função formata uma string de data para o formato de data e hora no estilo brasileiro
    formatDateToPtBr: function(dateString){
        const date = new Date(dateString);
    
        const padToTwoDigits = (num) => num.toString().padStart(2, '0');
        
        const day = padToTwoDigits(date.getDate());
        const month = padToTwoDigits(date.getMonth() + 1); // getMonth() retorna o mês de 0 a 11
        const year = date.getFullYear();
        const hours = padToTwoDigits(date.getHours());
        const minutes = padToTwoDigits(date.getMinutes());
        const seconds = padToTwoDigits(date.getSeconds());
        
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    },

    // Esta função recupera detalhes de uma senha específica do banco de dados, incluindo informações sobre o responsável e os departamentos associados
    getView: async function (id) {
        const result = await executeQuery(`SELECT 
                                                p.*, c.name as ResponsibleName, 
                                                c.id_headcargo,
                                                c.family_name as ResponsibleFamilyName 
                                            FROM password_control p 
                                            JOIN collaborators c on c.id = p.responsible
                                            WHERE p.id = ${id}`);

        const formattedPassword = await Promise.all(result.map(async item => {
            const buttons = `<div class="hstack gap-2 fs-15"> 
                                <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-info-light edit-password" data-id="${item.id}">
                                <i class="ri-edit-line"></i>
                                </a> 
                                <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-danger-light product-btn delete-password" data-id="${item.id}">
                                <i class="ri-delete-bin-line"></i>
                                </a> 
                                </div>`;

            const departments = await controlPassword.getDepartmentsByIdPassword(item.id);
            const departmentNames = departments.map(department => `<span class="badge bg-primary px-1 py-2 fs-10">${department.name}</span>`).join(', ');
            const users = `${item.ResponsibleName} ${item.ResponsibleFamilyName}`


            return {
                ...item,
                title: (item.title).toUpperCase(),
                update_at: controlPassword.formatDateToPtBr(item.update_at),
                departmentNames: departmentNames,
                responsibleName: `<div class="d-flex align-items-center"> <div class="me-2 lh-1"> <span class="avatar avatar-sm"> <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt=""> </span> </div> <div class="fs-14">${users}</div> </div>`,
                action: buttons,
                departments_id: departments
                
            };

        }));

        return formattedPassword[0];
    },

    // Esta função atualiza/Edita os detalhes de uma senha existente no banco de dados com base nas informações fornecidas
    update: async function(form) {
        const update_at = new Date();
        const formattedCreateAt = controlPassword.formatDateForDatabase(update_at);

        const title = (form.title).toUpperCase();

        let update = await executeQuery(
            `UPDATE password_control SET 
                title = ?, 
                login = ?, 
                password = ?, 
                responsible = ?, 
                link = ?, 
                observation = ?, 
                update_at = ? 
                WHERE (id = ?)`,
                [
                    title,
                    form.login,
                    form.password,
                    form.responsible,
                    form.link,
                    form.observation,
                    formattedCreateAt,
                    form.id
                ]
        )

        let delete_relation = await executeQuery(`DELETE FROM password_relation_department WHERE (password_id = ?)`, [form.id])

        // Agora, insere na tabela password_relation_department para cada departamento
        const departmentInsertQueries = form.departments.map(departmentId => {
            return `
                INSERT INTO password_relation_department (password_id, department_id) 
                VALUES (${form.id}, ${departmentId})
            `;
        });

        // Executa todas as inserções de departamento
        for (const query of departmentInsertQueries) {
            await executeQuery(query);
        }

        return update

    },

       // Deletar
    delete: async function(id) {
        let delete_relation = await executeQuery(`DELETE FROM password_relation_department WHERE (password_id = ?)`, [id])
        let delete_password = await executeQuery(`DELETE FROM password_control WHERE (id = ?)`, [id])
        return {delete_relation};
    },

}

// Exporta o objeto moduleManagement para uso em outros módulos
module.exports = {
    controlPassword,
};
