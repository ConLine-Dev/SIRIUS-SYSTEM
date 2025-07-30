// ===============================
// SCRIPT DE MONITORAMENTO DE LOCKS
// ===============================

const { executeQuery } = require('./server/connect/mysql');

class LockMonitor {
    constructor() {
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.alertThreshold = 10; // segundos
        this.checkInterval = 5000; // 5 segundos
        this.mysqlVersion = null;
    }

    // Iniciar monitoramento
    start() {
        if (this.isMonitoring) {
            console.log('⚠️ Monitoramento já está ativo');
            return;
        }

        console.log('🚀 Iniciando monitoramento de locks...');
        this.isMonitoring = true;
        
        // Detectar versão do MySQL primeiro
        this.detectMySQLVersion().then(() => {
            this.monitoringInterval = setInterval(() => {
                this.checkLocks();
            }, this.checkInterval);
        });
    }

    // Parar monitoramento
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('⏹️ Monitoramento de locks parado');
    }

    // Detectar versão do MySQL
    async detectMySQLVersion() {
        try {
            const result = await executeQuery('SELECT VERSION() as version');
            const version = result[0].version;
            console.log(`📊 MySQL Version: ${version}`);
            
            // Extrair versão principal
            const majorVersion = parseInt(version.split('.')[0]);
            const minorVersion = parseInt(version.split('.')[1]);
            
            this.mysqlVersion = { major: majorVersion, minor: minorVersion };
            
            if (majorVersion >= 8) {
                console.log('✅ Usando queries para MySQL 8.0+');
            } else {
                console.log('✅ Usando queries compatíveis com MySQL 5.7');
            }
        } catch (error) {
            console.error('❌ Erro ao detectar versão do MySQL:', error);
            // Usar queries compatíveis por padrão
            this.mysqlVersion = { major: 5, minor: 7 };
        }
    }

    // Verificar locks ativos
    async checkLocks() {
        try {
            // Verificar transações ativas
            const activeTransactions = await this.getActiveTransactions();
            
            // Verificar locks em espera (compatível com versão)
            const waitingLocks = await this.getWaitingLocks();
            
            // Verificar processos lentos
            const slowProcesses = await this.getSlowProcesses();
            
            // Analisar e alertar se necessário
            this.analyzeAndAlert(activeTransactions, waitingLocks, slowProcesses);
            
        } catch (error) {
            console.error('❌ Erro no monitoramento de locks:', error);
        }
    }

    // Obter transações ativas
    async getActiveTransactions() {
        try {
            const transactions = await executeQuery(`
                SELECT 
                    trx_id, 
                    trx_state, 
                    trx_started, 
                    trx_mysql_thread_id,
                    trx_query,
                    TIMESTAMPDIFF(SECOND, trx_started, NOW()) as duration_seconds
                FROM information_schema.innodb_trx
                WHERE trx_state = 'RUNNING'
                ORDER BY trx_started ASC
            `);
            
            return transactions;
        } catch (error) {
            console.error('Erro ao obter transações ativas:', error);
            return [];
        }
    }

    // Obter locks em espera (compatível com versão)
    async getWaitingLocks() {
        try {
            if (this.mysqlVersion.major >= 8) {
                // MySQL 8.0+ - usar performance_schema
                return await this.getWaitingLocksMySQL8();
            } else {
                // MySQL 5.7 - usar information_schema (se disponível)
                return await this.getWaitingLocksMySQL57();
            }
        } catch (error) {
            console.error('Erro ao obter locks em espera:', error);
            return [];
        }
    }

    // Queries para MySQL 8.0+
    async getWaitingLocksMySQL8() {
        // Sempre usar método alternativo para máxima compatibilidade
        return await this.getWaitingLocksAlternative();
    }

    // Queries para MySQL 5.7
    async getWaitingLocksMySQL57() {
        try {
            // Tentar usar information_schema.innodb_lock_waits (pode não existir)
            const locks = await executeQuery(`
                SELECT 
                    r.trx_id waiting_trx_id,
                    r.trx_mysql_thread_id waiting_thread,
                    r.trx_query waiting_query,
                    r.trx_started waiting_started,
                    b.trx_id blocking_trx_id,
                    b.trx_mysql_thread_id blocking_thread,
                    b.trx_query blocking_query,
                    b.trx_started blocking_started,
                    TIMESTAMPDIFF(SECOND, r.trx_started, NOW()) as wait_duration_seconds
                FROM information_schema.innodb_lock_waits w
                INNER JOIN information_schema.innodb_trx b ON b.trx_id = w.blocking_trx_id
                INNER JOIN information_schema.innodb_trx r ON r.trx_id = w.requesting_trx_id
            `);
            
            return locks;
        } catch (error) {
            // Se a tabela não existir, usar método alternativo
            console.log('⚠️ Tabela innodb_lock_waits não disponível, usando método alternativo');
            return await this.getWaitingLocksAlternative();
        }
    }

    // Método alternativo para detectar locks
    async getWaitingLocksAlternative() {
        try {
            // Verificar processos que estão esperando
            const waitingProcesses = await executeQuery(`
                SELECT 
                    id,
                    user,
                    host,
                    db,
                    command,
                    time,
                    state,
                    info,
                    TIMESTAMPDIFF(SECOND, time, NOW()) as wait_duration_seconds
                FROM information_schema.processlist
                WHERE state LIKE '%lock%' 
                OR state LIKE '%wait%'
                OR state LIKE '%metadata%'
                AND command != 'Sleep'
                ORDER BY time DESC
            `);
            
            return waitingProcesses.map(p => ({
                waiting_trx_id: p.id,
                waiting_thread: p.id,
                waiting_query: p.info,
                waiting_started: new Date(Date.now() - (p.time * 1000)),
                blocking_trx_id: null,
                blocking_thread: null,
                blocking_query: null,
                blocking_started: null,
                wait_duration_seconds: p.time
            }));
        } catch (error) {
            console.error('Erro no método alternativo:', error);
            return [];
        }
    }

    // Obter processos lentos
    async getSlowProcesses() {
        try {
            const processes = await executeQuery(`
                SELECT 
                    id,
                    user,
                    host,
                    db,
                    command,
                    time,
                    state,
                    info
                FROM information_schema.processlist
                WHERE command != 'Sleep'
                AND time > 30
                ORDER BY time DESC
            `);
            
            return processes;
        } catch (error) {
            console.error('Erro ao obter processos lentos:', error);
            return [];
        }
    }

    // Analisar e alertar
    analyzeAndAlert(activeTransactions, waitingLocks, slowProcesses) {
        const now = new Date();
        
        // Alertar sobre transações longas
        const longTransactions = activeTransactions.filter(t => t.duration_seconds > this.alertThreshold);
        if (longTransactions.length > 0) {
            console.log(`🚨 ALERTA: ${longTransactions.length} transação(ões) longa(s) detectada(s)`);
            longTransactions.forEach(t => {
                console.log(`   - Transação ${t.trx_id} rodando há ${t.duration_seconds}s`);
                console.log(`   - Query: ${t.trx_query?.substring(0, 100) || 'undefined'}...`);
            });
        }

        // Alertar sobre locks em espera
        if (waitingLocks.length > 0) {
            console.log(`🔒 ALERTA: ${waitingLocks.length} lock(s) em espera`);
            waitingLocks.forEach(lock => {
                console.log(`   - Lock esperando há ${lock.wait_duration_seconds}s`);
                if (lock.blocking_thread) {
                    console.log(`   - Bloqueado por: ${lock.blocking_thread}`);
                }
                console.log(`   - Query bloqueada: ${lock.waiting_query?.substring(0, 100) || 'undefined'}...`);
            });
        }

        // Alertar sobre processos lentos
        const verySlowProcesses = slowProcesses.filter(p => p.time > 60);
        if (verySlowProcesses.length > 0) {
            console.log(`🐌 ALERTA: ${verySlowProcesses.length} processo(s) muito lento(s)`);
            verySlowProcesses.forEach(p => {
                console.log(`   - Processo ${p.id} rodando há ${p.time}s`);
                console.log(`   - Estado: ${p.state}`);
                console.log(`   - Query: ${p.info?.substring(0, 100) || 'undefined'}...`);
            });
        }

        // Log de status a cada 30 segundos
        if (now.getSeconds() % 30 === 0) {
            console.log(`📊 Status: ${activeTransactions.length} transações ativas, ${waitingLocks.length} locks em espera, ${slowProcesses.length} processos lentos`);
        }
    }

    // Gerar relatório detalhado
    async generateReport() {
        try {
            console.log('\n📋 RELATÓRIO DE MONITORAMENTO DE LOCKS');
            console.log('=====================================\n');

            const activeTransactions = await this.getActiveTransactions();
            const waitingLocks = await this.getWaitingLocks();
            const slowProcesses = await this.getSlowProcesses();

            console.log(`🔍 Transações Ativas: ${activeTransactions.length}`);
            activeTransactions.forEach(t => {
                console.log(`   - ID: ${t.trx_id}, Duração: ${t.duration_seconds}s, Thread: ${t.trx_mysql_thread_id}`);
            });

            console.log(`\n🔒 Locks em Espera: ${waitingLocks.length}`);
            waitingLocks.forEach(l => {
                console.log(`   - Esperando: ${l.wait_duration_seconds}s`);
                if (l.blocking_thread) {
                    console.log(`   - Bloqueado por: ${l.blocking_thread}`);
                }
            });

            console.log(`\n🐌 Processos Lentos: ${slowProcesses.length}`);
            slowProcesses.forEach(p => {
                console.log(`   - ID: ${p.id}, Tempo: ${p.time}s, Estado: ${p.state}`);
            });

            // Verificar configurações
            const configs = await this.getMySQLConfigs();
            console.log('\n⚙️ Configurações MySQL:');
            configs.forEach(c => {
                console.log(`   - ${c.Variable_name}: ${c.Value}`);
            });

            // Sugerir ações corretivas
            this.suggestCorrectiveActions(activeTransactions, waitingLocks, slowProcesses);

        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
        }
    }

    // Obter configurações do MySQL
    async getMySQLConfigs() {
        try {
            return await executeQuery(`
                SHOW VARIABLES WHERE Variable_name IN (
                    'innodb_lock_wait_timeout',
                    'lock_wait_timeout',
                    'wait_timeout',
                    'interactive_timeout',
                    'max_connections',
                    'innodb_buffer_pool_size'
                )
            `);
        } catch (error) {
            console.error('Erro ao obter configurações MySQL:', error);
            return [];
        }
    }

    // Verificar saúde do pool de conexões
    async checkConnectionPoolHealth() {
        try {
            const poolStatus = await executeQuery(`
                SELECT 
                    COUNT(*) as total_connections,
                    SUM(CASE WHEN command = 'Sleep' THEN 1 ELSE 0 END) as idle_connections,
                    SUM(CASE WHEN command != 'Sleep' THEN 1 ELSE 0 END) as active_connections
                FROM information_schema.processlist
                WHERE user = ?
            `, [process.env.DB_USER]);

            console.log('🔌 Status do Pool de Conexões:');
            console.log(`   - Total: ${poolStatus[0]?.total_connections || 0}`);
            console.log(`   - Ativas: ${poolStatus[0]?.active_connections || 0}`);
            console.log(`   - Ociosas: ${poolStatus[0]?.idle_connections || 0}`);

            return poolStatus[0];
        } catch (error) {
            console.error('Erro ao verificar pool de conexões:', error);
            return null;
        }
    }

    // Sugerir ações corretivas
    suggestCorrectiveActions(activeTransactions, waitingLocks, slowProcesses) {
        console.log('\n💡 SUGESTÕES DE AÇÕES CORRETIVAS:');
        console.log('=====================================');

        if (waitingLocks.length > 0) {
            console.log('🔒 Para locks em espera:');
            console.log('   - Verificar queries que estão bloqueando');
            console.log('   - Considerar otimizar índices');
            console.log('   - Revisar transações longas');
        }

        if (activeTransactions.length > 10) {
            console.log('📊 Para muitas transações ativas:');
            console.log('   - Verificar se há vazamento de conexões');
            console.log('   - Considerar aumentar pool de conexões');
            console.log('   - Implementar timeouts mais agressivos');
        }

        if (slowProcesses.length > 5) {
            console.log('🐌 Para processos lentos:');
            console.log('   - Otimizar queries problemáticas');
            console.log('   - Adicionar índices faltantes');
            console.log('   - Considerar paginação para queries grandes');
        }

        // Ações específicas baseadas nos problemas detectados
        if (slowProcesses.some(p => p.state === 'Waiting for table metadata lock')) {
            console.log('🔧 AÇÃO IMEDIATA NECESSÁRIA:');
            console.log('   - Há processos esperando metadata lock');
            console.log('   - Isso pode indicar DDL (CREATE INDEX, ALTER TABLE) em andamento');
            console.log('   - Considere cancelar operações DDL se não forem críticas');
        }

        console.log('\n🔧 Ações imediatas recomendadas:');
        console.log('   - Executar PERFORMANCE_INDEXES.sql');
        console.log('   - Verificar configurações MySQL');
        console.log('   - Monitorar logs de erro');
    }
}

