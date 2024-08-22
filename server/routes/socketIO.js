// const { executeQuerySQL } = require('../connect/headCargo');


const WebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Novo Usuario conectado')

    socket.on('changeTheme', (data) => {
        console.log('tema trocado')
    })

  });
   
};

module.exports = WebSocket;




