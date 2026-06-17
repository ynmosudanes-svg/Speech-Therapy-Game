const express = require('express');
const { body, param } = require('express-validator');
const {
  getGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
} = require('../controllers/game.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');

const router = express.Router();

const supportedTypes = [
  'matching.similar',
  'matching.different',
  'matching.find',
  'matching.shadow',
  'sequence.order',
  'action.drag_to_target',
  'navigation.move_to_target',
  'navigation.maze',
  'text.missing_word',
  'cards.audio_flashcards',
  'puzzle.jigsaw',
  'matching.connect',
];

router.get('/api/games', getGames);
router.get('/api/games/:id', [param('id').notEmpty().withMessage('Game id is required.'), validateRequest], getGame);

router.post(
  '/api/games',
  [
    authenticate,
    authorize('SUPER_ADMIN', 'THERAPIST'),
    body('gameCode').trim().notEmpty().withMessage('Game code is required.'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('nameAr').optional().trim().notEmpty().withMessage('Arabic name cannot be empty.'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
    body('config').optional().isObject().withMessage('config must be an object.'),
    validateRequest,
  ],
  createGame
);

router.put(
  '/api/games/:id',
  [
    authenticate,
    authorize('SUPER_ADMIN', 'THERAPIST'),
    param('id').notEmpty().withMessage('Game id is required.'),
    body('gameCode').trim().notEmpty().withMessage('Game code is required.'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('nameAr').optional().trim().notEmpty().withMessage('Arabic name cannot be empty.'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
    body('config').optional().isObject().withMessage('config must be an object.'),
    validateRequest,
  ],
  updateGame
);

router.delete(
  '/api/games/:id',
  [
    authenticate,
    authorize('SUPER_ADMIN', 'THERAPIST'),
    param('id').notEmpty().withMessage('Game id is required.'),
    validateRequest,
  ],
  deleteGame
);

module.exports = router;
