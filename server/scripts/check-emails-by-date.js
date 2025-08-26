const { executeQuery } = require('../connect/mysql');

async function checkEmailsByDate() {
  try {
    // Emails por data
    const emailsByDate = await executeQuery(`
      SELECT 
        DATE(created_at) as data,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as enviados
      FROM hr_interview_email_logs 
      WHERE email_type IN ('reminder_15min', 'reminder_past')
      GROUP BY DATE(created_at) 
      ORDER BY data DESC 
      LIMIT 5
    `);

    console.log('📅 EMAILS POR DATA:');
    emailsByDate.forEach(row => {
      console.log(`${row.data}: ${row.total} emails (${row.enviados} enviados)`);
    });

    // Emails de hoje
    const todayEmails = await executeQuery(`
      SELECT 
        id, application_id, status, 
        TIME(created_at) as hora_criacao,
        TIME(sent_at) as hora_envio
      FROM hr_interview_email_logs 
      WHERE DATE(created_at) = CURDATE()
      AND email_type IN ('reminder_15min', 'reminder_past')
      ORDER BY created_at DESC
    `);

    console.log('\n📧 EMAILS DE HOJE:');
    if (todayEmails.length > 0) {
      todayEmails.forEach(email => {
        console.log(`ID: ${email.id}, App: ${email.application_id}, Status: ${email.status}, Criado: ${email.hora_criacao}, Enviado: ${email.hora_envio || 'N/A'}`);
      });
    } else {
      console.log('Nenhum email hoje');
    }

    // Verificar a entrevista específica
    const interviewCheck = await executeQuery(`
      SELECT 
        ja.id,
        ja.interview_date,
        (SELECT COUNT(*) FROM hr_interview_email_logs el 
         WHERE el.application_id = ja.id 
         AND el.email_type IN ('reminder_15min', 'reminder_past')
         AND el.status = 'sent') as total_sent,
        (SELECT COUNT(*) FROM hr_interview_email_logs el 
         WHERE el.application_id = ja.id 
         AND DATE(el.interview_date) = DATE(ja.interview_date)
         AND el.email_type IN ('reminder_15min', 'reminder_past')
         AND el.status = 'sent') as sent_same_date
      FROM hr_job_applications ja
      WHERE ja.interview_date IS NOT NULL
      LIMIT 1
    `);

    console.log('\n🎯 VERIFICAÇÃO DA ENTREVISTA:');
    if (interviewCheck.length > 0) {
      const check = interviewCheck[0];
      console.log(`Application ID: ${check.id}`);
      console.log(`Interview Date: ${check.interview_date}`);
      console.log(`Total emails enviados: ${check.total_sent}`);
      console.log(`Emails enviados mesma data: ${check.sent_same_date}`);
    }

  } catch (error) {
    console.error('Erro:', error);
  }
  process.exit(0);
}

checkEmailsByDate(); 