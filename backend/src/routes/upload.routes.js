const express = require('express');
const multer = require('multer');
const env = require('../config/env');
const { uploadFile, listUploadedFiles, deleteUploadedFile, listMediaFolders, createMediaFolder, moveUploadedFiles, deleteMediaFolder } = require('../controllers/upload.controller');
const { authenticate, authorize, authorizePermission } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../utils/permissions');

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

const staffCanViewMedia = authorize('SUPER_ADMIN', 'ADMIN', 'DATA_ENTRY', 'THERAPIST');

router.post(
  '/api/upload',
  authenticate,
  authorizePermission(PERMISSIONS.FILES_UPLOAD),
  upload.single('file'),
  uploadFile
);

router.get('/api/uploads', authenticate, staffCanViewMedia, listUploadedFiles);
router.get('/api/media-folders', authenticate, staffCanViewMedia, listMediaFolders);

router.post(
  '/api/media-folders',
  authenticate,
  authorizePermission(PERMISSIONS.FILES_UPLOAD),
  createMediaFolder
);

router.delete(
  '/api/media-folders/:id',
  authenticate,
  authorizePermission(PERMISSIONS.FILES_DELETE),
  deleteMediaFolder
);

router.patch(
  '/api/uploads/move',
  authenticate,
  authorizePermission(PERMISSIONS.FILES_UPLOAD),
  moveUploadedFiles
);

router.delete(
  '/api/uploads',
  authenticate,
  authorizePermission(PERMISSIONS.FILES_DELETE),
  deleteUploadedFile
);

module.exports = router;