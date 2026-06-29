const express = require('express');
const { body, param } = require('express-validator');
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  regenerateAccessCode,
} = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');

const router = express.Router();

router.use('/api/students', authenticate, authorize('SUPER_ADMIN', 'THERAPIST', 'PARENT'));

router.get('/api/students', getStudents);

// Protect mutation routes
const staffOnly = authorize('SUPER_ADMIN', 'THERAPIST');

router.post(
  '/api/students',
  staffOnly,
  [
    body('name').trim().notEmpty().withMessage('Student name is required.'),
    body('age').isInt({ min: 1, max: 25 }).withMessage('Age must be between 1 and 25.'),
    body('diagnosis').optional().isString().withMessage('Diagnosis must be text.'),
    body('planName').optional().isString().withMessage('Plan name must be text.'),
    body('currentLevel').optional().isInt({ min: 1 }).withMessage('Current level must be 1 or higher.'),
    body('requestStatus').optional().isIn(['PENDING', 'APPROVED']).withMessage('requestStatus must be PENDING or APPROVED.'),
    body('therapistId').optional().notEmpty().withMessage('Therapist id cannot be empty.'),
    body('assignedGames').optional().isArray().withMessage('assignedGames must be an array.'),
    body('assignedGames.*.gameId').optional().notEmpty().withMessage('Assigned game id is required.'),
    body('assignedGames.*.order').optional().isInt().withMessage('Order must be an integer.'),
    validateRequest,
  ],
  createStudent
);

router.put(
  '/api/students/:id',
  staffOnly,
  [
    param('id').notEmpty().withMessage('Student id is required.'),
    body('name').optional().trim().notEmpty().withMessage('Student name cannot be empty.'),
    body('age').optional().isInt({ min: 1, max: 25 }).withMessage('Age must be between 1 and 25.'),
    body('diagnosis').optional().isString().withMessage('Diagnosis must be text.'),
    body('planName').optional().isString().withMessage('Plan name must be text.'),
    body('currentLevel').optional().isInt({ min: 1 }).withMessage('Current level must be 1 or higher.'),
    body('requestStatus').optional().isIn(['PENDING', 'APPROVED']).withMessage('requestStatus must be PENDING or APPROVED.'),
    body('therapistId').optional().notEmpty().withMessage('Therapist id cannot be empty.'),
    body('assignedGames').optional().isArray().withMessage('assignedGames must be an array.'),
    body('assignedGames.*.gameId').optional().notEmpty().withMessage('Assigned game id is required.'),
    body('assignedGames.*.order').optional().isInt().withMessage('Order must be an integer.'),
    validateRequest,
  ],
  updateStudent
);

router.patch(
  '/api/students/:id/access-code',
  staffOnly,
  [param('id').notEmpty().withMessage('Student id is required.'), validateRequest],
  regenerateAccessCode
);

router.delete(
  '/api/students/:id',
  staffOnly,
  authorize('SUPER_ADMIN'),
  [param('id').notEmpty().withMessage('Student id is required.'), validateRequest],
  deleteStudent
);

module.exports = router;
