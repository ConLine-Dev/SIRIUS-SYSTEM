const { exec } = require('child_process');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const IMADM = {

    openedProcesses: async function (userId) {

        let userFilter = ''

        if (userId > 0) {
            userFilter = `AND Par.IdResponsavel = ${userId}`
        }
        let result = await executeQuerySQL(`
            SELECT 
                DATEPART(month, lhs.Data_Abertura_Processo) AS mes,
                COUNT(*) AS TotalProcessosAbertos
            FROM 
                mov_Logistica_House lhs
            LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade AND (Par.IdPapel_Projeto = 2)
            LEFT OUTER JOIN mov_Logistica_Master lms on lms.IdLogistica_Master = lhs.IdLogistica_Master
            WHERE 
                DATEPART(year, lhs.Data_Abertura_Processo) = 2025
                ${userFilter}
                AND lms.Modalidade_Processo = 2
                AND lms.Tipo_Operacao = 2
            GROUP BY 
                DATEPART(month, lhs.Data_Abertura_Processo)
            ORDER BY 
                mes;`)

        return result;
    },
    canceledProcesses: async function (userId) {

        let userFilter = ''

        if (userId > 0) {
            userFilter = `AND Par.IdResponsavel = ${userId}`
        }
        let result = await executeQuerySQL(`
            SELECT 
                DATEPART(month, lhs.Data_Cancelamento) AS mes,
                COUNT(*) AS TotalProcessosCancelados
            FROM 
                mov_Logistica_House lhs
            LEFT OUTER JOIN mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade AND (Par.IdPapel_Projeto = 2)
            LEFT OUTER JOIN mov_Logistica_Master lms on lms.IdLogistica_Master = lhs.IdLogistica_Master
            WHERE 
                DATEPART(year, lhs.Data_Cancelamento) = 2025
                AND lhs.Situacao_Agenciamento = 7
                ${userFilter}
                AND lms.Modalidade_Processo = 2
                AND lms.Tipo_Operacao = 2
            GROUP BY 
                DATEPART(month, lhs.Data_Cancelamento)
            ORDER BY 
                mes;`)

        return result;
    },

    totalEmails: async function (email) {

        emailFilter = ''
        if (email) {
            emailFilter = `AND em.email = '${email}'`
        }

        const result = await executeQuery(`
            SELECT DISTINCT em.email, em.mes, em.enviados, em.recebidos
            FROM email_metrics em
            LEFT OUTER JOIN collaborators cl on cl.email_business = em.email
            LEFT OUTER JOIN departments_relations dr on dr.collaborator_id = cl.id
            LEFT OUTER JOIN sections_relations sr on sr.collaborator_id = cl.id
            WHERE ano = year(now())
            ${emailFilter}
            AND dr.department_id = 4
            AND (sr.section_id = 1 OR sr.section_id = 2)
            ORDER BY mes`)

        return result;
    },

    totalProcesses: async function (userId) {

        let userFilter = ''

        if (userId > 0) {
            userFilter = `AND Par.IdResponsavel = ${userId}`
        }
        const result = await executeQuerySQL(`
            SELECT
            lhs.Numero_Processo,
            lms.Data_Embarque,
            lms.Data_Desembarque,
            case lhs.Tipo_Carga
            when 3 then 'FCL'
            when 4 then 'LCL'
            when 5 then 'Outro'
            end as 'Tipo_Carga'
            FROM mov_Logistica_House lhs
            LEFT OUTER JOIN
            mov_Logistica_Master lms on lms.IdLogistica_Master = lhs.IdLogistica_Master
            LEFT OUTER JOIN
            mov_Logistica_Maritima_Container lmc on lmc.IdLogistica_House = lhs.IdLogistica_House
            LEFT OUTER JOIN
            mov_Projeto_Atividade_Responsavel Par on Par.IdProjeto_Atividade = lhs.IdProjeto_Atividade and (Par.IdPapel_Projeto = 2)
            LEFT OUTER JOIN
            vis_Logistica_Prazo lpz ON lpz.IdLogistica_House = lhs.IdLogistica_House
            WHERE
            lhs.Situacao_Agenciamento != 7
            AND lhs.Numero_Processo not like '%DEMU%'
            AND lhs.Numero_Processo not like '%test%'
            AND Lms.Tipo_Operacao = 2
            AND Lms.Modalidade_Processo = 2
            ${userFilter}
            AND (lhs.Tipo_Carga = 4 AND (
                Lpz.IdConfiguracao_Campo_Livre IS NULL
            OR Lpz.IdConfiguracao_Campo_Livre = ''
            OR NOT EXISTS (
                    SELECT 1
            FROM vis_Logistica_Prazo Lpz2
            WHERE Lpz2.IdLogistica_House = Lhs.IdLogistica_House
                AND Lpz2.IdConfiguracao_Campo_Livre = 156
                )
            ) OR lhs.Tipo_Carga = 3)
            GROUP BY
            lhs.Numero_Processo,
            lms.Data_Embarque,
            lms.Data_Desembarque,
            lhs.Tipo_Carga
            HAVING
            COALESCE(STRING_AGG(lmc.Data_Devolucao, ', '), '0') = '0'`)

        return result;
    },

    filteredProcesses: async function (userId) {
        let userFilter = '';
        if (userId > 0) {
            userFilter = `AND Par.IdResponsavel = ${userId}`
        }

        const result = await executeQuerySQL(`
            WITH ProcessosValidos AS (
            SELECT
            lhs.Numero_Processo,
            pss.Nome as Cia_Transporte,
            case lhs.Tipo_Carga
            when 1 then 'Aéreo'
            when 2 then 'Break Bulk'
            when 3 then 'FCL'
            when 4 then 'LCL'
            when 5 then 'RO-RO'
            when 6 then 'Rodoviário'
            end as Tipo_Carga,
            MAX(CASE WHEN lmc.Data_Devolucao IS NOT NULL THEN 1 ELSE 0 END) as Tem_Devolucao
            FROM mov_Logistica_House lhs
            LEFT JOIN mov_Logistica_Master lms on lms.IdLogistica_Master = lhs.IdLogistica_Master
            LEFT JOIN mov_Logistica_Maritima_Container lmc on lmc.IdLogistica_House = lhs.IdLogistica_House
            LEFT JOIN mov_Projeto_Atividade_Responsavel Par on Par.IdProjeto_Atividade = lhs.IdProjeto_Atividade and (Par.IdPapel_Projeto = 2)
            LEFT JOIN vis_Logistica_Prazo lpz ON lpz.IdLogistica_House = lhs.IdLogistica_House
            LEFT JOIN cad_Pessoa pss ON pss.IdPessoa = lms.IdCompanhia_Transporte
            WHERE lhs.Situacao_Agenciamento != 7
            ${userFilter}
            AND lhs.Numero_Processo NOT LIKE '%DEMU%'
            AND lhs.Numero_Processo NOT LIKE '%test%'
            AND lms.Tipo_Operacao = 2
            AND lms.Modalidade_Processo = 2
            AND (lhs.Tipo_Carga = 4 AND (
                lpz.IdConfiguracao_Campo_Livre IS NULL
                OR lpz.IdConfiguracao_Campo_Livre = ''
                OR NOT EXISTS (
                    SELECT 1
                    FROM vis_Logistica_Prazo lpz2
                    WHERE lpz2.IdLogistica_House = lhs.IdLogistica_House
                    AND lpz2.IdConfiguracao_Campo_Livre = 156
                )
            ) OR lhs.Tipo_Carga = 3
            )
            GROUP BY
            lhs.Numero_Processo,
            pss.Nome,
            lhs.Tipo_Carga
            )
            SELECT
            Cia_Transporte,
            Tipo_Carga,
            COUNT(*) as Quantidade_Processos
            FROM ProcessosValidos
            WHERE Tem_Devolucao = 0
            GROUP BY Cia_Transporte, Tipo_Carga
            ORDER BY Quantidade_Processos DESC;`)

        return result;
    },

    getOperationals: async function () {

        const result = await executeQuery(`
            SELECT DISTINCT cl.name, cl.family_name, cl.email_business, cl.id_headcargo
            FROM collaborators cl
            LEFT OUTER JOIN departments_relations dr on dr.collaborator_id = cl.id
            LEFT OUTER JOIN sections_relations sr on sr.collaborator_id = cl.id
            WHERE dr.department_id = 4
            AND (sr.section_id = 1 OR sr.section_id = 2)
            ORDER BY cl.name`)

        return result;
    },

    repurchases: async function (userId) {
        // Consulta agrupando por mês, status e moeda, somando o valor de recompra ((old_purchase_value - purchase_value) + (sale_value - old_sale_value)), apenas quando as moedas são iguais
        // Status: APPROVED, PENDING, PAID, ano atual
        let query = `
            SELECT 
                MONTH(creation_date) AS mes,
                status,
                coin_purchase AS moeda,
                SUM((old_purchase_value - purchase_value) + (sale_value - old_sale_value)) AS total_recompra
            FROM repurchases
            WHERE 
                status IN ('APPROVED', 'PENDING', 'PAID')
                AND YEAR(creation_date) = YEAR(CURDATE())
                AND coin_purchase = coin_sale
        `;
        let params = [];
        if (userId) {
            query += ` AND created_by = ?`;
            params.push(userId);
        }
        query += ` GROUP BY mes, status, moeda ORDER BY mes, status, moeda`;

        const result = await executeQuery(query, params);

        // Simulação de cotações (em produção, busque do banco ou API)
        const cotacoes = {
            'USD': 5.2,
            'EUR': 5.6,
            'BRL': 1
        };

        // Retorna mês, status, moeda, total e total convertido para real (apenas para aprovadas)
        const data = result.map(item => {
            let total_brl = null;
            if (item.status === 'APPROVED') {
                const cotacao = cotacoes[item.moeda] || 1;
                total_brl = Number(item.total_recompra) * cotacao;
            }
            return {
                mes: item.mes,
                status: item.status,
                moeda: item.moeda,
                total: Number(item.total_recompra) || 0,
                total_recompra_brl: total_brl // só preenchido para aprovadas
            };
        });

        return data;
    },

};

module.exports = {
    IMADM,
};