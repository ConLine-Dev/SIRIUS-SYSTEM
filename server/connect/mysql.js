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
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit,
  });
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

    const [results] = await connection.query(query, params);

    await logQuery(connection, user, query, params, true);

    return results;
  } catch (error) {
    if (connection) {
      await logQuery(connection, user, query, params, false, error.message);
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

const getConnectionStatus = () => {
  return getPoolStatus();
};

module.exports = {
  executeQuery,
  getConnectionStatus
};
