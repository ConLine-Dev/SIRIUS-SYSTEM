const express = require('express');
const http = require('http'); // Add this line
const path = require('path');
const socketIO = require('socket.io');
require('dotenv').config();

// Aumentar limite de memória para lidar com cargas maiores
// Isso é necessário por padrão, já que o projeto está crescendo
const v8 = require('v8');
const totalHeapSize = v8.getHeapStatistics().total_available_size;
let totalHeapSizeInGB = (totalHeapSize / 1024 / 1024 / 1024).toFixed(2);
console.log(`Memória total disponível: ${totalHeapSizeInGB} GB`);

// Import routes pages
const listApp = require('./server/routes/app');
const listApi = require('./server/routes/api');
const ControllerSocket = require('./server/routes/socketIO');

// Middlewares
const app = express();
app.use(express.json());

// Create an HTTP server using the Express app
const server = http.createServer(app); 

// Initialize Socket.io by passing the HTTP server instance
const io = socketIO(server);

// Statics
app.use('/', express.static(path.join(__dirname, './public')))

// Routes
// Pass the io instance to the setIO function
const apiRoutes = listApi(io);
app.use('/api', apiRoutes);
app.use('/app', listApp);

app.use('/storageService/collaborators', express.static('storageService/administration/collaborators'));
app.use('/storageService/tickets/files', express.static('storageService/ti/tickets/files'));
app.use('/uploads', express.static('uploads'));

// Inicializar controlador de Socket.io
ControllerSocket(io);

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
  // Registrar o erro, mas manter a aplicação funcionando
});

// Tratamento de rejeições de promessas não tratadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejeição de promessa não tratada:', reason);
  // Registrar o erro, mas manter a aplicação funcionando
});

// Monitoramento de uso de memória
const memoryUsageInterval = setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    external: (memoryUsage.external / 1024 / 1024).toFixed(2) + ' MB'
  };
  console.log('Uso de memória:', memoryUsageMB);
  
  // Se o uso de memória estiver muito alto, executar coleta de lixo manualmente
  // Esta é uma medida temporária até que a fonte do vazamento seja identificada
  if (memoryUsage.heapUsed > 1.5 * 1024 * 1024 * 1024) { // Se mais de 1.5GB
    console.log('Uso de memória alto detectado, tentando executar coleta de lixo');
    if (global.gc) {
      global.gc();
      console.log('Coleta de lixo executada manualmente');
    } else {
      console.log('Coleta de lixo manual não disponível. Execute o Node com --expose-gc');
    }
  }
}, 15 * 60 * 1000); // A cada 15 minutos

// Limpar intervalo ao desligar
process.on('SIGTERM', () => {
  clearInterval(memoryUsageInterval);
});

// connection
const port = process.env.PORT || 5000;
server.listen(port, () =>
  console.log(`Listening to port http://localhost:${port} Node.js v${process.versions.node}!`)
);