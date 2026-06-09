let PrismaClient;
let prisma;

const withTimeout = (client) => {
  return client.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        return Promise.race([
          query(args),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Database Request Timeout: Prisma query exceeded 15 seconds limit on ${model || 'unknown_model'}.${operation}`)), 15000)
          )
        ]);
      }
    }
  });
};

try {
  PrismaClient = require('@prisma/client').PrismaClient;
  const client = new PrismaClient({
    log: ['query', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  prisma = withTimeout(client);
} catch (error) {
  console.error("Prisma Client failed to load:", error.message);
  global.prismaInitError = error.message;
  
  // Dummy object to prevent require crashes in services
  prisma = new Proxy({}, {
    get: function(target, prop) {
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => { throw new Error("Prisma not loaded: " + error.message); };
      }
      return new Proxy({}, {
        get: function() {
          return async () => { throw new Error("Prisma not loaded: " + error.message); };
        }
      });
    }
  });
}

// Handle connection errors gracefully
if (prisma.$on) {
  prisma.$on('error', (e) => {
    console.error('Prisma error:', e);
  });
}

module.exports = prisma;
