/**
 * SIRIUS-SYSTEM - Módulo de Rastreamento de Usuários
 * 
 * Este arquivo rastreia automaticamente as atividades do usuário e envia
 * informações para o servidor em tempo real usando Socket.io.
 * 
 * TEMPORARIAMENTE DESATIVADO PARA ECONOMIZAR MEMÓRIA
 */

(function() {
    // Flag para ativar/desativar o rastreamento
    const TRACKING_ENABLED = false; // Desativado temporariamente
    
    // Se o rastreamento estiver desativado, não fazer nada
    if (!TRACKING_ENABLED) {
        console.log('Rastreamento de usuários desativado temporariamente para economizar memória');
        return;
    }

    // Verifica se o Socket.io já está inicializado
    if (typeof io === 'undefined') {
        console.error('Socket.io não encontrado. O rastreamento de usuários não funcionará.');
        return;
    }

    // Classe principal de rastreamento
    class UserTracker {
        constructor() {
            this.socket = null;
            this.userInfo = null;
            this.pageInfo = {
                title: document.title,
                url: window.location.href,
                path: window.location.pathname,
                module: this.detectModule()
            };
            this.activityTimer = null;
            this.lastActivity = Date.now();
            this.init();
        }

        // Inicializa o rastreador
        init() {
            this.loadUserInfo();
            this.connectSocket();
            this.setupEventListeners();
            
            // Enviar ping a cada 30 segundos para manter conexão ativa
            setInterval(() => this.sendPing(), 30000);
            
            // Verificar inatividade a cada 60 segundos
            this.activityTimer = setInterval(() => this.checkActivity(), 60000);
            
            // Enviar dados iniciais
            setTimeout(() => this.sendTrackingData(), 1000);
        }

        // Carrega informações do usuário do localStorage
        loadUserInfo() {
            try {
                const storageData = localStorage.getItem('StorageGoogle');
                if (storageData) {
                    this.userInfo = JSON.parse(storageData);
                }
            } catch (error) {
                console.error('Erro ao carregar informações do usuário:', error);
            }
        }

        // Conecta ao Socket.io
        connectSocket() {
            try {
                this.socket = io();
                
                this.socket.on('connect', () => {
                    console.debug('Rastreador conectado ao servidor');
                    this.sendTrackingData();
                });
                
                this.socket.on('disconnect', () => {
                    console.debug('Rastreador desconectado do servidor');
                });
                
                this.socket.on('reconnect', () => {
                    console.debug('Rastreador reconectado ao servidor');
                    this.sendTrackingData();
                });
            } catch (error) {
                console.error('Erro ao conectar ao servidor:', error);
            }
        }

        // Configura os listeners de eventos para rastrear atividade
        setupEventListeners() {
            // Atualizar atividade do usuário
            const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
            activityEvents.forEach(eventType => {
                document.addEventListener(eventType, () => {
                    this.lastActivity = Date.now();
                });
            });
            
            // Atualizar quando o título da página mudar
            const originalTitle = document.title;
            const titleObserver = new MutationObserver(() => {
                if (document.title !== this.pageInfo.title) {
                    this.pageInfo.title = document.title;
                    this.sendTrackingData();
                }
            });
            
            titleObserver.observe(document.querySelector('title'), { 
                subtree: true, 
                characterData: true, 
                childList: true 
            });
            
            // Evento de fechamento da página
            window.addEventListener('beforeunload', () => {
                this.sendPageLeave();
            });
        }

        // Envia dados de rastreamento para o servidor
        sendTrackingData() {
            if (!this.socket || !this.socket.connected) return;
            console.log(this.userInfo)
            const trackingData = {
                user: this.userInfo ? {
                    id: this.userInfo.system_collaborator_id,
                    name: this.userInfo.name,
                    email: this.userInfo.email,
                    photo: this.userInfo.photo,
                    id_headcargo: this.userInfo.system_id_headcargo
                } : null,
                page: this.pageInfo,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                sessionId: this.socket.id
            };
            
            this.socket.emit('user:track', trackingData);
        }
        
        // Envia sinal de ping para manter conexão ativa
        sendPing() {
            if (!this.socket || !this.socket.connected) return;
            this.socket.emit('user:ping', {
                userId: this.userInfo?.system_collaborator_id,
                timestamp: new Date().toISOString(),
                sessionId: this.socket.id
            });
        }
        
        // Envia evento de saída da página
        sendPageLeave() {
            if (!this.socket || !this.socket.connected) return;
            this.socket.emit('user:leave', {
                userId: this.userInfo?.system_collaborator_id,
                page: this.pageInfo,
                timestamp: new Date().toISOString(),
                sessionId: this.socket.id
            });
        }
        
        // Verifica inatividade do usuário
        checkActivity() {
            const inactiveTime = Date.now() - this.lastActivity;
            // Se inativo por mais de 10 minutos (600000ms)
            if (inactiveTime > 600000) {
                this.socket.emit('user:inactive', {
                    userId: this.userInfo?.system_collaborator_id,
                    page: this.pageInfo,
                    inactiveTime,
                    timestamp: new Date().toISOString(),
                    sessionId: this.socket.id
                });
            }
        }
        
        // Detecta o módulo atual com base no caminho
        detectModule() {
            const path = window.location.pathname;
            const parts = path.split('/').filter(Boolean);
            
            if (parts.length >= 2 && parts[0] === 'app') {
                return parts[1];
            }
            
            return 'unknown';
        }
    }

    // Iniciar o rastreador automaticamente quando o documento estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SIRIUS_TRACKER = new UserTracker();
        });
    } else {
        window.SIRIUS_TRACKER = new UserTracker();
    }
})(); 