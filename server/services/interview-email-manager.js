const { executeQuery, executeTransaction } = require('../connect/mysql');
const { sendEmail } = require('../support/send-email');
const { hrCandidateTemplates } = require('../support/hr-candidate-templates');
const { 
  getRecipientEmails, 
  isDailyAlertEnabled, 
  isReminder15MinEnabled, 
  isCandidateReminderEnabled,
  getMaxRetries,
  getRetryInterval,
  getSubjectPrefix
} = require('../config/interview-email-config');

/**
 * Classe para gerenciar emails automáticos de entrevistas
 */
class InterviewEmailManager {
  
  /**
   * Registrar email para envio
   * @param {Object} emailData - Dados do email
   * @returns {Promise<number>} ID do registro criado
   */
  async registerEmail(emailData) {
    try {
      const {
        emailType,
        applicationId,
        interviewDate,
        candidateEmail,
        recipientEmails,
        subject,
        emailContent
      } = emailData;
      
      const result = await executeQuery(`
        INSERT INTO hr_interview_email_logs (
          email_type, application_id, interview_date, candidate_email,
          recipient_emails, subject, email_content, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        emailType,
        applicationId,
        interviewDate,
        candidateEmail,
        JSON.stringify(recipientEmails),
        subject,
        emailContent
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Erro ao registrar email:', error);
      throw error;
    }
  }
  
  /**
   * Buscar emails pendentes para envio
   * @returns {Promise<Array>} Lista de emails pendentes
   */
  async getPendingEmails() {
    try {
      const emails = await executeQuery(`
        SELECT * FROM hr_interview_email_logs 
        WHERE status = 'pending' 
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        ORDER BY created_at ASC
      `);
      
      return emails.map(email => ({
        ...email,
        recipient_emails: JSON.parse(email.recipient_emails || '[]')
      }));
    } catch (error) {
      console.error('Erro ao buscar emails pendentes:', error);
      return [];
    }
  }
  
  /**
   * Atualizar status do email
   * @param {number} emailId - ID do email
   * @param {string} status - Novo status
   * @param {string} errorMessage - Mensagem de erro (opcional)
   * @param {number} retryCount - Contador de tentativas (opcional)
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async updateEmailStatus(emailId, status, errorMessage = null, retryCount = null) {
    try {
      const updateData = [status, emailId];
      let sql = 'UPDATE hr_interview_email_logs SET status = ?, updated_at = NOW() WHERE id = ?';
      
      if (status === 'sent') {
        sql = 'UPDATE hr_interview_email_logs SET status = ?, sent_at = NOW(), updated_at = NOW() WHERE id = ?';
      } else if (status === 'failed') {
        const maxRetries = await getMaxRetries();
        const retryInterval = await getRetryInterval();
        
        if (retryCount < maxRetries) {
          // Agendar nova tentativa
          const nextRetryAt = new Date(Date.now() + (retryInterval * 60 * 1000));
          sql = `
            UPDATE hr_interview_email_logs 
            SET status = ?, error_message = ?, retry_count = ?, next_retry_at = ?, updated_at = NOW() 
            WHERE id = ?
          `;
          updateData.splice(1, 0, errorMessage, retryCount, nextRetryAt);
        } else {
          // Máximo de tentativas atingido
          sql = 'UPDATE hr_interview_email_logs SET status = ?, error_message = ?, updated_at = NOW() WHERE id = ?';
          updateData.splice(1, 0, errorMessage);
        }
      }
      
      const result = await executeQuery(sql, updateData);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao atualizar status do email:', error);
      return false;
    }
  }
  
  /**
   * Processar emails pendentes
   * @returns {Promise<Object>} Resultado do processamento
   */
  async processPendingEmails() {
    try {
      const pendingEmails = await this.getPendingEmails();
      
      if (pendingEmails.length === 0) {
        return { processed: 0, success: 0, failed: 0 };
      }
      
      console.log(`📧 Processando ${pendingEmails.length} emails pendentes...`);
      
      let success = 0;
      let failed = 0;
      
      for (const email of pendingEmails) {
        try {
          const sent = await this.sendEmail(email);
          
          if (sent) {
            await this.updateEmailStatus(email.id, 'sent');
            success++;
            console.log(`✅ Email enviado com sucesso: ${email.subject}`);
          } else {
            const retryCount = (email.retry_count || 0) + 1;
            await this.updateEmailStatus(email.id, 'failed', 'Falha no envio', retryCount);
            failed++;
            console.log(`❌ Falha no envio do email: ${email.subject}`);
          }
        } catch (error) {
          const retryCount = (email.retry_count || 0) + 1;
          await this.updateEmailStatus(email.id, 'failed', error.message, retryCount);
          failed++;
          console.error(`❌ Erro ao processar email ${email.id}:`, error);
        }
      }
      
      console.log(`📊 Processamento concluído: ${success} sucessos, ${failed} falhas`);
      
      return {
        processed: pendingEmails.length,
        success,
        failed
      };
    } catch (error) {
      console.error('Erro ao processar emails pendentes:', error);
      throw error;
    }
  }
  
  /**
   * Enviar email individual
   * @param {Object} emailData - Dados do email
   * @returns {Promise<boolean>} Sucesso do envio
   */
  async sendEmail(emailData) {
    try {
      const result = await sendEmail(
        emailData.candidate_email || emailData.recipient_emails[0],
        emailData.subject,
        emailData.email_content
      );
      
      return result.success;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }
  
  /**
   * Registrar email de alerta diário
   * @param {Array} interviews - Lista de entrevistas
   * @returns {Promise<number>} ID do registro
   */
  async registerDailyAlert(interviews) {
    try {
      if (!await isDailyAlertEnabled()) {
        console.log('⚠️ Email diário de alerta desabilitado');
        return null;
      }
      
      if (interviews.length === 0) {
        console.log('📅 Nenhuma entrevista hoje para alerta diário');
        return null;
      }
      
      const recipientEmails = await getRecipientEmails();
      const subjectPrefix = await getSubjectPrefix();
      const today = new Date().toLocaleDateString('pt-BR');
      
      // Gerar HTML do email
      const htmlContent = await hrCandidateTemplates.interviewAlertEmail.generate(interviews, today);
      
      // Verificar se já foi enviado hoje
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const existingEmail = await executeQuery(`
        SELECT id FROM hr_interview_email_logs 
        WHERE email_type = 'daily_alert' 
        AND DATE(interview_date) = CURDATE()
        AND status = 'sent'
        LIMIT 1
      `);
      
      if (existingEmail.length > 0) {
        console.log('📅 Email diário já foi enviado hoje');
        return existingEmail[0].id;
      }
      
      const emailId = await this.registerEmail({
        emailType: 'daily_alert',
        applicationId: null,
        interviewDate: todayStart,
        candidateEmail: null,
        recipientEmails,
        subject: `${subjectPrefix}📅 Alerta de Entrevistas - ${today}`,
        emailContent: htmlContent
      });
      
      console.log(`📧 Email diário registrado: ID ${emailId}`);
      return emailId;
    } catch (error) {
      console.error('Erro ao registrar email diário:', error);
      throw error;
    }
  }
  
  /**
   * Registrar lembretes 15 min antes (incluindo passadas sem email)
   * @param {Array} interviews - Lista de entrevistas próximas e passadas
   * @returns {Promise<Array>} IDs dos registros criados
   */
  async registerReminders(interviews) {
    try {
      if (!await isReminder15MinEnabled()) {
        console.log('⚠️ Lembretes 15min desabilitados');
        return [];
      }
      
      if (interviews.length === 0) {
        console.log('⏰ Nenhuma entrevista próxima ou passada para lembrete');
        return [];
      }
      
      const recipientEmails = await getRecipientEmails();
      const subjectPrefix = await getSubjectPrefix();
      const candidateReminderEnabled = await isCandidateReminderEnabled();
      const emailIds = [];
      
      for (const interview of interviews) {
        // VERIFICAÇÃO ROBUSTA: Usar DATE() para comparar apenas a data, não o horário exato
        const existingReminder = await executeQuery(`
          SELECT id, email_type, status, created_at, sent_at
          FROM hr_interview_email_logs 
          WHERE email_type IN ('reminder_15min', 'reminder_past')
          AND application_id = ?
          AND DATE(interview_date) = DATE(?)
          AND (
            status = 'sent' 
            OR (status = 'pending' AND created_at > DATE_SUB(NOW(), INTERVAL 2 HOUR))
          )
          ORDER BY created_at DESC
          LIMIT 1
        `, [interview.application_id, interview.interview_date]);
        
        if (existingReminder.length > 0) {
          const existing = existingReminder[0];
          console.log(`⏰ Lembrete já existe para: ${interview.candidate_name}`);
          console.log(`   ID: ${existing.id}, Status: ${existing.status}, Criado: ${existing.created_at}`);
          continue;
        }
        
        // Determinar o tipo de mensagem baseado no status da entrevista
        const minutesUntil = parseInt(interview.minutes_until);
        let timeMessage = '';
        let emailType = 'reminder_15min';
        
        if (minutesUntil >= 0) {
          // Entrevista futura
          timeMessage = `em ${minutesUntil} min`;
        } else {
          // Entrevista passada
          const minutesAgo = Math.abs(minutesUntil);
          timeMessage = `${minutesAgo} min atrás`;
          emailType = 'reminder_past'; // Tipo diferente para entrevistas passadas
        }
        
        console.log(`📧 Registrando lembrete para: ${interview.candidate_name} - ${interview.interview_time} (${timeMessage})`);
        
        // Gerar HTML do email
        const htmlContent = await hrCandidateTemplates.interviewReminderEmail.generate(interview);
        
        // Registrar lembrete para RH
        const rhEmailId = await this.registerEmail({
          emailType: emailType,
          applicationId: interview.application_id,
          interviewDate: interview.interview_date,
          candidateEmail: null,
          recipientEmails,
          subject: `${subjectPrefix}⏰ Lembrete: Entrevista ${timeMessage} - ${interview.candidate_name}`,
          emailContent: htmlContent
        });
        
        emailIds.push(rhEmailId);
        
        // Registrar lembrete para candidato se habilitado (apenas para entrevistas futuras)
        if (candidateReminderEnabled && minutesUntil >= 0) {
          const candidateHtmlContent = await hrCandidateTemplates.interviewReminder.generate(interview);
          
          const candidateEmailId = await this.registerEmail({
            emailType: 'reminder_candidate',
            applicationId: interview.application_id,
            interviewDate: interview.interview_date,
            candidateEmail: interview.candidate_email,
            recipientEmails: [interview.candidate_email],
            subject: `${subjectPrefix}⏰ Lembrete: Entrevista ${timeMessage} - ${interview.job_title}`,
            emailContent: candidateHtmlContent
          });
          
          emailIds.push(candidateEmailId);
        }
      }
      
      console.log(`📧 ${emailIds.length} lembretes registrados`);
      return emailIds;
    } catch (error) {
      console.error('Erro ao registrar lembretes:', error);
      throw error;
    }
  }
  
  /**
   * Limpar logs antigos
   * @param {number} daysToKeep - Número de dias para manter
   * @returns {Promise<number>} Número de registros removidos
   */
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const result = await executeQuery(`
        DELETE FROM hr_interview_email_logs 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND status IN ('sent', 'failed', 'skipped')
      `, [daysToKeep]);
      
      console.log(`🧹 ${result.affectedRows} logs antigos removidos`);
      return result.affectedRows;
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      return 0;
    }
  }
  
  /**
   * Obter estatísticas dos emails
   * @returns {Promise<Object>} Estatísticas
   */
  async getEmailStats() {
    try {
      const stats = await executeQuery(`
        SELECT 
          email_type,
          status,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM hr_interview_email_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY email_type, status, DATE(created_at)
        ORDER BY date DESC, email_type, status
      `);
      
      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return [];
    }
  }
}

module.exports = InterviewEmailManager; 