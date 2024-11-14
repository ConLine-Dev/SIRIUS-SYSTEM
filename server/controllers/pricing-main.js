const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const pricingMain = {

    getOffers: async function() {
        const result = executeQuerySQL(`
            SELECT
                DATEPART(MONTH, prf.Data_Proposta) AS 'mes',
                SUM(CASE WHEN prf.Situacao = 2 THEN 1 ELSE 0 END) AS 'aprovadas',
                SUM(CASE WHEN prf.Situacao = 3 THEN 1 ELSE 0 END) AS 'reprovadas',
                SUM(CASE WHEN prf.Situacao NOT IN (2, 3) THEN 1 ELSE 0 END) AS 'pendentes',
                CASE pfc.Tipo_Carga 
                    WHEN 1 THEN 'AIR' 
                    WHEN 3 THEN 'FCL' 
                    WHEN 4 THEN 'LCL' 
                END AS 'tipo'
            FROM 
                mov_Proposta_Frete prf
            LEFT OUTER JOIN
                mov_Proposta_Frete_Carga pfc ON pfc.IdProposta_Frete = prf.IdProposta_Frete
            WHERE 
                DATEPART(YEAR, prf.Data_Proposta) = 2024
                AND pfc.Tipo_Carga IN (1, 3, 4)
            GROUP BY 
                DATEPART(MONTH, prf.Data_Proposta),
                pfc.Tipo_Carga
            ORDER BY 
                mes;`);

        return result;
    },

};

module.exports = {
    pricingMain,
};
