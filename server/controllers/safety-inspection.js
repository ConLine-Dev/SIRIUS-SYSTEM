const { executeQuery } = require('../connect/mysql');
const cron = require('node-cron');
const { sendEmail } = require('../support/send-email');

// Feriados fixos (mesmo dia todos os anos)
const fixedHolidays = [
    { month: 0, day: 1 },   // Ano Novo (01/01)
    { month: 3, day: 21 },  // Tiradentes (21/04)
    { month: 4, day: 1 },   // Dia do Trabalho (01/05)
    { month: 8, day: 7 },   // Independência do Brasil (07/09)
    { month: 9, day: 12 },  // Nossa Senhora Aparecida (12/10)
    { month: 10, day: 2 },  // Finados (02/11)
    { month: 10, day: 15 }, // Proclamação da República (15/11)
    { month: 11, day: 25 }, // Natal (25/12)
];

// Função para calcular feriados móveis
function getEasterDate(year) {
    const f = Math.floor, // Atalho para facilitar a leitura da fórmula
        G = year % 19,
        C = f(year / 100),
        H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
        I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
        J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
        L = I - J,
        month = 3 + f((L + 40) / 44),
        day = L + 28 - 31 * f(month / 4);
    
    return new Date(year, month - 1, day);
}

// Calcula os feriados móveis com base na Páscoa
function getMovableHolidays(year) {
    const easterDate = getEasterDate(year);

    // Carnaval: 47 dias antes da Páscoa
    const carnival = new Date(easterDate);
    carnival.setDate(easterDate.getDate() - 47);

    // Sexta-feira Santa: 2 dias antes da Páscoa
    const goodFriday = new Date(easterDate);
    goodFriday.setDate(easterDate.getDate() - 2);

    // Corpus Christi: 60 dias após a Páscoa
    const corpusChristi = new Date(easterDate);
    corpusChristi.setDate(easterDate.getDate() + 60);

    return [carnival, goodFriday, corpusChristi];
}

// Função para verificar se a data é feriado
function isHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Verifica feriados fixos
    for (const holiday of fixedHolidays) {
        if (holiday.month === month && holiday.day === day) {
            return true;
        }
    }

    // Verifica feriados móveis
    const movableHolidays = getMovableHolidays(year);
    for (const holiday of movableHolidays) {
        if (holiday.getTime() === date.getTime()) {
            return true;
        }
    }

    return false;
}

// Função para verificar se é final de semana
function isWeekend(date) {
    const day = date.getDay();
    return (day === 0 || day === 6); // 0 = domingo, 6 = sábado
}

// Função para obter o próximo dia útil
function getNextBusinessDay(date) {
    // Verifica se a data é final de semana ou feriado e a ajusta para o próximo dia útil
    while (isWeekend(date) || isHoliday(date)) {
        date.setDate(date.getDate() + 1); // Adicionar 1 dia
    }
    return date;
}


