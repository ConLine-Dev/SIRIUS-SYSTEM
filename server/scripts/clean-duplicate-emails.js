/**
 * Script para limpar emails duplicados e verificar estado do sistema
 */

const { executeQuery } = require('../connect/mysql');

async function cleanDuplicateEmails() {
  console.log('🧹 LIMPEZA DE EMAILS DUPLICADOS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar duplicatas atuais
    console.log('\n📊 1. VERIFICANDO DUPLICATAS ATUAIS:');
    const duplicates = await executeQuery(`
      SELECT 
        application_id,
        email_type,
        DATE(interview_date) as interview_date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        MIN(created_at) as first_created,
        MAX(created_at) as last_created,
        GROUP_CONCAT(id ORDER BY created_at) as ids
      FROM hr_interview_email_logs
      WHERE email_type IN ('reminder_15min', 'reminder_past')
      GROUP BY application_id, email_type, DATE(interview_date)
      HAVING total > 1
      ORDER BY last_created DESC
    `);
    
    if (duplicates.length > 0) {
      console.log(`   ❌ ${duplicates.length} grupo(s) de duplicatas encontrado(s):`);
      
      for (const dup of duplicates) {
        console.log(`\n   Application ID: ${dup.application_id}`);
        console.log(`   - Data da entrevista: ${dup.interview_date}`);
        console.log(`   - Total de emails: ${dup.total}`);
        console.log(`   - Enviados: ${dup.sent_count}, Pendentes: ${dup.pending_count}`);
        console.log(`   - Primeiro: ${dup.first_created}`);
        console.log(`   - Último: ${dup.last_created}`);
        console.log(`   - IDs: ${dup.ids}`);
      }
      
      // 2. Limpar duplicatas
      console.log('\n🗑️ 2. LIMPANDO DUPLICATAS:');
      
      // Manter apenas o email mais recente com status 'sent' ou o mais recente se nenhum foi enviado
      const cleanupResult = await executeQuery(`
        DELETE e1 FROM hr_interview_email_logs e1
        INNER JOIN (
          SELECT 
            application_id,
            email_type,
            interview_date,
            MAX(CASE WHEN status = 'sent' THEN id ELSE 0 END) as max_sent_id,
            MAX(id) as max_id
          FROM hr_interview_email_logs
          WHERE email_type IN ('reminder_15min', 'reminder_past')
          GROUP BY application_id, email_type, interview_date
          HAVING COUNT(*) > 1
        ) e2 ON e1.application_id = e2.application_id 
            AND e1.email_type = e2.email_type 
            AND e1.interview_date = e2.interview_date
        WHERE e1.id != IF(e2.max_sent_id > 0, e2.max_sent_id, e2.max_id)
      `);
      
      console.log(`   ✅ ${cleanupResult.affectedRows} registro(s) duplicado(s) removido(s)`);
      
    } else {
      console.log('   ✅ Nenhuma duplicata encontrada');
    }
    
    // 3. Verificar emails de hoje
    console.log('\n📧 3. EMAILS DE HOJE:');
    const todayEmails = await executeQuery(`
      SELECT 
        el.id,
        el.email_type,
        el.status,
        el.created_at,
        el.sent_at,
        ap.name as candidate_name,
        DATE_FORMAT(ja.interview_date, '%H:%i') as interview_time
      FROM hr_interview_email_logs el
      JOIN hr_job_applications ja ON ja.id = el.application_id
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      WHERE DATE(el.created_at) = CURDATE()
      AND el.email_type IN ('reminder_15min', 'reminder_past')
      ORDER BY el.created_at DESC
    `);
    
    if (todayEmails.length > 0) {
      console.log(`   Total: ${todayEmails.length} email(s)`);
      todayEmails.forEach((email, idx) => {
        console.log(`\n   ${idx + 1}. ${email.candidate_name} - ${email.interview_time}`);
        console.log(`      ID: ${email.id}`);
        console.log(`      Tipo: ${email.email_type}`);
        console.log(`      Status: ${email.status}`);
        console.log(`      Criado: ${email.created_at}`);
        if (email.sent_at) {
          console.log(`      Enviado: ${email.sent_at}`);
        }
      });
    } else {
      console.log('   Nenhum email hoje');
    }
    
    // 4. Limpar emails pendentes antigos
    console.log('\n🧹 4. LIMPANDO EMAILS PENDENTES ANTIGOS:');
    const oldPending = await executeQuery(`
      DELETE FROM hr_interview_email_logs
      WHERE status = 'pending'
      AND created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)
      AND email_type IN ('reminder_15min', 'reminder_past')
    `);
    
    console.log(`   ✅ ${oldPending.affectedRows} email(s) pendente(s) antigo(s) removido(s)`);
    
    // 5. Estatísticas finais
    console.log('\n📊 5. ESTATÍSTICAS FINAIS:');
    const stats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'sent' AND DATE(created_at) = CURDATE()) as sent_today,
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'pending') as pending_now,
        (SELECT COUNT(DISTINCT application_id) FROM hr_interview_email_logs WHERE email_type IN ('reminder_15min', 'reminder_past') AND status = 'sent') as unique_interviews_with_email,
        (SELECT COUNT(*) FROM hr_job_applications WHERE interview_date IS NOT NULL AND DATE(interview_date) = CURDATE()) as interviews_today
    `);
    
    const stat = stats[0];
    console.log(`   - Emails enviados hoje: ${stat.sent_today}`);
    console.log(`   - Emails pendentes agora: ${stat.pending_now}`);
    console.log(`   - Entrevistas únicas com email: ${stat.unique_interviews_with_email}`);
    console.log(`   - Entrevistas agendadas hoje: ${stat.interviews_today}`);
    
    console.log('\n✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('\n❌ Erro na limpeza:', error);
  }
  
  process.exit(0);
}

// Executar limpeza
cleanDuplicateEmails(); 