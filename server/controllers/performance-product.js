const { executeQuerySQL } = require('../connect/sqlServer');

const currentYear = new Date().getFullYear();

const PerformanceProducts = {
   // Lista todos os processos e lucros;
   listResults: async function(startDate, endDate, selectAgencySituation, selectModal, selectTypeLoad, courier, selectClients){
      const couriers = courier === '(1,0)' ? 'AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/)' : courier === '(0,1)' ? 'AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/)' : courier === '(1,1)' ? '' : '';
      const filterDate = startDate && endDate ? `AND (Lhs.Data_Abertura_Processo BETWEEN '${startDate}' AND '${endDate}')` : `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = ${currentYear}`;
      const agencySituation = selectAgencySituation ? `AND Lhs.Situacao_Agenciamento IN ${selectAgencySituation}` : '';
      const typeLoad = selectTypeLoad ? `AND Lhs.Tipo_Carga IN ${selectTypeLoad}` : '';
      const modal = selectModal ? `AND Mdl.Modalidade IN ${selectModal}` : ''
      const clients = selectClients ? `AND Lhs.IdCliente IN ${selectClients}` : '';
      
      let result = await executeQuerySQL(`
         WITH modalidade AS (
            SELECT
               Lms.IdLogistica_Master,
               COALESCE(
                  CASE
                     WHEN Lms.Tipo_Operacao = 1
                     AND Lms.Modalidade_Processo = 1 THEN 'EA'
                     WHEN Lms.Tipo_Operacao = 2
                     AND Lms.Modalidade_Processo = 1 THEN 'IA'
                     WHEN Lms.Tipo_Operacao = 1
                     AND Lms.Modalidade_Processo = 2 THEN 'EM'
                     WHEN Lms.Tipo_Operacao = 2
                     AND Lms.Modalidade_Processo = 2 THEN 'IM'
                  END,'OUTROS'
               ) AS Modalidade
            FROM
               mov_Logistica_Master Lms
         )

         SELECT
            FORMAT(Lhs.Data_Abertura_Processo, 'yyyy-MM-dd') AS Data_Abertura_Processo,
            Cia.Nome AS Cia_Transporte,
            Lhs.Numero_Processo,

            Cli.Nome AS Cliente,
            
            COALESCE(
               CASE
                  WHEN Lms.Tipo_Operacao = 1
                  AND Lms.Modalidade_Processo = 1 THEN 'EA'
                  WHEN Lms.Tipo_Operacao = 2
                  AND Lms.Modalidade_Processo = 1 THEN 'IA'
                  WHEN Lms.Tipo_Operacao = 1
                  AND Lms.Modalidade_Processo = 2 THEN 'EM'
                  WHEN Lms.Tipo_Operacao = 2
                  AND Lms.Modalidade_Processo = 2 THEN 'IM'
               END,'OUTROS'
            ) AS Modalidade,

            CASE Lhs.Situacao_Agenciamento
               WHEN 1 THEN 'Em Aberto'
               WHEN 2 THEN 'Em Andamento'
               WHEN 3 THEN 'Liberado Faturamento'
               WHEN 4 THEN 'Faturado'
               WHEN 5 THEN 'Finalizado'
               WHEN 6 THEN 'Auditado'
               WHEN 7 THEN 'Cancelado'
            END AS Situacao_Agenciamento,

            CASE Lhs.Tipo_Carga
               WHEN 0 THEN 'Não Especificado'
               WHEN 1 THEN 'Aéreo'
               WHEN 2 THEN 'Break-Bulk'
               WHEN 3 THEN 'FCL'
               WHEN 4 THEN 'LCL'
               WHEN 5 THEN 'Ro-Ro'
               WHEN 6 THEN 'Rodoviário'
            END AS Tipo_Carga,

            Lmh.Total_Teus,

            COALESCE(CASE
               WHEN Lms.Modalidade_Processo = 1 AND Lms.Tipo_Operacao = 1 THEN CAST(Lhs.Peso_Bruto / 1000 AS FLOAT)
               WHEN Lms.Modalidade_Processo = 2 AND Lms.Tipo_Operacao = 1 AND Lhs.Tipo_Carga NOT IN (3) THEN CAST(Lhs.Peso_Bruto / 1000 AS FLOAT)
               WHEN Lms.Modalidade_Processo = 1 AND Lms.Tipo_Operacao = 2 THEN CAST(Lhs.Peso_Bruto / 1000 AS FLOAT)
               WHEN Lms.Modalidade_Processo = 2 AND Lms.Tipo_Operacao = 2 AND Lhs.Tipo_Carga NOT IN (3) THEN CAST(Lhs.Peso_Bruto / 1000 AS FLOAT)
               ELSE CAST(Lhs.Peso_Bruto / 1000 AS FLOAT)
            END,0) AS Tons,

            Lmd.Total_Pagamento,
            Lmd.Total_Recebimento,
            Lmd.Lucro_Estimado
         FROM
            mov_Logistica_House Lhs
         LEFT OUTER JOIN
            mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
         LEFT OUTER JOIN
            modalidade Mdl ON Mdl.IdLogistica_Master = Lms.IdLogistica_Master
         LEFT OUTER JOIN
            cad_Pessoa Cia ON Cia.IdPessoa = Lms.IdCompanhia_Transporte
         LEFT OUTER JOIN
            mov_Logistica_Maritima_House Lmh on Lmh.IdLogistica_House = Lhs.IdLogistica_House
         LEFT OUTER JOIN
            mov_Logistica_Moeda Lmd ON Lmd.IdLogistica_House = Lhs.IdLogistica_House
         LEFT OUTER JOIN
            cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
         WHERE
            Lhs.Numero_Processo NOT LIKE ('%DEMU%')
            AND Lhs.Numero_Processo NOT LIKE ('%test%')
            AND Lmd.IdMoeda = 110 /*BRL*/
            ${couriers}
            ${filterDate}
            ${agencySituation}
            ${typeLoad}
            ${modal}
            ${clients}
            `);
   
         // Retornar um objeto contendo os dois resultados
         return result
   },

   // Lista todos os processos e lucros;
   listClients: async function(){
      let result = await executeQuerySQL(`
         SELECT
            Psa.IdPessoa,
            Psa.Nome
         FROM
            cad_Cliente Cli
         JOIN
            cad_Pessoa Psa ON Psa.IdPessoa = Cli.IdPessoa
         WHERE
            Psa.Ativo = 1
            AND Psa.Nome NOT LIKE '%INATIVO%'
         ORDER BY
            Psa.Nome
      `);
   
      // Retornar um objeto contendo os dois resultados
      return result
   },
}

module.exports = {
   PerformanceProducts,
};