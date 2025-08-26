const InterviewEmailManager = require('../services/interview-email-manager');
const { 
  sendInterviewAlertEmail, 
  sendInterviewReminderEmail 
} = require('../controllers/hr-job-openings');

/**
 * Script para processar emails automáticos de entrevistas
 * Pode ser executado independentemente do cron para garantir envio
 */
class InterviewEmailProcessor {
  
  constructor() {
    this.emailManager = new InterviewEmailManager();
  }
  
  /**
   * Processar emails pendentes
   */
  async processPendingEmails() {
    try {
      console.log('📧 Iniciando processamento de emails pendentes...');
      
      const result = await this.emailManager.processPendingEmails();
      
      console.log(`📊 Processamento concluído:`);
      console.log(`   - Processados: ${result.processed}`);
      console.log(`   - Sucessos: ${result.success}`);
      console.log(`   - Falhas: ${result.failed}`);
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao processar emails pendentes:', error);
      throw error;
    }
  }
  
  /**
   * Verificar e registrar alertas diários
   */
  async checkDailyAlerts() {
    try {
      console.log('📅 Verificando alertas diários...');
      
      const result = await sendInterviewAlertEmail();
      
      console.log(`📊 Alerta diário: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
      console.log(`   - Entrevistas: ${result.total}`);
      console.log(`   - Emails enviados: ${result.successful}`);
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao verificar alertas diários:', error);
      throw error;
    }
  }
  
  /**
   * Verificar e registrar lembretes 15min
   */
  async checkReminders() {
    try {
      console.log('⏰ Verificando lembretes 15min...');
      
      const result = await sendInterviewReminderEmail();
      
      console.log(`📊 Lembretes: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
      console.log(`   - Entrevistas próximas: ${result.total}`);
      console.log(`   - Emails enviados: ${result.successful}`);
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao verificar lembretes:', error);
      throw error;
    }
  }
  
  /**
   * Executar limpeza de logs antigos
   */
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      console.log(`🧹 Limpando logs com mais de ${daysToKeep} dias...`);
      
      const removed = await this.emailManager.cleanupOldLogs(daysToKeep);
      
      console.log(`✅ Limpeza concluída: ${removed} registros removidos`);
      
      return removed;
    } catch (error) {
      console.error('❌ Erro ao limpar logs:', error);
      throw error;
    }
  }
  
  /**
   * Mostrar estatísticas
   */
  async showStats() {
    try {
      console.log('📊 Buscando estatísticas...');
      
      const stats = await this.emailManager.getEmailStats();
      
      console.log('📈 Estatísticas dos últimos 7 dias:');
      
      const groupedStats = {};
      stats.forEach(stat => {
        const key = `${stat.email_type}_${stat.date}`;
        if (!groupedStats[key]) {
          groupedStats[key] = {
            type: stat.email_type,
            date: stat.date,
            sent: 0,
            failed: 0,
            pending: 0
          };
        }
        groupedStats[key][stat.status] = stat.count;
      });
      
      Object.values(groupedStats).forEach(group => {
        console.log(`   ${group.date} - ${group.type}:`);
        console.log(`     ✅ Enviados: ${group.sent}`);
        console.log(`     ❌ Falhas: ${group.failed}`);
        console.log(`     ⏳ Pendentes: ${group.pending}`);
      });
      
      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
  
  /**
   * Executar processamento completo
   */
  async runFullProcess() {
    try {
      console.log('🚀 Iniciando processamento completo de emails de entrevistas...');
      console.log('=' .repeat(60));
      
      // 1. Processar emails pendentes
      console.log('\n1️⃣ Processando emails pendentes...');
      await this.processPendingEmails();
      
      // 2. Verificar alertas diários
      console.log('\n2️⃣ Verificando alertas diários...');
      await this.checkDailyAlerts();
      
      // 3. Verificar lembretes 15min
      console.log('\n3️⃣ Verificando lembretes 15min...');
      await this.checkReminders();
      
      // 4. Processar novamente (caso novos emails tenham sido registrados)
      console.log('\n4️⃣ Processando emails pendentes novamente...');
      await this.processPendingEmails();
      
      // 5. Mostrar estatísticas
      console.log('\n5️⃣ Estatísticas finais...');
      await this.showStats();
      
      console.log('\n✅ Processamento completo finalizado!');
      
    } catch (error) {
      console.error('❌ Erro no processamento completo:', error);
      throw error;
    }
  }
}

// Funções para execução via linha de comando
async function runPendingEmails() {
  const processor = new InterviewEmailProcessor();
  await processor.processPendingEmails();
}

async function runDailyAlerts() {
  const processor = new InterviewEmailProcessor();
  await processor.checkDailyAlerts();
}

async function runReminders() {
  const processor = new InterviewEmailProcessor();
  await processor.checkReminders();
}

async function runCleanup() {
  const processor = new InterviewEmailProcessor();
  const days = process.argv[3] || 30;
  await processor.cleanupOldLogs(parseInt(days));
}

async function runStats() {
  const processor = new InterviewEmailProcessor();
  await processor.showStats();
}

async function runFull() {
  const processor = new InterviewEmailProcessor();
  await processor.runFullProcess();
}

// Execução via linha de comando
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'pending':
      runPendingEmails();
      break;
    case 'daily':
      runDailyAlerts();
      break;
    case 'reminders':
      runReminders();
      break;
    case 'cleanup':
      runCleanup();
      break;
    case 'stats':
      runStats();
      break;
    case 'full':
      runFull();
      break;
    default:
      console.log('📧 Processador de Emails de Entrevistas');
      console.log('');
      console.log('Uso: node process-interview-emails.js <comando>');
      console.log('');
      console.log('Comandos disponíveis:');
      console.log('  pending    - Processar emails pendentes');
      console.log('  daily      - Verificar alertas diários');
      console.log('  reminders  - Verificar lembretes 15min');
      console.log('  cleanup    - Limpar logs antigos (opcional: dias)');
      console.log('  stats      - Mostrar estatísticas');
      console.log('  full       - Executar processamento completo');
      console.log('');
      console.log('Exemplos:');
      console.log('  node process-interview-emails.js pending');
      console.log('  node process-interview-emails.js cleanup 15');
      console.log('  node process-interview-emails.js full');
  }
}

module.exports = {
  InterviewEmailProcessor,
  runPendingEmails,
  runDailyAlerts,
  runReminders,
  runCleanup,
  runStats,
  runFull
}; 