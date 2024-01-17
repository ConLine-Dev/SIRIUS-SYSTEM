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


const executeQuery = async (query) => {
  let connection;
  let attempts = 0;
  const maxAttempts = 5;

  while (!connection && attempts < maxAttempts) {
    try {
      connection = await pool.getConnection();
      const results = await connection.query(query);
      connection.release();
      return results[0];
    } catch (error) {
      // console.log(`Error connecting to database: ${error}. Retrying...`);
      attempts += 1;
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(error);
      return error;
    }
  }

  // throw new Error(`Failed to connect to database after ${attempts} attempts.`);
};

module.exports = {
  executeQuery: executeQuery,
};
