const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const financialIndicators = {
    // Lista todas as faturas
   totalInvoices: async function (startDateGlobal, endDateGlobal, situacao) {

      const dataAbertura = startDateGlobal && endDateGlobal ? `
      (
        (Fnc.Situacao = 2 AND Fnc.Data_Pagamento BETWEEN '${startDateGlobal}' AND '${endDateGlobal}')
        OR
        (Fnc.Situacao != 2 AND Vlf.Data_Referencia BETWEEN '${startDateGlobal}' AND '${endDateGlobal}')
      )` : `
      (
        (Fnc.Situacao = 2 AND DATEPART(YEAR, Fnc.Data_Pagamento) = DATEPART(YEAR, GETDATE())) 
        OR
        (Fnc.Situacao != 2 AND DATEPART(YEAR, Vlf.Data_Referencia) =  DATEPART(YEAR, GETDATE())) 
      )`

      const situacaoHtml = situacao ? `AND Fnc.Situacao IN (${situacao})` : `AND Fnc.Situacao IN (3)`

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

            CASE
               WHEN Fnc.Situacao = 2 /*Quitada*/ THEN COALESCE(Fnc.Total_Pago_Corrente, 0)
               ELSE COALESCE(Vlf.Valor_Total, 0)
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
         WHERE
         ${dataAbertura}
            AND Lhs.Numero_Processo NOT LIKE ('%test%')
            AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
         ${situacaoHtml}`)
      return result;
   },

   // Lista todas as despesas administrativas
   getFinancialExpenses: async function(startDateGlobal, endDateGlobal){
      const filterDate = startDateGlobal && endDateGlobal ? `and (Fin.Data_Vencimento between '${startDateGlobal}' and '${endDateGlobal}')` : `and DATEPART(YEAR, Fin.Data_Vencimento) = DATEPART(YEAR, GETDATE())`

   const result = await executeQuerySQL(`
      SELECT
         Fin.Data_Vencimento as Data_Vencimento,
         case Fin.Situacao
               when 1 then 'Em aberto'
               when 2 then 'Quitada'
               when 3 then 'Parcialmente quitada'
               when 4 then 'Unificada'
               when 5 then 'Em cobrança'
               when 7 then 'Em combrança judicial'
               when 8 then 'Negativado'
               when 9 then 'Protestado'
               when 10 then 'Junk'
               when 6 then 'Cancelada' 
               end as 'Situacao',
         Fin.Historico_Resumo as Historico_Resumo,
         Pss.Nome as Pessoa,
         Cat.IdCategoria_Financeira,
         Cat.Nome as Tipo_Fatura,
         COALESCE(Ffc.Valor, 0) as Valor
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
         ${filterDate}
      ORDER BY
         Cat.IdCategoria_Financeira ASC`);
   
   // Mapear os resultados e formatar a data
   const resultadosFormatados = result.map(item => ({
         'Data_Vencimento': '<span style="display:none">'+new Date(item.Data_Vencimento).toISOString().split('T')[0]+'</span>'+new Date(item.Data_Vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
         'Situacao': item.Situacao,
         'Historico_Resumo': item.Historico_Resumo,
         'Pessoa': item.Pessoa,
         'Tipo_Fatura': item.Tipo_Fatura,
         'Valor': (item.Valor).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
         
   }));

   const format = {
         "data": resultadosFormatados
   }

   return format;
   },

   // Conversão da moeda
   conversionRates: async function () {
        const result = await executeQuerySQL(`
           SELECT
           Cmf.IdMoeda_Origem,
           Cmf.Fator
       From
           cad_Conversao_Moeda_Fator Cmf
       Where
           Cmf.IdConversao_Moeda = 2
       and CONVERT(varchar, Cmf.Data, 103) = CONVERT(varchar, GETDATE(), 103)`)
        return result;
   },

   // Valor total dos cards de Indicadores Fin
   outstanding: async function (startDateGlobal, endDateGlobal) {
      const dataFaturado = startDateGlobal && endDateGlobal ? `AND (Vlf.Data_Referencia between '${startDateGlobal}' AND '${endDateGlobal}')` : `AND DATEPART(YEAR,Vlf.Data_Referencia) = DATEPART(YEAR, GETDATE())` 
      const dataLibImp = startDateGlobal && endDateGlobal ? `AND (Lgv.Data_Desembarque between '${startDateGlobal}' AND '${endDateGlobal}')` : `AND DATEPART(YEAR, Lgv.Data_Desembarque) = DATEPART(YEAR, GETDATE())`
      const dataLibExp = startDateGlobal && endDateGlobal ? `AND (Lms.Data_Embarque between '${startDateGlobal}' AND '${endDateGlobal}')` : `AND DATEPART(YEAR, Lms.Data_Embarque) = DATEPART(YEAR, GETDATE())`
      const dataPago = startDateGlobal && endDateGlobal ? `AND (Fnc.Data_Pagamento between '${startDateGlobal}' AND '${endDateGlobal}')` : `AND DATEPART(YEAR, Fnc.Data_Pagamento) = DATEPART(YEAR, GETDATE())`
      const DataVen = startDateGlobal && endDateGlobal ? `AND (Fnc.Data_Vencimento between '${startDateGlobal}' AND '${endDateGlobal}')` : `AND Fnc.Data_Vencimento < GETDATE()`
      const DataAdm = startDateGlobal && endDateGlobal ? `and (Fin.Data_Vencimento between '${startDateGlobal}' and '${endDateGlobal}')` : `and DATEPART(YEAR, Fin.Data_Vencimento) = DATEPART(YEAR, GETDATE())`

      const result = await executeQuerySQL(`
         -- FATURADO IMPORTACAO
      SELECT
         Lhs.Numero_Processo,
         Psa.Nome AS Pessoa,
         Vlf.Data_Referencia AS Data,
         CASE
            WHEN Vlf.IdMoeda != 110 /*Real*/ THEN Fnc.Valor_Residual * Cmf.Fator
            ELSE Fnc.Valor_Residual
         END AS Valor_Total,
         'Faturado' AS Tipo_Fatura
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
      -- Verifica se o processo já descarregou ou não
      LEFT OUTER JOIN (
         SELECT
            ROW_NUMBER() OVER(PARTITION BY Lgv.IdLogistica_House ORDER BY Lgv.Sequencia DESC) AS Indice,
            Lgv.IdLogistica_House,
            Lgv.Data_Previsao_Desembarque,
            Lgv.Data_Previsao_Embarque,
            Lgv.Data_Embarque,
            Lgv.Data_Desembarque
         FROM
            mov_Logistica_Viagem Lgv
      ) Lgv ON Lgv.IdLogistica_House = Lhs.IdLogistica_House AND Indice = 1 
      LEFT OUTER JOIN
         vis_Logistica_Fatura Vlf ON Vlf.IdLogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN
         mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Vlf.IdRegistro_Financeiro
      -- Pega o fator de conversao com o mesmo dia de conversao da fatura
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
      LEFT OUTER JOIN
         cad_Pessoa Psa ON Psa.IdPessoa = Vlf.IdPessoa
      WHERE
         Vlf.Natureza = 1 /*Recebimento*/
         AND Lhs.Numero_Processo NOT LIKE ('%test%')
         AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
         AND Fnc.Tipo = 2 /*Fatura Finalizada*/
         AND Fnc.Situacao NOT IN (2/*Quitada*/)
         AND Lms.Tipo_Operacao = 2 /*Importacao*/
         ${dataFaturado}

      UNION ALL

      -- FATURADO EXPORTACAO
      SELECT
         Lhs.Numero_Processo,
         Psa.Nome AS Pessoa,
         Vlf.Data_Referencia AS Data,
         CASE
            WHEN Vlf.IdMoeda != 110 /*Real*/ THEN Fnc.Valor_Residual * Cmf.Fator
            ELSE Fnc.Valor_Residual
         END AS Valor_Total,
         'Faturado' AS Tipo_Fatura
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
      LEFT OUTER JOIN
         vis_Logistica_Fatura Vlf ON Vlf.IdLogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN
         mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Vlf.IdRegistro_Financeiro
      -- Pega o fator de conversao com o mesmo dia de conversao da fatura
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
      LEFT OUTER JOIN
         cad_Pessoa Psa ON Psa.IdPessoa = Vlf.IdPessoa
      WHERE
         Vlf.Natureza = 1 /*Recebimento*/
         AND Lhs.Numero_Processo NOT LIKE ('%test%')
         AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
         AND Fnc.Tipo = 2 /*Fatura Finalizada*/
         AND Fnc.Situacao NOT IN (2/*Quitada*/)
         AND Lms.Tipo_Operacao = 1 /*Exportacao*/
         ${dataFaturado}

      UNION ALL

      -- LIBERADO FATURAMENTO IMPORTACAO
      SELECT
         Lhs.Numero_Processo,
         Psa.Nome AS Pessoa,
         Vlf.Data_Referencia AS Data,
         CASE
            WHEN Vlf.IdMoeda != 110 /*Real*/ THEN Fnc.Valor_Residual * Cmf.Fator
            ELSE Fnc.Valor_Residual
         END AS Valor_Total,
         'Lib.Faturamento' AS Tipo_Fatura
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
      -- Verifica se o processo já descarregou ou não
      LEFT OUTER JOIN (
         SELECT
            ROW_NUMBER() OVER(PARTITION BY Lgv.IdLogistica_House ORDER BY Lgv.Sequencia DESC) AS Indice,
            Lgv.IdLogistica_House,
            Lgv.Data_Previsao_Desembarque,
            Lgv.Data_Previsao_Embarque,
            Lgv.Data_Embarque,
            Lgv.Data_Desembarque
         FROM
            mov_Logistica_Viagem Lgv
      ) Lgv ON Lgv.IdLogistica_House = Lhs.IdLogistica_House AND Indice = 1 
      LEFT OUTER JOIN
         vis_Logistica_Fatura Vlf ON Vlf.IdLogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN
         mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Vlf.IdRegistro_Financeiro
      -- Pega o fator de conversao com o mesmo dia de conversao da fatura
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
      LEFT OUTER JOIN
         cad_Pessoa Psa ON Psa.IdPessoa = Vlf.IdPessoa
      WHERE
         Vlf.Natureza = 1 /*Recebimento*/
         AND Lhs.Numero_Processo NOT LIKE ('%test%')
         AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
         AND Fnc.Tipo = 1 /*Fatura Em Aberto*/
         AND Fnc.Situacao NOT IN (2/*Quitada*/)
         AND Lms.Tipo_Operacao = 2 /*Importacao*/
         ${dataLibImp}

      UNION ALL

      -- LIBERADO FATURAMENTO EXPORTACAO
      SELECT
         Lhs.Numero_Processo,
         Psa.Nome AS Pessoa,
         Vlf.Data_Referencia AS Data,
         CASE
            WHEN Vlf.IdMoeda != 110 /*Real*/ THEN Fnc.Valor_Residual * Cmf.Fator
            ELSE Fnc.Valor_Residual
         END AS Valor_Total,
         'Lib.Faturamento' AS Tipo_Fatura
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
      LEFT OUTER JOIN
         vis_Logistica_Fatura Vlf ON Vlf.IdLogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN
         mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Vlf.IdRegistro_Financeiro
      -- Pega o fator de conversao com o mesmo dia de conversao da fatura
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
      LEFT OUTER JOIN
         cad_Pessoa Psa ON Psa.IdPessoa = Vlf.IdPessoa
      WHERE
         Vlf.Natureza = 1 /*Recebimento*/
         AND Lhs.Numero_Processo NOT LIKE ('%test%')
         AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
         AND Fnc.Tipo = 1 /*Fatura Em Aberto*/
         AND Fnc.Situacao NOT IN (2/*Quitada*/)
         AND Lms.Data_Embarque IS NOT NULL
         AND Lms.Tipo_Operacao = 1 /*Exportacao*/
         ${dataLibExp}

      UNION ALL

      -- RECEBIDO
      SELECT
         Lhs.Numero_Processo,
         Psa.Nome AS Pessoa,
         Fnc.Data_Pagamento AS Data,
         Fnc.Total_Pago_Corrente AS Valor_Total,
         'Recebido' AS Tipo_Fatura
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         vis_Logistica_Fatura Vlf ON Vlf.IdLogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN
         mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Vlf.IdRegistro_Financeiro
      LEFT OUTER JOIN
         cad_Pessoa Psa ON Psa.IdPessoa = Vlf.IdPessoa
      WHERE
         Vlf.Natureza = 1 /*Recebimento*/
         AND Lhs.Numero_Processo NOT LIKE ('%test%')
         AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
         AND Fnc.Situacao IN (2/*Quitada*/)
         ${dataPago}

      UNION ALL

      -- PAGO
      SELECT
         Lhs.Numero_Processo,
         Psa.Nome AS Pessoa,
         Fnc.Data_Pagamento AS Data,
         Fnc.Total_Pago_Corrente AS Valor_Total,
         'Pago' AS Tipo_Fatura
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         vis_Logistica_Fatura Vlf ON Vlf.IdLogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN
         mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Vlf.IdRegistro_Financeiro
      LEFT OUTER JOIN
         cad_Pessoa Psa ON Psa.IdPessoa = Vlf.IdPessoa
      WHERE
         Vlf.Natureza = 0 /*Pago*/
         AND Lhs.Numero_Processo NOT LIKE ('%test%')
         AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
         AND Fnc.Situacao IN (2/*Quitada*/)
         ${dataPago}

      UNION ALL

      -- VENCIDO
      SELECT
         Lhs.Numero_Processo,
         Psa.Nome AS Pessoa,
         Fnc.Data_Vencimento AS Data,
         CASE
            WHEN Vlf.IdMoeda != 110 /*Real*/ THEN Fnc.Valor_Residual * Cmf.Fator
            ELSE Fnc.Valor_Residual
         END AS Valor_Total,
         'Vencido' AS Tipo_Fatura
      FROM
         mov_Logistica_House Lhs
      -- Verifica se o processo já descarregou ou não
      LEFT OUTER JOIN (
         SELECT
            ROW_NUMBER() OVER(PARTITION BY Lgv.IdLogistica_House ORDER BY Lgv.Sequencia DESC) AS Indice,
            Lgv.IdLogistica_House,
            Lgv.Data_Previsao_Desembarque,
            Lgv.Data_Previsao_Embarque,
            Lgv.Data_Embarque,
            Lgv.Data_Desembarque
         FROM
            mov_Logistica_Viagem Lgv
      ) Lgv ON Lgv.IdLogistica_House = Lhs.IdLogistica_House AND Indice = 1 
      LEFT OUTER JOIN
         vis_Logistica_Fatura Vlf ON Vlf.IdLogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN
         mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Vlf.IdRegistro_Financeiro
      -- Pega o fator de conversao com o mesmo dia de conversao da fatura
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
      LEFT OUTER JOIN
         cad_Pessoa Psa ON Psa.IdPessoa = Vlf.IdPessoa
      WHERE
         Vlf.Natureza = 1 /*Recebimento*/
         AND Lhs.Numero_Processo NOT LIKE ('%test%')
         AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
         AND Fnc.Tipo = 2 /*Fatura Finalizada*/
         AND Fnc.Situacao NOT IN (2/*Quitada*/)
         ${DataVen}
         
         UNION ALL
         
         SELECT
            '' AS Numero_Processo,
            Pss.Nome as Pessoa,
            Fin.Data_Vencimento as Data,
            Ffc.Valor as Valor_Total,
            'Adm' AS Tipo_Fatura

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
         ${DataAdm}
         AND
            Fin.Natureza = 0 -- Pagamento`)
      return result;
   },
}

module.exports = {
    financialIndicators,
}