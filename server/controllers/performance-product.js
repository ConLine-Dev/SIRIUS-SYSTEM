const { executeQuerySQL } = require('../connect/sqlServer');

const PerformanceProducts = {
   // Lista todas as pessoas;
   listResults: async function(startDate, endDate, selectAgencySituation, selectModal, selectTypeLoad, courier){
      const couriers = courier === '(1,0)' ? 'AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/)' : courier === '(0,1)' ? 'AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/)' : courier === '(1,1)' ? '' : '';
      const filterDate = startDate && endDate ? `AND (Lhs.Data_Abertura_Processo BETWEEN '${startDate}' AND '${endDate}')` : '';

      let result = await executeQuerySQL(`
         SELECT
            FORMAT(Lhs.Data_Abertura_Processo, 'yyyy-MM-dd') AS Data_Abertura_Processo,
            Cia.Nome AS Cia_Transporte,
            Lhs.Numero_Processo,
            
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
            cad_Pessoa Cia ON Cia.IdPessoa = Lms.IdCompanhia_Transporte
         LEFT OUTER JOIN
            mov_Logistica_Maritima_House Lmh on Lmh.IdLogistica_House = Lhs.IdLogistica_House
         LEFT OUTER JOIN
            mov_Logistica_Moeda Lmd ON Lmd.IdLogistica_House = Lhs.IdLogistica_House
         WHERE
            Lhs.Numero_Processo NOT LIKE ('%DEMU%')
            AND Lhs.Numero_Processo NOT LIKE ('%test%')
            AND Lmd.IdMoeda = 110 /*BRL*/
            ${couriers}
            ${filterDate}
            `);
   
         // Retornar um objeto contendo os dois resultados
         return result
   },
}

module.exports = {
   PerformanceProducts,
};