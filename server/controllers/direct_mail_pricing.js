const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const { helpers } = require('./helpers');
const { Users } = require('./users');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { json } = require('express');


const direct_mail_pricing = {
    getGroups: async function(){
 
        let result = await executeQuery(`SELECT * FROM direct_mail_pricing_group ORDER BY name`);
    
        return result;
    },
    editingNameGroup: async function(body){
        // console.log(body)
        const id = body.id
        const name = body.name;

        let result = await executeQuery(`UPDATE direct_mail_pricing_group SET name = '${name}' WHERE id = ${id}`);
        return result;
    },
    getContactsByGroup: async function(id){
 
        let result = await executeQuery('SELECT * FROM direct_mail_pricing_group_list WHERE `group` = '+id+'');

        return result;
    },
    getAllModel: async function(){
 
        let result = await executeQuery('SELECT * FROM direct_mail_pricing_models');
    
        return result;
    },
    getModelById: async function(id){
 
        let result = await executeQuery(`SELECT * FROM direct_mail_pricing_models WHERE id = ${id}`);
    
        return result;
    },
    getAllProposalByRef: async function(id){
       
        let result = await executeQuerySQL(`SELECT
                                            Pfr.IdProposta_Frete,
                                            Pfr.Numero_Proposta,
                                            Itr.Nome AS Incoterm,
                                            Ofr.Local_Coleta,
                                            Ofr.Local_Entrega,
                                            Des.Nome AS Destino,
                                            Ori.Nome AS Origem,
                                            Mer.Nome AS Mercadoria,
                                            Mda.Sigla AS Moeda_Mercadoria,
                                            Pfc.Valor_Mercadoria,
                                            Pfc.NCM_Descricao,
                                            Pfc.Peso_Taxado,
                                            Pfc.Descricao AS Descricao_Carga,
                                            CASE Ofr.Modalidade_Pagamento_Master
                                            WHEN 0 THEN 'Não Informado'
                                            WHEN 1 THEN 'Collect/Prepaid'
                                            WHEN 2 THEN 'Collect'
                                            WHEN 3 THEN 'Prepaid'
                                            WHEN 4 THEN 'Prepaid abroad'
                                            END AS Modalidade_Pagamento_Master,
                                            COALESCE(Clg.Carga_Empilhavel, 'Nao') AS Carga_Empilhavel
                                        FROM
                                            mov_Oferta_Frete Ofr
                                        LEFT OUTER JOIN
                                            mov_Proposta_Frete Pfr ON Pfr.IdProposta_Frete = Ofr.IdProposta_Frete
                                        LEFT OUTER JOIN
                                            mov_Proposta_Frete_Carga Pfc ON Pfc.IdProposta_Frete = Pfr.IdProposta_Frete
                                        LEFT OUTER JOIN
                                            cad_Mercadoria Mer ON Mer.IdMercadoria = Pfc.IdMercadoria
                                        LEFT OUTER JOIN
                                            cad_Moeda Mda ON Mda.IdMoeda = Pfc.IdMoeda_Mercadoria
                                        LEFT OUTER JOIN
                                            cad_Incoterm Itr ON Itr.IdIncoterm = Ofr.IdIncoterm
                                        LEFT OUTER JOIN
                                            cad_Origem_Destino Des ON Des.IdOrigem_Destino = Ofr.IdDestino
                                        LEFT OUTER JOIN
                                            cad_Origem_Destino Ori ON Ori.IdOrigem_Destino = Ofr.IdOrigem
                                        LEFT OUTER JOIN (
                                            SELECT
                                            Ofr.IdOferta_Frete,
                                            CASE 
                                                WHEN COUNT(Cgl.IdConfiguracao_Campo_Livre) > 0 THEN 'Sim' ELSE 'Nao' 
                                            END AS Carga_Empilhavel
                                            FROM
                                            mov_Atividade Atv
                                            Left Outer Join
                                            mov_Proposta_Frete Pfr on Pfr.IdProjeto_Atividade = Atv.IdProjeto_Atividade
                                            LEFT OUTER JOIN
                                            mov_Oferta_Frete Ofr ON Ofr.IdProposta_Frete = Pfr.IdProposta_Frete
                                            JOIN
                                            mov_Oferta_Frete_Campo_Livre Fcl ON Fcl.IdOferta_Frete = Ofr.IdOferta_Frete
                                            JOIN
                                            mov_Campo_Livre Clv ON Clv.IdCampo_Livre = Fcl.IdCampo_Livre
                                            LEFT OUTER JOIN
                                            cad_Configuracao_Campo_Livre Cgl ON Cgl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
                                            WHERE
                                            Pfr.Numero_Proposta LIKE '%${id}%'
                                            AND Clv.valor_boleano = 1
                                            AND Cgl.IdConfiguracao_Campo_Livre = 240
                                            AND Ofr.Tipo_Operacao = 1
                                            GROUP BY
                                            Ofr.IdOferta_Frete
                                        ) Clg ON Clg.IdOferta_Frete = Ofr.IdOferta_Frete
                                        WHERE Pfr.Numero_Proposta LIKE '%${id}%'`);


        return result;
    },
    getAllFilesProposalByRef: async function(id){
       
        let result_files = await executeQuerySQL(`SELECT
                                                    Arq.IdArquivo,
                                                    Prf.Numero_Proposta,
                                                    Prf.IdProposta_Frete,
                                                    Arq.Nome AS Nome_Arquivo,
                                                    Ada.GUID,
                                                    Ada.Content_Type
                                                FROM
                                                    mov_Proposta_Frete Prf
                                                LEFT OUTER JOIN
                                                    mov_Projeto_Atividade_Arquivo Paa ON Paa.IdProjeto_Atividade = Prf.IdProjeto_Atividade
                                                LEFT OUTER JOIN
                                                    arq_Arquivo Arq ON Arq.IdArquivo = Paa.IdArquivo
                                                LEFT OUTER JOIN
                                                    arq_Dados_Arquivo Ada ON Ada.IdDados_Arquivo = Arq.IdDados_Arquivo
                                                WHERE
                                                Prf.Numero_Proposta LIKE '%${id}%'`);

                                                 
        return result_files;
    },
    getAllFilesProposalById: async function(files){

        if (files.length === 0) {
            return null;
        }

        try {
            // Filtrar apenas os valores que não são números
            const valoresNaoNumericos = files.map(item => item.value)
            // Criar uma string com os valores separados por vírgula
            const listaSeparadaPorVirgula = valoresNaoNumericos.join(',');
    
            let result_files = await executeQuerySQL(`SELECT
                                                        Arq.IdArquivo,
                                                        Prf.Numero_Proposta,
                                                        Prf.IdProposta_Frete,
                                                        Arq.Nome AS Nome_Arquivo,
                                                        Ada.GUID,
                                                        Ada.Content_Type
                                                    FROM
                                                        mov_Proposta_Frete Prf
                                                    LEFT OUTER JOIN
                                                        mov_Projeto_Atividade_Arquivo Paa ON Paa.IdProjeto_Atividade = Prf.IdProjeto_Atividade
                                                    LEFT OUTER JOIN
                                                        arq_Arquivo Arq ON Arq.IdArquivo = Paa.IdArquivo
                                                    LEFT OUTER JOIN
                                                        arq_Dados_Arquivo Ada ON Ada.IdDados_Arquivo = Arq.IdDados_Arquivo
                                                    WHERE
                                                    Arq.IdArquivo in (${listaSeparadaPorVirgula})`);

            // Função para baixar e retornar os dados de um arquivo
            const baixarDadosDoArquivo = async (url) => {

                let guid = url.GUID
                guid = guid.toLowerCase()
               
                const response = await axios({
                    method: 'get',
                    url: `https://api.headsoft.com.br/geral/blob-stream/private/${guid}?&url=false`, //`https://api.headsoft.com.br/geral/blob-stream/private/${guid}?filename=${url.Nome_Arquivo}&url=true`,
                    responseType: 'arraybuffer',  // Configura responseType para 'arraybuffer'
                    headers: {
                        'Authorization': `Bearer eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjI2YzExYTIzLTMyMTAtNDRmYS1iY2VkLTExNzFmNGU3YWFlNiIsImNvbnRhaW5lciI6ImNvbmxpbmUiLCJpc3MiOiJIZWFkU29mdCIsImF1ZCI6IkZpbGVTdHJlYW0ifQ.rp-og-UgHsZ1mr3J8tQamF0h89T83I3gIW-lRFRWcSk`
                      }
                });
            
            
                // Retornar os dados do arquivo em um objeto
                return {
                    filename: url.Nome_Arquivo,
                    content: response.data
                };
                
            };


            // Baixar dados de todos os arquivos
            // const promessasDeDownload = result_files.map(url => baixarDadosDoArquivo(url));
            // Baixar dados de todos os arquivos
            const dadosDosArquivos = await Promise.all(result_files.map(url => baixarDadosDoArquivo(url)));
            return dadosDosArquivos;
            // // Aguardar o download de todos os arquivosdsa
            // Promise.all(promessasDeDownload)
            // .then(dadosDosArquivos => {

            //     return dadosDosArquivos
            
            //     // const promessasDeDownload2 = dadosDosArquivos.map(url => baixarDadosDoArquivo(url));
         
            // })
            // .catch(error => {
            //  console.log(error)
            //  return null
            // });

        } catch (error) {
            // console.log(`https://api.headsoft.com.br/geral/blob-stream/private/${guid}?filename=${url.Nome_Arquivo}&url=false`)
        // console.error('Erro ao baixar o arquivo da URL:', error);
        throw error;
        }


  
    },
    getProposal: async function(id){

        let result = await executeQuerySQL(`SELECT
        Pfr.IdProposta_Frete,
        Pfr.Numero_Proposta,
        Itr.Nome AS Incoterm,
        Ofr.Local_Coleta,
        Ofr.Local_Entrega,
        Des.Nome AS Destino,
        Ori.Nome AS Origem,
        Mer.Nome AS Mercadoria,
        Mda.Sigla AS Moeda_Mercadoria,
        Pfc.Valor_Mercadoria,
        Pfc.NCM_Descricao,
        Pfc.Peso_Taxado,
        Pfc.Descricao AS Descricao_Carga,
        CASE Ofr.Modalidade_Pagamento_Master
        WHEN 0 THEN 'Não Informado'
        WHEN 1 THEN 'Collect/Prepaid'
        WHEN 2 THEN 'Collect'
        WHEN 3 THEN 'Prepaid'
        WHEN 4 THEN 'Prepaid abroad'
        END AS Modalidade_Pagamento_Master,
        COALESCE(Clg.Carga_Empilhavel, 'Nao') AS Carga_Empilhavel
    FROM
        mov_Oferta_Frete Ofr
    LEFT OUTER JOIN
        mov_Proposta_Frete Pfr ON Pfr.IdProposta_Frete = Ofr.IdProposta_Frete
    LEFT OUTER JOIN
        mov_Proposta_Frete_Carga Pfc ON Pfc.IdProposta_Frete = Pfr.IdProposta_Frete
    LEFT OUTER JOIN
        cad_Mercadoria Mer ON Mer.IdMercadoria = Pfc.IdMercadoria
    LEFT OUTER JOIN
        cad_Moeda Mda ON Mda.IdMoeda = Pfc.IdMoeda_Mercadoria
    LEFT OUTER JOIN
        cad_Incoterm Itr ON Itr.IdIncoterm = Ofr.IdIncoterm
    LEFT OUTER JOIN
        cad_Origem_Destino Des ON Des.IdOrigem_Destino = Ofr.IdDestino
    LEFT OUTER JOIN
        cad_Origem_Destino Ori ON Ori.IdOrigem_Destino = Ofr.IdOrigem
    LEFT OUTER JOIN (
        SELECT
        Ofr.IdOferta_Frete,
        CASE 
            WHEN COUNT(Cgl.IdConfiguracao_Campo_Livre) > 0 THEN 'Sim' ELSE 'Nao' 
        END AS Carga_Empilhavel
        FROM
        mov_Atividade Atv
        Left Outer Join
        mov_Proposta_Frete Pfr on Pfr.IdProjeto_Atividade = Atv.IdProjeto_Atividade
        LEFT OUTER JOIN
        mov_Oferta_Frete Ofr ON Ofr.IdProposta_Frete = Pfr.IdProposta_Frete
        JOIN
        mov_Oferta_Frete_Campo_Livre Fcl ON Fcl.IdOferta_Frete = Ofr.IdOferta_Frete
        JOIN
        mov_Campo_Livre Clv ON Clv.IdCampo_Livre = Fcl.IdCampo_Livre
        LEFT OUTER JOIN
        cad_Configuracao_Campo_Livre Cgl ON Cgl.IdConfiguracao_Campo_Livre = Clv.IdConfiguracao_Campo_Livre
        WHERE
        Pfr.Numero_Proposta = '${id}'
        AND Clv.valor_boleano = 1
        AND Cgl.IdConfiguracao_Campo_Livre = 240
        AND Ofr.Tipo_Operacao = 1
        GROUP BY
        Ofr.IdOferta_Frete
    ) Clg ON Clg.IdOferta_Frete = Ofr.IdOferta_Frete
    WHERE Pfr.Numero_Proposta = '${id}'`);


        return result;
    },
    getFileByProposal: async function(id){

        let result = await executeQuerySQL(`SELECT
                                            Pfr.IdProjeto_Atividade,
                                            Pfr.Numero_Proposta,
                                            Itr.Nome AS Incoterm,
                                            Ofr.Local_Coleta,
                                            Des.Nome AS Destino,
                                            Ori.Nome AS Origem,
                                            Mer.Nome AS Mercadoria,
                                            Mda.Sigla AS Moeda_Mercadoria,
                                            Pfc.Valor_Mercadoria,
                                            Pfc.NCM_Descricao
                                            FROM
                                            mov_Oferta_Frete Ofr
                                            LEFT OUTER JOIN
                                            mov_Proposta_Frete Pfr ON Pfr.IdProposta_Frete = Ofr.IdProposta_Frete
                                            LEFT OUTER JOIN
                                            mov_Proposta_Frete_Carga Pfc ON Pfc.IdProposta_Frete = Pfr.IdProposta_Frete
                                            LEFT OUTER JOIN
                                            cad_Mercadoria Mer ON Mer.IdMercadoria = Pfc.IdMercadoria
                                            LEFT OUTER JOIN
                                            cad_Moeda Mda ON Mda.IdMoeda = Pfc.IdMoeda_Mercadoria
                                            LEFT OUTER JOIN
                                            cad_Incoterm Itr ON Itr.IdIncoterm = Ofr.IdIncoterm
                                            LEFT OUTER JOIN
                                            cad_Origem_Destino Des ON Des.IdOrigem_Destino = Ofr.IdDestino
                                            LEFT OUTER JOIN
                                            cad_Origem_Destino Ori ON Ori.IdOrigem_Destino = Ofr.IdOrigem
                                            WHERE Pfr.Numero_Proposta = '${id}'`);
        return result;
    },
    getProposalDetails: async function(id){

        let result = await executeQuerySQL(`SELECT
                                            Ofr.IdOferta_Frete,
                                            Ofr.IdProposta_Frete,
                                            Pfc.Descricao,
                                            Pfe.Quantidade,
                                            Tmb.Nome AS Embalagem,
                                            Tmb.Nome_Internacional AS Embalagem_Internacional,
                                            Pfe.Peso_Considerado,
                                            Pfe.Peso_Bruto,
                                            Pfe.Metros_Cubicos,
                                            Pfe.Comprimento,
                                            Pfe.Largura,
                                            Pfe.Altura,
                                            Pfr.Numero_Proposta
                                        FROM
                                            mov_Proposta_Frete Pfr
                                        JOIN
                                            mov_Oferta_Frete Ofr ON Ofr.IdProposta_Frete = Pfr.IdProposta_Frete
                                        LEFT OUTER JOIN
                                            mov_Proposta_Frete_Carga Pfc ON Pfc.IdProposta_Frete_Carga = Ofr.IdProposta_Frete_Carga
                                        LEFT OUTER JOIN
                                            mov_Proposta_Frete_Embalagem Pfe ON Pfe.IdProposta_Frete_Carga = Pfc.IdProposta_Frete_Carga 
                                        LEFT OUTER JOIN
                                            cad_Tipo_Embalagem Tmb ON Tmb.IdTipo_Embalagem = Pfe.IdTipo_Embalagem
                                            WHERE Pfr.Numero_Proposta = '${id}'`);
        return result;
    },
    getFilesEmailsHistory: async function(id){
     const result = await executeQuery(`SELECT * FROM direct_mail_pricing_files WHERE id_history = ${id}`)

     return result
    },
    // Função para agrupar emails por domínio
    groupEmailsByDomain: function(EmailTO) {
        const domainGroups = {};
        
        EmailTO.forEach(recipient => {
            const emails = recipient.email.split(',').map(email => email.trim());
            
            emails.forEach(email => {
                // Extrair domínio do email
                const emailParts = email.split('@');
                if (emailParts.length === 2) {
                    const domain = emailParts[1].toLowerCase();
                    
                    // Extrair apenas a parte principal do domínio (ex: MSC.com -> MSC)
                    const domainParts = domain.split('.');
                    let mainDomain = domainParts[0];
                    
                    // Se for um domínio brasileiro (.com.br) ou governamental (.gov), manter mais partes
                    if (domain.includes('.com.br') || domain.includes('.org.br') || domain.includes('.gov.br') || domain.includes('.edu.br')) {
                        mainDomain = domainParts.slice(0, -2).join('.');
                    } else if (domain.includes('.gov')) {
                        mainDomain = domainParts.slice(0, -1).join('.');
                    }
                    
                    if (!domainGroups[mainDomain]) {
                        domainGroups[mainDomain] = [];
                    }
                    
                    domainGroups[mainDomain].push(email);
                }
            });
        });
        
        return domainGroups;
    },
    // Função para buscar dados da proposta
    getProposalActivityData: async function(proposalRef) {
        const query = `
            SELECT
                Pfr.IdProposta_Frete,
                Ofr.IdOferta_Frete,
                Pfr.Numero_Proposta,
                Atv.Complemento,
                Atv.IdTarefa,
                Atv.IdProjeto_Atividade
            FROM
                mov_Atividade Atv
            LEFT OUTER JOIN
                mov_Proposta_Frete Pfr ON Pfr.IdProjeto_Atividade = Atv.IdProjeto_Atividade
            LEFT OUTER JOIN
                mov_Oferta_Frete Ofr ON Ofr.IdProposta_Frete = Pfr.IdProposta_Frete
            WHERE
                Pfr.Numero_Proposta = '${proposalRef}'
        `;
        
        const result = await executeQuerySQL(query);
        return result;
    },
    // Função para buscar o último ID da atividade
    getLastActivityId: async function() {
        const query = `
            SELECT TOP 1 IdAtividade
            FROM mov_Atividade Atv 
            ORDER BY IdAtividade DESC
        `;
        
        const result = await executeQuerySQL(query);
        return result.length > 0 ? result[0].IdAtividade : 0;
    },
    // Função para inserir nova atividade com retry robusto até conseguir
    insertActivity: async function(idAtividade, idProjetoAtividade, domain) {
        let attempts = 0;
        const maxAttempts = 50; // Máximo de tentativas aumentado
        let currentId = idAtividade;
        
        while (attempts < maxAttempts) {
            try {
                const query = `
                    INSERT INTO mov_Atividade
                    (IdAtividade, IdProjeto_Atividade, IdTarefa, Situacao, Prioridade, Mensagem_Automatica, Acompanhamento_Automatico, Complemento) 
                    VALUES (${currentId}, ${idProjetoAtividade}, 1790, 2, 0, '', '', '${domain.toUpperCase()}')
                `;
                
                const result = await executeQuerySQL(query);
                console.log(`✅ Atividade inserida com sucesso - ID: ${currentId}, Domínio: ${domain.toUpperCase()}`);
                return { success: true, idAtividade: currentId, result };
                
            } catch (error) {
                attempts++;
                
                // Se o erro for de violação de chave primária (ID já existe)
                if (error.message.includes('PRIMARY KEY') || error.message.includes('duplicate') || error.message.includes('UNIQUE') || error.number === 2627) {
                    // Incrementar ID sequencialmente até encontrar um disponível
                    currentId = currentId + 1;
                    console.log(`🔄 Tentativa ${attempts} - ID ${currentId - 1} já existe. Tentando com ID: ${currentId}`);
                    
                    // Se chegou a 10 tentativas consecutivas, buscar o último ID novamente para "pular" uma faixa
                    if (attempts % 10 === 0) {
                        console.log(`🔍 Após ${attempts} tentativas, consultando último ID novamente...`);
                        const lastId = await this.getLastActivityId();
                        currentId = lastId + 1;
                        console.log(`📊 Novo ID base: ${currentId}`);
                    }
                } else {
                    // Se for outro tipo de erro, não tentar novamente
                    console.error(`❌ Erro não relacionado a chave primária:`, error.message);
                    throw error;
                }
                
                if (attempts >= maxAttempts) {
                    throw new Error(`💥 Falha ao inserir atividade para domínio ${domain.toUpperCase()} após ${maxAttempts} tentativas. Último ID tentado: ${currentId}. Último erro: ${error.message}`);
                }
            }
        }
    },
    sendMail: async function(html, EmailTO, subject, bccAddress,ccOAddress, userID, io, proposalRef, files, revisaoPricing, changeStatusActivity, adicionarAtividadeCotando) {
        const allFiles = await this.getAllFilesProposalById(files)
        
        // Configurações para o serviço SMTP (exemplo usando Gmail)
        const user = await Users.getUserById(userID)

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user[0].system_email,
                pass: user[0].email_password
            }
        });

        const date_now = await helpers.getDateNow();
        const result = await executeQuery('INSERT INTO direct_mail_pricing_history (subject, body, send_date, userID) VALUES (?, ?, ?, ?)', [subject, html, date_now, userID])
        const historyID = result.insertId
        
        if(allFiles != null){

            allFiles.map(async function(dados){
                const arrayBuffer = new ArrayBuffer(dados.content); // Substitua pelo seu ArrayBuffer
                const buffer = Buffer.from(arrayBuffer);
                await executeQuery('INSERT INTO direct_mail_pricing_files (name, body, id_history) VALUES (?, ?, ?)', [dados.filename, buffer, historyID])
    
                //   // Convertendo para ArrayBuffer
                // const arrayBuffer = new Uint8Array(buffer).buffer;
            })
        }
        
        

        
        let successfulEmailsCount = 0;
        // Loop através da lista de destinatários
        for (const recipient of EmailTO) {
            // Configurações do e-mail para cada destinatário

              // Dividir o campo 'email' em múltiplos endereços de e-mail
                const emails = recipient.email.split(',').map(email => email.trim());

            const getGreeting = () => {
                const currentHour = new Date().getHours();
                if (currentHour >= 5 && currentHour < 12) {
                    return 'Bom dia';
                } else if (currentHour >= 12 && currentHour < 18) {
                    return 'Boa tarde';
                } else {
                    return 'Boa noite';
                }
            };

            const parametros = {
                nome:recipient.name,
                email:emails,
                saudacao: getGreeting()
            }
            
            
            const ccOAddressNew = ccOAddress.join(', ')
            const bccAddressNew = bccAddress.join(', ')

      
            const CustomHTML = await direct_mail_pricing.substituirValoresNaString(html, parametros);
            const mailOptions = {
                from: user[0].system_email,
                to: emails.join(', '),
                subject: subject,
                html: CustomHTML,    
                cc: bccAddressNew,
                bcc:ccOAddressNew,
                attachments: allFiles != null ? allFiles.map(dados => ({ filename: dados.filename, content: dados.content })) : false
            };
    
            // Envia o e-mail para o destinatário atual
            transporter.sendMail(mailOptions, async (error, info) => {
                if (error) {
                    const { response } = error;
             
                   await executeQuery('INSERT INTO direct_mail_pricing_details (`body`,`accepted`, `rejected`, `response`, `from`, `to`,`cc`, `messageId`, `historyId`, `status`, `userID`) VALUES (?,?, ?, ?, ?, ?,?, ?, ?, ?, ?)', [null,null, null, response, user[0].system_email, recipient.email, bccAddressNew, null, historyID, 0, userID])
           
                    console.error(`Erro ao enviar e-mail para ${emails}:`, error);
                    successfulEmailsCount++;
                     // Verifica se todos os e-mails foram enviados antes de emitir o evento
                     if (successfulEmailsCount === EmailTO.length) {

                        io.emit('table', 'ListAllEmails');
                    }
                } else {
                    const { messageId, envelope, accepted, rejected, pending, response } = info;
                    const acceptedString = accepted.join(', ');
                    const rejectedString = rejected.join(', ');
               const lastInsert = await executeQuery('INSERT INTO direct_mail_pricing_details (`body`,`accepted`, `rejected`, `response`, `from`, `to`,`cc`, `messageId`, `historyId`, `status`, `userID`) VALUES (?,?, ?, ?, ?, ?,?, ?, ?, ?, ?)', [CustomHTML,acceptedString, rejectedString, response, user[0].system_email, recipient.email,bccAddressNew, messageId, historyID, 1, userID])
                    console.log(`E-mail enviado com sucesso para ${emails}. Detalhes:`, info);
                    successfulEmailsCount++;

                    // Verifica se todos os e-mails foram enviados antes de emitir o evento
                    if (successfulEmailsCount === EmailTO.length) {
            
                        const email = await direct_mail_pricing.ListEmailByID(historyID)
                        
                        io.emit('table', {type: 'newEmail', data: email[0]});

                        // Verificar se a variável proposalRef existe e não é nula ou undefined
                        if (proposalRef !== null && proposalRef !== undefined && proposalRef.trim() !== '') {
                            // Remover espaços em branco da variável
                            const trimmedProposalRef = proposalRef.trim();

                            // Executar a consulta SQL

                            if(revisaoPricing){
                                await executeQuerySQL(`UPDATE mov_Proposta_Frete SET Situacao = 9 /*Revisão Pricing*/ WHERE Numero_Proposta = '${trimmedProposalRef}'`);
                            }


                            if(changeStatusActivity){


                                const proposalData = await direct_mail_pricing.getProposalActivityData(trimmedProposalRef);
                                tipoProposal = null;
                                for(const data of proposalData){
                                    const idTarefa = data.IdTarefa;
                                    if(idTarefa == 1789){
                                        tipoProposal = 'EM';
                                    }else if(idTarefa == 1105){
                                        tipoProposal = 'IM';
                                    }
                                }

                                if(tipoProposal == 'EM'){
                                    await executeQuerySQL(`UPDATE Atv
                                        SET Atv.Situacao = 4
                                        FROM mov_Atividade Atv
                                        LEFT JOIN mov_Proposta_Frete Pfr ON Pfr.IdProjeto_Atividade = Atv.IdProjeto_Atividade
                                        WHERE Atv.IdTarefa = 1789
                                          AND Pfr.Numero_Proposta = '${trimmedProposalRef}'`);
                                }else if(tipoProposal == 'IM'){
                                    await executeQuerySQL(`UPDATE Atv
                                        SET Atv.Situacao = 2
                                        FROM mov_Atividade Atv
                                        LEFT JOIN mov_Proposta_Frete Pfr ON Pfr.IdProjeto_Atividade = Atv.IdProjeto_Atividade
                                        WHERE Atv.IdTarefa = 1105
                                          AND Pfr.Numero_Proposta = '${trimmedProposalRef}'`);
                                }



                                
                            }

                            // Nova funcionalidade: Adicionar atividade cotando com fornecedor agrupada por domínio
                            if(adicionarAtividadeCotando){
                                try {
                                    // 1. Agrupar emails por domínio
                                    const domainGroups = direct_mail_pricing.groupEmailsByDomain(EmailTO);
                                    
                                    // 2. Buscar dados da proposta
                                    const proposalData = await direct_mail_pricing.getProposalActivityData(trimmedProposalRef);
                                    
                                    if (proposalData.length > 0) {
                                        const idProjetoAtividade = proposalData[0].IdProjeto_Atividade;
                                        
                                        // 3. Buscar último ID da atividade
                                        let lastActivityId = await direct_mail_pricing.getLastActivityId();
                                        
                                        // 4. Inserir uma atividade para cada domínio
                                        const domainList = Object.keys(domainGroups);
                                        console.log(`Iniciando criação de ${domainList.length} atividades para os domínios: ${domainList.map(d => d.toUpperCase()).join(', ')}`);
                                        console.log(`📊 Último ID encontrado: ${lastActivityId}`);
                                        
                                        for (let i = 0; i < domainList.length; i++) {
                                            const domain = domainList[i];
                                            // Adicionar um buffer maior para evitar conflitos + usar timestamp para mais unicidade
                                            const buffer = 10; // Buffer de segurança
                                            const nextId = lastActivityId + buffer + i + 1;
                                            
                                            try {
                                                console.log(`🎯 Tentando criar atividade para domínio ${domain.toUpperCase()} com ID inicial: ${nextId}`);
                                                const insertResult = await direct_mail_pricing.insertActivity(nextId, idProjetoAtividade, domain);
                                                
                                                if (insertResult.success) {
                                                    console.log(`✅ Atividade criada para domínio: ${domain.toUpperCase()} - ID: ${insertResult.idAtividade}`);
                                                }
                                            } catch (error) {
                                                console.error(`❌ Erro ao criar atividade para domínio ${domain.toUpperCase()}:`, error.message);
                                                // Continuar com os próximos domínios mesmo se um falhar
                                            }
                                        }
                                        
                                        console.log('🎉 Processo de criação de atividades de cotação finalizado');
                                    } else {
                                        console.log('Não foi possível encontrar dados da proposta para criar as atividades');
                                    }
                                } catch (error) {
                                    console.error('Erro ao criar atividades de cotação:', error);
                                }
                            }


                          
                            
                            // Log de sucesso
                            console.log('Proposta atualizada com sucesso', trimmedProposalRef);
                        }
                        
               
                    }
                }
            });

           
        }
        

        // io.emit('table', 'ListAllEmails');

        return result;
    },
    substituirValoresNaString: async function(str, parametros){
           // Itera sobre as chaves do objeto de parâmetros
    for (const chave in parametros) {
        if (parametros.hasOwnProperty(chave)) {
            // Constrói o padrão a ser substituído, por exemplo, '@nome'
            const padrao = `@${chave}`;

            // Obtém o valor correspondente ao padrão
   
            let valor;
            
            if(chave == 'Mercadoria'){
                if(contemPalavra(parametros[chave])){
                    valor = '<strong style="color: rgb(230, 0, 0);">'+parametros[chave]+'</strong>';
                }else{
                    valor = parametros[chave];
                }
            }else if(chave == 'Valor_Mercadoria'){
                valor = parametros[chave].toLocaleString('pt-BR', { style: 'currency', currency: parametros['Moeda_Mercadoria'] });
                // console.log('valor formatado', valor)
            }else{
                valor = parametros[chave];
            }
            
            

            // Substitui todas as ocorrências do padrão pelo valor na string
            str = str.split(padrao).join(valor);
        }
    }


    return str;
    },
    registerContact: async function(name, email, groupID){
        const result = await executeQuery('INSERT INTO direct_mail_pricing_group_list (name, email, `group`) VALUES ("'+name+'", "'+email+'", '+groupID+')')
        return result;
    },
    registerGroup: async function(value){
        const result = await executeQuery(`INSERT INTO direct_mail_pricing_group (name) VALUES ('${value}')`)
        return result;
    },
    getAllGroups: async function(){
        
        let result = await executeQuery('SELECT * FROM direct_mail_pricing_group ORDER BY id DESC');
        return result;
    },
    getContactByGroup: async function(id){
        
        let result = await executeQuery('SELECT * FROM direct_mail_pricing_group_list WHERE `group` = '+id+' ORDER BY name ASC');
        return result;
    },
    getContactByID: async function(id){
        
        let result = await executeQuery(`SELECT * FROM direct_mail_pricing_group_list WHERE id = ${id}`);
        return result;
    },
    removeContact: async function(id){
        const result = await executeQuery(`DELETE FROM direct_mail_pricing_group_list WHERE id = ${id}`);

        return result;
    },
    editContact: async function(body){
        const result = await executeQuery(`UPDATE direct_mail_pricing_group_list SET name = '${body.name}', email = '${body.email}' WHERE id = ${body.id}`)

        return result;
    },
    removeGroup: async function(id){
        const result = await executeQuery(`DELETE FROM direct_mail_pricing_group WHERE id = ${id}`);
        
        await executeQuery('DELETE FROM direct_mail_pricing_group_list WHERE `group` = '+id+'');

        return result;
    },
    registerModelEmail: async function(value){
        const result = await executeQuery(`INSERT INTO direct_mail_pricing_models (name) VALUES ('${value}')`)
        return result;
    },
    editModelEmail: async function(body){
        const result = await executeQuery(`UPDATE direct_mail_pricing_models SET name = '${body.name}', title = '${body.subject}', body = '${body.body}' WHERE id = ${body.id}`)

        return result;
    },
    removeModelEmail: async function(id){
        const result = await executeQuery(`DELETE FROM direct_mail_pricing_models WHERE id = ${id}`);
  

        return result;
    },
    ListAllEmailsByDept: async function(user){



        const result = await executeQuery(`SELECT 
                                dmp.id,
                                dmp.subject,
                                SUBSTRING(dmp.body, 1, 100) AS body,
                                dmp.send_date,
                                dmp.userID,
                                usr.collaborator_id,
                                clt.id_headcargo,
                                GROUP_CONCAT(dr.department_id) AS department_ids,
                                clt.name
                            FROM
                                siriusDBO.direct_mail_pricing_history AS dmp
                            JOIN
                                users AS usr ON dmp.userID = usr.id
                            JOIN
                                collaborators AS clt ON usr.collaborator_id = clt.id
                            JOIN
                                departments_relations AS dr ON dr.collaborator_id = clt.id        
                            WHERE
                                (dr.department_id IN (${user.department_ids}))
                                OR
                                (dmp.userID = ${user.system_userID})
                            GROUP BY
                                dmp.id,
                                usr.collaborator_id,
                                clt.id_headcargo,
                                clt.name
                            ORDER BY
                                dmp.id DESC`);

                        

        
        return result;

    },
    ListEmailByID: async function(id){

        const result = await executeQuery(`SELECT
        dmp.*,
        usr.collaborator_id, 
        clt.id_headcargo, 
        GROUP_CONCAT(dr.department_id) AS department_ids,
        clt.name 
    FROM 
        siriusDBO.direct_mail_pricing_history AS dmp
    JOIN 
        users AS usr ON dmp.userID = usr.id
    JOIN 
        collaborators AS clt ON usr.collaborator_id = clt.id 
    JOIN 
        departments_relations AS dr ON dr.collaborator_id = clt.id 
    WHERE 
    dmp.id = ${id}
    GROUP BY 
        usr.collaborator_id, clt.id_headcargo, dmp.id, clt.name
    ORDER BY 
        dmp.id DESC`);

        
        return result;

    },
    ListAllEmails: async function(){
        const result = await executeQuery(`SELECT 
        direct_mail_pricing_history.id,
        direct_mail_pricing_history.subject,
        SUBSTRING(direct_mail_pricing_history.body, 1, 100) AS body,
        direct_mail_pricing_history.send_date,
        direct_mail_pricing_history.userID,
        usr.collaborator_id, 
        clt.id_headcargo, 
        clt.name 
      FROM siriusDBO.direct_mail_pricing_history
      JOIN users AS usr ON direct_mail_pricing_history.userID = usr.id
      JOIN collaborators AS clt ON usr.collaborator_id = clt.id
      ORDER BY direct_mail_pricing_history.id DESC;
      `);
        return result;
    },
    getEmailById: async function(id){
        const result = await executeQuery(`SELECT direct_mail_pricing_details.*, htr.subject, htr.send_date, usr.collaborator_id, clt.id_headcargo, clt.name FROM siriusDBO.direct_mail_pricing_details
        JOIN direct_mail_pricing_history as htr ON htr.id = direct_mail_pricing_details.historyId 
        JOIN users as usr ON htr.userID = usr.id
        JOIN collaborators as clt ON usr.collaborator_id = clt.id WHERE historyId = ${id}`);

        return result;
    }
    
}


    module.exports = {
        direct_mail_pricing,
    };