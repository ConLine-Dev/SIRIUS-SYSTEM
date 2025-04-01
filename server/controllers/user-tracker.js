/**
 * Controlador de Rastreamento de Usuários
 * Gerencia os dados de atividade dos usuários em tempo real
 */

const { executeQuery } = require('../connect/mysql');

// Armazena os usuários ativos em memória
const activeUsers = new Map();
// Armazena estatísticas de páginas
const pageStats = new Map();

const userTracker = {
    // Inicializa o tracker com Socket.io
    initialize: function(io) {
        this.io = io;
        this.setupSocketEvents();
        
        // Limpar usuários inativos a cada 5 minutos
        setInterval(() => this.cleanInactiveUsers(), 5 * 60 * 1000);
        
        // Salvar estatísticas no banco a cada 15 minutos
        // setInterval(() => this.saveStatsToDatabase(), 15 * 60 * 1000);
        
        // console.log('Sistema de rastreamento de usuários inicializado');
        return this;
    },
    
    // Configura eventos do Socket.io
    setupSocketEvents: function() {
        this.io.on('connection', (socket) => {
            // Evento de rastreamento de usuário
            socket.on('user:track', (data) => {
                this.handleUserTrack(socket.id, data);
            });
            
            // Evento de ping para manter usuário ativo
            socket.on('user:ping', (data) => {
                this.handleUserPing(socket.id, data);
            });
            
            // Evento de saída da página
            socket.on('user:leave', (data) => {
                this.handleUserLeave(socket.id, data);
            });
            
            // Evento de inatividade
            socket.on('user:inactive', (data) => {
                this.handleUserInactive(socket.id, data);
            });
            
            // Evento de desconexão
            socket.on('disconnect', () => {
                this.handleSocketDisconnect(socket.id);
            });
        });
    },
    
    // Processa evento de rastreamento de usuário
    handleUserTrack: function(socketId, data) {
        // Verificar se o usuário já estava ativo e em qual página
        const existingUser = activeUsers.get(socketId);
        const oldPage = existingUser?.page;
        const isRefresh = existingUser && oldPage && (oldPage.path === data.page.path);
        
        // Ignorar se não tiver dados de usuário
        if (!data.user || !data.user.id) {
            activeUsers.set(socketId, {
                socketId,
                sessionId: data.sessionId,
                anonymous: true,
                page: data.page,
                timestamp: isRefresh ? existingUser.timestamp : new Date(),
                lastActivity: new Date()
            });
            
            // Somente atualiza estatísticas se for nova página ou novo usuário
            if (!existingUser || (oldPage && (oldPage.path !== data.page.path))) {
                if (oldPage) {
                    this.decrementPageStats(oldPage);
                }
                this.updatePageStats(data.page);
            }
            return;
        }
        
        // Atualizar ou adicionar usuário ativo
        activeUsers.set(socketId, {
            socketId,
            sessionId: data.sessionId,
            userId: data.user.id,
            name: data.user.name,
            email: data.user.email,
            photo: data.user.photo,
            id_headcargo: data.user.id_headcargo,
            page: data.page,
            userAgent: data.userAgent,
            // Manter o timestamp original se for apenas um refresh da mesma página
            timestamp: isRefresh ? existingUser.timestamp : new Date(),
            lastActivity: new Date()
        });
        
        // Somente atualiza estatísticas se for nova página ou novo usuário
        if (!existingUser || (oldPage && (oldPage.path !== data.page.path))) {
            if (oldPage) {
                this.decrementPageStats(oldPage);
            }
            this.updatePageStats(data.page);
        }
        
        // Emitir evento de atualização para todos os clientes no módulo de rastreamento
        this.broadcastUserUpdate();
    },
    
    // Processa evento de ping
    handleUserPing: function(socketId, data) {
        const user = activeUsers.get(socketId);
        if (user) {
            user.lastActivity = new Date();
            activeUsers.set(socketId, user);
        }
    },
    
    // Processa evento de saída da página
    handleUserLeave: function(socketId, data) {
        const user = activeUsers.get(socketId);
        if (user && user.page) {
            this.decrementPageStats(user.page);
        }
        
        activeUsers.delete(socketId);
        this.broadcastUserUpdate();
    },
    
    // Processa evento de inatividade
    handleUserInactive: function(socketId, data) {
        const user = activeUsers.get(socketId);
        if (user) {
            user.inactive = true;
            user.inactiveTime = data.inactiveTime;
            activeUsers.set(socketId, user);
            this.broadcastUserUpdate();
        }
    },
    
    // Processa evento de desconexão do socket
    handleSocketDisconnect: function(socketId) {
        const user = activeUsers.get(socketId);
        if (user && user.page) {
            this.decrementPageStats(user.page);
        }
        
        activeUsers.delete(socketId);
        this.broadcastUserUpdate();
    },
    
    // Atualiza estatísticas da página
    updatePageStats: function(page) {
        if (!page || !page.title || !page.path) return;
        
        // Usar o caminho completo como chave para garantir unicidade
        const key = `${page.module}:${page.path}`;
        
        if (!pageStats.has(key)) {
            pageStats.set(key, {
                module: page.module,
                title: page.title,
                path: page.path,
                count: 1,
                views: 1
            });
        } else {
            const stats = pageStats.get(key);
            stats.count += 1;
            stats.views += 1;
            // Garantir que o título mais recente seja usado (pode mudar em algumas SPA)
            stats.title = page.title;
            pageStats.set(key, stats);
        }
    },
    
    // Decrementa estatísticas da página
    decrementPageStats: function(page) {
        if (!page || !page.title || !page.path) return;
        
        // Usar o caminho completo como chave para garantir unicidade
        const key = `${page.module}:${page.path}`;
        
        if (pageStats.has(key)) {
            const stats = pageStats.get(key);
            stats.count = Math.max(0, stats.count - 1);
            pageStats.set(key, stats);
        }
    },
    
    // Envia atualização para clientes no módulo de rastreamento
    broadcastUserUpdate: function() {
        this.io.emit('user-tracker:update', {
            activeUsers: this.getActiveUsersInfo(),
            pageStats: this.getPageStatsInfo(),
            userCount: this.getUserCount()
        });
    },
    
    // Limpa usuários inativos
    cleanInactiveUsers: function() {
        const now = new Date();
        
        for (const [socketId, user] of activeUsers.entries()) {
            // Remover se estiver inativo há mais de 30 minutos
            const inactiveTime = now - new Date(user.lastActivity);
            if (inactiveTime > 30 * 60 * 1000) {
                if (user.page) {
                    this.decrementPageStats(user.page);
                }
                activeUsers.delete(socketId);
            }
        }
        
        this.broadcastUserUpdate();
    },
    
    // Salva estatísticas no banco de dados
    saveStatsToDatabase: async function() {
        try {
            const timestamp = new Date();
            
            // Prepare page stats for saving
            for (const [key, stats] of pageStats.entries()) {
                await executeQuery(`
                    INSERT INTO user_tracking_page_stats 
                    (module, title, path, view_count, timestamp) 
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    stats.module,
                    stats.title,
                    stats.path,
                    stats.views,
                    timestamp
                ]);
                
                // Reset views counter after saving
                stats.views = 0;
                pageStats.set(key, stats);
            }
            
            console.log('Estatísticas de rastreamento salvas no banco de dados');
        } catch (error) {
            console.error('Erro ao salvar estatísticas de rastreamento:', error);
        }
    },
    
    // Retorna informações sobre usuários ativos
    getActiveUsersInfo: function() {
        const users = [];
        
        // Agrupar usuários pelo mesmo ID para contar número de sessões
        const userSessions = {};
        
        // Primeiro, agrupar todas as sessões pelo mesmo usuário
        for (const user of activeUsers.values()) {
            if (user.anonymous) continue;
            
            const userId = user.userId;
            if (!userId) continue;
            
            if (!userSessions[userId]) {
                userSessions[userId] = {
                    user: {
                        userId: user.userId,
                        name: user.name,
                        email: user.email,
                        photo: user.photo,
                        id_headcargo: user.id_headcargo,
                        page: user.page,
                        timestamp: user.timestamp,
                        lastActivity: user.lastActivity,
                        inactive: user.inactive || false
                    },
                    sessions: 1
                };
            } else {
                userSessions[userId].sessions++;
                
                // Atualizar com informação mais recente se necessário
                const currentTime = new Date(user.lastActivity);
                const existingTime = new Date(userSessions[userId].user.lastActivity);
                
                if (currentTime > existingTime) {
                    userSessions[userId].user.page = user.page;
                    userSessions[userId].user.lastActivity = user.lastActivity;
                    userSessions[userId].user.inactive = user.inactive || false;
                }
            }
        }
        
        // Converter para o formato final e adicionar contagem de sessões
        for (const userId in userSessions) {
            const userData = userSessions[userId];
            
            // Adicionar informação de contagem de sessões
            const userInfo = {
                ...userData.user,
                sessions: userData.sessions
            };
            
            users.push(userInfo);
        }
        
        return users;
    },
    
    // Retorna estatísticas de páginas
    getPageStatsInfo: function() {
        const stats = [];
        
        for (const pageData of pageStats.values()) {
            if (pageData.count > 0) {
                stats.push({
                    module: pageData.module,
                    title: pageData.title,
                    path: pageData.path,
                    count: pageData.count
                });
            }
        }
        
        return stats;
    },
    
    // ===== API Methods =====
    
    // Retorna todos os usuários ativos
    getAllActiveUsers: function() {
        return this.getActiveUsersInfo();
    },
    
    // Retorna usuários ativos por módulo
    getActiveUsersByModule: function(module) {
        return this.getActiveUsersInfo().filter(user => 
            user.page && user.page.module === module
        );
    },
    
    // Retorna estatísticas de todas as páginas
    getAllPageStats: function() {
        return this.getPageStatsInfo();
    },
    
    // Retorna estatísticas de páginas por módulo
    getPageStatsByModule: function(module) {
        return this.getPageStatsInfo().filter(stat => stat.module === module);
    },
    
    // Retorna contagens de usuários
    getUserCount: function() {
        let total = 0;
        let authenticated = 0;
        let anonymous = 0;
        let active = 0;
        
        // Maps para rastrear usuários únicos por ID
        const uniqueAuthUsers = new Set();
        const uniqueAnonUsers = new Set();
        const uniqueActiveUsers = new Set();
        
        for (const user of activeUsers.values()) {
            // Para usuários autenticados, usar userId como identificador único
            if (!user.anonymous && user.userId) {
                if (!uniqueAuthUsers.has(user.userId)) {
                    uniqueAuthUsers.add(user.userId);
                    authenticated++;
                }
                
                if (!user.inactive && !uniqueActiveUsers.has(user.userId)) {
                    uniqueActiveUsers.add(user.userId);
                    active++;
                }
            } 
            // Para usuários anônimos, usar sessionId como identificador único
            else if (user.anonymous && user.sessionId) {
                if (!uniqueAnonUsers.has(user.sessionId)) {
                    uniqueAnonUsers.add(user.sessionId);
                    anonymous++;
                }
                
                if (!user.inactive) {
                    // Para anônimos, ainda contamos cada sessão como ativa separadamente
                    active++;
                }
            }
        }
        
        total = authenticated + anonymous;
        
        return { total, authenticated, anonymous, active };
    },
    
    // Retorna todos os dados para o dashboard
    getDashboardData: function() {
        return {
            activeUsers: this.getActiveUsersInfo(),
            pageStats: this.getPageStatsInfo(),
            userCount: this.getUserCount(),
            timestamp: new Date()
        };
    }
};

module.exports = userTracker; 