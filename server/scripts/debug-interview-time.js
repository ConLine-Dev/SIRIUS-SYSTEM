/**
 * Script para debugar o horário da entrevista no banco
 */
const { executeQuery } = require('../connect/mysql');

async function debugInterviewTime() {
  console.log('🔍 Debug do Horário da Entrevista');
  console.log('=' .repeat(50));
  
  try {
    // Buscar entrevista específica
    const interviews = await executeQuery(`
      SELECT 
        ja.id,
        ja.interview_date,
        ap.name as candidate_name,
        DATE_FORMAT(ja.interview_date, '%H:%i') as interview_time,
        DATE_FORMAT(ja.interview_date, '%Y-%m-%d %H:%i:%s') as formatted_date,
        UNIX_TIMESTAMP(ja.interview_date) as unix_timestamp,
        TIMESTAMPDIFF(MINUTE, NOW(), ja.interview_date) as minutes_until_now,
        TIMESTAMPDIFF(MINUTE, CONVERT_TZ(NOW(), '+00:00', '-03:00'), ja.interview_date) as minutes_until_local
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE s.name LIKE '%entrevista%'
      AND ja.interview_date IS NOT NULL
      ORDER BY ja.interview_date ASC
      LIMIT 3
    `);
    
    console.log(`📋 Entrevistas encontradas: ${interviews.length}`);
    
    interviews.forEach((interview, index) => {
      console.log(`\n🎯 Entrevista ${index + 1}:`);
      console.log(`   - Candidato: ${interview.candidate_name}`);
      console.log(`   - interview_date (raw): ${interview.interview_date}`);
      console.log(`   - formatted_date: ${interview.formatted_date}`);
      console.log(`   - interview_time: ${interview.interview_time}`);
      console.log(`   - unix_timestamp: ${interview.unix_timestamp}`);
      console.log(`   - minutes_until_now: ${interview.minutes_until_now}`);
      console.log(`   - minutes_until_local: ${interview.minutes_until_local}`);
      
      // Converter para Date object
      const interviewDate = new Date(interview.interview_date);
      console.log(`   - Date object: ${interviewDate.toISOString()}`);
      console.log(`   - Date local: ${interviewDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    });
    
    // Verificar horário atual do servidor
    const nowQuery = await executeQuery('SELECT NOW() as server_now, UTC_TIMESTAMP() as utc_now');
    console.log(`\n⏰ Horário do servidor:`);
    console.log(`   - NOW(): ${nowQuery[0].server_now}`);
    console.log(`   - UTC_TIMESTAMP(): ${nowQuery[0].utc_now}`);
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar debug
debugInterviewTime(); 