const express = require('express');
const { body, param } = require('express-validator');
const {
  getGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  submitGameForReview,
  approveGame,
  rejectGame,
  publishGame,
  archiveGame,
  restoreGame,
  permanentlyDeleteGame,
  getGameVersions,
  restoreGameVersion,
} = require('../controllers/game.controller');
const { authenticate, optionalAuthenticate, authorizePermission } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

const gamePayloadValidators = [
  body('gameCode').optional().trim().notEmpty().withMessage('Game code cannot be empty.'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('nameAr').optional().trim().notEmpty().withMessage('Arabic name cannot be empty.'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
  body('status').optional().isIn(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).withMessage('status is invalid.'),
  body('config').optional().isObject().withMessage('config must be an object.'),
];

const gameIdValidators = [
  param('id').notEmpty().withMessage('Game id is required.'),
  validateRequest,
];

router.get('/api/games', optionalAuthenticate, getGames);
router.get('/api/games/:id', [optionalAuthenticate, ...gameIdValidators], getGame);

router.post(
  '/api/games',
  [
    authenticate,
    authorizePermission(PERMISSIONS.GAMES_CREATE),
    body('gameCode').trim().notEmpty().withMessage('Game code is required.'),
    ...gamePayloadValidators,
    validateRequest,
  ],
  createGame
);

router.put(
  '/api/games/:id',
  [
    authenticate,
    param('id').notEmpty().withMessage('Game id is required.'),
    body('gameCode').optional().trim().notEmpty().withMessage('Game code cannot be empty.'),
    ...gamePayloadValidators,
    validateRequest,
  ],
  updateGame
);

router.patch('/api/games/:id/submit-review', [authenticate, ...gameIdValidators], submitGameForReview);
router.patch('/api/games/:id/approve', [authenticate, ...gameIdValidators], approveGame);
router.patch('/api/games/:id/reject', [authenticate, param('id').notEmpty().withMessage('Game id is required.'), body('reviewNotes').optional().isString().withMessage('reviewNotes must be text.'), validateRequest], rejectGame);
router.patch('/api/games/:id/publish', [authenticate, ...gameIdValidators], publishGame);
router.patch('/api/games/:id/archive', [authenticate, ...gameIdValidators], archiveGame);
router.patch('/api/games/:id/restore', [authenticate, ...gameIdValidators], restoreGame);
router.get('/api/games/:id/versions', [authenticate, ...gameIdValidators], getGameVersions);
router.patch('/api/games/:id/versions/:versionId/restore', [authenticate, param('id').notEmpty().withMessage('Game id is required.'), param('versionId').notEmpty().withMessage('Version id is required.'), validateRequest], restoreGameVersion);

router.delete(
  '/api/games/:id/permanent',
  [
    authenticate,
    authorizePermission(PERMISSIONS.GAMES_PERMANENT_DELETE),
    ...gameIdValidators,
  ],
  permanentlyDeleteGame
);

router.delete(
  '/api/games/:id',
  [
    authenticate,
    authorizePermission(PERMISSIONS.GAMES_ARCHIVE),
    ...gameIdValidators,
  ],
  deleteGame
);

module.exports = router;