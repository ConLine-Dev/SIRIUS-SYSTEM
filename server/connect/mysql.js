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

const logQuery = async (connection, user, query, params, success, errorMessage = null) => {
  const userId = user.system_userID || 0
  if(userId != 0){
    try {
      await connection.query(
        `INSERT INTO query_logs (user_id, query, params, success, error_message) VALUES (?, ?, ?, ?, ?)`,
        [userId, query, JSON.stringify(params), success, errorMessage]
      );
      console.success('Registro salvo', query);
    } catch (error) {
      console.error('Erro ao registrar o log da query:', error);
    }
  }


};

const executeQuery = async (query, params = [], user = []) => {

  let connection;
  
  try {
    connection = await pool.getConnection();
    const [results] = await connection.query(query, params);

    // Log assíncrono para não bloquear o retorno dos resultados
    logQuery(connection, user, query, params, true).catch(err => console.error(err));

    return results;
  } catch (error) {
    // Log de falha, também assíncrono
    logQuery(connection, user, query, params, false, error.message).catch(err => console.error(err));
    
    console.log(error);
    throw new Error(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  executeQuery
};
