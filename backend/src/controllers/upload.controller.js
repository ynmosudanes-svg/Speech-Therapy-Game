const path = require('path');
const env = require('../config/env');
const supabase = require('../config/supabase');

const IMAGE_FILE_REGEX = /\.(png|jpe?g|webp|gif|svg)$/i;

function getSupabasePublicUrl(filename) {
  if (!supabase) return '';
  const { data } = supabase.storage
    .from(env.supabaseBucket)
    .getPublicUrl(filename);
  return data.publicUrl;
}

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded.',
    });
  }

  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Supabase storage is not configured. Please add SUPABASE_URL and SUPABASE_KEY to your environment variables.',
    });
  }

  try {
    const originalExt = path.extname(req.file.originalname);
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}${originalExt}`;

    const { data, error } = await supabase.storage
      .from(env.supabaseBucket)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    const publicUrl = getSupabasePublicUrl(filename);

    return res.status(201).json({
      success: true,
      url: publicUrl,
      filename: filename,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file to storage.',
      error: error.message,
    });
  }
}

async function listUploadedFiles(req, res) {
  const query = String(req.query.query || '').trim().toLowerCase();
  const type = String(req.query.type || '').trim().toLowerCase();

  if (!supabase) {
    return res.json({
      success: true,
      count: 0,
      data: [],
      message: 'Supabase storage not configured',
    });
  }

  try {
    const { data: filesList, error } = await supabase.storage
      .from(env.supabaseBucket)
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Supabase list error:', error);
      throw error;
    }

    // Filter and map files
    const files = filesList
      .filter((entry) => {
        // Skip hidden files like .emptyFolderPlaceholder
        if (entry.name.startsWith('.')) return false;

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

        const publicUrl = getSupabasePublicUrl(entry.name);

        return {
          id: entry.id || entry.name,
          filename: entry.name,
          url: publicUrl,
          thumbnail: publicUrl,
          source: 'upload',
          type: mediaType,
          createdAt: new Date(entry.created_at).getTime() || 0,
        };
      })
      .filter((file) => !query || file.filename.toLowerCase().includes(query));

    return res.json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error('List Files Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list files from storage.',
      error: error.message,
    });
  }
}

module.exports = {
  uploadFile,
  listUploadedFiles,
};
