const { executeQuerySQL } = require('../connect/sqlServer');

const incentiveManagement = {
    // Consulta banco de dados, taxas de Seguro
    getAllSecurity: async function(){
    const result = await executeQuerySQL(`WITH FaturasComTaxaSeguro AS (
        SELECT
           Ff.Data_Vencimento,
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
        JOIN
           mov_Fatura_Financeira Ff ON Ff.IdRegistro_Financeiro = Reg.IdRegistro_Financeiro
        WHERE
           Ltx.IdTaxa_Logistica_Exibicao IN (35 /*SEGURO DE CARGA*/, 740 /*SEGURO AVULSO*/)
     )
     SELECT
        Lhs.Numero_Processo,
        CONVERT(VARCHAR, CONVERT(DATE, Fts.Data_Vencimento), 103) AS Data_Vencimento,
        CAST(Lhs.Conhecimentos AS VARCHAR(MAX)) AS Conhecimentos,
        MAX(COALESCE(Fts.IdMoeda_Pagamento, NULL)) AS IdMoeda_Pagamento,
        MAX(COALESCE(Moe.Sigla, NULL)) AS Sigla,
        MAX(COALESCE(Fts.Valor_Pagamento_Total, NULL)) AS Valor_Pagamento_Total,
     
        CASE 
           WHEN COUNT(DISTINCT Fts.IdRegistro_Financeiro) > 1 THEN 'FATURA COM MAIS DE UMA TAXA'
           WHEN COUNT(DISTINCT Fts.IdRegistro_Financeiro) = 1 THEN 'FATURA OK'
           ELSE 'TAXA NÃO LOCALIZADA'
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
     WHERE YEAR(Lhs.Data_Abertura_Processo) >= 2024
     
     GROUP BY
        Lhs.Numero_Processo,
        Fts.Data_Vencimento,
        CAST(Lhs.Conhecimentos AS VARCHAR(MAX))`);


        return result
    },
    // Consulta banco de dados, taxas de Incentivo
    getAllComission: async function(){
        const result = await executeQuerySQL(`WITH FaturasComTaxaSeguro AS (
        SELECT
            Reg.Data_Referencia,
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
            CONVERT(VARCHAR, CONVERT(DATE, Fts.Data_Referencia), 103) AS Data_Referencia,
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
            Fts.Data_Referencia,
            Moe.Sigla,
            Fts.Valor_Recebimento_Total`);
    
    
            return result
    },
    // Consulta banco de dados, taxas de Agente
    getAllAgent: async function(){
        const result = await executeQuerySQL(`
        SELECT DISTINCT
            Lhs.Numero_Processo,
            TRIM(Lms.Numero_Conhecimento) AS MBL,
            TRIM(CAST(Lhs.Conhecimentos AS VARCHAR(MAX))) AS HBL,
            Vlf.IdRegistro_Financeiro,

            CASE 
                WHEN Vlf2.Qnt_Fatura > 1 THEN NULL
                ELSE Moe.Sigla
            END AS Moeda,

            CASE 
                WHEN Vlf2.Qnt_Fatura > 1 THEN NULL
                ELSE Vlf.Valor_Total
            END AS Valor_Total,

            CASE 
                WHEN Vlf2.Qnt_Fatura > 1 THEN 1
                ELSE 0
            END AS Status    
        FROM
            vis_Logistica_Fatura Vlf
        LEFT OUTER JOIN (
            SELECT 
                Vlf.IdLogistica_House,
                Vlf.IdRegistro_Financeiro,
                Pss.Nome AS Agente,
                COUNT(Vlf.IdRegistro_Financeiro) AS Qnt_Fatura,
                MAX(Vlf.Situacao) AS Situacao /* Assume que a tabela contém a coluna 'Situacao' */
            FROM
                vis_Logistica_Fatura Vlf
            LEFT OUTER JOIN
                cad_Pessoa Pss ON Pss.IdPessoa = Vlf.IdPessoa
            WHERE
                Vlf.IdTipo_Transacao = 3 /*ACERTO AGENTES*/
            GROUP BY
                Vlf.IdLogistica_House,
                Pss.Nome,
                Vlf.IdRegistro_Financeiro
        ) Vlf2 ON Vlf2.IdLogistica_House = Vlf.IdLogistica_House
        LEFT OUTER JOIN
            mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Vlf.IdLogistica_House
        LEFT OUTER JOIN
            mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
        LEFT OUTER JOIN
            cad_Moeda Moe ON Moe.IdMoeda = Vlf.IdMoeda
        WHERE
            Vlf.IdTipo_Transacao = 3 /*ACERTO AGENTES*/
            AND (Vlf.Situacao <> 2 AND Vlf.Situacao <> 4) /* Exclui 'Finalizado' e 'Parcialmente quitado' */
            AND (Vlf2.Qnt_Fatura > 1 OR Vlf.Situacao = 1) /* Considera apenas a situação em aberto se tiver um único agente */`);
    
    
            return result
    }

}



module.exports = {
    incentiveManagement,
};