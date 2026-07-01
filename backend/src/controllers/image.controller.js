const net = require('net');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const imageService = require('../services/image.service');
const { logActivity } = require('../services/audit.service');

const MAX_PROXY_IMAGE_BYTES = 12 * 1024 * 1024;

function isBlockedHostname(hostname) {
  const normalized = String(hostname || '').trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized.endsWith('.local')) return true;

  const ipVersion = net.isIP(normalized);
  if (!ipVersion) return false;

  if (ipVersion === 4) {
    const [a, b] = normalized.split('.').map((part) => Number(part));
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }

  return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
}

const proxyImage = asyncHandler(async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();
  let imageUrl;

  try {
    imageUrl = new URL(rawUrl);
  } catch {
    throw new ApiError(400, 'Invalid image url.');
  }

  if (!['http:', 'https:'].includes(imageUrl.protocol)) {
    throw new ApiError(400, 'Only http and https image urls are supported.');
  }

  if (isBlockedHostname(imageUrl.hostname)) {
    throw new ApiError(400, 'This image host is not allowed.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(imageUrl.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'SpeechTherapyGame/1.0',
      },
    });

    if (!response.ok) {
      throw new ApiError(502, 'Failed to load image.');
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    if (!contentType.toLowerCase().startsWith('image/')) {
      throw new ApiError(415, 'The proxied url is not an image.');
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_PROXY_IMAGE_BYTES) {
      throw new ApiError(413, 'Image is too large to proxy.');
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_PROXY_IMAGE_BYTES) {
      throw new ApiError(413, 'Image is too large to proxy.');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(arrayBuffer));
  } finally {
    clearTimeout(timeout);
  }
});

const searchImages = asyncHandler(async (req, res) => {
  const results = await imageService.searchImages(req.query.query, req.query.provider);
  res.json(results);
});

const saveImage = asyncHandler(async (req, res) => {
  const image = await imageService.saveImage(req.body);
  await logActivity({ req, action: 'IMAGE_LIBRARY_SAVED', entityType: 'ImageLibrary', entityId: image.id, after: image });
  res.status(201).json({
    success: true,
    data: image,
  });
});

const getLibrary = asyncHandler(async (req, res) => {
  const images = await imageService.listLibrary(req.query);
  res.json({
    success: true,
    count: images.length,
    data: images,
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const image = await imageService.deleteImage(req.params.id);
  await logActivity({ req, action: 'IMAGE_LIBRARY_DELETED', entityType: 'ImageLibrary', entityId: image.id, before: image });
  res.json({
    success: true,
    data: image,
  });
});

module.exports = {
  proxyImage,
  searchImages,
  saveImage,
  getLibrary,
  deleteImage,
};