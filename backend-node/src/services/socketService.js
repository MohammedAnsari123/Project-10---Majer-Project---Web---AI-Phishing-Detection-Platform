const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Live telemetry Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Live telemetry Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function broadcastThreat(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = { initSocket, getIO, broadcastThreat };
