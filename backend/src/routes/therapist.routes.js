const express = require('express');
const { body, param } = require('express-validator');
const {
  createTherapist,
  getTherapists,
  updateTherapist,
  deactivateTherapist,
  deleteTherapist,
} = require('../controllers/therapist.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');

const router = express.Router();

router.use('/api/therapists', authenticate, authorize('SUPER_ADMIN'));

router.post(
  '/api/therapists',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
    body('role').optional().isIn(['THERAPIST', 'SUPER_ADMIN']).withMessage('role is invalid.'),
    validateRequest,
  ],
  createTherapist
);

router.get('/api/therapists', getTherapists);

router.put(
  '/api/therapists/:id',
  [
    param('id').notEmpty().withMessage('Therapist id is required.'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('email').optional().isEmail().withMessage('A valid email is required.'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
    body('role').optional().isIn(['THERAPIST', 'SUPER_ADMIN']).withMessage('role is invalid.'),
    validateRequest,
  ],
  updateTherapist
);

router.patch(
  '/api/therapists/:id/deactivate',
  [param('id').notEmpty().withMessage('Therapist id is required.'), validateRequest],
  deactivateTherapist
);

router.delete(
  '/api/therapists/:id',
  [param('id').notEmpty().withMessage('Therapist id is required.'), validateRequest],
  deleteTherapist
);

module.exports = router;
