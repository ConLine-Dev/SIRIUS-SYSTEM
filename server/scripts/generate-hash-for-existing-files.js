const { executeQuery } = require('../connect/mysql');
const { generateFileHash, generateEmailHash } = require('../utils/fileHash');
const fs = require('fs');
const path = require('path');

async function generateHashForExistingFiles() {
  try {
    console.log('🔄 Iniciando geração de hash para arquivos existentes...');
    
    // Buscar todos os anexos sem hash
    const attachments = await executeQuery(`
      SELECT 
        aa.id,
        aa.file_url,
        aa.applicant_id,
        a.email
      FROM hr_applicant_attachments aa
      JOIN hr_applicants a ON a.id = aa.applicant_id
      WHERE aa.file_hash IS NULL OR aa.email_hash IS NULL
    `);
    
    console.log(`📁 Encontrados ${attachments.length} arquivos para processar`);
    
    let processed = 0;
    let errors = 0;
    
    for (const attachment of attachments) {
      try {
        // Construir caminho do arquivo
        let fileName = attachment.file_url;
        if (fileName.includes('/storageService/hr-job-openings/')) {
          fileName = fileName.split('/').pop();
        }
        
        const filePath = path.join(__dirname, '../../storageService/hr-job-openings', fileName);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  Arquivo não encontrado: ${fileName}`);
          errors++;
          continue;
        }
        
        // Gerar hash do arquivo
        const fileHash = await generateFileHash(filePath);
        const emailHash = generateEmailHash(fileHash, attachment.email);
        
        // Atualizar no banco
        await executeQuery(`
          UPDATE hr_applicant_attachments 
          SET file_hash = ?, email_hash = ?
          WHERE id = ?
        `, [fileHash, emailHash, attachment.id]);
        
        processed++;
        console.log(`✅ Processado: ${fileName} (ID: ${attachment.id})`);
        
      } catch (error) {
        console.error(`❌ Erro ao processar arquivo ID ${attachment.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Resumo:');
    console.log(`   ✅ Processados: ${processed}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   📁 Total: ${attachments.length}`);
    
    if (processed > 0) {
      console.log('\n🎉 Hash gerado com sucesso para arquivos existentes!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao gerar hash:', error);
    process.exit(1);
  }
}

// Executar script
generateHashForExistingFiles(); 