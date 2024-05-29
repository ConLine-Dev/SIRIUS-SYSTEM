const nodemailer = require('nodemailer');
const { executeQuerySQL } = require('../connect/sqlServer');


const headcargo = {
    gerenateCommission: async function(value){

        const modalidade = (value.modalidade).join(',');
        const comissaoVendedor = `AND Comissao_Vendedor_Pago IN (${(value.comissaoVendedor).join(',')})`;

        const ComissaoInside = `AND Comissao_Inside_Sales_Pago IN (${(value.ComissaoInside).join(',')})`;
    
        const vendedorID = value.vendedorID != '000' ? `AND IdVendedor = ${value.vendedorID}` : '';
        const InsideID = value.InsideID != '000' ? `AND IdInside_Sales = ${value.InsideID}` : '';

        const recebimento = `AND RecebimentoCodigo IN (${(value.recebimento).join(',')})`;
        const pagamento = `AND PagamentoCodigo IN (${(value.recebimento).join(',')})`;
        
        const Abertura_Processo = `AND (CAST(Abertura_Processo AS DATE) >= '${value.dataDe}' AND CAST(Abertura_Processo AS DATE) <= '${value.dataAte}')`;

        
        
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
        ModalidadeCodigo IN (${modalidade})
        ${comissaoVendedor}
        ${ComissaoInside}
        ${vendedorID}
        ${InsideID}
        ${pagamento}
        ${recebimento}
        ${Abertura_Processo}
        `
        const commissions = await executeQuerySQL(sql)


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
            'comissao_vendedor': item.Comissao_Vendedor_Pago == 0 ? 'Pendente' : 'Pago',
            'comissao_inside': item.Comissao_Insade_Sales_Pago == 0 ? 'Pendente' : 'Pago',
            'estimado': (item.Valor_Estimado || 0).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
            'efetivo': (item.Valor_Efetivo || 0).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
            'restante': (item.Valor_Efetivo || 0 - item.Valor_Estimado || 0).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
        }));

        let valor_Estimado_total = 0
        let valor_Comissao_total = 0
        for (let index = 0; index < commissions.length; index++) {
            const element = commissions[index];
            valor_Estimado_total += element.Valor_Estimado
            valor_Comissao_total += 0
        }


        const format = {
            "data": resultadosFormatados,
            valor_Estimado_total:(valor_Estimado_total).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
            valor_Comissao_total:(valor_Comissao_total).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}),
            quantidade_processo:commissions.length
        }

        return format;
  
    },
    createRegisterComission: async function(processList, type, dateFilter){
        // Convertendo o array original em uma string de números sequenciais separados por vírgulas
        const resultConcat = processList.map((_, index) => index + 1).join(',');     
       
        const infoProcess = await headcargo.getAllProcessToReference(resultConcat);

        const templateHTML =  await headcargo.createHTMLComission(infoProcess, type, dateFilter)
        // console.log(templateHTML)

        headcargo.sendEmailComission(templateHTML.subject, templateHTML.html)


    },
    createHTMLComission: async function(processList, type, dateFilter){

        // assunto do email
        const assunto = `[ConLine]- Pagamento Comissões`;

        // formata a data apresentada no email
        const new_data_de = headcargo.formatDate(dateFilter.de)
        const new_data_ate = headcargo.formatDate(dateFilter.ate)



        let Row_process = `
            Olá, segue processos para pagamento de comissão <strong>${type == 0 ? 'Vendedor' : 'Inside'}</strong>.
            <br> 
            De: <strong> ${new_data_de}</strong> Até: <strong> ${new_data_ate}</strong>
            <br> O calculo de comissão é calculado com base no <strong>lucro estimado</strong> pois o efetivo é dinamico
            <tr>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">REFERENCIA</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">CLIENTE</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">VENDEDOR</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">INSIDE</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">ESTIMADO</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">EFETIVO</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">%</td>
                <td style="border-color:black;border-style:solid;border-width:1px;font-weight: 900;text-align: center">COMISSÃO</td>
            </tr>`;

        let total_efetivo = 0
        let total_estimado = 0

        for (let index = 0; index < processList.length; index++) {
            const e = processList[index];
            total_efetivo += e.Valor_Efetivo
            total_estimado += e.Valor_Estimado

            Row_process += `
            <tr>
                <td style="border-color:black;border-style:solid;border-width:1px;white-space: nowrap;">${e.Numero_Processo}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;white-space: nowrap;">${e.Cliente == '' || e.Cliente == null ? 'Sem Seleção' : headcargo.formatarNome(e.Cliente.slice(0, 20))}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;white-space: nowrap;padding: 8px;">${e.Vendedor == '' || e.Vendedor == null ? 'Sem Seleção' : headcargo.formatarNome(e.Vendedor)}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;white-space: nowrap;padding: 8px;">${e.Inside_Sales == '' || e.Inside_Sales == null ? 'Sem Seleção' : headcargo.formatarNome(e.Inside_Sales)}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;text-align: right;white-space: nowrap;">${e.Valor_Estimado.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;text-align: right;white-space: nowrap;">${e.Valor_Efetivo.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</td>
                <td style="border-color:black;border-style:solid;border-width:1px;text-align: center;white-space: nowrap;padding: 8px;">%</td>
                <td style="border-color:black;border-style:solid;border-width:1px;text-align: right;white-space: nowrap;padding: 8px;"><strong>${e.Valor_Estimado.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</strong></td>
            </tr>`;
            
        }
        console.log(processList)

        return {
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
            // to: `comissao-adm@conlinebr.com.br`,
            to: `petryck.leite@conlinebr.com.br`,
            subject: subject,
            html: CustomHTML
        };

        // Envia o e-mail para o destinatário atual
        transporter.sendMail(mailOptions, async (error, info) => {
            if (!error) {
                console.log('email enviado com sucesso')
            }else{
                console.log(error)
            }
        })


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
    }
}


module.exports = {
    headcargo,
};
