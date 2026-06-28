const path = require('path');
const storageService = require('../services/storage.service');
const MediaAsset = require('../models/MediaAsset');
const MediaFolder = require('../models/MediaFolder');

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
  const plain = typeof asset.toObject === 'function' ? asset.toObject() : asset;
  return {
    id: plain._id ? String(plain._id) : plain.id || plain.key,
    filename: plain.filename || path.posix.basename(plain.key || ''),
    displayName: plain.displayName || getDisplayNameFromOriginal(plain.originalName, plain.filename),
    originalName: plain.originalName || '',
    key: plain.key,
    url: plain.url,
    thumbnail: plain.thumbnail || plain.url,
    source: plain.source || 'upload',
    type: plain.type || 'unknown',
    mimeType: plain.mimeType || '',
    size: plain.size || 0,
    category: plain.category || '',
    createdAt: plain.createdAt ? new Date(plain.createdAt).getTime() : 0,
  };
}

function formatStorageFile(file) {
  return {
    ...file,
    displayName: getDisplayNameFromOriginal(file.originalName, file.filename),
    thumbnail: file.thumbnail || file.url,
  };
}

function buildAssetQuery({ query, type, category }) {
  const filters = {};
  if (type) filters.type = type;
  if (category) filters.category = category;
  if (query) {
    const regex = new RegExp(escapeRegExp(query), 'i');
    filters.$or = [
      { displayName: regex },
      { originalName: regex },
      { filename: regex },
      { key: regex },
      { category: regex },
    ];
  }
  return filters;
}

async function ensureFolder(category, name, user) {
  const slug = storageService.sanitizeCategory(category);
  if (!slug) return null;

  return MediaFolder.findOneAndUpdate(
    { slug },
    {
      $setOnInsert: {
        slug,
        name: String(name || category || slug).trim() || slug,
        createdBy: user?.id || user?.email || '',
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
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
      category,
      folder: folder?._id,
      source: uploadedFile.source || 'upload',
      createdBy: req.user?.id || req.user?.email || '',
    };

    const asset = await MediaAsset.findOneAndUpdate(
      { key: assetPayload.key },
      { $set: assetPayload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

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

    const dbAssets = await MediaAsset.find(buildAssetQuery({ query, type, category }))
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

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
    await MediaAsset.deleteOne({ key });
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
    const folders = await MediaFolder.find({}).sort({ name: 1 }).lean();
    return res.json({
      success: true,
      count: folders.length,
      data: folders.map((folder) => ({
        id: String(folder._id),
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

    const folder = await MediaFolder.findOneAndUpdate(
      { slug },
      {
        $set: { name },
        $setOnInsert: {
          slug,
          createdBy: req.user?.id || req.user?.email || '',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      data: {
        id: String(folder._id),
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
    await MediaFolder.deleteOne({ slug });
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
