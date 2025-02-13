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
            LEFT OUTER JOIN
                mov_Oferta_Frete oft ON oft.IdProposta_Frete = prf.IdProposta_Frete
            WHERE 
                DATEPART(YEAR, prf.Data_Proposta) = 2025
                AND pfc.Tipo_Carga IN (1, 3, 4)
                AND oft.Tipo_Operacao = 2
            GROUP BY 
                DATEPART(MONTH, prf.Data_Proposta),
                pfc.Tipo_Carga
            ORDER BY 
                mes;`);

        return result;
    },
    commentsByModule: async function (moduleId) {

        let result = await executeQuery(`
           SELECT ic.title, ic.description, ic.comment_date,
           cl.id_headcargo, cl.name, cl.family_name, md.title as 'module'
           FROM internal_comments ic
           LEFT OUTER JOIN collaborators cl on cl.id = ic.collab_id
           LEFT OUTER JOIN modules md on md.id = ic.module_id
           WHERE module_id = ${moduleId}
           ORDER BY ic.comment_date DESC`)

        return result;
     },

};

module.exports = {
    pricingMain,
};