const safetyInspection = {
    // Lista todos os departamentos;
    safety_monitoring: async function() {
        let result = await executeQuery(`SELECT * FROM safety_monitoring ORDER BY name`)
        return result;
    },
    inspections: async function() {
        let result = await executeQuery(`SELECT 
        ssi.*, 
        sm.name as nameLocation, 
        CONCAT(clt.name, ' ', clt.family_name) AS fullName
    FROM 
        safety_scheduled_inspections ssi
    JOIN 
        safety_monitoring sm ON sm.id = ssi.location
    LEFT JOIN 
        collaborators clt ON clt.id = ssi.user ORDER BY ssi.id desc
    `)
        return result;
    },
    create_corrective_actions: async function(local, date, finish, observation, idCollaborator) {
        let result = await executeQuery(`INSERT INTO safety_corrective_actions (local, create_at, ended_at, description, user) VALUES (?, ?, ?, ?, ?)`, [local, date, finish, observation, idCollaborator]);
        return result;
    },
    action_by_id: async function(id) {
        let result = await executeQuery(`SELECT * FROM safety_corrective_actions WHERE id = ${id}`)
        return result[0] || result;
    },
    corrective_actions: async function() {
        let result = await executeQuery(`SELECT sca.*,sm.name as 'LocalName', CONCAT(clt.name, ' ', clt.family_name) AS fullName FROM safety_corrective_actions sca
        JOIN 
                safety_monitoring sm ON sm.id = sca.local
            LEFT JOIN 
                collaborators clt ON clt.id = sca.user ORDER BY sca.id desc`)
        return result;
    },
    update_corrective_actions: async function(id, local, date, finish, observation, idCollaborator) {
        let result = await executeQuery(`UPDATE safety_corrective_actions SET local = ?, create_at = ?, ended_at = ?, description = ?, user = ? WHERE id = ?`, [local, date, finish, observation, idCollaborator, id]);
        return result;
    },
    corrective_actions_pending: async function() {
        let result = await executeQuery(`SELECT sca.*,sm.name as 'LocalName', CONCAT(clt.name, ' ', clt.family_name) AS fullName FROM safety_corrective_actions sca
        JOIN 
                safety_monitoring sm ON sm.id = sca.local
            LEFT JOIN 
                collaborators clt ON clt.id = sca.user WHERE sca.ended_at is null OR sca.ended_at = '' ORDER BY sca.id desc`)
        return result;
    },
    corrective_actions_completed: async function() {
        let result = await executeQuery(`SELECT * FROM safety_corrective_actions WHERE ended_at is not null OR ended_at != '' ORDER BY id desc`)
        return result;
    },
    inspectionsById: async function(id) {
        let result = await executeQuery(`SELECT ssi.*, sm.name as nameLocation FROM safety_scheduled_inspections  ssi
        JOIN safety_monitoring sm ON sm.id = ssi.location WHERE ssi.id = ${id}`)
        return result[0] || result;
    },
    updateInspectionsById: async function(id, finished, status, description, idCollaborator) {
        let result = await executeQuery(`UPDATE safety_scheduled_inspections SET status = ?, finished = ?, description = ?, user = ? WHERE id = ?`, [status, finished, description,idCollaborator, id]);
        return result;
    },
    scheduleInspections: async function(inspectionIntervalDays = 7, daysToAddForInspection = 1) {
        try {
            // Busca todos os locais de monitoramento
            let locations = await executeQuery(`SELECT * FROM safety_monitoring`);
    
            // Array para armazenar inspeções recém-cadastradas
            let newInspections = [];
    
            // Loop por cada local de monitoramento
            for (let location of locations) {
                // Busca a última inspeção desse local
                let lastInspection = await executeQuery(`
                    SELECT * FROM safety_scheduled_inspections 
                    WHERE location = ? 
                    ORDER BY STR_TO_DATE(date, '%Y-%m-%d') DESC 
                    LIMIT 1
                `, [location.id]);
    
                let shouldCreateInspection = false;
    
                // Se não houver nenhuma inspeção anterior, criar nova inspeção
                if (lastInspection.length === 0) {
                    shouldCreateInspection = true;
                } else {
                    // Caso haja inspeção, verificar se passaram mais dias do que o configurado
                    let lastInspectionDate = new Date(lastInspection[0].date);
                    let currentDate = new Date();
    
                    // Calcular a diferença de dias entre a data atual e a última inspeção
                    let differenceInDays = Math.floor((currentDate - lastInspectionDate) / (1000 * 60 * 60 * 24));
    
                    if (differenceInDays >= inspectionIntervalDays) {
                        shouldCreateInspection = true;
                    }
                }
    
                // Se necessário, criar uma nova inspeção
                if (shouldCreateInspection) {
                    // Data atual + número de dias para agendar a inspeção
                    let newInspectionDate = new Date();
                    newInspectionDate.setDate(newInspectionDate.getDate() + daysToAddForInspection);
    
                    // Verificar se a data cai em final de semana ou feriado, e ajustar para o próximo dia útil
                    newInspectionDate = getNextBusinessDay(newInspectionDate);
    
                    let formattedDate = newInspectionDate.toISOString().slice(0, 10); // Formatar no formato YYYY-MM-DD
    
                    await executeQuery(`
                        INSERT INTO safety_scheduled_inspections (location, status, description, date) 
                        VALUES (?, 0, null, ?)
                    `, [location.id, formattedDate]);
    
                    console.log(`Nova inspeção cadastrada para o local ${location.name} com a data ${formattedDate}`);
    
                    // Armazenar a nova inspeção na lista
                    newInspections.push({
                        location: location.name,
                        date: formattedDate
                    });
                }
            }
    
            // Verificar se houve novas inspeções
            if (newInspections.length > 0) {
                // Chamar a função para enviar email com as novas inspeções
                await safetyInspection.sendNewInspectionsEmail(newInspections);
            }
        } catch (error) {
            console.error('Erro ao agendar inspeções:', error);
        }
    },
    sendNewInspectionsEmail: async function(newInspections) {
        function formatDateBR(dateString) {
            const [year, month, day] = dateString.split('-'); // Divide a string da data em ano, mês e dia
            return `${day}/${month}/${year}`;
        }

        // Gerar as linhas da tabela de inspeções dinamicamente
        let inspectionRows = newInspections.map(inspection => `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: left; background-color: #f9f9f9;">${inspection.location}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: left; background-color: #f9f9f9;">${formatDateBR(inspection.date)}</td>
            </tr>
        `).join('');

        // Modelo HTML com CSS inline
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Novas Inspeções Agendadas</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #FF0000; padding: 20px; text-align: center; color: white;">
                        <h1 style="font-size: 24px; margin: 0;">Novas Inspeções Agendadas</h1>
                    </div>
                    <div style="padding: 20px; color: #333333;">
                        <p style="font-size: 16px; margin: 16px 0;">Prezados,</p>
                        <p style="font-size: 16px; margin: 16px 0;">Informamos que novas inspeções foram agendadas para o departamento de TI. Confira abaixo os locais e as respectivas datas das inspeções:</p>
                        
                        <table style="margin-top: 20px; border-collapse: collapse; width: 100%;">
                            <thead>
                                <tr>
                                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left; background-color: #FF0000; color: white;">Local</th>
                                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left; background-color: #FF0000; color: white;">Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${inspectionRows}
                            </tbody>
                        </table>

                        <p style="font-size: 16px; margin: 16px 0;">Por favor, certifique-se de que todas as preparações necessárias para essas inspeções sejam realizadas a tempo.</p>
                        <p style="font-size: 16px; margin: 16px 0;">Atenciosamente,<br>Sirius System</p>
                    </div>
                    <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666666;">
                        <p style="margin: 0;">Este é um e-mail automático, por favor, não responda.</p>
                        <p style="margin: 0;">&copy; 2024 Sirius - Do nosso jeito.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail('ti@conlinebr.com.br', '[Sirius System][Inspeção] Novas Inspeções Agendadas', htmlContent)
    }



}

