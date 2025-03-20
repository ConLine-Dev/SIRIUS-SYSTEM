const { executeQuerySQL } = require('../connect/sqlServer'); // Importa a função para executar consultas SQL

const processQueryFilter = {
    // Função para obter os dados da tabela com filtros
    getData: async function(filters) {
        // Construir a consulta SQL base
        let query = `
            SELECT
                Fin.IdFatura_Financeira AS IdFatura,
                Fin.Numero AS Numero_Fatura,
                Lhs.Numero_Processo AS Referencia,
                Pss.Nome AS Pessoa,
                Fin.Data_Vencimento,
                Fin.Data_Pagamento,
                Lhs.IdLogistica_House,
                Lhs.Data_Abertura_Processo,

                CASE Lhs.Situacao_Recebimento
                    WHEN 0 THEN 'Sem recebimento'
                    WHEN 1 THEN 'Em aberto'
                    WHEN 2 THEN 'Parcialmente recebido'
                    WHEN 3 THEN 'Recebido'
                END AS Situacao_Recebimento,

                CASE Lhs.Tipo_Carga
                    WHEN 1 THEN 'Aéreo'
                    WHEN 2 THEN 'Break-Bulk'
                    WHEN 3 THEN 'FCL'
                    WHEN 4 THEN 'LCL'
                    WHEN 5 THEN 'RO-RO'
                    WHEN 6 THEN 'Rodoviário'
                END AS Tipo_Carga,

                Lhs.Data_Pagamento_Local AS Data_Pgto_Processo,

                CASE Lhs.Situacao_Pagamento
                    WHEN 0 THEN 'Sem pagamento'
                    WHEN 1 THEN 'Em aberto'
                    WHEN 2 THEN 'Parcialmente pago'
                    WHEN 3 THEN 'Pago'
                END AS Situacao_Pagamento,
                
                Spl.Descricao AS Status_Processo,
                Lms.Data_Desembarque,
                Lms.Numero_Conhecimento AS Conhecimento_Master,
                Cia.Nome AS Companhia_Transporte
            FROM
                mov_Fatura_Financeira Fin
            LEFT OUTER JOIN 
                mov_Registro_Financeiro Reg ON Reg.IdRegistro_Financeiro = Fin.IdRegistro_Financeiro
            LEFT OUTER JOIN
                cad_Pessoa Pss ON Pss.IdPessoa = Reg.IdPessoa
            LEFT OUTER JOIN 
                mov_Logistica_Fatura Lft ON Lft.IdRegistro_Financeiro = Reg.IdRegistro_Financeiro
            LEFT OUTER JOIN
                mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lft.IdLogistica_House
            LEFT OUTER JOIN
                cad_Status_Processo_Logistico Spl ON Spl.IdStatus_Processo_Logistico = Lhs.IdStatus_Processo_Logistico
            LEFT OUTER JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                cad_Pessoa Cia ON Cia.IdPessoa = Lms.IdCompanhia_Transporte
        `;

        // Adicionar cláusulas WHERE com base nos filtros
        const whereConditions = [];
        
        // Adicionar filtro padrão para o ano de abertura do processo
        // whereConditions.push(`YEAR(Lhs.Data_Abertura_Processo) = 2025`);

        if (filters) {
            // Filtro por número de fatura
            if (filters.numeroFatura) {
                whereConditions.push(`Fin.Numero LIKE '%${filters.numeroFatura}%'`);
            }

            // Filtro por referência (número de processo)
            if (filters.referencia) {
                whereConditions.push(`Lhs.Numero_Processo LIKE '%${filters.referencia}%'`);
            }

            // Filtro por pessoa
            if (filters.pessoa) {
                whereConditions.push(`Pss.Nome LIKE '%${filters.pessoa}%'`);
            }

            // Filtro por data de vencimento
            if (filters.dataVencimentoInicio && filters.dataVencimentoFim) {
                whereConditions.push(`Fin.Data_Vencimento BETWEEN '${filters.dataVencimentoInicio}' AND '${filters.dataVencimentoFim}'`);
            } else if (filters.dataVencimentoInicio) {
                whereConditions.push(`Fin.Data_Vencimento >= '${filters.dataVencimentoInicio}'`);
            } else if (filters.dataVencimentoFim) {
                whereConditions.push(`Fin.Data_Vencimento <= '${filters.dataVencimentoFim}'`);
            }

            // Filtro por data de pagamento
            if (filters.dataPagamentoInicio && filters.dataPagamentoFim) {
                whereConditions.push(`Fin.Data_Pagamento BETWEEN '${filters.dataPagamentoInicio}' AND '${filters.dataPagamentoFim}'`);
            } else if (filters.dataPagamentoInicio) {
                whereConditions.push(`Fin.Data_Pagamento >= '${filters.dataPagamentoInicio}'`);
            } else if (filters.dataPagamentoFim) {
                whereConditions.push(`Fin.Data_Pagamento <= '${filters.dataPagamentoFim}'`);
            }

            // Filtro por situação de recebimento
            if (filters.situacaoRecebimento) {
                const situacaoValue = this.getSituacaoRecebimentoValue(filters.situacaoRecebimento);
                whereConditions.push(`Lhs.Situacao_Recebimento = ${situacaoValue}`);
            }

            // Filtro por data de pagamento do processo
            if (filters.dataPgtoProcessoInicio && filters.dataPgtoProcessoFim) {
                whereConditions.push(`Lhs.Data_Pagamento_Local BETWEEN '${filters.dataPgtoProcessoInicio}' AND '${filters.dataPgtoProcessoFim}'`);
            } else if (filters.dataPgtoProcessoInicio) {
                whereConditions.push(`Lhs.Data_Pagamento_Local >= '${filters.dataPgtoProcessoInicio}'`);
            } else if (filters.dataPgtoProcessoFim) {
                whereConditions.push(`Lhs.Data_Pagamento_Local <= '${filters.dataPgtoProcessoFim}'`);
            }

            // Filtro por situação de pagamento
            if (filters.situacaoPagamento) {
                const situacaoValue = this.getSituacaoPagamentoValue(filters.situacaoPagamento);
                whereConditions.push(`Lhs.Situacao_Pagamento = ${situacaoValue}`);
            }

            // Filtro por tipo de carga
            if (filters.tipoCarga) {
                const tipoCargaValue = this.getTipoCargaValue(filters.tipoCarga);
                whereConditions.push(`Lhs.Tipo_Carga = ${tipoCargaValue}`);
            }

            // Filtro por status do processo
            if (filters.statusProcesso) {
                whereConditions.push(`Spl.Descricao LIKE '%${filters.statusProcesso}%'`);
            }

            // Filtro por data de desembarque
            if (filters.dataDesembarqueInicio && filters.dataDesembarqueFim) {
                whereConditions.push(`Lms.Data_Desembarque BETWEEN '${filters.dataDesembarqueInicio}' AND '${filters.dataDesembarqueFim}'`);
            } else if (filters.dataDesembarqueInicio) {
                whereConditions.push(`Lms.Data_Desembarque >= '${filters.dataDesembarqueInicio}'`);
            } else if (filters.dataDesembarqueFim) {
                whereConditions.push(`Lms.Data_Desembarque <= '${filters.dataDesembarqueFim}'`);
            }

            // Filtro por conhecimento master
            if (filters.conhecimentoMaster) {
                whereConditions.push(`Lms.Numero_Conhecimento LIKE '%${filters.conhecimentoMaster}%'`);
            }

            // Filtro por companhia de transporte
            if (filters.companhiaTransporte) {
                whereConditions.push(`Cia.Nome LIKE '%${filters.companhiaTransporte}%'`);
            }
        }

        // Adicionar as condições WHERE à consulta
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        // Adicionar ordenação
        if (filters && filters.sortField && filters.sortOrder) {
            query += ` ORDER BY ${filters.sortField} ${filters.sortOrder}`;
        } else {
            query += ` ORDER BY Fin.Data_Vencimento DESC`;
        }

        // Adicionar paginação
        if (filters && filters.startRow !== undefined && filters.endRow !== undefined) {
            const rowCount = filters.endRow - filters.startRow;
            query = `
                WITH PaginatedResults AS (
                    SELECT 
                        *,
                        ROW_NUMBER() OVER (ORDER BY ${filters.sortField || 'Fin.Data_Vencimento'} ${filters.sortOrder || 'DESC'}) AS RowNum
                    FROM (
                        ${query}
                    ) AS SubQuery
                )
                SELECT * FROM PaginatedResults
                WHERE RowNum > ${filters.startRow} AND RowNum <= ${filters.endRow}
            `;
        }

        // Executar a consulta
        try {
            const result = await executeQuerySQL(query);
            
            // Formatar datas para o formato brasileiro
            const formattedResult = result.map(item => ({
                ...item,
                Data_Vencimento: item.Data_Vencimento ? this.formatDateToPtBr(item.Data_Vencimento) : null,
                Data_Pagamento: item.Data_Pagamento ? this.formatDateToPtBr(item.Data_Pagamento) : null,
                Data_Pgto_Processo: item.Data_Pgto_Processo ? this.formatDateToPtBr(item.Data_Pgto_Processo) : null,
                Data_Desembarque: item.Data_Desembarque ? this.formatDateToPtBr(item.Data_Desembarque) : null
            }));

            return formattedResult;
        } catch (error) {
            console.error('Erro ao executar consulta:', error);
            throw error;
        }
    },

    // Função para obter opções para os filtros
    getFilterOptions: async function() {
        try {
            // Obter status de processos logísticos
            const statusQuery = `SELECT DISTINCT Descricao FROM cad_Status_Processo_Logistico ORDER BY Descricao`;
            const statusResult = await executeQuerySQL(statusQuery);
            
            // Obter companhias de transporte
            const companhiasQuery = `
                SELECT DISTINCT Cia.Nome 
                FROM cad_Pessoa Cia 
                JOIN mov_Logistica_Master Lms ON Cia.IdPessoa = Lms.IdCompanhia_Transporte 
                WHERE Cia.Nome IS NOT NULL 
                ORDER BY Cia.Nome
            `;
            const companhiasResult = await executeQuerySQL(companhiasQuery);

            return {
                statusProcesso: statusResult.map(item => item.Descricao),
                companhiaTransporte: companhiasResult.map(item => item.Nome),
                situacaoRecebimento: [
                    'Sem recebimento',
                    'Em aberto',
                    'Parcialmente recebido',
                    'Recebido'
                ],
                situacaoPagamento: [
                    'Sem pagamento',
                    'Em aberto',
                    'Parcialmente pago',
                    'Pago'
                ],
                tipoCarga: [
                    'Aéreo',
                    'Break-Bulk',
                    'FCL',
                    'LCL',
                    'RO-RO',
                    'Rodoviário'
                ]
            };
        } catch (error) {
            console.error('Erro ao obter opções de filtro:', error);
            throw error;
        }
    },

    // Função auxiliar para formatar data para o formato brasileiro
    formatDateToPtBr: function(date) {
        if (!date) return null;
        
        const dateObj = new Date(date);
        const padToTwoDigits = (num) => num.toString().padStart(2, '0');
        
        const day = padToTwoDigits(dateObj.getDate());
        const month = padToTwoDigits(dateObj.getMonth() + 1);
        const year = dateObj.getFullYear();
        
        return `${day}/${month}/${year}`;
    },

    // Função auxiliar para obter o valor numérico da situação de recebimento
    getSituacaoRecebimentoValue: function(situacao) {
        switch (situacao) {
            case 'Sem recebimento': return 0;
            case 'Em aberto': return 1;
            case 'Parcialmente recebido': return 2;
            case 'Recebido': return 3;
            default: return null;
        }
    },

    // Função auxiliar para obter o valor numérico da situação de pagamento
    getSituacaoPagamentoValue: function(situacao) {
        switch (situacao) {
            case 'Sem pagamento': return 0;
            case 'Em aberto': return 1;
            case 'Parcialmente pago': return 2;
            case 'Pago': return 3;
            default: return null;
        }
    },

    // Função auxiliar para obter o valor numérico do tipo de carga
    getTipoCargaValue: function(tipoCarga) {
        switch (tipoCarga) {
            case 'Aéreo': return 1;
            case 'Break-Bulk': return 2;
            case 'FCL': return 3;
            case 'LCL': return 4;
            case 'RO-RO': return 5;
            case 'Rodoviário': return 6;
            default: return null;
        }
    },

    // Função para obter dados de distribuição de documentos
    getDocumentosDistribuicao: async function() {
        try {
            // Consulta SQL para obter dados de distribuição de documentos
            const query = `
                SELECT
                    Lcl.IdCampo_Livre,
                    Lcl.IdLogistica_House,
                    Lhs.Data_Abertura_Processo,
                    Ccl.Descricao,

                    CASE 
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 163 AND Clv.Valor_Tipo_Fixo = 1 THEN 'Liberado ao exportador'
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 163 AND Clv.Valor_Tipo_Fixo = 2 THEN 'Enviado Courrier'
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 163 AND Clv.Valor_Tipo_Fixo = 3 THEN 'Express Release'
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 163 AND Clv.Valor_Tipo_Fixo = 4 THEN 'Impressão no Destino'
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 162 AND Clv.Valor_Tipo_Fixo = 1 THEN 'Enviado Courrier'
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 162 AND Clv.Valor_Tipo_Fixo = 2 THEN 'Emissão destino'
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 162 AND Clv.Valor_Tipo_Fixo = 3 THEN 'e-BL'
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 168 THEN FORMAT(Clv.Valor_Data, 'dd/MM/yyyy')
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 169 THEN FORMAT(Clv.Valor_Data, 'dd/MM/yyyy')
                        WHEN Ccl.IdConfiguracao_Campo_Livre = 167 THEN FORMAT(Clv.Valor_Data, 'dd/MM/yyyy')
                    END AS Distribuicao_Documentos

                FROM
                   mov_Campo_Livre Clv
                LEFT OUTER JOIN
                   mov_Logistica_Campo_Livre Lcl ON Lcl.IdCampo_Livre = Clv.IdCampo_Livre
                LEFT OUTER JOIN
                    cad_Configuracao_Campo_Livre Ccl ON Ccl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                LEFT OUTER JOIN
                    mov_Logistica_House Lhs ON Lhs.IdLogistica_House = Lcl.IdLogistica_House
                WHERE
                    Ccl.IdConfiguracao_Campo_Livre IN (163 /*OHBL*/, 162 /*OMBL*/, 168 /*Envio dos Docs para Armador*/, 169 /*Liberação*/, 167 /*Recebimento dos Docs*/)
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%demu%'
            `;
            
            try {
                const result = await executeQuerySQL(query);
                console.log('Dados de distribuição de documentos obtidos com sucesso:', result.length, 'registros');
                return result;
            } catch (dbError) {
                console.error('Erro ao executar consulta SQL:', dbError);
                
                // Em caso de erro no banco de dados, retornar dados fictícios
                console.warn('Usando dados fictícios para distribuição de documentos devido a erro no banco de dados');
                
              
            }
        } catch (error) {
            console.error('Erro ao obter dados de distribuição de documentos:', error);
            throw error;
        }
    }
};

module.exports = {
    processQueryFilter
}; 