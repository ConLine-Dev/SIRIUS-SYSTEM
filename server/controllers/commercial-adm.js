const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const commercialADM = {

    getCommercialsSC: async function () {

        const result = await executeQuery(`
            SELECT DISTINCT cl.name, cl.family_name, cl.email_business, cl.id_headcargo
            FROM collaborators cl
            LEFT OUTER JOIN departments_relations dr on dr.collaborator_id = cl.id
            LEFT OUTER JOIN sections_relations sr on sr.collaborator_id = cl.id
            WHERE (dr.department_id = 1 OR dr.department_id = 2)
            AND (sr.section_id = 1 OR sr.section_id = 2)
            AND cl.resignation_date IS NULL
            ORDER BY cl.name`)

        return result;
    },

    getCommercialsSP: async function () {

        const result = await executeQuery(`
            SELECT DISTINCT cl.name, cl.family_name, cl.email_business, cl.id_headcargo
            FROM collaborators cl
            LEFT OUTER JOIN departments_relations dr on dr.collaborator_id = cl.id
            LEFT OUTER JOIN sections_relations sr on sr.collaborator_id = cl.id
            WHERE (dr.department_id = 1 OR dr.department_id = 2)
            AND (sr.section_id = 6 OR sr.section_id = 7)
            AND cl.resignation_date IS NULL
            ORDER BY cl.name`)

        return result;
    },

    getUserCompany: async function (userId) {

        const result = await executeQuerySQL(`
            SELECT
                emp.IdEmpresa_Sistema
            FROM cad_Funcionario fnc
                LEFT OUTER JOIN cad_Empresa emp ON emp.IdEmpresa_Sistema = fnc.IdEmpresa
            WHERE fnc.IdPessoa = ${userId}`)

        return result[0].IdEmpresa_Sistema;
    },

    getByCommercial: async function (userId) {

        const result = await executeQuerySQL(`
            WITH Logistica AS (
                SELECT
                    COALESCE(COUNT(*), 0) AS Quantidade,
                    COALESCE(SUM(Lmh.Total_TEUS), 0) AS Teus
                FROM mov_Logistica_House Lhs
                JOIN mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
                LEFT OUTER JOIN mov_Logistica_Maritima_House Lmh ON Lmh.IdLogistica_House = Lhs.IdLogistica_House
                LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel Iss 
                    ON Iss.IdProjeto_Atividade = Lhs.IdProjeto_Atividade AND Iss.IdPapel_Projeto = 12
                LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel Sls 
                    ON Sls.IdProjeto_Atividade = Lhs.IdProjeto_Atividade AND Sls.IdPapel_Projeto = 3
                WHERE
                    DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2025
                    AND (Iss.IdResponsavel = ${userId} OR Sls.IdResponsavel = ${userId})
                    AND Lhs.Situacao_Agenciamento NOT IN (7 /* CANCELADO */)
                    AND Lhs.Numero_Processo NOT LIKE '%test%'
                    AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
            ), Propostas AS (
                SELECT
                    COALESCE(SUM(CASE WHEN pft.Situacao = 2 THEN 1 ELSE 0 END), 0) AS Total_Aprovada,
                    COALESCE(SUM(CASE WHEN pft.Situacao = 3 THEN 1 ELSE 0 END), 0) AS Total_Reprovada,
                    COALESCE(SUM(CASE WHEN pft.Situacao NOT IN (2, 3) THEN 1 ELSE 0 END), 0) AS Total_Pendente
                FROM mov_Proposta_Frete pft
                LEFT OUTER JOIN mov_Oferta_Frete oft ON oft.IdProposta_Frete = pft.IdProposta_Frete
                LEFT OUTER JOIN mov_Proposta_Frete_Carga pfc ON pfc.IdProposta_Frete = pft.IdProposta_Frete
                LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel iss ON iss.IdProjeto_Atividade = pft.IdProjeto_Atividade AND (iss.IdPapel_Projeto = 12)
                LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel sls ON sls.IdProjeto_Atividade = pft.IdProjeto_Atividade AND (sls.IdPapel_Projeto = 3)
                WHERE DATEPART(YEAR, pft.Data_Proposta) = 2025
                    AND (iss.IdResponsavel = ${userId} OR sls.IdResponsavel = ${userId})
            )
            SELECT
                COALESCE(l.Quantidade, 0) AS Quantidade,
                COALESCE(l.Teus, 0) AS Teus,
                COALESCE(p.Total_Aprovada, 0) AS Total_Aprovada,
                COALESCE(p.Total_Reprovada, 0) AS Total_Reprovada,
                COALESCE(p.Total_Pendente, 0) AS Total_Pendente
            FROM Logistica l, Propostas p;`)

        return result;
    }
};

module.exports = {
    commercialADM,
};
