const { exec } = require('child_process');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const commercial_individual_goal = {

    getCategories: async function () {
        const result = await executeQuery(`
            SELECT *
            FROM refunds_categories`);
        return result;
    },

    getTEUsAndProfit: async function (data) {

        let monthFilter = `AND DATEPART(month, lhs.Data_Abertura_Processo) = DATEPART(month, GETDATE())`;
        let quarterFilter = '';
        let operationFilter = '';

        if (data.month) {
            monthFilter = `AND DATEPART(month, lhs.Data_Abertura_Processo) = ${data.month}`
        }

        if (data.quarter) {
            monthFilter = '';
            quarterFilter = `AND DATEPART(month, lhs.Data_Abertura_Processo) IN (${data.quarter})`
        }

        if (data.operation) {
            operationFilter = `AND lms.Tipo_Operacao = ${data.operation}`
        }

        const result = await executeQuerySQL(`
            SELECT
                DATEPART(MONTH, lhs.Data_Abertura_Processo) AS Mes,
                SUM(COALESCE(lmh.Total_TEUS, 0)) AS Total_TEUS,
                SUM(COALESCE(lma.Lucro_Estimado, 0)) AS Lucro_Estimado,
                COUNT(*) AS Quantidade_Processos,
                CASE Lhs.Tipo_Carga
                WHEN 1 THEN 'Aéreo'
                WHEN 3 THEN 'FCL'
                WHEN 4 THEN 'LCL'
                ELSE 'Outro'
                END AS Tipo_Carga
            FROM
                mov_logistica_house lhs
                LEFT JOIN
                    mov_Logistica_master lms ON lms.IdLogistica_Master = lhs.IdLogistica_Master
                LEFT JOIN
                    mov_Logistica_Maritima_House lmh ON lmh.IdLogistica_House = lhs.IdLogistica_House
                LEFT JOIN
                    mov_Logistica_Moeda lma ON lma.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Iss on Iss.IdProjeto_Atividade = lhs.IdProjeto_Atividade and (Iss.IdPapel_Projeto = 12)
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Sls on Sls.IdProjeto_Atividade = lhs.IdProjeto_Atividade and (Sls.IdPapel_Projeto = 3)
            WHERE
                YEAR(lhs.Data_Abertura_Processo) = 2025
                AND lhs.Numero_Processo NOT LIKE '%test%'
                AND lhs.Numero_Processo NOT LIKE '%demu%'
                AND lma.idmoeda IN (110)
                AND lhs.Situacao_Agenciamento != 7
                AND (Iss.IdResponsavel = '${data.sales}' OR Sls.IdResponsavel = '${data.sales}')
                ${monthFilter}
                ${quarterFilter}
                ${operationFilter}
            GROUP BY
                DATEPART(MONTH, lhs.Data_Abertura_Processo), lhs.Tipo_Carga
            ORDER BY
                Mes;`);
        return result;
    },

    getClients: async function (data) {

        let monthFilter = `AND DATEPART(month, lhs.Data_Abertura_Processo) = DATEPART(month, GETDATE())`;
        let quarterFilter = '';
        let operationFilter = '';

        if (data.month) {
            monthFilter = `AND DATEPART(month, lhs.Data_Abertura_Processo) = ${data.month}`
        }

        if (data.quarter) {
            monthFilter = '';
            quarterFilter = `AND DATEPART(month, lhs.Data_Abertura_Processo) IN (${data.quarter})`
        }

        if (data.operation) {
            operationFilter = `AND lms.Tipo_Operacao = ${data.operation}`
        }

        const result = await executeQuerySQL(`
            SELECT
                cli.nome AS Nome,
                COALESCE(SUM(lmh.Total_TEUS), 0) AS Total_TEUS,
                SUM(DISTINCT lma.Lucro_Abertura) AS Lucro_Abertura,
                SUM(DISTINCT lma.Lucro_Estimado) AS Lucro_Estimado,
                CASE WHEN (lhs.Tipo_Carga = 1 AND  lmr.Tipo_Operacao = 1) THEN 'EA'
                    WHEN (lhs.Tipo_Carga = 1 AND  lmr.Tipo_Operacao = 2) THEN 'IA'
                    WHEN (lhs.Tipo_Carga = 3 AND  lmr.Tipo_Operacao = 1) THEN 'EM FCL'
                    WHEN (lhs.Tipo_Carga = 4 AND  lmr.Tipo_Operacao = 1) THEN 'EM LCL'
                    WHEN (lhs.Tipo_Carga = 3 AND  lmr.Tipo_Operacao = 2) THEN 'IM FCL'
                    WHEN (lhs.Tipo_Carga = 4 AND  lmr.Tipo_Operacao = 2) THEN 'IM LCL'
                    ELSE 'Outro'
                END AS Tipo_Carga
            FROM
                mov_logistica_house lhs
                LEFT OUTER JOIN
                    mov_Logistica_master lmr ON lmr.IdLogistica_Master = lhs.IdLogistica_Master
                LEFT OUTER JOIN
                    cad_pessoa cli ON cli.IdPessoa = lhs.IdCliente
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_House lmh ON lmh.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Moeda lma ON lma.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Iss on Iss.IdProjeto_Atividade = lhs.IdProjeto_Atividade and (Iss.IdPapel_Projeto = 12)
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Sls on Sls.IdProjeto_Atividade = lhs.IdProjeto_Atividade and (Sls.IdPapel_Projeto = 3)
            WHERE
                DATEPART(year, lhs.Data_Abertura_Processo) = 2025
                AND lma.idmoeda IN (110)
                AND (Iss.IdResponsavel = ${data.sales} OR Sls.IdResponsavel = ${data.sales})
                ${monthFilter}
                ${quarterFilter}
                ${operationFilter}
                AND lhs.Situacao_Agenciamento != 7
            GROUP BY
                cli.nome,
                CASE WHEN (lhs.Tipo_Carga = 1 AND  lmr.Tipo_Operacao = 1) THEN 'EA'
                    WHEN (lhs.Tipo_Carga = 1 AND  lmr.Tipo_Operacao = 2) THEN 'IA'
                    WHEN (lhs.Tipo_Carga = 3 AND  lmr.Tipo_Operacao = 1) THEN 'EM FCL'
                    WHEN (lhs.Tipo_Carga = 4 AND  lmr.Tipo_Operacao = 1) THEN 'EM LCL'
                    WHEN (lhs.Tipo_Carga = 3 AND  lmr.Tipo_Operacao = 2) THEN 'IM FCL'
                    WHEN (lhs.Tipo_Carga = 4 AND  lmr.Tipo_Operacao = 2) THEN 'IM LCL'
                    ELSE 'Outro'
                END`);
        return result;
    },

    getGoals: async function (data) {

        let monthFilter = `AND month = MONTH(NOW())`;
        let quarterFilter = '';

        if (data.month) {
            monthFilter = `AND month = ${data.month}`
        }

        if (data.quarter) {
            monthFilter = '';
            quarterFilter = `AND month IN (${data.quarter})`
        }

        const result = await executeQuery(`
            SELECT *
            FROM commercial_individual_goals
            WHERE headcargo_id = ${data.sales}
            ${monthFilter}
            ${quarterFilter}`);

        let teuGoal = 0;
        let profitGoal = 0;
        let lclGoal = 0;
        let airGoal = 0;
        for (let index = 0; index < result.length; index++) {
            teuGoal += result[index].teus_goal;
            profitGoal += result[index].profit_goal;
            lclGoal += result[index].lcl_goal;
            airGoal += result[index].air_goal;
        }

        return [teuGoal, profitGoal, lclGoal, airGoal];
    },

    getCommercial: async function (collabId) {

        const result = await executeQuery(`
            SELECT
                cl.name,
                cl.family_name,
                cl.id_headcargo AS userId
            FROM leadership ls
            LEFT OUTER JOIN collaborators cl ON cl.id = ls.id_collaborator
            WHERE
                (ls.id_parent = ${collabId} OR ls.id_collaborator = ${collabId})`);
        return result;
    },

    saveNewGoal: async function (data) {

        const result = await executeQuery(
            'INSERT INTO commercial_individual_goals (headcargo_id, teus_goal, profit_goal, month) VALUES (?, ?, ?, ?)',
            [data.salesSelect, data.teusGoal, data.profitGoal, data.monthSelect]
        );

        return true;
    },
};

module.exports = {
    commercial_individual_goal,
};