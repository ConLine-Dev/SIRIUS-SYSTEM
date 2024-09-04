const mysql = require('mysql2/promise');
require('dotenv/config');

// Criando pool de conexões com o banco de dados
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  connectionLimit: 10, // número máximo de conexões permitidas
});

const logQuery = async (connection, userId, query, params, success, errorMessage = null) => {
  try {
    await connection.query(
      `INSERT INTO query_logs (user_id, query, params, success, error_message) VALUES (?, ?, ?, ?, ?)`,
      [userId, query, JSON.stringify(params), success, errorMessage]
    );
  } catch (error) {
    console.error('Erro ao registrar o log da query:', error);
  }
};

const executeQuery = async (query, params = [], userId = null) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    const [results] = await connection.query(query, params);

    // Log assíncrono para não bloquear o retorno dos resultados
    logQuery(connection, userId, query, params, true).catch(err => console.error(err));

    return results;
  } catch (error) {
    // Log de falha, também assíncrono
    logQuery(connection, userId, query, params, false, error.message).catch(err => console.error(err));
    
    console.log(error);
    throw new Error(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  executeQuery
};
