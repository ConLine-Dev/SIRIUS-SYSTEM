const { executeQuerySQL } = require('../connect/sqlServer');

const partLotFinancial = {
   // Lista todas as faturas
   processByRef: async function (externalRef) {
      let result = await executeQuerySQL(`
         SELECT
            Lhs.IdLogistica_House,
            Lhs.Numero_Processo,
            Lmc.Containers,
            Lmc.Qtd_Containers,
            Lhs.Conhecimentos,
            Cem.Qtd_Conhecimentos,
            Lhs.Peso_Bruto,
            Lmc.Peso_Cubado
         FROM
            mov_Logistica_House Lhs
         LEFT OUTER JOIN (
            SELECT
               Lmc.IdLogistica_House,
               STRING_AGG(Lmc.Number, ', ') AS Containers,
               COUNT(Lmc.IdLogistica_Maritima_Container) AS Qtd_Containers,
               SUM(Lmc.Measurement) AS Peso_Cubado
            FROM
               mov_Logistica_Maritima_Container Lmc
            GROUP BY
               Lmc.IdLogistica_House
         ) Lmc ON Lmc.IdLogistica_House = Lhs.IdLogistica_House
         LEFT OUTER JOIN (
            SELECT
               Cem.IdLogistica_House,
               COUNT(Cem.IdConhecimento_Embarque) AS Qtd_Conhecimentos
            FROM
               mov_Conhecimento_Embarque Cem
            WHERE
               Cem.Tipo_Conhecimento = 1 /* House */
            GROUP BY
               Cem.IdLogistica_House
         ) Cem ON Cem.IdLogistica_House = Lhs.IdLogistica_House
         WHERE
            Lhs.Referencia_Externa like '%${externalRef}%'
      `)
      return result;
   },

   // Lista as taxas de todos os processos
   listAllPaymentRates: async function (IdLogistica_House) {      
      let result = await executeQuerySQL(`
         SELECT
            Ltx.IdLogistica_Taxa,
            Ltx.IdLogistica_House,
            Ltx.IdTaxa_Logistica_Exibicao,
            Ltx.IdRegistro_Pagamento AS IdRegistro_Financeiro,
            'Pagamento' AS Tipo,
            Ltx.Tipo_Pagamento AS Tipo_Cobrança,
            CASE Ltx.Tipo_Pagamento
               WHEN 1 THEN '(Sem cobrança)'
               WHEN 2 THEN 'Processo'
               WHEN 3 THEN 'Peso Cubado'
               WHEN 4 THEN 'Peso Taxado House'
               WHEN 5 THEN 'Peso Bruto'
               WHEN 6 THEN 'Metro Cúbico'
               WHEN 7 THEN 'Conhecimento'
               WHEN 8 THEN 'Invoice'
               WHEN 9 THEN 'Volume'
               WHEN 10 THEN 'Container'
               WHEN 11 THEN 'Tipo de Equipamento'
               WHEN 12 THEN 'TEU'
               WHEN 13 THEN 'Percentual'
               WHEN 14 THEN 'Livre'
               WHEN 15 THEN 'Via Master'
               WHEN 16 THEN 'Via House'
               WHEN 17 THEN 'Peso Considerado'
               WHEN 18 THEN 'Peso Taxado Master'
               WHEN 19 THEN 'Carreta'
               WHEN 20 THEN 'U.N. (Nações Unidas)'
               WHEN 21 THEN '% Sobre Importância Segurada'
               WHEN 22 THEN '% Sobre Valor Mercadoria'
            END AS Forma_Cobranca,
            Tle.Nome AS Taxa,
            Mda.IdMoeda,
            Mda.Sigla AS Moeda,
            Ltx.Quantidade_Pagamento AS Quantidade,
            
            Cast(Case
               When Ltx.IdMoeda_Pagamento = Mcr.IdMoeda Then 1
               When (Cmc.Fator_Conversao = 0) Or (Cmc.Fator_Conversao Is Null) Then 0
               When Cmc.IdMoeda_Origem = Ltx.IdMoeda_Pagamento And Cmc.IdMoeda_Destino = Mcr.IdMoeda Then Cmc.Fator_Conversao
               When Cmc.IdMoeda_Origem = Mcr.IdMoeda And Cmc.IdMoeda_Destino = Ltx.IdMoeda_Pagamento Then ROUND(1 / Cmc.Fator_Conversao, 6)
            End As Numeric(19, 6)) As Fator_Corrente,

            Ltx.Valor_Pagamento_Unitario AS Valor_Unitario,
            Ltx.Valor_Pagamento_Total AS Valor_Total

         FROM
            mov_Logistica_Taxa Ltx
         LEFT OUTER JOIN
            mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Ltx.IdLogistica_House
         LEFT OUTER JOIN
            mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
         LEFT OUTER JOIN
            cad_Taxa_Logistica_Exibicao Tle ON Tle.IdTaxa_Logistica_Exibicao = Ltx.IdTaxa_Logistica_Exibicao
         LEFT OUTER JOIN
            cad_Moeda Mda ON Mda.IdMoeda = Ltx.IdMoeda_Pagamento
         Left Outer Join
            cad_Moeda Mcr On Mcr.Moeda_Corrente = 1
         Left Outer Join
            cad_Moeda Mpr On Mpr.IdMoeda = Lms.IdMoeda_Processo
         Left Outer Join
            mov_Logistica_Fatura_Conversao Cmc On Cmc.IdLogistica_Fatura = Ltx.IdRegistro_Pagamento
            And ((Cmc.IdMoeda_Origem = Ltx.IdMoeda_Pagamento And Cmc.IdMoeda_Destino = Mcr.IdMoeda)
               Or (Cmc.IdMoeda_Origem = Mcr.IdMoeda And Cmc.IdMoeda_Destino = Ltx.IdMoeda_Pagamento))
         Left Outer Join
            mov_Logistica_Fatura_Conversao Cmp On Cmp.IdLogistica_Fatura = Ltx.IdRegistro_Pagamento
            And ((Cmp.IdMoeda_Origem = Ltx.IdMoeda_Pagamento And Cmp.IdMoeda_Destino = Lms.IdMoeda_Processo)
               Or (Cmp.IdMoeda_Origem = Lms.IdMoeda_Processo And Cmp.IdMoeda_Destino = Ltx.IdMoeda_Pagamento))
         WHERE
            Ltx.IdLogistica_House IN (${IdLogistica_House.join(',')})
            AND Ltx.IdRegistro_Pagamento IS NOT NULL
      `)
      return result;
   },
}

module.exports = {
   partLotFinancial,
}