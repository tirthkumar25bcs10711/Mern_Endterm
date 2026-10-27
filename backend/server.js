import { validateEnv, env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';
import { startAllJobs } from './jobs/index.js';

// Validate all required environment variables at boot
validateEnv();

const PORT = env.PORT || 8084;
const HOST = '0.0.0.0';

let server;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start background cron jobs (Spec B6.10)
    startAllJobs();

    // Start listening on 0.0.0.0:PORT
    server = app.listen(PORT, HOST, () => {
      console.log(`ShowTime API server running at http://${HOST}:${PORT} in ${env.NODE_ENV} mode`);
      console.log(`Health check available at http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    console.error('\n❌ Fatal error starting server:', error.message);
    if (error.stack) console.error(error.stack);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.exit(1);
  }
};

// Graceful shutdown handling (Spec B8)
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  // Force close after 10 seconds if graceful teardown stalls
  const forceExitTimeout = setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('HTTP server closed.');
    }
    await disconnectDB();
    console.log('Teardown complete. Exiting cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Process-level error handling to prevent silent death or corrupt states
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason instanceof Error ? reason.message : reason);
  // Log stack only in non-production
  if (env.NODE_ENV !== 'production' && reason instanceof Error && reason.stack) {
    console.error(reason.stack);
  }
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  if (env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }
  handleShutdown('uncaughtException');
});

startServer();
