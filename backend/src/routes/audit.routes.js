const express = require('express');
const { query } = require('express-validator');
const { getAuditLogs } = require('../controllers/audit.controller');
const { authenticate, authorizePermission } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

router.get(
  '/api/audit-logs',
  [
    authenticate,
    authorizePermission(PERMISSIONS.AUDIT_VIEW),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('limit must be between 1 and 500.'),
    validateRequest,
  ],
  getAuditLogs
);

module.exports = router;