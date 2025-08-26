const { executeQuery } = require('../connect/mysql');
const { getUpcomingInterviews, getTodaysInterviews } = require('../controllers/hr-job-openings');

/**
 * Script para testar a correção do fuso horário
 */
async function testTimezoneFix() {
  try {
    console.log('🧪 Teste de Correção de Fuso Horário');
    console.log('=' .repeat(60));
    
    // 1. Verificar horário atual
    const now = new Date();
    const nowLocal = new Date(now.getTime() - (3 * 60 * 60000)); // Subtrair 3 horas para horário local
    console.log(`📅 Horário atual:`);
    console.log(`   - Data/Hora: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   - ISO: ${now.toISOString()}`);
    console.log(`   - Local (UTC-3): ${nowLocal.toISOString()}`);
    console.log(`   - Timezone Offset: ${now.getTimezoneOffset()} minutos`);
    
    // 2. Testar função getUpcomingInterviews
    console.log('\n🔍 Testando getUpcomingInterviews...');
    const upcomingInterviews = await getUpcomingInterviews();
    
    console.log(`📋 Entrevistas encontradas: ${upcomingInterviews.length}`);
    upcomingInterviews.forEach((interview, index) => {
      const minutesUntil = parseInt(interview.minutes_until);
      const status = interview.interview_status;
      const timeInfo = minutesUntil >= 0 ? `${minutesUntil} min` : `${Math.abs(minutesUntil)} min atrás`;
      
      console.log(`   ${index + 1}. ${interview.candidate_name} - ${interview.interview_time}`);
      console.log(`      Status: ${status} | Tempo: ${timeInfo} | Minutos: ${minutesUntil}`);
    });
    
    // 3. Testar função getTodaysInterviews
    console.log('\n📅 Testando getTodaysInterviews...');
    const todaysInterviews = await getTodaysInterviews();
    
    console.log(`📋 Entrevistas do dia: ${todaysInterviews.length}`);
    todaysInterviews.forEach((interview, index) => {
      console.log(`   ${index + 1}. ${interview.candidate_name} - ${interview.interview_time} (${interview.job_title})`);
    });
    
    // 4. Verificar dados no banco diretamente
    console.log('\n🗄️ Verificando dados no banco...');
    const allInterviews = await executeQuery(`
      SELECT 
        ja.id,
        ap.name as candidate_name,
        ja.interview_date,
        DATE_FORMAT(ja.interview_date, '%Y-%m-%d %H:%i:%s') as interview_date_formatted,
        TIMESTAMPDIFF(MINUTE, NOW(), ja.interview_date) as minutes_until_now,
        CASE 
          WHEN ja.interview_date > NOW() THEN 'future'
          ELSE 'past'
        END as status
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE ja.interview_date IS NOT NULL
        AND s.name LIKE '%entrevista%'
        AND ja.interview_date >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
        AND ja.interview_date <= DATE_ADD(NOW(), INTERVAL 1 HOUR)
      ORDER BY ja.interview_date ASC
      LIMIT 10
    `);
    
    console.log(`📊 Entrevistas próximas no banco: ${allInterviews.length}`);
    allInterviews.forEach((interview, index) => {
      console.log(`   ${index + 1}. ${interview.candidate_name}`);
      console.log(`      Data: ${interview.interview_date_formatted}`);
      console.log(`      Minutos até: ${interview.minutes_until_now}`);
      console.log(`      Status: ${interview.status}`);
      console.log('');
    });
    
    // 5. Teste de criação de entrevista para agora + 10 min
    console.log('\n🔧 Teste de criação de entrevista...');
    const testInterviewTime = new Date();
    testInterviewTime.setMinutes(testInterviewTime.getMinutes() + 10); // 10 min no futuro
    
    console.log(`⏰ Criando entrevista para: ${testInterviewTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Verificar se existe candidato de teste
    const testCandidate = await executeQuery(`
      SELECT id FROM hr_applicants WHERE email = 'teste.timezone@conline.com' LIMIT 1
    `);
    
    if (testCandidate.length === 0) {
      console.log('👤 Criando candidato de teste...');
      await executeQuery(`
        INSERT INTO hr_applicants (name, email, phone) 
        VALUES ('Candidato Teste Timezone', 'teste.timezone@conline.com', '(47) 99999-7777')
      `);
    }
    
    const candidateId = await executeQuery(`
      SELECT id FROM hr_applicants WHERE email = 'teste.timezone@conline.com' LIMIT 1
    `);
    
    const statusId = await executeQuery(`
      SELECT id FROM hr_application_statuses WHERE name LIKE '%entrevista%' LIMIT 1
    `);
    
    const jobId = await executeQuery(`
      SELECT id FROM hr_job_postings WHERE is_active = 1 LIMIT 1
    `);
    
    if (candidateId.length > 0 && statusId.length > 0 && jobId.length > 0) {
      // Verificar se já existe aplicação
      const existingApp = await executeQuery(`
        SELECT id FROM hr_job_applications 
        WHERE applicant_id = ? AND job_id = ?
      `, [candidateId[0].id, jobId[0].id]);
      
      if (existingApp.length === 0) {
        // Criar nova aplicação
        await executeQuery(`
          INSERT INTO hr_job_applications (job_id, applicant_id, status_id, interview_date, applied_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [jobId[0].id, candidateId[0].id, statusId[0].id, testInterviewTime]);
        
        console.log('✅ Entrevista de teste criada');
      } else {
        // Atualizar aplicação existente
        await executeQuery(`
          UPDATE hr_job_applications 
          SET interview_date = ?
          WHERE id = ?
        `, [testInterviewTime, existingApp[0].id]);
        
        console.log('✅ Entrevista de teste atualizada');
      }
      
      // Testar novamente a busca
      console.log('\n🔄 Testando busca após criação...');
      const newUpcoming = await getUpcomingInterviews();
      
      console.log(`📋 Entrevistas encontradas após criação: ${newUpcoming.length}`);
      newUpcoming.forEach((interview, index) => {
        const minutesUntil = parseInt(interview.minutes_until);
        console.log(`   ${index + 1}. ${interview.candidate_name} - ${interview.interview_time} (${minutesUntil} min)`);
      });
      
      // Limpar entrevista de teste
      await executeQuery(`
        DELETE FROM hr_job_applications 
        WHERE applicant_id = ? AND interview_date = ?
      `, [candidateId[0].id, testInterviewTime]);
      
      console.log('✅ Entrevista de teste removida');
    }
    
    console.log('\n✅ Teste de fuso horário concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testTimezoneFix();
}

module.exports = { testTimezoneFix }; 