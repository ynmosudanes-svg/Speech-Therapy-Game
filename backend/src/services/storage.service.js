const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const env = require('../config/env');

const UPLOAD_PREFIX = 'uploads/';

function trimSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/g, '');
}

function sanitizeCategory(category) {
  const cleaned = String(category || '')
    .trim()
    .toLowerCase()
    .replace(/\\+/g, '/')
    .split('/')
    .map((part) => part.trim().replace(/[^a-z0-9\u0600-\u06ff_-]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('/');

  return cleaned;
}

function getCategoryPrefix(category) {
  const safeCategory = sanitizeCategory(category);
  return safeCategory ? `${safeCategory}/` : '';
}

function getCategoryFromKey(key) {
  const withoutPrefix = String(key || '').startsWith(UPLOAD_PREFIX)
    ? String(key).slice(UPLOAD_PREFIX.length)
    : String(key || '');
  const parts = withoutPrefix.split('/').filter(Boolean);

  return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
}

function getLocalPublicUrl(req, filename) {
  const baseUrl = env.publicApiUrl || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${trimSlashes(filename)}`;
}

function getR2PublicUrl(key) {
  if (!env.r2PublicUrl) {
    throw new Error('R2_PUBLIC_URL is required when STORAGE_DRIVER=r2 so uploaded media can be displayed in the browser.');
  }

  return `${trimTrailingSlash(env.r2PublicUrl)}/${trimSlashes(key)}`;
}

function isR2Configured() {
  return Boolean(
    env.r2AccountId &&
    env.r2AccessKeyId &&
    env.r2SecretAccessKey &&
    env.r2BucketName &&
    env.r2PublicUrl
  );
}

function shouldUseR2() {
  return String(env.storageDriver || '').toLowerCase() === 'r2';
}

function assertR2Configured() {
  if (!isR2Configured()) {
    throw new Error('R2 storage is enabled but R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL must be set.');
  }
}

let r2Client;
function getR2Client() {
  assertR2Configured();

  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    });
  }

  return r2Client;
}

function createStoredFileName(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const originalBaseName = path.basename(originalName || 'file', ext);
  const safeOriginalName = originalBaseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file';

  return `${Date.now()}_${crypto.randomUUID()}_${safeOriginalName}${ext}`;
}

function getMediaType(name, mimeType = '') {
  const lowerName = String(name || '').toLowerCase();
  const lowerMime = String(mimeType || '').toLowerCase();

  if (lowerMime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(lowerName)) return 'image';
  if (lowerMime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(lowerName)) return 'audio';
  if (lowerMime.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(lowerName)) return 'video';

  return 'unknown';
}

function matchesMediaFilter(file, query, type, category) {
  if (type && file.type !== type) return false;
  if (category && file.category !== category) return false;
  if (query && !String(file.filename || '').toLowerCase().includes(query)) return false;
  return ['image', 'audio', 'video'].includes(file.type);
}

async function uploadToLocal(req, file, category) {
  const categoryPrefix = getCategoryPrefix(category);
  const uploadDir = path.join(env.uploadsDir, ...categoryPrefix.split('/').filter(Boolean));

  if (!fs.existsSync(uploadDir)) {
    await fs.promises.mkdir(uploadDir, { recursive: true });
  }

  const filename = createStoredFileName(file.originalname);
  const relativeName = `${categoryPrefix}${filename}`;
  const filePath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filePath, file.buffer);

  return {
    url: getLocalPublicUrl(req, relativeName),
    filename,
    key: relativeName,
    originalName: file.originalname || '',
    displayName: path.basename(file.originalname || filename, path.extname(file.originalname || filename)),
    type: getMediaType(filename, file.mimetype),
    mimeType: file.mimetype || '',
    size: file.size || file.buffer?.length || 0,
    category: sanitizeCategory(category),
  };
}

async function uploadToR2(file, category) {
  const filename = createStoredFileName(file.originalname);
  const safeCategory = sanitizeCategory(category);
  const key = `${UPLOAD_PREFIX}${getCategoryPrefix(safeCategory)}${filename}`;

  await getR2Client().send(new PutObjectCommand({
    Bucket: env.r2BucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype || 'application/octet-stream',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return {
    url: getR2PublicUrl(key),
    filename,
    key,
    originalName: file.originalname || '',
    displayName: path.basename(file.originalname || filename, path.extname(file.originalname || filename)),
    type: getMediaType(filename, file.mimetype),
    mimeType: file.mimetype || '',
    size: file.size || file.buffer?.length || 0,
    category: safeCategory,
  };
}

async function uploadUploadedFile(req, file, options = {}) {
  const category = options.category || req.body?.category || '';

  if (shouldUseR2()) {
    return uploadToR2(file, category);
  }

  return uploadToLocal(req, file, category);
}

async function collectLocalFiles(dir, baseDir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.name.startsWith('.')) return [];
    if (entry.isDirectory()) return collectLocalFiles(entryPath, baseDir);
    if (!entry.isFile()) return [];

    const stats = await fs.promises.stat(entryPath);
    return [{
      name: path.relative(baseDir, entryPath).split(path.sep).join('/'),
      stats,
    }];
  }));

  return nestedFiles.flat();
}

async function listLocalUploadedFiles(req, query, type, category) {
  const safeCategory = sanitizeCategory(category);
  const baseDir = safeCategory
    ? path.join(env.uploadsDir, ...safeCategory.split('/'))
    : env.uploadsDir;

  const fileEntries = await collectLocalFiles(baseDir, env.uploadsDir);

  return fileEntries
    .map((entry) => {
      const publicUrl = getLocalPublicUrl(req, entry.name);
      return {
        id: entry.name,
        filename: path.posix.basename(entry.name),
        key: entry.name,
        url: publicUrl,
        thumbnail: publicUrl,
        source: 'upload',
        type: getMediaType(entry.name),
        category: getCategoryFromKey(`${UPLOAD_PREFIX}${entry.name}`),
        createdAt: entry.stats.birthtimeMs || entry.stats.mtimeMs || 0,
      };
    })
    .filter((file) => matchesMediaFilter(file, query, type, safeCategory))
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function listR2UploadedFiles(query, type, category) {
  const safeCategory = sanitizeCategory(category);
  const response = await getR2Client().send(new ListObjectsV2Command({
    Bucket: env.r2BucketName,
    Prefix: `${UPLOAD_PREFIX}${getCategoryPrefix(safeCategory)}`,
  }));

  return (response.Contents || [])
    .filter((object) => object.Key && object.Key !== UPLOAD_PREFIX)
    .map((object) => {
      const filename = path.posix.basename(object.Key);
      const publicUrl = getR2PublicUrl(object.Key);

      return {
        id: object.Key,
        filename,
        key: object.Key,
        url: publicUrl,
        thumbnail: publicUrl,
        source: 'r2',
        type: getMediaType(filename),
        category: getCategoryFromKey(object.Key),
        createdAt: object.LastModified ? object.LastModified.getTime() : 0,
      };
    })
    .filter((file) => matchesMediaFilter(file, query, type, safeCategory))
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function listUploadedFiles(req, filters = {}) {
  const query = String(filters.query || '').trim().toLowerCase();
  const type = String(filters.type || '').trim().toLowerCase();
  const category = sanitizeCategory(filters.category || '');

  if (shouldUseR2()) {
    return listR2UploadedFiles(query, type, category);
  }

  return listLocalUploadedFiles(req, query, type, category);
}
function normalizeUploadKey(key) {
  const trimmedKey = trimSlashes(key);
  if (!trimmedKey) return '';
  return trimmedKey.startsWith(UPLOAD_PREFIX) ? trimmedKey.slice(UPLOAD_PREFIX.length) : trimmedKey;
}

async function deleteLocalUploadedFile(key) {
  const relativeKey = normalizeUploadKey(key);
  if (!relativeKey || relativeKey.includes('..')) return false;

  const uploadsRoot = path.resolve(env.uploadsDir);
  const targetPath = path.resolve(uploadsRoot, ...relativeKey.split('/').filter(Boolean));
  if (!targetPath.startsWith(`${uploadsRoot}${path.sep}`)) return false;

  try {
    const stats = await fs.promises.stat(targetPath);
    if (!stats.isFile()) return false;
    await fs.promises.unlink(targetPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function deleteR2UploadedFile(key) {
  const trimmedKey = trimSlashes(key);
  const objectKey = trimmedKey.startsWith(UPLOAD_PREFIX) ? trimmedKey : `${UPLOAD_PREFIX}${trimmedKey}`;
  if (!objectKey || objectKey === UPLOAD_PREFIX || objectKey.includes('..')) return false;

  await getR2Client().send(new DeleteObjectCommand({
    Bucket: env.r2BucketName,
    Key: objectKey,
  }));
  return true;
}

async function deleteUploadedFile(key) {
  if (shouldUseR2()) {
    return deleteR2UploadedFile(key);
  }

  return deleteLocalUploadedFile(key);
}

module.exports = {
  uploadUploadedFile,
  listUploadedFiles,
  deleteUploadedFile,
  getMediaType,
  sanitizeCategory,
};
