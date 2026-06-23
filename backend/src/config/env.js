const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(__dirname, '../../.env'),
});

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '../../uploads');

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  publicApiUrl: process.env.PUBLIC_API_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'replace-this-secret-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadsDir,
  uploadMaxFileSizeMb: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 50),
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  r2AccountId: process.env.R2_ACCOUNT_ID || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || 'speech-therapy-game',
  r2PublicUrl: process.env.R2_PUBLIC_URL || '',
  legacyDbPath: path.join(__dirname, '../../data/legacy-games.archive.json'),
  enableLegacyGameSeed: process.env.ENABLE_LEGACY_GAME_SEED === 'true',
  imageSearchProvider: process.env.IMAGE_SEARCH_PROVIDER || 'pexels',
  pexelsApiKey: process.env.PEXELS_API_KEY || '',
  pixabayApiKey: process.env.PIXABAY_API_KEY || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '',
  supabaseBucket: process.env.SUPABASE_BUCKET_NAME || 'uploads',
};

