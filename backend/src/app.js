const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const swaggerSpec = require('./docs/swagger');
const authRoutes = require('./routes/auth.routes');
const therapistRoutes = require('./routes/therapist.routes');
const studentRoutes = require('./routes/student.routes');
const gameRoutes = require('./routes/game.routes');
const gameLibraryRoutes = require('./routes/gameLibrary.routes');
const imageRoutes = require('./routes/image.routes');
const sessionRoutes = require('./routes/session.routes');
const reportRoutes = require('./routes/report.routes');
const uploadRoutes = require('./routes/upload.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors({ origin: '*' }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(env.uploadsDir));

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok'
  });
});

app.get('/api/setup-database', (req, res) => {
  const { exec } = require('child_process');
  
  // Set a longer timeout for the HTTP response since Prisma takes a while
  req.setTimeout(120000); 
  
  exec('npx prisma db push --accept-data-loss', { env: process.env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Setup Error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message, stderr });
    }
    res.json({
      success: true,
      message: "Database tables created successfully!",
      output: stdout
    });
  });
});

app.get('/ready', async (_req, res) => {
  try {
    const prisma = require('./config/prisma');
    if (!prisma || !prisma.$queryRaw) {
      throw new Error('Prisma client not loaded');
    }
    // Lightweight query to check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      database: 'failed',
      error: error.message
    });
  }
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(authRoutes);
app.use(therapistRoutes);
app.use(studentRoutes);
app.use(gameRoutes);
app.use(gameLibraryRoutes);
app.use(imageRoutes);
app.use(sessionRoutes);
app.use(reportRoutes);
app.use(uploadRoutes);


app.get('/api/test-db-url', (req, res) => {
  res.json({
    message: "Endpoint secured"
  });
});

app.get('/api/debug-error', (req, res) => {
  res.json({
    prismaInitError: global.prismaInitError || 'No error'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
