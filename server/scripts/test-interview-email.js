const { sendInterviewAlertEmail } = require('../controllers/hr-job-openings');

// Script para testar o envio de email de alerta de entrevistas
async function testInterviewEmail() {
  console.log('🧪 Iniciando teste de email de alerta de entrevistas...');
  
  try {
    const result = await sendInterviewAlertEmail();
    
    if (result.success) {
      console.log('✅ Email enviado com sucesso!');
      console.log('📧 Timestamp:', result.timestamp);
    } else {
      console.error('❌ Erro ao enviar email:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
  
  // Encerrar o processo
  process.exit(0);
}

// Executar o teste
testInterviewEmail(); 