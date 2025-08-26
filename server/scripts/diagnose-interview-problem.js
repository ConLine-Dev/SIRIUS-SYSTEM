/**
 * Script de Diagnóstico para Problemas de Entrevista
 * Identifica:
 * 1. Problema de cálculo de minutos
 * 2. Problema de envio duplicado
 * 3. Problema de timezone
 */

const { executeQuery } = require('../connect/mysql');

async function diagnoseInterviewProblem() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO PROBLEMA DE ENTREVISTAS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar horários do sistema
    console.log('\n📅 1. ANÁLISE DE HORÁRIOS:');
    const now = new Date();
    const nowUTC = now.toISOString();
    const nowLocal = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    console.log(`   - JavaScript Date(): ${now}`);
    console.log(`   - UTC (ISO): ${nowUTC}`);
    console.log(`   - Local Brasil: ${nowLocal}`);
    console.log(`   - Timezone Offset: ${now.getTimezoneOffset()} minutos`);
    
    // 2. Verificar horário do MySQL
    console.log('\n🗄️ 2. HORÁRIO DO MySQL:');
    const mysqlTime = await executeQuery(`
      SELECT 
        NOW() as mysql_now,
        UTC_TIMESTAMP() as mysql_utc,
        TIMEDIFF(NOW(), UTC_TIMESTAMP()) as timezone_diff,
        @@system_time_zone as system_tz,
        @@time_zone as session_tz
    `);
    
    console.log(`   - NOW(): ${mysqlTime[0].mysql_now}`);
    console.log(`   - UTC_TIMESTAMP(): ${mysqlTime[0].mysql_utc}`);
    console.log(`   - Diferença: ${mysqlTime[0].timezone_diff}`);
    console.log(`   - System TZ: ${mysqlTime[0].system_tz}`);
    console.log(`   - Session TZ: ${mysqlTime[0].session_tz}`);
    
    // 3. Buscar a entrevista das 08:45
    console.log('\n🎯 3. ANÁLISE DA ENTREVISTA DAS 08:45:');
    const interview = await executeQuery(`
      SELECT 
        ja.id,
        ja.interview_date,
        ap.name as candidate_name,
        DATE_FORMAT(ja.interview_date, '%Y-%m-%d %H:%i:%s') as formatted_date,
        DATE_FORMAT(ja.interview_date, '%H:%i') as interview_time,
        TIMESTAMPDIFF(MINUTE, NOW(), ja.interview_date) as minutes_diff_sql,
        NOW() as current_time_sql,
        ja.interview_date > NOW() as is_future
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      WHERE DATE_FORMAT(ja.interview_date, '%H:%i') = '08:45'
      ORDER BY ja.interview_date DESC
      LIMIT 1
    `);
    
    if (interview.length > 0) {
      const int = interview[0];
      console.log(`   - Candidato: ${int.candidate_name}`);
      console.log(`   - Data/Hora no banco: ${int.formatted_date}`);
      console.log(`   - interview_date raw: ${int.interview_date}`);
      console.log(`   - NOW() no SQL: ${int.current_time_sql}`);
      console.log(`   - TIMESTAMPDIFF(MINUTE): ${int.minutes_diff_sql} minutos`);
      console.log(`   - É futura?: ${int.is_future ? 'SIM' : 'NÃO'}`);
      
      // Calcular em JavaScript
      const interviewDateJS = new Date(int.interview_date);
      const nowJS = new Date();
      const diffMS = interviewDateJS.getTime() - nowJS.getTime();
      const diffMinutesJS = Math.floor(diffMS / 60000);
      
      console.log('\n   📊 Cálculo JavaScript:');
      console.log(`   - Interview Date JS: ${interviewDateJS}`);
      console.log(`   - Now JS: ${nowJS}`);
      console.log(`   - Diferença em minutos: ${diffMinutesJS}`);
      console.log(`   - Diferença SQL vs JS: ${int.minutes_diff_sql - diffMinutesJS} minutos`);
      
      // Se a entrevista já passou
      if (diffMinutesJS < 0) {
        const minutosAtrasado = Math.abs(diffMinutesJS);
        console.log(`\n   ⚠️ ENTREVISTA ATRASADA:`);
        console.log(`   - Atraso real: ${minutosAtrasado} minutos`);
        console.log(`   - SQL reporta: ${Math.abs(int.minutes_diff_sql)} minutos`);
        console.log(`   - Erro no cálculo: ${Math.abs(Math.abs(int.minutes_diff_sql) - minutosAtrasado)} minutos de diferença`);
      }
    } else {
      console.log('   ❌ Nenhuma entrevista encontrada para 08:45');
    }
    
    // 4. Verificar emails enviados
    console.log('\n📧 4. ANÁLISE DE EMAILS ENVIADOS:');
    const emails = await executeQuery(`
      SELECT 
        el.id,
        el.email_type,
        el.application_id,
        el.interview_date,
        el.status,
        el.sent_at,
        el.created_at,
        el.subject,
        ap.name as candidate_name
      FROM hr_interview_email_logs el
      LEFT JOIN hr_job_applications ja ON ja.id = el.application_id
      LEFT JOIN hr_applicants ap ON ap.id = ja.applicant_id
      WHERE DATE(el.created_at) = CURDATE()
      AND el.email_type IN ('reminder_15min', 'reminder_past')
      ORDER BY el.created_at DESC
      LIMIT 10
    `);
    
    if (emails.length > 0) {
      console.log(`   Total de emails hoje: ${emails.length}`);
      
      // Agrupar por application_id para detectar duplicatas
      const emailsByApplication = {};
      emails.forEach(email => {
        if (!emailsByApplication[email.application_id]) {
          emailsByApplication[email.application_id] = [];
        }
        emailsByApplication[email.application_id].push(email);
      });
      
      // Verificar duplicatas
      Object.keys(emailsByApplication).forEach(appId => {
        const appEmails = emailsByApplication[appId];
        if (appEmails.length > 1) {
          console.log(`\n   🔴 DUPLICATA DETECTADA para application_id ${appId}:`);
          appEmails.forEach(email => {
            console.log(`      - ID: ${email.id}, Tipo: ${email.email_type}, Status: ${email.status}`);
            console.log(`        Criado: ${email.created_at}`);
            console.log(`        Enviado: ${email.sent_at || 'NÃO ENVIADO'}`);
            console.log(`        Assunto: ${email.subject}`);
          });
        }
      });
      
      // Listar todos os emails
      console.log('\n   📋 Últimos emails:');
      emails.forEach((email, idx) => {
        console.log(`\n   ${idx + 1}. ${email.candidate_name || 'N/A'}`);
        console.log(`      - Tipo: ${email.email_type}`);
        console.log(`      - Status: ${email.status}`);
        console.log(`      - Assunto: ${email.subject}`);
        console.log(`      - Criado: ${email.created_at}`);
      });
    } else {
      console.log('   ✅ Nenhum email enviado hoje');
    }
    
    // 5. Verificar configuração do NOT EXISTS
    console.log('\n🔍 5. TESTE DA QUERY NOT EXISTS:');
    const testQuery = await executeQuery(`
      SELECT 
        ja.id,
        ap.name,
        ja.interview_date,
        (
          SELECT COUNT(*) 
          FROM hr_interview_email_logs el 
          WHERE el.application_id = ja.id 
          AND el.email_type IN ('reminder_15min', 'reminder_past')
          AND el.status = 'sent'
        ) as emails_sent,
        EXISTS (
          SELECT 1 
          FROM hr_interview_email_logs el2 
          WHERE el2.application_id = ja.id 
          AND el2.email_type IN ('reminder_15min', 'reminder_past')
          AND el2.status = 'sent'
        ) as has_sent_email
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      WHERE ja.interview_date IS NOT NULL
      AND DATE(ja.interview_date) = CURDATE()
    `);
    
    if (testQuery.length > 0) {
      console.log('   Entrevistas de hoje e status de email:');
      testQuery.forEach(row => {
        console.log(`   - ${row.name}: ${row.emails_sent} emails enviados, Bloqueado: ${row.has_sent_email ? 'SIM' : 'NÃO'}`);
      });
    }
    
    // 6. Recomendações
    console.log('\n💡 6. DIAGNÓSTICO E RECOMENDAÇÕES:');
    
    // Problema de timezone
    const tzDiff = mysqlTime[0].timezone_diff;
    if (tzDiff !== '-03:00:00' && tzDiff !== '-3:00:00') {
      console.log('   ⚠️ PROBLEMA DE TIMEZONE DETECTADO!');
      console.log(`      MySQL está usando ${tzDiff} ao invés de -03:00`);
      console.log('      SOLUÇÃO: Configurar timezone do MySQL para America/Sao_Paulo');
    }
    
    // Problema de duplicatas
    if (emails.length > 0) {
      let hasDuplicates = false;
      Object.keys(emailsByApplication || {}).forEach(appId => {
        if (emailsByApplication[appId].length > 1) {
          hasDuplicates = true;
        }
      });
      
      if (hasDuplicates) {
        console.log('   ⚠️ PROBLEMA DE DUPLICAÇÃO DETECTADO!');
        console.log('      Múltiplos emails sendo enviados para mesma entrevista');
        console.log('      SOLUÇÃO: Verificar lógica de NOT EXISTS e adicionar UNIQUE constraint');
      }
    }
    
    // Problema de cálculo
    if (interview.length > 0) {
      const int = interview[0];
      const interviewDateJS = new Date(int.interview_date);
      const nowJS = new Date();
      const diffMinutesJS = Math.floor((interviewDateJS.getTime() - nowJS.getTime()) / 60000);
      const errorMargin = Math.abs(int.minutes_diff_sql - diffMinutesJS);
      
      if (errorMargin > 5) {
        console.log('   ⚠️ PROBLEMA DE CÁLCULO DE MINUTOS DETECTADO!');
        console.log(`      Diferença de ${errorMargin} minutos entre SQL e JavaScript`);
        console.log('      SOLUÇÃO: Verificar timezone e usar cálculo consistente');
      }
    }
    
    console.log('\n✅ Diagnóstico concluído!');
    
  } catch (error) {
    console.error('\n❌ Erro no diagnóstico:', error);
  }
  
  process.exit(0);
}

// Executar diagnóstico
diagnoseInterviewProblem(); 