const { executeQuery } = require('../connect/mysql');


const emailCustom = {
    complete: async function(occurrence){
        let responsibles = occurrence.responsibles;
        let responsiblesHTML = ``;
        for (let index = 0; index < responsibles.length; index++) {
            const element = responsibles[index];
            responsiblesHTML += `<span style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 5px 10px; border-radius: 3px; margin-right: 5px; margin-bottom: 5px;">${element.name}</span>` 
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
                        <h4 style="background-color: #f4f4f9; padding: 10px; border-left: 4px solid #007bff; margin-bottom: 10px;">Causa Raiz</h4>
                        <p>${occurrence.root_cause}</p>
                    </div>
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