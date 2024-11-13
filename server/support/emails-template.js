const { executeQuery } = require('../connect/mysql');


const emailCustom = {
    complete: async function(occurrence){
        let responsibles = occurrence.responsibles;
        let responsiblesHTML = ``;
        for (let index = 0; index < responsibles.length; index++) {
            const element = responsibles[index];
            responsiblesHTML += `<span style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 5px 10px; border-radius: 3px; margin-right: 5px; margin-bottom: 5px;">${element.name}</span>` 
        }

        let descriptionStatus = '';
        if(occurrence.status == 0) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi aberta com sucesso!
            <br>
            - A partir deste momento, nossa equipe de Qualidade analisará e aprovará a ocorrência.
            <br>
            - Após a aprovação, você receberá um e-mail com informações detalhadas sobre os próximos passos.
            </h4>`;
        } else if(occurrence.status == 1) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi reprovada na 1ª etapa.
            <br>
            - Verificamos que ajustes são necessários para prosseguir.
            <br>
            - Por favor, revise as informações e faça as correções solicitadas. Após o ajuste, reenvie para aprovação.
            </h4>`;
        } else if(occurrence.status == 2) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi aprovada na 1ª etapa!
            <br>
            - Agora você pode prosseguir com o preenchimento das informações necessárias para a 2ª etapa.
            <br>
            - Certifique-se de preencher todos os campos solicitados para que possamos seguir com a análise.
            </h4>`;
        } else if(occurrence.status == 3) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência está aguardando aprovação na 2ª etapa.
            <br>
            - Nossa equipe de Qualidade está analisando as informações enviadas para confirmar a conformidade.
            <br>
            - Você receberá uma notificação por e-mail assim que a análise for concluída.
            </h4>`;
        } else if(occurrence.status == 4) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi reprovada na 2ª etapa.
            <br>
            - Foi identificado que ajustes adicionais são necessários para seguir com o processo.
            <br>
            - Por favor, revise e ajuste as informações conforme solicitado, e reenvie para nova análise.
            </h4>`;
        } else if(occurrence.status == 5) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência está em desenvolvimento para ação corretiva.
            <br>
            - Nossa equipe está trabalhando em uma solução para resolver a situação reportada.
            <br>
            - Você será notificado quando a ação corretiva for concluída e pronta para avaliação.
            </h4>`;
        } else if(occurrence.status == 6) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência está em avaliação de eficácia.
            <br>
            - A ação corretiva foi concluída e estamos agora analisando a sua eficácia.
            <br>
            - A equipe de Qualidade vai verificar se a solução atende aos critérios e resolve o problema definitivamente.
            </h4>`;
        } else if(occurrence.status == 7) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi finalizada com sucesso!
            <br>
            - A análise e ações corretivas foram concluídas com êxito, e o processo foi encerrado.
            <br>
            - Agradecemos a sua colaboração em ajudar a melhorar nossos processos de Qualidade.
            </h4>`;
        }



        let analisecausa = ''
        if(occurrence.manpower && occurrence.method && occurrence.material && occurrence.environment && occurrence.machine){
            analisecausa = `<div style="margin-bottom: 20px;">
            <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Análise da Causa Método ISHIKAWA</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f4f4f9;">Categoria</th>
                        <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f4f4f9;">Detalhes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Mão de obra</td>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.manpower || ''}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Método</td>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.method || ''}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Material</td>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.material || ''}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Meio Ambiente</td>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.environment || ''}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Máquina</td>
                        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.machine || ''}</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
        }

        let root_cause = '';
        if(occurrence.root_cause){
            root_cause = `<div style="margin-bottom: 20px;">
            <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Causa Raiz</h4>
            <p>${occurrence.root_cause || ''}</p>
        </div>`;
        }
        

        return `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9;">
            <div style="width: 80%; margin: 20px auto; background-color: #ffffff; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #007bff; color: #ffffff; padding: 10px; text-align: center;">
                    <h1 style="margin: 0;">Ocorrência ${occurrence.reference}</h1>
                </div>
                <div style="padding: 20px;">
                ${descriptionStatus}
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Informações da Ocorrência</h4>
                        <p><strong>Ocorrência:</strong> ${occurrence.title}</p>
                        <p><strong>Data Ocorrência:</strong> ${this.formatDate(occurrence.date_occurrence)}</p>
                        <p><strong>Data Abertura:</strong> ${this.formatDate(occurrence.create_at)}</p>
                        <p><strong>Unidade:</strong> ${occurrence.companycity} | ${occurrence.companycountry}</p>
                        <p><strong>Origem:</strong> ${occurrence.originName}</p>
                        <p><strong>Tipo:</strong> ${occurrence.type}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Pessoas Envolvidas</h4>
                        <div>
                            ${responsiblesHTML}
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Descrição</h4>
                        <p>${occurrence.description}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Correção (Ações já tomada(s))</h4>
                        <p>${occurrence.correction}</p>
                    </div>
                    ${analisecausa}
                    ${root_cause}
                </div>
            </div>
        </body>
        </html>`

    },
    open: async function(occurrence){
        let responsibles = occurrence.responsibles;
        let responsiblesHTML = ``;
        for (let index = 0; index < responsibles.length; index++) {
            const element = responsibles[index];
            responsiblesHTML += `<span style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 5px 10px; border-radius: 3px; margin-right: 5px; margin-bottom: 5px;">${element.name}</span>` 
        }

        // const status = {
        //     0: 'Pendente - Aprovação 1ª etapa',
        //     1: 'Reprovado - Aguardando Ajuste 1ª etapa',
        //     2: 'Aprovado - Liberado Preenchimento 2ª etapa',
        //     3: 'Pendente - aprovação 2ª etapa',
        //     4: 'Reprovado - Aguardando Ajuste 2ª etapa',
        //     5: 'Desenvolvimento - Ação Corretiva',
        //     6: 'Desenvolvimento - Avaliação de Eficácia',
        //     7: 'Finalizado'
        // }

        let descriptionStatus = '';
        if(occurrence.status == 0) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi aberta com sucesso!
            <br>
            - A partir deste momento, nossa equipe de Qualidade analisará e aprovará a ocorrência.
            <br>
            - Após a aprovação, você receberá um e-mail com informações detalhadas sobre os próximos passos.
            </h4>`;
        } else if(occurrence.status == 1) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi reprovada na 1ª etapa.
            <br>
            - Verificamos que ajustes são necessários para prosseguir.
            <br>
            - Por favor, revise as informações e faça as correções solicitadas. Após o ajuste, reenvie para aprovação.
            </h4>`;
        } else if(occurrence.status == 2) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi aprovada na 1ª etapa!
            <br>
            - Agora você pode prosseguir com o preenchimento das informações necessárias para a 2ª etapa.
            <br>
            - Certifique-se de preencher todos os campos solicitados para que possamos seguir com a análise.
            </h4>`;
        } else if(occurrence.status == 3) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência está aguardando aprovação na 2ª etapa.
            <br>
            - Nossa equipe de Qualidade está analisando as informações enviadas para confirmar a conformidade.
            <br>
            - Você receberá uma notificação por e-mail assim que a análise for concluída.
            </h4>`;
        } else if(occurrence.status == 4) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi reprovada na 2ª etapa.
            <br>
            - Foi identificado que ajustes adicionais são necessários para seguir com o processo.
            <br>
            - Por favor, revise e ajuste as informações conforme solicitado, e reenvie para nova análise.
            </h4>`;
        } else if(occurrence.status == 5) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência está em desenvolvimento para ação corretiva.
            <br>
            - Nossa equipe está trabalhando em uma solução para resolver a situação reportada.
            <br>
            - Você será notificado quando a ação corretiva for concluída e pronta para avaliação.
            </h4>`;
        } else if(occurrence.status == 6) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência está em avaliação de eficácia.
            <br>
            - A ação corretiva foi concluída e estamos agora analisando a sua eficácia.
            <br>
            - A equipe de Qualidade vai verificar se a solução atende aos critérios e resolve o problema definitivamente.
            </h4>`;
        } else if(occurrence.status == 7) {
            descriptionStatus = `<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
            Sua ocorrência foi finalizada com sucesso!
            <br>
            - A análise e ações corretivas foram concluídas com êxito, e o processo foi encerrado.
            <br>
            - Agradecemos a sua colaboração em ajudar a melhorar nossos processos de Qualidade.
            </h4>`;
        }
        
        // if(occurrence.status == 0){
        //     descriptionStatus = '<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;"> </h4>';
        // }else if(occurrence.status == 1){
        //     descriptionStatus = '<h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;"> </h4>';
        // }

        return `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9;">
            <div style="width: 80%; margin: 20px auto; background-color: #ffffff; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #007bff; color: #ffffff; padding: 10px; text-align: center;">
                    <h1 style="margin: 0;">Ocorrência ${occurrence.reference}</h1>
                </div>
                <div style="padding: 20px;">
                    ${descriptionStatus}
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Informações da Ocorrência</h4>
                        <p><strong>Ocorrência:</strong> ${occurrence.title}</p>
                        <p><strong>Data Ocorrência:</strong> ${this.formatDate(occurrence.date_occurrence)}</p>
                        <p><strong>Data Abertura:</strong> ${this.formatDate(occurrence.create_at)}</p>
                        <p><strong>Unidade:</strong> ${occurrence.companycity} | ${occurrence.companycountry}</p>
                        <p><strong>Origem:</strong> ${occurrence.originName}</p>
                        <p><strong>Tipo:</strong> ${occurrence.type}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Pessoas Envolvidas</h4>
                        <div>
                            ${responsiblesHTML}
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Descrição</h4>
                        <p>${occurrence.description}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Correção (Ações já tomada(s))</h4>
                        <p>${occurrence.correction}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>`

    },
    action: async function(occurrence, actions){
        let responsibles = occurrence.responsibles;
        let responsiblesHTML = ``;
        for (let index = 0; index < responsibles.length; index++) {
            const element = responsibles[index];
            responsiblesHTML += `<span style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 5px 10px; border-radius: 3px; margin-right: 5px; margin-bottom: 5px;">${element.name}</span>` 
        }
        console.log(actions)
        let actionsHTML = ``;
        for (let index = 0; index < actions.length; index++) {
            const element = actions[index];
            actionsHTML += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${element.action}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${element.name} ${element.family_name}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${element.deadline}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${element.status}</td>
            </tr>`
        }

        return `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9;">
            <div style="width: 80%; margin: 20px auto; background-color: #ffffff; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #007bff; color: #ffffff; padding: 10px; text-align: center;">
                    <h1 style="margin: 0;">Ocorrência ${occurrence.reference}</h1>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Informações da Ocorrência</h4>
                        <p><strong>Ocorrência:</strong> ${occurrence.title}</p>
                        <p><strong>Data Ocorrência:</strong> ${this.formatDate(occurrence.date_occurrence)}</p>
                        <p><strong>Data Abertura:</strong> ${this.formatDate(occurrence.create_at)}</p>
                        <p><strong>Unidade:</strong> ${occurrence.companycity} | ${occurrence.companycountry}</p>
                        <p><strong>Origem:</strong> ${occurrence.originName}</p>
                        <p><strong>Tipo:</strong> ${occurrence.type}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Pessoas Envolvidas</h4>
                        <div>
                            ${responsiblesHTML}
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Descrição</h4>
                        <p>${occurrence.description}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Correção (Ações já tomada(s))</h4>
                        <p>${occurrence.correction}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Análise da Causa Método ISHIKAWA</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f4f4f9;">Categoria</th>
                                    <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f4f4f9;">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Mão de obra</td>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.manpower}</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Método</td>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.method}</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Material</td>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.material}</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Meio Ambiente</td>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.environment}</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Máquina</td>
                                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${occurrence.machine}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Ações Corretivas</h4>
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Ação</th>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Responsável</th>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Prazo</th>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                              ${actionsHTML}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </body>
        </html>`

    },
    apresentation: async function(){
        return `<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f2f5; color: #333;">
        <div style="width: 80%; margin: 20px auto; background-color: #fff; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 30px; border-radius: 10px;">
            <h1 style="color: #4CAF50; text-align: center; margin-bottom: 20px; font-size: 28px;">Apresentação do Módulo de Não Conformidade</h1>
            
            <h2 style="color: #4CAF50; margin-top: 20px; font-size: 24px;">Introdução</h2>
            <p style="line-height: 1.6;">Este manual tem como objetivo guiar o usuário no uso do módulo de gestão de ocorrências de não conformidade detalhando as funcionalidades das telas e as etapas de acompanhamento das ocorrências.</p>
            
            <h2 style="color: #4CAF50; margin-top: 20px; font-size: 24px;">Tela de Gerenciamento de Ocorrências</h2>
            <p style="line-height: 1.6;">A tela de gerenciamento de ocorrências permite visualizar e acompanhar o status de diversas ocorrências dentro da organização. A seguir estão descritas as principais seções desta tela:</p>
            <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
                <li><strong>Ocorrências Por Unidade:</strong> Esta seção mostra a quantidade de ocorrências registradas em cada unidade da organização. As unidades são:
                    <ul style="list-style-type: circle; padding-left: 20px;">
                        <li>Itajaí Brasil</li>
                        <li>São Paulo Brasil</li>
                        <li>Curitiba Brasil</li>
                    </ul>
                </li>
                <li><strong>Ocorrências Abertas no Mês:</strong> Esta seção exibe o total de ocorrências que foram abertas no mês corrente.</li>
                <li><strong>Tempo Médio de Resolução:</strong> Esta seção apresenta o tempo médio necessário para resolver as ocorrências registradas.</li>
                <li><strong>Ações Tomadas:</strong> Esta seção informa o total de ações corretivas que foram tomadas em resposta às ocorrências registradas.</li>
                <li><strong>Ações Pendentes:</strong> Esta seção mostra o número total de ações corretivas que ainda estão pendentes e aguardando resolução.</li>
                <li><strong>Ocorrências Andamento/Finalizadas:</strong> Esta seção apresenta o total de ocorrências que estão em andamento e as que já foram finalizadas junto com suas respectivas porcentagens.</li>
                <li><strong>Ocorrências Por Tipo:</strong> Esta seção exibe o total de ocorrências categorizadas por tipo como oportunidade de melhoria e não conformidade.</li>
                <li><strong>Ocorrências Pendentes:</strong> Esta seção lista as ocorrências que ainda estão pendentes esperando ações corretivas ou outras intervenções.</li>
                <li><strong>Ações Tomadas:</strong> Esta seção detalha todas as ações corretivas que foram tomadas em resposta às ocorrências registradas.</li>
            </ul>
            
            <h2 style="color: #4CAF50; margin-top: 20px; font-size: 24px;">Tela de Cadastro de Ocorrência</h2>
            <p style="line-height: 1.6;">A tela de cadastro de ocorrência é utilizada para registrar novas ocorrências e acompanhar o progresso das ações corretivas e avaliações de eficácia. Abaixo estão os campos e etapas envolvidas no cadastro de uma ocorrência:</p>
            <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
                <li><strong>Detalhes da Ocorrência:</strong>
                    <ul style="list-style-type: circle; padding-left: 20px;">
                        <li>Ocorrência: Descrição breve da ocorrência (ex: Deixou a porta aberta do financeiro)</li>
                        <li>Data da Ocorrência: Data em que a ocorrência aconteceu</li>
                        <li>Unidade: Local onde a ocorrência foi registrada (ex: Itajaí Brasil)</li>
                        <li>Origem: Fonte da ocorrência (ex: Auditoria interna)</li>
                        <li>Tipo: Classificação da ocorrência (ex: Não conformidade)</li>
                        <li>Envolvidos: Pessoas envolvidas na ocorrência (ex: Dayana Alves)</li>
                    </ul>
                </li>
                <li><strong>Descrição da Ocorrência:</strong> Campo para descrever detalhadamente a ocorrência registrada.</li>
                <li><strong>Correção (Ações já tomadas):</strong> Campo para descrever as ações corretivas que já foram realizadas em resposta à ocorrência.</li>
                <li><strong>Análise da Causa (Método ISHIKAWA):</strong> Análise das causas da não conformidade utilizando o método Ishikawa:
                    <ul style="list-style-type: circle; padding-left: 20px;">
                        <li>Mão de obra: Descrever se a não conformidade está relacionada a treinamento qualificação etc.</li>
                        <li>Método: Descrever se está relacionado a procedimentos instruções etc.</li>
                        <li>Material: Descrever se está relacionado a dimensões especificações etc.</li>
                        <li>Meio Ambiente: Descrever se está relacionado a espaço temperatura etc.</li>
                        <li>Máquina: Descrever se está relacionado a equipamentos ferramentas etc.</li>
                        <li>Causa Raiz: Identificar a causa raiz da não conformidade.</li>
                    </ul>
                </li>
                <li><strong>Ação Corretiva:</strong>
                    <ul style="list-style-type: circle; padding-left: 20px;">
                        <li>Ação: Descrição da ação corretiva (ex: Nova ação corretiva)</li>
                        <li>Responsável: Pessoa responsável pela ação corretiva (ex: Dayana Alves)</li>
                        <li>Prazo: Data limite para a implementação da ação corretiva (ex: 26/07/2024)</li>
                        <li>Status: Status atual da ação corretiva (ex: Finalizada)</li>
                    </ul>
                </li>
                <li><strong>Avaliação de Eficácia:</strong>
                    <ul style="list-style-type: circle; padding-left: 20px;">
                        <li>Ação: Descrição da avaliação de eficácia (ex: Avaliação de eficácia)</li>
                        <li>Responsável: Pessoa responsável pela avaliação (ex: Petryck William Silva Leite)</li>
                        <li>Prazo (previsto): Data limite para a avaliação de eficácia (ex: 26/07/2024)</li>
                        <li>Status: Status atual da avaliação de eficácia (ex: Finalizada)</li>
                    </ul>
                </li>
                <li><strong>Riscos Oportunidade e Mudanças:</strong> Campo para descrever quaisquer riscos adicionais oportunidades de melhoria ou mudanças necessárias identificadas durante o processo.</li>
            </ul>
    
            <h2 style="color: #4CAF50; margin-top: 20px; font-size: 24px;">Status das Ocorrências</h2>
            <p style="line-height: 1.6;">O manual a seguir detalha os diferentes status que uma ocorrência pode ter no sistema:</p>
            <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
                <li><strong>Pendente - Aprovação 1ª etapa (ID: 0):</strong> A ocorrência foi registrada e aguarda aprovação inicial. Revisão e aprovação ou reprovação para avançar para a próxima etapa.</li>
                <li><strong>Reprovado - Aguardando Ajuste 1ª etapa (ID: 1):</strong> A ocorrência não foi aprovada na primeira etapa e necessita de ajustes. Correção e reenvio para nova avaliação.</li>
                <li><strong>Aprovado - Liberado Preenchimento 2ª etapa (ID: 2):</strong> A ocorrência foi aprovada na primeira etapa e está liberada para o preenchimento da segunda etapa. Fornecimento de informações detalhadas no Método ISHIKAWA.</li>
                <li><strong>Pendente - Aprovação 2ª etapa (ID: 3):</strong> A ocorrência aguarda a aprovação da segunda etapa. Revisão das ações corretivas propostas e aprovação ou reprovação.</li>
                <li><strong>Reprovado - Aguardando Ajuste 2ª etapa (ID: 4):</strong> A ocorrência não foi aprovada na segunda etapa e necessita de ajustes. Correção e reenvio para nova avaliação.</li>
                <li><strong>Desenvolvimento - Ação Corretiva (ID: 5):</strong> A ocorrência foi aprovada nas etapas anteriores e está na fase de desenvolvimento da ação corretiva. Implementação das ações corretivas e registro de progresso.</li>
                <li><strong>Desenvolvimento - Avaliação de Eficácia (ID: 6):</strong> A eficácia das ações corretivas está sendo avaliada. Avaliação detalhada da eficácia e ajustes adicionais se necessário.</li>
                <li><strong>Finalizado (ID: 7):</strong> A ocorrência foi completamente resolvida. Registro de todas as ações e avaliações realizadas e encerramento formal da ocorrência.</li>
            </ul>
            
            <h2 style="color: #4CAF50; margin-top: 20px; font-size: 24px;">Requisitos para Finalização e Aprovação de Ocorrências</h2>
            <p style="line-height: 1.6;"><strong>Ação Corretiva:</strong> A ação corretiva é finalizada ao anexar uma evidência deixando assim o status como "Finalizada".</p>
            <p style="line-height: 1.6;"><strong>Avaliação de Eficácia:</strong> A avaliação de eficácia também é finalizada ao anexar uma evidência deixando o status como "Finalizada".</p>
            <p style="line-height: 1.6;">É obrigatório a inserção da evidência para prosseguir para a próxima etapa de "Desenvolvimento - Avaliação de Eficácia".</p>
            <p style="line-height: 1.6;">Só é possível aprovar a ocorrência com status de "Desenvolvimento - Ação Corretiva" quando todas as ações tiverem uma evidência anexada.</p>
        </div>
                </body>`
    },
    formatDate: function (dateString) {
        const date = new Date(dateString); // Cria um objeto Date a partir da string de data
        const day = String(date.getDate()).padStart(2, '0'); // Garante que o dia tenha dois dígitos
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Garante que o mês tenha dois dígitos
        const year = date.getFullYear(); // Obtém o ano
        return `${day}/${month}/${year}`; // Retorna a data formatada
    },
}


module.exports = {
    emailCustom: emailCustom
  };