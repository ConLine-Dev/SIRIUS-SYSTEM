const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const executiveAnalytics = {

   totalOffers: async function (data) {

      let whereFilter = '';

      if (data.day != null) {
         whereFilter = `and DATEPART(day, pft.Data_Proposta) = DATEPART(day, GETDATE()-${data.day})
         and DATEPART(month, pft.Data_Proposta) = DATEPART(month, GETDATE())`;
      }
      if (data.week != null) {
         whereFilter = `and DATEPART(week, pft.Data_Proposta) = DATEPART(week, DATEADD(day, -${data.week}, GETDATE()))`;
      }
      if (data.month != null) {
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

   countOffers: async function () {
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
         from mov_Proposta_Frete pft

         left outer join mov_Oferta_Frete oft on oft.IdProposta_Frete = pft.IdProposta_Frete

         where DATEPART(year, pft.Data_Proposta) = 2024

         group by
         pft.Situacao`)
      return result;
   },

   countProcesses: async function () {
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

   totalProcesses: async function (data) {

      let whereFilter = '';

      if (data.day != null) {
         whereFilter = `and DATEPART(day, lhs.Data_Abertura_Processo) = DATEPART(day, GETDATE()-${data.day})`
      }
      if (data.week != null) {
         whereFilter = `and DATEPART(week, lhs.Data_Abertura_Processo) = DATEPART(week, DATEADD(day, -${data.week}, GETDATE()))`
      }
      if (data.month != null) {
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
   },

   offerDetails: async function (reference) {
      let result = await executeQuerySQL(`
         select 
         pft.Numero_Proposta as 'Referência',
         cli.Nome as 'Cliente',
         cne.Nome as 'Consignee',
         shp.Nome as 'Shipper',
         vdd.Nome as 'Vendedor',
         ctp.Nome as 'Armador',
         ori.Nome as 'Origem',
         des.Nome as 'Destino',
         STRING_AGG(CONCAT(pfe.Quantidade, ' - ', eqp.Descricao), '/') AS 'Equipamentos',
         ofc.Lucro_Estimado,
         ofc.Total_Pagamento,
         ofc.Total_Recebimento
         from mov_Proposta_Frete pft
         left outer join mov_Oferta_Frete oft on oft.IdProposta_Frete = pft.IdProposta_Frete
         left outer join mov_Proposta_Frete_Carga pfc on pfc.IdProposta_Frete = pft.IdProposta_Frete
         left outer join mov_Proposta_Frete_Equipamento pfe on pfe.IdProposta_Frete_Carga = pfc.IdProposta_Frete_Carga
         left outer join mov_Oferta_Frete_Fechamento ofc on ofc.IdOferta_Frete = oft.IdOferta_Frete
         left outer join cad_Pessoa cli on cli.IdPessoa = pft.IdCliente
         left outer join cad_Pessoa cne on cne.IdPessoa = oft.IdImportador
         left outer join cad_Pessoa shp on shp.IdPessoa = oft.IdExportador
         left outer join cad_Pessoa vdd on vdd.IdPessoa = pft.IdVendedor
         left outer join cad_Pessoa ctp on ctp.IdPessoa = oft.IdCompanhia_Transporte
         left outer join cad_Origem_Destino ori on ori.IdOrigem_Destino = oft.IdOrigem
         left outer join cad_Origem_Destino des on des.IdOrigem_Destino = oft.IdDestino
         left outer join cad_Equipamento_Maritimo eqp on eqp.IdEquipamento_Maritimo = pfe.IdEquipamento_Maritimo
         WHERE pft.Numero_Proposta = '${reference}'
         AND ofc.IdMoeda = 110
         group by
         pft.Numero_Proposta,
         cli.Nome,
         cne.Nome,
         shp.Nome,
         vdd.Nome,
         ctp.Nome,
         ori.Nome,
         des.Nome,
         ofc.Lucro_Estimado,
         ofc.Total_Pagamento,
         ofc.Total_Recebimento`)
      return result;
   },

   processDetails: async function (reference) {

      let result = await executeQuerySQL(`
         SELECT
         lhs.Numero_Processo AS 'Processo',
         cli.Nome AS 'Cliente',
         cne.Nome AS 'Consignee',
         shp.Nome AS 'Shipper',
         vdd.Nome AS 'Vendedor',
         ctp.Nome AS 'Armador',
         ori.Nome AS 'Origem',
         des.Nome AS 'Destino',
         STRING_AGG(CONCAT(lme.Quantidade, ' - ', eqp.Descricao), ' / ') AS 'Equipamentos',
         lmd.Total_Pagamento AS 'Total_Pagamento',
         lmd.Total_Pago AS 'Total_Pago',
         lmd.Total_Recebimento AS 'Total_Recebimento',
         lmd.Total_Recebido AS 'Total_Recebido',
         lmd.Lucro_Estimado AS 'Lucro_Estimado',
         lmd.Lucro_Efetivo AS 'Lucro_Efetivo'
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
         WHERE lhs.Numero_Processo = '${reference}'
         AND lmd.IdMoeda = 110
         GROUP BY
         lhs.Numero_Processo,
         cli.Nome,
         cne.Nome,
         shp.Nome,
         vdd.Nome,
         ctp.Nome,
         ori.Nome,
         des.Nome,
         lmd.Total_Pagamento,
         lmd.Total_Pago,
         lmd.Total_Recebimento,
         lmd.Total_Recebido,
         lmd.Lucro_Estimado,
         lmd.Lucro_Efetivo`)
      return result;
   },
   
   totalInvoices: async function (data) {

      let whereFilter = '';

      if (data.day != null) {
         whereFilter = `AND ((Fnc.Situacao = 2 AND DATEPART(day, Fnc.Data_Pagamento) = DATEPART(day, GETDATE() -${data.day}) AND DATEPART(month, Fnc.Data_Pagamento) = DATEPART(month, GETDATE())) 
         OR (Fnc.Situacao != 2 AND DATEPART(day, Vlf.Data_Referencia) = DATEPART(day, GETDATE() -${data.day}) AND DATEPART(month, Vlf.Data_Referencia) = DATEPART(month, GETDATE())))`;
      }
      if (data.week != null) {
         whereFilter = `AND ((Fnc.Situacao = 2 AND DATEPART(week, Fnc.Data_Pagamento) = DATEPART(week, DATEADD(day, -${data.week}, GETDATE())))
         OR (Fnc.Situacao != 2 AND DATEPART(week, Vlf.Data_Referencia) = DATEPART(week, DATEADD(day, -${data.week}, GETDATE()))))`;
      }
      if (data.month != null) {
         whereFilter = `AND ((Fnc.Situacao = 2 AND DATEPART(month, Fnc.Data_Pagamento) = ${data.month})
         OR (Fnc.Situacao != 2 AND DATEPART(month, Vlf.Data_Referencia) = ${data.month}))`;
      }

      let result = await executeQuerySQL(`
         SELECT
            Lhs.Numero_Processo,
            Psa.Nome AS Pessoa,
            CASE Vlf.Natureza
               WHEN 1 THEN 'Recebimento'
               WHEN 0 THEN 'Pagamento'
            END AS Natureza,
            CASE lhs.Tipo_Carga
               WHEN 1 THEN 'Aéreo'
               WHEN 2 THEN 'Break Bulk'
               WHEN 3 THEN 'FCL'
               WHEN 4 THEN 'LCL'
               WHEN 5 THEN 'RO-RO'
               WHEN 6 THEN 'Rodoviário'
               END AS 'Modal',

            CASE Fnc.Situacao
               WHEN 1 THEN 'Em aberto'
               WHEN 2 THEN 'Quitada'
               WHEN 3 THEN 'Parcialmente quitada'
               WHEN 4 THEN 'Unificada'
               WHEN 5 THEN 'Em cobrança'
               WHEN 6 THEN 'Cancelada'
               WHEN 7 THEN 'Em cobrança judicial'
               WHEN 8 THEN 'Negativado'
               WHEN 9 THEN 'Protestado'
               WHEN 10 THEN 'Junk'
            END AS Situacao_Fatura,

            CASE
               WHEN Fnc.Situacao = 2 /*Quitada*/ THEN Fnc.Data_Pagamento
               ELSE Vlf.Data_Referencia
            END AS Data,

            CASE
               WHEN Fnc.Situacao = 2 /*Quitada*/ THEN 'BRL'
               ELSE Mda.Sigla
            END AS Moeda,

            Mda.IdMoeda,

            CASE
                WHEN Vlf.IdMoeda != 110 /*Real*/ THEN Fnc.Valor_Residual * Cmf.Fator
                ELSE Fnc.Valor_Residual
            END AS Valor_Total,

            CASE
               WHEN Fnc.Situacao = 2 /*Quitada*/ THEN Fnc.Total_Pago_Corrente
               ELSE Vlf.Valor_Total
            END AS Valor
         FROM
            mov_Logistica_House Lhs
         LEFT OUTER JOIN
            vis_Logistica_Fatura Vlf ON Vlf.IdLogistica_House = Lhs.IdLogistica_House
         LEFT OUTER JOIN
            mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Vlf.IdRegistro_Financeiro
         LEFT OUTER JOIN
            cad_Pessoa Psa ON Psa.IdPessoa = Vlf.IdPessoa
         LEFT OUTER JOIN
            cad_Moeda Mda ON Mda.IdMoeda = Vlf.IdMoeda
         LEFT OUTER JOIN(
               SELECT
                  Cmf.IdConversao_Moeda,
                  Cmf.Data,
                  Cmf.IdMoeda_Origem,
                  Cmf.Fator
               From
                  cad_Conversao_Moeda_Fator Cmf
               Where
                  Cmf.IdConversao_Moeda = 2 /*Abertura*/
               ) Cmf ON Cmf.IdMoeda_Origem = Vlf.IdMoeda AND CONVERT(VARCHAR, Cmf.Data, 103) = CONVERT(VARCHAR, Vlf.Data_Conversao, 103)
         WHERE
            DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2024
            ${whereFilter}
            AND Lhs.Numero_Processo NOT LIKE ('%test%')
            AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)`)
      return result;
   },

   tableOffers: async function (status) {
      let whereFilter = '';
      if (status == 'Aprovada'){
         whereFilter = `AND pft.Situacao = 2`
      } else {
         whereFilter = `AND pft.Situacao != 2
                        AND pft.Situacao != 3`
      }

      let result = await executeQuerySQL(`
         select 
         pft.Numero_Proposta as 'Referência',
         cli.Nome as 'Cliente',
         cne.Nome as 'Consignee',
         shp.Nome as 'Shipper',
         vdd.Nome as 'Vendedor',
         ctp.Nome as 'Armador',
         ori.Nome as 'Origem',
         des.Nome as 'Destino',
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
         end as 'Modal',
         case pft.Situacao
         when 1 then 'Aguardando Aprovação'
         when 2 then 'Aprovada'
         when 3 then 'Reprovada'
         when 4 then 'Não Enviada'
         when 5 then 'Pré Proposta'
         when 6 then 'Enviada'
         end as 'Situação',
         pft.Data_Proposta as 'Data',
         STRING_AGG(CONCAT(pfe.Quantidade, ' - ', eqp.Descricao), '/') AS 'Equipamentos',
         ofc.Lucro_Estimado,
         ofc.Total_Pagamento,
         ofc.Total_Recebimento
         from mov_Proposta_Frete pft
         left outer join mov_Oferta_Frete oft on oft.IdProposta_Frete = pft.IdProposta_Frete
         left outer join mov_Proposta_Frete_Carga pfc on pfc.IdProposta_Frete = pft.IdProposta_Frete
         left outer join mov_Proposta_Frete_Equipamento pfe on pfe.IdProposta_Frete_Carga = pfc.IdProposta_Frete_Carga
         left outer join mov_Oferta_Frete_Fechamento ofc on ofc.IdOferta_Frete = oft.IdOferta_Frete
         left outer join cad_Pessoa cli on cli.IdPessoa = pft.IdCliente
         left outer join cad_Pessoa cne on cne.IdPessoa = oft.IdImportador
         left outer join cad_Pessoa shp on shp.IdPessoa = oft.IdExportador
         left outer join cad_Pessoa vdd on vdd.IdPessoa = pft.IdVendedor
         left outer join cad_Pessoa ctp on ctp.IdPessoa = oft.IdCompanhia_Transporte
         left outer join cad_Origem_Destino ori on ori.IdOrigem_Destino = oft.IdOrigem
         left outer join cad_Origem_Destino des on des.IdOrigem_Destino = oft.IdDestino
         left outer join cad_Equipamento_Maritimo eqp on eqp.IdEquipamento_Maritimo = pfe.IdEquipamento_Maritimo
         WHERE DATEPART(year, pft.Data_Proposta) = 2024
         ${whereFilter}
         AND ofc.IdMoeda = 110
         group by
         pft.Numero_Proposta,
         cli.Nome,
         cne.Nome,
         shp.Nome,
         vdd.Nome,
         ctp.Nome,
         ori.Nome,
         des.Nome,
         ofc.Lucro_Estimado,
         ofc.Total_Pagamento,
         ofc.Total_Recebimento,
         oft.Tipo_Operacao,
         pfc.Tipo_Carga,
         pft.Data_Proposta,
         pft.Situacao`)
      return result;
   },

   tableProcesses: async function (status){
      let whereFilter = '';
      if (status == 'Auditado'){
         whereFilter = `AND lhs.Situacao_Agenciamento = 6`
      } else {
         whereFilter = `AND lhs.Situacao_Agenciamento != 6
                        AND lhs.Situacao_Agenciamento != 7`
      }

      let result = await executeQuerySQL(`
         SELECT
         lhs.Numero_Processo AS 'Referência',
         cli.Nome AS 'Cliente',
         cne.Nome AS 'Consignee',
         shp.Nome AS 'Shipper',
         vdd.Nome AS 'Vendedor',
         ctp.Nome AS 'Armador',
         ori.Nome AS 'Origem',
         des.Nome AS 'Destino',
         case lhs.Situacao_Agenciamento
         when 1 then 'Processo aberto'
         when 2 then 'Em andamento'
         when 3 then 'Liberado faturamento'
         when 4 then 'Faturado'
         when 5 then 'Finalizado'
         when 6 then 'Auditado'
         end as 'Situação',
         lhs.Data_Abertura_Processo as 'Data',
         STRING_AGG(CONCAT(lme.Quantidade, ' - ', eqp.Descricao), ' / ') AS 'Equipamentos',
         lmd.Total_Pagamento AS 'Total_Pagamento',
         lmd.Total_Pago AS 'Total_Pago',
         lmd.Total_Recebimento AS 'Total_Recebimento',
         lmd.Total_Recebido AS 'Total_Recebido',
         lmd.Lucro_Estimado AS 'Lucro_Estimado',
         lmd.Lucro_Efetivo AS 'Lucro_Efetivo'
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
         AND lhs.Numero_Processo not like '%DEMU%'
         GROUP BY
         lhs.Numero_Processo,
         cli.Nome,
         cne.Nome,
         shp.Nome,
         vdd.Nome,
         ctp.Nome,
         ori.Nome,
         des.Nome,
         lhs.Situacao_Agenciamento,
         lhs.Data_Abertura_Processo,
         lmd.Total_Pagamento,
         lmd.Total_Pago,
         lmd.Total_Recebimento,
         lmd.Total_Recebido,
         lmd.Lucro_Estimado,
         lmd.Lucro_Efetivo`)
         return result;
   }
}

module.exports = {
   executiveAnalytics,
};