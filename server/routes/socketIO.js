// const { executeQuerySQL } = require('../connect/headCargo');

const userTracker = require('../controllers/user-tracker');

// Exportando como função que recebe o objeto io
module.exports = function(io) {
    // Inicializar o rastreador de usuários
    userTracker.initialize(io);
    
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
};




