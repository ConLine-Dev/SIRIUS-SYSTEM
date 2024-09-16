const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const financialIndicators = {
    //Lista todas as faturas
   totalInvoices: async function (situacao) {

      let where = '';
      if(situacao){
         where = `AND Fnc.Situacao IN (${situacao})`
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
         WHERE
            DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2024
            AND Lhs.Numero_Processo NOT LIKE ('%test%')
            AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
         ${where}`)
      return result;
   },


   //Pega todas as despesas financeiras 
   getFinancialExpenses: async function(){
   const result = await executeQuerySQL(`
      select ffc.Data_Vencimento as 'Data_Vencimento', 
      case ffc.Situacao
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
         ffc.Historico_Resumo,
         pss.Nome as 'Pessoa',
         ttc.Nome as 'Tipo_Transacao',
         ffc.valor as 'valor'
      from mov_Fatura_Financeira ffc
      join mov_Registro_Financeiro rfc on rfc.IdRegistro_Financeiro = ffc.IdRegistro_Financeiro
      join cad_Pessoa pss on pss.IdPessoa = rfc.IdPessoa
      join cad_Tipo_Transacao ttc on ttc.IdTipo_Transacao = rfc.IdTipo_Transacao
         WHERE 
         ttc.Nome NOT LIKE 'DESPESA DO RH' AND
         ffc.Historico_Resumo NOT LIKE '%ENDOMARKETING%'`);
   
   // Mapear os resultados e formatar a data
   const resultadosFormatados = result.map(item => ({
         'Data_Vencimento': '<span style="display:none">'+new Date(item.Data_Vencimento).toISOString().split('T')[0]+'</span>'+new Date(item.Data_Vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
         'Situacao': item.Situacao,
         'Historico_Resumo': item.Historico_Resumo,
         'Pessoa': item.Pessoa,
         'Valor': (item.valor).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
         'Tipo_Transacao': item.Tipo_Transacao
   }));

   const format = {
         "data": resultadosFormatados
   }



   return format;
   },

   
   //Lista o valor total de cada situação de agenciamento
   financialSummary: async function () {
   const invoicing = await executeQuerySQL(`
      SELECT 
         SUM(Lmo.Lucro_Efetivo) AS Total_Lucro_Efetivo
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House 
      LEFT OUTER JOIN
         cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         WHERE
            Vlf.Situacao = 2
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_pag ON Vlf_pag.Idlogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_Abe ON Vlf_Abe.Idlogistica_House = Lhs.IdLogistica_House
      WHERE
         DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2024
      AND 
         Lhs.Situacao_Agenciamento NOT IN (7)
      AND
         Lhs.Numero_Processo NOT LIKE '%test%'
      AND
         Lhs.Numero_Processo NOT LIKE '%DEMU%'
      AND
         Lmo.IdMoeda = 110
      AND 
         Vlf_pag.Qnt_Fatura = Vlf_Abe.Qnt_Fatura;
      `)

   const billingReleased = await executeQuerySQL(`
      SELECT 
         SUM(Lmo.Lucro_Efetivo) AS Total_Lucro_Efetivo
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House 
      LEFT OUTER JOIN
         cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         WHERE
            Vlf.Situacao = 2
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_pag ON Vlf_pag.Idlogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_Abe ON Vlf_Abe.Idlogistica_House = Lhs.IdLogistica_House
      WHERE
         DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2024
      AND 
         Lhs.Situacao_Agenciamento NOT IN (7)
      AND
         Lhs.Numero_Processo NOT LIKE '%test%'
      AND
         Lhs.Numero_Processo NOT LIKE '%DEMU%'
      AND
         Lmo.IdMoeda = 110
      AND 
         Vlf_pag.Qnt_Fatura = Vlf_Abe.Qnt_Fatura;`)

   const invoiceLosers = await executeQuerySQL(`
      SELECT 
         SUM(Lmo.Lucro_Efetivo) AS Total_Lucro_Efetivo
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House 
      LEFT OUTER JOIN
         cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         WHERE
            Vlf.Situacao = 2
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_pag ON Vlf_pag.Idlogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_Abe ON Vlf_Abe.Idlogistica_House = Lhs.IdLogistica_House
      WHERE
         DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2024
      AND 
         Lhs.Situacao_Agenciamento NOT IN (7)
      AND
         Lhs.Numero_Processo NOT LIKE '%test%'
      AND
         Lhs.Numero_Processo NOT LIKE '%DEMU%'
      AND
         Lmo.IdMoeda = 110
      AND 
         Vlf_pag.Qnt_Fatura = Vlf_Abe.Qnt_Fatura;`)

   const totalPaid = await executeQuerySQL(`
      SELECT 
         SUM(Lmo.Lucro_Efetivo) AS Total_Lucro_Efetivo
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House 
      LEFT OUTER JOIN
         cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         WHERE
            Vlf.Situacao = 2
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_pag ON Vlf_pag.Idlogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_Abe ON Vlf_Abe.Idlogistica_House = Lhs.IdLogistica_House
      WHERE
         DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2024
      AND 
         Lhs.Situacao_Agenciamento NOT IN (7)
      AND
         Lhs.Numero_Processo NOT LIKE '%test%'
      AND
         Lhs.Numero_Processo NOT LIKE '%DEMU%'
      AND
         Lmo.IdMoeda = 110
      AND 
         Vlf_pag.Qnt_Fatura = Vlf_Abe.Qnt_Fatura;`)

   const totalReceived = await executeQuerySQL(`
      SELECT 
         SUM(Lmo.Lucro_Efetivo) AS Total_Lucro_Efetivo
      FROM
         mov_Logistica_House Lhs
      LEFT OUTER JOIN
         mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House 
      LEFT OUTER JOIN
         cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         WHERE
            Vlf.Situacao = 2
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_pag ON Vlf_pag.Idlogistica_House = Lhs.IdLogistica_House
      LEFT OUTER JOIN (
         SELECT
            Vlf.IdLogistica_House,
            COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura
         FROM
            vis_Logistica_Fatura Vlf
         GROUP BY
            Vlf.IdLogistica_House
      ) Vlf_Abe ON Vlf_Abe.Idlogistica_House = Lhs.IdLogistica_House
      WHERE
         DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2024
      AND 
         Lhs.Situacao_Agenciamento NOT IN (7)
      AND
         Lhs.Numero_Processo NOT LIKE '%test%'
      AND
         Lhs.Numero_Processo NOT LIKE '%DEMU%'
      AND
         Lmo.IdMoeda = 110
      AND 
         Vlf_pag.Qnt_Fatura = Vlf_Abe.Qnt_Fatura;`)

   const formatadoBRLInvoice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
   }).format(invoicing[0].Total_Lucro_Efetivo);

   const formatadoBRLbillingReleased = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
   }).format(billingReleased[0].Total_Lucro_Efetivo);

   const formatadoBRLinvoiceLosers = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
   }).format(invoiceLosers[0].Total_Lucro_Efetivo);

   const formatadoBRLtotalPaid = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
   }).format(totalPaid[0].Total_Lucro_Efetivo);

   const formatadoBRLtotalReceived = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
   }).format(totalReceived[0].Total_Lucro_Efetivo);

   

   return {
      invoicing:{
         value: formatadoBRLInvoice,
         percentage: '30%',
      },
      billingReleased: {
         value: formatadoBRLbillingReleased,
         percentage: '30%',
      },
      invoiceLosers: {
         value: formatadoBRLinvoiceLosers,
         percentage: '30%'
      },
      totalPaid: {
         value: formatadoBRLtotalPaid,
         percentage: '30%'
      },
      totalReceived: {
         value: formatadoBRLtotalReceived,
         percentage: '30%'
      },
   };
   },

   //Conversão da moeda
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

   //Valor total do card Faturado
   invoiced: async function () {
      const result = await executeQuerySQL(`
         -- FATURADO IMPORTACAO
         SELECT
            Lhs.Numero_Processo,
            Psa.Nome AS Pessoa,
            Vlf.Data_Referencia AS Data,
            FORMAT(Vlf.Data_Referencia, 'dd-MM-yyyy') AS Data_Convertido,
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
            AND Lgv.Data_Desembarque IS NOT NULL
            AND Lms.Tipo_Operacao = 2 /*Importacao*/

         UNION ALL

         -- FATURADO EXPORTACAO
         SELECT
            Lhs.Numero_Processo,
            Psa.Nome AS Pessoa,
            Vlf.Data_Referencia AS Data,
            FORMAT(Vlf.Data_Referencia, 'dd-MM-yyyy') AS Data_Convertido,
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
            AND Lgv.Data_Embarque IS NOT NULL
            AND Lms.Tipo_Operacao = 1 /*Exportacao*/`)
      return result;
   },

   //Valor total do card Lib.Faturamento
   billingReleased: async function () {
      const result = await executeQuerySQL(`
         -- LIBERADO FATURAMENTO EXPORTACAO
            SELECT
               Lhs.Numero_Processo,
               Psa.Nome AS Pessoa,
               Vlf.Data_Referencia AS Data,
               FORMAT(Vlf.Data_Referencia, 'dd-MM-yyyy') AS Data_Convertido,
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
               AND Lgv.Data_Embarque IS NOT NULL
               AND Lms.Tipo_Operacao = 1 /*Exportacao*/`)

      return result;
   },

   //Valor total do card Vencidos
   losers: async function () {
      const result = await executeQuerySQL(`
         -- VENCIDO
            SELECT
               Lhs.Numero_Processo,
               Psa.Nome AS Pessoa,
               Fnc.Data_Vencimento AS Data,
               FORMAT(Fnc.Data_Vencimento, 'dd-MM-yyyy') AS Data_Convertido,
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
               AND Fnc.Data_Vencimento < GETDATE()`)
               
      return result;
   },

   //Valor total do card Total recebidos
   totalReceived: async function () {
      const result = await executeQuerySQL(`
         -- RECEBIDO
            SELECT
               Lhs.Numero_Processo,
               Psa.Nome AS Pessoa,
               Fnc.Data_Pagamento AS Data,
               FORMAT(Fnc.Data_Pagamento, 'yyyy-MM-dd') AS Data_Convertido,
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
               `)
               
      return result;
   },

   //Valor total do card Total recebidos
   totalPaid: async function () {
      const result = await executeQuerySQL(`
         -- PAGAMENTO
            SELECT
               Lhs.Numero_Processo,
               Psa.Nome AS Pessoa,
               Fnc.Data_Pagamento AS Data,
               FORMAT(Fnc.Data_Pagamento, 'yyyy-MM-dd') AS Data_Convertido,
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
               Vlf.Natureza = 0 /*Pagamento*/
               AND Lhs.Numero_Processo NOT LIKE ('%test%')
               AND Lhs.Situacao_Agenciamento NOT IN (7/*Cancelado*/)
               AND Fnc.Situacao IN (2/*Quitada*/)
               AND DATEPART(YEAR, Fnc.Data_Pagamento) = DATEPART(YEAR, GETDATE())`)
               
      return result;
   },
   

   //Valor total do card Total ADM
   totalAdm: async function () {
      const result = await executeQuerySQL(`
         -- ADM
         SELECT
            '' AS Numero_Processo,
            Psa.Nome AS Pessoa,
            Fnc.Data_Pagamento AS Data,
            FORMAT(Fnc.Data_Pagamento, 'dd-MM-yyyy') AS Data_Convertido,
            Fic.Valor AS Valor_Total,
            'Adm' AS Tipo_Fatura
         FROM
            mov_Registro_Financeiro Rfn
         LEFT OUTER JOIN
            mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Rfn.IdRegistro_Financeiro
         LEFT OUTER JOIN
            mov_Fatura_Financeira_Categoria Fic on Fic.IdFatura_Financeira = Fnc.IdFatura_Financeira
         LEFT OUTER JOIN
            cad_Pessoa Psa ON Psa.IdPessoa = Rfn.IdPessoa
         WHERE
            Fnc.Natureza = 0 /*Pagamento*/
            AND Fic.IdCategoria_Financeira NOT IN (10, 72, 73, 102)
            AND Rfn.Referencia IS NULL
            AND Fnc.Situacao IN (2/*Quitada*/)
            AND DATEPART(YEAR, Fnc.Data_Pagamento) = DATEPART(YEAR, GETDATE())`)
               
      return result;
   },
}

module.exports = {
    financialIndicators,
}