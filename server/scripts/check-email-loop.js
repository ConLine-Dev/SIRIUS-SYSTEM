/**
 * Script para verificar o problema de loop de emails
 */

const { executeQuery } = require('../connect/mysql');

async function checkEmailLoop() {
  console.log('🔍 VERIFICANDO PROBLEMA DE LOOP DE EMAILS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar emails enviados hoje
    console.log('\n📧 1. EMAILS ENVIADOS HOJE:');
    const todayEmails = await executeQuery(`
      SELECT 
        id,
        application_id,
        email_type,
        status,
        DATE_FORMAT(interview_date, '%Y-%m-%d %H:%i') as interview_date,
        DATE_FORMAT(created_at, '%H:%i:%s') as created_time,
        DATE_FORMAT(sent_at, '%H:%i:%s') as sent_time
      FROM hr_interview_email_logs
      WHERE DATE(created_at) = CURDATE()
      AND email_type IN ('reminder_15min', 'reminder_past')
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log(`   Total: ${todayEmails.length} emails`);
    if (todayEmails.length > 0) {
      // Agrupar por application_id
      const byApplication = {};
      todayEmails.forEach(email => {
        if (!byApplication[email.application_id]) {
          byApplication[email.application_id] = [];
        }
        byApplication[email.application_id].push(email);
      });
      
      Object.keys(byApplication).forEach(appId => {
        const emails = byApplication[appId];
        console.log(`\n   Application ID ${appId}: ${emails.length} emails`);
        emails.forEach(email => {
          console.log(`      - ID: ${email.id}, Status: ${email.status}, Criado: ${email.created_time}, Enviado: ${email.sent_time || 'N/A'}`);
        });
      });
    }
    
    // 2. Verificar a query NOT EXISTS
    console.log('\n🔍 2. TESTANDO QUERY NOT EXISTS:');
    const application_id = todayEmails.length > 0 ? todayEmails[0].application_id : null;
    
    if (application_id) {
      // Testar a query que deveria bloquear
      const testQuery = await executeQuery(`
        SELECT 
          ja.id,
          EXISTS (
            SELECT 1 
            FROM hr_interview_email_logs el2 
            WHERE el2.application_id = ja.id 
            AND el2.email_type IN ('reminder_15min', 'reminder_past')
            AND (
              el2.status = 'sent' 
              OR (el2.status = 'pending' AND el2.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR))
            )
          ) as should_block
        FROM hr_job_applications ja
        WHERE ja.id = ?
      `, [application_id]);
      
      if (testQuery.length > 0) {
        console.log(`   Application ${application_id}:`);
        console.log(`   - Deveria bloquear? ${testQuery[0].should_block ? 'SIM' : 'NÃO'}`);
      }
    }
    
    // 3. Verificar problema de timezone na comparação
    console.log('\n⏰ 3. VERIFICANDO TIMEZONE NA COMPARAÇÃO:');
    const timezoneTest = await executeQuery(`
      SELECT 
        ja.id,
        ja.interview_date as interview_date_raw,
        DATE_FORMAT(ja.interview_date, '%Y-%m-%d %H:%i:%s') as interview_date_formatted,
        (
          SELECT COUNT(*) 
          FROM hr_interview_email_logs el
          WHERE el.application_id = ja.id
          AND el.interview_date = ja.interview_date
        ) as exact_match_count,
        (
          SELECT COUNT(*) 
          FROM hr_interview_email_logs el
          WHERE el.application_id = ja.id
          AND DATE(el.interview_date) = DATE(ja.interview_date)
        ) as date_match_count
      FROM hr_job_applications ja
      WHERE ja.interview_date IS NOT NULL
      LIMIT 1
    `);
    
    if (timezoneTest.length > 0) {
      const test = timezoneTest[0];
      console.log(`   Interview Date: ${test.interview_date_formatted}`);
      console.log(`   - Correspondência exata: ${test.exact_match_count} emails`);
      console.log(`   - Correspondência por data: ${test.date_match_count} emails`);
      
      if (test.exact_match_count !== test.date_match_count) {
        console.log('   ⚠️ PROBLEMA: Horários não correspondem exatamente!');
      }
    }
    
    // 4. Solução proposta
    console.log('\n💡 4. SOLUÇÃO PROPOSTA:');
    console.log('   O problema está na comparação de interview_date.');
    console.log('   A query NOT EXISTS precisa usar DATE() em ambos os lados:');
    console.log('   WHERE DATE(el2.interview_date) = DATE(ja.interview_date)');
    
  } catch (error) {
    console.error('\n❌ Erro:', error);
  }
  
  process.exit(0);
}

// Executar verificação
checkEmailLoop(); 