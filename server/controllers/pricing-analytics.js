const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const pricingAnalytics = {

    getVolumes: async function () {
        const result = executeQuerySQL(`
            SELECT
                pss.Nome AS Agente,
                pais.Nome AS Pais,
                lhs.Numero_Processo,
                lme.Quantidade,
                eqp.Descricao AS Container,
                DATEPART(year, lhs.Data_Abertura_Processo) AS Ano,
                DATEPART(month, lhs.Data_Abertura_Processo) AS Mes,
                lmh.Total_TEUS AS Teus
            FROM mov_Logistica_House lhs
            LEFT OUTER JOIN mov_Logistica_Master lms
                ON lms.IdLogistica_Master = lhs.IdLogistica_Master
            LEFT OUTER JOIN mov_Logistica_Maritima_Equipamento lme
                ON lme.IdLogistica_House = lhs.IdLogistica_House
            LEFT OUTER JOIN cad_Equipamento_Maritimo eqp
                ON eqp.IdEquipamento_Maritimo = lme.IdEquipamento_Maritimo
            LEFT OUTER JOIN cad_Pessoa pss
                ON pss.IdPessoa = lms.IdAgente_Origem
            LEFT OUTER JOIN cad_Origem_Destino org
                ON org.IdOrigem_Destino = lms.IdOrigem
            LEFT OUTER JOIN cad_Pais pais
                ON pais.IdPais = org.IdPais
            LEFT OUTER JOIN mov_Logistica_Maritima_House lmh
                ON lmh.IdLogistica_House = lhs.IdLogistica_House
            WHERE
                DATEPART(YEAR, lhs.Data_Abertura_Processo) > 2022
                AND lhs.Situacao_Agenciamento != 7
                AND lhs.Tipo_Carga = 3
                AND lms.Tipo_Operacao = 2
                AND lhs.Numero_Processo not like '%DEMU%'
                AND lhs.Numero_Processo not like '%test%'
                AND pss.Nome is not NULL
                AND lme.Quantidade > 0`);

        return result;
    },
    updateTable: async function (details) {

        let countryFilter = ''
        let agentFilter = ''
        let yearFilter = ''

        if (details.country) {
            countryFilter = `AND pais.IdPais = ${details.country}`
        }

        if (details.agent) {
            agentFilter = `AND lms.IdAgente_Origem = ${details.agent}`
        }

        if (details.year) {
            yearFilter = `AND DATEPART(YEAR, lhs.Data_Abertura_Processo) = ${details.year}`
        }

        let result = await executeQuerySQL(`
           SELECT
                pss.Nome AS Agente,
                pais.Nome AS Pais,
                lhs.Numero_Processo,
                lme.Quantidade,
                eqp.Descricao AS Container,
                DATEPART(year, lhs.Data_Abertura_Processo) AS Ano,
                DATEPART(month, lhs.Data_Abertura_Processo) AS Mes,
                lmh.Total_TEUS AS Teus
            FROM mov_Logistica_House lhs
            LEFT OUTER JOIN mov_Logistica_Master lms
                ON lms.IdLogistica_Master = lhs.IdLogistica_Master
            LEFT OUTER JOIN mov_Logistica_Maritima_Equipamento lme
                ON lme.IdLogistica_House = lhs.IdLogistica_House
            LEFT OUTER JOIN cad_Equipamento_Maritimo eqp
                ON eqp.IdEquipamento_Maritimo = lme.IdEquipamento_Maritimo
            LEFT OUTER JOIN cad_Pessoa pss
                ON pss.IdPessoa = lms.IdAgente_Origem
            LEFT OUTER JOIN cad_Origem_Destino org
                ON org.IdOrigem_Destino = lms.IdOrigem
            LEFT OUTER JOIN cad_Pais pais
                ON pais.IdPais = org.IdPais
            LEFT OUTER JOIN mov_Logistica_Maritima_House lmh
                ON lmh.IdLogistica_House = lhs.IdLogistica_House
            WHERE
                DATEPART(YEAR, lhs.Data_Abertura_Processo) > 2022
                ${countryFilter}
                ${agentFilter}
                ${yearFilter}
                AND lhs.Situacao_Agenciamento != 7
                AND lhs.Tipo_Carga = 3
                AND lms.Tipo_Operacao = 2
                AND lhs.Numero_Processo not like '%DEMU%'
                AND lhs.Numero_Processo not like '%test%'
                AND pss.Nome is not NULL
                AND lme.Quantidade > 0`)

        return result;
    },
    getAgents: async function (countryId) {

        let countryFilter = '';
        if (countryId) {
            countryFilter = `AND org.IdPais = ${countryId}`
        }
        let result = await executeQuerySQL(`
            SELECT DISTINCT
                pss.Nome AS Agente,
                pss.IdPessoa
            FROM mov_Logistica_House lhs
            LEFT OUTER JOIN mov_Logistica_Master lms
                ON lms.IdLogistica_Master = lhs.IdLogistica_Master
            LEFT OUTER JOIN mov_Logistica_Maritima_Equipamento lme
                ON lme.IdLogistica_House = lhs.IdLogistica_House
            LEFT OUTER JOIN cad_Equipamento_Maritimo eqp
                ON eqp.IdEquipamento_Maritimo = lme.IdEquipamento_Maritimo
            LEFT OUTER JOIN cad_Pessoa pss
                ON pss.IdPessoa = lms.IdAgente_Origem
            LEFT OUTER JOIN cad_Origem_Destino org
                ON org.IdOrigem_Destino = lms.IdOrigem
            LEFT OUTER JOIN cad_Pais pais
                ON pais.IdPais = org.IdPais
            LEFT OUTER JOIN mov_Logistica_Maritima_House lmh
                ON lmh.IdLogistica_House = lhs.IdLogistica_House
            WHERE
                DATEPART(YEAR, lhs.Data_Abertura_Processo) > 2022
                AND lhs.Situacao_Agenciamento != 7
                ${countryFilter}
                AND lhs.Tipo_Carga = 3
                AND lms.Tipo_Operacao = 2
                AND lhs.Numero_Processo not like '%DEMU%'
                AND lhs.Numero_Processo not like '%test%'
                AND pss.Nome is not NULL
                AND lme.Quantidade > 0
            ORDER BY pss.Nome ASC`)

        return result;
    },
    getCountries: async function () {
        let result = await executeQuerySQL(`
            SELECT DISTINCT
                pais.Nome AS Pais,
                pais.IdPais
            FROM mov_Logistica_House lhs
            LEFT OUTER JOIN mov_Logistica_Master lms
                ON lms.IdLogistica_Master = lhs.IdLogistica_Master
            LEFT OUTER JOIN mov_Logistica_Maritima_Equipamento lme
                ON lme.IdLogistica_House = lhs.IdLogistica_House
            LEFT OUTER JOIN cad_Equipamento_Maritimo eqp
                ON eqp.IdEquipamento_Maritimo = lme.IdEquipamento_Maritimo
            LEFT OUTER JOIN cad_Pessoa pss
                ON pss.IdPessoa = lms.IdAgente_Origem
            LEFT OUTER JOIN cad_Origem_Destino org
                ON org.IdOrigem_Destino = lms.IdOrigem
            LEFT OUTER JOIN cad_Pais pais
                ON pais.IdPais = org.IdPais
            LEFT OUTER JOIN mov_Logistica_Maritima_House lmh
                ON lmh.IdLogistica_House = lhs.IdLogistica_House
            WHERE
                DATEPART(YEAR, lhs.Data_Abertura_Processo) > 2022
                AND lhs.Situacao_Agenciamento != 7
                AND lhs.Tipo_Carga = 3
                AND lms.Tipo_Operacao = 2
                AND lhs.Numero_Processo not like '%DEMU%'
                AND lhs.Numero_Processo not like '%test%'
                AND pss.Nome is not NULL
                AND lme.Quantidade > 0
            ORDER BY pais.Nome ASC`)

        return result;
    },
    getYears: async function () {
        let result = await executeQuerySQL(`
            SELECT DISTINCT
                DATEPART(year, lhs.Data_Abertura_Processo) AS Ano
            FROM mov_Logistica_House lhs
            LEFT OUTER JOIN mov_Logistica_Master lms
                ON lms.IdLogistica_Master = lhs.IdLogistica_Master
            LEFT OUTER JOIN mov_Logistica_Maritima_Equipamento lme
                ON lme.IdLogistica_House = lhs.IdLogistica_House
            LEFT OUTER JOIN cad_Equipamento_Maritimo eqp
                ON eqp.IdEquipamento_Maritimo = lme.IdEquipamento_Maritimo
            LEFT OUTER JOIN cad_Pessoa pss
                ON pss.IdPessoa = lms.IdAgente_Origem
            LEFT OUTER JOIN cad_Origem_Destino org
                ON org.IdOrigem_Destino = lms.IdOrigem
            LEFT OUTER JOIN cad_Pais pais
                ON pais.IdPais = org.IdPais
            LEFT OUTER JOIN mov_Logistica_Maritima_House lmh
                ON lmh.IdLogistica_House = lhs.IdLogistica_House
            WHERE
                DATEPART(YEAR, lhs.Data_Abertura_Processo) > 2022
                AND lhs.Situacao_Agenciamento != 7
                AND lhs.Tipo_Carga = 3
                AND lms.Tipo_Operacao = 2
                AND lhs.Numero_Processo not like '%DEMU%'
                AND lhs.Numero_Processo not like '%test%'
                AND pss.Nome is not NULL
                AND lme.Quantidade > 0`)

        return result;
    },
    getMoveByOrigin: async function (data) {

        let yearFilter = `DATEPART(YEAR, lhs.Data_Abertura_Processo) > 2022`
        let monthFilter = '';

        if (data.year) {
            yearFilter = `DATEPART(YEAR, lhs.Data_Abertura_Processo) = ${data.year}`
        }
        if (data.month) {
            monthFilter = `AND DATEPART(MONTH, lhs.Data_Abertura_Processo) = ${data.month}`
        }

        let result = await executeQuerySQL(`
            WITH RankedCountries AS (
                SELECT
                    pais.Nome AS Pais,
                    COUNT(*) AS Quantidade_Aparicoes,
                    SUM(lmh.Total_TEUS) AS Total_TEUS
                FROM mov_Logistica_House lhs
                LEFT OUTER JOIN mov_Logistica_Master lms
                    ON lms.IdLogistica_Master = lhs.IdLogistica_Master
                LEFT OUTER JOIN mov_Logistica_Maritima_Equipamento lme
                    ON lme.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN cad_Equipamento_Maritimo eqp
                    ON eqp.IdEquipamento_Maritimo = lme.IdEquipamento_Maritimo
                LEFT OUTER JOIN cad_Pessoa pss
                    ON pss.IdPessoa = lms.IdAgente_Origem
                LEFT OUTER JOIN cad_Origem_Destino org
                    ON org.IdOrigem_Destino = lms.IdOrigem
                LEFT OUTER JOIN cad_Pais pais
                    ON pais.IdPais = org.IdPais
                LEFT OUTER JOIN mov_Logistica_Maritima_House lmh
                    ON lmh.IdLogistica_House = lhs.IdLogistica_House
                WHERE
                    ${yearFilter}
                    ${monthFilter}
                    AND lhs.Situacao_Agenciamento != 7
                    AND lhs.Tipo_Carga = 3
                    AND lms.Tipo_Operacao = 2
                    AND lhs.Numero_Processo NOT LIKE '%DEMU%'
                    AND lhs.Numero_Processo NOT LIKE '%test%'
                    AND pss.Nome IS NOT NULL
                    AND lme.Quantidade > 0
                GROUP BY pais.Nome
            ),
            Top9 AS (
                SELECT *,
                    ROW_NUMBER() OVER (ORDER BY Total_TEUS DESC) AS Rank
                FROM RankedCountries
            )
            SELECT 
                CASE
                    WHEN Rank <= 100 THEN Pais 
                    ELSE 'OUTROS' 
                END AS Pais,
                SUM(Quantidade_Aparicoes) AS Quantidade_Aparicoes,
                SUM(Total_TEUS) AS Total_TEUS
            FROM Top9
            GROUP BY 
                CASE 
                    WHEN Rank <= 100 THEN Pais 
                    ELSE 'OUTROS' 
                END
            ORDER BY Total_TEUS DESC;`);

        return result;
    },
    getMoveByAgent: async function (data) {

        let countryFilter = '';
        let yearFilter = `AND DATEPART(YEAR, lhs.Data_Abertura_Processo) > 2022`

        if (data.idCountry) {
            countryFilter = `AND pss.IdPais = ${data.idCountry}`;
        }
        if (data.year) {
            yearFilter = `AND DATEPART(YEAR, lhs.Data_Abertura_Processo) = ${data.year}`
        }
        if (data.month) {
            monthFilter = `AND DATEPART(MONTH, lhs.Data_Abertura_Processo) = ${data.month}`
        }

        let result = await executeQuerySQL(`
            WITH RankedAgents AS (
                SELECT
                    pss.Nome AS Agente,
                    SUM(lmh.Total_TEUS) AS Total_TEUS
                FROM mov_Logistica_House lhs
                LEFT OUTER JOIN mov_Logistica_Master lms
                    ON lms.IdLogistica_Master = lhs.IdLogistica_Master
                LEFT OUTER JOIN cad_Pessoa pss
                    ON pss.IdPessoa = lms.IdAgente_Origem
                LEFT OUTER JOIN mov_Logistica_Maritima_House lmh
                    ON lmh.IdLogistica_House = lhs.IdLogistica_House
                WHERE
                    lhs.Situacao_Agenciamento != 7
                    ${yearFilter}
                    ${monthFilter}
                    ${countryFilter}
                    AND lhs.Tipo_Carga = 3
                    AND lms.Tipo_Operacao = 2
                    AND lhs.Numero_Processo NOT LIKE '%DEMU%'
                    AND lhs.Numero_Processo NOT LIKE '%test%'
                GROUP BY pss.Nome, pss.IdPais
            ),
            Top5 AS (
                SELECT *,
                    ROW_NUMBER() OVER (ORDER BY Total_TEUS DESC) AS Rank
                FROM RankedAgents
            )
            SELECT
                CASE
                    WHEN Rank <= 100 THEN Agente
                    ELSE 'OUTROS'
                END AS Agente,
                SUM(Total_TEUS) AS Total_TEUS
            FROM Top5
            GROUP BY
                CASE
                    WHEN Rank <= 100 THEN Agente
                    ELSE 'OUTROS'
                END
            ORDER BY Total_TEUS DESC;`);

        return result;
    },
    getProcessesByAgent: async function (data) {

        let countryFilter = '';
        let yearFilter = `AND DATEPART(YEAR, lhs.Data_Abertura_Processo) > 2022`

        if (data.idCountry) {
            countryFilter = `AND pss.IdPais = ${data.idCountry}`;
        }
        if (data.year) {
            yearFilter = `AND DATEPART(YEAR, lhs.Data_Abertura_Processo) = ${data.year}`
        }
        if (data.month) {
            monthFilter = `AND DATEPART(MONTH, lhs.Data_Abertura_Processo) = ${data.month}`
        }

        let result = await executeQuerySQL(`
            WITH RankedAgents AS (
                SELECT
                    pss.Nome AS Agente,
                    SUM(lmh.Total_TEUS) AS Total_TEUS
                FROM mov_Logistica_House lhs
                LEFT OUTER JOIN mov_Logistica_Master lms
                    ON lms.IdLogistica_Master = lhs.IdLogistica_Master
                LEFT OUTER JOIN cad_Pessoa pss
                    ON pss.IdPessoa = lms.IdAgente_Origem
                LEFT OUTER JOIN mov_Logistica_Maritima_House lmh
                    ON lmh.IdLogistica_House = lhs.IdLogistica_House
                WHERE
                    lhs.Situacao_Agenciamento != 7
                    ${yearFilter}
                    ${monthFilter}
                    ${countryFilter}
                    AND lhs.Tipo_Carga = 3
                    AND lms.Tipo_Operacao = 2
                    AND lhs.Numero_Processo NOT LIKE '%DEMU%'
                    AND lhs.Numero_Processo NOT LIKE '%test%'
                    AND lms.Data_Embarque IS NOT NULL
                GROUP BY pss.Nome, pss.IdPais
            ),
            Top5 AS (
                SELECT *,
                    ROW_NUMBER() OVER (ORDER BY Total_TEUS DESC) AS Rank
                FROM RankedAgents
            )
            SELECT
                CASE
                    WHEN Rank <= 100 THEN Agente
                    ELSE 'OUTROS'
                END AS Agente,
                SUM(Total_TEUS) AS Total_TEUS
            FROM Top5
            GROUP BY
                CASE
                    WHEN Rank <= 100 THEN Agente
                    ELSE 'OUTROS'
                END
            ORDER BY Total_TEUS DESC;`);

        return result;
    },

};

module.exports = {
    pricingAnalytics,
};