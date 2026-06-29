const express = require('express');
const { body, param } = require('express-validator');
const {
  getLibraries,
  getLibrary,
  createLibrary,
  updateLibrary,
  deleteLibrary,
} = require('../controllers/gameLibrary.controller');
const { authenticate, authorizePermission } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

router.get('/api/game-libraries', getLibraries);

router.get(
  '/api/game-libraries/:id',
  [param('id').notEmpty().withMessage('Library id is required.'), validateRequest],
  getLibrary
);

router.post(
  '/api/game-libraries',
  [
    authenticate,
    authorizePermission(PERMISSIONS.GAMES_UPDATE_ANY),
    body('name').trim().notEmpty().withMessage('Library name is required.'),
    body('description').optional({ nullable: true }).isString(),
    body('color').optional({ nullable: true }).isString(),
    body('gameIds').optional().isArray().withMessage('gameIds must be an array.'),
    validateRequest,
  ],
  createLibrary
);

router.put(
  '/api/game-libraries/:id',
  [
    authenticate,
    authorizePermission(PERMISSIONS.GAMES_UPDATE_ANY),
    param('id').notEmpty().withMessage('Library id is required.'),
    body('name').optional().trim().notEmpty().withMessage('Library name cannot be empty.'),
    body('description').optional({ nullable: true }).isString(),
    body('color').optional({ nullable: true }).isString(),
    body('gameIds').optional().isArray().withMessage('gameIds must be an array.'),
    validateRequest,
  ],
  updateLibrary
);

router.delete(
  '/api/game-libraries/:id',
  [
    authenticate,
    authorizePermission(PERMISSIONS.GAMES_PERMANENT_DELETE),
    param('id').notEmpty().withMessage('Library id is required.'),
    validateRequest,
  ],
  deleteLibrary
);

module.exports = router;