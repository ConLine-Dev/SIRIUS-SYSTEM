const mysql = require('mysql2/promise');
require('dotenv/config');

let currentConnectionLimit = 30;
const minConnectionLimit = 30;
const maxConnectionLimit = 100;
const scaleUpThreshold = 80;
const scaleDownThreshold = 20;

let pool = createPool(currentConnectionLimit);
let isRecreatingPool = false;
let requestQueue = [];
let activeConnectionsCount = 0;

function createPool(connectionLimit) {
  const poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit,
    // ===============================
    // CONFIGURAÇÕES PARA CONTEÚDOS GRANDES (OTIMIZADAS)
    // ===============================
    // Configurações suportadas pelo mysql2
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    // SSL desabilitado se não necessário
    ssl: false
  };

  const newPool = mysql.createPool(poolConfig);
  
  // Configurar sessão em cada conexão nova (apenas logs essenciais)
  newPool.on('connection', function (connection) {
    // ===============================
    // CONFIGURAÇÕES DE SESSÃO ESSENCIAIS
    // ===============================
    
    // Configurar timezone
    connection.query('SET SESSION time_zone = "+00:00"', (err) => {
      if (err) {
        console.error('Erro ao configurar timezone:', err);
      }
    });
    
    // Configurar SQL mode compatível com MySQL 8.x
    connection.query('SET SESSION sql_mode = "NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION"', (err) => {
      if (err) {
        console.error('Erro ao configurar SQL mode:', err);
      }
    });
    
    // Configurar timeouts da sessão
    connection.query('SET SESSION wait_timeout = 3600, interactive_timeout = 3600', (err) => {
      if (err) {
        console.error('Erro ao configurar timeouts:', err);
      }
    });
  });

  // Logs de erro apenas (remover logs verbosos)
  newPool.on('error', function(err) {
    console.error('Erro no pool MySQL:', err);
  });

  console.log('Pool MySQL criado com limite de conexões:', connectionLimit);
  
  return newPool;
}

const getPoolStatus = () => {
  const poolStatus = pool.pool;
  const activeConnections = poolStatus._allConnections.length;
  const idleConnections = poolStatus._freeConnections.length;
  const waitingConnections = poolStatus._connectionQueue.length;

  // console.log({
  //   activeConnections,
  //   idleConnections,
  //   waitingConnections,
  //   currentConnectionLimit
  // });

  return { activeConnections, idleConnections, waitingConnections };
};

const processQueue = () => {
  while (requestQueue.length > 0) {
    const { resolve, reject, query, params, user } = requestQueue.shift();
    executeQuery(query, params, user).then(resolve).catch(reject);
  }
};

// Função utilitária para timeout
const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Operação excedeu o tempo limite'));
    }, ms);
    
    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const recreatePool = async (newConnectionLimit) => {
  if (isRecreatingPool) return;

  isRecreatingPool = true;
  console.log('Recriando pool com novo limite de conexões:', newConnectionLimit);

  const oldPool = pool;
  let newPool;

  try {
    newPool = createPool(newConnectionLimit);
  

    // Define o novo pool como o pool atual
    pool = newPool;
    currentConnectionLimit = newConnectionLimit;
    // Aguarda 1 minuto para garantir que todas as conexões sejam encerradas
    console.log('Aguardando 1 minuto para garantir o encerramento das conexões antigas...', newConnectionLimit);
    setTimeout(async () => {
      if (oldPool) {
        console.log('Encerrando o pool antigo...');
        try {
          await withTimeout(oldPool.end(), 10000); // Encerra o pool antigo com timeout
          console.log('Antigo pool de conexões encerrado.');
        } catch (err) {
          console.error('Erro ao encerrar o pool antigo:', err);
        }
      }
    }, 60000); // 1 minuto

  } catch (err) {
    console.error('Erro ao recriar o pool:', err);
    if (newPool) await newPool.end(); // Encerra o pool de teste em caso de falha
  } finally {
    isRecreatingPool = false;
  }
};

const adjustPoolSize = async () => {
  const { activeConnections, idleConnections } = getPoolStatus();
  const usagePercentage = (activeConnections / currentConnectionLimit) * 100;

  if (usagePercentage > scaleUpThreshold && currentConnectionLimit < maxConnectionLimit) {
    const newLimit = Math.min(currentConnectionLimit + 10, maxConnectionLimit);
    await recreatePool(newLimit);
  } else if (usagePercentage < scaleDownThreshold && currentConnectionLimit > minConnectionLimit) {
    if (idleConnections === currentConnectionLimit) {
      const newLimit = Math.max(currentConnectionLimit - 10, minConnectionLimit);
      await recreatePool(newLimit);
    }
  }
};

const logQuery = async (connection, user, query, params, success, errorMessage = null) => {
  const userId = user.system_userID || 0;
  if (userId !== 0) {
    try {
      await connection.query(
        `INSERT INTO query_logs (user_id, query, params, success, error_message) VALUES (?, ?, ?, ?, ?)`,
        [userId, query, JSON.stringify(params), success, errorMessage]
      );
      console.log('Registro salvo', query);
    } catch (error) {
      console.error('Erro ao registrar o log da query:', error);
    }
  }
};

