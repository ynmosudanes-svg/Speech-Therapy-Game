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
  studentLogin,
  patientLogin,
};