// Função para iniciar monitoramento
function startLockMonitoring() {
    const monitor = new LockMonitor();
    
    // Iniciar monitoramento
    monitor.start();
    
    // Gerar relatório inicial
    setTimeout(() => {
        monitor.generateReport();
    }, 2000);
    
    // Gerar relatório a cada 5 minutos
    setInterval(() => {
        monitor.generateReport();
    }, 300000);
    
    // Verificar saúde do pool a cada 2 minutos
    setInterval(() => {
        monitor.checkConnectionPoolHealth();
    }, 120000);
    
    return monitor;
}

// Função para parar monitoramento
function stopLockMonitoring(monitor) {
    if (monitor) {
        monitor.stop();
    }
}

// Exportar para uso em outros módulos
module.exports = {
    LockMonitor,
    startLockMonitoring,
    stopLockMonitoring
};

// Se executado diretamente, iniciar monitoramento
if (require.main === module) {
    console.log('🔍 Iniciando monitoramento de locks...');
    console.log('Pressione Ctrl+C para parar\n');
    
    const monitor = startLockMonitoring();
    
    // Capturar sinal de parada
    process.on('SIGINT', () => {
        console.log('\n⏹️ Parando monitoramento...');
        stopLockMonitoring(monitor);
        process.exit(0);
    });
} 