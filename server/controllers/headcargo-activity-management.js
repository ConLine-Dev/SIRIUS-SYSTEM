const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');
const { sendEmail } = require('../support/send-email');

// Obter ano atual dinamicamente
const currentYear = new Date().getFullYear();

const headcargoActivityManagement = {
    // Função para formatar data para DD/MM/YYYY (CORRIGIDA)
    formatDate: function (dateString) {
        if (!dateString) return '-';
        
        // Se já é uma string de data no formato YYYY-MM-DD, usar diretamente
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }
        
        // Se é uma data com timestamp, extrair apenas a parte da data
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
            const datePart = dateString.split(' ')[0];
            const [year, month, day] = datePart.split('-');
            return `${day}/${month}/${year}`;
        }
        
        // Se é um objeto Date (vindo do SQL Server), usar os métodos diretamente
        if (dateString instanceof Date) {
            const day = String(dateString.getDate()).padStart(2, '0');
            const month = String(dateString.getMonth() + 1).padStart(2, '0');
            const year = dateString.getFullYear();
            return `${day}/${month}/${year}`;
        }
        
        // Se é uma string UTC (formato ISO), extrair a data diretamente
        if (typeof dateString === 'string' && dateString.includes('T') && dateString.includes('Z')) {
            const datePart = dateString.split('T')[0];
            const [year, month, day] = datePart.split('-');
            return `${day}/${month}/${year}`;
        }
        
        // Para outros casos, tentar criar um objeto Date
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        // Formatar como DD/MM/YYYY
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    },

    // Função para verificar se atividade está atrasada (CORRIGIDA)
    isActivityOverdue: function (previsaoTermino, status) {
        if (!previsaoTermino || status === 'Concluída' || status === 'Cancelada' || status === 'Não realizada') return false;
        
        // Se a data já vem no formato YYYY-MM-DD do SQL Server, usar diretamente
        if (typeof previsaoTermino === 'string' && previsaoTermino.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            return previsaoTermino < hoje;
        }
        
        // Para outros casos, usar a lógica original
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Zerar horário para comparação apenas de data
        
        const dataTermino = new Date(previsaoTermino);
        dataTermino.setHours(0, 0, 0, 0);
        
        return dataTermino < hoje;
    },

    // Função para obter classe CSS baseada no status
    getStatusClass: function (status) {
        switch (status) {
            case 'Concluída':
                return 'success';
            case 'Em andamento':
                return 'primary';
            case 'Não iniciada':
                return 'secondary';
            case 'Paralisada':
                return 'warning';
            case 'Atrasada':
                return 'danger';
            case 'Não realizada':
                return 'info';
            case 'Cancelada':
                return 'dark';
            default:
                return 'secondary';
        }
    },

    // Função para obter emoji baseado no status
    getStatusEmoji: function (status) {
        switch (status) {
            case 'Concluída':
                return '✅';
            case 'Em andamento':
                return '🔄';
            case 'Não iniciada':
                return '⏳';
            case 'Paralisada':
                return '⏸️';
            case 'Atrasada':
                return '🚨';
            case 'Não realizada':
                return '❌';
            case 'Cancelada':
                return '🚫';
            default:
                return '❓';
        }
    },

    // Busca atividades por colaborador
    getActivitiesByCollaborator: async function (collaboratorId = null, date = null) {
        const currentDate = date || new Date().toISOString().split('T')[0];
        
        let whereClause = `
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Tar2.Descricao NOT LIKE '%CFG%'
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
        `;

        if (collaboratorId) {
            whereClause += ` AND Atv.IdResponsavel = ${collaboratorId}`;
        }

        const sql = `SELECT 
            Atv.IdResponsavel,
            Psa.nome AS Responsavel,
            Psa.EMail,
            Pro.Nome AS Papel_Responsavel,
            Tar2.Descricao AS Descricao_Tarefa,
            Lhs.Numero_Processo,
            CONVERT(VARCHAR(10), Atv.Previsao_Inicio, 120) AS 'Data_Previsao_Inicio',
            CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) AS 'Data_Previsao_Termino',
            CONVERT(VARCHAR(10), Atv.Data_Inicio, 120) AS 'Data_Inicio',
            CONVERT(VARCHAR(10), Atv.Data_Termino, 120) AS 'Data_Termino',
            Atv.Situacao,
            CASE 
                WHEN Atv.Situacao = 1 THEN 'Não iniciada'
                WHEN Atv.Situacao = 2 THEN 'Em andamento'
                WHEN Atv.Situacao = 3 THEN 'Paralisada'
                WHEN Atv.Situacao = 4 THEN 'Concluída'
                WHEN Atv.Situacao = 5 THEN 'Não realizada'
                WHEN Atv.Situacao = 6 THEN 'Cancelada'
                ELSE 'Desconhecido'
            END AS Status_Tarefa
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            ${whereClause}
        ORDER BY 
            CASE WHEN Psa.nome IS NULL THEN 1 ELSE 0 END, 
            Psa.nome ASC,
            Status_Tarefa,
            Tar2.Descricao`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Busca atividades do dia para um colaborador específico
    getTodayActivities: async function (collaboratorId, date = null) {
        // CORREÇÃO TIMEZONE: Usar timezone brasileiro
        const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

        const sql = `SELECT 
            Atv.IdResponsavel,
            Psa.nome AS Responsavel,
            Psa.EMail,
            Pro.Nome AS Papel_Responsavel,
            Tar2.Descricao AS Descricao_Tarefa,
            Lhs.Numero_Processo,
            CONVERT(VARCHAR(10), Atv.Previsao_Inicio, 120) AS 'Data_Previsao_Inicio',
            CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) AS 'Data_Previsao_Termino',
            CONVERT(VARCHAR(10), Atv.Data_Inicio, 120) AS 'Data_Inicio',
            CONVERT(VARCHAR(10), Atv.Data_Termino, 120) AS 'Data_Termino',
            Atv.Situacao,
            CASE 
                WHEN Atv.Situacao = 1 THEN 'Não iniciada'
                WHEN Atv.Situacao = 2 THEN 'Em andamento'
                WHEN Atv.Situacao = 3 THEN 'Paralisada'
                WHEN Atv.Situacao = 4 THEN 'Concluída'
                WHEN Atv.Situacao = 5 THEN 'Não realizada'
                WHEN Atv.Situacao = 6 THEN 'Cancelada'
                ELSE 'Desconhecido'
            END AS Status_Tarefa
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Tar2.Descricao NOT LIKE '%CFG%'
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
            AND Atv.IdResponsavel = ${collaboratorId}
            AND (
                -- Atividades concluídas no dia (Data_Termino = dia atual)
                (Atv.Situacao = 4 AND CONVERT(VARCHAR(10), Atv.Data_Termino, 120) = '${currentDate}')
                -- Atividades com prazo para hoje
                OR (Atv.Situacao IN (1, 2, 3) AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}')
                -- Atividades atrasadas (Previsao_Termino < dia atual e não concluídas/canceladas/não realizadas)
                OR (Atv.Situacao IN (1, 2, 3) AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL)
            )
        ORDER BY 
            Status_Tarefa,
            Tar2.Descricao`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Busca atividades concluídas no dia
    getCompletedTodayActivities: async function (collaboratorId, date = null) {
        // CORREÇÃO TIMEZONE: Usar timezone brasileiro
        const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        
        const sql = `SELECT 
            Atv.IdResponsavel,
            Psa.nome AS Responsavel,
            Psa.EMail,
            Pro.Nome AS Papel_Responsavel,
            Tar2.Descricao AS Descricao_Tarefa,
            Lhs.Numero_Processo,
            CONVERT(VARCHAR(10), Atv.Previsao_Inicio, 120) AS 'Data_Previsao_Inicio',
            CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) AS 'Data_Previsao_Termino',
            CONVERT(VARCHAR(10), Atv.Data_Inicio, 120) AS 'Data_Inicio',
            CONVERT(VARCHAR(10), Atv.Data_Termino, 120) AS 'Data_Termino',
            Atv.Situacao,
            'Concluída' AS Status_Tarefa
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Tar2.Descricao NOT LIKE '%CFG%'
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
            AND Atv.IdResponsavel = ${collaboratorId}
            AND Atv.Situacao = 4
            AND CONVERT(VARCHAR(10), Atv.Data_Termino, 120) = '${currentDate}'
        ORDER BY 
            Tar2.Descricao`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Busca atividades pendentes no dia (atualizada para incluir todos os status ativos)
    getPendingTodayActivities: async function (collaboratorId, date = null) {
        // CORREÇÃO TIMEZONE: Usar timezone brasileiro
        const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        
        const sql = `SELECT 
            Atv.IdResponsavel,
            Psa.nome AS Responsavel,
            Psa.EMail,
            Pro.Nome AS Papel_Responsavel,
            Tar2.Descricao AS Descricao_Tarefa,
            Lhs.Numero_Processo,
            CONVERT(VARCHAR(10), Atv.Previsao_Inicio, 120) AS 'Data_Previsao_Inicio',
            CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) AS 'Data_Previsao_Termino',
            CONVERT(VARCHAR(10), Atv.Data_Inicio, 120) AS 'Data_Inicio',
            CONVERT(VARCHAR(10), Atv.Data_Termino, 120) AS 'Data_Termino',
            Atv.Situacao,
            CASE 
                WHEN Atv.Situacao = 1 THEN 'Não iniciada'
                WHEN Atv.Situacao = 2 THEN 'Em andamento'
                WHEN Atv.Situacao = 3 THEN 'Paralisada'
                WHEN Atv.Situacao = 4 THEN 'Concluída'
                WHEN Atv.Situacao = 5 THEN 'Não realizada'
                WHEN Atv.Situacao = 6 THEN 'Cancelada'
                ELSE 'Desconhecido'
            END AS Status_Tarefa
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Tar2.Descricao NOT LIKE '%CFG%'
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
            AND Atv.IdResponsavel = ${collaboratorId}
            AND Atv.Situacao IN (1, 2, 3, 5, 6) -- Todos os status exceto concluída
            AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}'
        ORDER BY 
            Tar2.Descricao`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Busca todas as atividades pendentes (incluindo atrasadas)
    getAllPendingActivities: async function (collaboratorId, date = null) {
        // CORREÇÃO TIMEZONE: Usar timezone brasileiro
        const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        
        const sql = `SELECT 
            Atv.IdResponsavel,
            Psa.nome AS Responsavel,
            Psa.EMail,
            Pro.Nome AS Papel_Responsavel,
            Tar2.Descricao AS Descricao_Tarefa,
            Lhs.Numero_Processo,
            CONVERT(VARCHAR(10), Atv.Previsao_Inicio, 120) AS 'Data_Previsao_Inicio',
            CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) AS 'Data_Previsao_Termino',
            CONVERT(VARCHAR(10), Atv.Data_Inicio, 120) AS 'Data_Inicio',
            CONVERT(VARCHAR(10), Atv.Data_Termino, 120) AS 'Data_Termino',
            Atv.Situacao,
            CASE 
                WHEN Atv.Situacao = 1 THEN 'Não iniciada'
                WHEN Atv.Situacao = 2 THEN 'Em andamento'
                WHEN Atv.Situacao = 3 THEN 'Paralisada'
                WHEN Atv.Situacao = 4 THEN 'Concluída'
                WHEN Atv.Situacao = 5 THEN 'Não realizada'
                WHEN Atv.Situacao = 6 THEN 'Cancelada'
                ELSE 'Desconhecido'
            END AS Status_Tarefa
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Tar2.Descricao NOT LIKE '%CFG%'
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
            AND Atv.IdResponsavel = ${collaboratorId}
            AND Atv.Situacao IN (1, 2, 3, 5, 6) -- Todos os status exceto concluída
            AND (
                -- Atividades com prazo para hoje
                CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}'
                -- Atividades atrasadas (Previsao_Termino < dia atual e não concluídas)
                OR (Atv.Situacao IN (1, 2, 3) AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL)
            )
        ORDER BY 
            Tar2.Descricao`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Busca atividades atrasadas
    getOverdueActivities: async function (collaboratorId, date = null) {
        // CORREÇÃO TIMEZONE: Usar timezone brasileiro
        const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        
        const sql = `SELECT 
            Atv.IdResponsavel,
            Psa.nome AS Responsavel,
            Psa.EMail,
            Pro.Nome AS Papel_Responsavel,
            Tar2.Descricao AS Descricao_Tarefa,
            Lhs.Numero_Processo,
            CONVERT(VARCHAR(10), Atv.Previsao_Inicio, 120) AS 'Data_Previsao_Inicio',
            CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) AS 'Data_Previsao_Termino',
            CONVERT(VARCHAR(10), Atv.Data_Inicio, 120) AS 'Data_Inicio',
            CONVERT(VARCHAR(10), Atv.Data_Termino, 120) AS 'Data_Termino',
            Atv.Situacao,
            'Atrasada' AS Status_Tarefa
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Tar2.Descricao NOT LIKE '%CFG%'
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
            AND Atv.IdResponsavel = ${collaboratorId}
            AND Atv.Situacao IN (1, 2, 3) -- Apenas status ativos podem estar atrasados
            AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}'
            AND Atv.Data_Termino IS NULL
        ORDER BY 
            Tar2.Descricao`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Busca todos os colaboradores únicos
    getUniqueCollaborators: async function () {
        const sql = `SELECT DISTINCT
            Atv.IdResponsavel,
            Psa.nome AS Responsavel,
            Psa.EMail,
            Pro.Nome AS Papel_Responsavel,
            CASE 
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                ELSE 'N/A'
            END AS TipoOperacao
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            mov_logistica_master Lms ON Lhs.IdLogistica_Master = Lms.IdLogistica_Master
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
            AND Pro.Nome IS NOT NULL
        ORDER BY 
            Psa.nome ASC`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Busca colaboradores por papel
    getCollaboratorsByRole: async function () {
        const sql = `SELECT DISTINCT
            Atv.IdResponsavel,
            Psa.nome AS Responsavel,
            Psa.EMail,
            Pro.Nome AS Papel,
            Pro.IdPapel_Projeto AS IdPapel
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
            AND Pro.Nome IS NOT NULL
        ORDER BY 
            Pro.Nome ASC,
            Psa.nome ASC`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Configuração de gestores por papel e tipo de operação
    getManagersByRole: function () {
        return {
            // Operacional - Exportação Aérea
            // 'OPERACIONAL_EA': 'petryck.leite@conlinebr.com.br',
            // Operacional - Importação Aérea
            // 'OPERACIONAL_IA': 'petryck.leite@conlinebr.com.br',
            // Operacional - Exportação Marítima
            // 'OPERACIONAL_EM': 'petryck.leite@conlinebr.com.br',
            // Operacional - Importação Marítima
            'OPERACIONAL_IM': 'gestor.operacional.im@conlinebr.com.br',
            'DOCUMENTAL_IM': 'gestor.documental.im@conlinebr.com.br',
            'DOCUMENTAL_EM': 'gestor.documental.im@conlinebr.com.br',
            
            // // Administrativo - Exportação Aérea
            // 'ADMINISTRATIVO_EA': 'gestor.administrativo.ea@conlinebr.com.br',
            // // Administrativo - Importação Aérea
            // 'ADMINISTRATIVO_IA': 'gestor.administrativo.ia@conlinebr.com.br',
            // // Administrativo - Exportação Marítima
            // 'ADMINISTRATIVO_EM': 'gestor.administrativo.em@conlinebr.com.br',
            // // Administrativo - Importação Marítima
            // 'ADMINISTRATIVO_IM': 'gestor.administrativo.im@conlinebr.com.br',
            
            // // Comercial - Exportação Aérea
            // 'COMERCIAL_EA': 'gestor.comercial.ea@conlinebr.com.br',
            // // Comercial - Importação Aérea
            // 'COMERCIAL_IA': 'gestor.comercial.ia@conlinebr.com.br',
            // // Comercial - Exportação Marítima
            // 'COMERCIAL_EM': 'gestor.comercial.em@conlinebr.com.br',
            // // Comercial - Importação Marítima
            // 'COMERCIAL_IM': 'gestor.comercial.im@conlinebr.com.br',
            
            // // Financeiro - Exportação Aérea
            // 'FINANCEIRO_EA': 'gestor.financeiro.ea@conlinebr.com.br',
            // // Financeiro - Importação Aérea
            // 'FINANCEIRO_IA': 'gestor.financeiro.ia@conlinebr.com.br',
            // // Financeiro - Exportação Marítima
            // 'FINANCEIRO_EM': 'gestor.financeiro.em@conlinebr.com.br',
            // // Financeiro - Importação Marítima
            // 'FINANCEIRO_IM': 'gestor.financeiro.im@conlinebr.com.br',
            
            // // TI - Exportação Aérea
            // 'TI_EA': 'gestor.ti.ea@conlinebr.com.br',
            // // TI - Importação Aérea
            // 'TI_IA': 'gestor.ti.ia@conlinebr.com.br',
            // // TI - Exportação Marítima
            // 'TI_EM': 'gestor.ti.em@conlinebr.com.br',
            // // TI - Importação Marítima
            // 'TI_IM': 'gestor.ti.im@conlinebr.com.br',
            
            // // RH - Exportação Aérea
            // 'RH_EA': 'gestor.rh.ea@conlinebr.com.br',
            // // RH - Importação Aérea
            // 'RH_IA': 'gestor.rh.ia@conlinebr.com.br',
            // // RH - Exportação Marítima
            // 'RH_EM': 'gestor.rh.em@conlinebr.com.br',
            // // RH - Importação Marítima
            // 'RH_IM': 'gestor.rh.im@conlinebr.com.br',
            
            // // Logística - Exportação Aérea
            // 'LOGISTICA_EA': 'gestor.logistica.ea@conlinebr.com.br',
            // // Logística - Importação Aérea
            // 'LOGISTICA_IA': 'gestor.logistica.ia@conlinebr.com.br',
            // // Logística - Exportação Marítima
            // 'LOGISTICA_EM': 'gestor.logistica.em@conlinebr.com.br',
            // // Logística - Importação Marítima
            // 'LOGISTICA_IM': 'gestor.logistica.im@conlinebr.com.br',
            
            // // Qualidade - Exportação Aérea
            // 'QUALIDADE_EA': 'gestor.qualidade.ea@conlinebr.com.br',
            // // Qualidade - Importação Aérea
            // 'QUALIDADE_IA': 'gestor.qualidade.ia@conlinebr.com.br',
            // // Qualidade - Exportação Marítima
            // 'QUALIDADE_EM': 'gestor.qualidade.em@conlinebr.com.br',
            // // Qualidade - Importação Marítima
            // 'QUALIDADE_IM': 'gestor.qualidade.im@conlinebr.com.br'
            
            // Adicione mais papéis e tipos de operação conforme necessário
        };
    },

    // Configuração de grupos de papéis para gestores
    getRoleGroups: function () {
        return {
            // Grupo Operacional Geral - inclui todos os tipos de Operacional
            'GRUPO_OPERACIONAL': {
                name: 'Operacional Geral',
                email: 'gestor.operacional.geral@conlinebr.com.br',
                roles: [
                    'OPERACIONAL_EA',
                    'OPERACIONAL_IA', 
                    'OPERACIONAL_EM',
                    'OPERACIONAL_IM',
                    'OPERACIONAL PÓS-EMBARQUE_EA',
                    'OPERACIONAL PÓS-EMBARQUE_IA',
                    'OPERACIONAL PÓS-EMBARQUE_EM',
                    'OPERACIONAL PÓS-EMBARQUE_IM',
                    'OPERACIONAL PRÉ-EMBARQUE_EA',
                    'OPERACIONAL PRÉ-EMBARQUE_IA',
                    'OPERACIONAL PRÉ-EMBARQUE_EM',
                    'OPERACIONAL PRÉ-EMBARQUE_IM'
                ]
            },
            
            // Grupo Documental Geral
            'GRUPO_DOCUMENTAL': {
                name: 'Documental Geral',
                email: 'gestor.documental.geral@conlinebr.com.br',
                roles: [
                    'DOCUMENTAL_EA',
                    'DOCUMENTAL_IA',
                    'DOCUMENTAL_EM',
                    'DOCUMENTAL_IM'
                ]
            },
            
            // Grupo Importação Marítima (todos os papéis)
            'GRUPO_IMPORTACAO_MARITIMA': {
                name: 'Importação Marítima',
                email: 'gestor.importacao.maritima@conlinebr.com.br',
                roles: [
                    'OPERACIONAL_IM',
                    'DOCUMENTAL_IM',
                    'ADMINISTRATIVO_IM',
                    'COMERCIAL_IM',
                    'FINANCEIRO_IM'
                ]
            },
            
            // Grupo Exportação Marítima (todos os papéis)
            'GRUPO_EXPORTACAO_MARITIMA': {
                name: 'Exportação Marítima',
                email: 'gestor.exportacao.maritima@conlinebr.com.br',
                roles: [
                    'OPERACIONAL_EM',
                    'DOCUMENTAL_EM',
                    'ADMINISTRATIVO_EM',
                    'COMERCIAL_EM',
                    'FINANCEIRO_EM'
                ]
            },
            
            // Grupo Operacional Pós-Embarque
            'GRUPO_OPERACIONAL_POS_EMBARQUE': {
                name: 'Operacional Pós-Embarque',
                email: 'gestor.operacional.pos.embarque@conlinebr.com.br',
                roles: [
                    'OPERACIONAL PÓS-EMBARQUE_EA',
                    'OPERACIONAL PÓS-EMBARQUE_IA',
                    'OPERACIONAL PÓS-EMBARQUE_EM',
                    'OPERACIONAL PÓS-EMBARQUE_IM'
                ]
            },
            
            // Grupo Operacional Pré-Embarque
            'GRUPO_OPERACIONAL_PRE_EMBARQUE': {
                name: 'Operacional Pré-Embarque',
                email: 'gestor.operacional.pre.embarque@conlinebr.com.br',
                roles: [
                    'OPERACIONAL PRÉ-EMBARQUE_EA',
                    'OPERACIONAL PRÉ-EMBARQUE_IA',
                    'OPERACIONAL PRÉ-EMBARQUE_EM',
                    'OPERACIONAL PRÉ-EMBARQUE_IM'
                ]
            }
        };
    },

    // Função para obter gestor de um papel (incluindo grupos)
    getManagerForRole: function (papelTipo) {
        // Primeiro verificar se há gestor direto
        const managersByRole = this.getManagersByRole();
        if (managersByRole[papelTipo]) {
            return {
                type: 'direct',
                email: managersByRole[papelTipo],
                name: `Gestor ${papelTipo}`
            };
        }
        
        // Verificar se está em algum grupo
        const roleGroups = this.getRoleGroups();
        for (const [groupId, group] of Object.entries(roleGroups)) {
            if (group.roles.includes(papelTipo)) {
                return {
                    type: 'group',
                    email: group.email,
                    name: group.name,
                    groupId: groupId
                };
            }
        }
        
        return null;
    },

    // Função para obter todos os gestores (incluindo grupos)
    getAllManagers: function () {
        const managers = {};
        
        // Adicionar gestores diretos
        const managersByRole = this.getManagersByRole();
        Object.entries(managersByRole).forEach(([papelTipo, email]) => {
            managers[papelTipo] = {
                type: 'direct',
                email: email,
                name: `Gestor ${papelTipo}`,
                roles: [papelTipo]
            };
        });
        
        // Adicionar grupos
        const roleGroups = this.getRoleGroups();
        Object.entries(roleGroups).forEach(([groupId, group]) => {
            managers[groupId] = {
                type: 'group',
                email: group.email,
                name: group.name,
                roles: group.roles
            };
        });
        
        return managers;
    },

    // Função para listar todos os gestores configurados
    listAllManagers: function () {
        try {
            console.log('📋 Listando todos os gestores configurados...');
            
            const allManagers = this.getAllManagers();
            
            console.log(`\n👥 Total de gestores: ${Object.keys(allManagers).length}`);
            console.log('='.repeat(100));
            
            // Separar gestores diretos e grupos
            const directManagers = {};
            const groupManagers = {};
            
            Object.entries(allManagers).forEach(([key, manager]) => {
                if (manager.type === 'direct') {
                    directManagers[key] = manager;
                } else {
                    groupManagers[key] = manager;
                }
            });
            
            // Mostrar gestores diretos
            if (Object.keys(directManagers).length > 0) {
                console.log('\n👤 Gestores Diretos:');
                console.log('-'.repeat(50));
                Object.entries(directManagers).forEach(([papelTipo, manager]) => {
                    console.log(`  ${papelTipo} | ${manager.email}`);
                });
            }
            
            // Mostrar grupos
            if (Object.keys(groupManagers).length > 0) {
                console.log('\n👥 Grupos de Gestores:');
                console.log('-'.repeat(50));
                Object.entries(groupManagers).forEach(([groupId, manager]) => {
                    console.log(`  ${manager.name} (${groupId})`);
                    console.log(`    Email: ${manager.email}`);
                    console.log(`    Papéis: ${manager.roles.join(', ')}`);
                    console.log('');
                });
            }
            
            console.log('='.repeat(100));
            console.log('💡 Use: testSendManagerReport("PAPEL_TIPO", "morning"|"evening"|"both")');
            console.log('💡 Exemplo: testSendManagerReport("OPERACIONAL_IM", "both")');
            
            return allManagers;
            
        } catch (error) {
            console.error('❌ Erro ao listar gestores:', error);
            return {};
        }
    },

    // Função para testar relatórios gerenciais com grupos
    testSendGroupManagerReport: async function (groupId, reportType = 'both', date = null) {
        try {
            console.log(`🧪 Iniciando teste de relatório gerencial para grupo: ${groupId}`);
            
            const roleGroups = this.getRoleGroups();
            const group = roleGroups[groupId];
            
            if (!group) {
                console.error(`❌ Grupo ${groupId} não encontrado`);
                return false;
            }
            
            console.log(`👤 Grupo encontrado: ${group.name} (${group.email})`);
            console.log(`📋 Papéis incluídos: ${group.roles.join(', ')}`);
            
            const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
            console.log(`📅 Data do teste: ${currentDate}`);
            
            let reportsSent = 0;
            
            // Enviar relatório gerencial matinal
            if (reportType === 'morning' || reportType === 'both') {
                console.log('🌅 Enviando relatório gerencial matinal...');
                
                const metricsByRole = await this.getMetricsByRole(currentDate);
                const collaboratorsDetails = await this.getCollaboratorsDetailsByRole(currentDate);
                
                // Filtrar apenas dados dos papéis do grupo
                const groupMetrics = metricsByRole.filter(m => group.roles.includes(`${m.Papel}_${m.TipoOperacao}`));
                const groupCollaborators = collaboratorsDetails.filter(c => group.roles.includes(`${c.Papel}_${c.TipoOperacao}`));
                
                console.log(`📊 Métricas encontradas: ${groupMetrics.length}`);
                console.log(`👥 Colaboradores encontrados: ${groupCollaborators.length}`);
                
                if (groupMetrics.length > 0 || groupCollaborators.length > 0) {
                    const htmlContent = this.generateManagerMorningReportHTML(group.email, groupMetrics, groupCollaborators);
                    
                    await this.sendEmailWithLog({
                        type: 'morning_manager',
                        recipientEmail: 'petryck.leite@conlinebr.com.br',//group.email,
                        recipientName: group.name,
                        subject: `🧪 [TESTE] Relatório Gerencial Matinal - ${group.name} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: currentDate
                    });
                    
                    console.log(`✅ Relatório gerencial matinal enviado com sucesso para ${group.email}`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhum dado encontrado para o relatório gerencial matinal`);
                }
            }
            
            // Enviar relatório gerencial vespertino
            if (reportType === 'evening' || reportType === 'both') {
                console.log('🌆 Enviando relatório gerencial vespertino...');
                
                const metricsByRole = await this.getMetricsByRole(currentDate);
                const collaboratorsDetails = await this.getCollaboratorsDetailsByRole(currentDate);
                
                // Filtrar apenas dados dos papéis do grupo
                const groupMetrics = metricsByRole.filter(m => group.roles.includes(`${m.Papel}_${m.TipoOperacao}`));
                const groupCollaborators = collaboratorsDetails.filter(c => group.roles.includes(`${c.Papel}_${c.TipoOperacao}`));
                
                if (groupMetrics.length > 0 || groupCollaborators.length > 0) {
                    const htmlContent = this.generateManagerEveningReportHTML(group.email, groupMetrics, groupCollaborators);
                    
                    await this.sendEmailWithLog({
                        type: 'evening_manager',
                        recipientEmail: 'petryck.leite@conlinebr.com.br',//group.email,
                        recipientName: group.name,
                        subject: `🧪 [TESTE] Relatório Gerencial Vespertino - ${group.name} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: currentDate
                    });
                    
                    console.log(`✅ Relatório gerencial vespertino enviado com sucesso para ${group.email}`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhum dado encontrado para o relatório gerencial vespertino`);
                }
            }
            
            console.log(`🎯 Teste gerencial concluído! ${reportsSent} relatório(s) enviado(s) para ${group.email}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro no teste gerencial:`, error);
            return false;
        }
    },

    // Gera HTML do relatório matinal
    generateMorningReportHTML: function (collaborator, activities) {
        // Filtrar apenas atividades ativas do dia específico (não concluídas, canceladas ou não realizadas)
        const relevantActivities = activities.filter(a => 
            a.Status_Tarefa === 'Não iniciada' || 
            a.Status_Tarefa === 'Em andamento' || 
            a.Status_Tarefa === 'Paralisada' || 
            a.Status_Tarefa === 'Atrasada'
        );
        
        const totalActivities = relevantActivities.length;
        const naoIniciadas = relevantActivities.filter(a => a.Status_Tarefa === 'Não iniciada').length;
        const emAndamento = relevantActivities.filter(a => a.Status_Tarefa === 'Em andamento').length;
        const paralisadas = relevantActivities.filter(a => a.Status_Tarefa === 'Paralisada').length;
        const atrasadas = relevantActivities.filter(a => a.Status_Tarefa === 'Atrasada').length;

        // Ordenar atividades por prioridade: Atrasadas > Paralisadas > Em andamento > Não iniciadas
        const sortedActivities = relevantActivities.sort((a, b) => {
            const priority = { 'Atrasada': 4, 'Paralisada': 3, 'Em andamento': 2, 'Não iniciada': 1 };
            return priority[b.Status_Tarefa] - priority[a.Status_Tarefa];
        });

        let activitiesHTML = '';
        sortedActivities.forEach(activity => {
            const statusClass = this.getStatusClass(activity.Status_Tarefa);
            const statusEmoji = this.getStatusEmoji(activity.Status_Tarefa);
            
            activitiesHTML += `
                <tr>
                    <td>${activity.Descricao_Tarefa}</td>
                    <td>${activity.Papel_Responsavel || '-'}</td>
                    <td>${activity.Numero_Processo || '-'}</td>
                    <td>${this.formatDate(activity.Data_Previsao_Inicio)}</td>
                    <td>${this.formatDate(activity.Data_Previsao_Termino)}</td>
                    <td><span class="badge bg-${statusClass}">${statusEmoji} ${activity.Status_Tarefa}</span></td>
                </tr>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório Matinal - Atividades do Dia</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px; }
                    .summary { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #f2f2f2; }
                    .badge { padding: 5px 10px; border-radius: 3px; color: white; font-size: 12px; }
                    .bg-success { background-color: #28a745; }
                    .bg-primary { background-color: #007bff; }
                    .bg-secondary { background-color: #6c757d; }
                    .bg-warning { background-color: #ffc107; color: black; }
                    .bg-danger { background-color: #dc3545; }
                    .bg-info { background-color: #17a2b8; }
                    .bg-dark { background-color: #343a40; }
                    .footer { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🌅 Relatório Matinal - Atividades do Dia</h1>
                    <p>Olá ${collaborator.Responsavel}, aqui estão suas atividades para hoje!</p>
                </div>

                <div class="summary">
                    <h3>📊 Resumo do Dia</h3>
                    <p><strong>Total de Atividades para Hoje:</strong> ${totalActivities}</p>
                    <p><strong>🚨 Atrasadas:</strong> ${atrasadas}</p>
                    <p><strong>⏸️ Paralisadas:</strong> ${paralisadas}</p>
                    <p><strong>🔄 Em andamento:</strong> ${emAndamento}</p>
                    <p><strong>⏳ Não iniciadas:</strong> ${naoIniciadas}</p>
                </div>

                <h3>📋 Atividades Ativas</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Tarefa</th>
                            <th>Papel</th>
                            <th>Nº Processo</th>
                            <th>Previsão Início</th>
                            <th>Previsão Término</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activitiesHTML}
                    </tbody>
                </table>

                <div class="footer">
                    <p><strong>💡 Dica:</strong> Priorize as atividades atrasadas (🚨) e paralisadas (⏸️), depois foque nas em andamento (🔄) e não iniciadas (⏳)!</p>
                    <p><em>Este relatório foi gerado automaticamente pelo Sirius System.</em></p>
                </div>
            </body>
            </html>
        `;
    },

    // Gera HTML do relatório vespertino
    generateEveningReportHTML: function (collaborator, completedActivities, pendingActivities) {
        const totalCompleted = completedActivities.length;
        const totalPending = pendingActivities.length;

        // Agrupar atividades pendentes por status
        const naoIniciadas = pendingActivities.filter(a => a.Status_Tarefa === 'Não iniciada').length;
        const emAndamento = pendingActivities.filter(a => a.Status_Tarefa === 'Em andamento').length;
        const paralisadas = pendingActivities.filter(a => a.Status_Tarefa === 'Paralisada').length;
        const atrasadas = pendingActivities.filter(a => a.Status_Tarefa === 'Atrasada').length;
        const naoRealizadas = pendingActivities.filter(a => a.Status_Tarefa === 'Não realizada').length;
        const canceladas = pendingActivities.filter(a => a.Status_Tarefa === 'Cancelada').length;

        let completedHTML = '';
        completedActivities.forEach(activity => {
            completedHTML += `
                <tr>
                    <td>${activity.Descricao_Tarefa}</td>
                    <td>${activity.Papel_Responsavel || '-'}</td>
                    <td>${activity.Numero_Processo || '-'}</td>
                    <td>${this.formatDate(activity.Data_Termino)}</td>
                </tr>
            `;
        });

        let pendingHTML = '';
        // Ordenar atividades: Atrasadas > Paralisadas > Em andamento > Não iniciadas > Não realizadas > Canceladas
        const sortedPendingActivities = pendingActivities.sort((a, b) => {
            const priority = { 'Atrasada': 6, 'Paralisada': 5, 'Em andamento': 4, 'Não iniciada': 3, 'Não realizada': 2, 'Cancelada': 1 };
            return priority[b.Status_Tarefa] - priority[a.Status_Tarefa];
        });
        
        sortedPendingActivities.forEach(activity => {
            const statusClass = this.getStatusClass(activity.Status_Tarefa);
            const statusEmoji = this.getStatusEmoji(activity.Status_Tarefa);
            
            pendingHTML += `
                <tr>
                    <td>${activity.Descricao_Tarefa}</td>
                    <td>${activity.Papel_Responsavel || '-'}</td>
                    <td>${activity.Numero_Processo || '-'}</td>
                    <td>${this.formatDate(activity.Data_Previsao_Inicio)}</td>
                    <td>${this.formatDate(activity.Data_Previsao_Termino)}</td>
                    <td><span class="badge bg-${statusClass}">${statusEmoji} ${activity.Status_Tarefa}</span></td>
                </tr>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório Vespertino - Resumo do Dia</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background-color: #6f42c1; color: white; padding: 20px; border-radius: 5px; }
                    .summary { background-color: #f4f3f4; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #6c5ce7; color: white; }
                    .completed-section { background-color: #d4edda; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .pending-section { background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .badge { padding: 5px 10px; border-radius: 3px; color: white; font-size: 12px; }
                    .bg-success { background-color: #28a745; }
                    .bg-primary { background-color: #007bff; }
                    .bg-secondary { background-color: #6c757d; }
                    .bg-warning { background-color: #ffc107; color: black; }
                    .bg-danger { background-color: #dc3545; }
                    .bg-info { background-color: #17a2b8; }
                    .bg-dark { background-color: #343a40; }
                    .footer { margin-top: 30px; padding: 15px; background-color: #f4f3f4; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🌆 Relatório Vespertino - Resumo do Dia</h1>
                    <p>Olá ${collaborator.Responsavel}, aqui está o resumo das suas atividades de hoje!</p>
                </div>

                <div class="summary">
                    <h3>📊 Resumo do Dia</h3>
                    <p><strong>✅ Atividades Concluídas:</strong> ${totalCompleted}</p>
                    <p><strong>📋 Atividades Pendentes:</strong> ${totalPending}</p>
                    <p><strong>🚨 Atrasadas:</strong> ${atrasadas}</p>
                    <p><strong>⏸️ Paralisadas:</strong> ${paralisadas}</p>
                    <p><strong>🔄 Em andamento:</strong> ${emAndamento}</p>
                    <p><strong>⏳ Não iniciadas:</strong> ${naoIniciadas}</p>
                    <p><strong>❌ Não realizadas:</strong> ${naoRealizadas}</p>
                    <p><strong>🚫 Canceladas:</strong> ${canceladas}</p>
                    <p><strong>📈 Taxa de Conclusão:</strong> ${totalCompleted + totalPending > 0 ? Math.round((totalCompleted / (totalCompleted + totalPending)) * 100) : 0}%</p>
                </div>

                ${totalCompleted > 0 ? `
                <div class="completed-section">
                    <h3>✅ Atividades Concluídas (${totalCompleted})</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Tarefa</th>
                                <th>Papel</th>
                                <th>Nº Processo</th>
                                <th>Data Conclusão</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${completedHTML}
                        </tbody>
                    </table>
                </div>
                ` : ''}

                ${totalPending > 0 ? `
                <div class="pending-section">
                    <h3>📋 Atividades Pendentes (${totalPending})</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Tarefa</th>
                                <th>Papel</th>
                                <th>Nº Processo</th>
                                <th>Previsão Início</th>
                                <th>Previsão Término</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendingHTML}
                        </tbody>
                    </table>
                </div>
                ` : ''}

                <div class="footer">
                    <p><strong>🎯 Objetivo:</strong> ${atrasadas > 0 ? 'Priorize as atividades atrasadas!' : totalCompleted > 0 ? 'Parabéns pelo trabalho realizado!' : 'Continue focado nas atividades pendentes!'}</p>
                    <p><em>Este relatório foi gerado automaticamente pelo Sirius System.</em></p>
                </div>
            </body>
            </html>
        `;
    },

    // Busca métricas por papel para um dia específico
    getMetricsByRole: async function (date = null) {
        // CORREÇÃO TIMEZONE: Usar timezone brasileiro
        const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        
        const sql = `SELECT 
            Pro.Nome AS Papel,
            CASE 
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                ELSE 'N/A'
            END AS TipoOperacao,
            COUNT(DISTINCT Atv.IdResponsavel) AS TotalColaboradores,
            COUNT(CASE WHEN Atv.Situacao = 1 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS NaoIniciadas,
            COUNT(CASE WHEN Atv.Situacao = 2 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS EmAndamento,
            COUNT(CASE WHEN Atv.Situacao = 3 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS Paralisadas,
            COUNT(CASE WHEN Atv.Situacao = 4 AND CONVERT(VARCHAR(10), Atv.Data_Termino, 120) = '${currentDate}' THEN 1 END) AS Concluidas,
            COUNT(CASE WHEN Atv.Situacao = 5 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS NaoRealizadas,
            COUNT(CASE WHEN Atv.Situacao = 6 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS Canceladas,
            COUNT(CASE WHEN Atv.Situacao IN (1, 2, 3) AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL THEN 1 END) AS Atrasadas
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            mov_logistica_master Lms ON Lhs.IdLogistica_Master = Lms.IdLogistica_Master
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Tar2.Descricao NOT LIKE '%CFG%'
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
            AND Pro.Nome IS NOT NULL
            AND (
                -- Atividades concluídas no dia (Data_Termino = dia atual)
                (Atv.Situacao = 4 AND CONVERT(VARCHAR(10), Atv.Data_Termino, 120) = '${currentDate}')
                -- Atividades com prazo para hoje
                OR (Atv.Situacao IN (1, 2, 3, 5, 6) AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}')
                -- Atividades atrasadas (Previsao_Termino < dia atual e não concluídas/canceladas/não realizadas)
                OR (Atv.Situacao IN (1, 2, 3) AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL)
            )
        GROUP BY 
            Pro.Nome,
            CASE 
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                ELSE 'N/A'
            END
        ORDER BY 
            Pro.Nome ASC,
            TipoOperacao ASC`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Busca detalhes dos colaboradores por papel
    getCollaboratorsDetailsByRole: async function (date = null) {
        // CORREÇÃO TIMEZONE: Usar timezone brasileiro
        const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        
        const sql = `SELECT 
            Pro.Nome AS Papel,
            CASE 
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                ELSE 'N/A'
            END AS TipoOperacao,
            Psa.nome AS Responsavel,
            Psa.EMail,
            COUNT(CASE WHEN Atv.Situacao = 1 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS NaoIniciadas,
            COUNT(CASE WHEN Atv.Situacao = 2 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS EmAndamento,
            COUNT(CASE WHEN Atv.Situacao = 3 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS Paralisadas,
            COUNT(CASE WHEN Atv.Situacao = 4 AND CONVERT(VARCHAR(10), Atv.Data_Termino, 120) = '${currentDate}' THEN 1 END) AS Concluidas,
            COUNT(CASE WHEN Atv.Situacao = 5 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS NaoRealizadas,
            COUNT(CASE WHEN Atv.Situacao = 6 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS Canceladas,
            COUNT(CASE WHEN Atv.Situacao IN (1, 2, 3) AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL THEN 1 END) AS Atrasadas
        FROM 
            mov_Atividade Atv
            LEFT OUTER JOIN 
            mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN 
            mov_logistica_master Lms ON Lhs.IdLogistica_Master = Lms.IdLogistica_Master
            LEFT OUTER JOIN 
            cad_tarefa Tar2 ON Tar2.IdTarefa = Atv.IdTarefa
            LEFT OUTER JOIN 
            cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            LEFT OUTER JOIN
            cad_Papel_Projeto Pro ON Pro.IdPapel_Projeto = Tar2.IdPapel_Projeto
        WHERE 
            Lhs.Situacao_Agenciamento NOT IN (7)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
            AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
            AND Tar2.Descricao NOT LIKE '%CFG%'
            AND Atv.Previsao_Inicio IS NOT NULL
            AND Psa.EMail IS NOT NULL
            AND Psa.EMail != ''
            AND Psa.Ativo = 1
            AND Pro.Nome IS NOT NULL
            AND (
                -- Atividades concluídas no dia (Data_Termino = dia atual)
                (Atv.Situacao = 4 AND CONVERT(VARCHAR(10), Atv.Data_Termino, 120) = '${currentDate}')
                -- Atividades com prazo para hoje
                OR (Atv.Situacao IN (1, 2, 3, 5, 6) AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}')
                -- Atividades atrasadas (Previsao_Termino < dia atual e não concluídas/canceladas/não realizadas)
                OR (Atv.Situacao IN (1, 2, 3) AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL)
            )
        GROUP BY 
            Pro.Nome,
            CASE 
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                ELSE 'N/A'
            END,
            Psa.nome, Psa.EMail
        ORDER BY 
            Pro.Nome ASC,
            TipoOperacao ASC,
            Psa.nome ASC`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Gera HTML do relatório gerencial matinal
    generateManagerMorningReportHTML: function (managerEmail, metricsByRole, collaboratorsDetails) {
        const totalRoles = metricsByRole.length;
        let totalColaboradores = 0;
        let totalConcluidas = 0;
        let totalNaoIniciadas = 0;
        let totalEmAndamento = 0;
        let totalParalisadas = 0;
        let totalNaoRealizadas = 0;
        let totalCanceladas = 0;
        let totalAtrasadas = 0;

        // Calcular totais
        metricsByRole.forEach(metric => {
            totalColaboradores += metric.TotalColaboradores;
            totalConcluidas += metric.Concluidas;
            totalNaoIniciadas += metric.NaoIniciadas;
            totalEmAndamento += metric.EmAndamento;
            totalParalisadas += metric.Paralisadas;
            totalNaoRealizadas += metric.NaoRealizadas;
            totalCanceladas += metric.Canceladas;
            totalAtrasadas += metric.Atrasadas;
        });

        // Agrupar colaboradores por papel
        const collaboratorsByRole = {};
        collaboratorsDetails.forEach(collaborator => {
            if (!collaboratorsByRole[collaborator.Papel]) {
                collaboratorsByRole[collaborator.Papel] = [];
            }
            collaboratorsByRole[collaborator.Papel].push(collaborator);
        });

        let metricsHTML = '';
        metricsByRole.forEach(metric => {
            const totalAtividades = metric.Concluidas + metric.NaoIniciadas + metric.EmAndamento + metric.Paralisadas + metric.NaoRealizadas + metric.Canceladas + metric.Atrasadas;
            const taxaConclusao = totalAtividades > 0 ? Math.round((metric.Concluidas / totalAtividades) * 100) : 0;

            metricsHTML += `
                <tr>
                    <td><strong>${metric.Papel}</strong></td>
                    <td><span class="badge bg-secondary">${metric.TipoOperacao}</span></td>
                    <td>${metric.TotalColaboradores}</td>
                    <td><span class="badge bg-success">✅ ${metric.Concluidas}</span></td>
                    <td><span class="badge bg-secondary">⏳ ${metric.NaoIniciadas}</span></td>
                    <td><span class="badge bg-primary">🔄 ${metric.EmAndamento}</span></td>
                    <td><span class="badge bg-warning">⏸️ ${metric.Paralisadas}</span></td>
                    <td><span class="badge bg-danger">🚨 ${metric.Atrasadas}</span></td>
                    <td><span class="badge bg-info">❌ ${metric.NaoRealizadas}</span></td>
                    <td><span class="badge bg-dark">🚫 ${metric.Canceladas}</span></td>
                    <td><span class="badge bg-info">${taxaConclusao}%</span></td>
                </tr>
            `;
        });

        let collaboratorsHTML = '';
        Object.keys(collaboratorsByRole).forEach(papel => {
            collaboratorsHTML += `
                <div class="role-section" style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                    <h4 style="color: #495057; margin-bottom: 15px;">👥 ${papel}</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #e9ecef;">
                                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6;">Colaborador</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">✅ Concluídas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">⏳ Não iniciadas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">🔄 Em andamento</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">⏸️ Paralisadas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">🚨 Atrasadas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">❌ Não realizadas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">🚫 Canceladas</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            collaboratorsByRole[papel].forEach(collaborator => {
                collaboratorsHTML += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${collaborator.Responsavel}</td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-success">${collaborator.Concluidas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-secondary">${collaborator.NaoIniciadas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-primary">${collaborator.EmAndamento}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-warning">${collaborator.Paralisadas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-danger">${collaborator.Atrasadas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-info">${collaborator.NaoRealizadas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-dark">${collaborator.Canceladas}</span></td>
                    </tr>
                `;
            });

            collaboratorsHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório Gerencial Matinal - Atividades por Papel</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
                    .summary { background-color: #ecf0f1; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #34495e; color: white; }
                    .badge { padding: 5px 10px; border-radius: 3px; color: white; font-size: 12px; }
                    .bg-success { background-color: #27ae60; }
                    .bg-primary { background-color: #3498db; }
                    .bg-secondary { background-color: #95a5a6; }
                    .bg-warning { background-color: #f39c12; }
                    .bg-danger { background-color: #e74c3c; }
                    .bg-info { background-color: #17a2b8; }
                    .bg-dark { background-color: #2c3e50; }
                    .footer { margin-top: 30px; padding: 15px; background-color: #ecf0f1; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 Relatório Gerencial Matinal - Atividades por Papel</h1>
                    <p>Olá Gestor, aqui está o resumo das atividades de todos os colaboradores por papel!</p>
                </div>

                <div class="summary">
                    <h3>📈 Resumo Geral</h3>
                    <p><strong>Total de Papéis:</strong> ${totalRoles}</p>
                    <p><strong>Total de Colaboradores:</strong> ${totalColaboradores}</p>
                    <p><strong>✅ Concluídas:</strong> ${totalConcluidas}</p>
                    <p><strong>⏳ Não iniciadas:</strong> ${totalNaoIniciadas}</p>
                    <p><strong>🔄 Em andamento:</strong> ${totalEmAndamento}</p>
                    <p><strong>⏸️ Paralisadas:</strong> ${totalParalisadas}</p>
                    <p><strong>🚨 Atrasadas:</strong> ${totalAtrasadas}</p>
                    <p><strong>❌ Não realizadas:</strong> ${totalNaoRealizadas}</p>
                    <p><strong>🚫 Canceladas:</strong> ${totalCanceladas}</p>
                </div>

                <h3>📋 Métricas por Papel</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Papel</th>
                            <th>Tipo Operação</th>
                            <th>Colaboradores</th>
                            <th>✅ Concluídas</th>
                            <th>⏳ Não iniciadas</th>
                            <th>🔄 Em andamento</th>
                            <th>⏸️ Paralisadas</th>
                            <th>🚨 Atrasadas</th>
                            <th>❌ Não realizadas</th>
                            <th>🚫 Canceladas</th>
                            <th>Taxa Conclusão</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${metricsHTML}
                    </tbody>
                </table>

                <h3>👥 Detalhes por Colaborador</h3>
                ${collaboratorsHTML}

                <div class="footer">
                    <p><strong>💡 Dica:</strong> Foque nos papéis com mais atividades atrasadas e paralisadas, e apoie os colaboradores que precisam de ajuda!</p>
                    <p><em>Este relatório foi gerado automaticamente pelo Sirius System.</em></p>
                </div>
            </body>
            </html>
        `;
    },

    // Gera HTML do relatório gerencial vespertino
    generateManagerEveningReportHTML: function (managerEmail, metricsByRole, collaboratorsDetails) {
        const totalRoles = metricsByRole.length;
        let totalColaboradores = 0;
        let totalConcluidas = 0;
        let totalNaoIniciadas = 0;
        let totalEmAndamento = 0;
        let totalParalisadas = 0;
        let totalNaoRealizadas = 0;
        let totalCanceladas = 0;
        let totalAtrasadas = 0;

        // Calcular totais
        metricsByRole.forEach(metric => {
            totalColaboradores += metric.TotalColaboradores;
            totalConcluidas += metric.Concluidas;
            totalNaoIniciadas += metric.NaoIniciadas;
            totalEmAndamento += metric.EmAndamento;
            totalParalisadas += metric.Paralisadas;
            totalNaoRealizadas += metric.NaoRealizadas;
            totalCanceladas += metric.Canceladas;
            totalAtrasadas += metric.Atrasadas;
        });

        // Agrupar colaboradores por papel
        const collaboratorsByRole = {};
        collaboratorsDetails.forEach(collaborator => {
            if (!collaboratorsByRole[collaborator.Papel]) {
                collaboratorsByRole[collaborator.Papel] = [];
            }
            collaboratorsByRole[collaborator.Papel].push(collaborator);
        });

        let metricsHTML = '';
        metricsByRole.forEach(metric => {
            const totalAtividades = metric.Concluidas + metric.NaoIniciadas + metric.EmAndamento + metric.Paralisadas + metric.NaoRealizadas + metric.Canceladas + metric.Atrasadas;
            const taxaConclusao = totalAtividades > 0 ? Math.round((metric.Concluidas / totalAtividades) * 100) : 0;

            metricsHTML += `
                <tr>
                    <td><strong>${metric.Papel}</strong></td>
                    <td><span class="badge bg-secondary">${metric.TipoOperacao}</span></td>
                    <td>${metric.TotalColaboradores}</td>
                    <td><span class="badge bg-success">✅ ${metric.Concluidas}</span></td>
                    <td><span class="badge bg-secondary">⏳ ${metric.NaoIniciadas}</span></td>
                    <td><span class="badge bg-primary">🔄 ${metric.EmAndamento}</span></td>
                    <td><span class="badge bg-warning">⏸️ ${metric.Paralisadas}</span></td>
                    <td><span class="badge bg-danger">🚨 ${metric.Atrasadas}</span></td>
                    <td><span class="badge bg-info">❌ ${metric.NaoRealizadas}</span></td>
                    <td><span class="badge bg-dark">🚫 ${metric.Canceladas}</span></td>
                    <td><span class="badge bg-info">${taxaConclusao}%</span></td>
                </tr>
            `;
        });

        let collaboratorsHTML = '';
        Object.keys(collaboratorsByRole).forEach(papel => {
            collaboratorsHTML += `
                <div class="role-section" style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                    <h4 style="color: #495057; margin-bottom: 15px;">👥 ${papel}</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #e9ecef;">
                                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6;">Colaborador</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">Tipo</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">✅ Concluídas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">⏳ Não iniciadas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">🔄 Em andamento</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">⏸️ Paralisadas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">🚨 Atrasadas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">❌ Não realizadas</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">🚫 Canceladas</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            collaboratorsByRole[papel].forEach(collaborator => {
                collaboratorsHTML += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${collaborator.Responsavel}</td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-secondary">${collaborator.TipoOperacao}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-success">${collaborator.Concluidas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-secondary">${collaborator.NaoIniciadas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-primary">${collaborator.EmAndamento}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-warning">${collaborator.Paralisadas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-danger">${collaborator.Atrasadas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-info">${collaborator.NaoRealizadas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-dark">${collaborator.Canceladas}</span></td>
                    </tr>
                `;
            });

            collaboratorsHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório Gerencial Vespertino - Resumo do Dia</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background-color: #8e44ad; color: white; padding: 20px; border-radius: 5px; }
                    .summary { background-color: #f4f3f4; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #6c5ce7; color: white; }
                    .badge { padding: 5px 10px; border-radius: 3px; color: white; font-size: 12px; }
                    .bg-success { background-color: #27ae60; }
                    .bg-primary { background-color: #3498db; }
                    .bg-secondary { background-color: #95a5a6; }
                    .bg-warning { background-color: #f39c12; }
                    .bg-danger { background-color: #e74c3c; }
                    .bg-info { background-color: #17a2b8; }
                    .bg-dark { background-color: #2c3e50; }
                    .footer { margin-top: 30px; padding: 15px; background-color: #f4f3f4; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 Relatório Gerencial Vespertino - Resumo do Dia</h1>
                    <p>Olá Gestor, aqui está o resumo final das atividades de todos os colaboradores por papel!</p>
                </div>

                <div class="summary">
                    <h3>📈 Resumo Geral do Dia</h3>
                    <p><strong>Total de Papéis:</strong> ${totalRoles}</p>
                    <p><strong>Total de Colaboradores:</strong> ${totalColaboradores}</p>
                    <p><strong>✅ Concluídas:</strong> ${totalConcluidas}</p>
                    <p><strong>⏳ Não iniciadas:</strong> ${totalNaoIniciadas}</p>
                    <p><strong>🔄 Em andamento:</strong> ${totalEmAndamento}</p>
                    <p><strong>⏸️ Paralisadas:</strong> ${totalParalisadas}</p>
                    <p><strong>🚨 Atrasadas:</strong> ${totalAtrasadas}</p>
                    <p><strong>❌ Não realizadas:</strong> ${totalNaoRealizadas}</p>
                    <p><strong>🚫 Canceladas:</strong> ${totalCanceladas}</p>
                    <p><strong>📊 Taxa de Conclusão Geral:</strong> ${totalConcluidas + totalNaoIniciadas + totalEmAndamento + totalParalisadas + totalNaoRealizadas + totalCanceladas + totalAtrasadas > 0 ? Math.round((totalConcluidas / (totalConcluidas + totalNaoIniciadas + totalEmAndamento + totalParalisadas + totalNaoRealizadas + totalCanceladas + totalAtrasadas)) * 100) : 0}%</p>
                </div>

                <h3>📋 Métricas por Papel</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Papel</th>
                            <th>Tipo Operação</th>
                            <th>Colaboradores</th>
                            <th>✅ Concluídas</th>
                            <th>⏳ Não iniciadas</th>
                            <th>🔄 Em andamento</th>
                            <th>⏸️ Paralisadas</th>
                            <th>🚨 Atrasadas</th>
                            <th>❌ Não realizadas</th>
                            <th>🚫 Canceladas</th>
                            <th>Taxa Conclusão</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${metricsHTML}
                    </tbody>
                </table>

                <h3>👥 Detalhes por Colaborador</h3>
                ${collaboratorsHTML}

                <div class="footer">
                    <p><strong>🎯 Objetivo:</strong> ${totalAtrasadas > 0 ? 'Ainda há atividades atrasadas que precisam de atenção!' : totalConcluidas > 0 ? 'Excelente trabalho da equipe!' : 'Continue focado nas atividades pendentes!'}</p>
                    <p><em>Este relatório foi gerado automaticamente pelo Sirius System.</em></p>
                </div>
            </body>
            </html>
        `;
    },

    // Envia relatório gerencial matinal para gestores
    sendManagerMorningReports: async function (date = null) {
        try {
            const metricsByRole = await this.getMetricsByRole(date);
            const collaboratorsDetails = await this.getCollaboratorsDetailsByRole(date);
            const allManagers = this.getAllManagers();

            console.log(`📧 Enviando relatórios gerenciais matinais para gestores...`);

            // Agrupar métricas por papel e tipo de operação
            const groupedMetrics = {};
            metricsByRole.forEach(metric => {
                const key = `${metric.Papel}_${metric.TipoOperacao}`;
                if (!groupedMetrics[key]) {
                    groupedMetrics[key] = [];
                }
                groupedMetrics[key].push(metric);
            });

            // Agrupar colaboradores por papel e tipo de operação
            const groupedCollaborators = {};
            collaboratorsDetails.forEach(collaborator => {
                const key = `${collaborator.Papel}_${collaborator.TipoOperacao}`;
                if (!groupedCollaborators[key]) {
                    groupedCollaborators[key] = [];
                }
                groupedCollaborators[key].push(collaborator);
            });

            let reportsSent = 0;
            for (const [managerKey, manager] of Object.entries(allManagers)) {
                let managerMetrics = [];
                let managerCollaborators = [];

                if (manager.type === 'direct') {
                    // Gestor direto - apenas um papel
                    managerMetrics = groupedMetrics[managerKey] || [];
                    managerCollaborators = groupedCollaborators[managerKey] || [];
                } else {
                    // Gestor de grupo - múltiplos papéis
                    manager.roles.forEach(roleKey => {
                        if (groupedMetrics[roleKey]) {
                            managerMetrics = managerMetrics.concat(groupedMetrics[roleKey]);
                        }
                        if (groupedCollaborators[roleKey]) {
                            managerCollaborators = managerCollaborators.concat(groupedCollaborators[roleKey]);
                        }
                    });
                }

                if (managerMetrics.length > 0 || managerCollaborators.length > 0) {
                    const htmlContent = this.generateManagerMorningReportHTML(manager.email, managerMetrics, managerCollaborators);
                    
                    // Usar sistema de log
                    await this.sendEmailWithLog({
                        type: 'morning_manager',
                        recipientEmail: manager.email,
                        recipientName: manager.name,
                        subject: `📊 [Sirius System] Relatório Gerencial Matinal - ${manager.name} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
                    });

                    console.log(`✅ Relatório matinal enviado para ${manager.name} (${manager.email})`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhuma atividade encontrada para ${manager.name}`);
                }

                // Aguarda 1 segundo entre os envios
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`✅ Relatórios gerenciais matinais enviados com sucesso! (${reportsSent} relatórios)`);
        } catch (error) {
            console.error(`❌ Erro ao enviar relatórios gerenciais matinais:`, error);
        }
    },

    // Envia relatório gerencial vespertino para gestores
    sendManagerEveningReports: async function (date = null) {
        try {
            const metricsByRole = await this.getMetricsByRole(date);
            const collaboratorsDetails = await this.getCollaboratorsDetailsByRole(date);
            const allManagers = this.getAllManagers();

            console.log(`📧 Enviando relatórios gerenciais vespertinos para gestores...`);

            // Agrupar métricas por papel e tipo de operação
            const groupedMetrics = {};
            metricsByRole.forEach(metric => {
                const key = `${metric.Papel}_${metric.TipoOperacao}`;
                if (!groupedMetrics[key]) {
                    groupedMetrics[key] = [];
                }
                groupedMetrics[key].push(metric);
            });

            // Agrupar colaboradores por papel e tipo de operação
            const groupedCollaborators = {};
            collaboratorsDetails.forEach(collaborator => {
                const key = `${collaborator.Papel}_${collaborator.TipoOperacao}`;
                if (!groupedCollaborators[key]) {
                    groupedCollaborators[key] = [];
                }
                groupedCollaborators[key].push(collaborator);
            });

            let reportsSent = 0;
            for (const [managerKey, manager] of Object.entries(allManagers)) {
                let managerMetrics = [];
                let managerCollaborators = [];

                if (manager.type === 'direct') {
                    // Gestor direto - apenas um papel
                    managerMetrics = groupedMetrics[managerKey] || [];
                    managerCollaborators = groupedCollaborators[managerKey] || [];
                } else {
                    // Gestor de grupo - múltiplos papéis
                    manager.roles.forEach(roleKey => {
                        if (groupedMetrics[roleKey]) {
                            managerMetrics = managerMetrics.concat(groupedMetrics[roleKey]);
                        }
                        if (groupedCollaborators[roleKey]) {
                            managerCollaborators = managerCollaborators.concat(groupedCollaborators[roleKey]);
                        }
                    });
                }

                if (managerMetrics.length > 0 || managerCollaborators.length > 0) {
                    const htmlContent = this.generateManagerEveningReportHTML(manager.email, managerMetrics, managerCollaborators);
                    
                    // Usar sistema de log
                    await this.sendEmailWithLog({
                        type: 'evening_manager',
                        recipientEmail: manager.email,
                        recipientName: manager.name,
                        subject: `📊 [Sirius System] Relatório Gerencial Vespertino - ${manager.name} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
                    });

                    console.log(`✅ Relatório vespertino enviado para ${manager.name} (${manager.email})`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhuma atividade encontrada para ${manager.name}`);
                }

                // Aguarda 1 segundo entre os envios
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`✅ Relatórios gerenciais vespertinos enviados com sucesso! (${reportsSent} relatórios)`);
        } catch (error) {
            console.error(`❌ Erro ao enviar relatórios gerenciais vespertinos:`, error);
        }
    },

    // ========================================
    // FUNÇÕES DE LOG E AGENDAMENTO
    // ========================================

    // Registra log de envio de email
    logEmailSend: async function (emailData) {
        try {
            const sql = `INSERT INTO active_logs_headcargo_email_sends (
                email_type,
                recipient_email,
                recipient_name,
                subject,
                status,
                error_message,
                sent_at,
                retry_count,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`;

            const values = [
                emailData.type, // 'morning_individual', 'evening_individual', 'morning_manager', 'evening_manager'
                emailData.recipientEmail,
                emailData.recipientName,
                emailData.subject,
                emailData.status, // 'success', 'error'
                emailData.errorMessage || null,
                emailData.retryCount || 0
            ];

            await executeQuery(sql, values);
            console.log(`📝 Log registrado: ${emailData.type} - ${emailData.status} - ${emailData.recipientEmail}`);
        } catch (error) {
            console.error('❌ Erro ao registrar log de email:', error);
        }
    },

    // Verifica se o email foi enviado hoje
    checkEmailSentToday: async function (emailType, recipientEmail, date = null) {
        try {
            const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
            
            const sql = `SELECT COUNT(*) as count 
                        FROM active_logs_headcargo_email_sends 
                        WHERE email_type = ? 
                        AND recipient_email = ? 
                        AND status = 'success'
                        AND DATE(sent_at) = ?`;

            const result = await executeQuery(sql, [emailType, recipientEmail, currentDate]);
            return result[0].count > 0;
        } catch (error) {
            console.error('❌ Erro ao verificar email enviado:', error);
            return false;
        }
    },

    // Busca emails com erro para retry
    getFailedEmailsForRetry: async function (maxRetries = 3) {
        try {
            const sql = `SELECT * FROM active_logs_headcargo_email_sends 
                        WHERE status = 'error' 
                        AND retry_count < ? 
                        AND sent_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                        ORDER BY sent_at ASC`;

            const result = await executeQuery(sql, [maxRetries]);
            return result;
        } catch (error) {
            console.error('❌ Erro ao buscar emails com falha:', error);
            return [];
        }
    },

    // Atualiza contador de retry
    updateRetryCount: async function (logId, retryCount) {
        try {
            const sql = `UPDATE active_logs_headcargo_email_sends 
                        SET retry_count = ?, updated_at = NOW() 
                        WHERE id = ?`;

            await executeQuery(sql, [retryCount, logId]);
        } catch (error) {
            console.error('❌ Erro ao atualizar retry count:', error);
        }
    },

    // Função para enviar email com log
    sendEmailWithLog: async function (emailData) {
        try {
            // Verificar se já foi enviado hoje
            const alreadySent = await this.checkEmailSentToday(
                emailData.type, 
                emailData.recipientEmail, 
                emailData.date
            );

            if (alreadySent) {
                console.log(`📧 Email ${emailData.type} já enviado hoje para ${emailData.recipientEmail}`);
                return true;
            }

            // Enviar email
            await sendEmail(
                emailData.recipientEmail,
                emailData.subject,
                emailData.htmlContent
            );

            // Registrar sucesso
            await this.logEmailSend({
                ...emailData,
                status: 'success',
                errorMessage: null
            });

            console.log(`✅ Email ${emailData.type} enviado com sucesso para ${emailData.recipientEmail}`);
            return true;

        } catch (error) {
            // Registrar erro
            await this.logEmailSend({
                ...emailData,
                status: 'error',
                errorMessage: error.message
            });

            console.error(`❌ Erro ao enviar email ${emailData.type} para ${emailData.recipientEmail}:`, error);
            return false;
        }
    },

    // Função para retry de emails com falha
    retryFailedEmails: async function () {
        try {
            console.log('🔄 Iniciando retry de emails com falha...');
            
            // Buscar configurações de retry
            const config = await this.getEmailConfig();
            const maxRetries = parseInt(config.max_retries) || 3;
            
            const failedEmails = await this.getFailedEmailsForRetry(maxRetries);
            
            if (failedEmails.length === 0) {
                console.log('✅ Nenhum email com falha para retry');
                return;
            }

            console.log(`📧 Encontrados ${failedEmails.length} emails com falha para retry (máximo ${maxRetries} tentativas)`);

            for (const failedEmail of failedEmails) {
                try {
                    // Reenviar email baseado no tipo
                    let success = false;
                    
                    switch (failedEmail.email_type) {
                        case 'morning_individual':
                            // Reenviar relatório matinal individual
                            const morningActivities = await this.getTodayActivities(failedEmail.recipient_name, failedEmail.sent_at);
                            if (morningActivities.length > 0) {
                                const collaborator = morningActivities[0];
                                const htmlContent = this.generateMorningReportHTML(collaborator, morningActivities);
                                await sendEmail(
                                    failedEmail.recipient_email,
                                    `🌅 [Sirius System] Suas Atividades para Hoje - ${new Date().toLocaleDateString('pt-BR')}`,
                                    htmlContent
                                );
                                success = true;
                            }
                            break;
                        case 'evening_individual':
                            // Reenviar relatório vespertino individual
                            const completedActivities = await this.getCompletedTodayActivities(failedEmail.recipient_name, failedEmail.sent_at);
                            const pendingActivities = await this.getAllPendingActivities(failedEmail.recipient_name, failedEmail.sent_at);
                            
                            if (completedActivities.length > 0 || pendingActivities.length > 0) {
                                const collaborator = completedActivities.length > 0 ? completedActivities[0] : pendingActivities[0];
                                const htmlContent = this.generateEveningReportHTML(collaborator, completedActivities, pendingActivities);
                                await sendEmail(
                                    failedEmail.recipient_email,
                                    `🌆 [Sirius System] Resumo do Seu Dia - ${new Date().toLocaleDateString('pt-BR')}`,
                                    htmlContent
                                );
                                success = true;
                            }
                            break;
                        case 'morning_manager':
                            success = await this.sendManagerMorningReports(failedEmail.sent_at);
                            break;
                        case 'evening_manager':
                            success = await this.sendManagerEveningReports(failedEmail.sent_at);
                            break;
                    }

                    if (success) {
                        // Atualizar status para sucesso
                        await executeQuery(
                            `UPDATE active_logs_headcargo_email_sends 
                             SET status = 'success', retry_count = retry_count + 1, updated_at = NOW() 
                             WHERE id = ?`,
                            [failedEmail.id]
                        );
                        console.log(`✅ Retry bem-sucedido para email ID ${failedEmail.id}`);
                    } else {
                        // Incrementar retry count
                        await this.updateRetryCount(failedEmail.id, failedEmail.retry_count + 1);
                        console.log(`❌ Retry falhou para email ID ${failedEmail.id}`);
                    }

                } catch (error) {
                    console.error(`❌ Erro no retry do email ID ${failedEmail.id}:`, error);
                    await this.updateRetryCount(failedEmail.id, failedEmail.retry_count + 1);
                }

                // Aguardar entre retries (delay configurável)
                const emailDelay = parseInt(config.email_delay_seconds) || 1;
                await new Promise(resolve => setTimeout(resolve, emailDelay * 1000));
            }

            console.log('✅ Processo de retry concluído');

        } catch (error) {
            console.error('❌ Erro no processo de retry:', error);
        }
    },

    // Função principal de agendamento com verificação de ambiente
    scheduleEmailReports: async function () {
        try {
            // Verificar se já está executando
            if (this.isScheduling) {
                console.log('⚠️ Agendamento já está em execução, aguardando...');
                return;
            }
            
            this.isScheduling = true;

            // Verificar se está em modo produção
            if (process.env.NODE_ENV !== 'production') {
                console.log('⚠️ Agendamento de emails só funciona em modo production');
                this.isScheduling = false;
                return;
            }

            // Buscar configurações da tabela
            const config = await this.getEmailConfig();
            
            // Verificar se o agendamento está habilitado
            if (config.production_mode_only === 'true' && process.env.NODE_ENV !== 'production') {
                console.log('⚠️ Agendamento desabilitado - só funciona em modo production');
                this.isScheduling = false;
                return;
            }

            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            console.log(`🕐 Verificando agendamento: ${currentHour}:${currentMinute} - Modo: ${process.env.NODE_ENV}`);

            // Relatórios matinais - horário configurável
            const morningTime = config.morning_time || '06:30';
            const [morningHour, morningMinute] = morningTime.split(':').map(Number);
            
            if (currentHour === morningHour && currentMinute === morningMinute) {
                console.log('🌅 Iniciando envio de relatórios matinais...');
                
                // Enviar relatórios individuais apenas para colaboradores com gestores configurados
                const collaboratorsWithManagers = await this.getCollaboratorsWithManagers();
                console.log(`📧 Enviando relatórios matinais para ${collaboratorsWithManagers.length} colaboradores com gestores configurados`);
                
                const emailDelay = parseInt(config.email_delay_seconds) || 1;
                
                for (const collaborator of collaboratorsWithManagers) {
                    await this.sendEmailWithLog({
                        type: 'morning_individual',
                        recipientEmail: collaborator.EMail,
                        recipientName: collaborator.Responsavel,
                        subject: `🌅 [Sirius System] Suas Atividades para Hoje - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: await this.generateMorningReportHTML(collaborator, await this.getTodayActivities(collaborator.IdResponsavel)),
                        date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
                    });
                    await new Promise(resolve => setTimeout(resolve, emailDelay * 1000));
                }
                
                // Enviar relatórios gerenciais
                await this.sendManagerMorningReports();
                
                console.log('✅ Relatórios matinais enviados');
            }
            
            // Relatórios vespertinos - horário configurável
            const eveningTime = config.evening_time || '17:45';
            const [eveningHour, eveningMinute] = eveningTime.split(':').map(Number);
            
            if (currentHour === eveningHour && currentMinute === eveningMinute) {
                console.log('🌆 Iniciando envio de relatórios vespertinos...');
                
                // Enviar relatórios individuais apenas para colaboradores com gestores configurados
                const collaboratorsWithManagers = await this.getCollaboratorsWithManagers();
                console.log(`📧 Enviando relatórios vespertinos para ${collaboratorsWithManagers.length} colaboradores com gestores configurados`);
                
                const emailDelay = parseInt(config.email_delay_seconds) || 1;
                
                for (const collaborator of collaboratorsWithManagers) {
                    const completedActivities = await this.getCompletedTodayActivities(collaborator.IdResponsavel);
                    const pendingActivities = await this.getAllPendingActivities(collaborator.IdResponsavel);
                    
                    await this.sendEmailWithLog({
                        type: 'evening_individual',
                        recipientEmail: collaborator.EMail,
                        recipientName: collaborator.Responsavel,
                        subject: `🌆 [Sirius System] Resumo do Seu Dia - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: await this.generateEveningReportHTML(collaborator, completedActivities, pendingActivities),
                        date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
                    });
                    await new Promise(resolve => setTimeout(resolve, emailDelay * 1000));
                }
                
                // Enviar relatórios gerenciais
                await this.sendManagerEveningReports();
                
                console.log('✅ Relatórios vespertinos enviados');
            }

            // Retry de emails com falha - intervalo configurável
            const retryInterval = parseInt(config.retry_interval_hours) || 1;
            if (currentMinute === 0 && currentHour % retryInterval === 0) {
                if (config.enable_retry === 'true') {
                    await this.retryFailedEmails();
                }
            }

        } catch (error) {
            console.error('❌ Erro no agendamento de emails:', error);
        } finally {
            this.isScheduling = false;
        }
    },

    // Função para iniciar o agendamento
    startEmailScheduler: function () {
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️ Scheduler só funciona em modo production');
            return;
        }

        // Verificar se já existe um scheduler rodando
        if (this.schedulerInterval) {
            console.log('⚠️ Scheduler já está rodando');
            return;
        }

        console.log('🚀 Iniciando agendamento de emails...');
        
        // Executar verificação a cada minuto
        this.schedulerInterval = setInterval(() => {
            this.scheduleEmailReports();
        }, 60000); // 60 segundos

        console.log('✅ Scheduler iniciado - verificando a cada minuto');
    },

    // Verifica se um colaborador tem gestor configurado
    hasManagerConfigured: function (collaborator) {
        try {
            const managersByRole = this.getManagersByRole();
            const papelTipo = `${collaborator.Papel_Responsavel}_${collaborator.TipoOperacao}`;
            
            // Verificar se existe gestor configurado para este papel/tipo
            return managersByRole.hasOwnProperty(papelTipo) && managersByRole[papelTipo];
        } catch (error) {
            console.error('❌ Erro ao verificar gestor configurado:', error);
            return false;
        }
    },

    // Busca colaboradores que têm gestores configurados
    getCollaboratorsWithManagers: async function () {
        try {
            const collaborators = await this.getUniqueCollaborators();
            const managersByRole = this.getManagersByRole();
            
            // Agrupar todos os papéis/tipos por email
            const papelPorEmail = {};
            collaborators.forEach(colab => {
                const email = colab.EMail;
                if (!papelPorEmail[email]) papelPorEmail[email] = [];
                papelPorEmail[email].push(colab);
            });
            
            // Para cada colaborador, retorna apenas o papel/tipo que tem gestor configurado
            const colaboradoresComGestor = [];
            Object.values(papelPorEmail).forEach(colabList => {
                // Procura o papel/tipo exato que tem gestor
                const colabComGestor = colabList.find(colab => {
                    const papelTipo = `${colab.Papel_Responsavel}_${colab.TipoOperacao}`;
                    return managersByRole.hasOwnProperty(papelTipo) && managersByRole[papelTipo];
                });
                if (colabComGestor) {
                    colaboradoresComGestor.push(colabComGestor);
                }
            });
            
            console.log(`📊 Colaboradores com gestores configurados: ${colaboradoresComGestor.length}/${Object.keys(papelPorEmail).length} (${collaborators.length} total de papéis)`);
            return colaboradoresComGestor;
        } catch (error) {
            console.error('❌ Erro ao buscar colaboradores com gestores:', error);
            return [];
        }
    },

    // Busca configurações da tabela
    getEmailConfig: async function (configKey = null) {
        try {
            let sql = `SELECT config_key, config_value, description, is_active 
                       FROM active_logs_headcargo_email_config 
                       WHERE is_active = TRUE`;
            
            if (configKey) {
                sql += ` AND config_key = ?`;
                const result = await executeQuery(sql, [configKey]);
                return result.length > 0 ? result[0].config_value : null;
            } else {
                const result = await executeQuery(sql);
                const config = {};
                result.forEach(row => {
                    config[row.config_key] = row.config_value;
                });
                return config;
            }
        } catch (error) {
            console.error('❌ Erro ao buscar configurações:', error);
            return configKey ? null : {};
        }
    },

    // Atualiza configuração na tabela
    updateEmailConfig: async function (configKey, configValue, description = null) {
        try {
            const sql = `INSERT INTO active_logs_headcargo_email_config (config_key, config_value, description, is_active) 
                        VALUES (?, ?, ?, TRUE)
                        ON DUPLICATE KEY UPDATE 
                        config_value = VALUES(config_value),
                        description = COALESCE(VALUES(description), description),
                        updated_at = NOW()`;

            await executeQuery(sql, [configKey, configValue, description]);
            console.log(`✅ Configuração atualizada: ${configKey} = ${configValue}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar configuração:', error);
            return false;
        }
    },

    // Função para atualizar horários dos relatórios
    updateEmailSchedule: async function (morningTime = '06:30', eveningTime = '17:45') {
        try {
            await this.updateEmailConfig('morning_time', morningTime, 'Horário para envio dos relatórios matinais');
            await this.updateEmailConfig('evening_time', eveningTime, 'Horário para envio dos relatórios vespertinos');
            console.log(`✅ Horários atualizados: Matinal ${morningTime}, Vespertino ${eveningTime}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar horários:', error);
            return false;
        }
    },

    // Função para atualizar configurações de retry
    updateRetryConfig: async function (maxRetries = 3, retryIntervalHours = 1) {
        try {
            await this.updateEmailConfig('max_retries', maxRetries.toString(), 'Número máximo de tentativas de reenvio');
            await this.updateEmailConfig('retry_interval_hours', retryIntervalHours.toString(), 'Intervalo em horas para retry de emails com falha');
            console.log(`✅ Configurações de retry atualizadas: Máximo ${maxRetries} tentativas, intervalo ${retryIntervalHours}h`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar configurações de retry:', error);
            return false;
        }
    },

    // Função para mostrar configurações atuais
    showEmailConfig: async function () {
        try {
            const config = await this.getEmailConfig();
            console.log('📋 Configurações atuais do sistema de emails:');
            console.log('==========================================');
            Object.entries(config).forEach(([key, value]) => {
                console.log(`${key}: ${value}`);
            });
            console.log('==========================================');
            return config;
        } catch (error) {
            console.error('❌ Erro ao mostrar configurações:', error);
            return {};
        }
    },

    // Função para testar envio de relatórios para um colaborador específico
    testSendReportToCollaborator: async function (collaboratorId, reportType = 'both', date = null) {
        try {
            console.log(`🧪 Iniciando teste de envio de relatórios para colaborador ID: ${collaboratorId}`);
            
            // Buscar dados do colaborador
            const collaborators = await this.getUniqueCollaborators();
            const collaborator = collaborators.find(c => c.IdResponsavel == collaboratorId);
            
            if (!collaborator) {
                console.error(`❌ Colaborador com ID ${collaboratorId} não encontrado`);
                return false;
            }
            
            console.log(`👤 Colaborador encontrado: ${collaborator.Responsavel} (${collaborator.EMail})`);
            console.log(`📋 Papel: ${collaborator.Papel_Responsavel} - Tipo: ${collaborator.TipoOperacao}`);
            
            const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
            console.log(`📅 Data do teste: ${currentDate}`);
            
            let reportsSent = 0;
            
            // Enviar relatório matinal
            if (reportType === 'morning' || reportType === 'both') {
                console.log('🌅 Enviando relatório matinal...');
                
                const morningActivities = await this.getTodayActivities(collaboratorId, currentDate);
                console.log(`📊 Atividades encontradas para o matinal: ${morningActivities.length}`);
                
                if (morningActivities.length > 0) {
                    const htmlContent = this.generateMorningReportHTML(collaborator, morningActivities);
                    
                    await this.sendEmailWithLog({
                        type: 'morning_individual',
                        recipientEmail: 'petryck.leite@conlinebr.com.br',//collaborator.EMail,
                        recipientName: collaborator.Responsavel,
                        subject: `🧪 [TESTE] Relatório Matinal - ${collaborator.Responsavel} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: currentDate
                    });
                    
                    console.log(`✅ Relatório matinal enviado com sucesso para ${collaborator.Responsavel}`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhuma atividade encontrada para o relatório matinal`);
                }
            }
            
            // Enviar relatório vespertino
            if (reportType === 'evening' || reportType === 'both') {
                console.log('🌆 Enviando relatório vespertino...');
                
                const completedActivities = await this.getCompletedTodayActivities(collaboratorId, currentDate);
                const pendingActivities = await this.getAllPendingActivities(collaboratorId, currentDate);
                
                console.log(`📊 Atividades concluídas: ${completedActivities.length}`);
                console.log(`📊 Atividades pendentes: ${pendingActivities.length}`);
                
                if (completedActivities.length > 0 || pendingActivities.length > 0) {
                    const htmlContent = this.generateEveningReportHTML(collaborator, completedActivities, pendingActivities);
                    
                    await this.sendEmailWithLog({
                        type: 'evening_individual',
                        recipientEmail: collaborator.EMail,
                        recipientName: collaborator.Responsavel,
                        subject: `🧪 [TESTE] Relatório Vespertino - ${collaborator.Responsavel} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: currentDate
                    });
                    
                    console.log(`✅ Relatório vespertino enviado com sucesso para ${collaborator.Responsavel}`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhuma atividade encontrada para o relatório vespertino`);
                }
            }
            
            console.log(`🎯 Teste concluído! ${reportsSent} relatório(s) enviado(s) para ${collaborator.Responsavel}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro no teste de envio:`, error);
            return false;
        }
    },

    // Função para testar relatórios gerenciais para um papel específico
    testSendManagerReport: async function (papelTipo, reportType = 'both', date = null) {
        try {
            console.log(`🧪 Iniciando teste de relatório gerencial para papel: ${papelTipo}`);
            
            const managersByRole = this.getManagersByRole();
            const managerEmail = managersByRole[papelTipo];
            
            if (!managerEmail) {
                console.error(`❌ Gestor não configurado para ${papelTipo}`);
                return false;
            }
            
            console.log(`👤 Gestor encontrado: ${managerEmail}`);
            
            const currentDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
            console.log(`📅 Data do teste: ${currentDate}`);
            
            let reportsSent = 0;
            
            // Enviar relatório gerencial matinal
            if (reportType === 'morning' || reportType === 'both') {
                console.log('🌅 Enviando relatório gerencial matinal...');
                
                const metricsByRole = await this.getMetricsByRole(currentDate);
                const collaboratorsDetails = await this.getCollaboratorsDetailsByRole(currentDate);
                
                // Filtrar apenas dados do papel específico
                const papelMetrics = metricsByRole.filter(m => `${m.Papel}_${m.TipoOperacao}` === papelTipo);
                const papelCollaborators = collaboratorsDetails.filter(c => `${c.Papel}_${c.TipoOperacao}` === papelTipo);
                
                console.log(`📊 Métricas encontradas: ${papelMetrics.length}`);
                console.log(`👥 Colaboradores encontrados: ${papelCollaborators.length}`);
                
                if (papelMetrics.length > 0 || papelCollaborators.length > 0) {
                    const htmlContent = this.generateManagerMorningReportHTML(managerEmail, papelMetrics, papelCollaborators);
                    
                    await this.sendEmailWithLog({
                        type: 'morning_manager',
                        recipientEmail: 'petryck.leite@conlinebr.com.br',//managerEmail,
                        recipientName: `Gestor ${papelTipo}`,
                        subject: `🧪 [TESTE] Relatório Gerencial Matinal - ${papelTipo} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: currentDate
                    });
                    
                    console.log(`✅ Relatório gerencial matinal enviado com sucesso para ${managerEmail}`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhum dado encontrado para o relatório gerencial matinal`);
                }
            }
            
            // Enviar relatório gerencial vespertino
            if (reportType === 'evening' || reportType === 'both') {
                console.log('🌆 Enviando relatório gerencial vespertino...');
                
                const metricsByRole = await this.getMetricsByRole(currentDate);
                const collaboratorsDetails = await this.getCollaboratorsDetailsByRole(currentDate);
                
                // Filtrar apenas dados do papel específico
                const papelMetrics = metricsByRole.filter(m => `${m.Papel}_${m.TipoOperacao}` === papelTipo);
                const papelCollaborators = collaboratorsDetails.filter(c => `${c.Papel}_${c.TipoOperacao}` === papelTipo);
                
                if (papelMetrics.length > 0 || papelCollaborators.length > 0) {
                    const htmlContent = this.generateManagerEveningReportHTML(managerEmail, papelMetrics, papelCollaborators);
                    
                    await this.sendEmailWithLog({
                        type: 'evening_manager',
                        recipientEmail: 'petryck.leite@conlinebr.com.br',//managerEmail,
                        recipientName: `Gestor ${papelTipo}`,
                        subject: `🧪 [TESTE] Relatório Gerencial Vespertino - ${papelTipo} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: currentDate
                    });
                    
                    console.log(`✅ Relatório gerencial vespertino enviado com sucesso para ${managerEmail}`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhum dado encontrado para o relatório gerencial vespertino`);
                }
            }
            
            console.log(`🎯 Teste gerencial concluído! ${reportsSent} relatório(s) enviado(s) para ${managerEmail}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro no teste gerencial:`, error);
            return false;
        }
    },

    // Função para listar colaboradores disponíveis para teste
    listCollaboratorsForTest: async function () {
        try {
            console.log('📋 Listando colaboradores disponíveis para teste...');
            
            const collaborators = await this.getUniqueCollaborators();
            
            console.log(`\n👥 Total de colaboradores: ${collaborators.length}`);
            console.log('='.repeat(80));
            
            collaborators.forEach((colab, index) => {
                console.log(`${index + 1}. ID: ${colab.IdResponsavel} | Nome: ${colab.Responsavel} | Email: ${colab.EMail} | Papel: ${colab.Papel_Responsavel} | Tipo: ${colab.TipoOperacao}`);
            });
            
            console.log('='.repeat(80));
            console.log('💡 Use: testSendReportToCollaborator(ID, "morning"|"evening"|"both")');
            console.log('💡 Exemplo: testSendReportToCollaborator(123, "both")');
            
            return collaborators;
            
        } catch (error) {
            console.error('❌ Erro ao listar colaboradores:', error);
            return [];
        }
    },

    // Função para listar papéis disponíveis para teste gerencial
    listRolesForTest: function () {
        try {
            console.log('📋 Listando papéis disponíveis para teste gerencial...');
            
            const managersByRole = this.getManagersByRole();
            
            console.log(`\n👥 Total de papéis configurados: ${Object.keys(managersByRole).length}`);
            console.log('='.repeat(80));
            
            Object.entries(managersByRole).forEach(([papelTipo, email], index) => {
                console.log(`${index + 1}. Papel: ${papelTipo} | Email: ${email}`);
            });
            
            console.log('='.repeat(80));
            console.log('💡 Use: testSendManagerReport("PAPEL_TIPO", "morning"|"evening"|"both")');
            console.log('💡 Exemplo: testSendManagerReport("OPERACIONAL_IM", "both")');
            
            return managersByRole;
            
        } catch (error) {
            console.error('❌ Erro ao listar papéis:', error);
            return {};
        }
    },

    // Função para listar todos os papéis existentes no sistema
    listAllRoles: async function () {
        try {
            console.log('📋 Listando todos os papéis existentes no sistema...');
            
            const sql = `SELECT DISTINCT
                Pro.Nome AS Papel,
                Pro.IdPapel_Projeto AS IdPapel,
                CASE 
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                    ELSE 'N/A'
                END AS TipoOperacao,
                COUNT(DISTINCT Atv.IdResponsavel) AS TotalColaboradores,
                COUNT(DISTINCT CASE WHEN Atv.Situacao IN (1, 2, 3) THEN Atv.IdResponsavel END) AS ColaboradoresAtivos
            FROM 
                cad_Papel_Projeto Pro
                LEFT OUTER JOIN 
                cad_tarefa Tar2 ON Tar2.IdPapel_Projeto = Pro.IdPapel_Projeto
                LEFT OUTER JOIN 
                mov_Atividade Atv ON Atv.IdTarefa = Tar2.IdTarefa
                LEFT OUTER JOIN 
                mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
                LEFT OUTER JOIN 
                mov_logistica_master Lms ON Lhs.IdLogistica_Master = Lms.IdLogistica_Master
                LEFT OUTER JOIN 
                cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            WHERE 
                Pro.Nome IS NOT NULL
                AND Pro.Nome != ''
                AND (Lhs.Situacao_Agenciamento IS NULL OR Lhs.Situacao_Agenciamento NOT IN (7))
                AND (Lhs.Numero_Processo IS NULL OR Lhs.Numero_Processo NOT LIKE '%test%')
                AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
                AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
                AND (Tar2.Descricao IS NULL OR Tar2.Descricao NOT LIKE '%CFG%')
                AND (Atv.Previsao_Inicio IS NULL OR Atv.Previsao_Inicio IS NOT NULL)
                AND (Psa.EMail IS NULL OR (Psa.EMail IS NOT NULL AND Psa.EMail != '' AND Psa.Ativo = 1))
            GROUP BY 
                Pro.Nome,
                Pro.IdPapel_Projeto,
                CASE 
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                    ELSE 'N/A'
                END
            ORDER BY 
                Pro.Nome ASC,
                TipoOperacao ASC`;

            const result = await executeQuerySQL(sql);
            
            console.log(`\n👥 Total de papéis encontrados: ${result.length}`);
            console.log('='.repeat(100));
            
            // Agrupar por papel
            const rolesByType = {};
            result.forEach(role => {
                const papelKey = role.Papel;
                if (!rolesByType[papelKey]) {
                    rolesByType[papelKey] = [];
                }
                rolesByType[papelKey].push(role);
            });
            
            // Mostrar papéis agrupados
            Object.keys(rolesByType).forEach(papel => {
                console.log(`\n📋 ${papel} (ID: ${rolesByType[papel][0].IdPapel})`);
                console.log('-'.repeat(50));
                
                rolesByType[papel].forEach(role => {
                    const hasManager = this.getManagersByRole()[`${role.Papel}_${role.TipoOperacao}`];
                    const managerStatus = hasManager ? `✅ Gestor: ${hasManager}` : '❌ Sem gestor';
                    
                    console.log(`  ${role.TipoOperacao} | Colaboradores: ${role.TotalColaboradores} | Ativos: ${role.ColaboradoresAtivos} | ${managerStatus}`);
                });
            });
            
            console.log('\n' + '='.repeat(100));
            console.log('💡 Use: testSendManagerReport("PAPEL_TIPO", "morning"|"evening"|"both")');
            console.log('💡 Exemplo: testSendManagerReport("OPERACIONAL_IM", "both")');
            
            return result;
            
        } catch (error) {
            console.error('❌ Erro ao listar papéis:', error);
            return [];
        }
    },

    // Função para listar papéis com colaboradores ativos
    listActiveRoles: async function () {
        try {
            console.log('📋 Listando papéis com colaboradores ativos...');
            
            const sql = `SELECT DISTINCT
                Pro.Nome AS Papel,
                Pro.IdPapel_Projeto AS IdPapel,
                CASE 
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                    ELSE 'N/A'
                END AS TipoOperacao,
                COUNT(DISTINCT Atv.IdResponsavel) AS TotalColaboradores,
                COUNT(DISTINCT CASE WHEN Atv.Situacao IN (1, 2, 3) THEN Atv.IdResponsavel END) AS ColaboradoresAtivos
            FROM 
                cad_Papel_Projeto Pro
                LEFT OUTER JOIN 
                cad_tarefa Tar2 ON Tar2.IdPapel_Projeto = Pro.IdPapel_Projeto
                LEFT OUTER JOIN 
                mov_Atividade Atv ON Atv.IdTarefa = Tar2.IdTarefa
                LEFT OUTER JOIN 
                mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
                LEFT OUTER JOIN 
                mov_logistica_master Lms ON Lhs.IdLogistica_Master = Lms.IdLogistica_Master
                LEFT OUTER JOIN 
                cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            WHERE 
                Pro.Nome IS NOT NULL
                AND Pro.Nome != ''
                AND Lhs.Situacao_Agenciamento NOT IN (7)
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
                AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
                AND Tar2.Descricao NOT LIKE '%CFG%'
                AND Atv.Previsao_Inicio IS NOT NULL
                AND Psa.EMail IS NOT NULL
                AND Psa.EMail != ''
                AND Psa.Ativo = 1
            GROUP BY 
                Pro.Nome,
                Pro.IdPapel_Projeto,
                CASE 
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                    ELSE 'N/A'
                END
            HAVING 
                COUNT(DISTINCT CASE WHEN Atv.Situacao IN (1, 2, 3) THEN Atv.IdResponsavel END) > 0
            ORDER BY 
                Pro.Nome ASC,
                TipoOperacao ASC`;

            const result = await executeQuerySQL(sql);
            
            console.log(`\n👥 Total de papéis ativos: ${result.length}`);
            console.log('='.repeat(100));
            
            // Agrupar por papel
            const rolesByType = {};
            result.forEach(role => {
                const papelKey = role.Papel;
                if (!rolesByType[papelKey]) {
                    rolesByType[papelKey] = [];
                }
                rolesByType[papelKey].push(role);
            });
            
            // Mostrar papéis agrupados
            Object.keys(rolesByType).forEach(papel => {
                console.log(`\n📋 ${papel} (ID: ${rolesByType[papel][0].IdPapel})`);
                console.log('-'.repeat(50));
                
                rolesByType[papel].forEach(role => {
                    const hasManager = this.getManagersByRole()[`${role.Papel}_${role.TipoOperacao}`];
                    const managerStatus = hasManager ? `✅ Gestor: ${hasManager}` : '❌ Sem gestor';
                    
                    console.log(`  ${role.TipoOperacao} | Colaboradores: ${role.TotalColaboradores} | Ativos: ${role.ColaboradoresAtivos} | ${managerStatus}`);
                });
            });
            
            console.log('\n' + '='.repeat(100));
            console.log('💡 Use: testSendManagerReport("PAPEL_TIPO", "morning"|"evening"|"both")');
            console.log('💡 Exemplo: testSendManagerReport("OPERACIONAL_IM", "both")');
            
            return result;
            
        } catch (error) {
            console.error('❌ Erro ao listar papéis ativos:', error);
            return [];
        }
    },

    // Função para listar detalhes de um papel específico
    getRoleDetails: async function (papelNome, tipoOperacao = null) {
        try {
            console.log(`📋 Buscando detalhes do papel: ${papelNome}${tipoOperacao ? ` - ${tipoOperacao}` : ''}`);
            
            let whereClause = `Pro.Nome = '${papelNome}'`;
            if (tipoOperacao) {
                whereClause += ` AND CASE 
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                    ELSE 'N/A'
                END = '${tipoOperacao}'`;
            }
            
            const sql = `SELECT 
                Pro.Nome AS Papel,
                Pro.IdPapel_Projeto AS IdPapel,
                CASE 
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                    ELSE 'N/A'
                END AS TipoOperacao,
                Psa.nome AS Responsavel,
                Psa.EMail,
                COUNT(CASE WHEN Atv.Situacao = 1 THEN 1 END) AS NaoIniciadas,
                COUNT(CASE WHEN Atv.Situacao = 2 THEN 1 END) AS EmAndamento,
                COUNT(CASE WHEN Atv.Situacao = 3 THEN 1 END) AS Paralisadas,
                COUNT(CASE WHEN Atv.Situacao = 4 THEN 1 END) AS Concluidas,
                COUNT(CASE WHEN Atv.Situacao = 5 THEN 1 END) AS NaoRealizadas,
                COUNT(CASE WHEN Atv.Situacao = 6 THEN 1 END) AS Canceladas
            FROM 
                cad_Papel_Projeto Pro
                LEFT OUTER JOIN 
                cad_tarefa Tar2 ON Tar2.IdPapel_Projeto = Pro.IdPapel_Projeto
                LEFT OUTER JOIN 
                mov_Atividade Atv ON Atv.IdTarefa = Tar2.IdTarefa
                LEFT OUTER JOIN 
                mov_logistica_house Lhs ON Lhs.IdProjeto_Atividade = Atv.IdProjeto_Atividade
                LEFT OUTER JOIN 
                mov_logistica_master Lms ON Lhs.IdLogistica_Master = Lms.IdLogistica_Master
                LEFT OUTER JOIN 
                cad_Pessoa Psa ON Psa.IdPessoa = Atv.IdResponsavel
            WHERE 
                ${whereClause}
                AND Lhs.Situacao_Agenciamento NOT IN (7)
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND (Atv.Data_Termino IS NULL OR YEAR(Atv.Data_Termino) = ${currentYear})
                AND (Atv.Previsao_Termino IS NULL OR YEAR(Atv.Previsao_Termino) = ${currentYear})
                AND Tar2.Descricao NOT LIKE '%CFG%'
                AND Atv.Previsao_Inicio IS NOT NULL
                AND Psa.EMail IS NOT NULL
                AND Psa.EMail != ''
                AND Psa.Ativo = 1
            GROUP BY 
                Pro.Nome,
                Pro.IdPapel_Projeto,
                CASE 
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
                    WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
                    WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
                    ELSE 'N/A'
                END,
                Psa.nome, Psa.EMail
            ORDER BY 
                TipoOperacao ASC,
                Psa.nome ASC`;

            const result = await executeQuerySQL(sql);
            
            if (result.length === 0) {
                console.log(`❌ Nenhum detalhe encontrado para ${papelNome}${tipoOperacao ? ` - ${tipoOperacao}` : ''}`);
                return [];
            }
            
            console.log(`\n📋 Detalhes encontrados: ${result.length} registros`);
            console.log('='.repeat(100));
            
            // Agrupar por tipo de operação
            const detailsByType = {};
            result.forEach(detail => {
                const tipoKey = detail.TipoOperacao;
                if (!detailsByType[tipoKey]) {
                    detailsByType[tipoKey] = [];
                }
                detailsByType[tipoKey].push(detail);
            });
            
            // Mostrar detalhes agrupados
            Object.keys(detailsByType).forEach(tipo => {
                console.log(`\n🔄 ${papelNome} - ${tipo}`);
                console.log('-'.repeat(60));
                
                detailsByType[tipo].forEach(detail => {
                    const totalAtividades = detail.NaoIniciadas + detail.EmAndamento + detail.Paralisadas + detail.Concluidas + detail.NaoRealizadas + detail.Canceladas;
                    console.log(`  👤 ${detail.Responsavel} (${detail.EMail})`);
                    console.log(`     ⏳ Não iniciadas: ${detail.NaoIniciadas}`);
                    console.log(`     🔄 Em andamento: ${detail.EmAndamento}`);
                    console.log(`     ⏸️ Paralisadas: ${detail.Paralisadas}`);
                    console.log(`     ✅ Concluídas: ${detail.Concluidas}`);
                    console.log(`     ❌ Não realizadas: ${detail.NaoRealizadas}`);
                    console.log(`     🚫 Canceladas: ${detail.Canceladas}`);
                    console.log(`     📊 Total: ${totalAtividades}`);
                    console.log('');
                });
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Erro ao buscar detalhes do papel:', error);
            return [];
        }
    },

};


headcargoActivityManagement.startEmailScheduler();
// headcargoActivityManagement.showEmailConfig();
// headcargoActivityManagement.testSendReportToCollaborator(57796, 'morning');
// headcargoActivityManagement.testSendManagerReport('OPERACIONAL_IM', 'morning');
// headcargoActivityManagement.listRolesForTest();
// headcargoActivityManagement.listAllRoles();
// headcargoActivityManagement.listActiveRoles();
// headcargoActivityManagement.getRoleDetails('Operacional', 'IM');
// headcargoActivityManagement.listAllManagers();
headcargoActivityManagement.testSendGroupManagerReport('GRUPO_OPERACIONAL', 'both');

// headcargoActivityManagement.listActiveRoles();

module.exports = headcargoActivityManagement;