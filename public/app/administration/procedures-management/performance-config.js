// ===============================
// CONFIGURAÇÕES DE PERFORMANCE
// PROCEDURES-MANAGEMENT MODULE
// ===============================

const PERFORMANCE_CONFIG = {
    // Cache Settings
    CACHE: {
        TTL: 300000,              // 5 minutos para cache geral
        METADATA_TTL: 300000,     // 5 minutos para metadados
        PROCEDURES_TTL: 60000,    // 1 minuto para listagem de procedimentos
        USER_INFO_TTL: 900000     // 15 minutos para informações do usuário
    },
    
    // Debounce Settings
    DEBOUNCE: {
        FILTER_DELAY: 300,        // 300ms para filtros
        SAVE_DELAY: 1000,         // 1s para salvamento
        SEARCH_DELAY: 300         // 300ms para busca
    },
    
    // Throttle Settings
    THROTTLE: {
        SOCKET_DELAY: 500,        // 500ms para eventos Socket.io
        RENDER_DELAY: 100,        // 100ms para renderização
        API_DELAY: 200            // 200ms para chamadas API
    },
    
    // Content Processing
    CONTENT: {
        SUMMARY_MAX_LENGTH: 250,      // Tamanho máximo do summary
        IMAGE_DETECTION_THRESHOLD: 1000,  // Threshold para detectar imagens grandes
        LARGE_CONTENT_THRESHOLD: 10000    // Threshold para conteúdo grande
    },
    
    // Rendering Optimization
    RENDERING: {
        USE_DOCUMENT_FRAGMENT: true,  // Usar DocumentFragment
        LAZY_LOAD_IMAGES: true,       // Lazy loading para imagens
        VIRTUAL_SCROLLING: false,     // Virtual scrolling (futuro)
        BATCH_SIZE: 50                // Tamanho do batch para renderização
    },
    
    // Database Optimization
    DATABASE: {
        BATCH_INSERT_SIZE: 100,       // Tamanho do batch para inserções
        USE_PREPARED_STATEMENTS: true, // Usar prepared statements
        CONNECTION_POOLING: true,     // Pool de conexões
        QUERY_TIMEOUT: 30000          // 30s timeout para queries
    }
};

// Funções utilitárias para performance
const PerformanceUtils = {
    // Debounce function
    debounce: function(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    // Throttle function
    throttle: function(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    },
    
    // Cache helper
    createCache: function(ttl = PERFORMANCE_CONFIG.CACHE.TTL) {
        return {
            data: null,
            timestamp: 0,
            ttl: ttl,
            
            set: function(value) {
                this.data = value;
                this.timestamp = Date.now();
            },
            
            get: function() {
                if (this.data && (Date.now() - this.timestamp) < this.ttl) {
                    return this.data;
                }
                return null;
            },
            
            invalidate: function() {
                this.timestamp = 0;
                this.data = null;
            },
            
            isValid: function() {
                return this.data && (Date.now() - this.timestamp) < this.ttl;
            }
        };
    },
    
    // Performance monitoring
    measurePerformance: function(name, func) {
        return async function(...args) {
            const startTime = performance.now();
            try {
                const result = await func.apply(this, args);
                const endTime = performance.now();
                console.log(`⚡ Performance [${name}]: ${(endTime - startTime).toFixed(2)}ms`);
                return result;
            } catch (error) {
                const endTime = performance.now();
                console.error(`❌ Performance [${name}] Error: ${(endTime - startTime).toFixed(2)}ms`, error);
                throw error;
            }
        };
    },
    
    // Memory usage monitoring
    logMemoryUsage: function(label = 'Memory Usage') {
        if (performance.memory) {
            console.log(`📊 ${label}:`, {
                used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                limit: `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
            });
        }
    },
    
    // Batch processing
    processBatch: async function(items, batchSize, processor) {
        const results = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(processor));
            results.push(...batchResults);
        }
        return results;
    }
};

// Export para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PERFORMANCE_CONFIG, PerformanceUtils };
} else {
    window.PERFORMANCE_CONFIG = PERFORMANCE_CONFIG;
    window.PerformanceUtils = PerformanceUtils;
} 