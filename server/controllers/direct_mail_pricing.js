const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const nodemailer = require('nodemailer');


const direct_mail_pricing = {
    getGroups: async function(){
 
        let result = await executeQuery(`SELECT * FROM direct_mail_pricing_group ORDER BY name`);
    
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
    getProposal: async function(id){

        let result = await executeQuerySQL(`SELECT
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
    sendMail: async function(html, EmailTO, subject, bccAddress) {
        // Configurações para o serviço SMTP (exemplo usando Gmail)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'petryck.leite@conlinebr.com.br',
                pass: '99659819aA!@#$'
            }
        });
    
        // Loop através da lista de destinatários
        for (const recipient of EmailTO) {
            // Configurações do e-mail para cada destinatário

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
                email:recipient.email,
                saudacao: getGreeting()
            }
            
            const mailOptions = {
                from: 'petryck.leite@conlinebr.com.br',
                to: `${recipient.name} <${recipient.email}>`,
                subject: subject,
                html: await direct_mail_pricing.substituirValoresNaString(html, parametros),
                cc: bccAddress
            };
    
            // Envia o e-mail para o destinatário atual
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Erro ao enviar e-mail para ${recipient.email}:`, error);
                } else {
                    console.log(`E-mail enviado com sucesso para ${recipient.email}. Detalhes:`, info);
                }
            });
        }
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
                console.log('valor formatado', valor)
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
    }
    
}



    module.exports = {
        direct_mail_pricing,
    };