require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { setupRealtimeStreamer } = require('./services/realtimeStreamer');

// Routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const merchantRoutes = require('./routes/merchants');
const transactionRoutes = require('./routes/transactions');
const alertRoutes = require('./routes/alerts');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const simulatorRoutes = require('./routes/simulator');
const autoFlowEngine = require('./services/autoFlowEngine');

const app = express();
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);
setupRealtimeStreamer(io);

// Express Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Attach Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/simulator', simulatorRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

// Start server after DB connection
const startServer = async () => {
  await connectDB();
  await autoFlowEngine.init(io);
  server.listen(PORT, () => {
    console.log(`🚀 [PayTelemetry Backend] Server listening on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server };
