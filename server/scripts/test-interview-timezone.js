const { executeQuery } = require('../connect/mysql');
const { getUpcomingInterviews, getTodaysInterviews } = require('../controllers/hr-job-openings');

/**
 * Script para testar o funcionamento do fuso horário nas entrevistas
 */
async function testInterviewTimezone() {
  try {
    console.log('🧪 Teste de Fuso Horário - Entrevistas');
    console.log('=' .repeat(60));
    
    // 1. Verificar horário atual
    const now = new Date();
    const nowUTC = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    
    console.log('\n📅 Informações de Horário:');
    console.log(`   - Agora (local): ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   - Agora (UTC): ${nowUTC.toISOString()}`);
    console.log(`   - Offset local: ${now.getTimezoneOffset()} minutos`);
    
    // 2. Verificar entrevistas do dia
    console.log('\n📋 Entrevistas do Dia:');
    const todaysInterviews = await getTodaysInterviews();
    console.log(`   - Total encontradas: ${todaysInterviews.length}`);
    
    todaysInterviews.forEach((interview, index) => {
      console.log(`   ${index + 1}. ${interview.candidate_name} - ${interview.interview_time} (${interview.job_title})`);
    });
    
    // 3. Verificar entrevistas próximas (15 min)
    console.log('\n⏰ Entrevistas Próximas (15 min):');
    const upcomingInterviews = await getUpcomingInterviews();
    console.log(`   - Total encontradas: ${upcomingInterviews.length}`);
    
    upcomingInterviews.forEach((interview, index) => {
      console.log(`   ${index + 1}. ${interview.candidate_name} - ${interview.interview_time} (${interview.minutes_until} min)`);
    });
    
    // 4. Verificar dados no banco
    console.log('\n🗄️ Dados no Banco:');
    const allInterviews = await executeQuery(`
      SELECT 
        ja.id,
        ap.name as candidate_name,
        ja.interview_date,
        DATE_FORMAT(ja.interview_date, '%Y-%m-%d %H:%i:%s') as interview_date_formatted,
        DATE_FORMAT(CONVERT_TZ(ja.interview_date, '+00:00', '-03:00'), '%Y-%m-%d %H:%i:%s') as interview_date_br,
        TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), ja.interview_date) as minutes_until_utc,
        TIMESTAMPDIFF(MINUTE, NOW(), ja.interview_date) as minutes_until_local,
        s.name as status
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE ja.interview_date IS NOT NULL
        AND ja.interview_date > UTC_TIMESTAMP()
        AND s.name LIKE '%entrevista%'
      ORDER BY ja.interview_date ASC
      LIMIT 10
    `);
    
    console.log(`   - Próximas 10 entrevistas:`);
    allInterviews.forEach((interview, index) => {
      console.log(`   ${index + 1}. ${interview.candidate_name}`);
      console.log(`      - Data UTC: ${interview.interview_date_formatted}`);
      console.log(`      - Data BR: ${interview.interview_date_br}`);
      console.log(`      - Min até UTC: ${interview.minutes_until_utc}`);
      console.log(`      - Min até Local: ${interview.minutes_until_local}`);
      console.log(`      - Status: ${interview.status}`);
      console.log('');
    });
    
    // 5. Teste de inserção de entrevista de teste
    console.log('\n🔧 Teste de Inserção:');
    const testInterviewTime = new Date();
    testInterviewTime.setMinutes(testInterviewTime.getMinutes() + 10); // 10 min no futuro
    
    console.log(`   - Inserindo entrevista de teste para: ${testInterviewTime.toISOString()}`);
    
    // Verificar se existe um candidato de teste
    const testCandidate = await executeQuery(`
      SELECT id FROM hr_applicants WHERE email = 'test@example.com' LIMIT 1
    `);
    
    if (testCandidate.length === 0) {
      console.log('   - Criando candidato de teste...');
      await executeQuery(`
        INSERT INTO hr_applicants (name, email) VALUES ('Candidato Teste', 'test@example.com')
      `);
    }
    
    const candidateId = await executeQuery(`
      SELECT id FROM hr_applicants WHERE email = 'test@example.com' LIMIT 1
    `);
    
    const statusId = await executeQuery(`
      SELECT id FROM hr_application_statuses WHERE name LIKE '%entrevista%' LIMIT 1
    `);
    
    const jobId = await executeQuery(`
      SELECT id FROM hr_job_postings LIMIT 1
    `);
    
    if (candidateId.length > 0 && statusId.length > 0 && jobId.length > 0) {
      // Inserir entrevista de teste
      await executeQuery(`
        INSERT INTO hr_job_applications (job_id, applicant_id, status_id, interview_date, applied_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [jobId[0].id, candidateId[0].id, statusId[0].id, testInterviewTime]);
      
      console.log('   ✅ Entrevista de teste inserida');
      
      // Verificar se aparece nas próximas
      const newUpcoming = await getUpcomingInterviews();
      console.log(`   - Após inserção: ${newUpcoming.length} entrevistas próximas`);
      
      // Limpar entrevista de teste
      await executeQuery(`
        DELETE FROM hr_job_applications 
        WHERE applicant_id = ? AND interview_date = ?
      `, [candidateId[0].id, testInterviewTime]);
      
      console.log('   ✅ Entrevista de teste removida');
    }
    
    console.log('\n✅ Teste de fuso horário concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste de fuso horário:', error);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testInterviewTimezone();
}

module.exports = { testInterviewTimezone }; 