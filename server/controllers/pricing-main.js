const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const pricingMain = {

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
                DATEPART(YEAR, prf.Data_Proposta) = 2025
                AND pfc.Tipo_Carga IN (1, 3, 4)
                AND oft.Tipo_Operacao = 2
            GROUP BY 
                DATEPART(MONTH, prf.Data_Proposta),
                pfc.Tipo_Carga
            ORDER BY 
                mes;`);

        return result;
    },

    getProcessesTotal: async function (filters) {

        let yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`;
        let monthFilter = ''
        let modalFilter = ''

        if (filters.ano) {
            for (let index = 0; index < filters.ano.length; index++) {
                if (index == 0) {
                    yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) IN (${filters.ano[index]}`
                }
                else {
                    yearFilter += `, ${filters.ano[index]}`
                }
                if (index == filters.ano.length - 1) {
                    yearFilter += `)`
                }
            }
        }

        if (filters.mes) {
            for (let index = 0; index < filters.mes.length; index++) {
                if (index == 0) {
                    monthFilter = `AND DATEPART(MONTH, Lhs.Data_Abertura_Processo) IN (${filters.mes[index]}`
                }
                else {
                    monthFilter += `, ${filters.mes[index]}`
                }
                if (index == filters.mes.length - 1) {
                    monthFilter += `)`
                }
            }
        }

        if (filters.modal) {
            for (let index = 0; index < filters.modal.length; index++) {
                if (index == 0) {
                    modalFilter = `AND Lhs.Tipo_Carga IN (${filters.modal[index]}`
                }
                else {
                    modalFilter += `, ${filters.modal[index]}`
                }
                if (index == filters.modal.length - 1) {
                    modalFilter += `)`
                }
            }
        }

        const result = executeQuerySQL(`
            SELECT
                COUNT(*) AS Total_Processos,
                SUM(CASE WHEN Lhs.Tipo_Carga = 1 THEN 1 ELSE 0 END) AS Total_Aereo,
                SUM(CASE WHEN Lhs.Tipo_Carga = 4 THEN 1 ELSE 0 END) AS Total_LCL,
                SUM(CASE WHEN Lhs.Tipo_Carga = 3 THEN 1 ELSE 0 END) AS Total_FCL,
                FORMAT(SUM(Lmo.Lucro_Estimado), 'C', 'pt-BR') AS Lucro_Total,
                FORMAT(AVG(Lmo.Lucro_Estimado), 'C', 'pt-BR') AS Lucro_Medio
            FROM
                mov_Logistica_House Lhs
            LEFT OUTER JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House
            WHERE
                Lms.Tipo_Operacao = 2
                AND Lmo.IdMoeda = 110
                ${yearFilter}
                ${monthFilter}
                ${modalFilter}
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lhs.Numero_Processo NOT LIKE '%test%'`);

        return result;
    },

    getProcessesMonth: async function (filters) {

        let yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`;
        let monthFilter = ''
        let modalFilter = ''

        if (filters.ano) {
            for (let index = 0; index < filters.ano.length; index++) {
                if (index == 0) {
                    yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) IN (${filters.ano[index]}`
                }
                else {
                    yearFilter += `, ${filters.ano[index]}`
                }
                if (index == filters.ano.length - 1) {
                    yearFilter += `)`
                }
            }
        }

        if (filters.mes) {
            for (let index = 0; index < filters.mes.length; index++) {
                if (index == 0) {
                    monthFilter = `AND DATEPART(MONTH, Lhs.Data_Abertura_Processo) IN (${filters.mes[index]}`
                }
                else {
                    monthFilter += `, ${filters.mes[index]}`
                }
                if (index == filters.mes.length - 1) {
                    monthFilter += `)`
                }
            }
        }

        if (filters.modal) {
            for (let index = 0; index < filters.modal.length; index++) {
                if (index == 0) {
                    modalFilter = `AND Lhs.Tipo_Carga IN (${filters.modal[index]}`
                }
                else {
                    modalFilter += `, ${filters.modal[index]}`
                }
                if (index == filters.modal.length - 1) {
                    modalFilter += `)`
                }
            }
        }

        const result = executeQuerySQL(`
            SELECT
                DATEPART(MONTH, Lhs.Data_Abertura_Processo) AS Mes,
                COUNT(*) AS Total_Processos,
                SUM(Lmo.Lucro_Estimado) AS Lucro_Estimado_Total
            FROM
                mov_Logistica_House Lhs
            LEFT OUTER JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House
            WHERE
                Lms.Tipo_Operacao = 2
                AND Lmo.IdMoeda = 110
                ${yearFilter}
                ${monthFilter}
                ${modalFilter}
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lhs.Numero_Processo NOT LIKE '%test%'
            GROUP BY
                DATEPART(MONTH, Lhs.Data_Abertura_Processo)
            ORDER BY
                Mes`);

        return result;
    },

    processesByAgent: async function (filters) {

        let yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`;
        let monthFilter = ''
        let modalFilter = ''

        if (filters.ano) {
            for (let index = 0; index < filters.ano.length; index++) {
                if (index == 0) {
                    yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) IN (${filters.ano[index]}`
                }
                else {
                    yearFilter += `, ${filters.ano[index]}`
                }
                if (index == filters.ano.length - 1) {
                    yearFilter += `)`
                }
            }
        }

        if (filters.mes) {
            for (let index = 0; index < filters.mes.length; index++) {
                if (index == 0) {
                    monthFilter = `AND DATEPART(MONTH, Lhs.Data_Abertura_Processo) IN (${filters.mes[index]}`
                }
                else {
                    monthFilter += `, ${filters.mes[index]}`
                }
                if (index == filters.mes.length - 1) {
                    monthFilter += `)`
                }
            }
        }

        if (filters.modal) {
            for (let index = 0; index < filters.modal.length; index++) {
                if (index == 0) {
                    modalFilter = `AND Lhs.Tipo_Carga IN (${filters.modal[index]}`
                }
                else {
                    modalFilter += `, ${filters.modal[index]}`
                }
                if (index == filters.modal.length - 1) {
                    modalFilter += `)`
                }
            }
        }

        const result = executeQuerySQL(`
            SELECT
                Agt.Nome AS Agente_Origem,
                COUNT(*) AS Total_Processos
            FROM
                mov_Logistica_House Lhs
            LEFT OUTER JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                mov_Logistica_Maritima_Master Lmm ON Lmm.IdLogistica_Master = Lms.IdLogistica_Master
            LEFT OUTER JOIN
                cad_Pessoa Agt ON Agt.IdPessoa = Lms.IdAgente_Origem
            LEFT OUTER JOIN
                mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House
            WHERE
                Lms.Tipo_Operacao = 2
                AND Lmo.IdMoeda = 110
                ${yearFilter}
                ${monthFilter}
                ${modalFilter}
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Agt.Nome IS NOT NULL
            GROUP BY
                Agt.Nome
            ORDER BY
                Total_Processos DESC`);

        return result;
    },

    processesByCarrier: async function (filters) {

        let yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`;
        let monthFilter = ''
        let modalFilter = ''

        if (filters.ano) {
            for (let index = 0; index < filters.ano.length; index++) {
                if (index == 0) {
                    yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) IN (${filters.ano[index]}`
                }
                else {
                    yearFilter += `, ${filters.ano[index]}`
                }
                if (index == filters.ano.length - 1) {
                    yearFilter += `)`
                }
            }
        }

        if (filters.mes) {
            for (let index = 0; index < filters.mes.length; index++) {
                if (index == 0) {
                    monthFilter = `AND DATEPART(MONTH, Lhs.Data_Abertura_Processo) IN (${filters.mes[index]}`
                }
                else {
                    monthFilter += `, ${filters.mes[index]}`
                }
                if (index == filters.mes.length - 1) {
                    monthFilter += `)`
                }
            }
        }

        if (filters.modal) {
            for (let index = 0; index < filters.modal.length; index++) {
                if (index == 0) {
                    modalFilter = `AND Lhs.Tipo_Carga IN (${filters.modal[index]}`
                }
                else {
                    modalFilter += `, ${filters.modal[index]}`
                }
                if (index == filters.modal.length - 1) {
                    modalFilter += `)`
                }
            }
        }

        const result = executeQuerySQL(`
            SELECT
                Cia.Nome AS Companhia_Transporte,
                COUNT(*) AS Total_Processos
            FROM
                mov_Logistica_House Lhs
            LEFT OUTER JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                cad_Pessoa Cia ON Cia.IdPessoa = Lms.IdCompanhia_Transporte
            LEFT OUTER JOIN
                mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House
            WHERE
                Lms.Tipo_Operacao = 2
                AND Lmo.IdMoeda = 110
                ${yearFilter}
                ${monthFilter}
                ${modalFilter}
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lhs.Numero_Processo NOT LIKE '%test%'
            GROUP BY
                Cia.Nome
            ORDER BY
                Total_Processos DESC`);

        return result;
    },

    processesByTerminal: async function (filters) {

        let yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`;
        let monthFilter = ''
        let modalFilter = ''

        if (filters.ano) {
            for (let index = 0; index < filters.ano.length; index++) {
                if (index == 0) {
                    yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) IN (${filters.ano[index]}`
                }
                else {
                    yearFilter += `, ${filters.ano[index]}`
                }
                if (index == filters.ano.length - 1) {
                    yearFilter += `)`
                }
            }
        }

        if (filters.mes) {
            for (let index = 0; index < filters.mes.length; index++) {
                if (index == 0) {
                    monthFilter = `AND DATEPART(MONTH, Lhs.Data_Abertura_Processo) IN (${filters.mes[index]}`
                }
                else {
                    monthFilter += `, ${filters.mes[index]}`
                }
                if (index == filters.mes.length - 1) {
                    monthFilter += `)`
                }
            }
        }

        if (filters.modal) {
            for (let index = 0; index < filters.modal.length; index++) {
                if (index == 0) {
                    modalFilter = `AND Lhs.Tipo_Carga IN (${filters.modal[index]}`
                }
                else {
                    modalFilter += `, ${filters.modal[index]}`
                }
                if (index == filters.modal.length - 1) {
                    modalFilter += `)`
                }
            }
        }

        const result = executeQuerySQL(`
            SELECT
                Ter.Nome AS Terminal_Redestinacao,
                COUNT(*) AS Total_Processos
            FROM
                mov_Logistica_House Lhs
            LEFT OUTER JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                mov_Logistica_Maritima_Master Lmm ON Lmm.IdLogistica_Master = Lms.IdLogistica_Master
            LEFT OUTER JOIN
                cad_Pessoa Ter ON Ter.IdPessoa = Lmm.IdTerminal_Retirada_Redestinar
            LEFT OUTER JOIN
                mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House
            WHERE
                Lms.Tipo_Operacao = 2
                AND Lmo.IdMoeda = 110
                ${yearFilter}
                ${monthFilter}
                ${modalFilter}
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Ter.Nome IS NOT NULL
            GROUP BY
                Ter.Nome
            ORDER BY
                Total_Processos DESC`);

        return result;
    },

    processesByCustomer: async function (filters) {

        let yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`;
        let monthFilter = ''
        let modalFilter = ''

        if (filters.ano) {
            for (let index = 0; index < filters.ano.length; index++) {
                if (index == 0) {
                    yearFilter = `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) IN (${filters.ano[index]}`
                }
                else {
                    yearFilter += `, ${filters.ano[index]}`
                }
                if (index == filters.ano.length - 1) {
                    yearFilter += `)`
                }
            }
        }

        if (filters.mes) {
            for (let index = 0; index < filters.mes.length; index++) {
                if (index == 0) {
                    monthFilter = `AND DATEPART(MONTH, Lhs.Data_Abertura_Processo) IN (${filters.mes[index]}`
                }
                else {
                    monthFilter += `, ${filters.mes[index]}`
                }
                if (index == filters.mes.length - 1) {
                    monthFilter += `)`
                }
            }
        }

        if (filters.modal) {
            for (let index = 0; index < filters.modal.length; index++) {
                if (index == 0) {
                    modalFilter = `AND Lhs.Tipo_Carga IN (${filters.modal[index]}`
                }
                else {
                    modalFilter += `, ${filters.modal[index]}`
                }
                if (index == filters.modal.length - 1) {
                    modalFilter += `)`
                }
            }
        }

        const result = executeQuerySQL(`
            SELECT
                Cli.Nome AS Cliente,
                COUNT(*) AS Total_Processos
            FROM
                mov_Logistica_House Lhs
            LEFT OUTER JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
            LEFT OUTER JOIN
                cad_Mercadoria Mer ON Mer.IdMercadoria = Lhs.IdMercadoria
            LEFT OUTER JOIN
                mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House
            WHERE
                Lms.Tipo_Operacao = 2
                AND Lmo.IdMoeda = 110
                ${yearFilter}
                ${monthFilter}
                ${modalFilter}
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lhs.Numero_Processo NOT LIKE '%test%'
            GROUP BY
                Cli.Nome
            ORDER BY
                Total_Processos DESC`);

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

};

module.exports = {
    pricingMain,
};
