const storageService = require('../services/storage.service');

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded.',
    });
  }

  try {
    const uploadedFile = await storageService.uploadUploadedFile(req, req.file, {
      category: req.body?.category,
    });

    return res.status(201).json({
      success: true,
      url: uploadedFile.url,
      filename: uploadedFile.filename,
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
    const files = await storageService.listUploadedFiles(req, {
      query: req.query.query,
      type: req.query.type,
      category: req.query.category,
    });

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
module.exports = {
  uploadFile,
  listUploadedFiles,
  deleteUploadedFile,
};

