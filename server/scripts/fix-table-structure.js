/**
 * Script para corrigir a estrutura da tabela hr_interview_email_logs
 */

const { executeQuery } = require('../connect/mysql');

async function fixTableStructure() {
  console.log('🔧 CORRIGINDO ESTRUTURA DA TABELA hr_interview_email_logs');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar estrutura atual
    console.log('\n📋 1. VERIFICANDO ESTRUTURA ATUAL:');
    const currentEnum = await executeQuery(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'hr_interview_email_logs' 
      AND COLUMN_NAME = 'email_type'
    `);
    
    if (currentEnum.length > 0) {
      console.log(`   - ENUM atual: ${currentEnum[0].COLUMN_TYPE}`);
    }
    
    // 2. Adicionar colunas que podem estar faltando
    console.log('\n🏗️ 2. ADICIONANDO COLUNAS NECESSÁRIAS:');
    
    try {
      await executeQuery(`
        ALTER TABLE hr_interview_email_logs 
        ADD COLUMN recipient_emails TEXT NULL COMMENT 'JSON array de emails destinatários'
      `);
      console.log('   ✅ Coluna recipient_emails adicionada');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('   ℹ️ Coluna recipient_emails já existe');
      } else {
        console.log('   ❌ Erro ao adicionar recipient_emails:', error.message);
      }
    }
    
    try {
      await executeQuery(`
        ALTER TABLE hr_interview_email_logs 
        ADD COLUMN subject VARCHAR(255) NULL
      `);
      console.log('   ✅ Coluna subject adicionada');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('   ℹ️ Coluna subject já existe');
      } else {
        console.log('   ❌ Erro ao adicionar subject:', error.message);
      }
    }
    
    try {
      await executeQuery(`
        ALTER TABLE hr_interview_email_logs 
        ADD COLUMN email_content TEXT NULL
      `);
      console.log('   ✅ Coluna email_content adicionada');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('   ℹ️ Coluna email_content já existe');
      } else {
        console.log('   ❌ Erro ao adicionar email_content:', error.message);
      }
    }
    
    try {
      await executeQuery(`
        ALTER TABLE hr_interview_email_logs 
        ADD COLUMN status ENUM('pending', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending'
      `);
      console.log('   ✅ Coluna status adicionada');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('   ℹ️ Coluna status já existe');
      } else {
        console.log('   ❌ Erro ao adicionar status:', error.message);
      }
    }
    
    try {
      await executeQuery(`
        ALTER TABLE hr_interview_email_logs 
        ADD COLUMN sent_at TIMESTAMP NULL
      `);
      console.log('   ✅ Coluna sent_at adicionada');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('   ℹ️ Coluna sent_at já existe');
      } else {
        console.log('   ❌ Erro ao adicionar sent_at:', error.message);
      }
    }
    
    // 3. Atualizar ENUM do email_type
    console.log('\n🔄 3. ATUALIZANDO ENUM email_type:');
    try {
      await executeQuery(`
        ALTER TABLE hr_interview_email_logs 
        MODIFY COLUMN email_type ENUM(
          'daily_alert', 
          'reminder_15min', 
          'reminder_past', 
          'reminder_candidate'
        ) NOT NULL
      `);
      console.log('   ✅ ENUM email_type atualizado com todos os tipos');
    } catch (error) {
      console.log('   ❌ Erro ao atualizar ENUM:', error.message);
    }
    
    // 4. Corrigir registros existentes
    console.log('\n🔧 4. CORRIGINDO REGISTROS EXISTENTES:');
    
    // Atualizar email_type vazio
    const updateEmailType = await executeQuery(`
      UPDATE hr_interview_email_logs 
      SET email_type = 'reminder_past'
      WHERE email_type = '' OR email_type IS NULL
    `);
    console.log(`   ✅ ${updateEmailType.affectedRows} registros com email_type corrigidos`);
    
    // Atualizar status vazio
    const updateStatus = await executeQuery(`
      UPDATE hr_interview_email_logs 
      SET status = 'sent'
      WHERE status IS NULL OR status = ''
    `);
    console.log(`   ✅ ${updateStatus.affectedRows} registros com status corrigidos`);
    
    // 5. Verificar resultado
    console.log('\n📊 5. VERIFICANDO RESULTADO:');
    const finalCheck = await executeQuery(`
      SELECT 
        id,
        email_type,
        status,
        application_id,
        DATE_FORMAT(created_at, '%H:%i:%s') as created_time
      FROM hr_interview_email_logs 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('   Últimos 5 registros:');
    finalCheck.forEach(record => {
      console.log(`   - ID: ${record.id}, Tipo: ${record.email_type}, Status: ${record.status}, Hora: ${record.created_time}`);
    });
    
    console.log('\n✅ ESTRUTURA DA TABELA CORRIGIDA!');
    console.log('\n⚠️ IMPORTANTE: Reinicie o servidor para aplicar as mudanças completamente');
    
  } catch (error) {
    console.error('\n❌ Erro na correção:', error);
  }
  
  process.exit(0);
}

// Executar correção
fixTableStructure(); 