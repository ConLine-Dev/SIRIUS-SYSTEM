const { executeQuerySQL } = require('../connect/sqlServer');

const incentiveManagement = {
    getAllSecurity: async function(){
    const result = await executeQuerySQL(`
        WITH FaturasComTaxaSeguro AS (
            SELECT
               Reg.IdRegistro_Financeiro,
               Ltx.IdMoeda_Pagamento,
               Ltx.Valor_Pagamento_Total,
               Ltx.IdTaxa_Logistica_Exibicao,
         
               CASE 
                  WHEN Ltx.IdTaxa_Logistica_Exibicao IN (35, 740) THEN 1
                  ELSE 0
               END AS lancado
         
            FROM
               mov_Registro_Financeiro Reg 
            JOIN
               mov_Logistica_Taxa Ltx ON Ltx.IdRegistro_Pagamento = Reg.IdRegistro_Financeiro
            WHERE
               Ltx.IdTaxa_Logistica_Exibicao IN (35 /*SEGURO DE CARGA*/, 740 /*SEGURO AVULSO*/)
         )
         SELECT
            Lhs.Numero_Processo,
            CAST(Lhs.Conhecimentos AS VARCHAR(MAX)) AS Conhecimentos,
            COALESCE(Fts.IdMoeda_Pagamento, NULL) AS IdMoeda_Pagamento,
            COALESCE(Moe.Sigla, NULL) AS Sigla,
            COALESCE(Fts.Valor_Pagamento_Total, NULL) AS Valor_Pagamento_Total,
         
            CASE 
               WHEN COUNT(Fts.IdRegistro_Financeiro) > 1 THEN 'FATURA COM MAIS DE UMA TAXA'
               WHEN COUNT(Fts.IdRegistro_Financeiro) = 1 THEN 'FATURA OK'
               WHEN COUNT(Fts.IdRegistro_Financeiro) = 0 THEN 'TAXA NÃO LOCALIZADA'
            END AS Status_Fatura
         
         FROM
            mov_Registro_Financeiro Reg 
         JOIN
            mov_Logistica_Fatura Lft ON Lft.IdRegistro_Financeiro = Reg.IdRegistro_Financeiro
         JOIN
            mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lft.IdLogistica_House
         JOIN
            mov_Logistica_Taxa Ltx ON Ltx.IdRegistro_Pagamento = Reg.IdRegistro_Financeiro
         LEFT OUTER JOIN
            FaturasComTaxaSeguro Fts ON Fts.IdRegistro_Financeiro = Reg.IdRegistro_Financeiro
         LEFT OUTER JOIN
            cad_Moeda Moe ON Moe.IdMoeda = Fts.IdMoeda_Pagamento
         AND
            YEAR(Lhs.Data_Abertura_Processo) >= 2024
         GROUP BY
            Lhs.Numero_Processo,
            CAST(Lhs.Conhecimentos AS VARCHAR(MAX)),
            Fts.IdMoeda_Pagamento,
            Moe.Sigla,
            Fts.Valor_Pagamento_Total`);


        return result
    },
    getAllComission: async function(){
        const result = await executeQuerySQL(`WITH FaturasComTaxaSeguro AS (
            SELECT
                Reg.IdRegistro_Financeiro,
                Ltx.IdMoeda_Recebimento,
                Ltx.Valor_Recebimento_Total
            FROM
                mov_Registro_Financeiro Reg 
            JOIN
                mov_Logistica_Taxa Ltx ON Ltx.IdRegistro_Recebimento = Reg.IdRegistro_Financeiro
            WHERE
                Ltx.IdTaxa_Logistica_Exibicao IN (441 /*INCENTIVO TERMINAL*/, 245 /*INCENTIVO ASIA*/, 517 /*INCENTIVO ASIA MARITIMO*/)
        )
        SELECT
            Lhs.Numero_Processo,
            CAST(Lhs.Conhecimentos AS VARCHAR(MAX)) AS Conhecimentos,
            Fts.IdMoeda_Recebimento,
            Moe.Sigla,
            Fts.Valor_Recebimento_Total,
            
            CASE 
                WHEN COUNT(Ltx.IdLogistica_Taxa) > 1 THEN 'FATURA COM MAIS DE UMA TAXA'
                ELSE 'FATURA OK'
            END AS Status_Fatura
        
        FROM
            mov_Registro_Financeiro Reg 
        JOIN
            mov_Logistica_Fatura Lft ON Lft.IdRegistro_Financeiro = Reg.IdRegistro_Financeiro
        JOIN
            mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lft.IdLogistica_House
        JOIN
            mov_Logistica_Taxa Ltx ON Ltx.IdRegistro_Recebimento = Reg.IdRegistro_Financeiro
        JOIN
            FaturasComTaxaSeguro Fts ON Fts.IdRegistro_Financeiro = Reg.IdRegistro_Financeiro
        JOIN
            cad_Moeda Moe ON Moe.IdMoeda = Ltx.IdMoeda_Recebimento
        WHERE
            YEAR(Lhs.Data_Abertura_Processo) >= 2024
        GROUP BY
            Lhs.Numero_Processo,
            CAST(Lhs.Conhecimentos AS VARCHAR(MAX)),
            Fts.IdMoeda_Recebimento,
            Moe.Sigla,
            Fts.Valor_Recebimento_Total`);
    
    
            return result
        }

}



module.exports = {
    incentiveManagement,
};