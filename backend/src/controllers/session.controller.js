const asyncHandler = require('../utils/asyncHandler');
const sessionService = require('../services/session.service');

const createSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createSession(req.user, req.body);
  res.status(201).json({
    success: true,
    message: 'Session created successfully.',
    data: session,
  });
});

const getSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.listSessions(req.user);
  res.json({
    success: true,
    count: sessions.length,
    data: sessions,
  });
});

const getSessionsByStudent = asyncHandler(async (req, res) => {
  const sessions = await sessionService.listSessionsByStudent(req.user, req.params.studentId);
  res.json({
    success: true,
    count: sessions.length,
    data: sessions,
  });
});

module.exports = {
  createSession,
  getSessions,
  getSessionsByStudent,
};
