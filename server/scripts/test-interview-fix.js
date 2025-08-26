/**
 * Script para testar as correções do sistema de lembretes
 * Verifica:
 * 1. Cálculo correto de minutos
 * 2. Prevenção de duplicatas
 * 3. Envio correto de emails
 */

const { getUpcomingInterviews } = require('../controllers/hr-job-openings');
const { executeQuery } = require('../connect/mysql');

async function testInterviewFix() {
  console.log('🧪 TESTE DAS CORREÇÕES DO SISTEMA DE LEMBRETES');
  console.log('=' .repeat(60));
  
  try {
    // 1. Testar busca de entrevistas
    console.log('\n📋 1. TESTANDO BUSCA DE ENTREVISTAS:');
    const interviews = await getUpcomingInterviews();
    
    if (interviews.length > 0) {
      console.log(`   ✅ ${interviews.length} entrevista(s) encontrada(s)`);
      
      interviews.forEach((interview, idx) => {
        console.log(`\n   ${idx + 1}. ${interview.candidate_name}`);
        console.log(`      - Horário: ${interview.interview_time}`);
        console.log(`      - Minutos (corrigido): ${interview.minutes_until}`);
        console.log(`      - Minutos (SQL original): ${interview.minutes_until_sql || 'N/A'}`);
        console.log(`      - Status: ${interview.interview_status}`);
        
        // Verificar se o cálculo está correto
        const interviewDate = new Date(interview.interview_date);
        const now = new Date();
        const realDiff = Math.floor((interviewDate - now) / 60000);
        
        if (Math.abs(realDiff - interview.minutes_until) <= 1) {
          console.log(`      ✅ Cálculo correto!`);
        } else {
          console.log(`      ❌ Erro no cálculo: diferença de ${Math.abs(realDiff - interview.minutes_until)} minutos`);
        }
      });
    } else {
      console.log('   ℹ️ Nenhuma entrevista elegível no momento');
    }
    
    // 2. Verificar duplicatas
    console.log('\n🔍 2. VERIFICANDO DUPLICATAS:');
    const duplicates = await executeQuery(`
      SELECT 
        application_id,
        email_type,
        interview_date,
        COUNT(*) as count,
        GROUP_CONCAT(CONCAT(status, '(', id, ')') SEPARATOR ', ') as status_list
      FROM hr_interview_email_logs
      WHERE email_type IN ('reminder_15min', 'reminder_past')
      AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      GROUP BY application_id, email_type, interview_date
      HAVING count > 1
    `);
    
    if (duplicates.length > 0) {
      console.log('   ❌ DUPLICATAS ENCONTRADAS:');
      duplicates.forEach(dup => {
        console.log(`      - App ID ${dup.application_id}: ${dup.count} emails`);
        console.log(`        Status: ${dup.status_list}`);
      });
    } else {
      console.log('   ✅ Nenhuma duplicata encontrada');
    }
    
    // 3. Simular envio de email
    if (interviews.length > 0) {
      console.log('\n📧 3. SIMULAÇÃO DE ENVIO:');
      const interview = interviews[0];
      
      // Verificar se já existe registro
      const existing = await executeQuery(`
        SELECT * FROM hr_interview_email_logs
        WHERE application_id = ?
        AND email_type IN ('reminder_15min', 'reminder_past')
        AND interview_date = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [interview.application_id, interview.interview_date]);
      
      if (existing.length > 0) {
        console.log(`   ⚠️ Já existe registro para esta entrevista:`);
        console.log(`      - ID: ${existing[0].id}`);
        console.log(`      - Tipo: ${existing[0].email_type}`);
        console.log(`      - Status: ${existing[0].status}`);
        console.log(`      - Criado: ${existing[0].created_at}`);
      } else {
        console.log(`   ✅ Nenhum registro existente - pronto para enviar`);
      }
    }
    
    // 4. Verificar timezone do MySQL
    console.log('\n⚙️ 4. VERIFICAÇÃO DE TIMEZONE:');
    const tz = await executeQuery(`
      SELECT 
        NOW() as mysql_now,
        UTC_TIMESTAMP() as mysql_utc,
        TIMEDIFF(NOW(), UTC_TIMESTAMP()) as diff,
        @@system_time_zone as sys_tz,
        @@time_zone as session_tz
    `);
    
    const tzInfo = tz[0];
    console.log(`   - NOW(): ${tzInfo.mysql_now}`);
    console.log(`   - UTC: ${tzInfo.mysql_utc}`);
    console.log(`   - Diferença: ${tzInfo.diff}`);
    console.log(`   - System TZ: ${tzInfo.sys_tz}`);
    console.log(`   - Session TZ: ${tzInfo.session_tz}`);
    
    if (tzInfo.diff === '00:00:00') {
      console.log('   ⚠️ MySQL está em UTC - correções de timezone ativas');
    } else if (tzInfo.diff === '-03:00:00' || tzInfo.diff === '-3:00:00') {
      console.log('   ✅ MySQL está em horário de Brasília');
    } else {
      console.log(`   ❌ Timezone inesperado: ${tzInfo.diff}`);
    }
    
    // 5. Resumo final
    console.log('\n📊 5. RESUMO DO TESTE:');
    const stats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM hr_job_applications WHERE interview_date IS NOT NULL) as total_interviews,
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'sent' AND DATE(created_at) = CURDATE()) as sent_today,
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'pending') as pending,
        (SELECT COUNT(DISTINCT application_id) FROM hr_interview_email_logs WHERE email_type IN ('reminder_15min', 'reminder_past') AND status = 'sent') as interviews_with_email
    `);
    
    const stat = stats[0];
    console.log(`   - Total de entrevistas: ${stat.total_interviews}`);
    console.log(`   - Emails enviados hoje: ${stat.sent_today}`);
    console.log(`   - Emails pendentes: ${stat.pending}`);
    console.log(`   - Entrevistas com email: ${stat.interviews_with_email}`);
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
  }
  
  process.exit(0);
}

// Executar teste
testInterviewFix(); 