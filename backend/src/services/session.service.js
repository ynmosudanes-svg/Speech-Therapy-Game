const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

function buildSessionWhere(currentUser) {
  if (currentUser.role === 'SUPER_ADMIN') {
    return {};
  }

  if (currentUser.role === 'THERAPIST') {
    return { therapistId: currentUser.userId };
  }

  return { studentId: currentUser.studentId };
}

async function ensureGameExists(gameId) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new ApiError(404, 'Game not found.');
  }

  return game;
}

async function ensureAssignedGameForStudent(studentId, gameId) {
  const assignment = await prisma.studentGame.findUnique({
    where: {
      studentId_gameId: {
        studentId,
        gameId,
      },
    },
    select: { studentId: true },
  });

  if (!assignment) {
    throw new ApiError(403, 'This game is not assigned to the student.');
  }
}
async function ensureStudentForTherapist(currentUser, studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(404, 'Student not found.');
  }

  if (currentUser.role === 'THERAPIST' && student.therapistId !== currentUser.userId) {
    throw new ApiError(403, 'You can only create sessions for your own students.');
  }

  return student;
}

async function createSession(currentUser, payload) {
  const studentId = currentUser.role === 'STUDENT' ? currentUser.studentId : payload.studentId;

  const student = await ensureStudentForTherapist(currentUser, studentId);
  await ensureGameExists(payload.gameId);

  if (currentUser.role === 'STUDENT' && payload.sessionType !== 'FREE_PLAY') {
    await ensureAssignedGameForStudent(studentId, payload.gameId);
  }

  const therapistId =
    currentUser.role === 'STUDENT' ? student.therapistId : currentUser.userId;

  const session = await prisma.session.create({
    data: {
      studentId,
      therapistId,
      gameId: payload.gameId,
      score: payload.score,
      attempts: payload.attempts,
      duration: payload.duration,
      sessionType: payload.sessionType,
      promptLevel: payload.promptLevel,
    },
    include: {
      student: true,
      therapist: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      game: true,
    },
  });

  return session;
}

async function listSessions(currentUser) {
  return prisma.session.findMany({
    where: buildSessionWhere(currentUser),
    include: {
      student: true,
      therapist: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      game: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function listSessionsByStudent(currentUser, studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(404, 'Student not found.');
  }

  if (currentUser.role === 'THERAPIST' && student.therapistId !== currentUser.userId) {
    throw new ApiError(403, 'You can only access sessions for your own students.');
  }

  if (currentUser.role === 'STUDENT' && currentUser.studentId !== studentId) {
    throw new ApiError(403, 'You can only access your own sessions.');
  }

  return prisma.session.findMany({
    where: { studentId },
    include: {
      student: true,
      therapist: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      game: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  createSession,
  listSessions,
  listSessionsByStudent,
};
