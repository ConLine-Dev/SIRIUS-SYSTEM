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
    // Lista o card de ranking de clientes e total de processos
    customerRanking: async function (startDate, endDate) {
        const allDateProcesses = startDate && endDate ? `(Lhs.Data_Abertura_Processo '${startDate}' and '${endDate}')` : `DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`

        const result = await executeQuerySQL(`
            SELECT TOP 5
                Cli.Nome AS Cliente,
                COUNT(Lhs.Numero_Processo) AS Quantidade_Processos,
                SUM(Lmh.Total_TEUS) AS TEUS,
                SUM(Lmh.Total_Container_20) AS Qnt_Container_20,
                SUM(Lmh.Total_Container_40) AS Qnt_Container_40,
                SUM(Lmh.Total_Container_20 + Lmh.Total_Container_40) AS Total_Containers,
                SUM(Lhs.Peso_Bruto) AS Peso_Bruto,
                SUM(Lhs.Metros_Cubicos) AS Metragem_Cubica
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
                ${allDateProcesses}
                AND Lhs.Numero_Processo NOT LIKE '%test%'
            GROUP BY
                Cli.Nome
            ORDER BY
                Quantidade_Processos DESC`)

        return result; 
},
    // Lista o card de Ranking armadores
    carrierRanking: async function (startDate, endDate) {
        const dateCarrier = startDate && endDate ? `(Lhs.Data_Abertura_Processo '${startDate}' and '${endDate}')` : `DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`

        const result = await executeQuerySQL(`
            SELECT TOP 10
                COUNT(Lhs.Numero_Processo) AS Quantidade_Processos,
                Cia.Nome AS Cia_Transporte
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
                ${dateCarrier}
                AND Lhs.Numero_Processo NOT LIKE '%test%'
            GROUP BY
                Cia.Nome
            ORDER BY 
                Quantidade_Processos DESC`)
                
        return result; 
},
    // Lista o card de ranking mercadorias
    productRanking: async function (startDate, endDate) {
        const dateProduct = startDate && endDate ? `(Lhs.Data_Abertura_Processo '${startDate}' and '${endDate}')` : `DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`

        const result = await executeQuerySQL(`
            SELECT TOP 9
                COUNT(Lhs.Numero_Processo) AS Quantidade_Processos,
                Mer.Nome AS Mercadoria
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
                ${dateProduct}
                AND Lhs.Numero_Processo NOT LIKE '%test%'
            GROUP BY
                Mer.Nome
            ORDER BY
                Quantidade_Processos DESC`)
                
        return result; 
},
    // Lista todos os processos de 2023 e 2024
    graphicProcesses: async function (startDate, endDate) {
            const dataProcesses = startDate && endDate ? `(Lhs.Data_Abertura_Processo '${startDate}' and '${endDate}')` : `DATEPART(YEAR, Lhs.Data_Abertura_Processo) IN (2023, 2024)`


            let result = await executeQuerySQL(`
                SELECT 
                    YEAR(Lhs.Data_Abertura_Processo) AS Ano,
                    MONTH(Lhs.Data_Abertura_Processo) AS Mes,
                    COUNT(Lhs.Numero_Processo) AS Quantidade_Processos
                FROM
                    mov_Logistica_House Lhs
                WHERE
                    ${dataProcesses}
                    AND Lhs.Numero_Processo NOT LIKE '%test%'
                GROUP BY 
                    YEAR(Lhs.Data_Abertura_Processo), MONTH(Lhs.Data_Abertura_Processo)
                ORDER BY 
                    Ano, Mes`)

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
    // Lista o relatório de pricing
    listPricingReport: async function (startDate, endDate) {
        const dataListPricing = startDate && endDate ? `(Pfr.Data_Proposta '${startDate}' and '${endDate}')` : `DATEPART(YEAR, Pfr.Data_Proposta) = DATEPART(YEAR, GETDATE())`

        let result = await executeQuerySQL(`
        SELECT
            Pri.Nome AS Pricing,
            Pfr.Data_Proposta AS Data_Proposta,
            Cli.Nome AS Cliente,
            Cia.Nome AS Cia_Transporte,
            Inc.Nome AS Incoterm,
            Pfr.Numero_Proposta AS Numero_Proposta,
            Lhs.Numero_Processo AS Numero_Processo,
            CASE Pfr.Situacao
                WHEN 1 THEN 'AGUARDANDO APROVAÇÃO'
                WHEN 2 THEN 'APROVADA'
                WHEN 3 THEN 'NÃO APROVADA'
                WHEN 4 THEN 'NÃO ENVIADA'
                WHEN 5 THEN 'PRÉ-PROPOSTA'
                WHEN 6 THEN 'ENVIADA'
            END AS Situacao,
            Ori.Nome AS POL,
            Des.Nome AS POD,
            CASE Lhs.Tipo_Carga
                WHEN 0 THEN 'Não especificado'
                WHEN 1 THEN 'Aéreo'
                WHEN 2 THEN 'Break-Bulk'
                WHEN 3 THEN 'FCL'
                WHEN 4 THEN 'LCL'
                WHEN 5 THEN 'RO-RO'
                WHEN 6 THEN 'Rodoviário'
            END AS Tipo_Carga,
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
            END AS Equipamentos,
                Lmh.Total_TEUS AS TEUS,
                Lhs.Metros_Cubicos AS M3,
                Lhs.Peso_Bruto AS Peso_Bruto
            FROM
            mov_Oferta_Frete Ofr
            LEFT OUTER JOIN
            mov_Proposta_Frete Pfr ON Pfr.IdProposta_Frete = Ofr.IdProposta_Frete
            LEFT OUTER JOIN
            mov_Proposta_Frete_Carga Pfc ON Pfc.IdProposta_Frete = Pfr.IdProposta_Frete
            LEFT OUTER JOIN 
                mov_Logistica_House Lhs ON Lhs.IdOferta_Frete = Ofr.IdOferta_Frete
            LEFT OUTER JOIN
                mov_Logistica_Maritima_Equipamento Lme ON Lme.IdLogistica_House = Lhs.IdLogistica_House
            LEFT OUTER JOIN
                mov_Logistica_Maritima_House Lmh ON Lmh.IdLogistica_House = Lhs.IdLogistica_House
            LEFT OUTER JOIN
            mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Pfr.IdProjeto_Atividade /*AND Par.IdPapel_Projeto = 5*/ /*PRINCING IM*/
            LEFT OUTER JOIN
            cad_Pessoa Pri ON Pri.IdPessoa = Par.IdResponsavel
            LEFT OUTER JOIN
            cad_Pessoa Cli ON Cli.IdPessoa = Pfr.IdCliente
            LEFT OUTER JOIN
            cad_Incoterm Inc ON Inc.IdIncoterm = Ofr.IdIncoterm
            LEFT OUTER JOIN
            cad_Origem_Destino Ori ON Ori.IdOrigem_Destino = Ofr.IdOrigem
            LEFT OUTER JOIN
            cad_Origem_Destino Des ON Des.IdOrigem_Destino = Ofr.IdDestino
            LEFT OUTER JOIN
            cad_Pessoa Cia ON Cia.IdPessoa = Ofr.IdCompanhia_Transporte
            WHERE
            ${dataListPricing}`)

        return result;  
}

}


module.exports = {
    reportPricing,
 };