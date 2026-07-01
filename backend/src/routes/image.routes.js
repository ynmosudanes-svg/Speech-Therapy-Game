const express = require('express');
const { body, param, query } = require('express-validator');
const { proxyImage, searchImages, saveImage, getLibrary, deleteImage } = require('../controllers/image.controller');
const { authenticate, authorizePermission } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

router.get(
  '/api/images/proxy',
  [
    query('url').trim().notEmpty().withMessage('Image url is required.'),
    validateRequest,
  ],
  proxyImage
);
router.get(
  '/api/images/search',
  [
    query('query').trim().notEmpty().withMessage('Search query is required.'),
    query('provider').optional().isIn(['pexels', 'pixabay']).withMessage('Unsupported image search provider.'),
    validateRequest,
  ],
  searchImages
);

router.get('/api/images/library', getLibrary);

router.post(
  '/api/images/library',
  [
    authenticate,
    authorizePermission(PERMISSIONS.FILES_UPLOAD),
    body('url').trim().notEmpty().withMessage('Image url is required.'),
    body('thumbnail').trim().notEmpty().withMessage('Thumbnail is required.'),
    body('category').optional().isString().withMessage('Category must be text.'),
    body('source').optional().isString().withMessage('Source must be text.'),
    validateRequest,
  ],
  saveImage
);

router.delete(
  '/api/images/library/:id',
  [
    authenticate,
    authorizePermission(PERMISSIONS.FILES_DELETE),
    param('id').trim().notEmpty().withMessage('Image id is required.'),
    validateRequest,
  ],
  deleteImage
);

module.exports = router;