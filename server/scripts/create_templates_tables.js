const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createTemplatesTables() {
  let connection;
  
  try {
    // Configuração do banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Adicione sua senha aqui se necessário
      database: 'sirius_system',
      charset: 'utf8mb4'
    });

    console.log('✅ Conectado ao banco de dados');

    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, '../sql/templates_department_schema.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...`);

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Comando ${i + 1}: Entrada duplicada (ignorado)`);
          } else {
            console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          }
        }
      }
    }

    console.log('🎉 Tabelas de templates criadas com sucesso!');

    // Verificar se as tabelas foram criadas
    const tables = await connection.execute(`
      SHOW TABLES LIKE 'hr_department_%_templates'
    `);

    console.log('📋 Tabelas criadas:');
    tables[0].forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar o script
createTemplatesTables(); 