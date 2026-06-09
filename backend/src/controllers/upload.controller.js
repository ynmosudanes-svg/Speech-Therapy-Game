const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const IMAGE_FILE_REGEX = /\.(png|jpe?g|webp|gif|svg)$/i;

function buildFileUrl(req, filename) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
}

function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded.',
    });
  }

  return res.status(201).json({
    success: true,
    url: buildFileUrl(req, req.file.filename),
    filename: req.file.filename,
  });
}

function listUploadedFiles(req, res) {
  const query = String(req.query.query || '').trim().toLowerCase();
  const type = String(req.query.type || '').trim().toLowerCase();

  if (!fs.existsSync(env.uploadsDir)) {
    return res.json({
      success: true,
      count: 0,
      data: [],
    });
  }

  const files = fs
    .readdirSync(env.uploadsDir, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isFile()) return false;
      const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name);
      const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(entry.name);
      const isVideo = /\.(mp4|webm|mov)$/i.test(entry.name);
      
      if (type === 'image') return isImage;
      if (type === 'audio') return isAudio;
      if (type === 'video') return isVideo;
      
      // If no type specified, return only known media types or all files?
      // Better to return known media files to avoid showing system files
      return isImage || isAudio || isVideo;
    })
    .map((entry) => {
      const absolutePath = path.join(env.uploadsDir, entry.name);
      const stats = fs.statSync(absolutePath);

      let mediaType = 'unknown';
      if (/\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)) mediaType = 'image';
      if (/\.(mp3|wav|ogg|m4a)$/i.test(entry.name)) mediaType = 'audio';
      if (/\.(mp4|webm|mov)$/i.test(entry.name)) mediaType = 'video';

      return {
        id: entry.name,
        filename: entry.name,
        url: buildFileUrl(req, entry.name),
        thumbnail: buildFileUrl(req, entry.name),
        source: 'upload',
        type: mediaType,
        createdAt: stats.mtimeMs || stats.ctimeMs || 0,
      };
    })
    .filter((file) => !query || file.filename.toLowerCase().includes(query))
    .sort((first, second) => second.createdAt - first.createdAt)
    .slice(0, 100);

  return res.json({
    success: true,
    count: files.length,
    data: files,
  });
}

module.exports = {
  uploadFile,
  listUploadedFiles,
};
