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
    // Template de notificação de solicitação de gasto
    expenseRequestNotification: function(data) {
        return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #2c3e50; text-align: center;">Nova Solicitação de Gasto Pendente</h2>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="color: #3498db; margin-top: 0;">Informações da Solicitação</h3>
                <p><strong>ID da Solicitação:</strong> #${data.id}</p>
                <p><strong>Centro de Custo:</strong> ${data.costCenterName}</p>
                <p><strong>Período:</strong> ${data.month}/${data.year}</p>
                <p><strong>Solicitante:</strong> ${data.requesterName}</p>
                <p><strong>Valor Total:</strong> ${data.total_amount}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #3498db;">Itens Solicitados</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #3498db; color: white;">
                            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Categoria</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Descrição</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Quantidade</th>
                            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Valor Unitário</th>
                            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.items.map(item => `
                            <tr>
                                <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${item.category}</td>
                                <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${item.description}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.unitAmount}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.subtotal}</td>
                            </tr>
                        `).join('')}
                        <tr style="background-color: #f9f9f9;">
                            <td colspan="4" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Total:</strong></td>
                            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>${data.total_amount}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="background-color: #f2f9ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="color: #3498db; margin-top: 0;">Ações Necessárias</h3>
                <p>Por favor, acesse o sistema para aprovar ou rejeitar esta solicitação:</p>
                <p>1. Faça login no sistema Sirius</p>
                <p>2. Navegue até "Orçamento Base Zero" > "Aprovações Pendentes"</p>
                <p>3. Localize a solicitação #${data.id} e revise os detalhes</p>
                <p>4. Aprove ou rejeite a solicitação com base na análise</p>
            </div>
            
            <div style="text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px;">
                <p>Esta é uma mensagem automática do sistema Sirius. Por favor, não responda a este e-mail.</p>
            </div>
        </div>
        `;
    },
    
    // Template de atualização de status de solicitação de gasto
    expenseRequestStatusUpdate: function(data) {
        const statusColor = data.status === 'Aprovado' ? '#27ae60' : '#e74c3c';
        const statusText = data.status === 'Aprovado' ? 'APROVADA' : 'REJEITADA';
        
        return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #2c3e50; text-align: center;">Atualização de Status da Solicitação de Gasto</h2>
            
            <div style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
                <h3 style="margin: 0; font-size: 24px;">Solicitação ${statusText}</h3>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="color: #3498db; margin-top: 0;">Informações da Solicitação</h3>
                <p><strong>ID da Solicitação:</strong> #${data.id}</p>
                <p><strong>Centro de Custo:</strong> ${data.costCenterName}</p>
                <p><strong>Período:</strong> ${data.month}/${data.year}</p>
                <p><strong>Aprovador:</strong> ${data.approverName}</p>
                <p><strong>Valor Total:</strong> ${data.total_amount}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #3498db;">Itens Solicitados</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #3498db; color: white;">
                            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Categoria</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Descrição</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Quantidade</th>
                            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Valor Unitário</th>
                            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.items.map(item => `
                            <tr>
                                <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${item.category}</td>
                                <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${item.description}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.unitAmount}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.subtotal}</td>
                            </tr>
                        `).join('')}
                        <tr style="background-color: #f9f9f9;">
                            <td colspan="4" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Total:</strong></td>
                            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>${data.total_amount}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            ${data.comment ? `
            <div style="background-color: #f2f9ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="color: #3498db; margin-top: 0;">Comentário do Aprovador</h3>
                <p style="background-color: white; padding: 10px; border-radius: 3px; border-left: 4px solid ${statusColor};">${data.comment}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px;">
                <p>Esta é uma mensagem automática do sistema Sirius. Por favor, não responda a este e-mail.</p>
            </div>
        </div>
        `;
    },
    // Template de notificação para novos PDIs
    pdiNotification: async function(data) {
        return `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9;">
            <div style="width: 80%; margin: 20px auto; background-color: #ffffff; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #007bff; color: #ffffff; padding: 10px; text-align: center;">
                    <h1 style="margin: 0;">Novo Plano de Desenvolvimento Individual (PDI)</h1>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
                            Olá ${data.collaborator_name},
                            <br><br>
                            Um novo Plano de Desenvolvimento Individual (PDI) foi criado para você.
                            <br>
                            Por favor, acesse o sistema para visualizar os detalhes e acompanhar seu progresso.
                        </h4>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Informações do PDI</h4>
                        <p><strong>ID do PDI:</strong> ${data.pdi_id}</p>
                        <p><strong>Data de Criação:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                        <p><strong>Supervisor/Coordenador:</strong> ${data.supervisor_name || 'Não especificado'}</p>
                    </div>
                    <div style="margin-top: 30px; text-align: center;">
                        <p style="font-size: 16px; color: #007bff; font-weight: bold;">Para acessar todas as informações do seu PDI, entre no Sirius e pesquise por <span style='background: #e6f0ff; padding: 2px 6px; border-radius: 4px; font-weight: bold;'>"PDI Hub"</span>.</p>
                    </div>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777; text-align: center;">
                        <p>Este é um e-mail automático. Por favor, não responda.</p>
                        <p>© ${new Date().getFullYear()} CONLINE. Todos os direitos reservados.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
    },
    // Notificação para o supervisor quando uma ação é concluída
    pdiActionCompletedSupervisor: function(data) {
        return `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9;">
            <div style="width: 80%; margin: 20px auto; background-color: #ffffff; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #007bff; color: #ffffff; padding: 10px; text-align: center;">
                    <h1 style="margin: 0;">Ação de PDI Concluída</h1>
                </div>
                <div style="padding: 20px;">
                    <h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
                        Olá ${data.supervisor_name},<br><br>
                        Uma ação do PDI sob sua supervisão foi concluída.<br>
                        Veja os detalhes abaixo:
                    </h4>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Detalhes da Ação</h4>
                        <p><strong>Colaborador:</strong> ${data.collaborator_name}</p>
                        <p><strong>Descrição da Ação:</strong> ${data.action_description}</p>
                        <p><strong>Prazo:</strong> ${data.deadline}</p>
                        <p><strong>Data de Conclusão:</strong> ${data.completion_date}</p>
                        <p><strong>ID do PDI:</strong> ${data.pdi_id}</p>
                    </div>
                    ${data.supervisor_alert ? `<div style="margin-bottom: 20px;"><strong>${data.supervisor_alert}</strong></div>` : ''}
                    ${(data.pending_actions && data.pending_actions.length > 0) ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-bottom: 10px;">Ações Pendentes deste PDI</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f9f9f9;">
                                    <th style="padding: 8px; border: 1px solid #ddd;">Descrição</th>
                                    <th style="padding: 8px; border: 1px solid #ddd;">Prazo</th>
                                    <th style="padding: 8px; border: 1px solid #ddd;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.pending_actions.map(a => `
                                    <tr>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${a.description}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${a.deadline}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${a.status}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777; text-align: center;">
                        <p>Este é um e-mail automático. Por favor, não responda.</p>
                        <p>© ${new Date().getFullYear()} CONLINE. Todos os direitos reservados.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
    },

    // Parabenização ao colaborador pela conclusão da ação
    pdiActionCompletedCongrats: function(data) {
        return `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9;">
            <div style="width: 80%; margin: 20px auto; background-color: #ffffff; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #28a745; color: #ffffff; padding: 10px; text-align: center;">
                    <h1 style="margin: 0;">Parabéns pela Conclusão da Ação!</h1>
                </div>
                <div style="padding: 20px;">
                    <h4 style="background-color: #f4f4f9; padding: 10px; margin-bottom: 10px;">
                        Olá ${data.collaborator_name},<br><br>
                        Parabéns! Você concluiu uma ação do seu Plano de Desenvolvimento Individual (PDI).<br>
                        <span style="color: #28a745; font-weight: bold;">${data.motivacional_msg || ''}</span>
                    </h4>
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #28a745; margin-bottom: 10px;">Detalhes da Ação</h4>
                        <p><strong>Descrição da Ação:</strong> ${data.action_description}</p>
                        <p><strong>Prazo:</strong> ${data.deadline}</p>
                        <p><strong>Data de Conclusão:</strong> ${data.completion_date}</p>
                        <p><strong>ID do PDI:</strong> ${data.pdi_id}</p>
                    </div>
                    ${(data.pending_actions && data.pending_actions.length > 0) ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-bottom: 10px;">Ações Pendentes do seu PDI</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f9f9f9;">
                                    <th style="padding: 8px; border: 1px solid #ddd;">Descrição</th>
                                    <th style="padding: 8px; border: 1px solid #ddd;">Prazo</th>
                                    <th style="padding: 8px; border: 1px solid #ddd;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.pending_actions.map(a => `
                                    <tr>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${a.description}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${a.deadline}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${a.status}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777; text-align: center;">
                        <p>Este é um e-mail automático. Por favor, não responda.</p>
                        <p>© ${new Date().getFullYear()} CONLINE. Todos os direitos reservados.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
    },
}

