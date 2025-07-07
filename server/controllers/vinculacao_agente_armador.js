require('dotenv/config');
const { executeQuery } = require('../connect/mysql');
console.log(process.env)
const { executeQuerySQL } = require('../connect/sqlServer');


async function getVinculacaoAgenteArmador(){
    const armador = await executeQuerySQL(`SELECT cp.Nome from cad_Companhia_Transporte as Cia
JOIN
    cad_Pessoa as cp ON Cia.IdPessoa = cp.IdPessoa
    WHERE cp.ativo = 1 AND cp.Nome != '[PRE-PROPOSTA]'
    GROUP BY cp.Nome`);

    const agente = await executeQuerySQL(`SELECT cp.Nome from cad_Agente_Carga as Cia
JOIN
    cad_Pessoa as cp ON Cia.IdPessoa = cp.IdPessoa
    WHERE cp.ativo = 1
    GROUP BY cp.Nome`);


    const result = [...armador, ...agente];

    for (const item of result) {
        await executeQuery(`INSERT INTO ft_agents (name) VALUES (?)`, [item.Nome]);
    }


}

getVinculacaoAgenteArmador();

