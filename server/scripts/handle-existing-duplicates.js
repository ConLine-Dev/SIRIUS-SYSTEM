const { executeQuery } = require('../connect/mysql');
const fs = require('fs');
const path = require('path');

async function handleExistingDuplicates() {
  try {
    console.log('🔄 Verificando duplicatas existentes...');
    
    // Buscar duplicatas por email_hash
    const duplicates = await executeQuery(`
      SELECT 
        email_hash,
        COUNT(*) as count,
        GROUP_CONCAT(id ORDER BY created_at ASC) as ids,
        GROUP_CONCAT(file_name ORDER BY created_at ASC) as file_names,
        GROUP_CONCAT(created_at ORDER BY created_at ASC) as created_ats
      FROM hr_applicant_attachments 
      WHERE email_hash IS NOT NULL
      GROUP BY email_hash 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada!');
      return;
    }
    
    console.log(`📁 Encontradas ${duplicates.length} duplicatas`);
    
    for (const duplicate of duplicates) {
      console.log(`\n🔍 Processando duplicata:`);
      console.log(`   Email Hash: ${duplicate.email_hash}`);
      console.log(`   Quantidade: ${duplicate.count}`);
      console.log(`   IDs: ${duplicate.ids}`);
      console.log(`   Arquivos: ${duplicate.file_names}`);
      
      const ids = duplicate.ids.split(',');
      const fileNames = duplicate.file_names.split(',');
      const createdAts = duplicate.created_ats.split(',');
      
      // Manter o primeiro (mais antigo) e marcar os outros como duplicatas
      const keepId = ids[0];
      const removeIds = ids.slice(1);
      
      console.log(`   ✅ Manter: ID ${keepId} (${fileNames[0]})`);
      console.log(`   ❌ Remover: ${removeIds.join(', ')}`);
      
      // Buscar informações dos arquivos a serem removidos
      const filesToRemove = await executeQuery(`
        SELECT id, file_url, file_name
        FROM hr_applicant_attachments 
        WHERE id IN (${removeIds.join(',')})
      `);
      
      // Remover arquivos físicos e registros do banco
      for (const file of filesToRemove) {
        try {
          // Remover arquivo físico
          let fileName = file.file_url;
          if (fileName.includes('/storageService/hr-job-openings/')) {
            fileName = fileName.split('/').pop();
          }
          
          const filePath = path.join(__dirname, '../../storageService/hr-job-openings', fileName);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`   🗑️  Arquivo removido: ${fileName}`);
          }
          
          // Remover registro do banco
          await executeQuery(`
            DELETE FROM hr_applicant_attachments WHERE id = ?
          `, [file.id]);
          
          console.log(`   🗑️  Registro removido: ID ${file.id}`);
          
        } catch (error) {
          console.error(`   ❌ Erro ao remover arquivo ID ${file.id}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Duplicatas processadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao processar duplicatas:', error);
  }
}

// Executar script
handleExistingDuplicates(); 