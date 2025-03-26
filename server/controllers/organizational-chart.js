const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const organizationalChart = {

    totalProcesses: async function () {

        const result = await executeQuerySQL(`
            SELECT
            lhs.Numero_Processo,
            DATEPART(month, lhs.Data_Abertura_Processo) as Mes,
            Iss.IdResponsavel,
            Sls.IdResponsavel
            FROM mov_Logistica_House lhs
            JOIN
            mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
            mov_Logistica_Maritima_Container lmc on lmc.IdLogistica_House = lhs.IdLogistica_House
            LEFT OUTER JOIN
            mov_Projeto_Atividade_Responsavel Iss on Iss.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Iss.IdPapel_Projeto = 12)
            LEFT OUTER JOIN
            mov_Projeto_Atividade_Responsavel Sls on Sls.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Sls.IdPapel_Projeto = 3)
            WHERE
            lhs.Situacao_Agenciamento != 7
            AND DATEPART(year, lhs.Data_Abertura_Processo) = 2025
            AND lms.Tipo_Operacao = 2
            AND lhs.Numero_Processo not like '%DEMU%'
            AND lhs.Numero_Processo not like '%test%'
            GROUP BY
            lhs.Numero_Processo,
            lhs.Data_Abertura_Processo,
            Iss.IdResponsavel,
            Sls.IdResponsavel`)

        return result;
    },
};

module.exports = {
    organizationalChart,
};
