const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const cashFlow = {
    // Lista todas as faturas
   totalOperation: async function () {
      let result = await executeQuerySQL(`
         SELECT
            Lhs.Data_Abertura_Processo AS Data,
            Lhs.Numero_Processo,
            Cli.Nome AS Cliente,

            CASE Lhs.Situacao_Agenciamento
               WHEN 1 THEN 'Processo Aberto'
               WHEN 2 THEN 'Em Andamento'
               WHEN 3 THEN 'Liberado Faturamento'
               WHEN 4 THEN 'Faturado'
               WHEN 5 THEN 'Finalizado'
               WHEN 6 THEN 'Auditado'
               WHEN 7 THEN 'Cancelado'
            End as Situacao_Agenciamento,

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
               END,'Outros'
            ) AS Modalidade_Processo,

            CASE Lhs.Tipo_Carga
               WHEN 0 THEN 'Não Especificado'
               WHEN 1 THEN 'Aéreo'
               WHEN 2 THEN 'Break-Bulk'
               WHEN 3 THEN 'Fcl'
               WHEN 4 THEN 'Lcl'
               WHEN 5 THEN 'Ro-Ro'
               WHEN 6 THEN 'Rodoviário'
            END AS Tipo_Carga,

            COALESCE(Lmo.Total_Recebimento, 0) AS Total_Recebimento_Estimado,
            COALESCE(Lmo.Total_Pagamento, 0) AS Total_Pagamento_Estimado,
            COALESCE(Lmo.Lucro_Estimado, 0) AS Lucro_Estimado
            
         FROM
            mov_Logistica_House Lhs
         LEFT OUTER JOIN
            mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
         LEFT OUTER JOIN
            mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House
         LEFT OUTER JOIN
            cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
         WHERE
            Lmo.IdMoeda = 110 -- BRL
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())
      `)
      return result;
   },
}

module.exports = {
   cashFlow,
}