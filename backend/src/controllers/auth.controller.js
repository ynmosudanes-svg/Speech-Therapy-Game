const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginWithEmail(req.body);
  res.json({
    success: true,
    message: 'Login successful.',
    ...result,
  });
});

const registerParent = asyncHandler(async (req, res) => {
  const result = await authService.registerParent(req.body);
  res.status(201).json({
    success: true,
    message: 'Parent account created successfully.',
    ...result,
  });
});

const studentLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginWithAccessCode(req.body);
  res.json({
    success: true,
    message: 'Student login successful.',
    ...result,
  });
});

const patientLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginWithAccessCode(req.body);
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
