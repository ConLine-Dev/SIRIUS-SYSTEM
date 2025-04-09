const nodemailer = require('nodemailer');
const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');
const { sendEmail } = require('../support/send-email');
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); // Biblioteca para gerar UUID


const headcargo = {

gerenateCommission: async function(value){
   

    const modalidade = (value.modalidade).join(',');

    
    const comissaoVendedor = value.vendedorID != '000' ? `AND Comissao_Vendedor_Pago IN (${(value.comissaoVendedor).join(',')})` : ''

    const ComissaoInside = value.InsideID != '000' ? `AND Comissao_Inside_Sales_Pago IN (${(value.ComissaoInside).join(',')})` : '';
 
    const vendedorID = value.vendedorID != '000' ? `AND IdVendedor = ${value.vendedorID}` : '';
    const InsideID = value.InsideID != '000' ? `AND IdInside_Sales = ${value.InsideID}` : '';

    // console.log('aqui', value.recebimento, value.pagamento)
    // console.log(value.recebimento, value.pagamento)
    const recebimento = `AND RecebimentoCodigo IN (${(value.recebimento).join(',')})`;
    const pagamento = `AND PagamentoCodigo IN (${(value.pagamento).join(',')})`;

    
    const AgenteCodigo = `AND AgenteCodigo IN (${[0, ...value.ComissaoAgente].join(',')})`;
    
    const Abertura_Processo = `AND (CAST(Data_Compensacao AS DATE) >= '${value.dataDe}' AND CAST(Data_Compensacao AS DATE) <= '${value.dataAte}')`;

    
    
    const sql = `WITH CTE_Logistica AS (
       SELECT
          Lhs.IdLogistica_House,
          Lhs.IdCliente,
          Lhs.IdImportador,
          Lhs.IdExportador,
          Lhs.IdDespachante_Aduaneiro,
          CASE 
             WHEN Inc.Qtd_Fatura > 0 THEN 1
             ELSE 0
          END AS Incentivo,
          CASE
             WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 'EA'
             WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 'EM'
             WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 3 THEN 'TE'
             WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 'IA'
             WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 'IM'
             WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 3 THEN 'TI'
             WHEN Lms.Tipo_Operacao = 3 AND Lms.Modalidade_Processo = 1 THEN 'NA'
             WHEN Lms.Tipo_Operacao = 3 AND Lms.Modalidade_Processo = 2 THEN 'CB'
             WHEN Lms.Tipo_Operacao = 3 AND Lms.Modalidade_Processo = 3 THEN 'TN'
          END AS Modalidade,
    
          CASE
             WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 1 THEN 1
             WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 2 THEN 2
             WHEN Lms.Tipo_Operacao = 1 AND Lms.Modalidade_Processo = 3 THEN 3
             WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 1 THEN 4
             WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 2 THEN 5
             WHEN Lms.Tipo_Operacao = 2 AND Lms.Modalidade_Processo = 3 THEN 6
             WHEN Lms.Tipo_Operacao = 3 AND Lms.Modalidade_Processo = 1 THEN 7
             WHEN Lms.Tipo_Operacao = 3 AND Lms.Modalidade_Processo = 2 THEN 8
             WHEN Lms.Tipo_Operacao = 3 AND Lms.Modalidade_Processo = 3 THEN 9
          END AS ModalidadeCodigo,
    
          Lhs.Numero_Processo,
          Lhs.Data_Abertura_Processo AS Abertura_Processo,
          CONVERT(VARCHAR(10), Lhs.Data_Abertura_Processo, 23) AS Abertura_Processo_Convertida,
    
          CASE
             WHEN Lms.Tipo_Operacao = 1 THEN COALESCE(Lms.Data_Embarque, Lms.Data_Previsao_Embarque)
             WHEN Lms.Tipo_Operacao = 2 THEN COALESCE(Lms.Data_Desembarque, Lms.Data_Previsao_Desembarque)
             ELSE COALESCE(Lms.Data_Embarque, Lms.Data_Previsao_Embarque)
          END AS Data_Compensacao,
    
          CASE
             WHEN Lms.Tipo_Operacao = 1 THEN COALESCE(CONVERT(VARCHAR, Lms.Data_Embarque, 23), CONVERT(VARCHAR, Lms.Data_Previsao_Embarque,23))
             WHEN Lms.Tipo_Operacao = 2 THEN COALESCE(CONVERT(VARCHAR, Lms.Data_Desembarque,23), CONVERT(VARCHAR,Lms.Data_Previsao_Desembarque,23))
             ELSE COALESCE(CONVERT(VARCHAR, Lms.Data_Embarque, 23), CONVERT(VARCHAR,Lms.Data_Previsao_Embarque,23))
          END AS Data_Compensacao_Convertido,
    
          Urf.Data_Frete,
    
          COALESCE(Lms.Data_Embarque, Lms.Data_Previsao_Embarque) AS 'ETD/ATD',
    
          COALESCE(Lms.Data_Desembarque, Lms.Data_Previsao_Desembarque) AS 'ETA/ATA',        
    
          CASE Lhs.Tipo_Carga
             WHEN 1 THEN 'Aéreo'
             WHEN 2 THEN 'Break-Bulk'
             WHEN 3 THEN 'FCL'
             WHEN 4 THEN 'LCL'
             WHEN 5 THEN 'RO-RO'
             WHEN 6 THEN 'Rodoviário'
          END AS Tipo_Carga,
    
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
    
          Cli.Nome AS Cliente,
          Ven.Nome AS Vendedor,
          Ven.IdPessoa AS IdVendedor,
          Ins.Nome AS Inside_Sales,
          Ins.IdPessoa AS IdInside_Sales,
          Exp.Nome AS Exportador,
          Imp.Nome AS Importador,
    
          COALESCE(Lhs.Comissao_Vendedor_Pago, 0) AS Comissao_Vendedor_Pago,
          COALESCE(Lhs.Comissao_Inside_Sales_Pago, 0) AS Comissao_Inside_Sales_Pago,
    
          CASE Lhs.Situacao_Agenciamento
             WHEN 1 THEN 'Em aberto'
             WHEN 2 THEN 'Em Andamento'
             WHEN 3 THEN 'Lib. Faturamento'
             WHEN 4 THEN 'Faturamento'
             WHEN 5 THEN 'Finalizado'
             WHEN 6 THEN 'Auditado'
             WHEN 7 THEN 'Cancelado'
          END AS Situacao_Processo,
    
          CASE Lhs.Situacao_Recebimento
             WHEN 0 THEN 'Sem recebimento'
             WHEN 1 THEN 'Em aberto'
             WHEN 2 THEN 'Parcialmente recebido'
             WHEN 3 THEN 'Recebido'
          END AS Recebimento,
    
          CASE
             WHEN Lhs.Situacao_Recebimento = 0 THEN 0
             WHEN Lhs.Situacao_Recebimento = 1 THEN 1
             WHEN Lhs.Situacao_Recebimento = 2 THEN 2
             WHEN Lhs.Situacao_Recebimento = 3 THEN 3
             WHEN Lhs.Situacao_Recebimento = 3 AND Fcr.Status_Fatura = 'Quitado' AND Inc.Qtd_Fatura > 0 THEN 3
          END AS RecebimentoCodigo,
    
          Lhs.Data_Recebimento_Local AS Data_Recebimento,
    
          CASE Lhs.Situacao_Pagamento
             WHEN 0 THEN 'Sem pagamento'
             WHEN 1 THEN 'Em aberto'
             WHEN 2 THEN 'Parcialmente pago'
             WHEN 3 THEN 'Pago'
          END AS Pagamento,
    
          CASE
             WHEN Lhs.Situacao_Pagamento = 0 THEN 0
             WHEN Lhs.Situacao_Pagamento = 1 THEN 1
             WHEN Lhs.Situacao_Pagamento = 2 THEN 2
             WHEN Lhs.Situacao_Pagamento = 3 AND Fde.Status_Fatura = 'Quitado' THEN 3
          END AS PagamentoCodigo,
    
          Lhs.Data_Pagamento_Local AS Data_Pagamento,
    
          CASE Lhs.Situacao_Acerto_Agente
             WHEN 0 THEN 'Sem acerto agente'
             WHEN 1 THEN 'Em aberto'
             WHEN 2 THEN 'Parcialmente pago'
             WHEN 3 THEN 'Pago'
          END AS Agente,
    
          
    
          Lhs.Situacao_Acerto_Agente AS AgenteCodigo,
          Lhs.Data_Acerto_Agente AS Data_Agente,
    
          CASE
             WHEN Incbai.Valor_Recebimento_Total >= 0 /*Quitada*/ AND Lmo.Lucro_Estimado > COALESCE(Incbai.Valor_Recebimento_Total, 0) THEN (Lmo.Lucro_Estimado - COALESCE(Incbai.Valor_Recebimento_Total, 0))
             WHEN Incbai.Valor_Recebimento_Total >= 0 /*Quitada*/ AND Lmo.Lucro_Estimado < COALESCE(Incbai.Valor_Recebimento_Total, 0) THEN (Lmo.Lucro_Estimado)
             WHEN Lmo.Lucro_Estimado >= COALESCE(Inc.Valor_Recebimento_Total, 0) THEN (Lmo.Lucro_Estimado - COALESCE(Inc.Valor_Recebimento_Total, 0))
             WHEN Lmo.Lucro_Estimado < COALESCE(Inc.Valor_Recebimento_Total, 0) THEN ((Lmo.Lucro_Estimado) + COALESCE(Inc.Valor_Recebimento_Total, 0))
          END AS Valor_Estimado,
    
          CASE
             WHEN Incbai.Valor_Recebimento_Total >= 0 /*Quitada*/ AND Lmo.Lucro_Efetivo > COALESCE(Incbai.Valor_Recebimento_Total, 0) THEN (Lmo.Lucro_Efetivo - COALESCE(Incbai.Valor_Recebimento_Total, 0))
             WHEN Incbai.Valor_Recebimento_Total >= 0 /*Quitada*/ AND Lmo.Lucro_Efetivo < COALESCE(Incbai.Valor_Recebimento_Total, 0) THEN (Lmo.Lucro_Efetivo)
             WHEN Incbai.Valor_Recebimento_Total IS NULL AND Lmo.Lucro_Efetivo >= COALESCE(Inc.Valor_Recebimento_Total, 0) THEN Lmo.Lucro_Efetivo
             WHEN Incbai.Valor_Recebimento_Total IS NULL AND Lmo.Lucro_Efetivo < COALESCE(Inc.Valor_Recebimento_Total, 0) THEN ((Lmo.Lucro_Efetivo) + COALESCE(Inc.Valor_Recebimento_Total, 0))
          END AS Valor_Efetivo,
    
          CASE
             WHEN Lmo.Total_Recebimento = Lmo.Total_Recebido THEN 1
             ELSE 0
          END AS Recebimento_Quitado,
    
          COALESCE(Qsc.Qtd_SContainer, 0) AS Cntr_Nao_Devolvidos,
          COALESCE(Qft.Qtd_Fatura, 0) AS Faturas_Nao_Finalizadas,
          COALESCE(Qsb.Qtd_SBaixa, 0) AS Faturas_Nao_Baixadas,
    
          ComInter.Situacao
    
       FROM
          mov_Logistica_House Lhs
       LEFT OUTER JOIN
          mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master        
       LEFT OUTER JOIN
          mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House
       LEFT OUTER JOIN
          cad_Pessoa Cli ON Cli.IdPessoa = Lhs.IdCliente
       LEFT OUTER JOIN
          cad_Pessoa Ven ON Ven.IdPessoa = Lhs.IdVendedor
       LEFT OUTER JOIN
          mov_Projeto_Atividade_Responsavel Par ON Par.IdProjeto_Atividade = Lhs.IdProjeto_Atividade AND Par.IdPapel_Projeto = 12 --Inside Sales
       LEFT OUTER JOIN
          cad_Pessoa Ins ON Ins.IdPessoa = Par.IdResponsavel
       LEFT OUTER JOIN
          cad_Pessoa Exp ON Exp.IdPessoa = Lhs.IdExportador
       LEFT OUTER JOIN
          cad_Pessoa Imp ON Imp.IdPessoa = Lhs.IdImportador
    
       LEFT OUTER JOIN (
          SELECT
             Ltx.IdLogistica_House,
             MIN(Rfn.Data_Referencia) AS Data_Frete
          FROM
             mov_Logistica_Taxa Ltx
          LEFT OUTER JOIN
             mov_Logistica_Fatura Lft ON Lft.IdLogistica_House = Ltx.IdLogistica_House       
          LEFT OUTER JOIN
             mov_Registro_Financeiro Rfn ON Rfn.IdRegistro_Financeiro = Lft.IdRegistro_Financeiro
          WHERE
             Ltx.IdTaxa_Logistica_Exibicao IN (2,4,43,199,207,397,472)
          GROUP BY
             Ltx.IdLogistica_House
       ) Urf ON Urf.IdLogistica_House = Lhs.IdLogistica_House
    
       LEFT OUTER JOIN (
          SELECT
             Lmc.IdLogistica_House,
             Count(Lmc.IdLogistica_Maritima_Container) AS Qtd_SContainer
          FROM
             mov_Logistica_Maritima_Container Lmc
          WHERE
             Lmc.Data_Devolucao IS NULL
          GROUP BY
             Lmc.IdLogistica_House
       ) Qsc ON Qsc.IdLogistica_House = Lhs.IdLogistica_House
    
       LEFT OUTER JOIN(
          SELECT
             Lft.IdLogistica_House,
             COUNT(Fnc.IdRegistro_Financeiro) AS Qtd_Fatura
          FROM
             mov_Logistica_Fatura Lft
          LEFT OUTER JOIN
             mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Lft.IdRegistro_Financeiro
          WHERE
             Fnc.tipo = 1 --Fatura
          GROUP BY
             Lft.IdLogistica_House
       ) Qft ON Qft.IdLogistica_House = Lhs.IdLogistica_House
    
       LEFT OUTER JOIN (
          SELECT
             Lft.IdLogistica_House,
             Count(Lft.IdRegistro_Financeiro) AS Qtd_SBaixa
          FROM
             vis_Logistica_Fatura Lft
          LEFT OUTER JOIN
             mov_Fatura_Financeira Ffn ON Ffn.IdRegistro_Financeiro = Lft.IdRegistro_Financeiro
          WHERE
             Lft.Situacao = 1 -- EM ABERTO
          GROUP BY
             Lft.IdLogistica_House
       ) Qsb ON Qsb.IdLogistica_House = Lhs.IdLogistica_House
    
       -- Verifica se todas as faturas de PAGAMENTO estão quitadas ou não
       LEFT OUTER JOIN (
          SELECT
             Lft.IdLogistica_House,
             CASE
                   WHEN COUNT(CASE WHEN Lft.Situacao = 1 /* FATURA ABERTAS */ AND Lft.Natureza = 0 /*DEBITO*/ THEN 1 END) > 0 THEN 'Fatura_Aberta'
                   ELSE 'Quitado'
             END AS Status_Fatura
          FROM
             vis_Logistica_Fatura Lft
          GROUP BY
             Lft.IdLogistica_House
       ) Fde ON Fde.IdLogistica_House = Lhs.IdLogistica_House
    
       -- Verifica se todas as faturas de RECEBIMENTO estão quitadas ou não
       LEFT OUTER JOIN (
          SELECT
             Lft.IdLogistica_House,
             CASE
                WHEN COUNT(CASE WHEN Lft.Situacao = 1 /* FATURA ABERTAS */ AND Lft.Natureza = 1 /*CREDITO*/ THEN 1 END) > 0 THEN 'Fatura_Aberta'
                ELSE 'Quitado'
             END AS Status_Fatura
          FROM
             vis_Logistica_Fatura Lft
          GROUP BY
             Lft.IdLogistica_House
       ) Fcr ON Fcr.IdLogistica_House = Lhs.IdLogistica_House
    
       -- Soma o valor das taxas de incentivo sem considerar se esta baixado ou nao
       LEFT OUTER JOIN (
          SELECT
             Ltx.IdLogistica_House,
             SUM(CASE 
                WHEN Ltx.IdMoeda_Recebimento != 110 /*Real*/ THEN ROUND((Ltx.Valor_Recebimento_Total * COALESCE(Lfc.Fator_Conversao, 1)), 2)
                ELSE Ltx.Valor_Recebimento_Total
             END) AS Valor_Recebimento_Total,
             COUNT(Ltx.IdRegistro_Recebimento) AS Qtd_Fatura
          FROM
             mov_Logistica_Taxa Ltx
          LEFT OUTER JOIN
             vis_Logistica_Fatura Vlf ON Vlf.IdRegistro_Financeiro = Ltx.IdRegistro_Recebimento
          LEFT OUTER JOIN
             mov_Logistica_Fatura_Conversao Lfc ON Lfc.IdLogistica_Fatura = Vlf.IdRegistro_Financeiro AND Ltx.IdMoeda_Recebimento = Lfc.IdMoeda_Origem
          WHERE
             Ltx.IdTaxa_Logistica_Exibicao IN (245 /*INCENTIVO ASIA*/, 441/*INCENTIVO TERMINAL*/, 517/*INCENTIVO ASIA MARITIMO*/)
          GROUP BY
             Ltx.IdLogistica_House
       ) Inc ON Inc.IdLogistica_House = Lhs.IdLogistica_House
    
       -- Soma o valor das taxas de incentivo que estejam em faturas baixadas
       LEFT OUTER JOIN (
          SELECT
             Ltx.IdLogistica_House,
             SUM(CASE
                WHEN Ltx.IdMoeda_Recebimento != 110 /*Real*/ THEN ROUND((Ltx.Valor_Recebimento_Total * COALESCE(Lfc.Fator_Conversao, 1)), 2)
                ELSE Ltx.Valor_Recebimento_Total
             END) AS Valor_Recebimento_Total
          FROM
             mov_Logistica_Taxa Ltx
          LEFT OUTER JOIN
             vis_Logistica_Fatura Vlf ON Vlf.IdRegistro_Financeiro = Ltx.IdRegistro_Recebimento
          LEFT OUTER JOIN
             mov_Logistica_Fatura_Conversao Lfc ON Lfc.IdLogistica_Fatura = Vlf.IdRegistro_Financeiro AND Ltx.IdMoeda_Recebimento = Lfc.IdMoeda_Origem
          WHERE
             Ltx.IdTaxa_Logistica_Exibicao IN (245 /*INCENTIVO ASIA*/, 441/*INCENTIVO TERMINAL*/, 517/*INCENTIVO ASIA MARITIMO*/)
             AND Vlf.Situacao = 2 /*QUITADA*/
          GROUP BY
             Ltx.IdLogistica_House
       ) Incbai ON Incbai.IdLogistica_House = Lhs.IdLogistica_House
    
       -- Verifica se existe fatura com taxa de Comissao Intermediario e se a mesma esta paga
       LEFT OUTER JOIN (
          SELECT
             Ltx.IdLogistica_House,
             MAX(Vlf.Situacao) AS Situacao,
             SUM(CASE
                WHEN Ltx.IdMoeda_Pagamento != 110 /*Real*/ THEN ROUND((Ltx.Valor_Pagamento_Total * COALESCE(Lfc.Fator_Conversao, 1)), 2)
                ELSE Ltx.Valor_Pagamento_Total
             END) AS Valor_Pagamento_Total
          FROM
             mov_Logistica_Taxa Ltx
          LEFT OUTER JOIN
             vis_Logistica_Fatura Vlf ON Vlf.IdRegistro_Financeiro = Ltx.IdRegistro_Pagamento
          LEFT OUTER JOIN
             mov_Logistica_Fatura_Conversao Lfc ON Lfc.IdLogistica_Fatura = Vlf.IdRegistro_Financeiro AND Ltx.IdMoeda_Pagamento = Lfc.IdMoeda_Origem
          WHERE
             Ltx.IdTaxa_Logistica_Exibicao IN (16 /*COMISSAO INTERMEDIARIO*/)
          GROUP BY
             Ltx.IdLogistica_House
       ) ComInter ON ComInter.IdLogistica_House = Lhs.IdLogistica_House
    
       WHERE
       Lhs.Situacao_Agenciamento NOT IN (7)
          AND Lhs.Numero_Processo NOT LIKE '%test%'
          AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
          AND Lhs.Agenciamento_Carga = 1
          AND YEAR(Lhs.Data_Abertura_Processo) >= 2022
          AND Lmo.IdMoeda = 110
    ),
    Verifica_Fatura_Vencida AS (
       SELECT
          Psa.IdPessoa,
          Psa.Nome AS Pessoa,
          COUNT(Vlf.IdRegistro_Financeiro) AS Qtd_Fatura_Vencidas,
          DATEDIFF(DAY, MIN(Fnc.Data_Vencimento), GETDATE()) AS Dias_Vencido,
          FORMAT(SUM(Vlf.Valor_Total * Vlf.Fator_Corrente), 'C', 'pt-BR') AS Valor_Vencido,  
          CASE
             -- Pessoa com acordo e com mais de uma fatura vencida
             WHEN COALESCE(Cpg.IdCondicao_Pagamento, 0) NOT IN (1, 18, 17, 0) AND COUNT(Vlf.IdRegistro_Financeiro) > 1 THEN CONCAT('Com acordo e possui ', COUNT(Vlf.IdRegistro_Financeiro), ' faturas vencidas com valor total de ', FORMAT(SUM(Vlf.Valor_Total * Vlf.Fator_Corrente), 'C', 'pt-BR'))
             -- Pessoa com acordo e com uma fatura vencida
             WHEN COALESCE(Cpg.IdCondicao_Pagamento, 0) NOT IN (1, 18, 17, 0) AND COUNT(Vlf.IdRegistro_Financeiro) = 1 THEN CONCAT('Com acordo e possui ', COUNT(Vlf.IdRegistro_Financeiro), ' fatura vencida há ', DATEDIFF(DAY, MIN(Fnc.Data_Vencimento), GETDATE()), ' dias, com valor total de ', FORMAT(SUM(Vlf.Valor_Total * Vlf.Fator_Corrente), 'C', 'pt-BR'))
             -- Pessoa sem acordo e com mais de uma fatura vencida
             WHEN COALESCE(Cpg.IdCondicao_Pagamento, 0) IN (1, 18, 17, 0) AND COUNT(Vlf.IdRegistro_Financeiro) > 1 THEN CONCAT('Sem acordo e possui ', COUNT(Vlf.IdRegistro_Financeiro), ' faturas vencidas com valor total de ', FORMAT(SUM(Vlf.Valor_Total * Vlf.Fator_Corrente), 'C', 'pt-BR'))
             -- Pessoa sem acordo e com uma fatura vencida
             WHEN COALESCE(Cpg.IdCondicao_Pagamento, 0) IN (1, 18, 17, 0) AND COUNT(Vlf.IdRegistro_Financeiro) = 1 THEN CONCAT('Sem acordo e possui ', COUNT(Vlf.IdRegistro_Financeiro), ' fatura vencida há ', DATEDIFF(DAY, MIN(Fnc.Data_Vencimento), GETDATE()), ' dias, com valor total de ', FORMAT(SUM(Vlf.Valor_Total * Vlf.Fator_Corrente), 'C', 'pt-BR'))
          END AS Status_Faturas
       FROM
          mov_Logistica_House Lhs
       LEFT OUTER JOIN
          mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master        
       LEFT OUTER JOIN
          vis_Logistica_Fatura Vlf ON Vlf.IdLogistica_House = Lhs.IdLogistica_House
       LEFT OUTER JOIN
          mov_Fatura_Financeira Fnc ON Fnc.IdRegistro_Financeiro = Vlf.IdRegistro_Financeiro 
       LEFT OUTER JOIN
          cad_Pessoa Psa ON Psa.IdPessoa = Vlf.IdPessoa
       LEFT OUTER JOIN
          cad_Contrato_Financeiro Cfn on Cfn.IdContrato_Financeiro = Psa.IdContrato_Financeiro
       LEFT OUTER JOIN
          cad_Contrato_Logistica_Item Cli on Cli.IdContrato_Financeiro = Cfn.IdContrato_Financeiro
       LEFT OUTER JOIN
          cad_Condicao_Pagamento Cpg on Cpg.IdCondicao_Pagamento = Cli.IdCondicao_Pagamento  
       WHERE
          Fnc.Data_Vencimento < GETDATE()
          AND Fnc.Tipo = 2 -- Finalizada
          AND Fnc.Situacao NOT IN (2) -- Quitado
          AND Lhs.Situacao_Agenciamento NOT IN (7) -- Não esteja cancelado
          AND Lms.Situacao_Embarque NOT IN (4) -- Cancelado
          AND Vlf.Tipo_Fatura = 2 -- Recebimento
          AND (Vlf.IdPessoa = Lhs.IdCliente OR Vlf.IdPessoa = Lhs.IdImportador OR Vlf.IdPessoa = Lhs.IdExportador OR Vlf.IdPessoa = Lhs.IdDespachante_Aduaneiro)
          AND Lhs.Numero_Processo NOT LIKE '%test%'
       GROUP BY
          Psa.Nome,
          Psa.IdPessoa,
          Cpg.IdCondicao_Pagamento
       HAVING
          DATEDIFF(DAY, MIN(Fnc.Data_Vencimento), GETDATE()) <> 0
    ),
    -- Nova CTE para agregar as informações de faturas vencidas
    FaturasVencidasAgregadas AS (
        SELECT 
            IdLogistica_House,
            MAX(Status_Faturas) as Status_Faturas,
            MAX(Qtd_Fatura_Vencidas) as Qtd_Fatura_Vencidas,
            MAX(Dias_Vencido) as Dias_Vencido,
            MAX(Valor_Vencido) as Valor_Vencido,
            MAX(Pessoa_Fatura) as Pessoa_Fatura
        FROM (
            SELECT 
                Cte.IdLogistica_House,
                Vfv.Status_Faturas,
                Vfv.Qtd_Fatura_Vencidas,
                Vfv.Dias_Vencido,
                Vfv.Valor_Vencido,
                Vfv.IdPessoa AS Pessoa_Fatura
            FROM 
                CTE_Logistica Cte
            LEFT OUTER JOIN
                Verifica_Fatura_Vencida Vfv ON (
                    Vfv.IdPessoa = Cte.IdCliente OR 
                    Vfv.IdPessoa = Cte.IdImportador OR 
                    Vfv.IdPessoa = Cte.IdExportador OR 
                    Vfv.IdPessoa = Cte.IdDespachante_Aduaneiro
                )
        ) AS FaturasExpandidas
        GROUP BY IdLogistica_House
    )
    SELECT
       Fva.Status_Faturas,
       Fva.Qtd_Fatura_Vencidas,
       Fva.Dias_Vencido,
       Fva.Valor_Vencido,
       Fva.Pessoa_Fatura,
       Cte.*
    FROM
       CTE_Logistica Cte
    LEFT OUTER JOIN
       FaturasVencidasAgregadas Fva ON Fva.IdLogistica_House = Cte.IdLogistica_House
    WHERE
       ModalidadeCodigo IN (${modalidade})
       ${comissaoVendedor}
       ${ComissaoInside}
       ${vendedorID}
       ${InsideID}
       ${pagamento}
       ${recebimento}
       ${AgenteCodigo}
       ${Abertura_Processo}`



       
    const commissions = await executeQuerySQL(sql)


 

    let valor_Estimado_total = 0
    let valor_Comissao_total = 0
    let valor_Efetivo_total = 0

    let userComission = InsideID != "" ? value.InsideID : vendedorID != "" ? value.vendedorID : null
    let commissioned_type = InsideID != "" ? 2 : vendedorID != "" ? 1 : null

    // comissão por processo 
    // for (let index = 0; index < commissions.length; index++) {
    //   const element = commissions[index];
    //   const percentagemResult = await headcargo.getPercentagemComissionByHeadID(userComission, commissioned_type, element.Valor_Efetivo);
       
    //   let percentagem = 0;
    //   if (percentagemResult.status) {
    //       percentagem = percentagemResult.percentage;
    //   }

    

       
    //     valor_Estimado_total += element.Valor_Estimado
    //     valor_Comissao_total += element.Valor_Efetivo * (percentagem / 100)
    //     valor_Efetivo_total += element.Valor_Efetivo
    // }
    // end comissão por processo 

    // comissão por lucro total 
    for (let index = 0; index < commissions.length; index++) {
       const element = commissions[index];
       
       valor_Estimado_total += element.Valor_Estimado
       valor_Efetivo_total += element.Valor_Efetivo
    }

    const percentagemResult = await headcargo.getPercentagemComissionByHeadID(userComission, commissioned_type, valor_Efetivo_total);
    let percentagem = 0;
       if (percentagemResult.status) {
          percentagem = percentagemResult.percentage;
    }
    valor_Comissao_total = valor_Efetivo_total * (percentagem / 100)

    // Mapear os resultados e formatar a data
    const resultadosFormatados = commissions.map(item => ({
       'IdLogistica_House': item.IdLogistica_House,
       'Incentivo': item.Incentivo,
       'check': `<input class="form-check-input me-2 selectCheckbox" data-comissao="${ item.Valor_Efetivo ? (item.Valor_Efetivo * (percentagem / 100)) : 0 }" data-value="${(item.Valor_Efetivo || 0)}" data-id="${item.IdLogistica_House}" type="checkbox" ${item.Qtd_Fatura_Vencidas > 0 ? '' : 'checked'}>`,
       'modal': item.Modalidade,
       'processo': item.Numero_Processo,
       'abertura': '<span style="display:none">'+item.Abertura_Processo_Convertida+'</span>'+new Date(item.Abertura_Processo).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
       'data_compensacao': '<span style="display:none">'+item.Data_Compensacao_Convertido+'</span>'+ item.Data_Compensacao_Convertido ? new Date(item.Data_Compensacao_Convertido).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
       'tipo': item.Tipo_Carga,
       'cliente': headcargo.formatarNome(item.Cliente),
       'vendedor': headcargo.formatarNome(item.Vendedor),
       'inside': headcargo.formatarNome(item.Inside_Sales),
       'importador': headcargo.formatarNome(item.Importador),
       'exportador': headcargo.formatarNome(item.Exportador),
       'valorComissao': (item.Valor_Efetivo ? (item.Valor_Efetivo * (percentagem / 100) ).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}) : 0),
       'comissao_vendedor': item.Comissao_Vendedor_Pago == 0 ? 'Pendente' : 'Pago',
       'comissao_inside': item.Comissao_Inside_Sales_Pago == 0 ? 'Pendente' : 'Pago',
       'estimado': (item.Valor_Estimado || 0).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
       'efetivo': (item.Valor_Efetivo || 0).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
       'restante': ((item.Valor_Efetivo || 0) - (item.Valor_Estimado || 0)).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
       'fatura_status': item.Status_Faturas,
       'fatura_quant_vencidas': item.Qtd_Fatura_Vencidas,
       'fatura_dias_vencimento': item.Dias_Vencido,
       'fatura_valor_vencimento': item.Valor_Vencido,
       'fatura_pessoa_fatura': item.Pessoa_Fatura,
 }));


 // end comissão por lucro total 

    const format = {
       "data": resultadosFormatados,
       percentagem:percentagem,
       valor_Efetivo_total:(valor_Efetivo_total).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
       valor_Estimado_total:(valor_Estimado_total).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
       valor_Comissao_total:(valor_Comissao_total).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
       quantidade_processo:commissions.length
    }

    return format;

 },

}


module.exports = {
    headcargo,
 };
 