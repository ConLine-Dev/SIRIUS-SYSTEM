const nodemailer = require('nodemailer');
const { executeQuerySQL } = require('../connect/sqlServer');
const { executeQuery } = require('../connect/mysql');



const headcargo = {
    // INICIO API CONTROLE DE COMISSÃO
    gerenateCommission: async function(value){
     

        const modalidade = (value.modalidade).join(',');

       
        const comissaoVendedor = value.vendedorID != '000' ? `AND Comissao_Vendedor_Pago IN (${(value.comissaoVendedor).join(',')})` : ''

        const ComissaoInside = value.InsideID != '000' ? `AND Comissao_Inside_Sales_Pago IN (${(value.ComissaoInside).join(',')})` : '';
    
        const vendedorID = value.vendedorID != '000' ? `AND IdVendedor = ${value.vendedorID}` : '';
        const InsideID = value.InsideID != '000' ? `AND IdInside_Sales = ${value.InsideID}` : '';

        const recebimento = `AND RecebimentoCodigo IN (${(value.recebimento).join(',')})`;
        const pagamento = `AND PagamentoCodigo IN (${(value.pagamento).join(',')})`;

        
        const AgenteCodigo = `AND AgenteCodigo IN (${[0, ...value.ComissaoAgente].join(',')})`;
        
        const Abertura_Processo = `AND (CAST(Data_Compensacao AS DATE) >= '${value.dataDe}' AND CAST(Data_Compensacao AS DATE) <= '${value.dataAte}')`;

        
        
        const sql = `WITH CTE_Logistica AS (
          SELECT
             Lhs.IdLogistica_House,
       
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
                WHEN Lhs.Situacao_Pagamento = 3 THEN 3
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
             (Lmo.Lucro_Estimado - COALESCE(Inc.Valor_Recebimento_Total, 0)) AS Valor_Estimado,       
             (Lmo.Lucro_Efetivo - COALESCE(Incbai.Valor_Recebimento_Total, 0)) AS Valor_Efetivo,      
       
             CASE
                WHEN Lmo.Total_Recebimento = Lmo.Total_Recebido THEN 1
                ELSE 0
             END AS Recebimento_Quitado,
       
             COALESCE(Qsc.Qtd_SContainer, 0) AS Cntr_Nao_Devolvidos,
             COALESCE(Qft.Qtd_Fatura, 0) AS Faturas_Nao_Finalizadas,
             COALESCE(Qsb.Qtd_SBaixa, 0) AS Faturas_Nao_Baixadas
       
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
                COUNT(Ltx.IdRegistro_Recebimento) AS Qtd_Fatura,
                CASE
                   WHEN Ltx.IdMoeda_Recebimento != 110 /*Real*/ THEN ROUND((Ltx.Valor_Recebimento_Total * Lfc.Fator_Conversao), 2)
                   ELSE Ltx.Valor_Recebimento_Total
                END AS Valor_Recebimento_Total
             FROM
                mov_Logistica_Taxa Ltx
             LEFT OUTER JOIN
                vis_Logistica_Fatura Vlf ON Vlf.IdRegistro_Financeiro = Ltx.IdRegistro_Recebimento
             LEFT OUTER JOIN
                mov_Logistica_Fatura_Conversao Lfc ON Lfc.IdLogistica_Fatura = Vlf.IdRegistro_Financeiro AND Ltx.IdMoeda_Recebimento = Lfc.IdMoeda_Origem
             WHERE
                Ltx.IdTaxa_Logistica_Exibicao IN (245 /*INCENTIVO ASIA*/, 441/*INCENTIVO TERMINAL*/, 517/*INCENTIVO ASIA MARITIMO*/)
             GROUP BY
                Ltx.IdLogistica_House,
                Ltx.IdMoeda_Recebimento,
                Ltx.Valor_Recebimento_Total,
                Lfc.Fator_Conversao
          ) Inc ON Inc.IdLogistica_House = Lhs.IdLogistica_House
       
          -- Soma o valor das taxas de incentivo que estejam em faturas baixadas
          LEFT OUTER JOIN (
             SELECT
                Ltx.IdLogistica_House,
                CASE
                   WHEN Ltx.IdMoeda_Recebimento != 110 /*Real*/ THEN ROUND((Ltx.Valor_Recebimento_Total * Lfc.Fator_Conversao), 2)
                   ELSE Ltx.Valor_Recebimento_Total
                END AS Valor_Recebimento_Total
             FROM
                mov_Logistica_Taxa Ltx
             LEFT OUTER JOIN
                vis_Logistica_Fatura Vlf ON Vlf.IdRegistro_Financeiro = Ltx.IdRegistro_Recebimento
             LEFT OUTER JOIN
                mov_Logistica_Fatura_Conversao Lfc ON Lfc.IdLogistica_Fatura = Vlf.IdRegistro_Financeiro AND Ltx.IdMoeda_Recebimento = Lfc.IdMoeda_Origem
             WHERE
                Ltx.IdTaxa_Logistica_Exibicao IN (245 /*INCENTIVO ASIA*/, 441/*INCENTIVO TERMINAL*/, 517/*INCENTIVO ASIA MARITIMO*/)
                AND Vlf.Situacao = 2 /*QUITADA*/
          ) Incbai ON Incbai.IdLogistica_House = Lhs.IdLogistica_House
       
          WHERE
          Lhs.Situacao_Agenciamento NOT IN (7)
             AND Lhs.Numero_Processo NOT LIKE '%test%'
             AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
             AND Lhs.Agenciamento_Carga = 1
             AND YEAR(Lhs.Data_Abertura_Processo) >= 2022
             AND Lmo.IdMoeda = 110
       )
       SELECT
          *
       FROM
          CTE_Logistica
       WHERE
        ModalidadeCodigo IN (${modalidade})
        ${comissaoVendedor}
        ${ComissaoInside}
        ${vendedorID}
        ${InsideID}
        ${pagamento}
        ${recebimento}
        ${AgenteCodigo}
        ${Abertura_Processo}
        `

        console.log(sql)

          
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
          'check': `<input class="form-check-input me-2 selectCheckbox" data-id="${item.IdLogistica_House}" type="checkbox" checked="">`,
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
          'restante': ((item.Valor_Efetivo || 0) - (item.Valor_Estimado || 0)).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
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
    listRegisterComission: async function(){
      const sql = `SELECT cmmr.*, collab.name, collab.family_name FROM commission_reference cmmr
      JOIN collaborators collab ON collab.id_headcargo = cmmr.user ORDER BY cmmr.id`;
      const registers = await executeQuery(sql)
      return registers;
    },
    sendEmailRegisters: async function(data){
 
      const resultHistory = await executeQuery(`SELECT * FROM commission_history WHERE reference = ${data.registerCommissionID}`);
      const reference = await executeQuery(`SELECT * FROM commission_reference WHERE id = ${data.registerCommissionID}`);
      let commissionTotalComission = parseFloat((data.commissionTotalComission).replace('R$', '').trim().replace(/\./g, '').replace(',', '.'));
      const resultConcat = resultHistory.map((index) => index.id_process).join(',');
      const getAllProcessToReference = await headcargo.getAllProcessToReference(resultConcat)
      
      const type = reference[0].commissioned_type == 1 ? 0 : 1;
      const templateHTML =  await headcargo.createTableComission(getAllProcessToReference, type, {de:reference[0].filter_from, ate:reference[0].filter_to}, {name:data.commissionedName, id:reference[0].user}, {total_comissinado:commissionTotalComission})

      const responsiblesGenarate = await executeQuery(`SELECT users.*, 
      cllt.name as 'name', cllt.family_name as 'family_name' FROM users 
      JOIN collaborators cllt ON users.collaborator_id = cllt.id
      WHERE users.id = ${reference[0].by_user}`)
 
      const nameGenerated = headcargo.formatarNome(responsiblesGenarate[0].name+' '+responsiblesGenarate[0].family_name)

      const createBody = await headcargo.createBodyHTMLComission(reference[0].reference, templateHTML.title, templateHTML.html, nameGenerated, templateHTML.filterDates, templateHTML)

    
      const sendmail = await headcargo.sendEmailComission(templateHTML.subject, createBody)
      
      
      return sendmail
    },
    sendEmailRegisterCanceled: async function (id){
      const resultHistory = await executeQuery(`SELECT * FROM commission_history WHERE reference = ${id}`);
      const reference = await executeQuery(`SELECT * FROM commission_reference WHERE id = ${id}`);

      let commissionTotalComission = 0
      for (let index = 0; index < resultHistory.length; index++) {
        const element = resultHistory[index];
        commissionTotalComission += element.commission
      }

      
      const nameComissioned = await executeQuery(`SELECT * FROM collaborators WHERE id_headcargo = ${reference[0].user}`)
      const nameComissionedFomrated = headcargo.formatarNome(nameComissioned[0].name+' '+nameComissioned[0].family_name)

      const resultConcat = resultHistory.map((index) => index.id_process).join(',');
      const getAllProcessToReference = await headcargo.getAllProcessToReference(resultConcat)
      
      const type = reference[0].commissioned_type == 1 ? 0 : 1;
      const templateHTML =  await headcargo.createTableComission(getAllProcessToReference, type, {de:reference[0].filter_from, ate:reference[0].filter_to}, {name:nameComissionedFomrated, id:reference[0].user}, {total_comissinado:commissionTotalComission})

      const responsiblesGenarate = await executeQuery(`SELECT users.*, 
      cllt.name as 'name', cllt.family_name as 'family_name' FROM users 
      JOIN collaborators cllt ON users.collaborator_id = cllt.id
      WHERE users.id = ${reference[0].by_user}`)
 
      const nameGenerated = headcargo.formatarNome(responsiblesGenarate[0].name+' '+responsiblesGenarate[0].family_name)

      const createBody = await headcargo.createBodyHTMLComission(reference[0].reference, templateHTML.title, templateHTML.html, nameGenerated, templateHTML.filterDates, templateHTML)

      templateHTML.subject = '[CANCELADO] '+templateHTML.subject
      const sendmail = await headcargo.sendEmailComission(templateHTML.subject, createBody)
      
      
      return sendmail
    },
    confirmPayment: async function(id){
  
      const resultHistory = await executeQuery(`SELECT * FROM commission_history WHERE reference = ${id}`);
      const resultDbContat = resultHistory.map((index) => index.id).join(',');

      const resultReference = await executeQuery(`SELECT * FROM commission_reference WHERE id = ${id}`);
      const resultConcat = resultHistory.map((index) => index.id_process).join(',');
      
      //baixa na tabela do sirius
      await executeQuery(`UPDATE commission_history SET status = 1,payment_date = '${headcargo.getFormattedDate()}' WHERE id IN (${resultDbContat})`);
      await executeQuery(`UPDATE commission_reference SET status = 1, payment_date = '${headcargo.getFormattedDate()}' WHERE id = ${id}`);

      const typeComission = resultReference[0].commissioned_type == 1 ? 'Comissao_Vendedor_Pago' : 'Comissao_Inside_Sales_Pago'
      const teste = await executeQuerySQL(`SELECT ${typeComission} FROM mov_Logistica_House WHERE IdLogistica_house IN (${resultConcat})`)
    
      //baixa na tabela do headcargo
      await executeQuerySQL(`UPDATE mov_Logistica_House SET ${typeComission} = 1 WHERE IdLogistica_house in (${resultConcat})`)

      return teste
    },
    getRegisterById: async function(id){
      const sql = `SELECT
      cmmh.*,
      cllt_inside.name as 'InsideName',
      cllt_inside.family_name as 'InsideFamily',
      cllt_vendedor.name as 'SellerName',
      cllt_vendedor.family_name as 'SellerFamily',
      collab_user.name as 'ByUserName',
      collab_user.family_name as 'ByUserFamily',
      cllt_inside.id_headcargo as 'InsideHeadID',
      cllt_vendedor.id_headcargo as 'SellerHeadID',
      cmmr.commissioned_type
      FROM commission_history cmmh
      JOIN collaborators cllt_inside ON cllt_inside.id_headcargo = cmmh.id_inside
      JOIN collaborators cllt_vendedor ON cllt_vendedor.id_headcargo = cmmh.id_seller
      JOIN users cad_user ON cad_user.id = cmmh.by_user
      JOIN collaborators collab_user ON collab_user.id = cad_user.collaborator_id
      JOIN commission_reference cmmr ON cmmr.id = cmmh.reference
      WHERE cmmh.reference = ${id}`;

      const registers = await executeQuery(sql)

      // Mapear os resultados e formatar a data
      const newRegisters = registers.map(item => ({
        'modal': item.modal,
        'processo': item.reference_process,
        'payment': item.payment_date ? '<span style="display:none">'+item.payment_date+'</span>'+new Date(item.payment_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Pendente',
        'seller': headcargo.formatarNome(item.SellerName+' '+item.SellerFamily),
        'inside': headcargo.formatarNome(item.InsideName+' '+item.InsideFamily),
        'valueComission': Number(item.commission).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
        'ValueProfit': Number(item.effective).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
        'create_date': new Date(item.create_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        'byUser': headcargo.formatarNome(item.ByUserName+' '+item.ByUserFamily),
        'status_id': item.status,
        'status': item.status == 0 ? 'Em aberto' : 'Pago',
        'commissioned_type':item.commissioned_type
      }));



      let total_profit_process = 0
      let total_comission = 0
      for (let index = 0; index < registers.length; index++) {
        const element = registers[index];
          total_profit_process += Number(element.effective)
          total_comission += Number(element.commission)
      }


    

      return {
        data:newRegisters,
        registerID:id,
        total_comission:Number(total_comission).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
        total_profit_process:Number(total_profit_process).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
        comissionUserID: registers[0].commissioned_type == 1 ? registers[0].SellerHeadID : registers[0].InsideHeadID,
        comissionUserName: registers[0].commissioned_type == 1 ? headcargo.formatarNome(registers[0].SellerName+' '+registers[0].SellerFamily) : headcargo.formatarNome(registers[0].InsideName+' '+registers[0].InsideFamily)
      };
    },
    cancelRegister: async function(id){
        
      const resultHistory = await executeQuery(`SELECT * FROM commission_history WHERE reference = ${id}`);
      const resultDbContat = resultHistory.map((index) => index.id).join(',');
      
      //baixa na tabela do sirius
      await executeQuery(`UPDATE commission_history SET status = 3,payment_date = '${headcargo.getFormattedDate()}' WHERE id IN (${resultDbContat})`);
      await executeQuery(`UPDATE commission_reference SET status = 3, payment_date = '${headcargo.getFormattedDate()}' WHERE id = ${id}`);  

      await headcargo.sendEmailRegisterCanceled(id);
      
      return true
    },
    createRegisterComission: async function(processList, type, dateFilter, user){
         

        // Convertendo o array original em uma string de números sequenciais separados por vírgulas
        const resultConcat = processList.map((index) => index).join(',');     
       
        const infoProcess = await headcargo.getAllProcessToReference(resultConcat);

        const register = await headcargo.registerDBComission(infoProcess, user, dateFilter)
        
        const templateHTML =  await headcargo.createTableComission(infoProcess, type, dateFilter, user, register)

        const responsiblesGenarate = await executeQuery(`SELECT users.*, 
        cllt.name as 'name', cllt.family_name as 'family_name' FROM users 
        JOIN collaborators cllt ON users.collaborator_id = cllt.id
        WHERE users.id = ${user.userLog}`);
   
        const nameGenerated = headcargo.formatarNome(responsiblesGenarate[0].name+' '+responsiblesGenarate[0].family_name)
        const createBody = await headcargo.createBodyHTMLComission(register.reference, templateHTML.title, templateHTML.html, nameGenerated, templateHTML.filterDates, templateHTML)


        const sendmail = await headcargo.sendEmailComission(templateHTML.subject, createBody)

        return sendmail;

    },
    registerDBComission: async function(process, user, dateFilter){
        const commissioned_type = user.type == 0 ? 1 : 2
        const userLogId = user.userLog;
        const currentYear = new Date().getFullYear() % 100;

        const getLastQuantity = await executeQuery(`SELECT reference FROM commission_reference ORDER BY id DESC LIMIT 1`)
        let lastQuantity = 1
        if(getLastQuantity.length > 0){
       
            const lastReference = getLastQuantity[0].reference;
     
            const lastYear = parseInt(lastReference.substring(lastReference.length - 2));
        
            if (lastYear === currentYear) {
              lastQuantity = parseInt(lastReference.substring(3, 7)) + 1;
            } 
        }

        const reference = `CMS${lastQuantity.toString().padStart(4, '0')}-${currentYear}`;

        const result = await executeQuery(`INSERT INTO commission_reference (reference, date, commissioned_type, by_user, user, filter_from, filter_to) VALUES ('${reference}', '${headcargo.getFormattedDate()}', ${commissioned_type}, ${userLogId}, ${user.id}, '${dateFilter.de}', '${dateFilter.ate}')`)
        const idReferenci = result.insertId;

        let valueComissionTotal = await Promise.all(process.map(async function(item) {
          return item.Valor_Efetivo;
        }));
      
        let totalEfetivo = valueComissionTotal.reduce((total, valor) => total + valor, 0);
        const percentagemResult = await headcargo.getPercentagemComissionByHeadID(user.id, commissioned_type, totalEfetivo);

        let percentagem = 0;
        if (percentagemResult.status) {
            percentagem = percentagemResult.percentage;
        }

        let total_comissao = totalEfetivo * (percentagem / 100)

        const resultadosFormatados = await Promise.all(process.map(async function(item) {
  
          return [
              parseInt(idReferenci),
              parseInt(item.IdLogistica_House),
              item.Numero_Processo,
              item.Modalidade,
              parseInt(item.IdVendedor),
              parseInt(item.IdInside_Sales),
              item.Valor_Efetivo,
              percentagem, // row.percentage,
              item.Valor_Efetivo * (percentagem / 100), // row.commission,
              headcargo.getFormattedDate(),
              null, // row.date_status,
              userLogId, // row.by_user,
              null // row.audited
          ];
      }));


    
        const sql = `INSERT INTO commission_history (
          reference, id_process, reference_process, modal, id_seller, id_inside, 
          effective, percentage, commission,create_date, date_status, by_user, audited
        ) VALUES ?`;
        
        await executeQuery(sql, [resultadosFormatados]);

        await executeQuery(`UPDATE commission_reference SET value_comission = ${total_comissao}, percentagem_comission = ${percentagem} WHERE id = ${idReferenci}`);

        const reference_commission = await executeQuery(`SELECT * FROM commission_reference WHERE id = ${idReferenci}`);



        return {
          total_comissinado: total_comissao,
          reference:reference_commission[0].reference
        }



    },
    createBodyHTMLComission: async function(codigo, title,processos, responsavel, filterDates, alltable){

        const body = `<center style="width: 100%; table-layout: fixed;">
        <div style="background-color: #f8f9fa; width: 100%; max-width: 800px; margin: 0 auto;">
          <table class="m_-284055676835661507container" style="max-width: 800px; width: 800px; word-break: break-word; margin: 0 auto;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0" align="center" bgcolor="#FFFFFF">
            <tbody>
              <tr>
                <td id="m_-284055676835661507moduleContainer" style="background-color: #ffffff;" align="center" valign="top" bgcolor="#ffffff">
                  <table id="m_-284055676835661507headerLogoCTAModulefea5f133-4261-4101-ace3-f19e2be0486d" style="max-width: 800px; width: 100%; background: #f8f9fa;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0" align="center">
                    <tbody>
                      <tr>
                        <td id="m_-284055676835661507header-Logo-cta0a4e22de-622c-4c98-9dc7-25eb34d738f0" class="m_-284055676835661507header" dir="ltr" style="padding: 24px 24px 24px 30px;" valign="top">
                          <table style="max-width: 800px; width: 100%;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0" align="left">
                            <tbody>
                              <tr>
                                <td class="m_-284055676835661507width50 m_-284055676835661507pad-l0" style="font-family: 'Google Sans', 'Noto Sans JP', Arial, sans-serif; padding-left: 20px; font-size: 14px; vertical-align: middle; width: 99.6283%; text-align: right;" align="left" valign="middle" width="300">
                                  <p>
                                    <img class="m_-284055676835661507logo m_-284055676835661507no-arrow CToWUd" style="float: left;" src="https://conlinebr.com.br/assets/img/logosirius_preta.png" alt="Google Cloud" width="154" height="61" /><p> ${responsavel} </p>
                                  </p>
                                  <p>Referencia: ${codigo} </p>
                                  <p>${filterDates}</p>
                                </td>
                               
                                <td class="m_-284055676835661507showMobileHeaderCTA" style="font-family: 'Google Sans', 'Noto Sans JP', Arial, sans-serif; font-size: 14px; vertical-align: middle; width: 55.7621%; text-align: right; display: none;" align="right" valign="middle" width="300">
                                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="right">
                                    <tbody>
                                      <tr>
                                        <td dir="ltr" style="border-radius: 4px;" align="right" bgcolor="#1a73e8">
                                          <a class="m_-284055676835661507whiteText" style="font-family: 'Google Sans','Noto Sans JP',Arial,sans-serif; color: #ffffff; text-decoration: none; font-size: 14px; letter-spacing: 1px; font-weight: bold; border-radius: 4px; border: 1px solid #1a73e8; margin: 0; padding: 14px 16px 14px 16px; display: inline-block;" href="https://go.cloudplatformonline.com/ODA4LUdKVy0zMTQAAAGFu64YaFlB_CTrqKZdd6nw54VKpoijqn9z6z0Iu0R9XB3LClbCbQUq9KfEltcl-sGBc-Vrseo=" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://go.cloudplatformonline.com/ODA4LUdKVy0zMTQAAAGFu64YaFlB_CTrqKZdd6nw54VKpoijqn9z6z0Iu0R9XB3LClbCbQUq9KfEltcl-sGBc-Vrseo%3D&amp;source=gmail&amp;ust=1658425432932000&amp;usg=AOvVaw0E7TcrfN_UKeM4UpxY7Zhq">Baixe agora</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  
               
                  <table id="m_-284055676835661507bodyCopyModule" style="max-width: 800px; width: 100%;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0" align="center">
                    <tbody>
                      <tr>
                        <td class="m_-284055676835661507inner-container" dir="ltr" style="padding: 0px 0px 0px 0px;" valign="top">
                          <p id="m_-284055676835661507bodyCopy" style="font-family: 'Google Sans Text&rsquo;,&rsquo;Noto Sans JP',Arial,sans-serif; font-size: 14px; line-height: 24px; color: #5f6368; margin: 0; padding: 0; text-align: left;">
                            ${title}
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
    
                  <table id="m_-284055676835661507bodyCopyModule" style="max-width: 800px; width: 100%;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0" align="center">
                    <tbody>
                      <tr>
                        <td class="m_-284055676835661507inner-container" dir="ltr" style="padding: 8px 50px 8px 50px;" valign="top">
                          <p id="m_-284055676835661507bodyCopy" style="font-family: 'Google Sans Text&rsquo;,&rsquo;Noto Sans JP',Arial,sans-serif; font-size: 14px; line-height: 24px; color: #5f6368; margin: 0; padding: 0; text-align: left;">
                            ${processos}
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
    
                  
              
                  <br />
                  <table id="m_-284055676835661507footerModule" style="max-width: 800px; width: 100%; background: #f8f9fa;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0" align="center">
                    <tbody>
                      <tr>
                        <td class="m_-284055676835661507inner-container" style="padding: 40px 50px 0 50px;" valign="top">
                          <table style="max-width: 800px; width: 100%;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0" <tbody>
                            <tr>
                              <td>
                                <table style="width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0">
                                  <tbody>
                                    <tr>
                                      <td dir="ltr" style="padding-bottom: 16px;" align="left">
                                        <table style="width: 100%;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
                                          <tbody>
                                            <tr>
                                              <td dir="ltr" style="vertical-align: middle;" align="left" valign="middle">
                                                <img id="m_-284055676835661507footerLogo" class="m_-284055676835661507no-arrow CToWUd" style="width: 109px; display: block; margin: 0px; border: none;" src="https://conlinebr.com.br/logosirius_preta.png" alt="Google Cloud" width="140" height="43" />
                                              </td>
                                              <td dir="ltr" style="vertical-align: middle; display: none!important;" align="right" valign="middle">
                                                <img id="m_-284055676835661507footerIcons" class="m_-284055676835661507no-arrow CToWUd" style="width: 137px; display: none!important; margin: 0; border: none;" src="https://conlinebr.com.br/logosirius_preta.png" width="137" />
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td dir="ltr" style="font-family: 'Google Sans Text&rsquo;,&rsquo;Noto Sans JP',Arial,sans-serif; font-size: 12px; font-weight: 400; line-height: 18px; color: #5f6368; margin: 0; padding: 0; text-align: left; padding-bottom: 18px;">
                                        <div id="m_-284055676835661507footer-copyright-address">&copy; 2024 SiriusOS</div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="m_-284055676835661507inner-container m_-284055676835661507social-container" style="padding: 0 50px 40px 35px;" valign="top">
                  <table style="max-width: 800px; width: 100%;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0">
                    <tbody>
                      <tr>
                        <td>
                          <table style="width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0">
                            <tbody>
                              <tr>
                                <td align="left">
                                  <div id="m_-284055676835661507footerlinks">
                                    <table style="width: auto;" role="presentation" border="0" cellspacing="0" cellpadding="0">
                                      <tbody>
                                        <tr>
                                          <td style="width: 48px; font-family: 'Roboto',Arial,sans-serif;" width="48">
                                            <img class="CToWUd" style="height: 48px;" src="https://ci3.googleusercontent.com/proxy/Ocfa0OsbBWMHgEVhCXF-bJGFcmjvAkiFsEYOTxWqnt3zTERwMJ2y6Z1Gi09_bVpTaDZgOa1QIuOv-qIR4pbCfbeBMJxgCIvYEVwg7-g5xARbyNVS2PVVR2U=s0-d-e1-ft#https://lp.cloudplatformonline.com/rs/808-GJW-314/images/blog-a11y.png" alt="Blog" height="48" border="0" />
                                          </td>
                                          <td style="width: 48px; padding-left: 10px; font-family: 'Roboto',Arial,sans-serif;" width="48">
                                            <img class="CToWUd" style="height: 48px;" src="https://ci5.googleusercontent.com/proxy/zYjPz8Z0RjuUpt9yF9HxxmDZo9_ACAJisQtVqZ7PpbcBOg8s0-qL678khRAjBHXR7JKFkUqhKxVagOdOIyU5RNH1Nq6dcI1LOZBDgZw8CjcFLvPKtIR3ryPe5g=s0-d-e1-ft#https://lp.cloudplatformonline.com/rs/808-GJW-314/images/github-a11y.png" alt="GitHub" height="48" border="0" />
                                          </td>
                                          <td style="width: 48px; padding-left: 10px; font-family: 'Roboto',Arial,sans-serif;" width="48">
                                            <img class="CToWUd" style="height: 48px;" src="https://ci5.googleusercontent.com/proxy/P4-kMwIH20UTWoMxQXfuxS8bDbU4p1VpRUfQRv2lniW3lDiHdFR9bT8kp4XSx0jwuXRDahWAWYkSFDICDtRkizBCm_40dhv5jwaKogi2Rsq5yYrqR_Jn3377Thka=s0-d-e1-ft#https://lp.cloudplatformonline.com/rs/808-GJW-314/images/linkedin-a11y.png" alt="LinkedIn" height="48" border="0" />
                                          </td>
                                          <td style="width: 48px; padding-left: 10px; font-family: 'Roboto',Arial,sans-serif;" width="48">
                                            <img class="CToWUd" style="height: 48px;" src="https://ci3.googleusercontent.com/proxy/RQaprs5bsnsypbF1Fk8FuGt0sK_SVYFedXHINuCu6LE8dC4lMjED0K_gEZReT8X1dHGaajLqlH7SbEdyN_kdJGF-qCO55wFB8xnX-pjwXhB93LFjMPMcZKyKcf8=s0-d-e1-ft#https://lp.cloudplatformonline.com/rs/808-GJW-314/images/twitter-a11y.png" alt="Twitter" height="48" border="0" />
                                          </td>
                                          <td style="width: 48px; padding-left: 10px; font-family: 'Roboto',Arial,sans-serif;" width="48">
                                            <img class="CToWUd" style="height: 48px;" src="https://ci6.googleusercontent.com/proxy/fDUrH2Y9sy86_A6NCrvXTHsY7et3rBY5y9YARJ1pYcLpO4BZufjHoHYor-OrgtRVhP9fbjrplysF_xCiNGd-Zb6SugBhXYkyquMPNGNMPnkCCkzU2PkikQbH_sGn=s0-d-e1-ft#https://lp.cloudplatformonline.com/rs/808-GJW-314/images/facebook-a11y.png" alt="Facebook" height="48" border="0" />
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          </td>
          </tr>
          </tbody>
          </table>
        </div>
      </center>`

      return body;
    },
    createTableComission: async function(processList, type, dateFilter, user, registerComission){
    
      const commissioned_type = type == 0 ? 1 : 2
        // assunto do email
        const assunto = `[Sirius][ConLine] - Pagamento Comissões | ${user.name} | ${type == 0 ? 'Vendedor' : 'Inside'}`;

        // formata a data apresentada no email
        const new_data_de = headcargo.formatDate(dateFilter.de)
        const new_data_ate = headcargo.formatDate(dateFilter.ate)

        let Row_process = `
            <tr>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">REFERENCIA</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">CLIENTE</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">VENDEDOR</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">INSIDE</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">ESTIMADO</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">EFETIVO</td>
            </tr>`;

        let total_efetivo = 0
        let total_estimado = 0
        // let total_comissao = 0
        for (let index = 0; index < processList.length; index++) {
            const e = processList[index];
            total_efetivo += e.Valor_Efetivo;
            total_estimado += e.Valor_Estimado;
            
            let comissaoAplicada = false;
            let comissao_processo = 0;
            let comissao_porcentagem = 0;
           

      
        
            Row_process += `
            <tr>
                <td style="border-color:black;border-style:solid;border-width:1px;white-space: nowrap;">${e.Numero_Processo}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;white-space: nowrap;">${e.Cliente == '' || e.Cliente == null ? 'Sem Seleção' : headcargo.formatarNome(e.Cliente.slice(0, 20))}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;white-space: nowrap;padding: 8px;">${e.Vendedor == '' || e.Vendedor == null ? 'Sem Seleção' : headcargo.formatarNome(e.Vendedor)}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;white-space: nowrap;padding: 8px;">${e.Inside_Sales == '' || e.Inside_Sales == null ? 'Sem Seleção' : headcargo.formatarNome(e.Inside_Sales)}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;text-align: right;white-space: nowrap;">${Number(e.Valor_Estimado).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;text-align: right;white-space: nowrap;">${Number(e.Valor_Efetivo).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</td>
            </tr>`;
            
        }

        const filterDates = `<strong> ${new_data_de}</strong> Até <strong> ${new_data_ate}</strong>`

        const header = `<div style="display: flex;height: 96px; max-width: 809px; justify-content: space-around; margin: 0px;">
        <div style="margin: 5px;background-color: #f8f9fa; padding: 5px; border-radius: 0 0 0 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); width: 271px;">
        
            <div style="display: flex; align-items: center; justify-content: center;">
            
                <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #ff4d4d; margin-right: 10px;margin-top: 7px;background-image: url(https://cdn.conlinebr.com.br/colaboradores/${user.id});background-position: center center;background-size: cover;">
                
                </div>
       
    
                <h2 style="margin-bottom: 0px;">${user.name}</h2>
            </div>
            
                <p style="font-size: 12px; color: #666;">Comissionado [${type == 0 ? 'Vendedor' : 'Inside'}]</p>
        </div>
       
        
        <div style="margin: 5px;background-color: #f8f9fa; padding: 5px; border-radius: 0 0 0 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); width: 200px;">
            <h2 style="margin-bottom: 10px;">${total_efetivo.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</h2>
            <p style="font-size: 12px; color: #666;">Lucro de Processos</p>
        </div>
        
        <div style="margin: 5px;background-color: #f8f9fa; padding: 5px; border-radius: 0 0 0 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); width: 200px;">
            <h2 style="margin-bottom: 10px;">${(registerComission.total_comissinado).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</h2>
            <p style="font-size: 12px; color: #666;">Comissão</p>
        </div>
        
        
        <div style="margin: 5px;background-color: #f8f9fa; padding: 5px; border-radius: 0 0 10px 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); width: 200px;">
            <h2 style="margin-bottom: 10px;">${processList.length}</h2>
            <p style="font-size: 12px; color: #666;">Processos</p>
        </div>
    
    </div>`

        let title = `
        ${header}
        <div style="font-size: 10px;padding: 0 10px 0 10px;"> 
            Atenção o filtro de data é com base na data de compensação, Exportação: <strong>Data Embarque</strong> ou <strong>Previsao de Embarque</strong> 
            e 
            Importação: <strong>Data Desembarque</strong> ou <strong>Previsao de Desembarque</strong>
            <br> 
            O cálculo de comissão é calculado com base no <strong>lucro efetivo</strong>.
        </div>`




        return {
            total_comissao:registerComission.total_comissinado,
            filterDates:filterDates,
            title:title,
            subject:assunto,
            html:Row_process,
            total_efetivo:total_efetivo,
            total_estimado:total_estimado
        }


    },
    sendEmailComission: async function(subject, CustomHTML, recipient){
        const transporter = nodemailer.createTransport({
                name: 'no-reply@conline-news.com',
                host:'mail.conline-news.com',
                service:'mail.conline-news.com',
                port: 465,
                secure: true,
                pool:false,
                rateDelta:1000,
                rateLimit: 1000,
                auth:{
                user: 'sirius@conline-news.com',
                pass: 'mce191919aA' },
                debug : true
            });


        const mailOptions = {
            from: `Sirius OS <sirius@conline-news.com>`,
            to: `comissao-adm@conlinebr.com.br`,
            // to: `petryck.leite@conlinebr.com.br`,
            subject: subject,
            html: CustomHTML
        };

        // Envia o e-mail para o destinatário atual
        try {
          const info = await transporter.sendMail(mailOptions);
          console.log('Email enviado com sucesso:', info.response);
          return { success: true, timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            return { success: false, error: error.message };
        }


    },
    getAllProcessToReference: async function(listProcess){

        const sql = `WITH CTE_Logistica AS (
            SELECT
                Lhs.IdLogistica_House,
                
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
                
                COALESCE(Lhs.Comissao_VENDedor_Pago, 0) AS Comissao_Vendedor_Pago,
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
                
                Lhs.Situacao_Recebimento AS RecebimentoCodigo,
                Lhs.Data_Recebimento_Local AS Data_Recebimento,
                
                CASE Lhs.Situacao_Pagamento
                    WHEN 0 THEN 'Sem pagamento'
                    WHEN 1 THEN 'Em aberto'
                    WHEN 2 THEN 'Parcialmente pago'
                    WHEN 3 THEN 'Pago'
                END AS Pagamento,
                
                Lhs.Situacao_Pagamento AS PagamentoCodigo,
                Lhs.Data_Pagamento_Local AS Data_Pagamento,
                
                CASE Lhs.Situacao_Acerto_Agente
                    WHEN 0 THEN 'Sem acerto agente'
                    WHEN 1 THEN 'Em aberto'
                    WHEN 2 THEN 'Parcialmente pago'
                    WHEN 3 THEN 'Pago'
                END AS Agente,
                
                Lhs.Situacao_Acerto_Agente AS AgenteCodigo,
                Lhs.Data_Acerto_Agente AS Data_Agente,
                Lmo.Lucro_Estimado AS Valor_Estimado,
                Lmo.Lucro_Efetivo AS Valor_Efetivo,
                
                CASE 
                    WHEN Lmo.Total_Recebimento = Lmo.Total_Recebido THEN 1
                    ELSE 0
                END AS Recebimento_Quitado,
                
                COALESCE(Qsc.Qtd_SContainer, 0) AS Cntr_Nao_Devolvidos,
                COALESCE(Qft.Qtd_Fatura, 0) AS Faturas_Nao_Finalizadas,
                COALESCE(Qsb.Qtd_SBaixa, 0) AS Faturas_Nao_Baixadas
            
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
                    Lft.Situacao = 1
                GROUP BY
                    Lft.IdLogistica_House
            ) Qsb ON Qsb.IdLogistica_House = Lhs.IdLogistica_House
        
            WHERE
            Lhs.Situacao_Agenciamento NOT IN (7)
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND Lhs.Agenciamento_Carga = 1
                AND YEAR(Lhs.Data_Abertura_Processo) >= 2022
                AND Lmo.IdMoeda = 110
        )
        SELECT *
        FROM CTE_Logistica
        WHERE
        IdLogistica_House IN (${listProcess})`

        const result = await executeQuerySQL(sql)

        return result
    },
    getPercentagemComissionByHeadID: async function(id, type, value) {
      // Consulta principal
      let sql = `SELECT * FROM collaborators collab
                JOIN commission_percentage cmp ON collab.id = cmp.id_collaborators
                WHERE collab.id_headcargo = ${id}
                AND cmp.type = ${type}
                AND ${value} BETWEEN cmp.value_min AND cmp.value_max`;

      let result = await executeQuery(sql);

      if (result.length > 0) {
          return {
              status: true,
              percentage: result[0].percentage
          };
      }

      // Consulta para valor menor que o mínimo
      sql = `SELECT * FROM collaborators collab
            JOIN commission_percentage cmp ON collab.id = cmp.id_collaborators
            WHERE collab.id_headcargo = ${id}
            AND cmp.type = ${type}
            ORDER BY cmp.value_min ASC
            LIMIT 1`;

      result = await executeQuery(sql);

      if (result.length > 0 && value < result[0].value_min) {
          return {
              status: true,
              percentage: result[0].percentage
          };
      }

      // Consulta para valor maior que o máximo
      sql = `SELECT * FROM collaborators collab
            JOIN commission_percentage cmp ON collab.id = cmp.id_collaborators
            WHERE collab.id_headcargo = ${id}
            AND cmp.type = ${type}
            ORDER BY cmp.value_max DESC
            LIMIT 1`;

      result = await executeQuery(sql);

      if (result.length > 0 && value > result[0].value_max) {
          return {
              status: true,
              percentage: result[0].percentage
          };
      }

        // Se nenhuma condição foi atendida
        return {
            status: false
        };
    },
    listSettings: async function(id, type) {
        const collaborator = await executeQuery(`SELECT * FROM collaborators WHERE id_headcargo = ${id}`);
    
        let resultadosFormatados;
        if (collaborator.length) {
            const result = await executeQuery(`SELECT 
                cmmp.*, cllt.name, cllt.family_name 
                FROM commission_percentage cmmp
                JOIN collaborators cllt ON cllt.id = cmmp.per
                WHERE type = ${type} AND id_collaborators = ${collaborator[0].id}`);
    
            resultadosFormatados = await Promise.all(result.map(async function(item) {
                return {
                    ...item, // mantém todas as propriedades existentes
                    actions:`<button onclick="removeSettings(${item.id})" class="btn btn-danger-light btn-icon ms-1 btn-sm settings-delete-btn" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Delete"><i class="ri-delete-bin-5-line"></i></button>`,
                    perFullName: headcargo.formatarNome(item.name + ' ' + item.family_name),
                    percentage: item.percentage + '%',
                    value_max: Number(item.value_max).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    value_min: Number(item.value_min).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    date: headcargo.FormattedDateTime(item.date) // sobrescreve apenas a propriedade 'date'
                };
            }));
        } else {
            resultadosFormatados = [];
        }
    
        return resultadosFormatados;
    },
    removeSetting: async function(id){
      // DELETE FROM `siriusDBO`.`commission_percentage` WHERE (`id` = '41');
      const result = await executeQuery(`DELETE FROM commission_percentage WHERE id = ${id}`);
      return result

    },
    verifyRegisters: async function(data){

      const comissioned = data.vendedorID != '000' ? data.vendedorID : data.InsideID

      const verify = await executeQuery(`SELECT * FROM commission_reference WHERE user = ${comissioned} AND status != 1 AND status != 3`)

      
      return verify.length > 0 ? false : true
    },
    verifyPercentageComission: async function(id){
      const getCollab = await executeQuery(`SELECT * FROM collaborators WHERE id_headcargo = ${id}`);

      const verify = await executeQuery(`SELECT * FROM commission_percentage WHERE id_collaborators = ${getCollab[0].id}`);

      if (verify.length > 0) {
        return true
      }else{
        return false
      }
    },
    registerPercentage: async function(value) {
      const getCollab = await executeQuery(`SELECT * FROM collaborators WHERE id_headcargo = ${value.commissionedID}`);
  
      const data = [
          getCollab[0].id,
          value.percentage,
          value.min_value,
          value.max_value,
          value.commissionType,
          value.userID
      ];
  
      const sql = `INSERT INTO commission_percentage (id_collaborators, percentage, value_min, value_max, type, per) VALUES (?)`;
      const result_commission = await executeQuery(sql, [data]);
  
      return result_commission;
    },
    filterLog: async function(body){
      const sql = `Declare
      @IdUsuario IdCurto,
      @Primary_Keys Xml,
      @Data_Inicio Data,
      @Data_Termino Data,
      @Tabela VarChar(Max),
      @Tipo TipoFixo,
      @SQL nVarChar(Max)
    
    Set @Data_Inicio = CONVERT(date,'${body.dataDe}')
    Set @Data_Termino = CONVERT(date,'${body.dataAte}')
    Set @IdUsuario = 0
    Set @Tabela = '${body.tabela}'
    Set @Primary_Keys = '<PrimaryKeys><Item Nome="${body.coluna}" Value="${body.valor}"/></PrimaryKeys>'
    Set @Tipo = 0
    
    Declare
      @Filtro_Tabela VarChar(Max),
      @Filtro_Campo VarChar(Max),
      @Filtro_Tipo VarChar(Max)
    
    Set @Filtro_Tabela = ''
    If Nullif(LTrim(@Tabela), '') Is Not Null
      Set @Filtro_Tabela = '[@Nome="'+@Tabela+'"]'
    
    Declare Campos Cursor For
    Select
      Pks.value('@Nome', 'VarChar(Max)') as Nome,
      Pks.value('@Value', 'VarChar(Max)') as Value
    From
      @Primary_Keys.nodes('/PrimaryKeys/Item') as PrimaryKeys(Pks)
    
    Open Campos
    
    Declare
      @Campo_Nome VarChar(Max),
      @Campo_Value VarChar(Max)
    
    Fetch Next From Campos Into
      @Campo_Nome,
      @Campo_Value
    
    Set @Filtro_Campo = ''
    While @@FETCH_STATUS = 0
    Begin
      Set @Filtro_Campo = @Filtro_Campo + '[Campo[@Nome="'+@Campo_Nome+'"][@Value="'+@Campo_Value+'"]]'
    
      Fetch Next From Campos Into
        @Campo_Nome,
        @Campo_Value
    end
    
    Close Campos
    Deallocate Campos
    
    Set @Filtro_Tipo = ''
    If @Tipo <> 0
      Set @Filtro_Tipo = '[@Tipo="'+Cast(@Tipo as VarChar(Max))+'"]'
    
    Set @SQL = 'Select
      Usr.Nome as Usuario,
      Ltb.Data_Inicio as Data_Inicio_Transacao,
      Ltb.Data_Termino as Data_Termino_Transacao,
      DateDiff(second, Ltb.Data_Inicio, Ltb.Data_Termino) as Tempo_Transacao,
      Dlg.value(''../@WindowsUser'', ''VarChar(Max)'') as Usuario_Windows,
      Dlg.value(''../@ComputerName'', ''VarChar(Max)'') as Computador,
      Dlg.value(''@Nome'', ''VarChar(Max)'') as Tabela,
      Dlg.value(''@Tipo'', ''smallint'') as Tipo,
      Convert(DateTime, Dlg.value(''@Data'', ''VarChar(max)''), 101) as Data,
      Dlg.value(''@Indice'', ''int'') as Indice,
      Dlg.query(''<Campos>{Campo}</Campos>'') as Campos
    From
      sys_Log_Tabela Ltb
    Cross Apply
      Ltb.Dados_Log.nodes(''/Log/Tabela'+@Filtro_Tabela+@Filtro_Tipo+@Filtro_Campo+''') as DadosLog(Dlg)
    Join
      sys_Usuario Usr on Usr.IdUsuario = Ltb.IdUsuario
    Where
      ((@IdUsuario = 0) or (Ltb.IdUsuario = @IdUsuario))
    And
      (((@Data_Inicio Is Null) And (@Data_Termino Is Null))
        Or ((Ltb.Data_Inicio Between @Data_Inicio And @Data_Termino)
        Or (Ltb.Data_Termino Between @Data_Inicio And @Data_Termino)))
    Order By
      Ltb.Data_Inicio,
      Dlg.value(''@Indice'', ''int'')'
    
    exec sp_executesql @SQL, N'@Data_Inicio Data, @Data_Termino Data, @IdUsuario IdCurto', @Data_Inicio=@Data_Inicio, @Data_Termino=@Data_Termino, @IdUsuario=@IdUsuario`;


      const result = await executeQuerySQL(sql)

    return result
    },
    formatarNome: function(nome) {
        const preposicoes = new Set(["de", "do", "da", "dos", "das"]);
        const palavras = nome?.split(" ");
        
        if(!palavras){
           
            if(!nome){
                return 'Sem Registro'
            }else{
                return nome.toLowerCase();
            }
            
        }
        
        const palavrasFormatadas = palavras.map((palavra, index) => {
            // Se a palavra for uma preposição e não é a primeira palavra
            if (preposicoes.has(palavra.toLowerCase()) && index !== 0) {
                return palavra.toLowerCase();
            } else {
                return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
            }
        });
        
        return palavrasFormatadas.join(" ");
    },
    // Função para formatar uma data no formato pt-BR (dd/mm/aaaa)
    formatDate: function (dateString) {
    const date = new Date(dateString + 'T00:00:00'); // Cria um objeto Date a partir da string de data
    const day = String(date.getDate()).padStart(2, '0'); // Garante que o dia tenha dois dígitos
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Garante que o mês tenha dois dígitos
    const year = date.getFullYear(); // Obtém o ano
    return `${day}/${month}/${year}`; // Retorna a data formatada
    },
    // Função para formatar uma data no formato pt-BR (dd/mm/aaaa h:m:s) 
    FormattedDateTime: function(time){
    const date = new Date(time);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
    const day = String(date.getDate()).padStart(2, '0');
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    },
    getFormattedDate: function(){
      const date = new Date();
    
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
      const day = String(date.getDate()).padStart(2, '0');
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    // FIM API CONTROLE DE COMISSÃO
    // INICIO API Gestão de Inatividade Comercial
    listAllClienteInactive: async function(filters) {

        let daysOfCotation = filters ? filters.lastQuote : 30;
        let daysOfProcess = filters ? filters.lastProcess : 30;
        let responsible = '';

        if(filters && filters.salesID != 'all'){
          responsible = `AND (Ven.IdPessoa = ${filters.salesID} OR Ins.IdPessoa = ${filters.salesID})`;
        }

   
       


        const sqlCotation = `SELECT DISTINCT
                                Ins.IdPessoa AS IDINSIDE,
                                Ins.Nome AS INSIDE,
                                Ven.IdPessoa AS IDVENDEDOR,
                                Ven.Nome AS VENDEDOR,
                                Psa.IdPessoa AS IDCLIENTE,
                                Psa.Nome AS CLIENTE,
                                Psa.Cpf_Cnpj AS CNPJ,
                                FORMAT(PROPOSTA.ULTIMA_DATA_PROPOSTA, 'yyyy-MM-dd') AS ULTIMA_DATA_PROPOSTA,
                                DATEDIFF(DAY, PROPOSTA.ULTIMA_DATA_PROPOSTA, GETDATE()) AS INTERVALO
                            FROM
                                cad_Pessoa Psa 
                            LEFT OUTER JOIN (
                                SELECT 
                                  Pfr.IdCliente,
                                  MAX(Pfr.Data_Proposta) AS ULTIMA_DATA_PROPOSTA
                                FROM
                                  mov_Proposta_Frete Pfr 
                                GROUP BY
                                  Pfr.IdCliente
                            ) AS PROPOSTA ON PROPOSTA.IdCliente = Psa.IdPessoa
                            LEFT OUTER JOIN 
                                mov_Proposta_Frete Pfr ON Pfr.IdCliente = PROPOSTA.IdCliente AND Pfr.Data_Proposta = PROPOSTA.ULTIMA_DATA_PROPOSTA    
                            LEFT OUTER JOIN
                                cad_Cliente Cli ON Cli.IdPessoa = PROPOSTA.IdCliente
                            LEFT OUTER JOIN
                                cad_Pessoa Ven ON Ven.IdPessoa = Cli.IdVendedor_Responsavel
                            LEFT OUTER JOIN
                                cad_Pessoa Ins ON Ins.IdPessoa = Cli.IdFuncionario_Responsavel
                            WHERE
                                PROPOSTA.ULTIMA_DATA_PROPOSTA < DATEADD(DAY, -${daysOfCotation}, GETDATE())
                                AND Pfr.Numero_Proposta NOT LIKE '%test%'
                                AND Psa.Nome NOT LIKE '%test%'
                                ${responsible}`

        const sqlProcess = `SELECT DISTINCT
                                Psa.IdPessoa AS IDCLIENTE,
                                Psa.Nome AS CLIENTE,
                                Psa.Cpf_Cnpj AS CNPJ,
                                FORMAT(PROCESSO.ULTIMA_DATA_PROCESSO, 'yyyy-MM-dd') AS ULTIMA_DATA_PROCESSO,
                                DATEDIFF(DAY, PROCESSO.ULTIMA_DATA_PROCESSO, GETDATE()) AS INTERVALO
                              FROM
                                cad_Pessoa Psa 
                              LEFT OUTER JOIN (
                                SELECT 
                                    Lhs.IdCliente,
                                    MAX(Lhs.Data_Abertura_Processo) AS ULTIMA_DATA_PROCESSO
                                FROM
                                    mov_Logistica_House Lhs 
                                GROUP BY
                                    Lhs.IdCliente
                              ) AS PROCESSO ON PROCESSO.IdCliente = Psa.IdPessoa
                              LEFT OUTER JOIN 
                                mov_Logistica_House Lhs ON Lhs.IdCliente = PROCESSO.IdCliente AND Lhs.Data_Abertura_Processo = PROCESSO.ULTIMA_DATA_PROCESSO
                              WHERE
                                PROCESSO.ULTIMA_DATA_PROCESSO < DATEADD(DAY, -${daysOfProcess}, GETDATE())
                                AND Lhs.Numero_Processo NOT LIKE '%test%'
                                AND Psa.Nome NOT LIKE '%test%'`

          const resultCotation = await executeQuerySQL(sqlCotation);
          const resultProcess = await executeQuerySQL(sqlProcess);


          const allClientsInactive = [];

          for (let index = 0; index < resultCotation.length; index++) {
            const element = resultCotation[index];
            const existingClientIndex = allClientsInactive.findIndex(item => item.IDCLIENTE === element.IDCLIENTE);
          
            if (existingClientIndex !== -1) {
              // Cliente já existe, atualize os campos necessários
              const process = resultProcess.find(item => item.IDCLIENTE === element.IDCLIENTE);
              allClientsInactive[existingClientIndex].cotationDate = element.ULTIMA_DATA_PROPOSTA;
              allClientsInactive[existingClientIndex].processDate = process ? process.ULTIMA_DATA_PROCESSO : null;
              allClientsInactive[existingClientIndex].responsible = element.VENDEDOR;
              allClientsInactive[existingClientIndex].responsibleID = element.IDVENDEDOR;
              allClientsInactive[existingClientIndex].inside = element.INSIDE;
              allClientsInactive[existingClientIndex].insideID = element.IDINSIDE;
              allClientsInactive[existingClientIndex].clientCNPJ = element.CNPJ;
              allClientsInactive[existingClientIndex].clientName = element.CLIENTE;
              allClientsInactive[existingClientIndex].intervalCotation = element.INTERVALO;
              allClientsInactive[existingClientIndex].intervalProcess = process ? process.INTERVALO : 0;
            } else {
              // Cliente não existe, adicione um novo item
              const process = resultProcess.find(item => item.IDCLIENTE === element.IDCLIENTE);
              allClientsInactive.push({
                IDCLIENTE: element.IDCLIENTE,
                cotationDate: element.ULTIMA_DATA_PROPOSTA,
                processDate: process ? process.ULTIMA_DATA_PROCESSO : null,
                inside: element.INSIDE,
                insideID: element.IDINSIDE,
                responsible: element.VENDEDOR,
                responsibleID: element.IDVENDEDOR,
                clientCNPJ: element.CNPJ,
                clientName: element.CLIENTE,
                intervalCotation: element.INTERVALO,
                intervalProcess: process ? process.INTERVALO : 0
              });
            }
          }
          



          const ClienteInactive = await Promise.all(allClientsInactive.map(async function(item) {
              const clientName = `<div>
                                    <p class="mb-0 fw-semibold">${item.clientName ? headcargo.formatarNome(item.clientName) : 'Sem vinculação'}</p>
                                    <p class="mb-0 fs-11 text-muted">${!item.clientCNPJ ? 'Não Preenchido' : item.clientCNPJ}</p>
                                  </div>`
              const responsible = `<div class="d-flex align-items-center gap-2">
                                    <div class="lh-1">
                                      <span class="avatar avatar-rounded avatar-sm">
                                        <img src="${item.responsibleID ? `https://cdn.conlinebr.com.br/colaboradores/${item.responsibleID}` : `https://conlinebr.com.br/assets/img/icon-semfundo.png`}" alt="">
                                      </span>
                                    </div>
                                    <div>
                                      <span class="d-block fw-semibold">${item.responsible ? item.responsible : 'Sem vinculação'}</span>
                                    </div>
                                  </div>`

              const inside = `<div class="d-flex align-items-center gap-2">
              <div class="lh-1">
                <span class="avatar avatar-rounded avatar-sm">
                  <img src="${item.insideID ? `https://cdn.conlinebr.com.br/colaboradores/${item.insideID}` : `https://conlinebr.com.br/assets/img/icon-semfundo.png`}" alt="">
                </span>
              </div>
              <div>
                <span class="d-block fw-semibold">${item.inside ? item.inside : 'Sem vinculação'}</span>
              </div>
            </div>`

              return {
                  ...item, // mantém todas as propriedades existentes
                  clientName: clientName,
                  responsible: responsible,
                  inside: inside,
                  lastQuote: `<span style="display:none">${item.intervalCotation} - ${item.cotationDate}</span><span class="d-block"><i class="ri-calendar-2-line me-2 align-middle fs-14 text-muted"></i>${headcargo.formatDate(item.cotationDate)} (${item.intervalCotation} dias)</span>`,
                  lastProcess: `<span style="display:none">${item.intervalProcess} - ${item.processDate}</span><span class="d-block"><i class="ri-calendar-2-line me-2 align-middle fs-14 text-muted"></i>${item.processDate != null ? headcargo.formatDate(item.processDate) : 'Sem Processo'} (${item.intervalProcess} dias)</span>`,
              };
          }));
     
  
      return ClienteInactive;
  },
}


module.exports = {
    headcargo,
};
