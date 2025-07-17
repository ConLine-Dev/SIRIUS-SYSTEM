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
        if (!previsaoTermino || status === 'Concluída') return false;
        
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
                WHEN Atv.Situacao = 4 THEN 'Concluída'
                ELSE 'Pendente'
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
    // CORREÇÃO: Agora considera atividades concluídas no dia (Data_Termino) e pendentes/atrasadas (Previsao_Termino)
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
        WHEN Atv.Situacao = 4 THEN 'Concluída'
        WHEN Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL THEN 'Atrasada'
        ELSE 'Pendente'
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
                -- Atividades pendentes (Previsao_Termino = dia atual)
                OR (Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}')
                -- Atividades atrasadas (Previsao_Termino < dia atual e não concluídas)
                OR (Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL)
            )
        ORDER BY 
            Status_Tarefa,
            Tar2.Descricao`;

        const result = await executeQuerySQL(sql);
        return result;
    },

    // Busca atividades concluídas no dia
    // CORREÇÃO: Agora considera apenas atividades concluídas no dia (Data_Termino = dia atual)
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

    // Busca atividades pendentes no dia
    // CORREÇÃO: Agora considera apenas atividades com Previsao_Termino = dia atual
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
            'Pendente' AS Status_Tarefa
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
            AND Atv.Situacao != 4
            AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}'
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
            AND Atv.Situacao != 4
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

    // Gera HTML do relatório matinal
    generateMorningReportHTML: function (collaborator, activities) {
        // Filtrar apenas atividades pendentes e atrasadas do dia específico
        const relevantActivities = activities.filter(a => 
            a.Status_Tarefa === 'Pendente' || a.Status_Tarefa === 'Atrasada'
        );
        
        const totalActivities = relevantActivities.length;
        const pendingActivities = relevantActivities.filter(a => 
            a.Status_Tarefa === 'Pendente'
        ).length;
        const overdueActivities = relevantActivities.filter(a => 
            a.Status_Tarefa === 'Atrasada'
        ).length;

        // Ordenar atividades: Atrasadas primeiro, depois Pendentes
        const sortedActivities = relevantActivities.sort((a, b) => {
            if (a.Status_Tarefa === 'Atrasada' && b.Status_Tarefa !== 'Atrasada') return -1; // Atrasadas primeiro
            if (a.Status_Tarefa !== 'Atrasada' && b.Status_Tarefa === 'Atrasada') return 1;  // Pendentes depois
            return 0; // Mesmo status, manter ordem original
        });

        let activitiesHTML = '';
        sortedActivities.forEach(activity => {
            let statusClass = 'warning';
            let statusText = 'Pendente';
            
            if (activity.Status_Tarefa === 'Atrasada') {
                statusClass = 'danger';
                statusText = 'Atrasada';
            }

         
            
            activitiesHTML += `
                <tr>
                    <td>${activity.Descricao_Tarefa}</td>
                    <td>${activity.Papel_Responsavel || '-'}</td>
                    <td>${activity.Numero_Processo || '-'}</td>
                    <td>${this.formatDate(activity.Data_Previsao_Inicio)}</td>
                    <td>${this.formatDate(activity.Data_Previsao_Termino)}</td>
                    <td><span class="badge bg-${statusClass}">${statusText}</span></td>
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
                    .bg-warning { background-color: #ffc107; color: black; }
                    .bg-danger { background-color: #dc3545; }
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
                    <p><strong>🚨 Atrasadas:</strong> ${overdueActivities}</p>
                    <p><strong>⏳ Pendentes:</strong> ${pendingActivities}</p>
                </div>

                <h3>📋 Atividades Pendentes e Atrasadas</h3>
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
                    <p><strong>💡 Dica:</strong> Priorize as atividades atrasadas (em vermelho) e depois foque nas pendentes!</p>
                    <p><em>Este relatório foi gerado automaticamente pelo Sirius System.</em></p>
                </div>
            </body>
            </html>
        `;
    },

    // Gera HTML do relatório vespertino
    generateEveningReportHTML: function (collaborator, completedActivities, pendingActivities) {
        const totalCompleted = completedActivities.length;
        const totalPending = pendingActivities.filter(a => a.Status_Tarefa === 'Pendente').length;
        const totalOverdue = pendingActivities.filter(a => a.Status_Tarefa === 'Atrasada').length;

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
        let overdueHTML = '';
        
        // Ordenar atividades: Atrasadas primeiro, depois Pendentes
        const sortedPendingActivities = pendingActivities.sort((a, b) => {
            if (a.Status_Tarefa === 'Atrasada' && b.Status_Tarefa !== 'Atrasada') return -1; // Atrasadas primeiro
            if (a.Status_Tarefa !== 'Atrasada' && b.Status_Tarefa === 'Atrasada') return 1;  // Pendentes depois
            return 0; // Mesmo status, manter ordem original
        });
        
        sortedPendingActivities.forEach(activity => {
            if (activity.Status_Tarefa === 'Atrasada') {
                overdueHTML += `
                    <tr>
                        <td>${activity.Descricao_Tarefa}</td>
                        <td>${activity.Papel_Responsavel || '-'}</td>
                        <td>${activity.Numero_Processo || '-'}</td>
                        <td>${this.formatDate(activity.Data_Previsao_Inicio)}</td>
                        <td>${this.formatDate(activity.Data_Previsao_Termino)}</td>
                        <td><span class="badge bg-danger">Atrasada</span></td>
                    </tr>
                `;
            } else {
                pendingHTML += `
                    <tr>
                        <td>${activity.Descricao_Tarefa}</td>
                        <td>${activity.Papel_Responsavel || '-'}</td>
                        <td>${activity.Numero_Processo || '-'}</td>
                        <td>${this.formatDate(activity.Data_Previsao_Inicio)}</td>
                        <td>${this.formatDate(activity.Data_Previsao_Termino)}</td>
                        <td><span class="badge bg-warning">Pendente</span></td>
                    </tr>
                `;
            }
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
                    .overdue-section { background-color: #f8d7da; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .badge { padding: 5px 10px; border-radius: 3px; color: white; font-size: 12px; }
                    .bg-success { background-color: #28a745; }
                    .bg-warning { background-color: #ffc107; color: black; }
                    .bg-danger { background-color: #dc3545; }
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
                    <p><strong>⏳ Atividades Pendentes:</strong> ${totalPending}</p>
                    <p><strong>🚨 Atividades Atrasadas:</strong> ${totalOverdue}</p>
                    <p><strong>📈 Taxa de Conclusão:</strong> ${totalCompleted + totalPending + totalOverdue > 0 ? Math.round((totalCompleted / (totalCompleted + totalPending + totalOverdue)) * 100) : 0}%</p>
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

                ${totalOverdue > 0 ? `
                <div class="overdue-section">
                    <h3>🚨 Atividades Atrasadas (${totalOverdue})</h3>
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
                            ${overdueHTML}
                        </tbody>
                    </table>
                </div>
                ` : ''}

                ${totalPending > 0 ? `
                <div class="pending-section">
                    <h3>⏳ Atividades Pendentes (${totalPending})</h3>
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
                    <p><strong>🎯 Objetivo:</strong> ${totalOverdue > 0 ? 'Priorize as atividades atrasadas!' : totalCompleted > 0 ? 'Parabéns pelo trabalho realizado!' : 'Continue focado nas atividades pendentes!'}</p>
                    <p><em>Este relatório foi gerado automaticamente pelo Sirius System.</em></p>
                </div>
            </body>
            </html>
        `;
    },





    // Busca métricas por papel para um dia específico
    // CORREÇÃO: Agora conta apenas atividades concluídas no dia específico
    // e atividades pendentes que estão ativas no dia (não apenas com prazo >= dia)
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
            COUNT(CASE WHEN Atv.Situacao = 4 AND CONVERT(VARCHAR(10), Atv.Data_Termino, 120) = '${currentDate}' THEN 1 END) AS AtividadesConcluidas,
            COUNT(CASE WHEN Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS AtividadesPendentes,
            COUNT(CASE WHEN Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL THEN 1 END) AS AtividadesAtrasadas
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
                -- Atividades pendentes (Previsao_Termino = dia atual)
                OR (Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}')
                -- Atividades atrasadas (Previsao_Termino < dia atual e não concluídas)
                OR (Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL)
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
    // CORREÇÃO: Agora conta apenas atividades concluídas no dia específico
    // e atividades pendentes que estão ativas no dia (não apenas com prazo >= dia)
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
            COUNT(CASE WHEN Atv.Situacao = 4 AND CONVERT(VARCHAR(10), Atv.Data_Termino, 120) = '${currentDate}' THEN 1 END) AS Concluidas,
            COUNT(CASE WHEN Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}' THEN 1 END) AS Pendentes,
            COUNT(CASE WHEN Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL THEN 1 END) AS Atrasadas
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
                -- Atividades pendentes (Previsao_Termino = dia atual)
                OR (Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) = '${currentDate}')
                -- Atividades atrasadas (Previsao_Termino < dia atual e não concluídas)
                OR (Atv.Situacao != 4 AND CONVERT(VARCHAR(10), Atv.Previsao_Termino, 120) < '${currentDate}' AND Atv.Data_Termino IS NULL)
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
        let totalPendentes = 0;
        let totalAtrasadas = 0;

        // Calcular totais
        metricsByRole.forEach(metric => {
            totalColaboradores += metric.TotalColaboradores;
            totalConcluidas += metric.AtividadesConcluidas;
            totalPendentes += metric.AtividadesPendentes;
            totalAtrasadas += metric.AtividadesAtrasadas;
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
            const taxaConclusao = (metric.AtividadesConcluidas + metric.AtividadesPendentes + metric.AtividadesAtrasadas) > 0 
                ? Math.round((metric.AtividadesConcluidas / (metric.AtividadesConcluidas + metric.AtividadesPendentes + metric.AtividadesAtrasadas)) * 100)
                : 0;

            metricsHTML += `
                <tr>
                    <td><strong>${metric.Papel}</strong></td>
                    <td><span class="badge bg-secondary">${metric.TipoOperacao}</span></td>
                    <td>${metric.TotalColaboradores}</td>
                    <td><span class="badge bg-success">${metric.AtividadesConcluidas}</span></td>
                    <td><span class="badge bg-warning">${metric.AtividadesPendentes}</span></td>
                    <td><span class="badge bg-danger">${metric.AtividadesAtrasadas}</span></td>
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
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">⏳ Pendentes</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">🚨 Atrasadas</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            collaboratorsByRole[papel].forEach(collaborator => {
                collaboratorsHTML += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${collaborator.Responsavel}</td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-success">${collaborator.Concluidas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-warning">${collaborator.Pendentes}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-danger">${collaborator.Atrasadas}</span></td>
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
                    .bg-warning { background-color: #f39c12; }
                    .bg-danger { background-color: #e74c3c; }
                    .bg-info { background-color: #3498db; }
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
                    <p><strong>✅ Atividades Concluídas:</strong> ${totalConcluidas}</p>
                    <p><strong>⏳ Atividades Pendentes:</strong> ${totalPendentes}</p>
                    <p><strong>🚨 Atividades Atrasadas:</strong> ${totalAtrasadas}</p>
                </div>

                <h3>📋 Métricas por Papel</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Papel</th>
                            <th>Tipo Operação</th>
                            <th>Colaboradores</th>
                            <th>✅ Concluídas</th>
                            <th>⏳ Pendentes</th>
                            <th>🚨 Atrasadas</th>
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
                    <p><strong>💡 Dica:</strong> Foque nos papéis com mais atividades atrasadas e apoie os colaboradores que precisam de ajuda!</p>
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
        let totalPendentes = 0;
        let totalAtrasadas = 0;

        // Calcular totais
        metricsByRole.forEach(metric => {
            totalColaboradores += metric.TotalColaboradores;
            totalConcluidas += metric.AtividadesConcluidas;
            totalPendentes += metric.AtividadesPendentes;
            totalAtrasadas += metric.AtividadesAtrasadas;
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
            const taxaConclusao = (metric.AtividadesConcluidas + metric.AtividadesPendentes + metric.AtividadesAtrasadas) > 0 
                ? Math.round((metric.AtividadesConcluidas / (metric.AtividadesConcluidas + metric.AtividadesPendentes + metric.AtividadesAtrasadas)) * 100)
                : 0;

            metricsHTML += `
                <tr>
                    <td><strong>${metric.Papel}</strong></td>
                    <td>${metric.TotalColaboradores}</td>
                    <td><span class="badge bg-success">${metric.AtividadesConcluidas}</span></td>
                    <td><span class="badge bg-warning">${metric.AtividadesPendentes}</span></td>
                    <td><span class="badge bg-danger">${metric.AtividadesAtrasadas}</span></td>
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
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">⏳ Pendentes</th>
                                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">🚨 Atrasadas</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            collaboratorsByRole[papel].forEach(collaborator => {
                collaboratorsHTML += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${collaborator.Responsavel}</td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-success">${collaborator.Concluidas}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-warning">${collaborator.Pendentes}</span></td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;"><span class="badge bg-danger">${collaborator.Atrasadas}</span></td>
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
                    .bg-warning { background-color: #f39c12; }
                    .bg-danger { background-color: #e74c3c; }
                    .bg-info { background-color: #3498db; }
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
                    <p><strong>✅ Atividades Concluídas:</strong> ${totalConcluidas}</p>
                    <p><strong>⏳ Atividades Pendentes:</strong> ${totalPendentes}</p>
                    <p><strong>🚨 Atividades Atrasadas:</strong> ${totalAtrasadas}</p>
                    <p><strong>📊 Taxa de Conclusão Geral:</strong> ${totalConcluidas + totalPendentes + totalAtrasadas > 0 ? Math.round((totalConcluidas / (totalConcluidas + totalPendentes + totalAtrasadas)) * 100) : 0}%</p>
                </div>

                <h3>📋 Métricas por Papel</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Papel</th>
                            <th>Colaboradores</th>
                            <th>✅ Concluídas</th>
                            <th>⏳ Pendentes</th>
                            <th>🚨 Atrasadas</th>
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
                    <p><strong>🎯 Objetivo:</strong> ${totalAtrasadas > 0 ? 'Ainda há atividades atrasadas que precisam de atenção!' : 'Excelente trabalho da equipe!'}</p>
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
            const managersByRole = this.getManagersByRole();

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
            for (const [papelTipo, managerEmail] of Object.entries(managersByRole)) {
                const papelMetrics = groupedMetrics[papelTipo] || [];
                const papelCollaborators = groupedCollaborators[papelTipo] || [];

                if (papelMetrics.length > 0 || papelCollaborators.length > 0) {
                    const htmlContent = this.generateManagerMorningReportHTML(managerEmail, papelMetrics, papelCollaborators);
                    
                    // Usar sistema de log
                    await this.sendEmailWithLog({
                        type: 'morning_manager',
                        recipientEmail: managerEmail,
                        recipientName: `Gestor ${papelTipo}`,
                        subject: `📊 [Sirius System] Relatório Gerencial Matinal - ${papelTipo} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
                    });

                    console.log(`✅ Relatório matinal enviado para gestor de ${papelTipo} (${managerEmail})`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhuma atividade encontrada para ${papelTipo}`);
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
            const managersByRole = this.getManagersByRole();

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
            for (const [papelTipo, managerEmail] of Object.entries(managersByRole)) {
                const papelMetrics = groupedMetrics[papelTipo] || [];
                const papelCollaborators = groupedCollaborators[papelTipo] || [];

                if (papelMetrics.length > 0 || papelCollaborators.length > 0) {
                    const htmlContent = this.generateManagerEveningReportHTML(managerEmail, papelMetrics, papelCollaborators);
                    
                    // Usar sistema de log
                    await this.sendEmailWithLog({
                        type: 'evening_manager',
                        recipientEmail: managerEmail,
                        recipientName: `Gestor ${papelTipo}`,
                        subject: `📊 [Sirius System] Relatório Gerencial Vespertino - ${papelTipo} - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: htmlContent,
                        date: date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
                    });

                    console.log(`✅ Relatório vespertino enviado para gestor de ${papelTipo} (${managerEmail})`);
                    reportsSent++;
                } else {
                    console.log(`⚠️ Nenhuma atividade encontrada para ${papelTipo}`);
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
                            const pendingActivities = await this.getPendingTodayActivities(failedEmail.recipient_name, failedEmail.sent_at);
                            const overdueActivities = await this.getOverdueActivities(failedEmail.recipient_name, failedEmail.sent_at);
                            const allPendingActivities = [...pendingActivities, ...overdueActivities];
                            
                            if (completedActivities.length > 0 || allPendingActivities.length > 0) {
                                const collaborator = completedActivities.length > 0 ? completedActivities[0] : allPendingActivities[0];
                                const htmlContent = this.generateEveningReportHTML(collaborator, completedActivities, allPendingActivities);
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
                    const pendingActivities = await this.getPendingTodayActivities(collaborator.IdResponsavel);
                    const overdueActivities = await this.getOverdueActivities(collaborator.IdResponsavel);
                    const allPendingActivities = [...pendingActivities, ...overdueActivities];
                    
                    await this.sendEmailWithLog({
                        type: 'evening_individual',
                        recipientEmail: collaborator.EMail,
                        recipientName: collaborator.Responsavel,
                        subject: `🌆 [Sirius System] Resumo do Seu Dia - ${new Date().toLocaleDateString('pt-BR')}`,
                        htmlContent: await this.generateEveningReportHTML(collaborator, completedActivities, allPendingActivities),
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


};


headcargoActivityManagement.startEmailScheduler();
headcargoActivityManagement.showEmailConfig();

module.exports = headcargoActivityManagement;