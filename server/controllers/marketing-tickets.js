// server/controllers/marketing-tickets.js
const path = require('path');
const fs = require('fs');
const { executeQuery } = require('../connect/mysql');
const { sendEmail } = require('../support/send-email');
const { marketingTicketTemplate, marketingTicketInfoBlock, marketingTicketChatBlock, getStatusUpdateMessage } = require('../support/emails-template');

// Sistema de agendamento de e-mails para comentários
class CommentEmailScheduler {
    constructor() {
        this.pendingEmails = new Map(); // Map para armazenar e-mails pendentes por ticket
        this.batchInterval = 60000; // 60 segundos (1 minuto)
        this.maxBatchSize = 10; // Máximo de e-mails por lote
        this.maxRetryAttempts = 3; // Máximo de tentativas de retry
        this.retryDelay = 30000; // 30 segundos entre tentativas
        this.isProcessing = false;
        
        // Iniciar o processamento em lote
        this.startBatchProcessing();
    }
    
    // Adicionar e-mail para agendamento
    addEmailToBatch(ticketId, emailData) {
        if (!this.pendingEmails.has(ticketId)) {
            this.pendingEmails.set(ticketId, []);
        }
        
        const ticketEmails = this.pendingEmails.get(ticketId);
        ticketEmails.push(emailData);
        
        console.log(`E-mail agendado para ticket ${ticketId}. Total pendente: ${ticketEmails.length}`);
        
        // Se atingir o limite de e-mails por ticket, processar imediatamente
        if (ticketEmails.length >= this.maxBatchSize) {
            this.processBatchForTicket(ticketId);
        }
    }
    
    // Processar lote para um ticket específico
    async processBatchForTicket(ticketId, retryCount = 0) {
        const ticketEmails = this.pendingEmails.get(ticketId);
        if (!ticketEmails || ticketEmails.length === 0) return;
        
        console.log(`Processando lote de ${ticketEmails.length} e-mails para ticket ${ticketId}${retryCount > 0 ? ` (tentativa ${retryCount})` : ''}`);
        
        try {
            // Agrupar e-mails por destinatário
            const emailsByRecipient = new Map();
            
            ticketEmails.forEach(emailData => {
                const { recipientEmail, recipientName, authorName, message, ticketId } = emailData;
                
                if (!emailsByRecipient.has(recipientEmail)) {
                    emailsByRecipient.set(recipientEmail, {
                        recipientName,
                        comments: []
                    });
                }
                
                emailsByRecipient.get(recipientEmail).comments.push({
                    authorName,
                    message,
                    timestamp: new Date()
                });
            });
            
            // Enviar e-mails agrupados
            for (const [email, data] of emailsByRecipient) {
                try {
                    const htmlContent = await this.generateBatchEmailContent(data, ticketId);
                    await sendEmail(email, `Novos Comentários - Chamado #${ticketId}`, htmlContent);
                    console.log(`E-mail de lote enviado para ${email} com ${data.comments.length} comentários`);
                } catch (emailError) {
                    console.error(`Erro ao enviar email para ${email}:`, emailError);
                    
                    // Se ainda não excedeu o limite de tentativas, re-agenda para retry
                    if (retryCount < this.maxRetryAttempts) {
                        console.log(`Re-agendando e-mails do ticket ${ticketId} para retry em ${this.retryDelay/1000} segundos (tentativa ${retryCount + 1}/${this.maxRetryAttempts})`);
                        setTimeout(() => {
                            this.processBatchForTicket(ticketId, retryCount + 1);
                        }, this.retryDelay);
                        return; // Sai sem limpar a fila
                    } else {
                        console.error(`Máximo de tentativas excedido para ticket ${ticketId}. E-mails descartados.`);
                        // Limpa a fila após esgotar todas as tentativas
                        this.pendingEmails.delete(ticketId);
                        return;
                    }
                }
            }
            
            // Limpar e-mails processados apenas se todos foram enviados com sucesso
            this.pendingEmails.delete(ticketId);
            console.log(`Lote de e-mails do ticket ${ticketId} processado com sucesso`);
            
        } catch (error) {
            console.error('Erro ao processar lote de e-mails:', error);
            
            // Se ainda não excedeu o limite de tentativas, re-agenda para retry
            if (retryCount < this.maxRetryAttempts) {
                console.log(`Re-agendando e-mails do ticket ${ticketId} para retry em ${this.retryDelay/1000} segundos (tentativa ${retryCount + 1}/${this.maxRetryAttempts})`);
                setTimeout(() => {
                    this.processBatchForTicket(ticketId, retryCount + 1);
                }, this.retryDelay);
            } else {
                console.error(`Máximo de tentativas excedido para ticket ${ticketId}. E-mails descartados.`);
                this.pendingEmails.delete(ticketId);
            }
        }
    }
    
    // Gerar conteúdo HTML para e-mail em lote
    async generateBatchEmailContent(data, ticketId) {
        const { recipientName } = data;
        // Buscar dados completos do chamado e histórico de comentários
        const { ticket, comments } = await getTicketFullInfo(ticketId);
        const content = marketingTicketInfoBlock(ticket) + marketingTicketChatBlock(comments);
        const htmlContent = marketingTicketTemplate({
            title: 'Histórico de Mensagens do Chamado',
            subtitle: `Olá ${recipientName}, veja o histórico de mensagens do chamado #${ticketId}`,
            content,
            footer: 'Responda pelo sistema para manter o histórico.'
        });
        return htmlContent;
    }
    
