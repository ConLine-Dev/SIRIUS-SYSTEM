const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const IMADM = {

    getOffers: async function () {
        const result = executeQuerySQL(`
            SELECT
                DATEPART(MONTH, prf.Data_Proposta) AS 'mes',
                SUM(CASE WHEN prf.Situacao = 2 THEN 1 ELSE 0 END) AS 'aprovadas',
                SUM(CASE WHEN prf.Situacao = 3 THEN 1 ELSE 0 END) AS 'reprovadas',
                SUM(CASE WHEN prf.Situacao NOT IN (2, 3) THEN 1 ELSE 0 END) AS 'pendentes',
                CASE pfc.Tipo_Carga 
                    WHEN 1 THEN 'AIR' 
                    WHEN 3 THEN 'FCL' 
                    WHEN 4 THEN 'LCL' 
                END AS 'tipo'
            FROM 
                mov_Proposta_Frete prf
            LEFT OUTER JOIN
                mov_Proposta_Frete_Carga pfc ON pfc.IdProposta_Frete = prf.IdProposta_Frete
            LEFT OUTER JOIN
                mov_Oferta_Frete oft ON oft.IdProposta_Frete = prf.IdProposta_Frete
            WHERE 
                DATEPART(YEAR, prf.Data_Proposta) = 2024
                AND pfc.Tipo_Carga IN (1, 3, 4)
                AND oft.Tipo_Operacao = 2
            GROUP BY 
                DATEPART(MONTH, prf.Data_Proposta),
                pfc.Tipo_Carga
            ORDER BY 
                mes;`);

        return result;
    },
    commentsByModule: async function (moduleId) {
        let result = await executeQuery(`
           SELECT ic.title, ic.description, ic.comment_date,
           cl.id_headcargo, cl.name, cl.family_name, md.title as 'module'
           FROM internal_comments ic
           LEFT OUTER JOIN collaborators cl on cl.id = ic.collab_id
           LEFT OUTER JOIN modules md on md.id = ic.module_id
           WHERE module_id = ${moduleId}
           ORDER BY ic.comment_date DESC`)

        return result;
    },
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
            FROM SIRIUS.email_metrics
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

};

module.exports = {
    IMADM,
};
