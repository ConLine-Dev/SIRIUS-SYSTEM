const express = require('express');
const http = require('http'); // Add this line
const path = require('path');
const socketIO = require('socket.io');


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

ControllerSocket(io)

// Socket.io events handling
// io.on('connection', (socket) => {

// });

// connection
const port = process.env.PORT || 5000;
server.listen(port, () =>
  console.log(`Listening to port http://localhost:${port} Node.js v${process.versions.node}!`)
);