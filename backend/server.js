// Load environment variables FIRST
require('dotenv').config();

// Debug: Check if .env loaded
console.log('🔍 Environment Variables Check:');
console.log('📁 PORT:', process.env.PORT || '❌ Missing');
console.log('📁 MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');
console.log('📁 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('📁 CLIENT_URL:', process.env.CLIENT_URL || '❌ Missing');
console.log('═══════════════════════════════════════════');

const app = require('./src/app');
const connectDB = require('./src/config/database');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════');
      console.log('🚀 URL Shortener Server Started!');
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🩺 Health: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('═══════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = () => {
  console.log('🛑 Shutting down server...');
  if (server) {
    server.close(() => {
      console.log('✅ Web server closed');
      mongoose.connection.close().then(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  shutdown();
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  shutdown();
});

startServer();