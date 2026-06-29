const path = require('path');
const prisma = require('../config/prisma');
const storageService = require('../services/storage.service');
const { logActivity } = require('../services/audit.service');

const GENERAL_FOLDER_ID = '__general__';

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

function folderPathSlug(parent, name) {
  const segment = storageService.sanitizeCategory(name);
  if (!segment) return '';
  return parent?.slug ? `${parent.slug}/${segment}` : segment;
}

function normalizeNullableFolderId(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === GENERAL_FOLDER_ID || raw.toLowerCase() === 'general' || raw.toLowerCase() === 'null') {
    return null;
  }
  return raw;
}

function formatFolder(folder) {
  return {
    id: folder.id,
    name: folder.name,
    slug: folder.slug,
    code: folder.code || folder.slug,
    parentId: folder.parentId || null,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    children: Array.isArray(folder.children) ? folder.children.map(formatFolder) : [],
  };
}

function buildFolderTree(folders) {
  const nodes = new Map();
  folders.forEach((folder) => {
    nodes.set(folder.id, { ...formatFolder(folder), children: [] });
  });

  const roots = [];
  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (items) => {
    items.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
    items.forEach((item) => sortNodes(item.children));
    return items;
  };

  return sortNodes(roots);
}

function formatAsset(asset) {
  const folder = asset.folder || null;
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
    folderId: asset.folderId || null,
    folderName: folder?.name || '',
    folderSlug: folder?.slug || '',
    createdAt: asset.createdAt ? new Date(asset.createdAt).getTime() : 0,
  };
}

function formatStorageFile(file) {
  return {
    ...file,
    displayName: getDisplayNameFromOriginal(file.originalName, file.filename),
    thumbnail: file.thumbnail || file.url,
    folderId: null,
    folderName: '',
    folderSlug: '',
  };
}

function getFolderFilter(query) {
  const hasFolderId = Object.prototype.hasOwnProperty.call(query, 'folderId');
  const scope = String(query.scope || 'current').trim().toLowerCase();
  if (scope === 'all') return { mode: 'all', hasFolderId, folderId: undefined };
  if (!hasFolderId) return { mode: 'legacy', hasFolderId, folderId: undefined };

  const folderId = normalizeNullableFolderId(query.folderId);
  return { mode: folderId ? 'folder' : 'general', hasFolderId: true, folderId };
}

function buildAssetWhere({ query, type, category, folderFilter }) {
  const where = {};
  if (type) where.type = type;

  if (folderFilter.mode === 'folder') {
    where.folderId = folderFilter.folderId;
  } else if (folderFilter.mode === 'general') {
    where.folderId = null;
  } else if (category) {
    where.category = category;
  }

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

async function findFolderById(folderId) {
  if (!folderId) return null;
  return prisma.mediaFolder.findUnique({ where: { id: folderId } });
}

async function ensureLegacyFolder(category, name, user) {
  const slug = storageService.sanitizeCategory(category);
  if (!slug) return null;

  const existing = await prisma.mediaFolder.findUnique({ where: { slug } });
  if (existing) return existing;

  return prisma.mediaFolder.create({
    data: {
      slug,
      code: slug,
      name: String(name || category || slug).trim() || slug,
      createdBy: user?.id || user?.email || '',
    },
  });
}

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  try {
    const requestedFolderId = normalizeNullableFolderId(req.body?.folderId);
    const folder = await findFolderById(requestedFolderId);
    if (requestedFolderId && !folder) {
      return res.status(404).json({ success: false, message: 'Media folder not found.' });
    }

    const legacyCategory = requestedFolderId ? '' : storageService.sanitizeCategory(req.body?.category || '');
    const legacyFolder = !requestedFolderId
      ? await ensureLegacyFolder(legacyCategory, req.body?.folderName || req.body?.category, req.user)
      : null;

    const uploadedFile = await storageService.uploadUploadedFile(req, req.file, { category: legacyCategory });

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
      category: legacyCategory || null,
      folderId: folder?.id || legacyFolder?.id || null,
      source: uploadedFile.source || 'upload',
      createdBy: req.user?.id || req.user?.email || '',
    };

    const asset = await prisma.mediaAsset.upsert({
      where: { key: assetPayload.key },
      update: assetPayload,
      create: assetPayload,
      include: { folder: true },
    });

    await logActivity({ req, action: 'FILE_UPLOADED', entityType: 'MediaAsset', entityId: asset.id, after: asset });

    return res.status(201).json({
      success: true,
      url: asset.url,
      filename: asset.filename,
      key: asset.key,
      data: formatAsset(asset),
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload file.', error: error.message });
  }
}

async function listUploadedFiles(req, res) {
  try {
    const query = String(req.query.query || '').trim().toLowerCase();
    const type = String(req.query.type || '').trim().toLowerCase();
    const category = storageService.sanitizeCategory(req.query.category || '');
    const folderFilter = getFolderFilter(req.query);

    const dbAssets = await prisma.mediaAsset.findMany({
      where: buildAssetWhere({ query, type, category, folderFilter }),
      include: { folder: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const dbFiles = dbAssets.map(formatAsset);
    const knownKeys = new Set(dbFiles.map((file) => file.key).filter(Boolean));
    const includeStorageFiles = folderFilter.mode === 'all' || folderFilter.mode === 'general' || folderFilter.mode === 'legacy';
    const storageCategory = folderFilter.mode === 'legacy' ? category : '';
    const storageFiles = includeStorageFiles
      ? await storageService.listUploadedFiles(req, { query, type, category: storageCategory })
      : [];
    const legacyFiles = storageFiles
      .filter((file) => !knownKeys.has(file.key))
      .map(formatStorageFile);

    const files = [...dbFiles, ...legacyFiles].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.json({ success: true, count: files.length, data: files });
  } catch (error) {
    console.error('List Files Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list uploaded files.', error: error.message });
  }
}

async function deleteUploadedFile(req, res) {
  const key = req.query.key || req.body?.key;
  if (!key) return res.status(400).json({ success: false, message: 'File key is required.' });

  try {
    const deleted = await storageService.deleteUploadedFile(key);
    await prisma.mediaAsset.deleteMany({ where: { key } });
    if (!deleted) return res.status(404).json({ success: false, message: 'File not found.' });

    await logActivity({ req, action: 'FILE_DELETED', entityType: 'MediaAsset', entityId: key, before: { key } });

    return res.json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Delete File Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete file.', error: error.message });
  }
}

async function listMediaFolders(_req, res) {
  try {
    const folders = await prisma.mediaFolder.findMany({ orderBy: [{ parentId: 'asc' }, { name: 'asc' }] });
    const data = folders.map(formatFolder);
    return res.json({ success: true, count: data.length, data, tree: buildFolderTree(folders) });
  } catch (error) {
    console.error('List Folders Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list media folders.', error: error.message });
  }
}

async function createMediaFolder(req, res) {
  try {
    const name = String(req.body?.name || '').trim();
    const parentId = normalizeNullableFolderId(req.body?.parentId);
    if (!name) return res.status(400).json({ success: false, message: 'Folder name is required.' });

    const parent = await findFolderById(parentId);
    if (parentId && !parent) return res.status(404).json({ success: false, message: 'Parent folder not found.' });

    const slug = folderPathSlug(parent, req.body?.slug || name);
    if (!slug) return res.status(400).json({ success: false, message: 'Folder name is invalid.' });

    const existing = await prisma.mediaFolder.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Folder already exists in this location.' });
    }

    const folder = await prisma.mediaFolder.create({
      data: {
        slug,
        code: slug,
        name,
        parentId: parent?.id || null,
        createdBy: req.user?.id || req.user?.email || '',
      },
    });

    await logActivity({ req, action: 'MEDIA_FOLDER_CREATED', entityType: 'MediaFolder', entityId: folder.id, after: folder });
    return res.status(201).json({ success: true, data: formatFolder(folder) });
  } catch (error) {
    console.error('Create Folder Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create media folder.', error: error.message });
  }
}

