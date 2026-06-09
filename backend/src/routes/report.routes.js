const express = require('express');
const { param } = require('express-validator');
const { getStudentReport } = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');

const router = express.Router();

router.get(
  '/api/reports/:studentId',
  [
    authenticate,
    authorize('SUPER_ADMIN', 'THERAPIST', 'STUDENT'),
    param('studentId').notEmpty().withMessage('Student id is required.'),
    validateRequest,
  ],
  getStudentReport
);

module.exports = router;
