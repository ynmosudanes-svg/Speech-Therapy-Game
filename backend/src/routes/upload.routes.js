const express = require('express');
const multer = require('multer');
const path = require('path');
const env = require('../config/env');
const { uploadFile, listUploadedFiles } = require('../controllers/upload.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
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
