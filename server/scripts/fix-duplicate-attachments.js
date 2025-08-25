const { executeQuery } = require('../connect/mysql');
const { generateFileHash, generateEmailHash } = require('../utils/fileHash');
const fs = require('fs');
const path = require('path');

async function fixDuplicateAttachments() {
  try {
    console.log('🔄 Iniciando correção de anexos duplicados...');
    
    // Buscar candidatos com anexos duplicados
    const duplicates = await executeQuery(`
      SELECT 
        a.id as applicant_id,
        a.name as candidate_name,
        a.email,
        COUNT(aa.id) as total_attachments,
        COUNT(DISTINCT aa.id) as unique_attachments
      FROM hr_applicants a
      JOIN hr_applicant_attachments aa ON aa.applicant_id = a.id
      GROUP BY a.id, a.name, a.email
      HAVING COUNT(aa.id) != COUNT(DISTINCT aa.id)
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ Nenhum anexo duplicado encontrado!');
      return;
    }
    
    console.log(`📁 Encontrados ${duplicates.length} candidatos com anexos duplicados`);
    
    for (const duplicate of duplicates) {
      console.log(`\n🔍 Processando candidato: ${duplicate.candidate_name} (${duplicate.email})`);
      console.log(`   Total de anexos: ${duplicate.total_attachments}`);
      console.log(`   Anexos únicos: ${duplicate.unique_attachments}`);
      
      // Buscar todos os anexos do candidato
      const attachments = await executeQuery(`
        SELECT 
          id,
          file_name,
          file_url,
          file_hash,
          email_hash,
          created_at
        FROM hr_applicant_attachments 
        WHERE applicant_id = ?
        ORDER BY created_at ASC
      `, [duplicate.applicant_id]);
      
      // Agrupar por email_hash para identificar duplicatas
      const groupedAttachments = {};
      
      for (const attachment of attachments) {
        const key = attachment.email_hash || 'no_hash';
        if (!groupedAttachments[key]) {
          groupedAttachments[key] = [];
        }
        groupedAttachments[key].push(attachment);
      }
      
      // Processar cada grupo de duplicatas
      for (const [emailHash, group] of Object.entries(groupedAttachments)) {
        if (group.length > 1) {
          console.log(`   📄 Encontradas ${group.length} versões do mesmo arquivo`);
          
          // Manter o primeiro (mais antigo) e remover os outros
          const keepAttachment = group[0];
          const removeAttachments = group.slice(1);
          
          console.log(`   ✅ Manter: ${keepAttachment.file_name} (ID: ${keepAttachment.id})`);
          
          for (const removeAttachment of removeAttachments) {
            console.log(`   ❌ Remover: ${removeAttachment.file_name} (ID: ${removeAttachment.id})`);
            
            // Remover arquivo físico se for diferente do que vamos manter
            if (removeAttachment.file_url !== keepAttachment.file_url) {
              let fileName = removeAttachment.file_url;
              if (fileName.includes('/storageService/hr-job-openings/')) {
                fileName = fileName.split('/').pop();
              }
              
              const filePath = path.join(__dirname, '../../storageService/hr-job-openings', fileName);
              
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`   🗑️  Arquivo físico removido: ${fileName}`);
              }
            }
            
            // Remover registro do banco
            await executeQuery(`
              DELETE FROM hr_applicant_attachments WHERE id = ?
            `, [removeAttachment.id]);
            
            console.log(`   🗑️  Registro removido do banco: ID ${removeAttachment.id}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Correção de anexos duplicados concluída!');
    
    // Verificar resultado
    const finalCheck = await executeQuery(`
      SELECT 
        COUNT(*) as total_candidates,
        SUM(total_attachments) as total_attachments,
        SUM(unique_attachments) as unique_attachments
      FROM (
        SELECT 
          a.id,
          COUNT(aa.id) as total_attachments,
          COUNT(DISTINCT aa.id) as unique_attachments
        FROM hr_applicants a
        LEFT JOIN hr_applicant_attachments aa ON aa.applicant_id = a.id
        GROUP BY a.id
      ) as stats
    `);
    
    console.log('\n📊 Resumo final:');
    console.log(`   Candidatos: ${finalCheck[0].total_candidates}`);
    console.log(`   Total de anexos: ${finalCheck[0].total_attachments}`);
    console.log(`   Anexos únicos: ${finalCheck[0].unique_attachments}`);
    
    if (finalCheck[0].total_attachments === finalCheck[0].unique_attachments) {
      console.log('✅ Todos os anexos agora são únicos!');
    } else {
      console.log('⚠️  Ainda existem anexos duplicados');
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir anexos duplicados:', error);
  }
}

// Executar script
fixDuplicateAttachments(); 