/**
 * Script de emergência para corrigir o problema de loop de emails
 * e limpar os registros duplicados
 */

const { executeQuery } = require('../connect/mysql');

async function fixEmailLoop() {
  console.log('🚨 CORREÇÃO DE EMERGÊNCIA - LOOP DE EMAILS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Contar emails duplicados
    console.log('\n📊 1. ANALISANDO DUPLICATAS:');
    const duplicates = await executeQuery(`
      SELECT 
        application_id,
        DATE(interview_date) as interview_date,
        COUNT(*) as total,
        MIN(created_at) as first_email,
        MAX(created_at) as last_email,
        TIMESTAMPDIFF(MINUTE, MIN(created_at), MAX(created_at)) as span_minutes
      FROM hr_interview_email_logs
      WHERE email_type IN ('reminder_15min', 'reminder_past')
      AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      GROUP BY application_id, DATE(interview_date)
      HAVING total > 1
      ORDER BY total DESC
    `);
    
    if (duplicates.length > 0) {
      console.log(`   ❌ ${duplicates.length} entrevista(s) com emails duplicados:`);
      duplicates.forEach(dup => {
        console.log(`\n   Application ${dup.application_id}:`);
        console.log(`   - Total de emails: ${dup.total}`);
        console.log(`   - Período: ${dup.span_minutes} minutos`);
        console.log(`   - Primeiro: ${dup.first_email}`);
        console.log(`   - Último: ${dup.last_email}`);
      });
      
      // 2. Limpar duplicatas mantendo apenas o primeiro enviado
      console.log('\n🧹 2. LIMPANDO DUPLICATAS:');
      
      const deleteResult = await executeQuery(`
        DELETE e1 FROM hr_interview_email_logs e1
        INNER JOIN (
          SELECT 
            application_id,
            DATE(interview_date) as interview_date,
            MIN(id) as keep_id
          FROM hr_interview_email_logs
          WHERE email_type IN ('reminder_15min', 'reminder_past')
          AND status = 'sent'
          GROUP BY application_id, DATE(interview_date)
        ) e2 ON e1.application_id = e2.application_id 
            AND DATE(e1.interview_date) = e2.interview_date
        WHERE e1.id != e2.keep_id
        AND e1.email_type IN ('reminder_15min', 'reminder_past')
      `);
      
      console.log(`   ✅ ${deleteResult.affectedRows} registro(s) duplicado(s) removido(s)`);
      
    } else {
      console.log('   ✅ Nenhuma duplicata encontrada');
    }
    
    // 3. Verificar configuração atual
    console.log('\n⚙️ 3. VERIFICANDO CONFIGURAÇÃO:');
    const config = await executeQuery(`
      SELECT config_key, config_value 
      FROM hr_interview_email_config
      WHERE config_key IN ('reminder_15min_enabled', 'reminder_interval_minutes')
    `);
    
    config.forEach(c => {
      console.log(`   - ${c.config_key}: ${c.config_value}`);
    });
    
    // 4. Adicionar/atualizar configuração de intervalo
    console.log('\n🔧 4. CONFIGURANDO INTERVALO MÍNIMO:');
    
    // Verificar se existe a configuração
    const intervalConfig = await executeQuery(`
      SELECT id FROM hr_interview_email_config 
      WHERE config_key = 'reminder_interval_minutes'
    `);
    
    if (intervalConfig.length === 0) {
      // Inserir nova configuração
      await executeQuery(`
        INSERT INTO hr_interview_email_config 
        (config_key, config_value, description, is_active)
        VALUES 
        ('reminder_interval_minutes', '15', 'Intervalo mínimo em minutos entre lembretes', 1)
      `);
      console.log('   ✅ Configuração de intervalo criada (15 minutos)');
    } else {
      // Atualizar configuração existente
      await executeQuery(`
        UPDATE hr_interview_email_config 
        SET config_value = '15'
        WHERE config_key = 'reminder_interval_minutes'
      `);
      console.log('   ✅ Configuração de intervalo atualizada (15 minutos)');
    }
    
    // 5. Estatísticas finais
    console.log('\n📊 5. ESTATÍSTICAS APÓS CORREÇÃO:');
    const stats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE DATE(created_at) = CURDATE()) as total_hoje,
        (SELECT COUNT(DISTINCT application_id) FROM hr_interview_email_logs WHERE DATE(created_at) = CURDATE() AND email_type IN ('reminder_15min', 'reminder_past')) as entrevistas_unicas_hoje,
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'sent' AND DATE(created_at) = CURDATE()) as enviados_hoje,
        (SELECT COUNT(*) FROM hr_interview_email_logs WHERE status = 'pending') as pendentes
    `);
    
    const stat = stats[0];
    console.log(`   - Total de emails hoje: ${stat.total_hoje}`);
    console.log(`   - Entrevistas únicas hoje: ${stat.entrevistas_unicas_hoje}`);
    console.log(`   - Emails enviados hoje: ${stat.enviados_hoje}`);
    console.log(`   - Emails pendentes: ${stat.pendentes}`);
    
    console.log('\n✅ Correção concluída!');
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   1. O cron job foi ajustado para executar a cada 5 minutos');
    console.log('   2. A query SQL foi corrigida para usar DATE() na comparação');
    console.log('   3. Reinicie o servidor para aplicar as mudanças');
    
  } catch (error) {
    console.error('\n❌ Erro na correção:', error);
  }
  
  process.exit(0);
}

// Executar correção
fixEmailLoop(); 