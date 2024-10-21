const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const reportPricing = {


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

            
        }


         // Lista todos os departamentos
    //      totalOffers: async function (data) {

    //         let result = await executeQuerySQL(`
    //             select 
    //             pft.Numero_Proposta as 'Referência',
    //             pft.Data_Proposta as 'Data Abertura',
    //             cli.Nome as 'Cliente',
    //             cne.Nome as 'Consignee',
    //             shp.Nome as 'Shipper',
    //             vdd.Nome as 'Vendedor',
    //             ctp.Nome as 'Cia Transporte',
    //             ori.Nome as 'Origem',
    //             des.Nome as 'Destino',
    //             case pft.Situacao
    //             when 1 then 'Aguardando Aprovação'
    //             when 2 then 'Aprovada'
    //             when 3 then 'Reprovada'
    //             when 4 then 'Não Enviada'
    //             when 5 then 'Pré Proposta'
    //             when 6 then 'Enviada'
    //             end as 'Situação',
    //             case oft.Tipo_Operacao
    //             when 1 then 'Exportação'
    //             when 2 then 'Importação'
    //             when 3 then 'Nacional'
    //             end as 'Tipo',
    //             case pfc.Tipo_Carga
    //             when 1 then 'Aéreo'
    //             when 2 then 'Break Bulk'
    //             when 3 then 'FCL'
    //             when 4 then 'LCL'
    //             when 5 then 'RO-RO'
    //             when 6 then 'Rodoviário'
    //             end as 'Modal'
    //             from mov_Proposta_Frete pft
    
    //             left outer join mov_Oferta_Frete oft on oft.IdProposta_Frete = pft.IdProposta_Frete
    //             left outer join mov_Proposta_Frete_Carga pfc on pfc.IdProposta_Frete = pft.IdProposta_Frete
    //             left outer join cad_Pessoa cli on cli.IdPessoa = pft.IdCliente
    //             left outer join cad_Pessoa cne on cne.IdPessoa = oft.IdImportador
    //             left outer join cad_Pessoa shp on shp.IdPessoa = oft.IdExportador
    //             left outer join cad_Pessoa vdd on vdd.IdPessoa = pft.IdVendedor
    //             left outer join cad_Pessoa ctp on ctp.IdPessoa = oft.IdCompanhia_Transporte
    //             left outer join cad_Origem_Destino ori on ori.IdOrigem_Destino = oft.IdOrigem
    //             left outer join cad_Origem_Destino des on des.IdOrigem_Destino = oft.IdDestino
    
    //             WHERE DATEPART(year, pft.Data_Proposta) = 2024
    //             ${whereFilter}
    
    //             order by pft.Numero_Proposta DESC`);
    
    //         return result;
    //    },
}


module.exports = {
    reportPricing,
 };