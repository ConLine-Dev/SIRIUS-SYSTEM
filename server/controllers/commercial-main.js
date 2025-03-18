const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const commercialMain = {

    totalProcesses: async function (userId) {

        let userFilter = ''

        if (userId) {
            userFilter = `AND (Iss.IdResponsavel = ${userId} OR Sls.IdResponsavel = ${userId})`
        }
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
            ${userFilter}
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

    listAllProcesses: async function(userId){

        let userFilter = ''

        if (userId) {
            userFilter = `AND (Iss.IdResponsavel = ${userId} OR Sls.IdResponsavel = ${userId})`
        }

        let result = await executeQuerySQL(`
            SELECT
                DATEPART(MONTH, Lhs.Data_Abertura_Processo) AS Mes,
                COALESCE(Lmh.Total_TEUS,0) AS Teus,
                Lhs.Numero_Processo,
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ THEN 'IM-LCL'
                END AS Tipo_Processo
            FROM
                mov_Logistica_House Lhs
            JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                mov_Logistica_Maritima_House Lmh on Lmh.IdLogistica_House = Lhs.IdLogistica_House
            LEFT OUTER JOIN
            mov_Projeto_Atividade_Responsavel Iss on Iss.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Iss.IdPapel_Projeto = 12)
            LEFT OUTER JOIN
            mov_Projeto_Atividade_Responsavel Sls on Sls.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Sls.IdPapel_Projeto = 3)
            WHERE
                DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2025
                ${userFilter}
                AND Lhs.Situacao_Agenciamento NOT IN (7 /* CANCELADO */)
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lms.Tipo_Operacao = 2 /* IMPORTACAO */
        `);
     
        return result;
     },

     listActiveClients: async function(userId){

        let userFilter = ''

        if (userId) {
            userFilter = `AND (Iss.IdResponsavel = ${userId} OR Sls.IdResponsavel = ${userId})`
        }

        let result = await executeQuerySQL(`
            SELECT 
                DATEPART(MONTH, Lhs.Data_Abertura_Processo) AS Mes,
                COUNT(DISTINCT Lhs.IdCliente) AS Total
            FROM mov_Logistica_House Lhs
            LEFT OUTER JOIN cad_Pessoa Cli 
                ON Cli.IdPessoa = Lhs.IdCliente
            LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel Iss 
                ON Iss.IdProjeto_Atividade = Lhs.IdProjeto_Atividade AND Iss.IdPapel_Projeto = 12
            LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel Sls 
                ON Sls.IdProjeto_Atividade = Lhs.IdProjeto_Atividade AND Sls.IdPapel_Projeto = 3
            WHERE 
                DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())
                ${userFilter}
            GROUP BY 
                DATEPART(MONTH, Lhs.Data_Abertura_Processo)
            ORDER BY 
                Mes;`);
     
        return result;
     },

     countProcesses: async function (userId){
        
        let userFilter = ''

        if (userId) {
            userFilter = `AND (Iss.IdResponsavel = ${userId} OR Sls.IdResponsavel = ${userId})`
        }

        let result = await executeQuerySQL(`
            SELECT
                DATEPART(MONTH, Lhs.Data_Abertura_Processo) AS Mes,
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ THEN 'IM-LCL'
                    ELSE 'OUTRO'
                END AS Tipo_Processo,
                COUNT(*) AS Quantidade
            FROM
                mov_Logistica_House Lhs
            JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                mov_Logistica_Maritima_House Lmh on Lmh.IdLogistica_House = Lhs.IdLogistica_House
            LEFT OUTER JOIN
                mov_Projeto_Atividade_Responsavel Iss on Iss.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Iss.IdPapel_Projeto = 12)
            LEFT OUTER JOIN
                mov_Projeto_Atividade_Responsavel Sls on Sls.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Sls.IdPapel_Projeto = 3)
            WHERE
                DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2025
                ${userFilter}
                AND Lhs.Situacao_Agenciamento NOT IN (7 /* CANCELADO */)
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lms.Tipo_Operacao = 2 /* IMPORTACAO */
            GROUP BY
                DATEPART(MONTH, Lhs.Data_Abertura_Processo),
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ THEN 'IM-LCL'
                    ELSE 'OUTRO'
                END
            ORDER BY
                Mes, Tipo_Processo`);
     
        return result;
     },

     profitByUser: async function (userId) {

        let userFilter = ''

        if (userId){
            userFilter = `WHERE fcx.IdInside = ${userId} OR fcx.IdSales = ${userId}`
        }

        let result = await executeQuerySQL(`
            SELECT Mes, SUM(VALOR_CONVERTIDO_REAL) AS Total_Valor
            FROM vis_Fluxo_Caixa_Novas_Metas fcx
            ${userFilter}
            GROUP BY Mes
            ORDER BY Mes`);

        return result;
     },

     getOffers: async function (userId) {

        let userFilter = ''

        if (userId){
            userFilter = `AND (Iss.IdResponsavel = ${userId} OR Sls.IdResponsavel = ${userId})`
        }

        const result = await executeQuerySQL(`
            SELECT
                DATEPART(MONTH, pft.Data_Proposta) AS Mes,
                CASE
                    WHEN pfc.Tipo_Carga = 1 THEN 'Aéreo'
                    WHEN pfc.Tipo_Carga = 3 THEN 'FCL'
                    WHEN pfc.Tipo_Carga = 4 THEN 'LCL'
                    ELSE 'Outros'
                END AS Tipo_Carga,
                SUM(CASE WHEN pft.Situacao = 2 THEN 1 ELSE 0 END) AS Total_Aprovada,
                SUM(CASE WHEN pft.Situacao = 3 THEN 1 ELSE 0 END) AS Total_Reprovada,
                SUM(CASE WHEN pft.Situacao NOT IN (2, 3) THEN 1 ELSE 0 END) AS Total_Pendente
            FROM mov_Proposta_Frete pft
                LEFT OUTER JOIN mov_Oferta_Frete oft ON oft.IdProposta_Frete = pft.IdProposta_Frete
                LEFT OUTER JOIN mov_Proposta_Frete_Carga pfc ON pfc.IdProposta_Frete = pft.IdProposta_Frete
                LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel iss ON iss.IdProjeto_Atividade = pft.IdProjeto_Atividade AND (iss.IdPapel_Projeto = 12)
                LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel sls ON sls.IdProjeto_Atividade = pft.IdProjeto_Atividade AND (sls.IdPapel_Projeto = 3)
            WHERE DATEPART(YEAR, pft.Data_Proposta) = 2025
                ${userFilter}
                AND oft.Tipo_Operacao = 2
            GROUP BY DATEPART(MONTH, pft.Data_Proposta), pfc.Tipo_Carga
            ORDER BY Mes, pfc.Tipo_Carga;`)

        return result;
    },
};

module.exports = {
    commercialMain,
};
