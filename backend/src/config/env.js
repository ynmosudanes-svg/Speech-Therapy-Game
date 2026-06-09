const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(__dirname, '../../.env'),
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  publicApiUrl:
    process.env.PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://game.sudanesetherapy.com' : ''),
  jwtSecret: process.env.JWT_SECRET || 'replace-this-secret-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadsDir: path.join(__dirname, '../../uploads'),
  legacyDbPath: path.join(__dirname, '../../data/legacy-games.archive.json'),
  enableLegacyGameSeed: process.env.ENABLE_LEGACY_GAME_SEED === 'true',
  imageSearchProvider: process.env.IMAGE_SEARCH_PROVIDER || 'pexels',
  pexelsApiKey: process.env.PEXELS_API_KEY || '',
  pixabayApiKey: process.env.PIXABAY_API_KEY || '',
};
