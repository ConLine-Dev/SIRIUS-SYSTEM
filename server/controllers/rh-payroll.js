const { executeQuery } = require('../connect/mysql');

const rhPayroll = {

    // Esta função cria uma nova entrada de senha no banco de dados
    create: async function (form) {
        const create_at = new Date();
        const formattedCreateAt = rhPayroll.formatDateForDatabase(create_at);
    
        // Primeiro, insere na tabela rh_payroll
        const rhPayrollInsertQuery = `
            INSERT INTO rh_payroll (responsible_id, month_year, effective_date, observation, create_at, update_at) 
            VALUES ('${form.responsible}', '${form.monthYear}', '${form.effectiveDate}', '${form.observation}', '${formattedCreateAt}', '${formattedCreateAt}')
        `;
    
        // Executa a consulta e obtém o ID da folha inserida
        const result = await executeQuery(rhPayrollInsertQuery);
        const payrollId = result.insertId; // Supondo que executeQuery retorne um objeto com insertId

        const discount = form.discount;

        for (let i = 0; i < discount.length; i++) {
            const element = discount[i];

            await executeQuery(`INSERT INTO rh_payroll_discount (rh_payroll_id, rh_payroll_category_id, value, document_name, document_path, document_size)
                VALUES (${payrollId}, ${element.discountId}, ${element.value}, '', '', 0) `)
        

        }
    
        return result;
    },

    // Esta função cria uma nova entrada de senha no banco de dados
    createBulk: async function (form) {
        const create_at = new Date();
        const formattedCreateAt = rhPayroll.formatDateForDatabase(create_at);
    
        // Primeiro, insere na tabela rh_payroll
        const rhPayrollInsertQuery = `
            INSERT INTO rh_payroll (responsible_id, month_year, observation, create_at, update_at) 
            VALUES ('${form.responsible}', '${form.monthYear}', '${form.observation}', '${formattedCreateAt}', '${formattedCreateAt}')
        `;
    
        // Executa a consulta e obtém o ID da folha inserida
        const result = await executeQuery(rhPayrollInsertQuery);
        const payrollId = result.insertId; // Supondo que executeQuery retorne um objeto com insertId

        const discount = form.discount;

        for (let i = 0; i < discount.length; i++) {
            const element = discount[i];

            await executeQuery(`INSERT INTO rh_payroll_discount (rh_payroll_id, rh_payroll_category_id, value, document_name, document_path, document_size)
                VALUES (${payrollId}, ${element.discountId}, ${element.value}, '', '', 0) `)
        

        }
    
        return result;
    },

    // Esta função busca todos os descontos associadas a um colaborador específico
    getAllByUser: async function (collaborator_id) {
        const result = await executeQuery(`
            SELECT 
                rp.*, 
                c.name as ResponsibleName, 
                c.id_headcargo, 
                c.family_name as ResponsibleFamilyName
            FROM 
                rh_payroll rp
            JOIN 
                collaborators c 
                ON c.id = rp.responsible_id
            LEFT JOIN 
                rh_payroll_discount rpd
                ON rpd.rh_payroll_id = rp.id
            LEFT JOIN 
                rh_payroll_category rpc
                ON rpc.id = rpd.rh_payroll_category_id
            WHERE 
                c.id = ${collaborator_id}
            GROUP BY
                rp.id
        `);
    
        // Use Promise.all para lidar com operações assíncronas
        const formattedDiscount = await Promise.all(result.map(async (item) => {
            // Botões de ação
            const buttons = `<div class="btn-list">
                                <a href="javascript:void(0);" class="btn btn-sm btn-icon btn-warning-light edit_discount" title="Editar" data-id="${item.id}">
                                <i class="ri-pencil-line"></i>
                                </a>
                                <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-purple-light delete_discount" title="Deletar" data-id="${item.id}">
                                <i class="ri-delete-bin-line"></i>
                                </a>
                            </div>`;
    
            const users = `${item.ResponsibleName} ${item.ResponsibleFamilyName}`;
            const monthYear = new Date(item.month_year).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const categoryDiscount = item.rh_payroll_category_id || 'Sem Categoria';
            const effectiveDate = new Date(item.effective_date).toLocaleDateString('pt-BR');
            const observation = item.observation || 'Nenhuma Observação';
            const ValueDiscount = item.discount || 0;
    
            // Executa consulta para obter os descontos
            const resultDiscount = await executeQuery(`
                SELECT 
                    *
                FROM 
                    rh_payroll_discount 
                WHERE 
                    rh_payroll_id = ${item.id}
            `);
    
            // Soma os valores dos descontos
            const totalValue = resultDiscount.reduce((total, discount) => {
                return total + discount.value;
            }, 0);
    
            return {
                ...item,
                responsibleName: users,
                monthYear: monthYear,
                totalValue: totalValue,
                categoryDiscount: categoryDiscount,
                effectiveDate: effectiveDate,
                observation: observation,
                ValueDiscount: ValueDiscount,
                action: buttons
            };
        }));
    
        return formattedDiscount;
    },

     // Função para obter os dados dos tipos de descontos
    getDiscountById: async function (id) {

        const resultDiscount = await executeQuery(`
            SELECT 
                *
            FROM 
                rh_payroll rp
            LEFT JOIN 
                rh_payroll_discount rpd
                ON rpd.rh_payroll_id = rp.id
            LEFT JOIN 
                rh_payroll_category rpc
                ON rpc.id = rpd.rh_payroll_category_id
            WHERE 
                rpd.rh_payroll_id = ${id}
        `);

        return resultDiscount;

        
    },

    // Função para buscar os tipos de categorias
    categoryDiscount: async function () {
        const result = await executeQuery(`SELECT * FROM rh_payroll_category`)

        return result;
        
    },

    // Esta função atualiza/Edita os detalhes de uma senha existente no banco de dados com base nas informações fornecidas
    update: async function(form) {
        const update_at = new Date();
        const formattedCreateAt = rhPayroll.formatDateForDatabase(update_at);

        let update = await executeQuery(
            `UPDATE rh_payroll SET 
                responsible_id = ?, 
                month_year = ?, 
                effective_date = ?, 
                observation = ?, 
                update_at = ? 
                WHERE (id = ?)`,
                [
                    form.responsible_id,
                    form.month_year,
                    form.effective_date,
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
        let delete_discount = await executeQuery(`DELETE FROM rh_payroll_discount WHERE (rh_payroll_category_id = ?)`, [id])
        return {delete_discount};
    },
    
}

// Exporta o objeto moduleManagement para uso em outros módulos
module.exports = {
    rhPayroll,
};