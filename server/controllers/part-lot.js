const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const partLot = {
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
            Lhs.Peso_Considerado,
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

   // Lista as taxas por processo
   listRatesByProcess: async function (IdLogistica_House) {
      let result = await executeQuerySQL(`
         SELECT
            Ltx.IdLogistica_Taxa,
            Ltx.IdTaxa_Logistica_Exibicao,
            Tle.Nome AS Taxa,
            'Pagamento' AS Tipo,
            Ltx.IdLogistica_House,
            Ltx.IdRegistro_Pagamento,
            Ltx.Quantidade_Pagamento,
            Ltx.Valor_Pagamento_Unitario,
            Ltx.Valor_Pagamento_Total
         FROM
            mov_Logistica_Taxa Ltx
         LEFT OUTER JOIN
            cad_Taxa_Logistica_Exibicao Tle ON Tle.IdTaxa_Logistica_Exibicao = Ltx.IdTaxa_Logistica_Exibicao
         WHERE
            Ltx.IdLogistica_House = ${IdLogistica_House}
            AND Ltx.IdRegistro_Pagamento IS NOT NULL
         UNION ALL
         SELECT
            Ltx.IdLogistica_Taxa,
            Ltx.IdTaxa_Logistica_Exibicao,
            Tle.Nome AS Taxa,
            'Recebimento' AS Tipo,
            Ltx.IdLogistica_House,
            Ltx.IdRegistro_Recebimento,
            Ltx.Quantidade_Recebimento,
            Ltx.Valor_Recebimento_Unitario,
            Ltx.Valor_Recebimento_Total
         FROM
            mov_Logistica_Taxa Ltx
         LEFT OUTER JOIN
            cad_Taxa_Logistica_Exibicao Tle ON Tle.IdTaxa_Logistica_Exibicao = Ltx.IdTaxa_Logistica_Exibicao
         WHERE
            Ltx.IdLogistica_House = ${IdLogistica_House}
            AND Ltx.IdRegistro_Recebimento IS NOT NULL
      `)
      return result;
   },

   // Lista as taxas de todos os processos
   listAllRates: async function (IdLogistica_House) {      
      let result = await executeQuerySQL(`
         SELECT
            Ltx.IdLogistica_Taxa,
            Ltx.IdLogistica_House,
            Ltx.IdTaxa_Logistica_Exibicao,
            Ltx.IdRegistro_Recebimento AS IdRegistro_Financeiro,
            'Recebimento' AS Tipo,
            CASE Ltx.Tipo_Recebimento
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
            Mda.Sigla AS Moeda,
            Ltx.Quantidade_Recebimento AS Quantidade,
            Ltx.Valor_Recebimento_Unitario AS Valor_Unitario,
            Ltx.Valor_Recebimento_Total AS Valor_Total
         FROM
            mov_Logistica_Taxa Ltx
         LEFT OUTER JOIN
            cad_Taxa_Logistica_Exibicao Tle ON Tle.IdTaxa_Logistica_Exibicao = Ltx.IdTaxa_Logistica_Exibicao
         LEFT OUTER JOIN
            cad_Moeda Mda ON Mda.IdMoeda = Ltx.IdMoeda_Recebimento
         WHERE
            Ltx.IdLogistica_House IN (${IdLogistica_House.join(',')})
            AND Ltx.IdRegistro_Recebimento IS NOT NULL
         UNION ALL
         SELECT
            Ltx.IdLogistica_Taxa,
            Ltx.IdLogistica_House,
            Ltx.IdTaxa_Logistica_Exibicao,
            Ltx.IdRegistro_Pagamento AS IdRegistro_Financeiro,
            'Pagamento' AS Tipo,
            CASE Ltx.Tipo_Recebimento
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
            Mda.Sigla AS Moeda,
            Ltx.Quantidade_Pagamento AS Quantidade,
            Ltx.Valor_Pagamento_Unitario AS Valor_Unitario,
            Ltx.Valor_Pagamento_Total AS Valor_Total
         FROM
            mov_Logistica_Taxa Ltx
         LEFT OUTER JOIN
            cad_Taxa_Logistica_Exibicao Tle ON Tle.IdTaxa_Logistica_Exibicao = Ltx.IdTaxa_Logistica_Exibicao
         LEFT OUTER JOIN
            cad_Moeda Mda ON Mda.IdMoeda = Ltx.IdMoeda_Pagamento
         WHERE
            Ltx.IdLogistica_House IN (${IdLogistica_House.join(',')})
            AND Ltx.IdRegistro_Pagamento IS NOT NULL
      `)
      return result;
   },
}

module.exports = {
   partLot,
}