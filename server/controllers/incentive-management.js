const { executeQuerySQL } = require('../connect/sqlServer');

const incentiveManagement = {
    getAllSecurity: async function(){
    const result = await executeQuerySQL(`WITH FaturasComTaxaSeguro AS (
        SELECT
            Reg.IdRegistro_Financeiro,
            Ltx.IdMoeda_Pagamento,
            Ltx.Valor_Pagamento_Total
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
        Fts.IdMoeda_Pagamento,
        Fts.Valor_Pagamento_Total,
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
        mov_Logistica_Taxa Ltx ON Ltx.IdRegistro_Pagamento = Reg.IdRegistro_Financeiro
    JOIN
        FaturasComTaxaSeguro Fts ON Fts.IdRegistro_Financeiro = Reg.IdRegistro_Financeiro
    WHERE
        YEAR(Lhs.Data_Abertura_Processo) >= 2024
    GROUP BY
        Lhs.Numero_Processo,
        CAST(Lhs.Conhecimentos AS VARCHAR(MAX)),
        Fts.IdMoeda_Pagamento,
        Fts.Valor_Pagamento_Total`);


        return result
    }
}



module.exports = {
    incentiveManagement,
};