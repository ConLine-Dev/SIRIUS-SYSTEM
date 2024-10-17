const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const reportPricing = {


        // Lista todas as situaçoes da proposta
        countOffers: async function (startDate, endDate) {
            const dataOffers = startDate && endDate ? `(pft.Data_Proposta '${startDate}' and '${endDate}')` : `AND DATEPART(YEAR,pft.Data_Proposta) = DATEPART(YEAR, GETDATE())`


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
            count(pft.IdProposta_Frete) as 'Quantidade'
            from 
            mov_Proposta_Frete pft

            left outer join 
            mov_Oferta_Frete oft on oft.IdProposta_Frete = pft.IdProposta_Frete

            where 
            ${dataOffers}

            group by
            pft.Situacao`)

        return result;
    },


         // Lista todos os departamentos
         totalOffers: async function (data) {

            let result = await executeQuerySQL(`
                select 
                pft.Numero_Proposta as 'Referência',
                pft.Data_Proposta as 'Data Abertura',
                cli.Nome as 'Cliente',
                cne.Nome as 'Consignee',
                shp.Nome as 'Shipper',
                vdd.Nome as 'Vendedor',
                ctp.Nome as 'Cia Transporte',
                ori.Nome as 'Origem',
                des.Nome as 'Destino',
                case pft.Situacao
                when 1 then 'Aguardando Aprovação'
                when 2 then 'Aprovada'
                when 3 then 'Reprovada'
                when 4 then 'Não Enviada'
                when 5 then 'Pré Proposta'
                when 6 then 'Enviada'
                end as 'Situação',
                case oft.Tipo_Operacao
                when 1 then 'Exportação'
                when 2 then 'Importação'
                when 3 then 'Nacional'
                end as 'Tipo',
                case pfc.Tipo_Carga
                when 1 then 'Aéreo'
                when 2 then 'Break Bulk'
                when 3 then 'FCL'
                when 4 then 'LCL'
                when 5 then 'RO-RO'
                when 6 then 'Rodoviário'
                end as 'Modal'
                from mov_Proposta_Frete pft
    
                left outer join mov_Oferta_Frete oft on oft.IdProposta_Frete = pft.IdProposta_Frete
                left outer join mov_Proposta_Frete_Carga pfc on pfc.IdProposta_Frete = pft.IdProposta_Frete
                left outer join cad_Pessoa cli on cli.IdPessoa = pft.IdCliente
                left outer join cad_Pessoa cne on cne.IdPessoa = oft.IdImportador
                left outer join cad_Pessoa shp on shp.IdPessoa = oft.IdExportador
                left outer join cad_Pessoa vdd on vdd.IdPessoa = pft.IdVendedor
                left outer join cad_Pessoa ctp on ctp.IdPessoa = oft.IdCompanhia_Transporte
                left outer join cad_Origem_Destino ori on ori.IdOrigem_Destino = oft.IdOrigem
                left outer join cad_Origem_Destino des on des.IdOrigem_Destino = oft.IdDestino
    
                WHERE DATEPART(year, pft.Data_Proposta) = 2024
                ${whereFilter}
    
                order by pft.Numero_Proposta DESC`);
    
            return result;
       },
}


module.exports = {
    reportPricing,
 };