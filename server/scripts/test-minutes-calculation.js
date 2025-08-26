/**
 * Script para testar o cálculo de minutos entre horários
 */
const { executeQuery } = require('../connect/mysql');

async function testMinutesCalculation() {
  console.log('🧪 Teste de Cálculo de Minutos');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar horário atual
    const now = new Date();
    const nowLocal = new Date(now.getTime() - (3 * 60 * 60000)); // Subtrair 3 horas
    
    console.log('📅 Horário atual:');
    console.log(`   - UTC: ${now.toISOString()}`);
    console.log(`   - Local: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   - Local (UTC-3): ${nowLocal.toISOString()}`);
    
    // 2. Buscar entrevistas do banco
    const interviews = await executeQuery(`
      SELECT 
        ja.id,
        ja.interview_date,
        ap.name as candidate_name,
        DATE_FORMAT(ja.interview_date, '%H:%i') as interview_time,
        TIMESTAMPDIFF(MINUTE, NOW(), ja.interview_date) as sql_minutes_until
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE s.name LIKE '%entrevista%'
      AND ja.interview_date IS NOT NULL
      ORDER BY ja.interview_date ASC
      LIMIT 5
    `);
    
    console.log(`\n📋 Entrevistas encontradas: ${interviews.length}`);
    
    // 3. Calcular minutos corretamente
    interviews.forEach((interview, index) => {
      const interviewDate = new Date(interview.interview_date);
      const correctMinutesUntil = Math.round((interviewDate.getTime() - nowLocal.getTime()) / (1000 * 60));
      
      console.log(`\n🎯 Entrevista ${index + 1}:`);
      console.log(`   - Candidato: ${interview.candidate_name}`);
      console.log(`   - Horário: ${interview.interview_time}`);
      console.log(`   - Data completa: ${interview.interview_date}`);
      console.log(`   - SQL minutes: ${interview.sql_minutes_until}`);
      console.log(`   - JS minutes: ${correctMinutesUntil}`);
      console.log(`   - Diferença: ${correctMinutesUntil - interview.sql_minutes_until}`);
      
      // Verificar se está correto
      const isCorrect = Math.abs(correctMinutesUntil - interview.sql_minutes_until) <= 1; // Tolerância de 1 minuto
      console.log(`   - Status: ${isCorrect ? '✅ CORRETO' : '❌ INCORRETO'}`);
    });
    
    // 4. Teste específico com horário conhecido
    console.log('\n🧪 Teste específico:');
    const testInterviewTime = '08:45';
    const testInterviewDate = new Date();
    testInterviewDate.setHours(8, 45, 0, 0); // 08:45 hoje
    
    const testMinutesUntil = Math.round((testInterviewDate.getTime() - nowLocal.getTime()) / (1000 * 60));
    console.log(`   - Horário teste: ${testInterviewTime}`);
    console.log(`   - Minutos até: ${testMinutesUntil}`);
    console.log(`   - Status: ${testMinutesUntil >= 0 ? 'FUTURA' : 'PASSADA'}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testMinutesCalculation(); 