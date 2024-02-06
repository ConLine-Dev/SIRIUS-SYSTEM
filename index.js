const express = require('express');
const http = require('http'); // Add this line
const path = require('path');
const socketIO = require('socket.io'); // Add this line


// Import routes pages
const listApp = require('./server/routes/app');
const listApi = require('./server/routes/api');

// Middlewares
const app = express();
app.use(express.json());

// Create an HTTP server using the Express app
const server = http.createServer(app); 

// Statics
app.use('/', express.static(path.join(__dirname, './public')))

// Routes
app.use('/api', listApi);
app.use('/app', listApp);

// Initialize Socket.io by passing the HTTP server instance
const io = socketIO(server);

// Socket.io events handling
io.on('connection', (socket) => {

});


// connection
const port = process.env.PORT || 6666;
server.listen(port, () =>
  console.log(`Listening to port http://localhost:${port} Node.js v${process.versions.node}!`)
);