    // Processar todos os lotes pendentes
    async processAllBatches() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        // console.log('Iniciando processamento de lotes de e-mails...');
        
        try {
            for (const [ticketId] of this.pendingEmails) {
                await this.processBatchForTicket(ticketId);
            }
        } catch (error) {
            console.error('Erro ao processar lotes de e-mails:', error);
        } finally {
            this.isProcessing = false;
        }
    }
    
    // Iniciar processamento em lote
    startBatchProcessing() {
        setInterval(() => {
            this.processAllBatches();
        }, this.batchInterval);
        
        console.log('Sistema de agendamento de e-mails iniciado (intervalo: 60s)');
    }
    
    // Forçar processamento de lotes (para testes e situações específicas)
    async forceProcessBatches() {
        console.log('Forçando processamento de lotes de e-mails...');
        await this.processAllBatches();
    }
    
    // Obter estatísticas dos lotes pendentes
    getBatchStats() {
        const stats = {
            totalTickets: this.pendingEmails.size,
            totalEmails: 0,
            tickets: [],
            config: {
                maxRetryAttempts: this.maxRetryAttempts,
                retryDelay: this.retryDelay,
                batchInterval: this.batchInterval,
                maxBatchSize: this.maxBatchSize
            }
        };
        
        for (const [ticketId, emails] of this.pendingEmails) {
            stats.totalEmails += emails.length;
            stats.tickets.push({
                ticketId,
                emailCount: emails.length
            });
        }
        
        return stats;
    }
    
    // Método para visualizar configurações de retry
    getRetryConfig() {
        return {
            maxRetryAttempts: this.maxRetryAttempts,
            retryDelay: this.retryDelay,
            retryDelaySeconds: this.retryDelay / 1000
        };
    }
}

// Instância global do agendador
const commentEmailScheduler = new CommentEmailScheduler();

// Função auxiliar para obter o ID do usuário a partir do header x-user
const getUserIdFromHeader = (req) => {
    try {
        if (req.headers['x-user']) {
            const user = JSON.parse(req.headers['x-user']);
 
            // O objeto do usuário no header deve conter o ID do usuário logado
            if (user && user.system_userID) {
                return user.system_userID;
            }
        }
    } catch (error) {
        console.error('Falha ao analisar o cabeçalho x-user para obter o ID do usuário:', error);
    }
    
};

// Buscar dados completos do chamado e histórico de mensagens
async function getTicketFullInfo(ticketId) {
    const ticketArr = await executeQuery(
        `SELECT t.*, 
            CONCAT(cu.name, ' ', cu.family_name) as requester_name, 
            cu.email_business as requester_email,
            CONCAT(cr.name, ' ', cr.family_name) as responsible_name,
            cr.email_business as responsible_email
        FROM marketing_tickets t
        LEFT JOIN users u ON t.requester_id = u.id
        LEFT JOIN collaborators cu ON u.collaborator_id = cu.id
        LEFT JOIN users r ON t.responsible_id = r.id
        LEFT JOIN collaborators cr ON r.collaborator_id = cr.id
        WHERE t.id = ?`,
        [ticketId]
    );
    const ticket = ticketArr[0];
    // Envolvidos
    const involved = await executeQuery(
        `SELECT u.id, CONCAT(c.name, ' ', c.family_name) as name 
        FROM marketing_ticket_involved i 
        JOIN users u ON i.user_id = u.id 
        JOIN collaborators c ON u.collaborator_id = c.id 
        WHERE i.ticket_id = ?`, [ticketId]
    );
    ticket.involved_names = involved.map(i => i.name);
    // Comentários
    const comments = await executeQuery(
        `SELECT c.*, CONCAT(collab.name, ' ', collab.family_name) as author_name 
         FROM marketing_ticket_comments c 
         JOIN users u ON c.user_id = u.id 
         JOIN collaborators collab ON u.collaborator_id = collab.id 
         WHERE c.ticket_id = ? 
         ORDER BY c.created_at`, [ticketId]
    );
    return { ticket, comments };
}

