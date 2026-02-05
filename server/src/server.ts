import createApp from './app';
import config from './config/env.config';
import { connectDatabase } from './config/database';
import {
  handleUncaughtException,
  handleUnhandledRejection,
} from './middleware/errorHandler.middleware';

/**
 * Server Entry Point
 * Initializes database, starts Express server, and handles process events
 */

// Handle uncaught exceptions (must be at the top)
process.on('uncaughtException', handleUncaughtException);

// Start server
const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Starting PPC Authentication Server...\n');

    // Connect to MongoDB
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.port, () => {
      console.log('\n✅ Server started successfully!');
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🌐 Server running on: http://localhost:${config.port}`);
      console.log(`🏥 Health check: http://localhost:${config.port}/health`);
      console.log(`🔐 Auth API: http://localhost:${config.port}/api/auth`);
      console.log(`👤 Admin API: http://localhost:${config.port}/api/admin`);
      console.log('\n📝 Server is ready to accept requests\n');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      handleUnhandledRejection(reason, promise);
      // Gracefully shutdown
      server.close(() => {
        console.log('🛑 Server closed due to unhandled rejection');
        process.exit(1);
      });
    });

    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', () => {
      console.log('\n⚠️  SIGTERM signal received');
      console.log('🛑 Closing server gracefully...');

      server.close(() => {
        console.log('✅ Server closed');
        console.log('🔌 Closing database connection...');

        // Close database connection
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          console.log('✅ Database connection closed');
          console.log('👋 Process terminated gracefully');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    });

    // Graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\n⚠️  SIGINT signal received (Ctrl+C)');
      console.log('🛑 Closing server gracefully...');

      server.close(() => {
        console.log('✅ Server closed');
        console.log('🔌 Closing database connection...');

        // Close database connection
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          console.log('✅ Database connection closed');
          console.log('👋 Process terminated gracefully');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
