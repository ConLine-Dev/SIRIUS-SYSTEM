const { executeQuery } = require('../connect/mysql');

// Cache para configurações (evita consultas desnecessárias)
let configCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Buscar configuração do banco de dados
 * @param {string} key - Chave da configuração
 * @param {string} defaultValue - Valor padrão se não encontrado
 * @returns {Promise<string>} Valor da configuração
 */
async function getConfigValue(key, defaultValue = '') {
  try {
    const result = await executeQuery(
      'SELECT config_value FROM hr_interview_email_config WHERE config_key = ? AND is_active = 1',
      [key]
    );
    
    return result.length > 0 ? result[0].config_value : defaultValue;
  } catch (error) {
    console.error(`Erro ao buscar configuração ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Atualizar configuração no banco de dados
 * @param {string} key - Chave da configuração
 * @param {string} value - Novo valor
 * @param {string} description - Descrição da configuração
 * @returns {Promise<boolean>} Sucesso da operação
 */
async function updateConfigValue(key, value, description = null) {
  try {
    const updateData = [value, key];
    let sql = 'UPDATE hr_interview_email_config SET config_value = ?, updated_at = NOW() WHERE config_key = ?';
    
    if (description) {
      sql = 'UPDATE hr_interview_email_config SET config_value = ?, description = ?, updated_at = NOW() WHERE config_key = ?';
      updateData.splice(1, 0, description);
    }
    
    const result = await executeQuery(sql, updateData);
    
    // Invalidar cache
    configCache = null;
    lastCacheUpdate = null;
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Erro ao atualizar configuração ${key}:`, error);
    return false;
  }
}

/**
 * Buscar todas as configurações (com cache)
 * @returns {Promise<Object>} Objeto com todas as configurações
 */
async function getAllConfig() {
  const now = Date.now();
  
  // Verificar se o cache ainda é válido
  if (configCache && lastCacheUpdate && (now - lastCacheUpdate) < CACHE_DURATION) {
    return configCache;
  }
  
  try {
    const result = await executeQuery(
      'SELECT config_key, config_value, description FROM hr_interview_email_config WHERE is_active = 1'
    );
    
    const config = {};
    result.forEach(row => {
      config[row.config_key] = row.config_value;
    });
    
    // Atualizar cache
    configCache = config;
    lastCacheUpdate = now;
    
    return config;
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return {};
  }
}

/**
 * Buscar emails destinatários
 * @returns {Promise<Array>} Array de emails
 */
async function getRecipientEmails() {
  try {
    const emailsJson = await getConfigValue('recipient_emails', '["rh@conlinebr.com.br"]');
    return JSON.parse(emailsJson);
  } catch (error) {
    console.error('Erro ao buscar emails destinatários:', error);
    return ['rh@conlinebr.com.br'];
  }
}

/**
 * Atualizar emails destinatários
 * @param {Array} emails - Array de emails
 * @returns {Promise<boolean>} Sucesso da operação
 */
async function updateRecipientEmails(emails) {
  try {
    const emailsJson = JSON.stringify(emails);
    return await updateConfigValue('recipient_emails', emailsJson, 'Emails destinatários para alertas (JSON array)');
  } catch (error) {
    console.error('Erro ao atualizar emails destinatários:', error);
    return false;
  }
}

/**
 * Verificar se email diário está habilitado
 * @returns {Promise<boolean>} Status habilitado
 */
async function isDailyAlertEnabled() {
  const enabled = await getConfigValue('daily_alert_enabled', 'true');
  return enabled.toLowerCase() === 'true';
}

/**
 * Verificar se lembretes 15min estão habilitados
 * @returns {Promise<boolean>} Status habilitado
 */
async function isReminder15MinEnabled() {
  const enabled = await getConfigValue('reminder_15min_enabled', 'true');
  return enabled.toLowerCase() === 'true';
}

/**
 * Verificar se lembretes para candidatos estão habilitados
 * @returns {Promise<boolean>} Status habilitado
 */
async function isCandidateReminderEnabled() {
  const enabled = await getConfigValue('candidate_reminder_enabled', 'true');
  return enabled.toLowerCase() === 'true';
}

/**
 * Buscar horário do alerta diário
 * @returns {Promise<string>} Horário no formato HH:MM
 */
async function getDailyAlertTime() {
  return await getConfigValue('daily_alert_time', '07:00');
}

/**
 * Buscar intervalo de lembrete
 * @returns {Promise<number>} Intervalo em minutos
 */
async function getReminderInterval() {
  const interval = await getConfigValue('reminder_15min_interval', '15');
  return parseInt(interval) || 15;
}

/**
 * Buscar número máximo de tentativas
 * @returns {Promise<number>} Número máximo de tentativas
 */
async function getMaxRetries() {
  const maxRetries = await getConfigValue('max_retries', '3');
  return parseInt(maxRetries) || 3;
}

/**
 * Buscar intervalo entre tentativas
 * @returns {Promise<number>} Intervalo em minutos
 */
async function getRetryInterval() {
  const interval = await getConfigValue('retry_interval_minutes', '5');
  return parseInt(interval) || 5;
}

/**
 * Buscar prefixo do assunto
 * @returns {Promise<string>} Prefixo do assunto
 */
async function getSubjectPrefix() {
  return await getConfigValue('email_subject_prefix', '[CONLINE]');
}

/**
 * Buscar configuração completa
 * @returns {Promise<Object>} Objeto com todas as configurações
 */
async function getConfig() {
  const config = await getAllConfig();
  
  return {
    email: {
      subjectPrefix: config.email_subject_prefix || '[CONLINE]',
      recipientEmails: await getRecipientEmails()
    },
    dailyAlert: {
      enabled: await isDailyAlertEnabled(),
      time: await getDailyAlertTime()
    },
    reminder15Min: {
      enabled: await isReminder15MinEnabled(),
      interval: await getReminderInterval()
    },
    candidateReminder: {
      enabled: await isCandidateReminderEnabled()
    },
    retry: {
      maxRetries: await getMaxRetries(),
      intervalMinutes: await getRetryInterval()
    }
  };
}

// Funções de compatibilidade com o código existente
async function getAllRecipientEmails() {
  return await getRecipientEmails();
}

module.exports = {
  // Funções principais
  getConfigValue,
  updateConfigValue,
  getAllConfig,
  getConfig,
  
  // Funções específicas
  getRecipientEmails,
  updateRecipientEmails,
  isDailyAlertEnabled,
  isReminder15MinEnabled,
  isCandidateReminderEnabled,
  getDailyAlertTime,
  getReminderInterval,
  getMaxRetries,
  getRetryInterval,
  getSubjectPrefix,
  
  // Funções de compatibilidade
  getAllRecipientEmails
}; 