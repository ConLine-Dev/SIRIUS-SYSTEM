// Templates de email específicos para candidatos do módulo RH Job Openings
const hrCandidateTemplates = {
    // Email de confirmação de candidatura
    applicationConfirmation: {
        generate: async function(applicationData) {
            const { candidate_name, candidate_email, job_title, department_name, application_date, application_id } = applicationData;
            
            return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirmação de Candidatura - ${job_title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; border-top: none; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none; }
                    .success-card { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .info-card { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .steps-card { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                    .btn:hover { background-color: #0056b3; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">
                            ✅ Candidatura Confirmada!
                        </h1>
                        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                            Sua candidatura foi recebida com sucesso
                        </p>
                    </div>
                    
                    <div class="content">
                        <div class="success-card">
                            <h2 style="margin: 0 0 15px 0; color: #155724;">
                                🎉 Parabéns, ${candidate_name}!
                            </h2>
                            <p style="margin: 0; font-size: 16px; color: #155724;">
                                Sua candidatura para a vaga <strong>${job_title}</strong> foi recebida e está sendo analisada pela nossa equipe de recrutamento.
                            </p>
                        </div>
                        
                        <div class="info-card">
                            <h3 style="margin: 0 0 15px 0; color: #1976d2;">
                                📋 Detalhes da Candidatura
                            </h3>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Candidato:</strong> ${candidate_name}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Email:</strong> ${candidate_email}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Vaga:</strong> ${job_title}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Departamento:</strong> ${department_name}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Data da Candidatura:</strong> ${application_date}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>ID da Candidatura:</strong> #${application_id}
                            </p>
                        </div>
                        
                        <div class="steps-card">
                            <h3 style="margin: 0 0 15px 0; color: #856404;">
                                📈 Próximos Passos
                            </h3>
                            <ol style="margin: 0; padding-left: 20px; color: #856404;">
                                <li><strong>Análise do Currículo:</strong> Nossa equipe analisará seu perfil e experiência</li>
                                <li><strong>Contato:</strong> Entraremos em contato em até 5 dias úteis</li>
                                <li><strong>Entrevista:</strong> Se selecionado, agendaremos uma entrevista</li>
                                <li><strong>Feedback:</strong> Você receberá feedback sobre o processo</li>
                            </ol>
                        </div>
                        
                        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #495057;">
                                💡 Dicas Importantes
                            </h4>
                            <ul style="margin: 0; padding-left: 20px; color: #495057;">
                                <li>Mantenha seu email atualizado</li>
                                <li>Verifique sua caixa de spam regularmente</li>
                                <li>Esteja disponível para contato telefônico</li>
                                <li>Prepare-se para possíveis entrevistas</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="mailto:rh@conlinebr.com.br" style="color: white;" class="btn">📧 Contatar RH</a>
                            <a href="https://conlinebr.com.br" style="color: white;" class="btn">🌐 Visitar Site</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0; color: #6c757d; font-size: 14px;">
                            Este email foi gerado automaticamente pelo sistema Sirius System
                        </p>
                        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                            Para dúvidas, entre em contato: rh@conlinebr.com.br
                        </p>
                        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                            Boa sorte no processo seletivo! 🍀
                        </p>
                    </div>
                </div>
            </body>
            </html>
            `;
        }
    },

    // Email de lembrete de entrevista para candidatos
    interviewReminder: {
        generate: async function(interviewData) {
            const { candidate_name, candidate_email, job_title, department_name, interview_date, interview_time, interview_location, minutes_until } = interviewData;
            
            return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lembrete de Entrevista - ${job_title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; border-top: none; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none; }
                    .urgent { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .info-card { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .time-display { font-size: 24px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
                    .checklist { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                    .btn:hover { background-color: #0056b3; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">
                            ⏰ Lembrete de Entrevista
                        </h1>
                        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                            Sua entrevista está prestes a começar!
                        </p>
                    </div>
                    
                    <div class="content">
                        <div class="urgent">
                            <h2 style="margin: 0 0 10px 0; color: #856404; text-align: center;">
                                🚨 ATENÇÃO: Entrevista em ${minutes_until} minutos!
                            </h2>
                            <div class="time-display">
                                ${interview_time}
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <h3 style="margin: 0 0 15px 0; color: #1976d2;">
                                📋 Detalhes da Entrevista
                            </h3>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Candidato:</strong> ${candidate_name}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Vaga:</strong> ${job_title}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Departamento:</strong> ${department_name}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Data:</strong> ${interview_date}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Horário:</strong> ${interview_time}
                            </p>
                            ${interview_location ? `<p style="margin: 5px 0; font-size: 16px;"><strong>Local:</strong> ${interview_location}</p>` : ''}
                        </div>
                        
                        <div class="checklist">
                            <h4 style="margin: 0 0 15px 0; color: #155724;">
                                ✅ Checklist Pré-Entrevista
                            </h4>
                            <ul style="margin: 0; padding-left: 20px; color: #155724;">
                                <li>Chegue com 10 minutos de antecedência</li>
                                <li>Vista-se adequadamente para o cargo</li>
                                <li>Leve cópias do seu currículo</li>
                                <li>Prepare perguntas sobre a empresa e vaga</li>
                                <li>Desligue ou silencie o celular</li>
                                <li>Mantenha uma postura profissional</li>
                            </ul>
                        </div>
                        
                        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #495057;">
                                📞 Contato de Emergência
                            </h4>
                            <p style="margin: 0; color: #495057;">
                                Em caso de atraso ou impossibilidade de comparecer, entre em contato imediatamente:
                            </p>
                            <p style="margin: 5px 0; color:rgb(255, 255, 255);">
                                <strong>Email:</strong> rh@conlinebr.com.br
                            </p>
                            <p style="margin: 5px 0; color: rgb(255, 255, 255);">
                                <strong>Telefone:</strong> (47) 3311-4800
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="mailto:rh@conlinebr.com.br" style="color: white;" class="btn">📧 Contatar RH</a>
                            <a href="https://conlinebr.com.br" style="color: white;" class="btn">🌐 Visitar Site</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0; color: #6c757d; font-size: 14px;">
                            Este lembrete foi gerado automaticamente pelo sistema Sirius System
                        </p>
                        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                            Boa sorte na entrevista! 🍀
                        </p>
                    </div>
                </div>
            </body>
            </html>
            `;
        }
    },

    // Template para email de alerta diário de entrevistas (para RH)
    interviewAlertEmail: {
        generate: async function(interviews, date) {
            const formattedDate = date || new Date().toLocaleDateString('pt-BR');
            
            if (!interviews || interviews.length === 0) {
                return `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Alerta de Entrevistas - ${formattedDate}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                        .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; border-top: none; }
                        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none; }
                        .no-interviews { background: #e3f2fd; border: 1px solid #bbdefb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                        .icon { font-size: 48px; margin-bottom: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 28px;">
                                📅 Alerta de Entrevistas
                            </h1>
                            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                                ${formattedDate}
                            </p>
                        </div>
                        
                        <div class="content">
                            <div class="no-interviews">
                                <div class="icon">✅</div>
                                <h2 style="margin: 0 0 10px 0; color: #1976d2;">
                                    Nenhuma Entrevista Agendada
                                </h2>
                                <p style="margin: 0; color: #1976d2; font-size: 16px;">
                                    Não há entrevistas agendadas para hoje (${formattedDate}).
                                </p>
                            </div>
                            
                            <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h4 style="margin: 0 0 10px 0; color: #495057;">
                                    💡 Informações Importantes
                                </h4>
                                <ul style="margin: 0; padding-left: 20px; color: #495057;">
                                    <li>Este alerta é enviado automaticamente todos os dias às 7:00</li>
                                    <li>Lembretes individuais são enviados 15 minutos antes de cada entrevista</li>
                                    <li>Verifique o sistema para agendar novas entrevistas</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p style="margin: 0; color: #6c757d; font-size: 14px;">
                                Este alerta foi gerado automaticamente pelo sistema Sirius System
                            </p>
                            <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                                Tenha um ótimo dia! 🌟
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                `;
            }

            const interviewsList = interviews.map(interview => `
                <div style="background: #ffffff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0; color: #1976d2; font-size: 18px;">
                            👤 ${interview.candidate_name}
                        </h3>
                        <span style="background: #007bff; color: white; padding: 5px 12px; border-radius: 15px; font-size: 14px; font-weight: bold;">
                            ${interview.interview_time}
                        </span>
                    </div>
                    <div style="color: #666; font-size: 14px;">
                        <p style="margin: 5px 0;"><strong>Vaga:</strong> ${interview.job_title}</p>
                        <p style="margin: 5px 0;"><strong>Departamento:</strong> ${interview.department_name}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${interview.candidate_email}</p>
                        <p style="margin: 5px 0;"><strong>Local:</strong> ${interview.interview_location || 'A definir'}</p>
                    </div>
                </div>
            `).join('');

            return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Alerta de Entrevistas - ${formattedDate}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; border-top: none; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none; }
                    .summary { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .icon { font-size: 24px; margin-right: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">
                            📅 Alerta de Entrevistas
                        </h1>
                        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                            ${formattedDate} - ${interviews.length} entrevista${interviews.length > 1 ? 's' : ''} agendada${interviews.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div class="content">
                        <div class="summary">
                            <h2 style="margin: 0 0 15px 0; color: #856404;">
                                🚨 ATENÇÃO: ${interviews.length} Entrevista${interviews.length > 1 ? 's' : ''} Hoje!
                            </h2>
                            <p style="margin: 0; color: #856404; font-size: 16px;">
                                Prepare-se para as entrevistas agendadas para hoje. Lembretes individuais serão enviados 15 minutos antes de cada entrevista.
                            </p>
                        </div>
                        
                        <h3 style="margin: 30px 0 20px 0; color: #1976d2; border-bottom: 2px solid #e3f2fd; padding-bottom: 10px;">
                            📋 Lista de Entrevistas
                        </h3>
                        
                        ${interviewsList}
                        
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: 0 0 15px 0; color: #155724;">
                                ✅ Checklist Pré-Entrevistas
                            </h4>
                            <ul style="margin: 0; padding-left: 20px; color: #155724;">
                                <li>Confirme se as salas estão preparadas</li>
                                <li>Tenha os currículos dos candidatos em mãos</li>
                                <li>Verifique se o equipamento está funcionando</li>
                                <li>Prepare as perguntas das entrevistas</li>
                                <li>Chegue com antecedência para cada entrevista</li>
                                <li>Mantenha o cronograma organizado</li>
                            </ul>
                        </div>
                        
                        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #495057;">
                                📞 Contato de Emergência
                            </h4>
                            <p style="margin: 0; color: #495057;">
                                Em caso de problemas técnicos ou atrasos, entre em contato com a equipe de TI.
                            </p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0; color: #6c757d; font-size: 14px;">
                            Este alerta foi gerado automaticamente pelo sistema Sirius System
                        </p>
                        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                            Boa sorte nas entrevistas! 🍀
                        </p>
                    </div>
                </div>
            </body>
            </html>
            `;
        }
    },

    // Template para email de lembrete de entrevista (para RH)
    interviewReminderEmail: {
        generate: async function(interview) {
            // Usar o valor calculado pelo MySQL ou recalcular se necessário
            let minutesUntil = parseInt(interview.minutes_until);
            
            // Se o valor não estiver correto, recalcular
            if (isNaN(minutesUntil) || minutesUntil < 0) {
                const now = new Date();
                const interviewTime = new Date(interview.interview_date);
                minutesUntil = Math.max(0, Math.floor((interviewTime - now) / 60000));
            }
            
            return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lembrete de Entrevista - ${interview.candidate_name}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; border-top: none; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none; }
                    .urgent { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .info-card { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .time-display { font-size: 24px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
                    .icon { font-size: 24px; margin-right: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">
                            ⏰ Lembrete de Entrevista
                        </h1>
                        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                            Sua entrevista está prestes a começar!
                        </p>
                    </div>
                    
                    <div class="content">
                        <div class="urgent">
                            <h2 style="margin: 0 0 10px 0; color: #856404; text-align: center;">
                                🚨 ATENÇÃO: Entrevista em ${minutesUntil} minutos!
                            </h2>
                            <div class="time-display">
                                ${interview.interview_time}
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <h3 style="margin: 0 0 15px 0; color: #1976d2;">
                                👤 Informações do Candidato
                            </h3>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Nome:</strong> ${interview.candidate_name}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Email:</strong> ${interview.candidate_email}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Vaga:</strong> ${interview.job_title}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Departamento:</strong> ${interview.department_name}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Data:</strong> ${interview.interview_date_formatted}
                            </p>
                        </div>
                        
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #155724;">
                                ✅ Checklist Pré-Entrevista
                            </h4>
                            <ul style="margin: 0; padding-left: 20px; color: #155724;">
                                <li>Confirme se a sala está preparada</li>
                                <li>Tenha o currículo do candidato em mãos</li>
                                <li>Verifique se o equipamento está funcionando</li>
                                <li>Prepare as perguntas da entrevista</li>
                                <li>Chegue com 5 minutos de antecedência</li>
                            </ul>
                        </div>
                        
                        
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0; color: #6c757d; font-size: 14px;">
                            Este lembrete foi gerado automaticamente pelo sistema Sirius System
                        </p>
                        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                            Boa sorte na entrevista! 🍀
                        </p>
                    </div>
                </div>
            </body>
            </html>
            `;
        }
    },

    // Email de rejeição para candidatos
    rejectionNotification: {
        generate: async function(rejectionData) {
            const { candidate_name, candidate_email, job_title, department_name, rejection_date, company_name = 'Sirius System' } = rejectionData;
            
            return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Atualização sobre sua Candidatura - ${job_title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; border-top: none; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none; }
                    .info-card { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .message-card { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .future-card { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                    .btn:hover { background-color: #0056b3; }
                    .highlight { color: #007bff; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">
                            📧 Atualização sobre sua Candidatura
                        </h1>
                        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                            Informações importantes sobre o processo seletivo
                        </p>
                    </div>
                    
                    <div class="content">
                        <div class="info-card">
                            <h2 style="margin: 0 0 15px 0; color: #1976d2;">
                                Olá, ${candidate_name}!
                            </h2>
                            <p style="margin: 0; font-size: 16px; color: #1976d2;">
                                Agradecemos seu interesse em fazer parte da nossa equipe.
                            </p>
                        </div>
                        
                        <div class="message-card">
                            <h3 style="margin: 0 0 15px 0; color: #495057;">
                                📋 Detalhes da Candidatura
                            </h3>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Candidato:</strong> ${candidate_name}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Email:</strong> ${candidate_email}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Vaga:</strong> ${job_title}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Departamento:</strong> ${department_name}
                            </p>
                            <p style="margin: 5px 0; font-size: 16px;">
                                <strong>Data da Candidatura:</strong> ${rejection_date}
                            </p>
                        </div>
                        
                        <div class="message-card">
                            <h3 style="margin: 0 0 15px 0; color: #495057;">
                                📝 Resposta sobre sua Candidatura
                            </h3>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.8;">
                                Após uma cuidadosa análise do seu perfil e experiência, informamos que, infelizmente, <span class="highlight">não foi possível avançar com sua candidatura</span> para a vaga de <strong>${job_title}</strong> no momento.
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.8;">
                                Esta decisão foi baseada em critérios específicos da vaga e na comparação com outros candidatos que participaram do processo seletivo.
                            </p>
                        </div>
                        
                        <div class="future-card">
                            <h3 style="margin: 0 0 15px 0; color: #155724;">
                                🔮 Futuras Oportunidades
                            </h3>
                            <p style="margin: 0 0 15px 0; font-size: 16px; color: #155724;">
                                <strong>Boa notícia!</strong> Seu currículo foi <span class="highlight">adicionado ao nosso banco de talentos</span> e será considerado para futuras oportunidades que sejam compatíveis com seu perfil.
                            </p>
                            <p style="margin: 0; font-size: 16px; color: #155724;">
                                Continuaremos acompanhando seu desenvolvimento profissional e entraremos em contato caso surjam vagas adequadas ao seu perfil.
                            </p>
                        </div>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #856404;">
                                💡 Dicas para Futuras Candidaturas
                            </h4>
                            <ul style="margin: 0; padding-left: 20px; color: #856404;">
                                <li>Mantenha seu currículo sempre atualizado</li>
                                <li>Destaque suas conquistas e resultados</li>
                                <li>Personalize sua candidatura para cada vaga</li>
                                <li>Prepare-se bem para entrevistas</li>
                                <li>Mantenha-se conectado com nossa empresa</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="mailto:rh@conlinebr.com.br" style="color: white;" class="btn">📧 Contatar RH</a>
                            <a href="https://conlinebr.com.br" style="color: white;" class="btn">🌐 Visitar Site</a>
                        </div>
                        
                        <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #6c757d;">
                                <strong>Não desanime!</strong> Cada candidatura é uma oportunidade de aprendizado e crescimento profissional.
                            </p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0; color: #6c757d; font-size: 14px;">
                            Este email foi gerado automaticamente pelo sistema ${company_name}
                        </p>
                        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                            Para dúvidas, entre em contato: rh@conlinebr.com.br
                        </p>
                        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                            Obrigado por considerar nossa empresa! 🚀
                        </p>
                    </div>
                </div>
            </body>
            </html>
            `;
        }
    }
};

module.exports = {
    hrCandidateTemplates
}; 