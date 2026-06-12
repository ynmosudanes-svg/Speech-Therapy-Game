const express = require('express');
const multer = require('multer');
const path = require('path');
const env = require('../config/env');
const { uploadFile, listUploadedFiles } = require('../controllers/upload.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(env.uploadsDir)) {
      fs.mkdirSync(env.uploadsDir, { recursive: true });
    }
    cb(null, env.uploadsDir);
  },
  filename: (req, file, cb) => {
    const originalExt = path.extname(file.originalname);
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}${originalExt}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Check mime type (allow images and audio/video)
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
      'video/mp4', 'video/webm', 'video/quicktime'
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
