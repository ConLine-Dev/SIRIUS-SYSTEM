const { scheduleInterviewAlert } = require('../scripts/interview-alert-cron');

// Função para inicializar todos os cron jobs
const initializeCronJobs = () => {
  console.log('🕐 Inicializando cron jobs...');
  
  try {
    // Agendar alerta de entrevistas
    scheduleInterviewAlert();
    
    console.log('✅ Todos os cron jobs inicializados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar cron jobs:', error);
  }
};

module.exports = {
  initializeCronJobs
}; 