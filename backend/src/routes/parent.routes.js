const express = require('express');
const {
  createParent,
  getParents,
  updateParent,
  deactivateParent,
  deleteParent,
  linkChild,
  unlinkChild,
  requestChild,
} = require('../controllers/parent.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.post(
  '/api/parents/me/link-child',
  authorize('PARENT'),
  [
    body('accessCode').trim().isLength({ min: 4 }).withMessage('A valid child access code is required.'),
    validateRequest,
  ],
  linkChild
);

router.post(
  '/api/parents/me/child-requests',
  authorize('PARENT'),
  [
    body('name').trim().notEmpty().withMessage('Child name is required.'),
    body('age').isInt({ min: 1, max: 25 }).withMessage('Age must be between 1 and 25.'),
    body('diagnosis').optional().isString().withMessage('Diagnosis must be text.'),
    validateRequest,
  ],
  requestChild
);

router.delete(
  '/api/parents/me/unlink-child/:studentId',
  authorize('PARENT'),
  unlinkChild
);

// Parents can be managed by SUPER_ADMIN or THERAPIST
router.use(authorize('SUPER_ADMIN', 'THERAPIST'));

router.route('/api/parents')
  .post(createParent)
  .get(getParents);

router.put('/api/parents/:id', updateParent);
router.delete('/api/parents/:id', authorize('SUPER_ADMIN'), deleteParent);

router.put('/api/parents/:id/deactivate', deactivateParent);

module.exports = router;
