const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const cashFlow = {
   // Lista todas as faturas
   totalOperation: async function (startDateGlobal, endDateGlobal) {
      const dateFilter = startDateGlobal && endDateGlobal ? `AND (Lhs.Data_Abertura_Processo BETWEEN '${startDateGlobal}' AND '${endDateGlobal}')` : `AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())`

      let result = await executeQuerySQL(`
         SELECT
            Lhs.Data_Abertura_Processo,
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
            ${dateFilter}
      `)
      return result;
   },

   // Lista todas as faturas
   totalAdm: async function (startDateGlobal, endDateGlobal, situacao) {
      const dateFilterAdm = startDateGlobal && endDateGlobal ? `AND (Fin.Data_Pagamento BETWEEN '${startDateGlobal}' AND '${endDateGlobal}')` : `AND DATEPART(YEAR, Fin.Data_Pagamento) = DATEPART(YEAR, GETDATE())`
      const situacaoHtml = situacao ? `AND Fin.Situacao IN (${situacao})` : `AND Fin.Situacao IN (1,2,3,4,5,6,7,8,9,10)`
      const dateFilterAdmSalary = startDateGlobal && endDateGlobal ? `AND (Mfn.Data_Compensacao BETWEEN '${startDateGlobal}' AND '${endDateGlobal}')` : `AND (Mfn.Data_Compensacao BETWEEN '2024-05-01' AND '2024-12-31')`
      let result = await executeQuerySQL(`
         SELECT
            Fin.Data,
            Pss.Nome as Cliente,

            case Fin.Situacao
               when 1 then 'Em aberto'
               when 2 then 'Quitada'
               when 3 then 'Parcialmente quitada'
               when 4 then 'Unificada'
               when 5 then 'Em cobrança'
               when 6 then 'Cancelada' 
               when 7 then 'Em combrança judicial'
               when 8 then 'Negativado'
               when 9 then 'Protestado'
               when 10 then 'Junk'
            end as Situacao_Fatura,

            Fin.Historico_Resumo as Historico_Resumo,
            Cat.IdCategoria_Financeira,
            Cat.Nome as Categoria,

            Ffc.Valor AS Total_Pagamento_Estimado

         FROM
            mov_Fatura_Financeira Fin 
         LEFT OUTER JOIN
            mov_Registro_Financeiro Reg ON Reg.IdRegistro_Financeiro = Fin.IdRegistro_Financeiro
         LEFT OUTER JOIN
            cad_Pessoa Pss ON Pss.IdPessoa = Reg.IdPessoa
         LEFT OUTER JOIN
            mov_Fatura_Financeira_Categoria Ffc ON Ffc.IdFatura_Financeira = Fin.IdFatura_Financeira
         LEFT OUTER JOIN
            cad_Categoria_Financeira Cat ON Cat.IdCategoria_Financeira = Ffc.IdCategoria_Financeira
         WHERE
            Cat.IdCategoria_Financeira IN (30, 112, 23, 105, 29, 98, 106, 12, 59, 115, 99, 114, 49, 50, 79, 53, 33, 76, 44, 123, 41, 31, 51, 87, 104, 38, 57, 25, 47, 48, 61, 13, 94)
         AND
            Fin.Natureza = 0
         ${dateFilterAdm}
         ${situacaoHtml}

         UNION ALL

         SELECT
            Mfn.Data_Compensacao AS Data,
            '' AS Cliente,

            'Quitada' AS Situacao_Fatura,
            Tfn.Numero AS Historico_Resumo,
            Cat.IdCategoria_Financeira,
            Cat.Nome as Categoria,

            Tfc.Valor_Destino AS Total_Pagamento_Estimado
         FROM
            mov_Transferencia_Financeira Tfn
         LEFT OUTER JOIN
            mov_Transferencia_Financeira_Categoria Tfc ON Tfc.IdTransferencia_Financeira = Tfn.IdTransferencia_Financeira
         LEFT OUTER JOIN
            cad_Categoria_Financeira Cat ON Cat.IdCategoria_Financeira = Tfc.IdCategoria_Financeira
         LEFT OUTER JOIN
            mov_Movimentacao_Financeira Mfn ON Mfn.IdMovimentacao_Financeira = Tfn.IdMovimentacao_Debito
         WHERE
            Tfn.IdConta_Origem = 10 -- Banco Bradesco
            AND Tfn.IdConta_Destino = 18 -- Banco Inter
            AND Tfc.IdCategoria_Financeira NOT IN (73 /*TRANSFERÊNCIA ENTRE CONTAS MESMA TITULARIDADE*/)
            ${dateFilterAdmSalary}
      `)
      return result;
   },

   // Lista as faturas de uma categoria em expecifico
   listInvoiceByCategorie: async function (startDateGlobal, endDateGlobal, situacao, idCategorie) {
      const dateFilterAdm = startDateGlobal && endDateGlobal ? `AND (Inv.Data BETWEEN '${startDateGlobal}' AND '${endDateGlobal}')` : `AND DATEPART(YEAR, Inv.Data) = DATEPART(YEAR, GETDATE())`
      const situacaoHtml = situacao ? `AND Inv.Situacao_Fatura_Num IN (${situacao})` : `AND Inv.Situacao_Fatura_Num IN (1,2,3,4,5,6,7,8,9,10)`
      let result = await executeQuerySQL(`
         WITH invoiceAdm AS (
            SELECT
            Fin.Data_Pagamento AS Data,
            Pss.Nome as Cliente,

            Fin.Situacao as Situacao_Fatura_Num,
            case Fin.Situacao
               when 1 then 'Em aberto'
               when 2 then 'Quitada'
               when 3 then 'Parcialmente quitada'
               when 4 then 'Unificada'
               when 5 then 'Em cobrança'
               when 6 then 'Cancelada' 
               when 7 then 'Em combrança judicial'
               when 8 then 'Negativado'
               when 9 then 'Protestado'
               when 10 then 'Junk'
            end as Situacao_Fatura, -- Mantém o rótulo para exibição

            Fin.Historico_Resumo as Historico_Resumo,
            Cat.IdCategoria_Financeira,
            Cat.Nome as Categoria,

            Ffc.Valor AS Total_Pagamento_Estimado

         FROM
            mov_Fatura_Financeira Fin 
         LEFT OUTER JOIN
            mov_Registro_Financeiro Reg ON Reg.IdRegistro_Financeiro = Fin.IdRegistro_Financeiro
         LEFT OUTER JOIN
            cad_Pessoa Pss ON Pss.IdPessoa = Reg.IdPessoa
         LEFT OUTER JOIN
            mov_Fatura_Financeira_Categoria Ffc ON Ffc.IdFatura_Financeira = Fin.IdFatura_Financeira
         LEFT OUTER JOIN
            cad_Categoria_Financeira Cat ON Cat.IdCategoria_Financeira = Ffc.IdCategoria_Financeira
         WHERE
            Cat.IdCategoria_Financeira IN (30, 112, 23, 105, 29, 98, 106, 12, 59, 115, 99, 114, 49, 50, 79, 53, 33, 76, 44, 123, 41, 31, 51, 87, 104, 38, 57, 25, 47, 48, 61, 13, 94)
         AND
            Fin.Natureza = 0

         UNION ALL

         SELECT
            Mfn.Data_Compensacao AS Data,
            '' AS Cliente,

            2 AS Situacao_Fatura_Num, -- Retorna o número para consistência
            'Quitada' AS Situacao_Fatura,
            Tfn.Numero AS Historico_Resumo,
            Cat.IdCategoria_Financeira,
            Cat.Nome as Categoria,

            Tfc.Valor_Destino AS Total_Pagamento_Estimado
         FROM
            mov_Transferencia_Financeira Tfn
         LEFT OUTER JOIN
            mov_Transferencia_Financeira_Categoria Tfc ON Tfc.IdTransferencia_Financeira = Tfn.IdTransferencia_Financeira
         LEFT OUTER JOIN
            cad_Categoria_Financeira Cat ON Cat.IdCategoria_Financeira = Tfc.IdCategoria_Financeira
         LEFT OUTER JOIN
            mov_Movimentacao_Financeira Mfn ON Mfn.IdMovimentacao_Financeira = Tfn.IdMovimentacao_Debito
         WHERE
            Tfn.IdConta_Origem = 10 -- Banco Bradesco
            AND Tfn.IdConta_Destino = 18 -- Banco Inter
            AND Cat.IdCategoria_Financeira NOT IN (73 /*TRANSFERÊNCIA ENTRE CONTAS MESMA TITULARIDADE*/)
         )
         SELECT
            *
         FROM
            invoiceAdm Inv
         WHERE
            Inv.IdCategoria_Financeira IN (${idCategorie})
            ${dateFilterAdm}
            ${situacaoHtml}
      `)
      return result;
   },
}

module.exports = {
   cashFlow,
}