const cron = require('node-cron');
const { sendInterviewAlertEmail, sendInterviewReminderEmail } = require('../controllers/hr-job-openings');

// Configuração do cron job para enviar email diariamente às 7:00
const scheduleInterviewAlert = () => {
  // Executar todos os dias às 7:00 da manhã
  cron.schedule('0 7 * * *', async () => {
    console.log('🕐 Executando agendamento de alerta de entrevistas (7:00)...');
    
    try {
      await sendInterviewAlertEmail();
      console.log('✅ Email de alerta de entrevistas enviado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar email de alerta de entrevistas:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo" // Fuso horário de Brasília
  });
  
  // Executar a cada minuto para verificar entrevistas próximas (15 min antes)
  cron.schedule('* * * * *', async () => {
    try {
      await sendInterviewReminderEmail();
    } catch (error) {
      console.error('❌ Erro ao verificar entrevistas próximas:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  console.log('📅 Agendamento de alerta de entrevistas configurado:');
  console.log('   - 7:00: Email diário com todas as entrevistas do dia');
  console.log('   - A cada minuto: Verificação de entrevistas 15 min antes');
};

// Função para executar manualmente (para testes)
const runInterviewAlert = async () => {
  console.log('🧪 Executando teste manual de alerta de entrevistas...');
  
  try {
    await sendInterviewAlertEmail();
    console.log('✅ Teste manual executado com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste manual:', error);
  }
};

// Função para executar teste de lembrete
const runInterviewReminder = async () => {
  console.log('🧪 Executando teste manual de lembrete de entrevistas...');
  
  try {
    await sendInterviewReminderEmail();
    console.log('✅ Teste manual de lembrete executado com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste manual de lembrete:', error);
  }
};

// Exportar funções
module.exports = {
  scheduleInterviewAlert,
  runInterviewAlert,
  runInterviewReminder
};

// Se executado diretamente, rodar teste manual
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--reminder')) {
    runInterviewReminder();
  } else {
    runInterviewAlert();
  }
} 