const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const reportPricing = {

    // Lista todos os cards referente a operação
    managementPricing: async function (startDate, endDate) {
        const allDate = startDate && endDate ? `(Lhs.Data_Abertura_Processo '${startDate}' and '${endDate}')` : `DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`


        const result = await executeQuerySQL(`
        SELECT
            COUNT(Lhs.Numero_Processo) AS Numero_Processo,
            Cli.Nome AS Cliente,
            Lmh.Total_TEUS AS TEUS,
            Lmh.Total_Container_20 AS Qnt_Container_20,
            Lmh.Total_Container_40 AS Qnt_Container_40,
            (Lmh.Total_Container_20 + Lmh.Total_Container_40) AS Total_Containers,
            Lhs.Peso_Bruto AS Peso_Bruto,
            Lhs.Metros_Cubicos AS Metragem_Cubica,
            Mer.Nome AS Mercadoria,
            Lme.IdEquipamento_Maritimo AS IdEquipamentos,
            Cia.Nome AS Cia_Transporte,

            CASE Lme.IdEquipamento_Maritimo
            WHEN 3 THEN '20 DRY'
            WHEN 4 THEN '20 OPEN TOP'
            WHEN 5 THEN '20 FLAT RACK'
            WHEN 8 THEN '40 FLAT RACK'
            WHEN 9 THEN '40 HIGH CUBE'
            WHEN 10 THEN '40 DRY'
            WHEN 11 THEN '40 OPEN TOP'
            WHEN 12 THEN '40 REEFER'
            WHEN 15 THEN '40 NOR'
            WHEN 26 THEN '40 OT OH'
            END AS Equipamentos
        FROM
            mov_Logistica_House Lhs
        LEFT OUTER JOIN
            mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
        LEFT OUTER JOIN
            mov_Logistica_Maritima_House Lmh ON Lmh.IdLogistica_House = Lhs.IdLogistica_House
        LEFT OUTER JOIN
            cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
        LEFT OUTER JOIN
            cad_Pessoa Cia ON Cia.IdPessoa = Lms.IdCompanhia_Transporte
        LEFT OUTER JOIN
            cad_Mercadoria Mer ON Mer.IdMercadoria = Lhs.IdMercadoria
        LEFT OUTER JOIN
            mov_Logistica_Maritima_Equipamento Lme ON Lme.IdLogistica_House = Lhs.IdLogistica_House
        WHERE
            ${allDate}
        AND Lhs.Numero_Processo NOT LIKE '%test%'
        GROUP BY
            Cli.Nome,
            Lmh.Total_TEUS,
            Lmh.Total_Container_20,
            Lmh.Total_Container_40,
            Lhs.Peso_Bruto,
            Lhs.Metros_Cubicos,
            Mer.Nome,
            Lme.IdEquipamento_Maritimo,
            Cia.Nome`)

    return result;
},


    // Lista todas as situaçoes da proposta
    totalOffersProcesses: async function (startDate, endDate) {
            const dataOffers = startDate && endDate ? `(pft.Data_Proposta '${startDate}' and '${endDate}')` : `DATEPART(YEAR,pft.Data_Proposta) = DATEPART(YEAR, GETDATE())`


            let result = await executeQuerySQL(`
            select
                case pft.Situacao
                    when 1 then 'Aguardando Aprovação'
                    when 2 then 'Aprovada'
                    when 3 then 'Reprovada'
                    when 4 then 'Não Enviada'
                    when 5 then 'Pré Proposta'
                    when 6 then 'Enviada'
                    else 'Outro'
                end as 'Status',
                count(pft.IdProposta_Frete) as 'Qnt_Proposta',
                count(Lhs.IdLogistica_House) as 'Qnt_Processo',
                SUM(count(pft.IdProposta_Frete)) OVER() as 'Total_Qnt_Proposta',
                SUM(count(Lhs.IdLogistica_House)) OVER() as 'Total_Qnt_Processo'
            from 
                mov_Proposta_Frete pft
            left outer join 
                mov_Oferta_Frete oft on oft.IdProposta_Frete = pft.IdProposta_Frete
            left outer join
                mov_Logistica_House Lhs on Lhs.IdOferta_Frete = oft.IdOferta_Frete
            where 
                ${dataOffers}
                AND Lhs.Numero_Processo NOT LIKE ('%test%')
            group by
                pft.Situacao`)

        return result;
},

    // Lista todos os processos de 2023 e 2024
    graphicProcesses: async function (startDate, endDate) {
            const dataProcesses = startDate && endDate ? `(pft.Data_Proposta '${startDate}' and '${endDate}')` : `DATEPART(YEAR, Pfr.Data_Proposta) IN (2023, 2024)`


            let result = await executeQuerySQL(`
                WITH ProcessosPorMes AS (
                SELECT 
                    DATEPART(MONTH, Pfr.Data_Proposta) AS Mes,
                    DATEPART(YEAR, Pfr.Data_Proposta) AS Ano,
                    COUNT(DISTINCT Lhs.Numero_Processo) AS TotalProcessos
                FROM
                    mov_Oferta_Frete Ofr
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdOferta_Frete = Ofr.IdOferta_Frete
                LEFT OUTER JOIN
                    mov_Proposta_Frete Pfr ON Pfr.IdProposta_Frete = Ofr.IdProposta_Frete
                WHERE
                    ${dataProcesses}
                    AND Lhs.Numero_Processo NOT LIKE '%test%' -- Filtro para evitar processos de teste
                GROUP BY
                    DATEPART(MONTH, Pfr.Data_Proposta),
                    DATEPART(YEAR, Pfr.Data_Proposta) -- Agrupa por mês e ano
            )
            SELECT 
                Meses.MesNome,
                COALESCE(P2024.TotalProcessos, 0) AS TotalProcessos2024, -- Total de processos em 2024
                COALESCE(P2023.TotalProcessos, 0) AS TotalProcessos2023 -- Total de processos em 2023
            FROM
                (VALUES
                    (1, 'JANEIRO'),
                    (2, 'FEVEREIRO'),
                    (3, 'MARÇO'),
                    (4, 'ABRIL'),
                    (5, 'MAIO'),
                    (6, 'JUNHO'),
                    (7, 'JULHO'),
                    (8, 'AGOSTO'),
                    (9, 'SETEMBRO'),
                    (10, 'OUTUBRO'),
                    (11, 'NOVEMBRO'),
                    (12, 'DEZEMBRO')
                ) AS Meses(Mes, MesNome) -- Tabela de meses
            LEFT JOIN 
                ProcessosPorMes P2024 ON P2024.Mes = Meses.Mes AND P2024.Ano = 2024 -- Junta com os processos de 2024
            LEFT JOIN 
                ProcessosPorMes P2023 ON P2023.Mes = Meses.Mes AND P2023.Ano = 2023 -- Junta com os processos de 2023
            ORDER BY 
                Meses.Mes;`)

        return result;

            
},


   


}


module.exports = {
    reportPricing,
 };