const express = require('express');
const router = express.Router();
const controller = require('../controllers/hr-job-openings');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Criar diretório se não existir
    const uploadDir = path.join(__dirname, '../../storageService/hr-job-openings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Permitir apenas certos tipos de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

// Middleware para capturar qualquer campo de arquivo
const uploadAny = upload.any();

module.exports = function(io){
  // Middleware para adicionar io ao req
  const addIoToReq = (req, res, next) => {
    req.io = io;
    next();
  };
  // Metadados para formulários/filtros (admin)
  router.get('/meta', controller.getMeta);
  
  // Rota para metadados (nova)
  router.get('/metadata', controller.getMeta);

  // Board de Vagas (página principal)
  router.get('/board', controller.getJobsBoard);
  router.post('/board/move', controller.updateJobStatus);

  // Admin - CRUD de vagas
  router.get('/', controller.listJobs);
  router.get('/:id', controller.getJobById);
  router.post('/', addIoToReq, controller.createJob);
  router.put('/:id', addIoToReq, controller.updateJob);
  router.delete('/:id', addIoToReq, controller.deleteJob);

  // Board de candidaturas (Kanban)
  router.get('/:jobId/applications/board', controller.getApplicationsBoard);
  router.get('/applications/:applicationId', controller.getApplicationById);
  router.put('/applications/:applicationId', addIoToReq, controller.updateApplication);
  router.delete('/applications/:applicationId', addIoToReq, controller.removeApplication);
  router.post('/applications/move', addIoToReq, controller.updateApplicationStatus);
  router.post('/applications', addIoToReq, controller.createApplicantAndApplication);
  router.post('/applications/:applicationId/notes', addIoToReq, controller.addInternalNote);
  router.delete('/applications/notes/:noteId', addIoToReq, controller.removeInternalNote);
  router.post('/applications/:applicationId/reassign', addIoToReq, controller.reassignApplication);

  // Anexos dos candidatos
  router.post('/applications/attachments/upload', uploadAny, controller.uploadAttachment);
  router.get('/attachments/:attachmentId', controller.serveAttachment);
  router.delete('/applications/attachments/:attachmentId', addIoToReq, controller.removeAttachment);
  
  // Rotas adicionais para o Banco de Talentos
  router.get('/applicants/:applicantId/attachments', controller.getApplicantAttachments);
  router.post('/applicants/:applicantId/attachments', uploadAny, addIoToReq, controller.uploadApplicantAttachment);
  router.delete('/attachments/:attachmentId', addIoToReq, controller.removeAttachment);
  router.get('/attachments/:attachmentId/download', controller.serveAttachment);
  router.get('/attachments/:attachmentId/view', controller.serveAttachment);
  router.get('/applications/:applicationId/notes', controller.getApplicationNotes);
  router.get('/candidates/:email/notes', controller.getCandidateAllNotes);
  router.post('/candidates/:email/notes', addIoToReq, controller.addCandidateNote);
  router.put('/applicants/:applicantId', addIoToReq, controller.updateApplicant);
  router.delete('/applicants/:applicantId', addIoToReq, controller.removeApplicant);
  router.put('/applications/:applicationId', addIoToReq, controller.updateApplication);

  // Rota para testar envio de email de alerta de entrevistas
  router.post('/send-interview-alert', controller.sendInterviewAlertEmail);

  // Configurações - CRUD para metadados
  router.get('/settings/:table', controller.getSettingsItems);
  router.post('/settings/:table', addIoToReq, controller.createSettingsItem);
  router.put('/settings/:table/:id', addIoToReq, controller.updateSettingsItem);
  router.delete('/settings/:table/:id', addIoToReq, controller.deleteSettingsItem);
  
  // Manutenção - Limpeza de anexos órfãos
  router.post('/maintenance/cleanup-orphaned-attachments', controller.cleanupOrphanedAttachments);

  // Públicos - listagem e detalhe por public_id
  router.get('/public/list', controller.getPublicList);
  router.get('/public/:public_id', controller.getPublicByPublicId);

  // Banco de Talentos
  router.get('/talent-bank/candidates', controller.getTalentBankCandidates);
  router.get('/talent-bank/stats', controller.getTalentBankStats);
  router.post('/talent-bank/export', controller.exportTalentBank);

  // Rotas para candidatos
  router.get('/candidates/:email/notes', controller.getCandidateAllNotes);
  router.post('/candidates/:email/notes', addIoToReq, controller.addCandidateNote);
  router.delete('/applicants/:applicantId', addIoToReq, controller.removeApplicant);

  // Rotas para aplicações específicas
  router.post('/applicants/:applicantId/reassign', addIoToReq, controller.reassignApplicant);

  // Rota para buscar candidaturas de um candidato específico
  router.get('/applicants/:applicantId/applications', controller.getApplicantApplications);

  // Rotas para testes de email de entrevista
  router.post('/test-interview-alert', async (req, res) => {
    try {
      const result = await controller.sendInterviewAlertEmail();
      res.json(result);
    } catch (error) {
      console.error('Erro no teste de alerta de entrevista:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao executar teste de alerta de entrevista',
        error: error.message 
      });
    }
  });

  router.post('/test-interview-reminder', async (req, res) => {
    try {
      const result = await controller.sendInterviewReminderEmail();
      res.json(result);
    } catch (error) {
      console.error('Erro no teste de lembrete de entrevista:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao executar teste de lembrete de entrevista',
        error: error.message 
      });
    }
  });

  // Rota para buscar entrevistas do dia
  router.get('/todays-interviews', async (req, res) => {
    try {
      const interviews = await controller.getTodaysInterviews();
      res.json({
        success: true,
        interviews: interviews,
        count: interviews.length
      });
    } catch (error) {
      console.error('Erro ao buscar entrevistas do dia:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar entrevistas do dia',
        error: error.message 
      });
    }
  });

  // Rota para buscar entrevistas próximas
  router.get('/upcoming-interviews', async (req, res) => {
    try {
      const interviews = await controller.getUpcomingInterviews();
      res.json({
        success: true,
        interviews: interviews,
        count: interviews.length
      });
    } catch (error) {
      console.error('Erro ao buscar entrevistas próximas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar entrevistas próximas',
        error: error.message 
      });
    }
  });

  // Endpoints para gerenciar configurações de email
  router.get('/email-config', async (req, res) => {
    try {
      const { getConfig } = require('../config/interview-email-config');
      const config = await getConfig();
      res.json({ success: true, config });
    } catch (error) {
      console.error('Erro ao buscar configurações de email:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  });

  router.put('/email-config', async (req, res) => {
    try {
      const { updateConfigValue } = require('../config/interview-email-config');
      const { key, value, description } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ success: false, message: 'Chave e valor são obrigatórios' });
      }
      
      const success = await updateConfigValue(key, value, description);
      
      if (success) {
        res.json({ success: true, message: 'Configuração atualizada com sucesso' });
      } else {
        res.status(400).json({ success: false, message: 'Erro ao atualizar configuração' });
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração de email:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  });

  // Endpoint para processar emails pendentes
  router.post('/process-pending-emails', async (req, res) => {
    try {
      const { InterviewEmailProcessor } = require('../scripts/process-interview-emails');
      const processor = new InterviewEmailProcessor();
      
      const result = await processor.processPendingEmails();
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Erro ao processar emails pendentes:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  });

  // Endpoint para estatísticas de emails
  router.get('/email-stats', async (req, res) => {
    try {
      const { InterviewEmailProcessor } = require('../scripts/process-interview-emails');
      const processor = new InterviewEmailProcessor();
      
      const stats = await processor.showStats();
      
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  });

  // Rotas para testes de email de candidatos
  router.post('/test-candidate-application-confirmation', async (req, res) => {
    try {
      const testData = {
        candidate_name: 'João Silva',
        candidate_email: 'petryck.leite@conlinebr.com.br',
        job_title: 'Desenvolvedor Backend Pleno',
        department_name: 'Tecnologia',
        application_date: new Date().toLocaleDateString('pt-BR'),
        application_id: '12345'
      };
      
      const result = await controller.sendCandidateApplicationConfirmation(testData);
      res.json(result);
    } catch (error) {
      console.error('Erro no teste de confirmação de candidatura:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao executar teste de confirmação de candidatura',
        error: error.message 
      });
    }
  });

  router.post('/test-candidate-interview-reminder', async (req, res) => {
    try {
      const testData = {
        candidate_name: 'João Silva',
        candidate_email: 'petryck.leite@conlinebr.com.br',
        job_title: 'Desenvolvedor Backend Pleno',
        department_name: 'Tecnologia',
        interview_date: new Date().toLocaleDateString('pt-BR'),
        interview_time: '14:30',
        minutes_until: 15
      };
      
      const result = await controller.sendCandidateInterviewReminder(testData);
      res.json(result);
    } catch (error) {
      console.error('Erro no teste de lembrete de entrevista para candidato:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao executar teste de lembrete de entrevista para candidato',
        error: error.message 
      });
    }
  });

  // Rota temporária para criar tabelas de templates
  router.post('/create-templates-tables', controller.createTemplatesTables);

  // Template Management Routes
  router.get('/templates/departments', controller.getAllDepartmentTemplates);
  router.get('/templates/departments/:departmentId', controller.getDepartmentTemplates);
  router.post('/templates/departments/:departmentId/responsibilities', addIoToReq, controller.saveDepartmentResponsibilities);
  router.post('/templates/departments/:departmentId/requirements', addIoToReq, controller.saveDepartmentRequirements);
  router.post('/templates/departments/:departmentId/benefits', addIoToReq, controller.saveDepartmentBenefits);
  router.post('/templates/departments/:departmentId/nice-to-have', addIoToReq, controller.saveDepartmentNiceToHave);
  
  // Global Template Routes
  router.get('/templates/global', controller.getGlobalTemplates);
  router.post('/templates/global', addIoToReq, controller.saveGlobalTemplates);

  // Email de Rejeição Routes
  router.post('/applicants/:applicantId/rejection-email', addIoToReq, controller.sendRejectionEmail);
  router.get('/jobs/active', controller.getActiveJobs);

  return router;
}; 