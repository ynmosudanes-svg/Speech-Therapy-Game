const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const { logActivity } = require('../services/audit.service');

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginWithEmail(req.body);
  await logActivity({
    req,
    actor: result.user,
    action: 'LOGIN_SUCCESS',
    entityType: 'User',
    entityId: result.user.id,
    after: { email: result.user.email, role: result.user.role },
  });

  res.json({
    success: true,
    message: 'Login successful.',
    ...result,
  });
});

const registerParent = asyncHandler(async (req, res) => {
  const result = await authService.registerParent(req.body);
  await logActivity({
    req,
    actor: result.user,
    action: 'PARENT_REGISTERED',
    entityType: 'User',
    entityId: result.user.id,
    after: { email: result.user.email, role: result.user.role },
  });

  res.status(201).json({
    success: true,
    message: 'Parent account created successfully.',
    ...result,
  });
});

const studentLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginWithAccessCode(req.body);
  await logActivity({
    req,
    actor: { id: result.student.id, role: 'STUDENT' },
    action: 'STUDENT_LOGIN_SUCCESS',
    entityType: 'Student',
    entityId: result.student.id,
    after: { accessCode: result.student.accessCode },
  });

  res.json({
    success: true,
    message: 'Student login successful.',
    ...result,
  });
});

const patientLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginWithAccessCode(req.body);
  await logActivity({
    req,
    actor: { id: result.student.id, role: 'STUDENT' },
    action: 'PATIENT_LOGIN_SUCCESS',
    entityType: 'Student',
    entityId: result.student.id,
    after: { accessCode: result.student.accessCode },
  });

  res.json({
    token: result.token,
    patient: {
      id: result.student.id,
      name: result.student.name,
    },
    student: result.student,
  });
});

module.exports = {
  login,
  registerParent,
  studentLogin,
  patientLogin,
};