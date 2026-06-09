const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

const PROMPT_WEIGHTS = {
  FULL: 0,
  PARTIAL: 0.5,
  INDEPENDENT: 1,
};

async function getStudentReport(currentUser, studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      therapist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!student) {
    throw new ApiError(404, 'Student not found.');
  }

  if (currentUser.role === 'THERAPIST' && student.therapistId !== currentUser.userId) {
    throw new ApiError(403, 'You can only access reports for your own students.');
  }

  if (currentUser.role === 'STUDENT' && currentUser.studentId !== studentId) {
    throw new ApiError(403, 'You can only access your own report.');
  }

  const sessions = await prisma.session.findMany({
    where: { 
      studentId,
      sessionType: { not: 'FREE_PLAY' },
    },
    include: {
      game: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const totalSessions = sessions.length;
  const averageScore = totalSessions
    ? Number((sessions.reduce((sum, session) => sum + session.score, 0) / totalSessions).toFixed(2))
    : 0;
  const totalAttempts = sessions.reduce((sum, session) => sum + session.attempts, 0);
  const independenceRate = totalSessions
    ? Number(
        (
          (sessions.reduce((sum, session) => sum + (PROMPT_WEIGHTS[session.promptLevel] || 0), 0) /
            totalSessions) *
          100
        ).toFixed(2)
      )
    : 0;

  const progressOverTime = sessions.map((session) => ({
    sessionId: session.id,
    createdAt: session.createdAt,
    score: session.score,
    attempts: session.attempts,
    promptLevel: session.promptLevel,
    gameId: session.gameId,
    gameName: session.game.title || session.game.name,
  }));

  const performanceByGame = Object.values(
    sessions.reduce((accumulator, session) => {
      const key = session.gameId;
      if (!accumulator[key]) {
        accumulator[key] = {
          gameId: session.gameId,
          gameName: session.game.title || session.game.name,
          totalScore: 0,
          totalAttempts: 0,
          sessions: 0,
        };
      }

      accumulator[key].totalScore += session.score;
      accumulator[key].totalAttempts += session.attempts;
      accumulator[key].sessions += 1;
      return accumulator;
    }, {})
  ).map((entry) => ({
    gameId: entry.gameId,
    gameName: entry.gameName,
    totalSessions: entry.sessions,
    averageScore: Number((entry.totalScore / entry.sessions).toFixed(2)),
    totalAttempts: entry.totalAttempts,
  }));

  const performanceByPromptLevel = Object.values(
    sessions.reduce((accumulator, session) => {
      const key = session.promptLevel;
      if (!accumulator[key]) {
        accumulator[key] = {
          promptLevel: key,
          sessions: 0,
          totalScore: 0,
        };
      }

      accumulator[key].sessions += 1;
      accumulator[key].totalScore += session.score;
      return accumulator;
    }, {})
  ).map((entry) => ({
    promptLevel: entry.promptLevel,
    totalSessions: entry.sessions,
    averageScore: Number((entry.totalScore / entry.sessions).toFixed(2)),
  }));

  return {
    student,
    totalSessions,
    averageScore,
    totalAttempts,
    independenceRate,
    progressOverTime,
    performanceByGame,
    performanceByPromptLevel,
  };
}

module.exports = {
  getStudentReport,
};
