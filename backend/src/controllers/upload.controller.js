const storageService = require('../services/storage.service');

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded.',
    });
  }

  try {
    const uploadedFile = await storageService.uploadUploadedFile(req, req.file);

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

module.exports = {
  uploadFile,
  listUploadedFiles,
};
