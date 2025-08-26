/**
 * Script para testar diretamente a função getUpcomingInterviews
 */
const { getUpcomingInterviews } = require('../controllers/hr-job-openings');

async function testUpcomingInterviews() {
  console.log('🧪 Teste Direto da Função getUpcomingInterviews');
  console.log('=' .repeat(50));
  
  try {
    const interviews = await getUpcomingInterviews();
    
    console.log(`\n📋 Resultado da função:`);
    console.log(`   - Total de entrevistas: ${interviews.length}`);
    
    interviews.forEach((interview, index) => {
      console.log(`\n🎯 Entrevista ${index + 1}:`);
      console.log(`   - Candidato: ${interview.candidate_name}`);
      console.log(`   - Vaga: ${interview.job_title}`);
      console.log(`   - Data: ${interview.interview_date_formatted}`);
      console.log(`   - Horário: ${interview.interview_time}`);
      console.log(`   - Minutos até: ${interview.minutes_until}`);
      console.log(`   - Status: ${interview.interview_status}`);
    });
    
    if (interviews.length === 0) {
      console.log('\n⏰ Nenhuma entrevista encontrada para os critérios atuais');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testUpcomingInterviews(); 