// Script para testar a função getAllActiveCollaborators
const { pdiHub } = require('./server/controllers/pdi-hub');

async function testGetAllActiveCollaborators() {
    try {
        console.log('Testando a função getAllActiveCollaborators...');
        const result = await pdiHub.getAllActiveCollaborators();
        console.log('Resultado obtido com sucesso:');
        console.log(result);
        console.log('Número de colaboradores retornados:', result.length);
    } catch (error) {
        console.error('Erro ao executar a função:');
        console.error('Mensagem:', error.message);
        console.error('Código:', error.code);
        console.error('SQL:', error.sql);
        console.error('SQLState:', error.sqlState);
        console.error('SQLMessage:', error.sqlMessage);
        console.error('Stack:', error.stack);
    }
}

// Executar o teste
testGetAllActiveCollaborators().catch(error => {
    console.error('Erro não tratado:');
    console.error(error);
}); 