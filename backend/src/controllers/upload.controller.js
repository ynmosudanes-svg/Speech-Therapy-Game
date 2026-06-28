const path = require('path');
const prisma = require('../config/prisma');
const storageService = require('../services/storage.service');

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getFriendlyName(filename = '') {
  const baseName = path.posix.basename(String(filename || ''));
  const withoutPrefix = baseName.replace(/^\d+_[0-9a-f-]{36}_/i, '');
  return withoutPrefix || baseName;
}

function getDisplayNameFromOriginal(originalName = '', fallback = '') {
  const source = originalName || fallback || 'file';
  const ext = path.extname(source);
  return path.basename(source, ext) || getFriendlyName(fallback);
}

function formatAsset(asset) {
  return {
    id: asset.id || asset.key,
    filename: asset.filename || path.posix.basename(asset.key || ''),
    displayName: asset.displayName || getDisplayNameFromOriginal(asset.originalName, asset.filename),
    originalName: asset.originalName || '',
    key: asset.key,
    url: asset.url,
    thumbnail: asset.thumbnail || asset.url,
    source: asset.source || 'upload',
    type: asset.type || 'unknown',
    mimeType: asset.mimeType || '',
    size: asset.size || 0,
    category: asset.category || '',
    createdAt: asset.createdAt ? new Date(asset.createdAt).getTime() : 0,
  };
}

function formatStorageFile(file) {
  return {
    ...file,
    displayName: getDisplayNameFromOriginal(file.originalName, file.filename),
    thumbnail: file.thumbnail || file.url,
  };
}

function buildAssetWhere({ query, type, category }) {
  const where = {};
  if (type) where.type = type;
  if (category) where.category = category;
  if (query) {
    where.OR = [
      { displayName: { contains: query, mode: 'insensitive' } },
      { originalName: { contains: query, mode: 'insensitive' } },
      { filename: { contains: query, mode: 'insensitive' } },
      { key: { contains: query, mode: 'insensitive' } },
      { category: { contains: query, mode: 'insensitive' } },
    ];
  }
  return where;
}

async function ensureFolder(category, name, user) {
  const slug = storageService.sanitizeCategory(category);
  if (!slug) return null;

  const existing = await prisma.mediaFolder.findUnique({ where: { slug } });
  if (existing) return existing;

  return prisma.mediaFolder.create({
    data: {
      slug,
      name: String(name || category || slug).trim() || slug,
      createdBy: user?.id || user?.email || '',
    },
  });
}

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded.',
    });
  }

  try {
    const category = storageService.sanitizeCategory(req.body?.category || '');
    const folder = await ensureFolder(category, req.body?.folderName || req.body?.category, req.user);
    const uploadedFile = await storageService.uploadUploadedFile(req, req.file, { category });

    const assetPayload = {
      displayName: getDisplayNameFromOriginal(uploadedFile.originalName, uploadedFile.filename),
      originalName: uploadedFile.originalName || req.file.originalname || '',
      filename: uploadedFile.filename || path.posix.basename(uploadedFile.key || ''),
      key: uploadedFile.key || uploadedFile.filename,
      url: uploadedFile.url,
      thumbnail: uploadedFile.url,
      type: uploadedFile.type || storageService.getMediaType(uploadedFile.filename, req.file.mimetype),
      mimeType: uploadedFile.mimeType || req.file.mimetype || '',
      size: uploadedFile.size || req.file.size || 0,
      category: category || null,
      folderId: folder?.id || null,
      source: uploadedFile.source || 'upload',
      createdBy: req.user?.id || req.user?.email || '',
    };

    const asset = await prisma.mediaAsset.upsert({
      where: { key: assetPayload.key },
      update: assetPayload,
      create: assetPayload,
    });

    return res.status(201).json({
      success: true,
      url: asset.url,
      filename: asset.filename,
      key: asset.key,
      data: formatAsset(asset),
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file.',
      error: error.message,
    });
  }
}

async function listUploadedFiles(req, res) {
  try {
    const query = String(req.query.query || '').trim().toLowerCase();
    const type = String(req.query.type || '').trim().toLowerCase();
    const category = storageService.sanitizeCategory(req.query.category || '');

    const dbAssets = await prisma.mediaAsset.findMany({
      where: buildAssetWhere({ query, type, category }),
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const dbFiles = dbAssets.map(formatAsset);
    const knownKeys = new Set(dbFiles.map((file) => file.key).filter(Boolean));
    const storageFiles = await storageService.listUploadedFiles(req, { query, type, category });
    const legacyFiles = storageFiles
      .filter((file) => !knownKeys.has(file.key))
      .map(formatStorageFile);

    const files = [...dbFiles, ...legacyFiles]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error('List Files Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list uploaded files.',
      error: error.message,
    });
  }
}

async function deleteUploadedFile(req, res) {
  const key = req.query.key || req.body?.key;

  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'File key is required.',
    });
  }

  try {
    const deleted = await storageService.deleteUploadedFile(key);
    await prisma.mediaAsset.deleteMany({ where: { key } });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      });
    }

    return res.json({
      success: true,
      message: 'File deleted successfully.',
    });
  } catch (error) {
    console.error('Delete File Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file.',
      error: error.message,
    });
  }
}

async function listMediaFolders(_req, res) {
  try {
    const folders = await prisma.mediaFolder.findMany({ orderBy: { name: 'asc' } });
    return res.json({
      success: true,
      count: folders.length,
      data: folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        slug: folder.slug,
        createdAt: folder.createdAt,
      })),
    });
  } catch (error) {
    console.error('List Folders Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list media folders.',
      error: error.message,
    });
  }
}

async function createMediaFolder(req, res) {
  try {
    const name = String(req.body?.name || '').trim();
    const slug = storageService.sanitizeCategory(req.body?.slug || name);
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required.',
      });
    }

    const existing = await prisma.mediaFolder.findUnique({ where: { slug } });
    const folder = existing
      ? await prisma.mediaFolder.update({ where: { slug }, data: { name } })
      : await prisma.mediaFolder.create({
          data: {
            slug,
            name,
            createdBy: req.user?.id || req.user?.email || '',
          },
        });

    return res.status(201).json({
      success: true,
      data: {
        id: folder.id,
        name: folder.name,
        slug: folder.slug,
        createdAt: folder.createdAt,
      },
    });
  } catch (error) {
    console.error('Create Folder Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create media folder.',
      error: error.message,
    });
  }
}

async function deleteMediaFolder(req, res) {
  const slug = storageService.sanitizeCategory(req.params.slug || req.query.slug || req.body?.slug || '');
  if (!slug) {
    return res.status(400).json({
      success: false,
      message: 'Folder slug is required.',
    });
  }

  try {
    await prisma.mediaFolder.deleteMany({ where: { slug } });
    return res.json({
      success: true,
      message: 'Folder deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Folder Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete media folder.',
      error: error.message,
    });
  }
}

module.exports = {
  uploadFile,
  listUploadedFiles,
  deleteUploadedFile,
  listMediaFolders,
  createMediaFolder,
  deleteMediaFolder,
};