function formatDateBR(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function marketingTicketInfoBlock(ticket) {
    return `
    <div style="background: #f4f4f9; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
        <h2 style="color: #f9423a; margin-top: 0;">Informações do Chamado</h2>
        <p><strong>Título:</strong> ${ticket.title}</p>
        <p><strong>Tipo:</strong> ${ticket.type}${ticket.other_type ? ` - ${ticket.other_type}` : ''}</p>
        <p><strong>Categoria:</strong> ${ticket.category}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        <p><strong>Descrição:</strong> ${ticket.description}</p>
        <p><strong>Data de Abertura:</strong> ${formatDateBR(ticket.created_at)}</p>
        <p><strong>Previsão de Início:</strong> ${formatDateBR(ticket.start_date)}</p>
        <p><strong>Previsão de Entrega:</strong> ${formatDateBR(ticket.end_date)}</p>
        <p><strong>Solicitante:</strong> ${ticket.requester_name || '-'}</p>
        <p><strong>Responsável:</strong> ${ticket.responsible_name || '-'}</p>
        <p><strong>Envolvidos:</strong> ${(ticket.involved_names && ticket.involved_names.length > 0) ? ticket.involved_names.join(', ') : '-'}</p>
    </div>
    `;
}

// Gera bloco HTML com histórico do chat
function marketingTicketChatBlock(comments) {
    let commentsHtml = '';
    comments.forEach(comment => {
        const time = new Date(comment.created_at).toLocaleString('pt-BR');
        commentsHtml += `
            <div style="margin-bottom: 18px;">
              <div style="font-weight: bold; color: #f9423a;">${comment.author_name} <span style="color: #888; font-weight: normal;">(${time})</span></div>
              <div style="background: #f4f4f9; border-radius: 6px; padding: 10px 14px; margin-top: 4px;">${comment.message}</div>
            </div>
        `;
    });
    return `
    <div style="margin-top: 32px;">
        <h2 style="color: #f9423a;">Histórico de Mensagens</h2>
        ${commentsHtml}
    </div>
    `;
}

// Função para gerar mensagens específicas baseadas no status
function getStatusUpdateMessage(status, ticketTitle) {
    const statusMessages = {
        'Em triagem': {
            title: 'Chamado em Análise',
            subtitle: `Seu chamado "${ticketTitle}" está sendo analisado`,
            message: `
                <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="color: #e65100; margin-top: 0;">🔍 Chamado em Triagem</h3>
                    <p>Nossa equipe está analisando os detalhes do seu chamado para entender melhor suas necessidades.</p>
                    <p><strong>Próximo passo:</strong> Após a análise, definiremos as próximas ações e prazos.</p>
                </div>
            `
        },
        'Em andamento': {
            title: 'Chamado Iniciado',
            subtitle: `Seu chamado "${ticketTitle}" foi iniciado`,
            message: `
                <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="color: #1565c0; margin-top: 0;">🚀 Chamado em Andamento</h3>
                    <p>Ótimo! Seu chamado foi iniciado e nossa equipe está trabalhando nele.</p>
                    <p><strong>Próximo passo:</strong> Acompanhe o progresso pelo sistema e aguarde atualizações.</p>
                </div>
            `
        },
        'Aguardando validação': {
            title: 'Aguardando Sua Validação',
            subtitle: `Seu chamado "${ticketTitle}" precisa da sua aprovação`,
            message: `
                <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="color: #f57f17; margin-top: 0;">⏳ Aguardando Validação</h3>
                    <p>Precisamos da sua validação para continuar com o chamado.</p>
                    <p><strong>Próximo passo:</strong> Acesse o sistema para revisar e aprovar o que foi desenvolvido.</p>
                </div>
            `
        },
        'Aguardando retorno do solicitante': {
            title: 'Aguardando Seus Testes e Aprovação',
            subtitle: `Seu chamado "${ticketTitle}" está aguardando sua validação`,
            message: `
                <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="color: #c62828; margin-top: 0;">⏳ Aguardando Testes e Aprovação</h3>
                    <p>Seu chamado está pronto para testes e aprovação final.</p>
                    <p><strong>Próximo passo:</strong> Teste o que foi desenvolvido e aprove para finalizar o chamado.</p>
                </div>
            `
        },
        'Concluído': {
            title: 'Chamado Concluído',
            subtitle: `Seu chamado "${ticketTitle}" foi finalizado`,
            message: `
                <div style="background: #e8f5e8; border-left: 4px solid #4caf50; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="color: #2e7d32; margin-top: 0;">✅ Chamado Finalizado</h3>
                    <p>Parabéns! Seu chamado foi concluído com sucesso.</p>
                    <p><strong>Próximo passo:</strong> Avalie nosso trabalho e entre em contato se precisar de ajustes.</p>
                </div>
            `
        },
        'Cancelado': {
            title: 'Chamado Cancelado',
            subtitle: `Seu chamado "${ticketTitle}" foi cancelado`,
            message: `
                <div style="background: #fafafa; border-left: 4px solid #9e9e9e; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="color: #616161; margin-top: 0;">❌ Chamado Cancelado</h3>
                    <p>Seu chamado foi cancelado conforme solicitado.</p>
                    <p><strong>Próximo passo:</strong> Entre em contato se precisar reativar o chamado.</p>
                </div>
            `
        }
    };
    
    return statusMessages[status] || {
        title: 'Atualização de Status',
        subtitle: `Status do chamado "${ticketTitle}" foi alterado`,
        message: `
            <div style="background: #f4f4f9; border-left: 4px solid #9e9e9e; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <h3 style="color: #616161; margin-top: 0;">📝 Status Atualizado</h3>
                <p>O status do seu chamado foi alterado para: <strong>${status}</strong></p>
                <p><strong>Próximo passo:</strong> Acompanhe o progresso pelo sistema.</p>
            </div>
        `
    };
}

// Adicionar/garantir a função marketingTicketTemplate antes do export final
function marketingTicketTemplate({ title, subtitle, content, footer }) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f9;">
  <div style="max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px #0001;">
    <div style="background: #f9423a; color: #fff; border-radius: 10px 10px 0 0; padding: 24px 32px; text-align: center;">
      <img src="https://conlinebr.com.br/assets/img/icon-redondo.png" alt="Logo" style="height: 48px; margin-bottom: 8px;">
      <h1 style="margin: 0; font-size: 1.7rem;">${title || ''}</h1>
      <p style="margin: 0; font-size: 1.1rem;">${subtitle || ''}</p>
    </div>
    <div style="padding: 32px;">
      ${content || ''}
    </div>
    <div style="background: #f4f4f9; color: #888; border-radius: 0 0 10px 10px; text-align: center; font-size: 0.95rem; padding: 18px;">
      ${footer || ''}
      <br>Esta é uma mensagem automática do sistema Sirius. Não responda este e-mail.
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
    emailCustom: emailCustom,
    marketingTicketTemplate: marketingTicketTemplate,
    marketingTicketInfoBlock: marketingTicketInfoBlock,
    marketingTicketChatBlock: marketingTicketChatBlock,
    getStatusUpdateMessage: getStatusUpdateMessage
};