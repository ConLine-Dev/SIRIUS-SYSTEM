/**
 * Script para debugar por que emails duplicados continuam sendo enviados
 */

const { executeQuery } = require('../connect/mysql');

async function debugDuplicateEmails() {
  console.log('🔍 DEBUGANDO EMAILS DUPLICADOS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Ver emails de hoje agrupados por entrevista
    console.log('\n📧 1. EMAILS POR ENTREVISTA HOJE:');
    const emailsByInterview = await executeQuery(`
      SELECT 
        application_id,
        DATE(interview_date) as interview_date,
        COUNT(*) as total_emails,
        MIN(created_at) as first_email,
        MAX(created_at) as last_email,
        GROUP_CONCAT(
          CONCAT(id, ':', status, ':', TIME(created_at)) 
          ORDER BY created_at 
          SEPARATOR ' | '
        ) as timeline
      FROM hr_interview_email_logs
      WHERE DATE(created_at) = CURDATE()
      AND email_type IN ('reminder_15min', 'reminder_past')
      GROUP BY application_id, DATE(interview_date)
    `);
    
    if (emailsByInterview.length > 0) {
      emailsByInterview.forEach(interview => {
        console.log(`\n   Application ${interview.application_id}:`);
        console.log(`   - Data da entrevista: ${interview.interview_date}`);
        console.log(`   - Total de emails: ${interview.total_emails}`);
        console.log(`   - Primeiro: ${interview.first_email}`);
        console.log(`   - Último: ${interview.last_email}`);
        console.log(`   - Timeline: ${interview.timeline}`);
        
        if (interview.total_emails > 1) {
          console.log(`   ⚠️ PROBLEMA: ${interview.total_emails} emails para mesma entrevista!`);
        }
      });
    } else {
      console.log('   Nenhum email hoje');
    }
    
    // 2. Testar a query NOT EXISTS atual
    console.log('\n🔍 2. TESTANDO QUERY NOT EXISTS:');
    
    if (emailsByInterview.length > 0) {
      const testApp = emailsByInterview[0];
      
      // Simular a query que está sendo usada no getUpcomingInterviews
      const shouldBlock = await executeQuery(`
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
          ) as should_be_blocked,
          (
            SELECT COUNT(*) 
            FROM hr_interview_email_logs el3
            WHERE el3.application_id = ja.id 
            AND DATE(el3.interview_date) = DATE(ja.interview_date)
            AND el3.email_type IN ('reminder_15min', 'reminder_past')
            AND el3.status = 'sent'
          ) as sent_count
        FROM hr_job_applications ja
        WHERE ja.id = ?
      `, [testApp.application_id]);
      
      if (shouldBlock.length > 0) {
        const result = shouldBlock[0];
        console.log(`   Application ${testApp.application_id}:`);
        console.log(`   - Deveria bloquear: ${result.should_be_blocked ? 'SIM' : 'NÃO'}`);
        console.log(`   - Emails 'sent': ${result.sent_count}`);
        
        if (!result.should_be_blocked && result.sent_count > 0) {
          console.log('   ❌ PROBLEMA: Query não está bloqueando mesmo com emails enviados!');
        }
      }
    }
    
    // 3. Verificar query completa de getUpcomingInterviews
    console.log('\n🔍 3. TESTANDO QUERY COMPLETA:');
    
    const now = new Date();
    const nowUTC = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const in15MinutesUTC = new Date(nowUTC.getTime() + 15 * 60000);
    const oneDayAgoUTC = new Date(nowUTC.getTime() - (24 * 60 * 60000));
    
    const upcomingInterviews = await executeQuery(`
      SELECT 
        ja.id as application_id,
        ap.name as candidate_name,
        DATE_FORMAT(ja.interview_date, '%H:%i') as interview_time,
        (
          SELECT COUNT(*) 
          FROM hr_interview_email_logs el 
          WHERE el.application_id = ja.id 
          AND el.email_type IN ('reminder_15min', 'reminder_past')
          AND el.status = 'sent'
          LIMIT 1
        ) as email_sent_count
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_job_postings j ON j.id = ja.job_id
      JOIN hr_departments d ON d.id = j.department_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE (
        (ja.interview_date > ? AND ja.interview_date <= ?)
        OR
        (ja.interview_date <= ? AND ja.interview_date >= ?)
      )
      AND s.name LIKE '%entrevista%'
      AND ja.interview_date IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 
        FROM hr_interview_email_logs el2 
        WHERE el2.application_id = ja.id 
        AND DATE(el2.interview_date) = DATE(ja.interview_date)
        AND el2.email_type IN ('reminder_15min', 'reminder_past')
        AND (
          el2.status = 'sent' 
          OR (el2.status = 'pending' AND el2.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR))
        )
      )
      ORDER BY ja.interview_date ASC
    `, [nowUTC, in15MinutesUTC, nowUTC, oneDayAgoUTC]);
    
    console.log(`   Entrevistas retornadas pela query: ${upcomingInterviews.length}`);
    
    if (upcomingInterviews.length > 0) {
      upcomingInterviews.forEach(interview => {
        console.log(`   - ${interview.candidate_name} (${interview.interview_time}): ${interview.email_sent_count} emails enviados`);
      });
      console.log('\n   ❌ PROBLEMA: Query ainda retorna entrevistas mesmo com emails enviados!');
    } else {
      console.log('   ✅ Query está bloqueando corretamente');
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error);
  }
  
  process.exit(0);
}

// Executar debug
debugDuplicateEmails(); 