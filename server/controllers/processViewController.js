const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');

// Função auxiliar para formatar resposta
const formatResponse = (status, message, data = null) => {
    return {
        status,
        message,
        data
    };
};

const processViewController = {
    /**
     * Obtém os detalhes de um processo específico
     * @param {string} processNumber - Número do processo
     */
    async getProcessDetails(req, res) {
        try {
            const { processNumber } = req.params;

            // Consulta para obter responsáveis do processo
            const responsaveis = await executeQuerySQL(`
                SELECT
                    Res.Nome AS Responsavel,
                    Pap.Nome AS Papel
                FROM
                    mov_Logistica_House Lhs 
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
                LEFT OUTER JOIN
                    CAD_Papel_Projeto Pap ON Pap.IdPapel_Projeto = Par.IdPapel_Projeto
                LEFT OUTER JOIN 
                    cad_Pessoa Res ON Res.IdPessoa = Par.IdResponsavel
                WHERE
                    Lhs.Numero_Processo = '${processNumber}'
            `);

            // Consulta para obter informações de viagem
            const viagemInfo = await executeQuerySQL(`
                SELECT
                    CASE Lvg.Tipo_Viagem 
                        WHEN 1 THEN 'Coleta'
                        WHEN 2 THEN 'Pré-embarque'
                        WHEN 3 THEN 'Local Recebimento'
                        WHEN 4 THEN 'Embarque inicial'
                        WHEN 5 THEN 'Transbordo / Escala'
                        WHEN 6 THEN 'Destino final'
                        WHEN 7 THEN 'Pós-embarque'
                        WHEN 8 THEN 'Entrega'
                    END AS Tipo_Viagem,
                    Nav.Nome AS Navio,
                    Lvg.Viagem_Voo AS Viagem
                FROM
                    mov_Logistica_Viagem Lvg
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lvg.IdLogistica_House
                LEFT OUTER JOIN
                    cad_Navio Nav ON Nav.IdNavio = Lvg.IdNavio
                WHERE
                    Lhs.Numero_Processo = '${processNumber}'
            `);

            // Consulta para obter informações de container e carga
            const containerInfo = await executeQuerySQL(`
                SELECT
                    Lhs.Numero_Processo,

                    CASE Lme.IdEquipamento_Maritimo
                    WHEN 3 THEN '20 DRY'
                    WHEN 4 THEN '20 OPEN TOP'
                    WHEN 5 THEN '20 FLAT RACK'
                    WHEN 8 THEN '40 FLAT RACK'
                    WHEN 9 THEN '40 HIGH CUBE'
                    WHEN 10 THEN '40 DRY'
                    WHEN 11 THEN '40 OPEN TOP'
                    WHEN 12 THEN '40 REEFER'
                    WHEN 15 THEN '40 NOR'
                    WHEN 26 THEN '40 OT OH'
                    END AS Equipamentos,

                    Lmc.Number AS Container,
                    Lmc.Gross_Weight AS Peso_Bruto,
                    Lmc.Measurement AS Metros_Cubicos,
                    Lmc.Quantity AS Quantidade,
                    Lmc.Type_Packages AS Tipo_Pacote,
                    Lme.Free_Time_Master_Destino,
                    Lme.Free_Time_House_Destino
                FROM
                    mov_Logistica_House Lhs
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_Equipamento Lme ON Lme.IdLogistica_House = Lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_Container Lmc ON Lmc.IdLogistica_House = Lhs.IdLogistica_House
                WHERE
                    Lhs.Numero_Processo = '${processNumber}'
            `);

            // Consulta para obter informações gerais do processo
            const processInfo = await executeQuerySQL(`
                SELECT 
                    Lhs.Numero_Processo,
                    Cli.Nome AS Cliente,
                    Exp.Nome AS Exportador,
                    Imp.Nome AS Importador,
                    Dea.Nome AS Despachante_Aduaneiro,
                    Ntf.Nome AS Notify,
                    Agt.Nome AS Agente_Origem,
                    Cia.Nome AS Companhia_Transporte,
                    Ori.Nome AS Origem,
                    Des.Nome AS Destino,
                    FORMAT(Lms.Data_Previsao_Embarque, 'dd/MM/yyyy') AS Data_Previsao_Embarque, 
                    FORMAT(Lms.Data_Embarque, 'dd/MM/yyyy') AS Data_Embarque,
                    FORMAT(Lms.Data_Previsao_Desembarque, 'dd/MM/yyyy') AS Data_Previsao_Desembarque, 
                    FORMAT(Lms.Data_Desembarque, 'dd/MM/yyyy') AS Data_Desembarque,
                    Lms.Numero_Conhecimento AS Numero_Master,
                    Inc.Nome AS Incoterm,
                    CASE (Lms.Modalidade_Pagamento)
                        WHEN 1 THEN 'Collect/Prepaid'
                        WHEN 2 THEN 'Collect'
                        WHEN 3 THEN 'Prepaid'
                        WHEN 4 THEN 'Prepaid Abroad'
                    END AS Modalidade_Pagamento,
                    CASE Lhs.Carga_Perigosa
                        WHEN 0 THEN 'Não'
                        WHEN 1 THEN 'Sim'
                    END AS Carga_Perigosa,
                    CASE Lms.Situacao_Embarque
                        WHEN 0 THEN 'Pré-processo'
                        WHEN 1 THEN 'Aguardando embarque'
                        WHEN 2 THEN 'Embarcado'
                        WHEN 3 THEN 'Desembarque'
                        WHEN 4 THEN 'Cancelado'
                        WHEN 5 THEN 'Pendente'
                        WHEN 6 THEN 'Autorizado'
                        WHEN 7 THEN 'Coletado'
                        WHEN 8 THEN 'Entregue'
                        WHEN 9 THEN 'Aguardando prontidão da mercadoria'
                        WHEN 10 THEN 'Aguardando booking finalizado'
                        WHEN 11 THEN 'Aguardando coleta'
                        WHEN 12 THEN 'Aguardando entrega'
                    END AS Situacao_Embarque,
                    Ncm.Codigo AS NCM,
                    Ncm.Descricao AS Descricao_NCM
                FROM
                    mov_Logistica_House Lhs
                LEFT OUTER JOIN
                    mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
                LEFT OUTER JOIN 
                    cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
                LEFT OUTER JOIN 
                    cad_Pessoa Exp ON Exp.IdPessoa = Lhs.IdExportador
                LEFT OUTER JOIN 
                    cad_Pessoa Imp ON Imp.IdPessoa = Lhs.IdImportador
                LEFT OUTER JOIN 
                    cad_Pessoa Dea ON Dea.IdPessoa = Lhs.IdDespachante_Aduaneiro
                LEFT OUTER JOIN 
                    cad_Pessoa Ntf ON Ntf.IdPessoa = Lhs.IdNotify
                LEFT OUTER JOIN 
                    cad_Pessoa Agt ON Agt.IdPessoa = Lms.IdAgente_Origem
                LEFT OUTER JOIN 
                    cad_Pessoa Cia ON Cia.IdPessoa = Lms.IdCompanhia_Transporte
                LEFT OUTER JOIN
                    cad_Origem_Destino Ori ON Ori.IdOrigem_Destino = Lms.IdOrigem
                LEFT OUTER JOIN
                    cad_Origem_Destino Des ON Des.IdOrigem_Destino = Lms.IdDestino
                LEFT OUTER JOIN
                    cad_Incoterm Inc ON Inc.IdIncoterm = Lhs.IdIncoterm
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_House Lmh ON Lmh.IdLogistica_House = Lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Bill_Lading_NCM Bln ON Bln.IdLogistica_House = Lhs.IdLogistica_House
                LEFT OUTER JOIN
                    cad_Serpro_NCM Ncm ON Ncm.IdSerpro_NCM = Bln.IdSerpro_NCM
                WHERE
                    Lhs.Numero_Processo = '${processNumber}'
            `);

            if (!processInfo || processInfo.length === 0) {
                return res.status(404).json(formatResponse('error', 'Processo não encontrado'));
            }

            // Monta o objeto de resposta
            const response = {
                processo: processInfo[0],
                responsaveis,
                viagem: viagemInfo,
                containers: containerInfo,
            };

            res.json(formatResponse('success', 'Dados do processo recuperados com sucesso', response));
        } catch (error) {
            console.error('Erro ao buscar detalhes do processo:', error);
            res.status(500).json(formatResponse('error', 'Erro ao buscar detalhes do processo'));
        }
    },
    /**
     * Obtém as taxas de um processo
     * @param {string} processNumber - Número do processo
     */
    async getProcessFees(req, res) {
        try {
            const { processNumber } = req.params;
    
            // Consulta para buscar todos os taxas sem paginação
            const taxas = await executeQuerySQL(`
                                SELECT
                            Lhs.IdLogistica_House AS idProcessos,
                            Lhs.Numero_Processo,
                            Tle.Nome AS Nome_Taxa,
                            Ltx.IdTaxa_Logistica_Exibicao AS IdTaxa_Logistica_Exibicao,
                            Ltx.IdLogistica_Taxa AS idTaxa,
                            Ltx.Valor_Pagamento_Total,
                            Pag.Sigla AS Moeda_Pgto,
                            Ltx.Valor_Recebimento_Total,
                            Rec.Sigla AS Moeda_Receb,
                            Lmd.Lucro_Estimado,
                            Lmd.Lucro_Efetivo,
                            Lmd.Lucro_Abertura
                        FROM
                            mov_Logistica_House Lhs
                        LEFT OUTER JOIN 
                            mov_Logistica_Taxa Ltx ON Ltx.IdLogistica_House = Lhs.IdLogistica_House
                        LEFT OUTER JOIN
                            cad_Taxa_Logistica_Exibicao Tle ON Tle.IdTaxa_Logistica_Exibicao = Ltx.IdTaxa_Logistica_Exibicao
                        LEFT OUTER JOIN
                            cad_Moeda Pag ON Pag.IdMoeda = Ltx.IdMoeda_Pagamento 
                        LEFT OUTER JOIN
                            cad_Moeda Rec ON Rec.IdMoeda = Ltx.IdMoeda_Recebimento
                        LEFT OUTER JOIN
                            mov_Logistica_Moeda Lmd ON Lmd.IdLogistica_House = Lhs.IdLogistica_House AND Lmd.IdMoeda = 110 /* Real */
                        WHERE
                            Lhs.Numero_Processo = '${processNumber}'`);
    
            // Retorna todos os taxas sem paginação
            const response = {
                taxas
            };
    
            res.json(formatResponse('success', 'Acompanhamentos recuperados com sucesso', response));
        } catch (error) {
            console.error('Erro ao buscar acompanhamentos do processo:', error);
            res.status(500).json(formatResponse('error', 'Erro ao buscar acompanhamentos do processo'));
        }
    },

    /**
     * Obtém os acompanhamentos de um processo
     * @param {string} processNumber - Número do processo
     */
    async getProcessFollows(req, res) {
        try {
            const { processNumber } = req.params;
    
            // Consulta para buscar todos os acompanhamentos sem paginação
            const acompanhamentos = await executeQuerySQL(`
                SELECT 
                    Acm.IdAcompanhamento,
                    FORMAT(Acm.Data, 'dd/MM/yyyy') AS Data,
                    Acm.Descricao,
                    Rsp.Nome AS Responsavel
                FROM
                    mov_Acompanhamento Acm 
                LEFT OUTER JOIN
                    cad_Pessoa Rsp on Rsp.IdPessoa = Acm.IdResponsavel
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs on Lhs.IdProjeto_Atividade = Acm.IdProjeto_Atividade
                WHERE
                    Lhs.Numero_Processo = '${processNumber}'
                ORDER BY
                    Acm.Data DESC,
                    Acm.IdAcompanhamento DESC
            `);
    
            // Retorna todos os acompanhamentos sem paginação
            const response = {
                acompanhamentos
            };
    
            res.json(formatResponse('success', 'Acompanhamentos recuperados com sucesso', response));
        } catch (error) {
            console.error('Erro ao buscar acompanhamentos do processo:', error);
            res.status(500).json(formatResponse('error', 'Erro ao buscar acompanhamentos do processo'));
        }
    }
};

module.exports = processViewController;
