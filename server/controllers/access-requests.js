const { executeQuery } = require('../connect/mysql');

const AccessRequestsController = {
    // Criar nova solicitação de acesso
    async create(req, res) {
        try {
            const {
                full_name,
                email,
                phone,
                company_name,
                cnpj,
                message
            } = req.body;

            // Validar campos obrigatórios
            if (!full_name || !email || !phone || !company_name || !cnpj) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos os campos obrigatórios devem ser preenchidos'
                });
            }

            // Validar formato do email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email inválido'
                });
            }

            // Validar formato do CNPJ (XX.XXX.XXX/XXXX-XX)
            const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
            if (!cnpjRegex.test(cnpj)) {
                return res.status(400).json({
                    success: false,
                    message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'
                });
            }

            // Verificar se já existe uma solicitação com este email
            const existingRequest = await executeQuery(
                'SELECT id FROM access_requests WHERE email = ?',
                [email]
            );

            if (existingRequest.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Já existe uma solicitação de acesso para este email'
                });
            }

            // Inserir solicitação
            const result = await executeQuery(
                `INSERT INTO access_requests (full_name, email, phone, company_name, cnpj, message) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [full_name, email, phone, company_name, cnpj, message || null]
            );

            const requestId = result.insertId;

            // Registrar no histórico
            await executeQuery(
                'INSERT INTO access_request_history (request_id, admin_id, action, details) VALUES (?, NULL, "created", ?)',
                [requestId, 'Solicitação criada pelo sistema']
            );

            res.json({
                success: true,
                message: 'Solicitação de acesso enviada com sucesso! Aguarde o contato da nossa equipe.',
                request_id: requestId
            });

        } catch (err) {
            console.error('Erro ao criar solicitação de acesso:', err);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },

    // Listar todas as solicitações (para administradores)
    async list(req, res) {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            
            let whereClause = '';
            let params = [];
            
            if (status && status !== 'all') {
                whereClause = 'WHERE ar.status = ?';
                params.push(status);
            }

            const offset = (page - 1) * limit;
            
            // Buscar solicitações com informações do admin e cliente
            const requests = await executeQuery(
                `SELECT ar.*, 
                        CONCAT(admin_collab.name, ' ', admin_collab.family_name) as admin_name,
                        CONCAT(client_collab.name, ' ', client_collab.family_name) as client_name,
                        client_collab.email_business as client_email
                 FROM access_requests ar
                 LEFT JOIN users admin_user ON ar.admin_id = admin_user.id
                 LEFT JOIN collaborators admin_collab ON admin_user.collaborator_id = admin_collab.id
                 LEFT JOIN users client_user ON ar.client_id = client_user.id
                 LEFT JOIN collaborators client_collab ON client_user.collaborator_id = client_collab.id
                 ${whereClause}
                 ORDER BY ar.created_at DESC
                 LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            // Contar total de solicitações
            const countResult = await executeQuery(
                `SELECT COUNT(*) as total FROM access_requests ar ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // Contar por status
            const statusCounts = await executeQuery(
                `SELECT status, COUNT(*) as count 
                 FROM access_requests 
                 GROUP BY status`
            );

            const statusCountsMap = {};
            statusCounts.forEach(item => {
                statusCountsMap[item.status] = item.count;
            });

            res.json({
                success: true,
                data: requests,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                status_counts: statusCountsMap
            });

        } catch (err) {
            console.error('Erro ao listar solicitações:', err);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },

    // Buscar detalhes de uma solicitação
    async get(req, res) {
        try {
            const requestId = req.params.id;

            const request = await executeQuery(
                `SELECT ar.*, 
                        CONCAT(admin_collab.name, ' ', admin_collab.family_name) as admin_name,
                        CONCAT(client_collab.name, ' ', client_collab.family_name) as client_name,
                        client_collab.email_business as client_email
                 FROM access_requests ar
                 LEFT JOIN users admin_user ON ar.admin_id = admin_user.id
                 LEFT JOIN collaborators admin_collab ON admin_user.collaborator_id = admin_collab.id
                 LEFT JOIN users client_user ON ar.client_id = client_user.id
                 LEFT JOIN collaborators client_collab ON client_user.collaborator_id = client_collab.id
                 WHERE ar.id = ?`,
                [requestId]
            );

            if (request.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitação não encontrada'
                });
            }

            // Buscar histórico da solicitação
            const history = await executeQuery(
                `SELECT arh.*, 
                        CONCAT(admin_collab.name, ' ', admin_collab.family_name) as admin_name
                 FROM access_request_history arh
                 LEFT JOIN users admin_user ON arh.admin_id = admin_user.id
                 LEFT JOIN collaborators admin_collab ON admin_user.collaborator_id = admin_collab.id
                 WHERE arh.request_id = ?
                 ORDER BY arh.created_at DESC`,
                [requestId]
            );

            res.json({
                success: true,
                data: {
                    ...request[0],
                    history
                }
            });

        } catch (err) {
            console.error('Erro ao buscar solicitação:', err);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },

    // Aprovar solicitação e vincular a cliente existente
    async approveAndLink(req, res) {
        try {
            const requestId = req.params.id;
            const { client_id, admin_notes } = req.body;
            const admin_id = req.user_id; // Assumindo que o middleware de auth define req.user_id

            if (!client_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do cliente é obrigatório'
                });
            }

            // Verificar se o cliente existe
            const client = await executeQuery(
                'SELECT id FROM users WHERE id = ?',
                [client_id]
            );

            if (client.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cliente não encontrado'
                });
            }

            // Atualizar solicitação
            await executeQuery(
                `UPDATE access_requests 
                 SET status = 'approved', admin_id = ?, client_id = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [admin_id, client_id, admin_notes || null, requestId]
            );

            // Registrar no histórico
            await executeQuery(
                'INSERT INTO access_request_history (request_id, admin_id, action, details) VALUES (?, ?, "linked_client", ?)',
                [requestId, admin_id, `Solicitação aprovada e vinculada ao cliente ID: ${client_id}`]
            );

            res.json({
                success: true,
                message: 'Solicitação aprovada e vinculada com sucesso'
            });

        } catch (err) {
            console.error('Erro ao aprovar solicitação:', err);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },

    // Aprovar solicitação e criar novo cliente
    async approveAndCreateClient(req, res) {
        try {
            const requestId = req.params.id;
            const { admin_notes } = req.body;
            const admin_id = req.user_id;

            // Buscar dados da solicitação
            const request = await executeQuery(
                'SELECT * FROM access_requests WHERE id = ?',
                [requestId]
            );

            if (request.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitação não encontrada'
                });
            }

            const requestData = request[0];

            // Criar novo colaborador
            const collaboratorResult = await executeQuery(
                `INSERT INTO collaborators (name, family_name, email_business, phone, company_name, cnpj) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    requestData.full_name.split(' ')[0], // Primeiro nome
                    requestData.full_name.split(' ').slice(1).join(' ') || '', // Sobrenome
                    requestData.email,
                    requestData.phone,
                    requestData.company_name,
                    requestData.cnpj
                ]
            );

            const collaboratorId = collaboratorResult.insertId;

            // Criar novo usuário
            const userResult = await executeQuery(
                `INSERT INTO users (collaborator_id, email, password, role) 
                 VALUES (?, ?, ?, 'client')`,
                [collaboratorId, requestData.email, 'temp_password_123'] // Senha temporária
            );

            const userId = userResult.insertId;

            // Atualizar solicitação
            await executeQuery(
                `UPDATE access_requests 
                 SET status = 'approved', admin_id = ?, client_id = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [admin_id, userId, admin_notes || null, requestId]
            );

            // Registrar no histórico
            await executeQuery(
                'INSERT INTO access_request_history (request_id, admin_id, action, details) VALUES (?, ?, "created_client", ?)',
                [requestId, admin_id, `Novo cliente criado - ID: ${userId}, Colaborador ID: ${collaboratorId}`]
            );

            res.json({
                success: true,
                message: 'Solicitação aprovada e novo cliente criado com sucesso',
                client_id: userId,
                collaborator_id: collaboratorId
            });

        } catch (err) {
            console.error('Erro ao aprovar e criar cliente:', err);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },

    // Rejeitar solicitação
    async reject(req, res) {
        try {
            const requestId = req.params.id;
            const { admin_notes } = req.body;
            const admin_id = req.user_id;

            if (!admin_notes) {
                return res.status(400).json({
                    success: false,
                    message: 'Motivo da rejeição é obrigatório'
                });
            }

            // Atualizar solicitação
            await executeQuery(
                `UPDATE access_requests 
                 SET status = 'rejected', admin_id = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [admin_id, admin_notes, requestId]
            );

            // Registrar no histórico
            await executeQuery(
                'INSERT INTO access_request_history (request_id, admin_id, action, details) VALUES (?, ?, "rejected", ?)',
                [requestId, admin_id, `Solicitação rejeitada: ${admin_notes}`]
            );

            res.json({
                success: true,
                message: 'Solicitação rejeitada com sucesso'
            });

        } catch (err) {
            console.error('Erro ao rejeitar solicitação:', err);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },

    // Buscar clientes para vincular
    async getClients(req, res) {
        try {
            const { search } = req.query;
            
            let whereClause = "WHERE u.role = 'client'";
            let params = [];
            
            if (search) {
                whereClause += " AND (c.name LIKE ? OR c.family_name LIKE ? OR c.email_business LIKE ? OR c.company_name LIKE ?)";
                const searchTerm = `%${search}%`;
                params = [searchTerm, searchTerm, searchTerm, searchTerm];
            }

            const clients = await executeQuery(
                `SELECT u.id, 
                        CONCAT(c.name, ' ', c.family_name) as full_name,
                        c.email_business,
                        c.company_name,
                        c.phone
                 FROM users u
                 JOIN collaborators c ON u.collaborator_id = c.id
                 ${whereClause}
                 ORDER BY c.name, c.family_name
                 LIMIT 50`,
                params
            );

            res.json({
                success: true,
                data: clients
            });

        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
};

module.exports = AccessRequestsController; 