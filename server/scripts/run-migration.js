const { executeQuery } = require('../connect/mysql');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Iniciando migração: Adicionar campos de hash...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '../sql/migration_add_file_hash.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar a migração
    await executeQuery(migrationSQL);
    
    console.log('✅ Migração executada com sucesso!');
    console.log('📋 Campos adicionados:');
    console.log('   - file_hash (VARCHAR(64)) - Hash SHA-256 do conteúdo do arquivo');
    console.log('   - email_hash (VARCHAR(64)) - Hash combinado: file_hash + email');
    console.log('   - Índices para performance');
    console.log('   - Constraint UNIQUE para email_hash');
    
    // Verificar se os campos foram criados
    const tableInfo = await executeQuery(`
      DESCRIBE hr_applicant_attachments
    `);
    
    const hasFileHash = tableInfo.some(col => col.Field === 'file_hash');
    const hasEmailHash = tableInfo.some(col => col.Field === 'email_hash');
    
    if (hasFileHash && hasEmailHash) {
      console.log('✅ Verificação: Campos de hash criados corretamente');
    } else {
      console.log('❌ Erro: Campos não foram criados corretamente');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  }
}

// Executar migração
runMigration(); 