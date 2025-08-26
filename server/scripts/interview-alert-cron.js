const cron = require('node-cron');
const { InterviewEmailProcessor } = require('./process-interview-emails');

// Configuração do cron job para enviar email diariamente às 7:00
const scheduleInterviewAlert = () => {
  const processor = new InterviewEmailProcessor();
  
  // Executar todos os dias às 7:00 da manhã
  cron.schedule('0 7 * * *', async () => {
    console.log('🕐 Executando agendamento de alerta de entrevistas (7:00)...');
    
    try {
      await processor.checkDailyAlerts();
      console.log('✅ Email de alerta de entrevistas processado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao processar email de alerta de entrevistas:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo" // Fuso horário de Brasília
  });
  
  // Executar a cada 5 minutos para processar emails pendentes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await processor.processPendingEmails();
    } catch (error) {
      console.error('❌ Erro ao processar emails pendentes:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  // Executar a cada minuto para verificar entrevistas próximas (15 min antes)
  // IMPORTANTE: Agora com proteção contra duplicatas na tabela hr_interview_email_logs!
  cron.schedule('* * * * *', async () => {
    try {
      console.log('⏰ Verificando lembretes 15min...');
      await processor.checkReminders();
    } catch (error) {
      console.error('❌ Erro ao verificar entrevistas próximas:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  // Limpeza semanal de logs antigos (domingo às 2:00)
  cron.schedule('0 2 * * 0', async () => {
    try {
      await processor.cleanupOldLogs(30);
    } catch (error) {
      console.error('❌ Erro ao limpar logs antigos:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  console.log('📅 Agendamento de alerta de entrevistas configurado:');
  console.log('   - 7:00: Email diário com todas as entrevistas do dia');
  console.log('   - A cada 5 min: Processamento de emails pendentes');
  console.log('   - A cada minuto: Verificação de lembretes (15 min antes)');
  console.log('   - Domingo 2:00: Limpeza de logs antigos');
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