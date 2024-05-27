const sql = require('mssql');


const config = {
  user: 'hc_conline_consulta',
  password: '3C23D35C-84F4-4205-80A2-D59D58A81BEF',
  server: 'CONLINE.SQL.HEADCARGO.COM.BR',
  database: 'headcargo_conline',
  port: 9322,
  options: {
    encrypt: false,
    requestTimeout: 200000 // tempo limite em milissegundos
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};


const pool = new sql.ConnectionPool(config);

pool.on('error', err => {
  console.error(`SQL Server pool error: ${err}`);
});

const executeQuerySQL = async (query) => {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    try {
      const connection = await pool.connect();
      const results = await connection.request().query(query);
      connection.release();
      return results.recordset;
    } catch (error) {
      attempts += 100;
      // console.error(query);
      console.error(error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Failed to execute query after ${attempts} attempts.`);
};


module.exports = {
    executeQuerySQL: executeQuerySQL,
};