async function moveUploadedFiles(req, res) {
  try {
    const folderId = normalizeNullableFolderId(req.body?.folderId);
    const folder = await findFolderById(folderId);
    if (folderId && !folder) return res.status(404).json({ success: false, message: 'Media folder not found.' });

    const assets = Array.isArray(req.body?.assets) ? req.body.assets : [];
    const keys = Array.isArray(req.body?.keys) ? req.body.keys : [];
    const normalizedAssets = [
      ...assets,
      ...keys.map((key) => ({ key })),
    ].filter((asset) => asset?.key);

    if (!normalizedAssets.length) {
      return res.status(400).json({ success: false, message: 'No files selected.' });
    }

    const moved = [];
    for (const item of normalizedAssets) {
      const filename = item.filename || path.posix.basename(item.key || '');
      const existing = await prisma.mediaAsset.findUnique({ where: { key: item.key } });
      const payload = {
        folderId: folder?.id || null,
        category: null,
      };

      const asset = existing
        ? await prisma.mediaAsset.update({ where: { key: item.key }, data: payload, include: { folder: true } })
        : await prisma.mediaAsset.create({
            data: {
              displayName: getDisplayNameFromOriginal(item.originalName, item.displayName || filename),
              originalName: item.originalName || '',
              filename,
              key: item.key,
              url: item.url || '',
              thumbnail: item.thumbnail || item.url || '',
              type: item.type || storageService.getMediaType(filename, item.mimeType),
              mimeType: item.mimeType || '',
              size: Number(item.size || 0),
              folderId: folder?.id || null,
              category: null,
              source: item.source || 'upload',
              createdBy: req.user?.id || req.user?.email || '',
            },
            include: { folder: true },
          });

      moved.push(formatAsset(asset));
    }

    await logActivity({ req, action: 'FILES_MOVED', entityType: 'MediaAsset', after: { count: moved.length, folderId: folder?.id || null } });
    return res.json({ success: true, count: moved.length, data: moved });
  } catch (error) {
    console.error('Move Files Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to move files.', error: error.message });
  }
}

async function deleteMediaFolder(req, res) {
  const raw = req.params.id || req.params.slug || req.query.id || req.query.slug || req.body?.id || req.body?.slug || '';
  const value = String(raw || '').trim();
  if (!value) return res.status(400).json({ success: false, message: 'Folder id is required.' });

  try {
    const folder = await prisma.mediaFolder.findFirst({ where: { OR: [{ id: value }, { slug: value }] } });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    const [childrenCount, assetsCount] = await Promise.all([
      prisma.mediaFolder.count({ where: { parentId: folder.id } }),
      prisma.mediaAsset.count({ where: { folderId: folder.id } }),
    ]);

    if (childrenCount || assetsCount) {
      return res.status(409).json({
        success: false,
        message: 'Move files and child folders before deleting this folder.',
      });
    }

    await prisma.mediaFolder.delete({ where: { id: folder.id } });
    await logActivity({ req, action: 'MEDIA_FOLDER_DELETED', entityType: 'MediaFolder', entityId: folder.id, before: folder });
    return res.json({ success: true, message: 'Folder deleted successfully.' });
  } catch (error) {
    console.error('Delete Folder Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete media folder.', error: error.message });
  }
}

module.exports = {
  uploadFile,
  listUploadedFiles,
  deleteUploadedFile,
  listMediaFolders,
  createMediaFolder,
  moveUploadedFiles,
  deleteMediaFolder,
};