const executeQuery = async (query, params = [], user = [], retries = 3) => {
  if (isRecreatingPool) {
    return new Promise((resolve, reject) => {
      requestQueue.push({ resolve, reject, query, params, user });
    });
  }

  let connection;
  try {
    await adjustPoolSize();

    connection = await pool.getConnection();
    activeConnectionsCount++;

    // ===============================
    // CONFIGURAÇÕES DE TIMEOUT PARA EVITAR LOCKS
    // ===============================
    await connection.query('SET SESSION innodb_lock_wait_timeout = 30');
    await connection.query('SET SESSION lock_wait_timeout = 30');

    // ===============================
    // LOG APENAS PARA QUERIES GRANDES (>5MB)
    // ===============================
    const queryStr = query.toString();
    const paramsStr = JSON.stringify(params);
    const totalSize = queryStr.length + paramsStr.length;
    
    if (totalSize > 5 * 1024 * 1024) { // > 5MB
      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
      console.log(`Executando query grande: ${sizeMB}MB`);
      
      // Verificar se é INSERT/UPDATE com conteúdo JSON grande
      if (queryStr.includes('INSERT') || queryStr.includes('UPDATE')) {
        const base64Count = (paramsStr.match(/data:image\/[^"]+/g) || []).length;
        if (base64Count > 0) {
          console.log(`Query contém ${base64Count} imagem(ns) base64`);
        }
      }
    }

    // ===============================
    // TIMEOUT PARA QUERIES INDIVIDUAIS
    // ===============================
    const queryTimeout = 30000; // 30 segundos
    const [results] = await Promise.race([
      connection.query(query, params),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout exceeded')), queryTimeout)
      )
    ]);

    await logQuery(connection, user, query, params, true);

    return results;
  } catch (error) {
    if (connection) {
      await logQuery(connection, user, query, params, false, error.message);
    }

    // ===============================
    // TRATAMENTO ESPECÍFICO DE ERROS DE LOCK
    // ===============================
    if (error.message && error.message.includes('Lock wait timeout exceeded')) {
      console.error('🚨 ERRO DE LOCK TIMEOUT DETECTADO!');
      console.error('Query:', query);
      console.error('Parâmetros:', JSON.stringify(params));
      
      // Se for uma transação, forçar rollback
      if (query.includes('START TRANSACTION') || query.includes('COMMIT') || query.includes('ROLLBACK')) {
        console.error('🔄 Forçando rollback de transação...');
        try {
          await connection.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Erro no rollback:', rollbackError);
        }
      }
      
      throw new Error('Lock wait timeout exceeded. Tente novamente em alguns segundos.');
    }

    if (error.message && error.message.includes('max_allowed_packet')) {
      console.error('ERRO CRÍTICO: max_allowed_packet excedido!');
      console.error('Tamanho da query:', query.length);
      console.error('Tamanho dos parâmetros:', JSON.stringify(params).length);
      throw new Error('Conteúdo muito grande para o banco de dados. Configure max_allowed_packet no MySQL.');
    }

    if (error.message.includes('Pool is closed') && retries > 0) {
      console.warn(`Tentativa falhou com erro "Pool is closed". Tentando novamente... (${retries} tentativas restantes)`);
      return executeQuery(query, params, user, retries - 1);
    }

    console.error('Erro ao executar a query:', error);
    throw new Error(error);
  } finally {
    if (connection) {
      connection.release();
      activeConnectionsCount--;
    }
  }
};

// ===============================
// FUNÇÃO PARA EXECUTAR TRANSAÇÕES COM TIMEOUT
// ===============================
const executeTransaction = async (operations, timeoutMs = 30000) => {
  let connection;
  try {
    connection = await pool.getConnection();
    activeConnectionsCount++;

    // Configurar timeouts para transação
    await connection.query('SET SESSION innodb_lock_wait_timeout = 30');
    await connection.query('SET SESSION lock_wait_timeout = 30');

    return await Promise.race([
      (async () => {
        await connection.query('START TRANSACTION');
        
        const result = await operations(connection);
        
        await connection.query('COMMIT');
        return result;
      })(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout exceeded')), timeoutMs)
      )
    ]);
  } catch (error) {
    if (connection) {
      try {
        await connection.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erro no rollback:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
      activeConnectionsCount--;
    }
  }
};

// ===============================
// FUNÇÃO DE VERIFICAÇÃO INICIAL (SIMPLIFICADA)
// ===============================
const verifyMySQLConfiguration = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Verificar apenas max_allowed_packet (essencial para conteúdos grandes)
    const [globalResult] = await connection.query('SHOW GLOBAL VARIABLES LIKE "max_allowed_packet"');
    
    if (globalResult && globalResult.length > 0) {
      const globalMaxPacket = parseInt(globalResult[0].Value);
      const globalMaxPacketMB = (globalMaxPacket / 1024 / 1024).toFixed(2);
      
      if (globalMaxPacket >= 134217728) {
        console.log(`MySQL configurado adequadamente: ${globalMaxPacketMB}MB max_allowed_packet`);
      } else {
        console.warn(`MySQL max_allowed_packet pode ser insuficiente: ${globalMaxPacketMB}MB (recomendado: 128MB+)`);
      }
    } else {
      console.warn('Não foi possível verificar max_allowed_packet');
    }
    
    connection.release();
    
  } catch (error) {
    console.error('Erro na verificação MySQL:', error);
  }
};

// Executar verificação na inicialização
setTimeout(verifyMySQLConfiguration, 2000);

const getConnectionStatus = () => {
  return getPoolStatus();
};

module.exports = {
  executeQuery,
  executeTransaction,
  getPoolStatus,
  getConnectionStatus,
  recreatePool
};
