const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const env = require('../config/env');

const UPLOAD_PREFIX = 'uploads/';

function trimSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/g, '');
}

function getLocalPublicUrl(req, filename) {
  const baseUrl = env.publicApiUrl || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
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
  return `${Date.now()}_${crypto.randomUUID()}${ext}`;
}

function getMediaType(name, mimeType = '') {
  const lowerName = String(name || '').toLowerCase();
  const lowerMime = String(mimeType || '').toLowerCase();

  if (lowerMime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(lowerName)) return 'image';
  if (lowerMime.startsWith('audio/') || /\\.(mp3|wav|ogg|m4a|aac)$/i.test(lowerName)) return 'audio';
  if (lowerMime.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(lowerName)) return 'video';

  return 'unknown';
}

function matchesMediaFilter(file, query, type) {
  if (type && file.type !== type) return false;
  if (query && !String(file.filename || '').toLowerCase().includes(query)) return false;
  return ['image', 'audio', 'video'].includes(file.type);
}

async function uploadToLocal(req, file) {
  if (!fs.existsSync(env.uploadsDir)) {
    await fs.promises.mkdir(env.uploadsDir, { recursive: true });
  }

  const filename = createStoredFileName(file.originalname);
  const filePath = path.join(env.uploadsDir, filename);
  await fs.promises.writeFile(filePath, file.buffer);

  return {
    url: getLocalPublicUrl(req, filename),
    filename,
  };
}

async function uploadToR2(file) {
  const filename = createStoredFileName(file.originalname);
  const key = `${UPLOAD_PREFIX}${filename}`;

  await getR2Client().send(new PutObjectCommand({
    Bucket: env.r2BucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype || 'application/octet-stream',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return {
    url: getR2PublicUrl(key),
    filename: key,
  };
}

async function uploadUploadedFile(req, file) {
  if (shouldUseR2()) {
    return uploadToR2(file);
  }

  return uploadToLocal(req, file);
}

async function listLocalUploadedFiles(req, query, type) {
  if (!fs.existsSync(env.uploadsDir)) {
    return [];
  }

  const fileNames = await fs.promises.readdir(env.uploadsDir);
  const filesWithStats = await Promise.all(fileNames.map(async (name) => {
    if (name.startsWith('.')) return null;

    const filePath = path.join(env.uploadsDir, name);
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) return null;

    const publicUrl = getLocalPublicUrl(req, name);
    return {
      id: name,
      filename: name,
      url: publicUrl,
      thumbnail: publicUrl,
      source: 'upload',
      type: getMediaType(name),
      createdAt: stats.birthtimeMs || stats.mtimeMs || 0,
    };
  }));

  return filesWithStats
    .filter(Boolean)
    .filter((file) => matchesMediaFilter(file, query, type))
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function listR2UploadedFiles(query, type) {
  const response = await getR2Client().send(new ListObjectsV2Command({
    Bucket: env.r2BucketName,
    Prefix: UPLOAD_PREFIX,
  }));

  return (response.Contents || [])
    .filter((object) => object.Key && object.Key !== UPLOAD_PREFIX)
    .map((object) => {
      const filename = path.posix.basename(object.Key);
      const publicUrl = getR2PublicUrl(object.Key);

      return {
        id: object.Key,
        filename,
        url: publicUrl,
        thumbnail: publicUrl,
        source: 'r2',
        type: getMediaType(filename),
        createdAt: object.LastModified ? object.LastModified.getTime() : 0,
      };
    })
    .filter((file) => matchesMediaFilter(file, query, type))
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function listUploadedFiles(req, filters = {}) {
  const query = String(filters.query || '').trim().toLowerCase();
  const type = String(filters.type || '').trim().toLowerCase();

  if (shouldUseR2()) {
    return listR2UploadedFiles(query, type);
  }

  return listLocalUploadedFiles(req, query, type);
}

module.exports = {
  uploadUploadedFile,
  listUploadedFiles,
};

