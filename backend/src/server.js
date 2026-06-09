const app = require('./app');
const env = require('./config/env');
let prisma;
let prismaInitError = null;
try {
  prisma = require('./config/prisma');
} catch (e) {
  prismaInitError = e.message;
  global.prismaInitError = e.message;
  console.error("Prisma failed to initialize:", e);
}
let bootstrapApplication;
try {
  bootstrapApplication = require('./services/bootstrap.service').bootstrapApplication;
} catch (e) {
  console.error("Bootstrap service failed to load:", e);
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(retries = MAX_RETRIES) {
  if (!prisma) {
    console.error("Skipping DB connection: Prisma is undefined. Error was:", prismaInitError);
    return;
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log('Database connected successfully.');
      return;
    } catch (error) {
      console.error(`DB connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

async function startServer() {
  const server = app.listen(env.port, () => {
    console.log(`Backend server running on port/pipe ${env.port}`);
    console.log(`Swagger docs at /api/docs`);
  });

  try {
    // Start DB connection asynchronously in the background so it never blocks Hostinger Passenger
    connectWithRetry().then(async () => {
      if (bootstrapApplication) {
        await bootstrapApplication();
      }
      console.log('Database ready.');
    }).catch(error => {
      console.error('WARNING: Database connection completely failed. API routes needing DB will fail.', error.message);
    });
    console.log('Server initialized. DB connecting in background...');
  } catch (error) {
    console.error('Unexpected error during startup initialization:', error);
  }

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Handle unhandled rejections to prevent silent crashes
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

startServer();

