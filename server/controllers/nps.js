const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');


const nps = {
    dashboard: async function() {
        // Executa as queries em paralelo
        const [npsResult, resultHead] = await Promise.all([
            executeQuery(`SELECT * FROM nps;`),
            executeQuerySQL(`SELECT DISTINCT Cli.Nome AS CLIENTE, Cli.Cpf_Cnpj AS CNPJ, Fnc.Nome AS VENDEDOR 
                             FROM mov_Logistica_House Lhs
                             LEFT OUTER JOIN vis_Cliente Cli ON Cli.IdPessoa = Lhs.IdCliente
                             LEFT OUTER JOIN vis_Funcionario Fnc ON Fnc.IdPessoa = Lhs.IdVendedor
                             WHERE DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2024 
                             AND DATEPART(MONTH, Lhs.Data_Abertura_Processo) >= 1 
                             AND Lhs.Situacao_Agenciamento NOT IN (7)`)
        ]);
    
        // Mapeia os clientes para facilitar a busca
        const clientesSet = new Set(resultHead.map(el => el.CLIENTE));
    
        // Contabiliza clientes ativos
        const clientesAtivos = npsResult.reduce((count, elementNPS) => {
            return clientesSet.has(elementNPS.nomeempresa) ? count + 1 : count;
        }, 0);
    
        // Retorna os resultados
        return { npsResult, clientesAtivos };
    },
    answers: async function() {
        // Executa a query SQL com JOIN
        const query = `
            SELECT nps.*, 
                   collaborators.id AS idsirius,
                   CONCAT(collaborators.name, ' ', collaborators.family_name) AS name,
                   collaborators.email_business, 
                   collaborators.image
            FROM nps
            LEFT JOIN collaborators 
            ON nps.idvendedor = collaborators.id_headcargo;
        `;
    
        let npsResult = await executeQuery(query);
    
        // Usando for loop para melhor desempenho
        for (let i = 0; i < npsResult.length; i++) {
            if (!npsResult[i].idvendedor) {
                npsResult[i].idsirius = 213;
            }
        }
    
        return npsResult;
    },
    clients: async function() {
        // Executa as consultas em paralelo
        const [result, resultSirius] = await Promise.all([
            executeQuerySQL(`
                SELECT pessoa.Nome, 
                       CONCAT('https://sirius-system.conlinebr.com.br/app/system/nps/survey?id=', cliente.IdPessoa) AS Link, 
                       cliente.IdVendedor_Responsavel AS IdVendedor, 
                       pessoa.Cpf_Cnpj, 
                       CONCAT('https://cdn.conlinebr.com.br/colaboradores/', cliente.IdVendedor_Responsavel) AS ImgVendedor,
                       pss.Nome AS Vendedor 
                FROM cad_Cliente cliente
                JOIN cad_pessoa pessoa ON pessoa.IdPessoa = cliente.IdPessoa
                LEFT JOIN cad_pessoa pss ON pss.IdPessoa = cliente.IdVendedor_Responsavel
                WHERE cliente.cliente = 1 
                AND cliente.Tipo_Cliente = 2`),
            executeQuery(`
                SELECT id, 
                       CONCAT(collaborators.name, ' ', collaborators.family_name) AS name, 
                       email_business, 
                       image, 
                       id_headcargo 
                FROM collaborators`)
        ]);
    
        // Mapeia os colaboradores por id_headcargo para busca rápida (incluindo id e nome)
        const siriusMap = new Map(resultSirius.map(sirius => [sirius.id_headcargo, { id: sirius.id, name: sirius.name }]));
    
        // Atualiza os dados do result com os ids do Sirius e os nomes
        for (let i = 0; i < result.length; i++) {
            const headCargo = result[i];
            const siriusData = siriusMap.get(headCargo.IdVendedor);
    
            if (siriusData) {
                // Associa idSirius e nome do vendedor do Sirius
                headCargo.idSirius = siriusData.id;
                headCargo.nomeSirius = siriusData.name;
            } else {
                // Se não houver IdVendedor, atribui idSirius como 213 e nome como "Desconhecido"
                headCargo.idSirius = 213;
                headCargo.nomeSirius = "Desconhecido";
            }
        }
    
        return result;
    },
    registerAnswers: async function(answers){
        
        const idempresa = parseInt(answers.idempresa)
        const p1 = parseInt(answers.p1)
        const p2 = parseInt(answers.p2)
        const p3 = parseInt(answers.p3)
        const satisfaction = (answers.satisfaction)
        const feedback = answers.feedback


        const queryhead = `select pessoa.Nome, cliente.Idpessoa, pss.Nome as 'Vendedor', pss.IdPessoa from cad_Cliente cliente
        join cad_pessoa pessoa on pessoa.IdPessoa = cliente.IdPessoa
        join cad_pessoa pss on pss.IdPessoa = cliente.IdVendedor_Responsavel
        where cliente.IdPessoa = ${idempresa}`

        const resulthead = await executeQuerySQL(queryhead);
   
        if (resulthead.length > 0) {
            nameClient = resulthead[0].Nome;
            nameVendedor = resulthead[0].Vendedor;
            idVendedor = resulthead[0].IdPessoa;
        }
     
        let query = `INSERT INTO nps
        (idempresa, p1, p2, p3, satisfaction, feedback, nomeempresa, nomevendedor, idvendedor) VALUES
        (${idempresa}, 
            ${p1}, 
            ${p2}, 
            ${p3}, 
            '${satisfaction}', 
            "${feedback}", 
            "${nameClient}", 
            "${nameVendedor}", 
            "${idVendedor}")`

    
        let result = await executeQuery(query);

    
        return result
    }
    
    
}



module.exports = {
    nps,
};