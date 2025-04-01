// const { executeQuerySQL } = require('../connect/headCargo');

// Importar o controlador de rastreamento de usuários
const userTracker = require('../controllers/user-tracker');

// Exportando como função que recebe o objeto io
module.exports = function(io) {
    // Inicializar o rastreador de usuários - TEMPORARIAMENTE DESATIVADO
    // console.log('Rastreador de usuários desativado temporariamente para economizar memória');
    // userTracker.initialize(io);
    
    // Configurações adicionais de Socket.io
    io.on('connection', (socket) => {
        console.log('Novo Usuario conectado')

        socket.on('changeTheme', (data) => {
            console.log('tema trocado')
        })

        // Exemplos de outros eventos que podem ser adicionados
        socket.on('connect_error', (err) => {
            console.log(`connect_error devido a ${err.message}`);
        });
    });
    
    // Configurar desligamento gracioso
    process.on('SIGTERM', () => {
        console.log('SIGTERM recebido, desligando sistema de rastreamento');
        if (userTracker.io) {
            userTracker.shutdown();
        }
    });
    
    process.on('SIGINT', () => {
        console.log('SIGINT recebido, desligando sistema de rastreamento');
        if (userTracker.io) {
            userTracker.shutdown();
        }
    });
};




