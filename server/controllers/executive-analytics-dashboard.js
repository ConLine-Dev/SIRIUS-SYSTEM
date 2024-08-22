const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const executiveAnalytics = {

   totalOffers: async function(data) {

      let whereFilter = '';

      if(data.day != null){
         whereFilter = `and DATEPART(day, pft.Data_Proposta) = DATEPART(day, GETDATE()-${data.day})
         and DATEPART(month, pft.Data_Proposta) = DATEPART(month, GETDATE())`;
      }
      if(data.week != null){
         whereFilter = `and DATEPART(week, pft.Data_Proposta) = DATEPART(week, DATEADD(day, -${data.week}, GETDATE()))`;
      }
      if(data.month != null){
         whereFilter = `and DATEPART(month, pft.Data_Proposta) = ${data.month}`;
      }

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

   countOffers: async function(){
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
         count(*) as 'Quantidade'
         from mov_Proposta_Frete pft

         where DATEPART(year, pft.Data_Proposta) = 2024

         group by
         case pft.Situacao
         when 1 then 'Aguardando Aprovação'
         when 2 then 'Aprovada'
         when 3 then 'Reprovada'
         when 4 then 'Não Enviada'
         when 5 then 'Pré Proposta'
         when 6 then 'Enviada'
         else 'Outro'
         end`)
      return result;
   },

   countProcesses: async function(){
      let result = await executeQuerySQL(`
         SELECT
         CASE lhs.Situacao_Agenciamento
         WHEN 1 THEN 'Aberto'
         WHEN 2 THEN 'Em andamento'
         WHEN 3 THEN 'Liberado faturamento'
         WHEN 4 THEN 'Faturado'
         WHEN 5 THEN 'Finalizado'
         WHEN 6 THEN 'Auditado'
         WHEN 7 THEN 'Cancelado'
         END AS 'Status',
         COUNT(*) AS 'Quantidade'
         FROM
         mov_Logistica_House lhs

         WHERE DATEPART(YEAR, lhs.Data_Abertura_Processo) = 2024
         AND lhs.Numero_Processo NOT LIKE '%test%'
         AND lhs.Numero_Processo NOT LIKE '%demu%'

         GROUP BY
         CASE lhs.Situacao_Agenciamento
         WHEN 1 THEN 'Aberto'
         WHEN 2 THEN 'Em andamento'
         WHEN 3 THEN 'Liberado faturamento'
         WHEN 4 THEN 'Faturado'
         WHEN 5 THEN 'Finalizado'
         WHEN 6 THEN 'Auditado'
         WHEN 7 THEN 'Cancelado'
         END`)
      return result;
   },

   totalProcesses: async function(data){

      let whereFilter = '';

      if(data.day != null){
         whereFilter = `and DATEPART(day, lhs.Data_Abertura_Processo) = DATEPART(day, GETDATE()-${data.day})`
      }
      if(data.week != null){
         whereFilter = `and DATEPART(week, lhs.Data_Abertura_Processo) = DATEPART(week, DATEADD(day, -${data.week}, GETDATE()))`
      }
      if(data.month != null){
         whereFilter = `and DATEPART(month, lhs.Data_Abertura_Processo) = ${data.month}`
      }
      
      let result = await executeQuerySQL(`
         SELECT
         lhs.Numero_Processo AS 'Referência',
         lhs.Data_Abertura_Processo AS 'Data Abertura',
         lhs.Data_Auditado AS 'Data Auditado',
         cli.Nome AS 'Cliente',
         cne.Nome AS 'Consignee',
         shp.Nome AS 'Shipper',
         vdd.Nome AS 'Vendedor',
         ctp.Nome AS 'Cia Transporte',
         ori.Nome AS 'Origem',
         des.Nome AS 'Destino',
         CASE lms.Tipo_Operacao
         WHEN 1 THEN 'Exportação'
         WHEN 2 THEN 'Importação'
         WHEN 3 THEN 'Nacional'
         END AS 'Tipo',
         CASE lhs.Situacao_Agenciamento
         WHEN 1 THEN 'Aberto'
         WHEN 2 THEN 'Em andamento'
         WHEN 3 THEN 'Liberado faturamento'
         WHEN 4 THEN 'Faturado'
         WHEN 5 THEN 'Finalizado'
         WHEN 6 THEN 'Auditado'
         WHEN 7 THEN 'Cancelado'
         END AS 'Situação',
         CASE lhs.Tipo_Carga
         WHEN 1 THEN 'Aéreo'
         WHEN 2 THEN 'Break Bulk'
         WHEN 3 THEN 'FCL'
         WHEN 4 THEN 'LCL'
         WHEN 5 THEN 'RO-RO'
         WHEN 6 THEN 'Rodoviário'
         END AS 'Modal',
         STRING_AGG(CONCAT(lme.Quantidade, ' - ', eqp.Descricao), ' / ') AS Equipamentos,
         lmd.Total_Pagamento AS 'Total Pagamento',
         lmd.Total_Pago AS 'Total Pago',
         lmd.Total_Recebimento AS 'Total Recebimento',
         lmd.Total_Recebido AS 'Total Recebido',
         lmd.Lucro_Estimado AS 'Lucro Estimado',
         lmd.Lucro_Efetivo AS 'Lucro Efetivo'
         FROM 
         mov_Logistica_House lhs
         LEFT OUTER JOIN
         mov_Logistica_Master lms ON lms.IdLogistica_Master = lhs.IdLogistica_Master
         LEFT OUTER JOIN
         mov_Logistica_Moeda lmd ON lmd.IdLogistica_House = lhs.IdLogistica_House
         LEFT OUTER JOIN
         cad_Pessoa cli ON cli.IdPessoa = lhs.IdCliente
         LEFT OUTER JOIN
         cad_Pessoa cne ON cne.IdPessoa = lhs.IdImportador
         LEFT OUTER JOIN
         cad_Pessoa shp ON shp.IdPessoa = lhs.IdExportador
         LEFT OUTER JOIN
         cad_Pessoa vdd ON vdd.IdPessoa = lhs.IdVendedor
         LEFT OUTER JOIN
         cad_Pessoa ctp ON ctp.IdPessoa = lms.IdCompanhia_Transporte
         LEFT OUTER JOIN
         cad_Origem_Destino ori ON ori.IdOrigem_Destino = lms.IdOrigem
         LEFT OUTER JOIN
         cad_Origem_Destino des ON des.IdOrigem_Destino = lms.IdDestino
         LEFT OUTER JOIN
         mov_Logistica_Maritima_Equipamento lme ON lme.IdLogistica_House = lhs.IdLogistica_House
         LEFT OUTER JOIN
         cad_Equipamento_Maritimo eqp ON eqp.IdEquipamento_Maritimo = lme.IdEquipamento_Maritimo
         WHERE DATEPART(year, lhs.Data_Abertura_Processo) = 2024
         ${whereFilter}
         AND lmd.IdMoeda = 110
         AND lhs.Numero_Processo NOT LIKE '%test%'
         AND lhs.Numero_Processo NOT LIKE '%demu%'
         GROUP BY 
         lhs.Numero_Processo, 
         lhs.Data_Abertura_Processo, 
         lhs.Data_Auditado,
         cli.Nome,
         cne.Nome,
         shp.Nome,
         vdd.Nome,
         ctp.Nome,
         ori.Nome,
         des.Nome,
         lms.Tipo_Operacao,
         lhs.Situacao_Agenciamento,
         lhs.Tipo_Carga,
         lmd.Total_Pagamento,
         lmd.Total_Pago,
         lmd.Total_Recebimento,
         lmd.Total_Recebido,
         lmd.Lucro_Estimado,
         lmd.Lucro_Efetivo
         ORDER BY lhs.Data_Abertura_Processo DESC`)

         return result;
   }
}

module.exports = {
   executiveAnalytics,
};