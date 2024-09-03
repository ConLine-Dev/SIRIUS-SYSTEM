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

const executeQuery = async (query, params = []) => {
  let connection;
  let attempts = 0;
  const maxAttempts = 5;


    try {
      connection = await pool.getConnection();
      const [results] = await connection.query(query, params);
      connection.release();
      return results;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }


  
};

module.exports = {
  executeQuery: executeQuery
};