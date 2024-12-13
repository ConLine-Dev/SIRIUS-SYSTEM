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
            Ltx.Tipo_Recebimento AS Tipo_Cobrança,
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
            Mda.IdMoeda,
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

   // Lista as taxas por processo
   createParteLote: async function (processData) {
      const processes = processData.processes;
  
      // Contagem de tipos
      const totalPesoCubado = processes.reduce((sum, process) => sum + parseFloat(process.totalPesoCubado || 0), 0);
      const totalPesoConsiderado = processes.reduce((sum, process) => sum + parseFloat(process.totalPesoConsiderado || 0), 0);
  
      try {
         // Insere os dados totalizador na tabela parte_lote
         const insertParteLote = await executeQuery(`
            INSERT INTO parte_lote (external_reference, total_process, total_containers, total_hbl, cubed_weight, gross_weight) 
            VALUES ('${processData.externalReference}', ${processData.totalProcesses}, ${processData.totalDistinctContainers}, ${processData.totalDistinctConhecimentos}, ${totalPesoCubado}, ${totalPesoConsiderado})
         `);

         // Mapa para associar processId ao ID da tabela parte_lote_processes
         const processIdToParteLoteProcessIdMap = {};

         // Insere os processos e mapeia os IDs
         for (let i = 0; i < processes.length; i++) {
            const process = processes[i];

            const insertParteLoteProcesses = await executeQuery(`
               INSERT INTO parte_lote_processes (parte_lote_id, process_id, process_number, total_hbl, total_containers, containers, hbls) 
               VALUES (${insertParteLote.insertId}, ${process.processId}, '${process.processNumber}', ${process.quantHbl}, ${process.quantContainers}, '${process.containerNumber}', '${process.hblNumber}')
            `);

            // Mapear o processId para o ID gerado
            processIdToParteLoteProcessIdMap[process.processId] = insertParteLoteProcesses.insertId;
         }

         // Insere as taxas no banco
         for (let i = 0; i < processes.length; i++) {
            const process = processes[i];
            const rates = process.rates;

            for (let j = 0; j < rates.length; j++) {
               const rate = rates[j];

               // Obtém o parte_lote_process_id correto do mapa
               const parteLoteProcessId = processIdToParteLoteProcessIdMap[rate.processId];

               // Faz o insert de cada taxa
               await executeQuery(`
                     INSERT INTO parte_lote_rates (
                        parte_lote_processes_id, process_id, process_number, coin_id, coin, type, register_financial_id, quantity, mov_rate_id, rate_id, rate, type_charge_id, type_charge, value
                     ) 
                     VALUES (
                        ${parteLoteProcessId}, ${rate.processId}, '${rate.processNumber}', ${rate.dataIdMoeda}, '${rate.dataMoeda}', '${rate.type}', 
                        ${rate.dataIdRegistroFinanceiro}, ${rate.dataQuant}, ${rate.movRateId}, 
                        ${rate.dataRateId}, '${rate.dataRate}', ${rate.dataTipoCobrancaId}, '${rate.dataTipoCobranca}', 
                        ${rate.value}
                     )
               `);
            }
         }

         return 'Inserido';
      } catch (error) {
         console.error('Erro ao inserir dados:', error);
         return error;
      }
   }
  
  
}

module.exports = {
   partLot,
}