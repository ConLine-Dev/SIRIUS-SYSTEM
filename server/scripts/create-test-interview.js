const { executeQuery } = require('../connect/mysql');

/**
 * Script para criar uma entrevista de teste para verificar o sistema
 */
async function createTestInterview() {
  try {
    console.log('🔧 Criando Entrevista de Teste');
    console.log('=' .repeat(50));
    
    // 1. Verificar horário atual
    const now = new Date();
    const testInterviewTime = new Date(now.getTime() + 12 * 60000); // 12 minutos no futuro
    
    console.log(`📅 Horário atual: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`⏰ Entrevista de teste: ${testInterviewTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`🌐 UTC: ${testInterviewTime.toISOString()}`);
    
    // 2. Verificar se existe candidato de teste
    let candidateId;
    const existingCandidate = await executeQuery(`
      SELECT id FROM hr_applicants WHERE email = 'teste.interview@conline.com' LIMIT 1
    `);
    
    if (existingCandidate.length === 0) {
      console.log('👤 Criando candidato de teste...');
      const result = await executeQuery(`
        INSERT INTO hr_applicants (name, email, phone) 
        VALUES ('Candidato Teste Interview', 'teste.interview@conline.com', '(47) 99999-9999')
      `);
      candidateId = result.insertId;
      console.log(`✅ Candidato criado com ID: ${candidateId}`);
    } else {
      candidateId = existingCandidate[0].id;
      console.log(`✅ Candidato já existe com ID: ${candidateId}`);
    }
    
    // 3. Buscar status de entrevista
    const statusResult = await executeQuery(`
      SELECT id FROM hr_application_statuses WHERE name LIKE '%entrevista%' LIMIT 1
    `);
    
    if (statusResult.length === 0) {
      console.log('❌ Nenhum status de entrevista encontrado');
      return;
    }
    
    const statusId = statusResult[0].id;
    console.log(`✅ Status de entrevista encontrado: ${statusId}`);
    
    // 4. Buscar primeira vaga disponível
    const jobResult = await executeQuery(`
      SELECT id, title FROM hr_job_postings WHERE is_active = 1 LIMIT 1
    `);
    
    if (jobResult.length === 0) {
      console.log('❌ Nenhuma vaga ativa encontrada');
      return;
    }
    
    const jobId = jobResult[0].id;
    console.log(`✅ Vaga encontrada: ${jobResult[0].title} (ID: ${jobId})`);
    
    // 5. Verificar se já existe aplicação para este candidato nesta vaga
    const existingApplication = await executeQuery(`
      SELECT id FROM hr_job_applications 
      WHERE applicant_id = ? AND job_id = ?
    `, [candidateId, jobId]);
    
    let applicationId;
    
    if (existingApplication.length === 0) {
      // 6. Criar nova aplicação com entrevista
      console.log('📝 Criando nova aplicação com entrevista...');
      const applicationResult = await executeQuery(`
        INSERT INTO hr_job_applications (job_id, applicant_id, status_id, interview_date, applied_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [jobId, candidateId, statusId, testInterviewTime]);
      
      applicationId = applicationResult.insertId;
      console.log(`✅ Aplicação criada com ID: ${applicationId}`);
    } else {
      // 7. Atualizar aplicação existente
      applicationId = existingApplication[0].id;
      console.log('📝 Atualizando aplicação existente...');
      await executeQuery(`
        UPDATE hr_job_applications 
        SET status_id = ?, interview_date = ?
        WHERE id = ?
      `, [statusId, testInterviewTime, applicationId]);
      
      console.log(`✅ Aplicação atualizada com ID: ${applicationId}`);
    }
    
    // 8. Verificar se foi criada corretamente
    const verification = await executeQuery(`
      SELECT 
        ja.id,
        ja.interview_date,
        ap.name as candidate_name,
        ap.email as candidate_email,
        j.title as job_title,
        s.name as status,
        DATE_FORMAT(ja.interview_date, '%Y-%m-%d %H:%i:%s') as interview_date_formatted,
        DATE_FORMAT(CONVERT_TZ(ja.interview_date, '+00:00', '-03:00'), '%Y-%m-%d %H:%i:%s') as interview_date_br,
        TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), ja.interview_date) as minutes_until_utc
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_job_postings j ON j.id = ja.job_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE ja.id = ?
    `, [applicationId]);
    
    if (verification.length > 0) {
      const interview = verification[0];
      console.log('\n✅ Entrevista de teste criada com sucesso!');
      console.log(`   - ID da aplicação: ${interview.id}`);
      console.log(`   - Candidato: ${interview.candidate_name} (${interview.candidate_email})`);
      console.log(`   - Vaga: ${interview.job_title}`);
      console.log(`   - Status: ${interview.status}`);
      console.log(`   - Data UTC: ${interview.interview_date_formatted}`);
      console.log(`   - Data BR: ${interview.interview_date_br}`);
      console.log(`   - Minutos até: ${interview.minutes_until_utc}`);
      
      console.log('\n📧 Para testar o sistema de emails:');
      console.log(`   node server/scripts/process-interview-emails.js reminders`);
      console.log(`   node server/scripts/test-interview-timezone.js`);
      
      console.log('\n🗑️ Para remover a entrevista de teste:');
      console.log(`   DELETE FROM hr_job_applications WHERE id = ${applicationId};`);
    } else {
      console.log('❌ Erro ao verificar entrevista criada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar entrevista de teste:', error);
  }
}

// Função para remover entrevista de teste
async function removeTestInterview() {
  try {
    console.log('🗑️ Removendo Entrevista de Teste');
    console.log('=' .repeat(50));
    
    const result = await executeQuery(`
      DELETE ja FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      WHERE ap.email = 'teste.interview@conline.com'
    `);
    
    console.log(`✅ ${result.affectedRows} aplicação(ões) removida(s)`);
    
    // Remover candidato de teste também
    const candidateResult = await executeQuery(`
      DELETE FROM hr_applicants WHERE email = 'teste.interview@conline.com'
    `);
    
    console.log(`✅ ${candidateResult.affectedRows} candidato(s) removido(s)`);
    
  } catch (error) {
    console.error('❌ Erro ao remover entrevista de teste:', error);
  }
}

// Execução via linha de comando
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'remove') {
    removeTestInterview();
  } else {
    createTestInterview();
  }
}

module.exports = { createTestInterview, removeTestInterview }; 