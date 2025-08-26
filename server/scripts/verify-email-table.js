const { executeQuery } = require('../connect/mysql');

async function verifyEmailTable() {
  try {
    console.log('🔍 VERIFICANDO TABELA hr_interview_email_logs');
    console.log('=' .repeat(50));

    // 1. Verificar se a tabela existe
    const tableExists = await executeQuery(`
      SHOW TABLES LIKE 'hr_interview_email_logs'
    `);
    
    console.log('\n📋 1. EXISTÊNCIA DA TABELA:');
    if (tableExists.length > 0) {
      console.log('   ✅ Tabela hr_interview_email_logs existe');
    } else {
      console.log('   ❌ Tabela hr_interview_email_logs NÃO existe!');
      console.log('   🔧 Execute o schema SQL para criar a tabela');
      return;
    }

    // 2. Verificar estrutura da tabela
    const tableStructure = await executeQuery(`
      DESCRIBE hr_interview_email_logs
    `);
    
    console.log('\n🏗️ 2. ESTRUTURA DA TABELA:');
    tableStructure.forEach(column => {
      console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // 3. Contar registros totais
    const totalCount = await executeQuery(`
      SELECT COUNT(*) as total FROM hr_interview_email_logs
    `);
    
    console.log(`\n📊 3. TOTAL DE REGISTROS: ${totalCount[0].total}`);

    // 4. Contar por status
    const statusCount = await executeQuery(`
      SELECT 
        status,
        COUNT(*) as count
      FROM hr_interview_email_logs
      GROUP BY status
    `);
    
    console.log('\n📈 4. REGISTROS POR STATUS:');
    if (statusCount.length > 0) {
      statusCount.forEach(row => {
        console.log(`   - ${row.status}: ${row.count}`);
      });
    } else {
      console.log('   Nenhum registro encontrado');
    }

    // 5. Últimos registros
    const lastRecords = await executeQuery(`
      SELECT 
        id, email_type, status, application_id,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created,
        DATE_FORMAT(sent_at, '%Y-%m-%d %H:%i:%s') as sent
      FROM hr_interview_email_logs
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📝 5. ÚLTIMOS 5 REGISTROS:');
    if (lastRecords.length > 0) {
      lastRecords.forEach(record => {
        console.log(`   ID: ${record.id}, Tipo: ${record.email_type}, Status: ${record.status}`);
        console.log(`   App: ${record.application_id}, Criado: ${record.created}, Enviado: ${record.sent || 'N/A'}`);
        console.log('   ---');
      });
    } else {
      console.log('   ❌ Nenhum registro encontrado na tabela!');
      console.log('   🔧 A tabela existe mas está vazia - problema no registro de emails');
    }

    // 6. Verificar configuração
    const configExists = await executeQuery(`
      SHOW TABLES LIKE 'hr_interview_email_config'
    `);
    
    console.log('\n⚙️ 6. TABELA DE CONFIGURAÇÃO:');
    if (configExists.length > 0) {
      console.log('   ✅ Tabela hr_interview_email_config existe');
      
      const configs = await executeQuery(`
        SELECT config_key, config_value, is_active 
        FROM hr_interview_email_config
        WHERE config_key LIKE '%reminder%'
      `);
      
      if (configs.length > 0) {
        configs.forEach(config => {
          console.log(`   - ${config.config_key}: ${config.config_value} (${config.is_active ? 'ATIVO' : 'INATIVO'})`);
        });
      } else {
        console.log('   ⚠️ Nenhuma configuração de lembrete encontrada');
      }
    } else {
      console.log('   ❌ Tabela hr_interview_email_config NÃO existe!');
    }

    // 7. Diagnóstico final
    console.log('\n💡 7. DIAGNÓSTICO:');
    if (totalCount[0].total === 0) {
      console.log('   ❌ PROBLEMA: A tabela existe mas está vazia');
      console.log('   🔧 SOLUÇÃO: O sistema não está registrando emails na tabela');
      console.log('   📋 VERIFICAR: Função registerEmail() no InterviewEmailManager');
    } else {
      console.log('   ✅ Tabela funcionando normalmente');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
  
  process.exit(0);
}

verifyEmailTable(); 