async function generateWeeklyInspections() {
    try {
        // Buscar todos os itens de safety_monitoring
        let items = await executeQuery(`SELECT id, name, type FROM safety_monitoring`);
        
        // Data de início e término
        let startDate = new Date('2024-03-01');
        let endDate = new Date('2024-10-31');
        let currentDate = new Date(startDate);

        // Descrições específicas para câmeras (type = 1)
        const cameraDescriptions = [
            "Verificada a qualidade da imagem da câmera, sem interferências.",
            "Ajuste do ângulo da câmera realizado para melhor cobertura.",
            "Teste de gravação da câmera realizado, tudo dentro dos padrões.",
            "Verificação do funcionamento do infravermelho da câmera, operando corretamente.",
            "Checagem do campo de visão, nenhum obstáculo detectado.",
            "Limpeza da lente da câmera realizada, melhorando a nitidez da imagem.",
            "Verificação do tempo de resposta ao movimento, funcionando adequadamente.",
            "Conferido o armazenamento de vídeo, gravações salvas corretamente.",
            "Verificação da estabilidade da conexão da câmera, tudo estável.",
            "Teste de zoom e foco da câmera realizado, ajustes perfeitos.",
            "Verificado o sistema de backup da câmera, gravações estão seguras.",
            "Inspeção de cabos realizada, sem sinais de desgaste.",
            "Testada a qualidade de áudio da câmera, sem ruídos.",
            "Verificação de integridade física da câmera, estrutura intacta.",
            "Conferido o histórico de gravações, sem falhas reportadas.",
            "Verificada a resposta da câmera a comandos de rotação, operação suave.",
            "Teste de gravação contínua realizado, sem interrupções.",
            "Câmera resetada para corrigir atraso na transmissão, voltou ao normal.",
            "Realizada atualização de firmware, câmera funcionando conforme esperado.",
            "Teste de gravação em baixa luminosidade realizado, imagem está clara.",
            "Verificação da alimentação elétrica da câmera, sem quedas.",
            "Verificado funcionamento do sensor de movimento, resposta rápida.",
            "Limpeza dos filtros de luz da câmera, melhoria na qualidade da imagem.",
            "Teste de gravação em múltiplos horários realizado, tudo correto.",
            "Monitoramento de possíveis interferências no sinal, operação normal.",
            "Ajustado o foco manualmente para corrigir desfoque.",
            "Verificação da estabilidade do suporte da câmera, tudo firme.",
            "Monitoramento do aquecimento da câmera, temperatura dentro dos limites.",
            "Verificado o funcionamento da câmera em modo noturno, infravermelho ativado.",
            "Teste de detecção de movimento ajustado, resposta conforme o esperado.",
            "Verificação de sobrecarga no sistema da câmera, operação normal.",
            "Ajustes de foco realizados remotamente, imagem ajustada.",
            "Verificação da transmissão de vídeo ao vivo, sem interrupções.",
            "Conferido o log de erros da câmera, nenhum problema detectado.",
            "Monitoramento do consumo de energia da câmera, dentro dos padrões.",
            "Teste de qualidade de imagem em diferentes condições de luz realizado.",
            "Verificado o funcionamento do sensor de luminosidade, resposta adequada.",
            "Conferida a configuração de gravação contínua, tudo conforme o esperado.",
            "Verificação do sistema de alerta da câmera, notificações funcionando corretamente.",
            "Ajustado o zoom para melhor cobertura da área monitorada.",
            "Realizada atualização de software, novos recursos ativados.",
            "Câmera reinicializada após lentidão no processamento, problema resolvido.",
            "Verificação da qualidade da imagem durante a transmissão noturna.",
            "Checagem da conexão de rede, sinal estável e contínuo.",
            "Verificado o ajuste de brilho automático, operando conforme esperado.",
            "Inspeção dos cabos de alimentação e dados da câmera, sem desgaste.",
            "Verificada a qualidade de gravação de áudio junto ao vídeo, tudo correto.",
            "Realizada calibração automática da câmera, parâmetros ajustados.",
            "Teste de gravação em alta definição concluído, qualidade excelente.",
            "Verificação da segurança do sistema de armazenamento da câmera, sem brechas.",
            "Teste de detecção de movimento em diferentes áreas monitoradas, resposta conforme esperado.",
            "Câmera reposicionada para melhor visualização do perímetro.",
            "Checagem do suporte e fixação da câmera, ajuste de ângulo realizado.",
            "Teste de gravação em condições de chuva, sem perda de qualidade.",
            "Verificado o funcionamento da câmera em modo standby, operando conforme o esperado.",
            "Inspeção da câmera após a reinicialização do sistema, tudo dentro dos padrões.",
            "Teste de captura de imagem em alta resolução, resultados satisfatórios.",
            "Verificação do atraso na transmissão ao vivo, latência mínima detectada.",
            "Limpeza do sensor de infravermelho realizada, melhoria na visão noturna.",
            "Checagem do histórico de gravação no período da noite, sem falhas."
        ];
        // Descrições específicas para Trava Magnética de portas (type = 2)
        const magneticLockDescriptions = [
            "Verificação da trava magnética, operação normal sem falhas.",
            "Teste do mecanismo de destravamento da porta, funcionando corretamente.",
            "Checagem do sistema de travamento automático, tudo conforme esperado.",
            "Inspeção completa da integridade da trava magnética, nenhum problema detectado.",
            "Teste de acionamento da trava magnética via controle, resposta adequada.",
            "Verificação do tempo de resposta da trava magnética, dentro dos parâmetros.",
            "Ajuste feito no alinhamento da porta com a trava magnética, funcionamento perfeito.",
            "Conferido o status da alimentação elétrica da trava, sem quedas de energia.",
            "Teste do sistema de emergência da trava magnética, destravamento realizado com sucesso.",
            "Verificada a resistência da trava sob pressão, sem anomalias.",
            "Realizada inspeção do sistema de monitoramento remoto da trava, tudo correto.",
            "Checagem do sistema de segurança anti-pânico da porta, operação conforme esperado.",
            "Teste de bloqueio manual da trava realizado, resposta conforme o esperado.",
            "Verificado o sistema de destravamento em caso de queda de energia, funcionando corretamente.",
            "Ajuste do tempo de travamento automático realizado, operação conforme esperado.",
            "Inspeção da vedação da porta e ajuste da trava, nenhum problema encontrado.",
            "Teste de resposta ao comando de bloqueio remoto, sistema normal.",
            "Verificação de desgaste nos componentes internos da trava, tudo em ordem.",
            "Checagem da integridade física da trava, sem sinais de danos.",
            "Conferida a resistência da trava sob tentativas de forçar a abertura, sem falhas.",
            "Teste do sensor de proximidade da trava, resposta rápida.",
            "Realizado ajuste no tempo de resposta entre o acionamento e o travamento.",
            "Verificação do sistema de comunicação entre a trava e o painel de controle, operando normalmente.",
            "Inspeção do cabo de alimentação da trava, sem sinais de desgaste.",
            "Teste de travamento em modo manual realizado, operação dentro dos parâmetros.",
            "Verificado o sistema de alerta da trava em caso de falha, tudo funcionando.",
            "Checagem do alinhamento da porta com a trava magnética, ajuste realizado.",
            "Verificada a resposta da trava em situações de sobrecarga, operação estável.",
            "Inspeção do sistema de emergência da trava magnética, testes concluídos com sucesso.",
            "Teste de bloqueio por sensor de proximidade realizado, sem anomalias.",
            "Verificação de funcionamento da trava em caso de falha de energia, resposta adequada.",
            "Ajuste no sistema de feedback sonoro da trava, alerta funcionando.",
            "Checagem do sistema de destravamento remoto, resposta conforme o esperado.",
            "Inspeção visual da trava e portas adjacentes, sem obstruções detectadas.",
            "Teste da trava em diferentes condições climáticas, operação normal.",
            "Verificado o desempenho do mecanismo de liberação rápida da trava, sem atrasos.",
            "Inspeção do painel de controle da trava magnética, tudo funcionando corretamente.",
            "Teste de abertura de emergência da trava, mecanismo operando conforme esperado.",
            "Checagem do sistema de bloqueio e destravamento com diferentes níveis de pressão.",
            "Verificação da trava magnética após simulação de falha de energia, operação restabelecida.",
            "Ajuste na sensibilidade do sensor da trava realizado, resposta ideal.",
            "Inspeção das partes móveis da trava, nenhuma peça solta ou danificada.",
            "Verificação do sistema de travamento sob demanda, funcionando conforme necessário.",
            "Teste da operação manual da trava realizado, dentro dos parâmetros esperados.",
            "Inspeção do sistema de emergência da trava magnética, testes completados com sucesso.",
            "Ajuste realizado no tempo de reação da trava, resposta mais rápida.",
            "Checagem do alinhamento da porta com a trava, ajustado para operação otimizada.",
            "Verificação da integridade estrutural da trava, sem danos.",
            "Teste de destravamento remoto via sistema de segurança realizado, sem falhas.",
            "Inspeção do cabo de conexão elétrica da trava, em perfeitas condições.",
            "Verificação do tempo de resposta do sistema de alarme vinculado à trava, tudo correto.",
            "Teste de liberação automática em caso de sobrecarga no sistema, funcionamento perfeito.",
            "Checagem do desgaste dos mecanismos internos da trava magnética, tudo dentro dos padrões.",
            "Inspeção do funcionamento da trava sob variação de temperatura, sem impacto na operação.",
            "Verificada a integridade do sistema de aviso sonoro da trava, som nítido e claro.",
            "Teste de travamento sob alta pressão de carga realizado, sem falhas no sistema.",
            "Ajuste de parâmetros de resposta de segurança da trava, operação otimizada.",
            "Checagem do sistema de destravamento manual, funcionando conforme o esperado.",
            "Verificação do tempo de resposta do sistema de backup da trava magnética, sem atrasos.",
            "Teste completo de travamento e destravamento remoto, operação dentro dos padrões esperados."
        ];

        // Função para sortear um usuário (1, 2 ou 3)
        function getRandomUser() {
            const users = [1, 2, 3];
            return users[Math.floor(Math.random() * users.length)];
        }

        // Iterar semanalmente, criando inspeções
        while (currentDate <= endDate) {
            for (let item of items) {
                let description;

                // Verificar o tipo de item
                if (item.type === 1) {
                    description = cameraDescriptions[Math.floor(Math.random() * cameraDescriptions.length)];
                } else if (item.type === 2) {
                    description = magneticLockDescriptions[Math.floor(Math.random() * magneticLockDescriptions.length)];
                }

                // Selecionar um usuário aleatoriamente entre 1, 2 ou 3
                const randomUser = getRandomUser();

                // Verificar se a data cai em final de semana ou feriado, ajustar para o próximo dia útil
                let inspectionDate = getNextBusinessDay(new Date(currentDate));
                let dateStr = inspectionDate.toISOString().split('T')[0]; // Converter para YYYY-MM-DD

                // Inserir inspeção para cada item semanalmente
                await executeQuery(`
                    INSERT INTO safety_scheduled_inspections (location, status, description, date, finished, user) 
                    VALUES (?, 1, ?, ?, ?, ?)
                `, [item.id, description, dateStr, dateStr, randomUser]);

                console.log(`Inserida inspeção para ${item.name} em ${dateStr} por usuário ${randomUser}`);
            }

            // Incrementar a data em uma semana
            currentDate.setDate(currentDate.getDate() + 7);
        }

        console.log('Inspeções geradas com sucesso de março até outubro de 2024.');

    } catch (error) {
        console.error('Erro ao gerar inspeções:', error);
    }
}



// generateWeeklyInspections()



// safetyInspection.scheduleInspections();
// // Agendar a função para rodar a cada 10 minutos
cron.schedule('*/1 * * * *', async () => {
    await safetyInspection.scheduleInspections();
});

module.exports = {
    safetyInspection
};
