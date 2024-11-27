const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');

const partLot = {
   // Lista todas as faturas
   processByRef: async function (externalRef) {
      let result = await executeQuerySQL(`
         SELECT
            Lhs.IdLogistica_House,
            Lhs.Numero_Processo,
            Lmc.Containers,
            Lmc.Qtd_Containers,
            Lhs.Conhecimentos,
            Cem.Qtd_Conhecimentos
         FROM
            mov_Logistica_House Lhs
         LEFT OUTER JOIN (
            SELECT
               Lmc.IdLogistica_House,
               STRING_AGG(Lmc.Number, ', ') AS Containers,
               COUNT(Lmc.IdLogistica_Maritima_Container) AS Qtd_Containers
            FROM
               mov_Logistica_Maritima_Container Lmc
            GROUP BY
               Lmc.IdLogistica_House
         ) Lmc ON Lmc.IdLogistica_House = Lhs.IdLogistica_House
         LEFT OUTER JOIN (
            SELECT
               Cem.IdLogistica_House,
               COUNT(Cem.IdConhecimento_Embarque) AS Qtd_Conhecimentos
            FROM
               mov_Conhecimento_Embarque Cem
            WHERE
               Cem.Tipo_Conhecimento = 1 /* House */
            GROUP BY
               Cem.IdLogistica_House
         ) Cem ON Cem.IdLogistica_House = Lhs.IdLogistica_House
         WHERE
            Lhs.Referencia_Externa like '%${externalRef}%'
      `)
      return result;
   },
}

module.exports = {
   partLot,
}