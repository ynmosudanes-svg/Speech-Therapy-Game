const path = require('path');
const fs = require('fs');
const env = require('../config/env');

// Helper to construct the public URL for local files
function getLocalPublicUrl(req, filename) {
  const baseUrl = env.publicApiUrl || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
}

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded.',
    });
  }

  try {
    // Multer diskStorage has already saved the file to env.uploadsDir
    const filename = req.file.filename;
    const publicUrl = getLocalPublicUrl(req, filename);

    return res.status(201).json({
      success: true,
      url: publicUrl,
      filename: filename,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file to local storage.',
      error: error.message,
    });
  }
}

async function listUploadedFiles(req, res) {
  const query = String(req.query.query || '').trim().toLowerCase();
  const type = String(req.query.type || '').trim().toLowerCase();

  try {
    // Ensure uploads directory exists
    if (!fs.existsSync(env.uploadsDir)) {
      return res.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const fileNames = await fs.promises.readdir(env.uploadsDir);
    
    // Get stats for all files to sort by creation time
    const filesWithStats = await Promise.all(
      fileNames.map(async (name) => {
        // Skip hidden files
        if (name.startsWith('.')) return null;
        
        const filePath = path.join(env.uploadsDir, name);
        const stats = await fs.promises.stat(filePath);
        
        // Skip directories
        if (stats.isDirectory()) return null;
        
        return { name, stats };
      })
    );

    // Filter and map files
    const files = filesWithStats
      .filter((entry) => {
        if (!entry) return false;
        
        const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name);
        const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(entry.name);
        const isVideo = /\.(mp4|webm|mov)$/i.test(entry.name);
        
        if (type === 'image') return isImage;
        if (type === 'audio') return isAudio;
        if (type === 'video') return isVideo;
        
        return isImage || isAudio || isVideo;
      })
      .map((entry) => {
        let mediaType = 'unknown';
        if (/\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)) mediaType = 'image';
        if (/\.(mp3|wav|ogg|m4a)$/i.test(entry.name)) mediaType = 'audio';
        if (/\.(mp4|webm|mov)$/i.test(entry.name)) mediaType = 'video';

        const publicUrl = getLocalPublicUrl(req, entry.name);

        return {
          id: entry.name,
          filename: entry.name,
          url: publicUrl,
          thumbnail: publicUrl,
          source: 'upload',
          type: mediaType,
          createdAt: entry.stats.birthtimeMs || entry.stats.mtimeMs || 0,
        };
      })
      .filter((file) => !query || file.filename.toLowerCase().includes(query))
      .sort((a, b) => b.createdAt - a.createdAt); // Descending order (newest first)

    return res.json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error('List Files Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list files from local storage.',
      error: error.message,
    });
  }
}

module.exports = {
  uploadFile,
  listUploadedFiles,
};
