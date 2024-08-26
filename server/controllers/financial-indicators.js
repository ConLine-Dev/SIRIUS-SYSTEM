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
}

module.exports = {
    financialIndicators,
}