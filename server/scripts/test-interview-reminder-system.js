/**
 * Script completo para testar o sistema de lembretes de entrevista
 * Testa:
 * 1. Busca de entrevistas
 * 2. Verificação de emails já enviados
 * 3. Registro e envio de lembretes
 */

const { executeQuery } = require('../connect/mysql');
const { getUpcomingInterviews } = require('../controllers/hr-job-openings');
const InterviewEmailManager = require('../services/interview-email-manager');

async function testInterviewReminderSystem() {
  console.log('🧪 TESTE COMPLETO DO SISTEMA DE LEMBRETES DE ENTREVISTA');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar horário atual
    console.log('\n📅 1. HORÁRIO ATUAL:');
    const now = new Date();
    console.log(`   - Local: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   - UTC: ${now.toISOString()}`);
    
    // 2. Verificar horário do servidor MySQL
    console.log('\n🗄️ 2. HORÁRIO DO SERVIDOR MySQL:');
    const serverTime = await executeQuery('SELECT NOW() as server_now, UTC_TIMESTAMP() as utc_now');
    console.log(`   - NOW(): ${serverTime[0].server_now}`);
    console.log(`   - UTC_TIMESTAMP(): ${serverTime[0].utc_now}`);
    
    // 3. Buscar todas as entrevistas com status
    console.log('\n📋 3. TODAS AS ENTREVISTAS NO SISTEMA:');
    const allInterviews = await executeQuery(`
      SELECT 
        ja.id as application_id,
        ap.name as candidate_name,
        DATE_FORMAT(ja.interview_date, '%d/%m/%Y %H:%i') as interview_datetime,
        TIMESTAMPDIFF(MINUTE, NOW(), ja.interview_date) as minutes_until,
        s.name as status_name,
        (
          SELECT COUNT(*) 
          FROM hr_interview_email_logs el 
          WHERE el.application_id = ja.id 
          AND el.email_type IN ('reminder_15min', 'reminder_past')
          AND el.status = 'sent'
        ) as email_sent_count,
        (
          SELECT GROUP_CONCAT(
            CONCAT(el.email_type, ':', el.status, ' (', DATE_FORMAT(el.sent_at, '%H:%i'), ')')
            SEPARATOR ', '
          )
          FROM hr_interview_email_logs el 
          WHERE el.application_id = ja.id
        ) as email_history
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE ja.interview_date IS NOT NULL
      ORDER BY ja.interview_date ASC
      LIMIT 10
    `);
    
    if (allInterviews.length === 0) {
      console.log('   ❌ Nenhuma entrevista encontrada no sistema');
    } else {
      allInterviews.forEach((interview, index) => {
        console.log(`\n   ${index + 1}. ${interview.candidate_name}`);
        console.log(`      - Data/Hora: ${interview.interview_datetime}`);
        console.log(`      - Minutos até: ${interview.minutes_until}`);
        console.log(`      - Status: ${interview.status_name}`);
        console.log(`      - Emails enviados: ${interview.email_sent_count > 0 ? '✅ SIM' : '❌ NÃO'}`);
        if (interview.email_history) {
          console.log(`      - Histórico: ${interview.email_history}`);
        }
      });
    }
    
    // 4. Buscar entrevistas elegíveis para lembrete
    console.log('\n🔍 4. ENTREVISTAS ELEGÍVEIS PARA LEMBRETE:');
    const upcomingInterviews = await getUpcomingInterviews();
    
    if (upcomingInterviews.length === 0) {
      console.log('   ❌ Nenhuma entrevista elegível para lembrete');
    } else {
      upcomingInterviews.forEach((interview, index) => {
        console.log(`\n   ${index + 1}. ${interview.candidate_name}`);
        console.log(`      - Horário: ${interview.interview_time}`);
        console.log(`      - Minutos até: ${interview.minutes_until}`);
        console.log(`      - Status: ${interview.interview_status}`);
      });
    }
    
    // 5. Verificar configurações de email
    console.log('\n⚙️ 5. CONFIGURAÇÕES DE EMAIL:');
    const configs = await executeQuery(`
      SELECT config_key, config_value, is_active
      FROM hr_interview_email_config
      WHERE config_key IN ('reminder_15min_enabled', 'candidate_reminder_enabled', 'recipient_emails')
    `);
    
    configs.forEach(config => {
      console.log(`   - ${config.config_key}: ${config.config_value} (${config.is_active ? 'ATIVO' : 'INATIVO'})`);
    });
    
    // 6. Simular registro de lembretes
    if (upcomingInterviews.length > 0) {
      console.log('\n📧 6. SIMULAÇÃO DE REGISTRO DE LEMBRETES:');
      const emailManager = new InterviewEmailManager();
      
      // Apenas simular, não registrar de verdade
      console.log('   Entrevistas que receberiam lembrete:');
      upcomingInterviews.forEach(interview => {
        const minutesUntil = parseInt(interview.minutes_until);
        const emailType = minutesUntil >= 0 ? 'reminder_15min' : 'reminder_past';
        console.log(`   - ${interview.candidate_name}: Tipo ${emailType}`);
      });
    }
    
    // 7. Verificar emails pendentes
    console.log('\n📬 7. EMAILS PENDENTES NO SISTEMA:');
    const pendingEmails = await executeQuery(`
      SELECT 
        email_type,
        COUNT(*) as count,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM hr_interview_email_logs
      WHERE status = 'pending'
      GROUP BY email_type
    `);
    
    if (pendingEmails.length === 0) {
      console.log('   ✅ Nenhum email pendente');
    } else {
      pendingEmails.forEach(type => {
        console.log(`   - ${type.email_type}: ${type.count} emails`);
        console.log(`     Mais antigo: ${type.oldest}`);
        console.log(`     Mais recente: ${type.newest}`);
      });
    }
    
    // 8. Resumo final
    console.log('\n📊 8. RESUMO DO SISTEMA:');
    const summary = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM hr_job_applications WHERE interview_date IS NOT NULL) as total_interviews,
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'sent') as total_sent,
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'pending') as total_pending,
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'failed') as total_failed
    `);
    
    console.log(`   - Total de entrevistas: ${summary[0].total_interviews}`);
    console.log(`   - Emails enviados: ${summary[0].total_sent}`);
    console.log(`   - Emails pendentes: ${summary[0].total_pending}`);
    console.log(`   - Emails falhados: ${summary[0].total_failed}`);
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
  }
  
  process.exit(0);
}

// Executar teste
testInterviewReminderSystem(); 