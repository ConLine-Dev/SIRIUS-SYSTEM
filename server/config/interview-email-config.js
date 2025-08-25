// Configuração de emails para alertas de entrevista
const interviewEmailConfig = {
  // Email principal para receber alertas de entrevista
  primaryEmail: 'petryck.leite@conlinebr.com.br',
  
  // Lista de emails adicionais para receber alertas (opcional)
  additionalEmails: [
    // 'rh@empresa.com',
    // 'recrutamento@empresa.com',
    // 'gerente.rh@empresa.com'
  ],
  
  // Configurações de horário
  schedule: {
    dailyAlert: '07:00', // Horário do alerta diário
    reminderMinutes: 15, // Minutos antes da entrevista para enviar lembrete
  },
  
  // Configurações de email
  email: {
    from: 'Sirius System <noreply@siriusos.com>',
    subjectPrefix: '[Sirius System] ',
  },
  
  // Configurações de notificação
  notifications: {
    enableDailyAlert: true,    // Habilitar alerta diário às 7:00
    enableReminder: true,      // Habilitar lembrete 15 min antes
    enableLogging: true,       // Habilitar logs detalhados
  }
};

// Função para obter todos os emails de destino
const getAllRecipientEmails = () => {
  const emails = [interviewEmailConfig.primaryEmail];
  return emails.concat(interviewEmailConfig.additionalEmails);
};

// Função para obter configuração
const getConfig = () => {
  return interviewEmailConfig;
};

module.exports = {
  interviewEmailConfig,
  getAllRecipientEmails,
  getConfig
}; 