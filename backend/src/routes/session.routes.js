const express = require('express');
const { body, param } = require('express-validator');
const {
  createSession,
  getSessions,
  getSessionsByStudent,
} = require('../controllers/session.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');

const router = express.Router();

router.post(
  '/api/sessions',
  [
    authenticate,
    authorize('SUPER_ADMIN', 'THERAPIST', 'STUDENT'),
    body('studentId').optional().notEmpty().withMessage('Student id is required.'),
    body('gameId').notEmpty().withMessage('Game id is required.'),
    body('score').isFloat({ min: 0 }).withMessage('Score must be zero or higher.'),
    body('attempts').isInt({ min: 1 }).withMessage('Attempts must be at least 1.'),
    body('duration').isInt({ min: 0 }).withMessage('Duration must be zero or higher.'),
    body('sessionType').isIn(['CLINIC', 'HOME', 'FREE_PLAY']).withMessage('sessionType must be CLINIC, HOME or FREE_PLAY.'),
    body('promptLevel')
      .isIn(['FULL', 'PARTIAL', 'INDEPENDENT'])
      .withMessage('promptLevel must be FULL, PARTIAL, or INDEPENDENT.'),
    validateRequest,
  ],
  createSession
);

router.get('/api/sessions', [authenticate, authorize('SUPER_ADMIN', 'THERAPIST', 'STUDENT')], getSessions);

router.get(
  '/api/sessions/student/:studentId',
  [
    authenticate,
    authorize('SUPER_ADMIN', 'THERAPIST', 'STUDENT'),
    param('studentId').notEmpty().withMessage('Student id is required.'),
    validateRequest,
  ],
  getSessionsByStudent
);

module.exports = router;
