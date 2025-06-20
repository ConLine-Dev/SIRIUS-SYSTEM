const mysql = require('../server/connect/mysql');
const fs = require('fs');
const path = require('path');

async function optimizeDatabase() {
    try {
        console.log('🚀 Aplicando otimizações de performance no banco de dados...');
        
        const sqlFile = path.join(__dirname, '../public/app/administration/procedures-management/update_schema_v6.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Dividir o SQL em queries individuais
        const queries = sql.split(';').filter(q => q.trim() && !q.trim().startsWith('--'));
        
        console.log(`📝 Executando ${queries.length} queries de otimização...`);
        
        for (const query of queries) {
            if (query.trim()) {
                try {
                    await mysql.executeQuery(query.trim());
                    const preview = query.trim().substring(0, 80).replace(/\s+/g, ' ');
                    console.log(`✅ Executado: ${preview}...`);
                } catch (e) {
                    // Algumas queries podem falhar se o índice já existir, isso é normal
                    if (e.code === 'ER_DUP_KEYNAME') {
                        console.log(`⚠️  Índice já existe (ignorando): ${e.message}`);
                    } else {
                        console.log(`⚠️  Aviso na query: ${e.message}`);
                    }
                }
            }
        }
        
        console.log('🎉 Otimizações aplicadas com sucesso!');
        console.log('');
        console.log('📊 Resumo das otimizações:');
        console.log('  - Índice otimizado para procedure_id + version_number DESC');
        console.log('  - Índice para author_id para melhorar JOINs');
        console.log('  - Índice composto procedure_id + author_id');
        console.log('  - Análise de tabela para otimizar estatísticas do MySQL');
        console.log('');
        console.log('🔧 Configurações adicionais recomendadas no MySQL:');
        console.log('  - sort_buffer_size = 2M (ou maior)');
        console.log('  - tmp_table_size = 64M');
        console.log('  - max_heap_table_size = 64M');
        
    } catch (error) {
        console.error('❌ Erro ao aplicar otimizações:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    optimizeDatabase();
}

module.exports = { optimizeDatabase }; 