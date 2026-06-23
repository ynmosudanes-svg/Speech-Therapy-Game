const express = require('express');
const multer = require('multer');
const env = require('../config/env');
const { uploadFile, listUploadedFiles } = require('../controllers/upload.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadMaxFileSizeMb * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and audio/video are allowed.'));
    }
  }
});

router.post(
  '/api/upload',
  authenticate,
  authorize('SUPER_ADMIN', 'THERAPIST'),
  upload.single('file'),
  uploadFile
);

router.get(
  '/api/uploads',
  authenticate,
  authorize('SUPER_ADMIN', 'THERAPIST'),
  listUploadedFiles
);

module.exports = router;
