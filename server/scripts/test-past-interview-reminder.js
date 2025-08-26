const { executeQuery } = require('../connect/mysql');
const { getUpcomingInterviews } = require('../controllers/hr-job-openings');
const { InterviewEmailProcessor } = require('./process-interview-emails');

/**
 * Script para testar o envio de emails para entrevistas passadas
 */
async function testPastInterviewReminder() {
  try {
    console.log('🧪 Teste de Emails para Entrevistas Passadas');
    console.log('=' .repeat(60));
    
    // 1. Verificar horário atual
    const now = new Date();
    console.log(`📅 Horário atual: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // 2. Buscar entrevistas (incluindo passadas)
    console.log('\n🔍 Buscando entrevistas próximas e passadas...');
    const interviews = await getUpcomingInterviews();
    
    console.log(`📋 Total de entrevistas encontradas: ${interviews.length}`);
    
    interviews.forEach((interview, index) => {
      const minutesUntil = parseInt(interview.minutes_until);
      const status = minutesUntil >= 0 ? 'futura' : 'passada';
      const timeInfo = minutesUntil >= 0 ? `${minutesUntil} min` : `${Math.abs(minutesUntil)} min atrás`;
      
      console.log(`   ${index + 1}. ${interview.candidate_name} - ${interview.interview_time} (${status}: ${timeInfo})`);
    });
    
    if (interviews.length === 0) {
      console.log('\n❌ Nenhuma entrevista encontrada para teste');
      console.log('💡 Dica: Use o script create-test-interview.js para criar uma entrevista de teste');
      return;
    }
    
    // 3. Testar processamento de lembretes
    console.log('\n📧 Testando processamento de lembretes...');
    const processor = new InterviewEmailProcessor();
    
    const result = await processor.checkReminders();
    
    console.log(`📊 Resultado do teste:`);
    console.log(`   - Sucesso: ${result.success}`);
    console.log(`   - Total de entrevistas: ${result.total}`);
    console.log(`   - Emails enviados: ${result.successful}`);
    
    // 4. Verificar logs de email
    console.log('\n📋 Verificando logs de email...');
    const emailLogs = await executeQuery(`
      SELECT 
        email_type,
        subject,
        status,
        created_at,
        sent_at
      FROM hr_interview_email_logs 
      WHERE application_id IN (${interviews.map(i => i.application_id).join(',')})
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📧 Logs de email encontrados: ${emailLogs.length}`);
    emailLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.email_type} - ${log.subject}`);
      console.log(`      Status: ${log.status} | Criado: ${log.created_at} | Enviado: ${log.sent_at || 'N/A'}`);
    });
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

/**
 * Função para criar entrevista passada para teste
 */
