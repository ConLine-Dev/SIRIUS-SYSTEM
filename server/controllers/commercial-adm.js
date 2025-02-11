const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const commercialADM = {

    openedProcesses: async function (userId) {

        let userFilter = ''

        if (userId) {
            userFilter = `AND Par.IdResponsavel = ${userId}`
        }
        let result = await executeQuerySQL(`
            SELECT 
                DATEPART(month, lhs.Data_Abertura_Processo) AS mes,
                COUNT(*) AS TotalProcessosAbertos
            FROM 
                mov_Logistica_House lhs
            LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade AND (Par.IdPapel_Projeto = 2)
            WHERE 
                DATEPART(year, lhs.Data_Abertura_Processo) = 2024
                ${userFilter}
            GROUP BY 
                DATEPART(month, lhs.Data_Abertura_Processo)
            ORDER BY 
                mes;`)

        return result;
    },
    canceledProcesses: async function (userId) {

        let userFilter = ''

        if (userId) {
            userFilter = `AND Par.IdResponsavel = ${userId}`
        }
        let result = await executeQuerySQL(`
            SELECT 
                DATEPART(month, lhs.Data_Cancelamento) AS mes,
                COUNT(*) AS TotalProcessosCancelados
            FROM 
                mov_Logistica_House lhs
            LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade AND (Par.IdPapel_Projeto = 2)
            WHERE 
                DATEPART(year, lhs.Data_Cancelamento) = 2024
                AND lhs.Situacao_Agenciamento = 7
                ${userFilter}
            GROUP BY 
                DATEPART(month, lhs.Data_Cancelamento)
            ORDER BY 
                mes;`)

        return result;
    },

    totalEmails: async function (email) {

        emailFilter = ''

        if (email) {
            emailFilter = `WHERE email = '${email}'`
        }
        const result = await executeQuery(`
            SELECT *
            FROM email_metrics
            ${emailFilter}
            ORDER BY mes`)

        return result;
    },

    totalProcesses: async function (userId) {

        let userFilter = ''

        if (userId) {
            userFilter = `AND Par.IdResponsavel = ${userId}`
        }
        const result = await executeQuerySQL(`
            SELECT
                lhs.Numero_Processo,
                lms.Data_Embarque,
                lms.Data_Desembarque
            FROM mov_Logistica_House lhs
            LEFT OUTER JOIN
                mov_Logistica_Master lms on lms.IdLogistica_Master = lhs.IdLogistica_Master
            LEFT OUTER JOIN
                mov_Logistica_Maritima_Container lmc on lmc.IdLogistica_House = lhs.IdLogistica_House
            LEFT OUTER JOIN
                mov_Projeto_Atividade_Responsavel Par on Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Par.IdPapel_Projeto = 2)
            WHERE
                lhs.Situacao_Agenciamento != 7
                ${userFilter}
                AND lhs.Numero_Processo not like '%DEMU%'
                AND lhs.Numero_Processo not like '%test%'
            GROUP BY
                lhs.Numero_Processo,
                lms.Data_Embarque,
                lms.Data_Desembarque
            HAVING
                COALESCE(STRING_AGG(lmc.Data_Devolucao, ', '), '0') = '0'`)

        return result;
    },

    repurchases: async function (userId) {

        let userFilter = ''

        if (userId) {
            userFilter = `AND Par.IdResponsavel = ${userId}`
        }

        let repurchases = [];
        const result = await executeQuery(`
            SELECT rps.id, rps.value_repurchase_comission, MONTH(rps.payment_date) as 'month', rps.reference_process
            FROM repurchase_payments rps`)

        for (let index = 0; index < result.length; index++) {
            item = result[index];
            const head = await executeQuerySQL(`
                SELECT pss.Nome, Par.IdResponsavel
                FROM mov_Logistica_House lhs
                LEFT OUTER JOIN
                mov_Projeto_Atividade_Responsavel Par on Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                and (Par.IdPapel_Projeto = 2)
                LEFT OUTER JOIN
                cad_Pessoa pss on pss.IdPessoa = Par.IdResponsavel
                WHERE lhs.Numero_Processo = '${item.reference_process}'
                ${userFilter}`)

            if (head.length > 0) {
                repurchases[index] = {value: item.value_repurchase_comission, month: item.month, operational: head[0].Nome, idHead: head[0].IdResponsavel}
            }
        }

        return repurchases;
    },

};

module.exports = {
    commercialADM,
};
