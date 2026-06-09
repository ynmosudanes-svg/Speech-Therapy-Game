const http = require('http');
const app = require('./src/app');

// Passenger specific explicit http server
const server = http.createServer(app);
const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`[PASSENGER-BRIDGE] Server listening on ${port}`);
});

try {
  // Start DB connection asynchronously in the background so it never blocks Hostinger Passenger
  require('./src/config/prisma'); // Just trigger initialization
  console.log('Server initialized. DB connecting in background...');
} catch (error) {
  console.error('Unexpected error during startup initialization:', error);
}
