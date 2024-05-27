const { executeQuerySQL } = require('../connect/sqlServer');


const Users = {
    getUsersByDep: async function(dept){
        // 62 VENDEDOR
        // 75 INSIDE SALES

        const users = await executeQuerySQL(`SELECT etm.IdFuncionario, cP.Nome FROM cad_Equipe_Tarefa_Membro etm
        join cad_Equipe_Tarefa Etaf ON Etaf.IdEquipe_Tarefa = etm.IdEquipe_Tarefa
        JOIN cad_Pessoa cP ON cP.IdPessoa = etm.IdFuncionario
        WHERE 
        etm.IdEquipe_Tarefa IN (${dept})
        AND 
        NOT etm.IdFuncionario IN (62194,62195)`)
        return users;
    }
}


module.exports = {
    Users,
};
