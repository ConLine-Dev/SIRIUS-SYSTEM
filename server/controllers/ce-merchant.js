const { executeQuerySQL } = require('../connect/sqlServer'); // Importa a função para executar consultas SQL

const ceMerchant = {
    // Esta função busca todos os registros de CE-Mercante
    getAll: async function() {
        const query = `WITH ProcessData AS (
                SELECT
                Lmm.Data_Desconsolidacao_Mercante,
                    Lhs.Numero_Processo,
                    Lhs.Data_Abertura_Processo,
                    CASE
                        WHEN Ccl.Descricao LIKE 'Setor Divergência%' THEN 'Divergência'
                        WHEN Ccl.Descricao LIKE 'Setor Retificação%' THEN 'Retificação'
                        WHEN Ccl.Descricao NOT LIKE 'Setor%' THEN Ccl.Descricao
                    END AS Tipo,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (246, 253) THEN 
                            CASE 
                                WHEN Clv.Valor_Tipo_Fixo = 1 THEN 'Cliente'
                                WHEN Clv.Valor_Tipo_Fixo = 2 THEN 'Armador/Co-loader'
                                WHEN Clv.Valor_Tipo_Fixo = 3 THEN 'Operacional'
                                ELSE NULL
                            END
                    END AS Setor,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (244, 245) THEN CAST(Clv.Valor_Texto AS VARCHAR(255))
                        ELSE NULL
                    END AS Descricao,
                    Lmm.Data_CE,
                    Psa.Nome AS Responsavel,
                    Ccl.Descricao AS OriginalDesc
                FROM
                    mov_Campo_Livre Clv
                LEFT OUTER JOIN
                    mov_Logistica_Campo_Livre Lcl ON Lcl.IdCampo_Livre = Clv.IdCampo_Livre
                LEFT OUTER JOIN
                    cad_Configuracao_Campo_Livre Ccl ON Ccl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lcl.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_Master Lmm ON Lmm.IdLogistica_Master = Lms.IdLogistica_Master
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                LEFT OUTER JOIN
                    cad_Pessoa Psa ON Psa.IdPessoa = Par.IdResponsavel
                WHERE
                    Ccl.IdGrupo_Campo_Livre = 35 /*CE MERCANTE*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
                AND Par.IdPapel_Projeto = 2 /* OPERACIONAL */
            ),
            ProcessedData AS (
                SELECT 
                    p1.Numero_Processo,
                    p1.Data_Abertura_Processo,
                    p1.Tipo,
                    COALESCE(
                        CASE 
                            WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 
                                COALESCE(
                                    (SELECT TOP 1 p2.Setor FROM ProcessData p2 
                                    WHERE p2.Numero_Processo = p1.Numero_Processo 
                                    AND (p2.OriginalDesc LIKE 'Setor ' + p1.Tipo + '%')
                                    AND p2.Setor IS NOT NULL),
                                    (SELECT TOP 1 p3.Setor FROM ProcessData p3 
                                    WHERE p3.Numero_Processo = p1.Numero_Processo 
                                    AND p3.Setor IS NOT NULL)
                                )
                            ELSE NULL
                        END,
                        p1.Setor
                    ) AS Setor,
                    p1.Descricao,
                    p1.Data_Desconsolidacao_Mercante,
                    p1.Data_CE,
                    p1.Responsavel,
                    p1.OriginalDesc,
                    ROW_NUMBER() OVER (PARTITION BY p1.Numero_Processo, p1.Tipo ORDER BY 
                        CASE WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 0 ELSE 1 END,
                        CASE WHEN p1.OriginalDesc LIKE 'Setor%' THEN 0 ELSE 1 END
                    ) AS RowNum
                FROM 
                    ProcessData p1
            )
            SELECT 
                Numero_Processo,
                FORMAT(Data_Desconsolidacao_Mercante, 'dd/MM/yyyy') AS Data_Desconsolidacao_Mercante,
                FORMAT(Data_Abertura_Processo, 'dd/MM/yyyy') AS Data_Abertura_Processo,
                Tipo,
                Setor,
                Descricao,
                Responsavel
            FROM 
                ProcessedData
            WHERE 
                RowNum = 1
                AND Descricao IS NOT NULL 
                AND Descricao <> ''
            ORDER BY
                Numero_Processo, Tipo
        `;

        const result = await executeQuerySQL(query);

        // Formatar os dados para exibição na tabela
        const formattedData = result.map(item => {
            const buttons = `
                <div class="hstack gap-2 fs-15">
                    <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-info-light view-process" data-processo="${item.Numero_Processo}" title="Visualizar">
                        <i class="ri-eye-line"></i>
                    </a>
                </div>
            `;

            return {
                ...item,
                action: buttons
            };
        });

        return formattedData;
    },

    // Esta função busca dados para os indicadores
    getIndicators: async function() {
        // Consulta para obter contagem por tipo (Divergência/Retificação)
        const typeCountQuery = `
            WITH ProcessData AS (
                SELECT
                    Lhs.Numero_Processo,
                    CASE
                        WHEN Ccl.Descricao LIKE 'Setor Divergência%' THEN 'Divergência'
                        WHEN Ccl.Descricao LIKE 'Setor Retificação%' THEN 'Retificação'
                        WHEN Ccl.Descricao NOT LIKE 'Setor%' THEN Ccl.Descricao
                    END AS Tipo,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (244, 245) THEN CAST(Clv.Valor_Texto AS VARCHAR(255))
                        ELSE NULL
                    END AS Descricao
                FROM
                    mov_Campo_Livre Clv
                LEFT OUTER JOIN
                    mov_Logistica_Campo_Livre Lcl ON Lcl.IdCampo_Livre = Clv.IdCampo_Livre
                LEFT OUTER JOIN
                    cad_Configuracao_Campo_Livre Ccl ON Ccl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lcl.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                WHERE
                    Ccl.IdGrupo_Campo_Livre = 35 /*CE MERCANTE*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
                AND Par.IdPapel_Projeto = 2 /* OPERACIONAL */
            ),
            ProcessedData AS (
                SELECT 
                    p1.Numero_Processo,
                    p1.Tipo,
                    p1.Descricao,
                    ROW_NUMBER() OVER (PARTITION BY p1.Numero_Processo, p1.Tipo ORDER BY 
                        CASE WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 0 ELSE 1 END
                    ) AS RowNum
                FROM 
                    ProcessData p1
            )
            SELECT
                Tipo,
                COUNT(*) AS Total
            FROM 
                ProcessedData
            WHERE 
                RowNum = 1
                AND Descricao IS NOT NULL 
                AND Descricao <> ''
            GROUP BY
                Tipo
            ORDER BY
                Tipo
        `;

        // Consulta para obter contagem por setor
        const sectorCountQuery = `
            WITH ProcessData AS (
                SELECT
                    Lhs.Numero_Processo,
                    CASE
                        WHEN Ccl.Descricao LIKE 'Setor Divergência%' THEN 'Divergência'
                        WHEN Ccl.Descricao LIKE 'Setor Retificação%' THEN 'Retificação'
                        WHEN Ccl.Descricao NOT LIKE 'Setor%' THEN Ccl.Descricao
                    END AS Tipo,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (246, 253) THEN 
                            CASE 
                                WHEN Clv.Valor_Tipo_Fixo = 1 THEN 'Cliente'
                                WHEN Clv.Valor_Tipo_Fixo = 2 THEN 'Armador/Co-loader'
                                WHEN Clv.Valor_Tipo_Fixo = 3 THEN 'Operacional'
                                ELSE NULL
                            END
                    END AS Setor,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (244, 245) THEN CAST(Clv.Valor_Texto AS VARCHAR(255))
                        ELSE NULL
                    END AS Descricao,
                    Ccl.Descricao AS OriginalDesc
                FROM
                    mov_Campo_Livre Clv
                LEFT OUTER JOIN
                    mov_Logistica_Campo_Livre Lcl ON Lcl.IdCampo_Livre = Clv.IdCampo_Livre
                LEFT OUTER JOIN
                    cad_Configuracao_Campo_Livre Ccl ON Ccl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lcl.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                WHERE
                    Ccl.IdGrupo_Campo_Livre = 35 /*CE MERCANTE*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
                AND Par.IdPapel_Projeto = 2 /* OPERACIONAL */
            ),
            ProcessedData AS (
                SELECT 
                    p1.Numero_Processo,
                    p1.Tipo,
                    COALESCE(
                        CASE 
                            WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 
                                COALESCE(
                                    (SELECT TOP 1 p2.Setor FROM ProcessData p2 
                                    WHERE p2.Numero_Processo = p1.Numero_Processo 
                                    AND (p2.OriginalDesc LIKE 'Setor ' + p1.Tipo + '%')
                                    AND p2.Setor IS NOT NULL),
                                    (SELECT TOP 1 p3.Setor FROM ProcessData p3 
                                    WHERE p3.Numero_Processo = p1.Numero_Processo 
                                    AND p3.Setor IS NOT NULL)
                                )
                            ELSE NULL
                        END,
                        p1.Setor
                    ) AS Setor,
                    p1.Descricao,
                    ROW_NUMBER() OVER (PARTITION BY p1.Numero_Processo, p1.Tipo ORDER BY 
                        CASE WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 0 ELSE 1 END,
                        CASE WHEN p1.OriginalDesc LIKE 'Setor%' THEN 0 ELSE 1 END
                    ) AS RowNum
                FROM 
                    ProcessData p1
            )
            SELECT
                Setor,
                COUNT(*) AS Total
            FROM 
                ProcessedData
            WHERE 
                RowNum = 1
                AND Descricao IS NOT NULL 
                AND Descricao <> ''
                AND Setor IS NOT NULL
            GROUP BY
                Setor
            ORDER BY
                Setor
        `;

        // Consulta para obter contagem por tipo e setor
        const typeSectorCountQuery = `
            WITH ProcessData AS (
                SELECT
                    Lhs.Numero_Processo,
                    CASE
                        WHEN Ccl.Descricao LIKE 'Setor Divergência%' THEN 'Divergência'
                        WHEN Ccl.Descricao LIKE 'Setor Retificação%' THEN 'Retificação'
                        WHEN Ccl.Descricao NOT LIKE 'Setor%' THEN Ccl.Descricao
                    END AS Tipo,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (246, 253) THEN 
                            CASE 
                                WHEN Clv.Valor_Tipo_Fixo = 1 THEN 'Cliente'
                                WHEN Clv.Valor_Tipo_Fixo = 2 THEN 'Armador/Co-loader'
                                WHEN Clv.Valor_Tipo_Fixo = 3 THEN 'Operacional'
                                ELSE NULL
                            END
                    END AS Setor,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (244, 245) THEN CAST(Clv.Valor_Texto AS VARCHAR(255))
                        ELSE NULL
                    END AS Descricao,
                    Ccl.Descricao AS OriginalDesc
                FROM
                    mov_Campo_Livre Clv
                LEFT OUTER JOIN
                    mov_Logistica_Campo_Livre Lcl ON Lcl.IdCampo_Livre = Clv.IdCampo_Livre
                LEFT OUTER JOIN
                    cad_Configuracao_Campo_Livre Ccl ON Ccl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lcl.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                WHERE
                    Ccl.IdGrupo_Campo_Livre = 35 /*CE MERCANTE*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
                AND Par.IdPapel_Projeto = 2 /* OPERACIONAL */
            ),
            ProcessedData AS (
                SELECT 
                    p1.Numero_Processo,
                    p1.Tipo,
                    COALESCE(
                        CASE 
                            WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 
                                COALESCE(
                                    (SELECT TOP 1 p2.Setor FROM ProcessData p2 
                                    WHERE p2.Numero_Processo = p1.Numero_Processo 
                                    AND (p2.OriginalDesc LIKE 'Setor ' + p1.Tipo + '%')
                                    AND p2.Setor IS NOT NULL),
                                    (SELECT TOP 1 p3.Setor FROM ProcessData p3 
                                    WHERE p3.Numero_Processo = p1.Numero_Processo 
                                    AND p3.Setor IS NOT NULL)
                                )
                            ELSE NULL
                        END,
                        p1.Setor
                    ) AS Setor,
                    p1.Descricao,
                    ROW_NUMBER() OVER (PARTITION BY p1.Numero_Processo, p1.Tipo ORDER BY 
                        CASE WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 0 ELSE 1 END,
                        CASE WHEN p1.OriginalDesc LIKE 'Setor%' THEN 0 ELSE 1 END
                    ) AS RowNum
                FROM 
                    ProcessData p1
            )
            SELECT
                Tipo,
                Setor,
                COUNT(*) AS Total
            FROM 
                ProcessedData
            WHERE 
                RowNum = 1
                AND Descricao IS NOT NULL 
                AND Descricao <> ''
                AND Setor IS NOT NULL
            GROUP BY
                Tipo, Setor
            ORDER BY
                Tipo, Setor
        `;

        // Consulta para obter contagem por mês
        const monthlyCountQuery = `
            WITH ProcessData AS (
                SELECT
                    Lhs.Numero_Processo,
                    Lhs.Data_Abertura_Processo,
                    CASE
                        WHEN Ccl.Descricao LIKE 'Setor Divergência%' THEN 'Divergência'
                        WHEN Ccl.Descricao LIKE 'Setor Retificação%' THEN 'Retificação'
                        WHEN Ccl.Descricao NOT LIKE 'Setor%' THEN Ccl.Descricao
                    END AS Tipo,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (244, 245) THEN CAST(Clv.Valor_Texto AS VARCHAR(255))
                        ELSE NULL
                    END AS Descricao
                FROM
                    mov_Campo_Livre Clv
                LEFT OUTER JOIN
                    mov_Logistica_Campo_Livre Lcl ON Lcl.IdCampo_Livre = Clv.IdCampo_Livre
                LEFT OUTER JOIN
                    cad_Configuracao_Campo_Livre Ccl ON Ccl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lcl.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                WHERE
                    Ccl.IdGrupo_Campo_Livre = 35 /*CE MERCANTE*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
                AND Lhs.Data_Abertura_Processo IS NOT NULL
                AND Par.IdPapel_Projeto = 2 /* OPERACIONAL */
            ),
            ProcessedData AS (
                SELECT 
                    p1.Numero_Processo,
                    p1.Data_Abertura_Processo,
                    p1.Tipo,
                    p1.Descricao,
                    ROW_NUMBER() OVER (PARTITION BY p1.Numero_Processo, p1.Tipo ORDER BY 
                        CASE WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 0 ELSE 1 END
                    ) AS RowNum
                FROM 
                    ProcessData p1
            )
            SELECT
                FORMAT(Data_Abertura_Processo, 'MM/yyyy') AS Mes,
                YEAR(Data_Abertura_Processo) AS Ano,
                MONTH(Data_Abertura_Processo) AS Mes_Numero,
                COUNT(*) AS Total
            FROM 
                ProcessedData
            WHERE 
                RowNum = 1
                AND Descricao IS NOT NULL 
                AND Descricao <> ''
            GROUP BY
                FORMAT(Data_Abertura_Processo, 'MM/yyyy'),
                YEAR(Data_Abertura_Processo),
                MONTH(Data_Abertura_Processo)
            ORDER BY
                YEAR(Data_Abertura_Processo),
                MONTH(Data_Abertura_Processo)
        `;

        // Consulta para obter contagem por mês e tipo
        const monthlyTypeCountQuery = `
            WITH ProcessData AS (
                SELECT
                    Lhs.Numero_Processo,
                    Lhs.Data_Abertura_Processo,
                    CASE
                        WHEN Ccl.Descricao LIKE 'Setor Divergência%' THEN 'Divergência'
                        WHEN Ccl.Descricao LIKE 'Setor Retificação%' THEN 'Retificação'
                        WHEN Ccl.Descricao NOT LIKE 'Setor%' THEN Ccl.Descricao
                    END AS Tipo,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (244, 245) THEN CAST(Clv.Valor_Texto AS VARCHAR(255))
                        ELSE NULL
                    END AS Descricao
                FROM
                    mov_Campo_Livre Clv
                LEFT OUTER JOIN
                    mov_Logistica_Campo_Livre Lcl ON Lcl.IdCampo_Livre = Clv.IdCampo_Livre
                LEFT OUTER JOIN
                    cad_Configuracao_Campo_Livre Ccl ON Ccl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lcl.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                WHERE
                    Ccl.IdGrupo_Campo_Livre = 35 /*CE MERCANTE*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
                AND Lhs.Data_Abertura_Processo IS NOT NULL
                AND Par.IdPapel_Projeto = 2 /* OPERACIONAL */
            ),
            ProcessedData AS (
                SELECT 
                    p1.Numero_Processo,
                    p1.Data_Abertura_Processo,
                    p1.Tipo,
                    p1.Descricao,
                    ROW_NUMBER() OVER (PARTITION BY p1.Numero_Processo, p1.Tipo ORDER BY 
                        CASE WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 0 ELSE 1 END
                    ) AS RowNum
                FROM 
                    ProcessData p1
            )
            SELECT
                FORMAT(Data_Abertura_Processo, 'MM/yyyy') AS Mes,
                YEAR(Data_Abertura_Processo) AS Ano,
                MONTH(Data_Abertura_Processo) AS Mes_Numero,
                Tipo,
                COUNT(*) AS Total
            FROM 
                ProcessedData
            WHERE 
                RowNum = 1
                AND Descricao IS NOT NULL 
                AND Descricao <> ''
            GROUP BY
                FORMAT(Data_Abertura_Processo, 'MM/yyyy'),
                YEAR(Data_Abertura_Processo),
                MONTH(Data_Abertura_Processo),
                Tipo
            ORDER BY
                YEAR(Data_Abertura_Processo),
                MONTH(Data_Abertura_Processo),
                Tipo
        `;

        const typeCount = await executeQuerySQL(typeCountQuery);
        const sectorCount = await executeQuerySQL(sectorCountQuery);
        const typeSectorCount = await executeQuerySQL(typeSectorCountQuery);
        const monthlyCount = await executeQuerySQL(monthlyCountQuery);
        const monthlyTypeCount = await executeQuerySQL(monthlyTypeCountQuery);

        return {
            typeCount,
            sectorCount,
            typeSectorCount,
            monthlyCount,
            monthlyTypeCount
        };
    },

    // Esta função busca dados por tipo de divergência
    getByDivergence: async function(divergence) {
        // Primeiro, vamos verificar qual tipo de divergência estamos buscando
        let query;
        let params;

        query = `
            WITH ProcessData AS (
                SELECT
                    Lhs.Numero_Processo,
                    Lhs.Data_Abertura_Processo,
                    CASE
                        WHEN Ccl.Descricao LIKE 'Setor Divergência%' THEN 'Divergência'
                        WHEN Ccl.Descricao LIKE 'Setor Retificação%' THEN 'Retificação'
                        WHEN Ccl.Descricao NOT LIKE 'Setor%' THEN Ccl.Descricao
                    END AS Tipo,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (246, 253) THEN 
                            CASE 
                                WHEN Clv.Valor_Tipo_Fixo = 1 THEN 'Cliente'
                                WHEN Clv.Valor_Tipo_Fixo = 2 THEN 'Armador/Co-loader'
                                WHEN Clv.Valor_Tipo_Fixo = 3 THEN 'Operacional'
                                ELSE NULL
                            END
                    END AS Setor,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (244, 245) THEN CAST(Clv.Valor_Texto AS VARCHAR(255))
                        ELSE NULL
                    END AS Descricao,
                    Lmm.Data_CE,
                    Psa.Nome AS Responsavel,
                    Ccl.Descricao AS OriginalDesc
                FROM
                    mov_Campo_Livre Clv
                LEFT OUTER JOIN
                    mov_Logistica_Campo_Livre Lcl ON Lcl.IdCampo_Livre = Clv.IdCampo_Livre
                LEFT OUTER JOIN
                    cad_Configuracao_Campo_Livre Ccl ON Ccl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lcl.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_Master Lmm ON Lmm.IdLogistica_Master = Lms.IdLogistica_Master
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                LEFT OUTER JOIN
                    cad_Pessoa Psa ON Psa.IdPessoa = Par.IdResponsavel
                WHERE
                    Ccl.IdGrupo_Campo_Livre = 35 /*CE MERCANTE*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
                AND Par.IdPapel_Projeto = 2 /* OPERACIONAL */
            ),
            ProcessedData AS (
                SELECT 
                    p1.Numero_Processo,
                    p1.Data_Abertura_Processo,
                    p1.Tipo,
                    COALESCE(
                        CASE 
                            WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 
                                COALESCE(
                                    (SELECT TOP 1 p2.Setor FROM ProcessData p2 
                                    WHERE p2.Numero_Processo = p1.Numero_Processo 
                                    AND (p2.OriginalDesc LIKE 'Setor ' + p1.Tipo + '%')
                                    AND p2.Setor IS NOT NULL),
                                    (SELECT TOP 1 p3.Setor FROM ProcessData p3 
                                    WHERE p3.Numero_Processo = p1.Numero_Processo 
                                    AND p3.Setor IS NOT NULL)
                                )
                            ELSE NULL
                        END,
                        p1.Setor
                    ) AS Setor,
                    p1.Descricao,
                    p1.Data_CE,
                    p1.Responsavel,
                    p1.OriginalDesc,
                    ROW_NUMBER() OVER (PARTITION BY p1.Numero_Processo, p1.Tipo ORDER BY 
                        CASE WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 0 ELSE 1 END,
                        CASE WHEN p1.OriginalDesc LIKE 'Setor%' THEN 0 ELSE 1 END
                    ) AS RowNum
                FROM 
                    ProcessData p1
            )
            SELECT 
                Numero_Processo,
                FORMAT(Data_Abertura_Processo, 'dd/MM/yyyy') AS Data_Abertura_Processo,
                Tipo,
                Setor,
                Descricao,
                FORMAT(Data_CE, 'dd/MM/yyyy') AS Data_CE,
                Responsavel
            FROM 
                ProcessedData
            WHERE 
                RowNum = 1
                AND Setor = @divergence
                AND Descricao IS NOT NULL 
                AND Descricao <> ''
            ORDER BY
                Numero_Processo, Tipo
        `;
        params = { divergence };

        const result = await executeQuerySQL(query, params);

        // Formatar os dados para exibição na tabela
        const formattedData = result.map(item => {
            const buttons = `
                <div class="hstack gap-2 fs-15">
                    <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-info-light view-process" data-processo="${item.Numero_Processo}" title="Visualizar">
                        <i class="ri-eye-line"></i>
                    </a>
                </div>
            `;

            return {
                ...item,
                action: buttons
            };
        });

        return formattedData;
    },

    // Esta função busca dados por período
    getByPeriod: async function(startDate, endDate) {
        const query = `
            WITH ProcessData AS (
                SELECT
                    Lhs.Numero_Processo,
                    Lhs.Data_Abertura_Processo,
                    CASE
                        WHEN Ccl.Descricao LIKE 'Setor Divergência%' THEN 'Divergência'
                        WHEN Ccl.Descricao LIKE 'Setor Retificação%' THEN 'Retificação'
                        WHEN Ccl.Descricao NOT LIKE 'Setor%' THEN Ccl.Descricao
                    END AS Tipo,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (246, 253) THEN 
                            CASE 
                                WHEN Clv.Valor_Tipo_Fixo = 1 THEN 'Cliente'
                                WHEN Clv.Valor_Tipo_Fixo = 2 THEN 'Armador/Co-loader'
                                WHEN Clv.Valor_Tipo_Fixo = 3 THEN 'Operacional'
                                ELSE NULL
                            END
                    END AS Setor,
                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre IN (244, 245) THEN CAST(Clv.Valor_Texto AS VARCHAR(255))
                        ELSE NULL
                    END AS Descricao,
                    Lmm.Data_CE,
                    Psa.Nome AS Responsavel,
                    Ccl.Descricao AS OriginalDesc
                FROM
                    mov_Campo_Livre Clv
                LEFT OUTER JOIN
                    mov_Logistica_Campo_Livre Lcl ON Lcl.IdCampo_Livre = Clv.IdCampo_Livre
                LEFT OUTER JOIN
                    cad_Configuracao_Campo_Livre Ccl ON Ccl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lcl.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_Master Lmm ON Lmm.IdLogistica_Master = Lms.IdLogistica_Master
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                LEFT OUTER JOIN
                    cad_Pessoa Psa ON Psa.IdPessoa = Par.IdResponsavel
                WHERE
                    Ccl.IdGrupo_Campo_Livre = 35 /*CE MERCANTE*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
                AND Par.IdPapel_Projeto = 2 /* OPERACIONAL */
                AND Lhs.Data_Abertura_Processo BETWEEN @startDate AND @endDate
            ),
            ProcessedData AS (
                SELECT 
                    p1.Numero_Processo,
                    p1.Data_Abertura_Processo,
                    p1.Tipo,
                    COALESCE(
                        CASE 
                            WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 
                                COALESCE(
                                    (SELECT TOP 1 p2.Setor FROM ProcessData p2 
                                    WHERE p2.Numero_Processo = p1.Numero_Processo 
                                    AND (p2.OriginalDesc LIKE 'Setor ' + p1.Tipo + '%')
                                    AND p2.Setor IS NOT NULL),
                                    (SELECT TOP 1 p3.Setor FROM ProcessData p3 
                                    WHERE p3.Numero_Processo = p1.Numero_Processo 
                                    AND p3.Setor IS NOT NULL)
                                )
                            ELSE NULL
                        END,
                        p1.Setor
                    ) AS Setor,
                    p1.Descricao,
                    p1.Data_CE,
                    p1.Responsavel,
                    p1.OriginalDesc,
                    ROW_NUMBER() OVER (PARTITION BY p1.Numero_Processo, p1.Tipo ORDER BY 
                        CASE WHEN p1.Descricao IS NOT NULL AND p1.Descricao <> '' THEN 0 ELSE 1 END,
                        CASE WHEN p1.OriginalDesc LIKE 'Setor%' THEN 0 ELSE 1 END
                    ) AS RowNum
                FROM 
                    ProcessData p1
            )
            SELECT 
                Numero_Processo,
                FORMAT(Data_Abertura_Processo, 'dd/MM/yyyy') AS Data_Abertura_Processo,
                Tipo,
                Setor,
                Descricao,
                FORMAT(Data_CE, 'dd/MM/yyyy') AS Data_CE,
                Responsavel
            FROM 
                ProcessedData
            WHERE 
                RowNum = 1
                AND Descricao IS NOT NULL 
                AND Descricao <> ''
            ORDER BY
                Numero_Processo, Tipo
        `;

        const params = { startDate, endDate };
        const result = await executeQuerySQL(query, params);

        // Formatar os dados para exibição na tabela
        const formattedData = result.map(item => {
            const buttons = `
                <div class="hstack gap-2 fs-15">
                    <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-info-light view-process" data-processo="${item.Numero_Processo}" title="Visualizar">
                        <i class="ri-eye-line"></i>
                    </a>
                </div>
            `;

            return {
                ...item,
                action: buttons
            };
        });

        return formattedData;
    },

    getAllCE: async function() {
        const query = `
        SELECT 
Psa.Nome AS Responsavel,
Lhs.Numero_Processo,
FORMAT(Lhs.Data_Abertura_Processo, 'dd/MM/yyyy') AS Data_Abertura_Processo,
FORMAT(Lmm.Data_Desconsolidacao_Mercante, 'dd/MM/yyyy') AS Data_Desconsolidacao_Mercante
    FROM 
    mov_Logistica_House Lhs
LEFT OUTER JOIN
    mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
    LEFT OUTER JOIN
                    mov_Logistica_Maritima_Master Lmm ON Lmm.IdLogistica_Master = Lms.IdLogistica_Master
LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                LEFT OUTER JOIN
                    cad_Pessoa Psa ON Psa.IdPessoa = Par.IdResponsavel
    WHERE
        Lhs.Numero_Processo NOT LIKE '%test%'
        AND Lhs.Numero_Processo NOT LIKE '%demu%'
        AND Lmm.Data_Desconsolidacao_Mercante IS NOT NULL
        AND Par.IdPapel_Projeto = 7 /* DOCUMENTAL [CE] */
        `;

        const result = await executeQuerySQL(query);

        return result;
    },

    getLiberacoesCE: async function() {
        const query = `
            SELECT
                Lhs.Numero_Processo AS Numero_Processo,
                FORMAT(Lms.Data_Desembarque, 'dd/MM/yyyy', 'pt-BR') AS Data_Desembarque,
                CASE Lms.Situacao_Embarque 
                    WHEN 0 THEN 'Pré-processo'
                    WHEN 1 THEN 'Aguardando embarque'
                    WHEN 2 THEN 'Embarcado'
                    WHEN 3 THEN 'Desembarcado'
                    WHEN 4 THEN 'Cancelado'
                    WHEN 5 THEN 'Pendente'
                    WHEN 6 THEN 'Autorizado'
                    WHEN 7 THEN 'Coletado'
                    WHEN 8 THEN 'Entregue'
                    WHEN 9 THEN 'Aguardando prontidão da mercadoria'
                    WHEN 10 THEN 'Aguardando booking finalizado'
                    WHEN 11 THEN 'Aguardando coleta'
                    WHEN 12 THEN 'Aguardando entrega'
                END AS Situacao_Embarque
            FROM 
                mov_Logistica_House Lhs
            LEFT OUTER JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            WHERE
                Lms.Modalidade_Processo IN (2) /*Marítimo*/
                AND Lms.Tipo_Operacao IN (2) /*Importação*/
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lms.Situacao_Embarque != 4 /*Cancelado*/
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lms.Data_Desembarque IS NOT NULL
            ORDER BY
                Lms.Data_Desembarque ASC
        `;

        const result = await executeQuerySQL(query);
        return result;
    }
};

// Exporta o objeto ceMerchant para uso em outros módulos
module.exports = {
    ceMerchant
}; 