const { exec } = require('child_process');
const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const assertivity = {

    getOffers: async function () {

        const result = await executeQuerySQL(`
            SELECT
                DATEPART(month, pft.Data_Proposta) AS Mes,
                CASE
                    WHEN (oft.Tipo_Operacao = 2 AND oft.Modalidade_Processo = 1 AND oft.IdNivel_Servico_Aereo IS NOT NULL) THEN 'IA - Courier'
                    WHEN (oft.Tipo_Operacao = 2 AND oft.Modalidade_Processo = 1 AND oft.IdNivel_Servico_Aereo IS NULL) THEN 'IA - Normal'
                    WHEN (oft.Tipo_Operacao = 2 AND oft.Modalidade_Processo = 2 AND pfc.Tipo_Carga = 3) THEN 'IM - FCL'
                    WHEN (oft.Tipo_Operacao = 2 AND oft.Modalidade_Processo = 2 AND pfc.Tipo_Carga = 4) THEN 'IM - LCL'
                END AS Modal,
                CASE pft.Situacao
                    WHEN 2 THEN 'Aprovada'
                    ELSE 'Outro'
                END AS Situacao,
                COUNT(*) AS Total
            FROM mov_Proposta_Frete pft
            LEFT JOIN mov_Oferta_Frete oft 
                ON oft.IdProposta_Frete = pft.IdProposta_Frete
            LEFT JOIN mov_Proposta_Frete_Carga pfc 
                ON pfc.IdProposta_Frete = pft.IdProposta_Frete
            WHERE
                DATEPART(year, pft.Data_Proposta) = 2025
                AND oft.Modalidade_Processo IN (1, 2)
                AND oft.Tipo_Operacao IN (2)
                AND pfc.Tipo_Carga IN (1, 3, 4)
            GROUP BY
                DATEPART(month, pft.Data_Proposta),
                CASE
                    WHEN (oft.Tipo_Operacao = 2 AND oft.Modalidade_Processo = 1 AND oft.IdNivel_Servico_Aereo IS NOT NULL) THEN 'IA - Courier'
                    WHEN (oft.Tipo_Operacao = 2 AND oft.Modalidade_Processo = 1 AND oft.IdNivel_Servico_Aereo IS NULL) THEN 'IA - Normal'
                    WHEN (oft.Tipo_Operacao = 2 AND oft.Modalidade_Processo = 2 AND pfc.Tipo_Carga = 3) THEN 'IM - FCL'
                    WHEN (oft.Tipo_Operacao = 2 AND oft.Modalidade_Processo = 2 AND pfc.Tipo_Carga = 4) THEN 'IM - LCL'
                END,
                CASE pft.Situacao
                    WHEN 2 THEN 'Aprovada'
                    ELSE 'Outro'
                END
            ORDER BY Mes, Modal, Situacao;`);
        return result;
    },
};

module.exports = {
    assertivity,
};