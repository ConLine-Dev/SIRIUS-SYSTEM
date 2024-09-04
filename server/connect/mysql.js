const mysql = require('mysql2/promise');
require('dotenv/config');

let currentConnectionLimit = 30; // Limite inicial de conexões
const minConnectionLimit = 30; // Limite mínimo de conexões
const maxConnectionLimit = 100; // Limite máximo de conexões
const scaleUpThreshold = 80; // Se 80% das conexões estiverem ativas, escala para cima
const scaleDownThreshold = 20; // Se menos de 20% das conexões estiverem ativas, escala para baixo

let pool = createPool(currentConnectionLimit);

// Função para criar pool de conexões
function createPool(connectionLimit) {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true, // Coloca novas conexões na fila
    idleTimeout: 60000, // 5 minutos (se suportado pela biblioteca
    connectionLimit,
  });
}

// Função para monitorar o status das conexões
const getPoolStatus = () => {
  const poolStatus = pool.pool;
  const activeConnections = poolStatus._allConnections.length;
  const idleConnections = poolStatus._freeConnections.length;
  const waitingConnections = poolStatus._connectionQueue.length;

  console.log({
    activeConnections, // Total de conexões abertas no pool (ativas e inativas).
    idleConnections, // Conexões inativas (conexões que estão abertas, mas não estão sendo usadas).
    waitingConnections, // Conexões na fila (solicitações de conexão pendentes).
    currentConnectionLimit
  });

  return { activeConnections, idleConnections, waitingConnections };
};

// Função para ajustar o tamanho do pool de conexões dinamicamente
const adjustPoolSize = () => {
  const { activeConnections, idleConnections, waitingConnections } = getPoolStatus();
  const usagePercentage = (activeConnections / currentConnectionLimit) * 100;

  if (usagePercentage > scaleUpThreshold && currentConnectionLimit < maxConnectionLimit) {
    currentConnectionLimit = Math.min(currentConnectionLimit + 10, maxConnectionLimit);
    pool.pool.config.connectionLimit = currentConnectionLimit; // Ajusta o limite de conexões
    console.log(`Escalonando para cima: Novo limite de conexões: ${currentConnectionLimit}`);
  } else if (usagePercentage < scaleDownThreshold && currentConnectionLimit > minConnectionLimit) {
    if (idleConnections === currentConnectionLimit) {
      currentConnectionLimit = Math.max(currentConnectionLimit - 10, minConnectionLimit);
      pool.pool.config.connectionLimit = currentConnectionLimit; // Ajusta o limite de conexões
      console.log(`Escalonando para baixo: Novo limite de conexões: ${currentConnectionLimit}`);
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

const executeQuery = async (query, params = [], user = []) => {
  let connection;
  
  try {
    adjustPoolSize(); // Ajustar o tamanho do pool antes de executar a query
    connection = await pool.getConnection();
    const [results] = await connection.query(query, params);

    logQuery(connection, user, query, params, true).catch(err => console.error(err));

    return results;
  } catch (error) {
    logQuery(connection, user, query, params, false, error.message).catch(err => console.error(err));
    console.log(error);
    throw new Error(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Exporta a função para obter o status do pool de conexões
const getConnectionStatus = () => {
  return getPoolStatus();
};

module.exports = {
  executeQuery,
  getConnectionStatus
};
