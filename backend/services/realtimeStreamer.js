/**
 * Real-Time Streamer Service (Socket.io)
 * Handles client connections, room joins, and central broadcasting
 */

const setupRealtimeStreamer = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join room based on role
    socket.on('join:admin', () => {
      socket.join('admin_channel');
      console.log(`[Socket.io] Socket ${socket.id} joined admin_channel`);
    });

    socket.on('join:customer', (customerId) => {
      socket.join(`customer_${customerId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined customer_${customerId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { setupRealtimeStreamer };
