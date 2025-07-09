const { executeQuerySQL } = require('../connect/sqlServer'); // Importa a função para executar consultas SQL no SQL Server

const activeClientsMarketing = {
    // Esta função busca todos os clientes ativos para marketing
    getAll: async function() {
        try {
            const query = `
                SELECT DISTINCT
                    Pcc.Email AS Email,
                    Emp.Nome AS Empresa
                FROM
                    mov_Logistica_House Lhs
                LEFT OUTER JOIN
                    vis_Cliente Cli ON Cli.IdPessoa = Lhs.IdCliente
                LEFT OUTER JOIN
                    cad_Pessoa_Contato Pcc ON Pcc.IdPessoa = Cli.IdPessoa
                LEFT OUTER JOIN
                    cad_Pessoa_Contrato_Logistica Pcl ON Pcl.IdPessoa = Cli.IdPessoa
                LEFT OUTER JOIN
                    cad_Municipio Mun ON Mun.IdMunicipio = Cli.IdMunicipio
                LEFT OUTER JOIN
                    cad_Unidade_Federativa Unf ON Unf.IdUnidade_Federativa = Mun.IdUnidade_Federativa
                LEFT OUTER JOIN
                    cad_Pais Pai ON Pai.IdPais = Unf.IdPais
                LEFT OUTER JOIN
                    sys_Empresa_Sistema Emp ON Emp.IdEmpresa_Sistema = Pcl.IdEmpresa_Sistema
                WHERE
                    YEAR(Lhs.Data_Abertura_Processo) >= 2024
                AND Lhs.Situacao_Agenciamento NOT IN (7) /*CANCELADO*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
                AND Pcc.Nome IS NOT NULL
                AND Pcc.Nome NOT LIKE ''
                AND Pcc.Nome NOT LIKE '%INATIVO%'
                AND Pcc.Email IS NOT NULL
                AND Pcc.Email NOT LIKE ''
                AND Pcc.Email NOT LIKE '-'
                AND Pcc.Email NOT LIKE '%,%'
                AND Pcc.Email NOT LIKE '%;%'
                AND Pcc.Email NOT LIKE '%:%'
                AND Pcc.Email NOT LIKE '%>%'
                AND Pcc.Email NOT LIKE '%<%'
                AND Pcc.Email NOT LIKE '-%'
                AND Pcc.Email NOT LIKE '%-'
                AND Pcc.Email NOT LIKE '.%'
                AND Pcc.Email NOT LIKE '%.'
                AND Pcc.Email NOT LIKE '%@'
                AND Pcc.Email NOT LIKE '%$%'
                AND Pcc.Email NOT LIKE '%*%'
                AND Pcc.Email NOT LIKE '%(%'
                AND Pcc.Email NOT LIKE '%)%'
                AND Pcc.Email NOT LIKE '%[%'
                AND Pcc.Email NOT LIKE '%]%'
                AND Pcc.Email NOT LIKE '%{%'
                AND Pcc.Email NOT LIKE '%}%'
                AND Pcc.Email NOT LIKE '%+%'
                AND Pcc.Email NOT LIKE '%desativad%'
            `;
            
            const result = await executeQuerySQL(query);
            
            // Garantir que os dados estejam no formato correto para a exportação
            if (result && Array.isArray(result)) {
                return result.map(item => ({
                    Email: item.Email || '',
                    Empresa: item.Empresa || ''
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Erro ao buscar clientes ativos:', error);
            throw error;
        }
    }
};

module.exports = { activeClientsMarketing }; 