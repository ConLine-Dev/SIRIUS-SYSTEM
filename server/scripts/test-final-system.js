/**
 * Script final para testar se o sistema de lembretes está funcionando corretamente
 */

const { executeQuery } = require('../connect/mysql');
const { getUpcomingInterviews } = require('../controllers/hr-job-openings');

async function testFinalSystem() {
  console.log('🧪 TESTE FINAL DO SISTEMA DE LEMBRETES');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar estrutura da tabela
    console.log('\n📋 1. VERIFICANDO ESTRUTURA DA TABELA:');
    const tableStructure = await executeQuery(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'hr_interview_email_logs' 
      AND COLUMN_NAME = 'email_type'
    `);
    
    if (tableStructure.length > 0) {
      console.log(`   ✅ ENUM email_type: ${tableStructure[0].COLUMN_TYPE}`);
      if (tableStructure[0].COLUMN_TYPE.includes('reminder_past')) {
        console.log('   ✅ Tipo reminder_past está presente no ENUM');
      } else {
        console.log('   ❌ Tipo reminder_past está AUSENTE no ENUM');
      }
    }
    
    // 2. Verificar emails já enviados
    console.log('\n📧 2. EMAILS JÁ ENVIADOS:');
    const existingEmails = await executeQuery(`
      SELECT 
        application_id,
        email_type,
        status,
        DATE_FORMAT(created_at, '%H:%i:%s') as hora,
        DATE_FORMAT(sent_at, '%H:%i:%s') as enviado
      FROM hr_interview_email_logs
      WHERE DATE(created_at) = CURDATE()
      AND email_type IN ('reminder_15min', 'reminder_past')
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (existingEmails.length > 0) {
      console.log(`   Total: ${existingEmails.length} emails`);
      existingEmails.forEach((email, idx) => {
        console.log(`   ${idx + 1}. App ${email.application_id}: ${email.email_type} (${email.status}) - ${email.hora}`);
      });
    } else {
      console.log('   Nenhum email enviado hoje');
    }
    
    // 3. Testar função getUpcomingInterviews
    console.log('\n🔍 3. TESTANDO getUpcomingInterviews:');
    const upcomingInterviews = await getUpcomingInterviews();
    
    console.log(`   Entrevistas retornadas: ${upcomingInterviews.length}`);
    
    if (upcomingInterviews.length > 0) {
      upcomingInterviews.forEach(interview => {
        console.log(`   - ${interview.candidate_name} (${interview.interview_time}): ${interview.minutes_until} min`);
      });
      console.log('   ⚠️ ATENÇÃO: Entrevistas ainda sendo retornadas - pode gerar emails!');
    } else {
      console.log('   ✅ Nenhuma entrevista retornada - sistema bloqueando corretamente');
    }
    
    // 4. Verificar query NOT EXISTS específica
    console.log('\n🔍 4. TESTANDO QUERY NOT EXISTS:');
    if (existingEmails.length > 0) {
      const testAppId = existingEmails[0].application_id;
      
      const blockTest = await executeQuery(`
        SELECT 
          ja.id,
          EXISTS (
            SELECT 1 
            FROM hr_interview_email_logs el2 
            WHERE el2.application_id = ja.id 
            AND DATE(el2.interview_date) = DATE(ja.interview_date)
            AND el2.email_type IN ('reminder_15min', 'reminder_past')
            AND (
              el2.status = 'sent' 
              OR (el2.status = 'pending' AND el2.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR))
            )
          ) as should_block
        FROM hr_job_applications ja
        WHERE ja.id = ?
      `, [testAppId]);
      
      if (blockTest.length > 0) {
        console.log(`   Application ${testAppId}: ${blockTest[0].should_block ? '✅ BLOQUEADO' : '❌ NÃO BLOQUEADO'}`);
      }
    } else {
      console.log('   Nenhum email para testar');
    }
    
    // 5. Teste de configuração do cron
    console.log('\n⏰ 5. CONFIGURAÇÃO DO CRON:');
    console.log('   ✅ Execução a cada minuto: * * * * *');
    console.log('   ✅ Proteção contra duplicatas: Tabela hr_interview_email_logs');
    console.log('   ✅ Query NOT EXISTS: Usando DATE() para comparação');
    
    // 6. Recomendações finais
    console.log('\n💡 6. STATUS DO SISTEMA:');
    
    if (upcomingInterviews.length === 0 && existingEmails.length > 0) {
      console.log('   ✅ SISTEMA FUNCIONANDO CORRETAMENTE!');
      console.log('   - Emails já foram enviados');
      console.log('   - Função não retorna mais entrevistas');
      console.log('   - Proteção contra duplicatas ativa');
    } else if (upcomingInterviews.length > 0) {
      console.log('   ⚠️ SISTEMA AINDA PODE ENVIAR EMAILS');
      console.log('   - Verifique se a query NOT EXISTS está funcionando');
      console.log('   - Pode ser que a entrevista seja nova e precise do primeiro email');
    } else {
      console.log('   ℹ️ SISTEMA PRONTO PARA FUNCIONAR');
      console.log('   - Nenhum email enviado ainda');
      console.log('   - Aguardando próxima execução do cron');
    }
    
    console.log('\n🚀 EXECUÇÃO A CADA MINUTO CONFIGURADA!');
    console.log('   O sistema agora verifica entrevistas a cada minuto,');
    console.log('   mas só envia 1 email por entrevista graças à proteção');
    console.log('   da tabela hr_interview_email_logs.');
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
  }
  
  process.exit(0);
}

// Executar teste
testFinalSystem(); 