async function createPastInterviewForTest() {
  try {
    console.log('🔧 Criando Entrevista Passada para Teste');
    console.log('=' .repeat(50));
    
    // 1. Verificar horário atual
    const now = new Date();
    const pastInterviewTime = new Date(now.getTime() - 30 * 60000); // 30 minutos atrás
    
    console.log(`📅 Horário atual: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`⏰ Entrevista passada: ${pastInterviewTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // 2. Verificar se existe candidato de teste
    let candidateId;
    const existingCandidate = await executeQuery(`
      SELECT id FROM hr_applicants WHERE email = 'teste.passada@conline.com' LIMIT 1
    `);
    
    if (existingCandidate.length === 0) {
      console.log('👤 Criando candidato de teste...');
      const result = await executeQuery(`
        INSERT INTO hr_applicants (name, email, phone) 
        VALUES ('Candidato Teste Passada', 'teste.passada@conline.com', '(47) 99999-8888')
      `);
      candidateId = result.insertId;
      console.log(`✅ Candidato criado com ID: ${candidateId}`);
    } else {
      candidateId = existingCandidate[0].id;
      console.log(`✅ Candidato já existe com ID: ${candidateId}`);
    }
    
    // 3. Buscar status de entrevista
    const statusResult = await executeQuery(`
      SELECT id FROM hr_application_statuses WHERE name LIKE '%entrevista%' LIMIT 1
    `);
    
    if (statusResult.length === 0) {
      console.log('❌ Nenhum status de entrevista encontrado');
      return;
    }
    
    const statusId = statusResult[0].id;
    
    // 4. Buscar primeira vaga disponível
    const jobResult = await executeQuery(`
      SELECT id, title FROM hr_job_postings WHERE is_active = 1 LIMIT 1
    `);
    
    if (jobResult.length === 0) {
      console.log('❌ Nenhuma vaga ativa encontrada');
      return;
    }
    
    const jobId = jobResult[0].id;
    
    // 5. Verificar se já existe aplicação
    const existingApplication = await executeQuery(`
      SELECT id FROM hr_job_applications 
      WHERE applicant_id = ? AND job_id = ?
    `, [candidateId, jobId]);
    
    let applicationId;
    
    if (existingApplication.length === 0) {
      // 6. Criar nova aplicação com entrevista passada
      console.log('📝 Criando aplicação com entrevista passada...');
      const applicationResult = await executeQuery(`
        INSERT INTO hr_job_applications (job_id, applicant_id, status_id, interview_date, applied_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [jobId, candidateId, statusId, pastInterviewTime]);
      
      applicationId = applicationResult.insertId;
      console.log(`✅ Aplicação criada com ID: ${applicationId}`);
    } else {
      // 7. Atualizar aplicação existente
      applicationId = existingApplication[0].id;
      console.log('📝 Atualizando aplicação existente...');
      await executeQuery(`
        UPDATE hr_job_applications 
        SET status_id = ?, interview_date = ?
        WHERE id = ?
      `, [statusId, pastInterviewTime, applicationId]);
      
      console.log(`✅ Aplicação atualizada com ID: ${applicationId}`);
    }
    
    // 8. Verificar se foi criada corretamente
    const verification = await executeQuery(`
      SELECT 
        ja.id,
        ja.interview_date,
        ap.name as candidate_name,
        ap.email as candidate_email,
        j.title as job_title,
        s.name as status,
        DATE_FORMAT(ja.interview_date, '%Y-%m-%d %H:%i:%s') as interview_date_formatted,
        DATE_FORMAT(CONVERT_TZ(ja.interview_date, '+00:00', '-03:00'), '%Y-%m-%d %H:%i:%s') as interview_date_br,
        TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), ja.interview_date) as minutes_until_utc
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_job_postings j ON j.id = ja.job_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE ja.id = ?
    `, [applicationId]);
    
    if (verification.length > 0) {
      const interview = verification[0];
      console.log('\n✅ Entrevista passada criada com sucesso!');
      console.log(`   - ID da aplicação: ${interview.id}`);
      console.log(`   - Candidato: ${interview.candidate_name} (${interview.candidate_email})`);
      console.log(`   - Vaga: ${interview.job_title}`);
      console.log(`   - Status: ${interview.status}`);
      console.log(`   - Data UTC: ${interview.interview_date_formatted}`);
      console.log(`   - Data BR: ${interview.interview_date_br}`);
      console.log(`   - Minutos até: ${interview.minutes_until_utc} (passada)`);
      
      console.log('\n📧 Para testar o envio de email:');
      console.log(`   node server/scripts/test-past-interview-reminder.js`);
      
      console.log('\n🗑️ Para remover a entrevista de teste:');
      console.log(`   DELETE FROM hr_job_applications WHERE id = ${applicationId};`);
    } else {
      console.log('❌ Erro ao verificar entrevista criada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar entrevista passada:', error);
  }
}

/**
 * Função para limpar dados de teste
 */
async function cleanupTestData() {
  try {
    console.log('🗑️ Limpando Dados de Teste');
    console.log('=' .repeat(50));
    
    // Remover aplicações de teste
    const appResult = await executeQuery(`
      DELETE ja FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      WHERE ap.email IN ('teste.passada@conline.com', 'teste.interview@conline.com')
    `);
    
    console.log(`✅ ${appResult.affectedRows} aplicação(ões) removida(s)`);
    
    // Remover candidatos de teste
    const candidateResult = await executeQuery(`
      DELETE FROM hr_applicants 
      WHERE email IN ('teste.passada@conline.com', 'teste.interview@conline.com')
    `);
    
    console.log(`✅ ${candidateResult.affectedRows} candidato(s) removido(s)`);
    
    // Remover logs de email de teste
    const emailResult = await executeQuery(`
      DELETE FROM hr_interview_email_logs 
      WHERE subject LIKE '%Teste%' OR subject LIKE '%Candidato Teste%'
    `);
    
    console.log(`✅ ${emailResult.affectedRows} log(s) de email removido(s)`);
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error);
  }
}

// Execução via linha de comando
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      createPastInterviewForTest();
      break;
    case 'test':
      testPastInterviewReminder();
      break;
    case 'cleanup':
      cleanupTestData();
      break;
    default:
      console.log('🧪 Teste de Emails para Entrevistas Passadas');
      console.log('');
      console.log('Uso: node test-past-interview-reminder.js <comando>');
      console.log('');
      console.log('Comandos disponíveis:');
      console.log('  create   - Criar entrevista passada para teste');
      console.log('  test     - Testar envio de emails para entrevistas passadas');
      console.log('  cleanup  - Limpar dados de teste');
      console.log('');
      console.log('Exemplos:');
      console.log('  node test-past-interview-reminder.js create');
      console.log('  node test-past-interview-reminder.js test');
      console.log('  node test-past-interview-reminder.js cleanup');
  }
}

module.exports = { 
  testPastInterviewReminder, 
  createPastInterviewForTest, 
  cleanupTestData 
}; 