// Esqueleto do controller de chamados de marketing
const MarketingTicketsController = {
    // Buscar usuários para o Select2
    async getUsers(req, res) {
        try {
            const { search = '' } = req.query;
            
            // Usar a mesma query do patrimony-tracker para buscar colaboradores
            const usersQuery = `
                SELECT 
                    u.id, 
                    CONCAT(c.name, ' ', c.family_name) as full_name, 
                    c.email_business as email
                FROM users u
                JOIN collaborators c ON u.collaborator_id = c.id
                WHERE c.resignation_date IS NULL
                AND (c.name LIKE ? OR c.family_name LIKE ? OR c.email_business LIKE ?)
                GROUP BY u.id, full_name, c.email_business
                ORDER BY full_name
            `;
            
            const result = await executeQuery(usersQuery, [`%${search}%`, `%${search}%`, `%${search}%`]);
            
            res.json(result);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
    },
    
    // Listar chamados
    async list(req, res) {
        try {
            const { keyword = '', type = '', status = '', responsible = '', requester = '' } = req.query;
            let sql = `SELECT t.*, 
                CONCAT(cu.name, ' ', cu.family_name) as requester_name, 
                cu.id_headcargo as requester_id_headcargo, 
                CONCAT(cr.name, ' ', cr.family_name) as responsible_name, 
                cr.id_headcargo as responsible_id_headcargo,
                (SELECT COUNT(*) FROM marketing_ticket_attachments WHERE ticket_id = t.id) as attachments_count,
                (SELECT COUNT(*) FROM marketing_ticket_comments WHERE ticket_id = t.id) as comments_count
                FROM marketing_tickets t
                LEFT JOIN users u ON t.requester_id = u.id
                LEFT JOIN collaborators cu ON u.collaborator_id = cu.id
                LEFT JOIN users r ON t.responsible_id = r.id
                LEFT JOIN collaborators cr ON r.collaborator_id = cr.id
                WHERE 1=1`;
            const params = [];
            if (keyword) {
                sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
                params.push(`%${keyword}%`, `%${keyword}%`);
            }
            if (type) {
                sql += ' AND t.type = ?';
                params.push(type);
            }
            if (status) {
                sql += ' AND t.status = ?';
                params.push(status);
            }
            if (responsible) {
                sql += ' AND t.responsible_id = ?';
                params.push(responsible);
            }
            if (requester) {
                sql += ' AND t.requester_id = ?';
                params.push(requester);
            }
            sql += ' ORDER BY t.status, t.kanban_order ASC, t.created_at DESC';
            const rows = await executeQuery(sql, params);
            res.json(rows);
        } catch (err) {
            console.error('ERRO DETALHADO AO LISTAR CHAMADOS:', err);
            res.status(500).json({ success: false, message: 'Erro ao listar chamados', error: err.message, stack: err.stack });
        }
    },
    // Criar chamado
    async create(req, res) {
        try {
            const {
                title, type, other_type, category, description, dimensions, links, involved = []
            } = req.body;
            
            // Buscar o usuário logado usando a função auxiliar
            const requester_id = getUserIdFromHeader(req);
            
            // Inserir chamado (sem datas de início/fim - serão definidas pelo time de marketing)
            const result = await executeQuery(
                `INSERT INTO marketing_tickets (title, type, other_type, category, description, dimensions, links, requester_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, type, other_type, category, description, dimensions, links, requester_id]
            );
            const ticketId = result.insertId || (result[0] && result[0].insertId);
            
            // Salvar anexos
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await executeQuery(
                        `INSERT INTO marketing_ticket_attachments (ticket_id, user_id, filename, filepath) VALUES (?, ?, ?, ?)`,
                        [ticketId, requester_id, file.filename, file.path]
                    );
                }
            }
            
            // Salvar envolvidos
            let envolvidos = Array.isArray(involved) ? involved : (involved ? [involved] : []);
            for (const userId of envolvidos) {
                await executeQuery(
                    `INSERT INTO marketing_ticket_involved (ticket_id, user_id) VALUES (?, ?)`,
                    [ticketId, userId]
                );
            }
            
            // Buscar dados do solicitante para o e-mail
            const solicitante = await executeQuery(
                `SELECT CONCAT(c.name, ' ', c.family_name) as full_name, c.email_business 
                FROM users u 
                JOIN collaborators c ON u.collaborator_id = c.id 
                WHERE u.id = ?`, [requester_id]
            );
            const solicitanteNome = solicitante[0]?.full_name || 'Usuário';
            const solicitanteEmail = solicitante[0]?.email_business;
            
            // Enviar e-mail de confirmação para o solicitante (sem await para não bloquear)
            if (solicitanteEmail) {
                const { ticket, comments } = await getTicketFullInfo(ticketId);
                const content = marketingTicketInfoBlock(ticket) + marketingTicketChatBlock(comments);
                const htmlContent = marketingTicketTemplate({
                    title: 'Chamado de Marketing Criado com Sucesso',
                    subtitle: `Olá, ${solicitanteNome}!` ,
                    content,
                    footer: 'Em caso de dúvidas, entre em contato com o time de marketing.'
                });
                sendEmail(solicitanteEmail, 'Chamado de Marketing Criado', htmlContent)
                    .then(result => {
                        if (!result.success) {
                            console.error('Erro ao enviar e-mail de confirmação:', result.error);
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao enviar e-mail de confirmação:', error);
                    });
            }
            
            // Enviar e-mail de notificação para o time de marketing (sem await)
            const marketingEmail = 'marketing@conlinebr.com.br'; // E-mail do time de marketing
            const { ticket: ticketMkt, comments: commentsMkt } = await getTicketFullInfo(ticketId);
            const contentMkt = marketingTicketInfoBlock(ticketMkt) + marketingTicketChatBlock(commentsMkt);
            const marketingHtmlContent = marketingTicketTemplate({
                title: 'Novo Chamado de Marketing',
                subtitle: `Solicitante: ${solicitanteNome}`,
                content: contentMkt,
                footer: 'Acesse o sistema para mais detalhes.'
            });
            
            sendEmail(marketingEmail, 'Novo Chamado de Marketing', marketingHtmlContent)
                .then(result => {
                    if (!result.success) {
                        console.error('Erro ao enviar e-mail para marketing:', result.error);
                    }
                })
                .catch(error => {
                    console.error('Erro ao enviar e-mail para marketing:', error);
                });
            
            // Emitir via socket.io (se disponível)
            if (req.io) {
                req.io.emit('ticketCreated', {
                    ticket_id: ticketId,
                    title: title,
                    type: type,
                    category: category
                });
            }
            
            res.json({ success: true, id: ticketId });
        } catch (err) {
            console.error('ERRO DETALHADO AO CRIAR CHAMADO:', err);
            res.status(500).json({ success: false, message: 'Erro ao criar chamado', error: err.message, stack: err.stack });
        }
    },
    // Detalhes do chamado
    async get(req, res) {
        try {
            const ticketId = req.params.id;
            const ticketArr = await executeQuery(
                `SELECT t.*, 
                    CONCAT(cu.name, ' ', cu.family_name) as requester_name, 
                    CONCAT(cr.name, ' ', cr.family_name) as responsible_name 
                FROM marketing_tickets t
                LEFT JOIN users u ON t.requester_id = u.id
                LEFT JOIN collaborators cu ON u.collaborator_id = cu.id
                LEFT JOIN users r ON t.responsible_id = r.id
                LEFT JOIN collaborators cr ON r.collaborator_id = cr.id
                WHERE t.id = ?`,
                [ticketId]
            );
            const ticket = ticketArr[0];
            if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado' });
            
            // console.log('Dados do ticket retornados:', ticket);
            // console.log('Campo type do ticket:', ticket.type);
            // console.log('Tipo do campo type:', typeof ticket.type);
            
            // Anexos
            const attachments = await executeQuery(
                `SELECT id, filename, filepath FROM marketing_ticket_attachments WHERE ticket_id = ?`, [ticketId]
            );
            ticket.attachments = attachments;
            
            // Envolvidos
            const involved = await executeQuery(
                `SELECT u.id, CONCAT(c.name, ' ', c.family_name) as name 
                FROM marketing_ticket_involved i 
                JOIN users u ON i.user_id = u.id 
                JOIN collaborators c ON u.collaborator_id = c.id 
                WHERE i.ticket_id = ?`, [ticketId]
            );
            ticket.involved_names = involved.map(i => i.name);
            ticket.involved_ids = involved.map(i => i.id).join(',');
            
            // Timeline (exemplo: comentários + status)
            const timeline = await executeQuery(
                `SELECT c.created_at as date, CONCAT(collab.name, ' ', collab.family_name) as user, c.message as action 
                FROM marketing_ticket_comments c 
                JOIN users u ON c.user_id = u.id 
                JOIN collaborators collab ON u.collaborator_id = collab.id 
                WHERE c.ticket_id = ? 
                ORDER BY c.created_at`, [ticketId]
            );
            ticket.timeline = timeline;
            
            res.json(ticket);
        } catch (err) {
            console.error('ERRO DETALHADO AO BUSCAR CHAMADO:', err);
            res.status(500).json({ success: false, message: 'Erro ao buscar chamado', error: err.message, stack: err.stack });
        }
    },
    // Listar comentários
    async listComments(req, res) {
        try {
            const ticketId = req.params.id;
            const userId = getUserIdFromHeader(req);
            
            const comments = await executeQuery(
                `SELECT c.*, CONCAT(collab.name, ' ', collab.family_name) as author_name 
                FROM marketing_ticket_comments c 
                JOIN users u ON c.user_id = u.id 
                JOIN collaborators collab ON u.collaborator_id = collab.id 
                WHERE c.ticket_id = ? 
                ORDER BY c.created_at`, [ticketId]
            );
            
            // Adicionar flag is_own para cada comentário
            const commentsWithOwn = comments.map(c => ({
                id: c.id,
                content: c.message,
                author_name: c.author_name,
                created_at: c.created_at,
                is_own: c.user_id == userId
            }));
            
            res.json(commentsWithOwn);
        } catch (err) {
            console.error('ERRO DETALHADO AO LISTAR COMENTÁRIOS:', err);
            res.status(500).json({ success: false, message: 'Erro ao listar comentários', error: err.message, stack: err.stack });
        }
    },
    // Adicionar comentário
    async addComment(req, res) {
        try {
            const ticketId = req.params.id;
            const { message, type = 'publico' } = req.body;
            const user_id = getUserIdFromHeader(req);
            
            // Buscar status e responsável do chamado
            const ticketInfoArr = await executeQuery(
                `SELECT status, responsible_id FROM marketing_tickets WHERE id = ?`, [ticketId]
            );
            const ticketInfo = ticketInfoArr[0];
            const statusAtual = ticketInfo?.status;
            const responsibleId = ticketInfo?.responsible_id;
            
            // Debug: Log dos dados recebidos
            console.log('Dados recebidos no addComment:', { message, type, user_id, ticketId, statusAtual, responsibleId });
            
            // Validar se a mensagem não está vazia
            if (!message || message.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'A mensagem não pode estar vazia' 
                });
            }
            
            await executeQuery(
                `INSERT INTO marketing_ticket_comments (ticket_id, user_id, message, type) VALUES (?, ?, ?, ?)`,
                [ticketId, user_id, message.trim(), type]
            );
            
            // Buscar nome do autor do comentário
            const autor = await executeQuery(
                `SELECT CONCAT(c.name, ' ', c.family_name) as full_name, c.email_business 
                FROM users u 
                JOIN collaborators c ON u.collaborator_id = c.id 
                WHERE u.id = ?`, [user_id]
            );
            const autorNome = autor[0]?.full_name || 'Usuário';
            
            // Lógica de notificação
            let destinatarios = [];
            if (statusAtual === 'Aguardando validação' && user_id !== responsibleId) {
                // Só notificar o responsável
                if (responsibleId) {
                    const resp = await executeQuery(
                        `SELECT c.email_business as email, CONCAT(c.name, ' ', c.family_name) as full_name 
                        FROM users u 
                        JOIN collaborators c ON u.collaborator_id = c.id 
                        WHERE u.id = ?`, [responsibleId]
                    );
                    if (resp[0] && resp[0].email) {
                        destinatarios.push(resp[0]);
                    }
                }
            } else {
                // Notificar todos os envolvidos e solicitante
                destinatarios = await executeQuery(
                    `SELECT DISTINCT c.email_business as email, CONCAT(c.name, ' ', c.family_name) as full_name 
                    FROM marketing_ticket_involved i 
                    JOIN users u ON i.user_id = u.id 
                    JOIN collaborators c ON u.collaborator_id = c.id 
                    WHERE i.ticket_id = ?
                    UNION 
                    SELECT c.email_business as email, CONCAT(c.name, ' ', c.family_name) as full_name 
                    FROM marketing_tickets t 
                    JOIN users u ON t.requester_id = u.id 
                    JOIN collaborators c ON u.collaborator_id = c.id 
                    WHERE t.id = ?`, [ticketId, ticketId]
                );
            }
            
            // Agendar e-mails de notificação
            if(destinatarios.length > 0){
                for (const env of destinatarios) {
                    if (env.email) {
                        const { ticket: ticketComment, comments: commentsComment } = await getTicketFullInfo(ticketId);
                        const contentComment = marketingTicketInfoBlock(ticketComment) + marketingTicketChatBlock(commentsComment);
                        const commentHtmlContent = marketingTicketTemplate({
                            title: 'Novo Comentário no Chamado de Marketing',
                            subtitle: `Chamado: #${ticketId}`,
                            content: contentComment,
                            footer: 'Responda pelo sistema para manter o histórico.'
                        });
                        commentEmailScheduler.addEmailToBatch(ticketId, {
                            recipientEmail: env.email,
                            recipientName: env.full_name,
                            authorName: autorNome,
                            message: commentHtmlContent,
                            ticketId: ticketId
                        });
                    }
                }
            }
            
            // Emitir via socket.io (se disponível)
            if (req.io) {
                req.io.emit('newComment', {
                    ticket_id: ticketId,
                    user: autorNome,
                    date: new Date(),
                    message
                });
            }
            
            res.json({ success: true });
        } catch (err) {
            console.error('ERRO DETALHADO AO ADICIONAR COMENTÁRIO:', err);
            res.status(500).json({ success: false, message: 'Erro ao adicionar comentário', error: err.message, stack: err.stack });
        }
    },
    // Upload de anexos adicionais
    async uploadAttachment(req, res) {
        try {
            const ticketId = req.params.id;
            const user_id = getUserIdFromHeader(req);
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await executeQuery(
                        `INSERT INTO marketing_ticket_attachments (ticket_id, user_id, filename, filepath) VALUES (?, ?, ?, ?)`,
                        [ticketId, user_id, file.filename, file.path]
                    );
                }
            }
            res.json({ success: true });
        } catch (err) {
            console.error('ERRO DETALHADO AO FAZER UPLOAD:', err);
            res.status(500).json({ success: false, message: 'Erro ao fazer upload', error: err.message, stack: err.stack });
        }
    },

    // Remover anexo específico
    async removeAttachment(req, res) {
        try {
            const attachmentId = req.params.attachmentId;
            const user_id = getUserIdFromHeader(req);
            
            // Buscar informações do anexo
            const attachment = await executeQuery(
                `SELECT * FROM marketing_ticket_attachments WHERE id = ?`,
                [attachmentId]
            );
            
            if (attachment.length === 0) {
                return res.status(404).json({ success: false, message: 'Anexo não encontrado' });
            }
            
            const attachmentData = attachment[0];
            
            // Verificar se o usuário tem permissão para remover o anexo
            // (pode ser o criador do anexo ou responsável pelo ticket)
            const ticket = await executeQuery(
                `SELECT requester_id, responsible_id FROM marketing_tickets WHERE id = ?`,
                [attachmentData.ticket_id]
            );
            
            if (ticket.length === 0) {
                return res.status(404).json({ success: false, message: 'Ticket não encontrado' });
            }
            
            const ticketData = ticket[0];
            const canRemove = user_id == attachmentData.user_id || 
                            user_id == ticketData.requester_id || 
                            user_id == ticketData.responsible_id;
            
            if (!canRemove) {
                return res.status(403).json({ success: false, message: 'Sem permissão para remover este anexo' });
            }
            
            // Remover arquivo físico se existir
            const fs = require('fs');
            if (fs.existsSync(attachmentData.filepath)) {
                fs.unlinkSync(attachmentData.filepath);
            }
            
            // Remover registro do banco
            await executeQuery(
                `DELETE FROM marketing_ticket_attachments WHERE id = ?`,
                [attachmentId]
            );
            
            res.json({ success: true, message: 'Anexo removido com sucesso' });
        } catch (err) {
            console.error('ERRO DETALHADO AO REMOVER ANEXO:', err);
            res.status(500).json({ success: false, message: 'Erro ao remover anexo', error: err.message, stack: err.stack });
        }
    },
    // Listar envolvidos
    async listInvolved(req, res) {
        try {
            const ticketId = req.params.id;
            const involved = await executeQuery(
                `SELECT c.id, CONCAT(c.name, ' ', c.family_name) as name 
                FROM marketing_ticket_involved i 
                JOIN users u ON i.user_id = u.id 
                JOIN collaborators c ON u.collaborator_id = c.id 
                WHERE i.ticket_id = ?`, [ticketId]
            );
            res.json(involved);
        } catch (err) {
            console.error('ERRO DETALHADO AO LISTAR ENVOLVIDOS:', err);
            res.status(500).json({ success: false, message: 'Erro ao listar envolvidos', error: err.message, stack: err.stack });
        }
    },
    // Adicionar envolvido
    async addInvolved(req, res) {
        try {
            const ticketId = req.params.id;
            const { user_id } = req.body;
            await executeQuery(
                `INSERT INTO marketing_ticket_involved (ticket_id, user_id) VALUES (?, ?)`,
                [ticketId, user_id]
            );
            res.json({ success: true });
        } catch (err) {
            console.error('ERRO DETALHADO AO ADICIONAR ENVOLVIDO:', err);
            res.status(500).json({ success: false, message: 'Erro ao adicionar envolvido', error: err.message, stack: err.stack });
        }
    },
    // Atualizar status do chamado (para o time de marketing)
    async updateStatus(req, res) {
        try {
            const ticketId = req.params.id;
            const { status, start_date, end_date, responsible_id } = req.body;
            const user_id = getUserIdFromHeader(req);
            
            let sql = 'UPDATE marketing_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP';
            let params = [status];
            
            // Tratar valores nulos corretamente
            const responsibleId = (responsible_id && responsible_id !== 'null' && responsible_id !== '') ? responsible_id : null;
            const startDate = (start_date && start_date !== '') ? start_date : null;
            const endDate = (end_date && end_date !== '') ? end_date : null;
            
            // Adicionar datas apenas se fornecidas (definidas pelo time de marketing)
            if (startDate) {
                sql += ', start_date = ?';
                params.push(startDate);
            }
            if (endDate) {
                sql += ', end_date = ?';
                params.push(endDate);
            }
            if (responsibleId) {
                sql += ', responsible_id = ?';
                params.push(responsibleId);
            }
            
            sql += ' WHERE id = ?';
            params.push(ticketId);
            
            await executeQuery(sql, params);
            
            // Buscar dados do chamado para notificação
            const { ticket: ticketStatus, comments: commentsStatus } = await getTicketFullInfo(ticketId);
            
            // Verificar se deve enviar e-mail baseado no status
            const shouldSendEmail = status !== 'Aguardando validação' && status !== 'Novo';
            
            if (shouldSendEmail) {
                // Gerar mensagem específica baseada no status
                const statusMessage = getStatusUpdateMessage(status, ticketStatus.title);
                const contentStatus = statusMessage.message + marketingTicketInfoBlock(ticketStatus) + marketingTicketChatBlock(commentsStatus);
                
                const htmlContent = marketingTicketTemplate({
                    title: statusMessage.title,
                    subtitle: statusMessage.subtitle,
                    content: contentStatus,
                    footer: 'Acompanhe o andamento do chamado pelo sistema.'
                });

                console.log('Enviando e-mail para status:', status);
                const destinatarioStatus = ticketStatus.responsible_email || ticketStatus.requester_email;
                if (ticketStatus && destinatarioStatus) {
                    sendEmail(destinatarioStatus, statusMessage.title, htmlContent)
                        .then(result => {
                            if (!result.success) {
                                console.error('Erro ao enviar e-mail de atualização:', result.error);
                            }
                        })
                        .catch(error => {
                            console.error('Erro ao enviar e-mail de atualização:', error);
                        });
                } else {
                    console.warn('Não foi possível enviar e-mail de status: destinatário não definido para o chamado', ticketId);
                }
            } else {
                if (status === 'Aguardando validação') {
                    console.log('E-mail não enviado para status "Aguardando validação"');
                } else if (status === 'Novo') {
                    console.log('E-mail não enviado para status "Novo" (e-mail de criação já foi enviado)');
                }
            }
            
            // Emitir via socket.io (se disponível)
            if (req.io) {
                req.io.emit('ticketUpdated', {
                    ticket_id: ticketId,
                    status: status,
                    title: ticketStatus?.title || 'Chamado',
                    type: 'status_update'
                });
            }
            
            res.json({ success: true });
        } catch (err) {
            console.error('ERRO DETALHADO AO ATUALIZAR STATUS:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao atualizar status', 
                error: err.message, 
                stack: err.stack 
            });
        }
    },

    // Atualizar chamado completo (para administradores)
    async update(req, res) {
        try {
            const ticketId = req.params.id;
            const {
                title, type, category, description, dimensions, links, 
                start_date, end_date, status, responsible_id, involved_ids = []
            } = req.body;
            
            // Debug: Log dos dados recebidos
            console.log('Dados recebidos no update:', {
                title, type, category, description, dimensions, links,
                start_date, end_date, status, responsible_id, involved_ids
            });
            
            // Atualizar dados principais
            let sql = `
                UPDATE marketing_tickets SET 
                    title = ?, type = ?, category = ?, description = ?, 
                    dimensions = ?, links = ?, start_date = ?, end_date = ?, 
                    status = ?, responsible_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            // Tratar valores nulos corretamente
            const responsibleId = (responsible_id && responsible_id !== 'null' && responsible_id !== '') ? responsible_id : null;
            const startDate = (start_date && start_date !== '') ? start_date : null;
            const endDate = (end_date && end_date !== '') ? end_date : null;
            
            // Debug: Log dos valores tratados
            console.log('Valores tratados:', {
                responsibleId, startDate, endDate,
                responsible_id_original: responsible_id,
                start_date_original: start_date,
                end_date_original: end_date
            });
            
            const params = [
                title, type, category, description, dimensions, links,
                startDate, endDate, status, responsibleId, ticketId
            ];
            
            // Debug: Log da query e parâmetros
            console.log('SQL Query:', sql);
            console.log('Parâmetros:', params);
            
            await executeQuery(sql, params);
            
            // Processar novos anexos se enviados
            if (req.files && req.files.length > 0) {
                const user_id = getUserIdFromHeader(req);
                for (const file of req.files) {
                    await executeQuery(
                        `INSERT INTO marketing_ticket_attachments (ticket_id, user_id, filename, filepath) VALUES (?, ?, ?, ?)`,
                        [ticketId, user_id, file.filename, file.path]
                    );
                }
                console.log(`${req.files.length} novos anexos adicionados ao ticket ${ticketId}`);
            }
            
            // Atualizar envolvidos
            if (involved_ids && Array.isArray(involved_ids) && involved_ids.length > 0) {
                // Remover envolvidos existentes
                await executeQuery('DELETE FROM marketing_ticket_involved WHERE ticket_id = ?', [ticketId]);
                
                // Adicionar novos envolvidos - filtrar IDs válidos
                const validUserIds = involved_ids.filter(userId => {
                    // Verificar se o ID é válido (não vazio, não null, é número)
                    return userId && userId !== '' && userId !== 'null' && !isNaN(parseInt(userId));
                });
                
                console.log('IDs de usuários válidos para envolvidos:', validUserIds);
                
                // Adicionar apenas IDs válidos
                for (const userId of validUserIds) {
                    try {
                        await executeQuery(
                            'INSERT INTO marketing_ticket_involved (ticket_id, user_id) VALUES (?, ?)',
                            [ticketId, parseInt(userId)]
                        );
                    } catch (error) {
                        console.error(`Erro ao adicionar envolvido ${userId}:`, error);
                        // Continuar com outros IDs mesmo se um falhar
                    }
                }
            }
            
            // Emitir via socket.io (se disponível)
            if (req.io) {
                req.io.emit('ticketUpdated', {
                    ticket_id: ticketId,
                    title: title,
                    status: status,
                    type: type
                });
            }
            
            res.json({ success: true });
        } catch (err) {
            console.error('Erro ao atualizar chamado:', err);
            res.status(500).json({ error: 'Erro ao atualizar chamado' });
        }
    },

    // Excluir chamado
    async delete(req, res) {
        try {
            const ticketId = req.params.id;
            
            // Buscar todos os anexos do chamado antes de excluir
            const attachments = await executeQuery(
                `SELECT filepath FROM marketing_ticket_attachments WHERE ticket_id = ?`,
                [ticketId]
            );
            
            // Remover arquivos físicos dos anexos
            const fs = require('fs');
            for (const attachment of attachments) {
                if (attachment.filepath && fs.existsSync(attachment.filepath)) {
                    try {
                        fs.unlinkSync(attachment.filepath);
                        console.log(`Arquivo removido com sucesso: ${attachment.filepath}`);
                    } catch (err) {
                        console.error(`Erro ao remover arquivo ${attachment.filepath}:`, err);
                        // Continuar mesmo se um arquivo falhar
                    }
                }
            }
            
            // Excluir envolvidos
            await executeQuery('DELETE FROM marketing_ticket_involved WHERE ticket_id = ?', [ticketId]);
            
            // Excluir comentários
            await executeQuery('DELETE FROM marketing_ticket_comments WHERE ticket_id = ?', [ticketId]);
            
            // Excluir anexos
            await executeQuery('DELETE FROM marketing_ticket_attachments WHERE ticket_id = ?', [ticketId]);
            
            // Excluir chamado
            await executeQuery('DELETE FROM marketing_tickets WHERE id = ?', [ticketId]);
            
            // Emitir via socket.io (se disponível)
            if (req.io) {
                req.io.emit('ticketDeleted', {
                    ticket_id: ticketId
                });
            }
            
            res.json({ success: true });
        } catch (err) {
            console.error('Erro ao excluir chamado:', err);
            res.status(500).json({ error: 'Erro ao excluir chamado' });
        }
    },

    // Buscar tipos de chamado
    async getTypes(req, res) {
        try {
            const sql = 'SELECT DISTINCT type FROM marketing_tickets WHERE type IS NOT NULL ORDER BY type';
            const rows = await executeQuery(sql);
            const types = rows.map(row => row.type);
            res.json(types);
        } catch (err) {
            console.error('Erro ao buscar tipos:', err);
            res.status(500).json({ error: 'Erro ao buscar tipos' });
        }
    },

    // Buscar status
    async getStatuses(req, res) {
        try {
            const sql = 'SELECT DISTINCT status FROM marketing_tickets WHERE status IS NOT NULL ORDER BY status';
            const rows = await executeQuery(sql);
            const statuses = rows.map(row => row.status);
            res.json(statuses);
        } catch (err) {
            console.error('Erro ao buscar status:', err);
            res.status(500).json({ error: 'Erro ao buscar status' });
        }
    },

    // Atualizar ordem dos cards no Kanban
    async updateKanbanOrder(req, res) {
        try {
            const { status, ids } = req.body;
            
            if (!status || !ids || !Array.isArray(ids)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Status e lista de IDs são obrigatórios' 
                });
            }
            
            // Atualizar a ordem de cada chamado na coluna
            for (let i = 0; i < ids.length; i++) {
                await executeQuery(
                    `UPDATE marketing_tickets SET kanban_order = ? WHERE id = ? AND status = ?`,
                    [i + 1, ids[i], status]
                );
            }
            
            // Emitir via socket.io (se disponível)
            if (req.io) {
                req.io.emit('ticketUpdated', {
                    type: 'kanban_order_update',
                    status: status,
                    ids: ids
                });
            }
            
            res.json({ success: true, message: 'Ordem do Kanban atualizada com sucesso' });
        } catch (err) {
            console.error('ERRO DETALHADO AO ATUALIZAR ORDEM DO KANBAN:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao atualizar ordem do Kanban', 
                error: err.message, 
                stack: err.stack 
            });
        }
    },

    // Listar chamados do colaborador
    async listCollaborator(req, res) {
        try {
            const userId = getUserIdFromHeader(req);
            if (!userId) {
                return res.status(401).json({ error: 'Usuário não identificado' });
            }

            const { keyword = '', type = '', status = '', role = '' } = req.query;
            
            let sql = `
                SELECT DISTINCT t.*, 
                    CONCAT(cu.name, ' ', cu.family_name) as requester_name, 
                    CONCAT(cr.name, ' ', cr.family_name) as responsible_name,
                    (SELECT COUNT(*) FROM marketing_ticket_attachments WHERE ticket_id = t.id) as attachments_count,
                    (SELECT COUNT(*) FROM marketing_ticket_comments WHERE ticket_id = t.id) as comments_count,
                    CASE 
                        WHEN t.requester_id = ? THEN 'requester'
                        WHEN t.responsible_id = ? THEN 'responsible'
                        WHEN i.user_id IS NOT NULL THEN 'involved'
                        ELSE 'other'
                    END as user_role
                FROM marketing_tickets t
                LEFT JOIN users u ON t.requester_id = u.id
                LEFT JOIN collaborators cu ON u.collaborator_id = cu.id
                LEFT JOIN users r ON t.responsible_id = r.id
                LEFT JOIN collaborators cr ON r.collaborator_id = cr.id
                LEFT JOIN marketing_ticket_involved i ON t.id = i.ticket_id AND i.user_id = ?
                WHERE (t.requester_id = ? OR t.responsible_id = ? OR i.user_id IS NOT NULL)
            `;
            
            const params = [userId, userId, userId, userId, userId];
            
            if (keyword) {
                sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
                params.push(`%${keyword}%`, `%${keyword}%`);
            }
            if (type) {
                sql += ' AND t.type = ?';
                params.push(type);
            }
            if (status) {
                sql += ' AND t.status = ?';
                params.push(status);
            }
            if (role) {
                switch(role) {
                    case 'requester':
                        sql += ' AND t.requester_id = ?';
                        params.push(userId);
                        break;
                    case 'responsible':
                        sql += ' AND t.responsible_id = ?';
                        params.push(userId);
                        break;
                    case 'involved':
                        sql += ' AND i.user_id IS NOT NULL';
                        break;
                }
            }

            
            sql += ' ORDER BY t.status, t.kanban_order ASC, t.created_at DESC';
            const rows = await executeQuery(sql, params);
            res.json(rows);
        } catch (err) {
            console.error('Erro ao listar chamados do colaborador:', err);
            res.status(500).json({ error: 'Erro ao listar chamados do colaborador' });
        }
    }
};

module.exports = {
    ...MarketingTicketsController,
    commentEmailScheduler
}; 