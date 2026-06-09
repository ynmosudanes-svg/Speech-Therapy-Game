const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { generateUniqueAccessCode } = require('../utils/accessCode');

function canAccessStudent(currentUser, student) {
  if (currentUser.role === 'SUPER_ADMIN') {
    return true;
  }

  return student.therapistId === currentUser.userId;
}

function mapStudent(student) {
  return {
    ...student,
    assignedGames: student.assignedGames?.map((assignment) => ({
      ...assignment.game,
      order: assignment.order,
    })) || [],
  };
}

async function ensureTherapistExists(therapistId) {
  const therapist = await prisma.user.findFirst({
    where: {
      id: therapistId,
      role: { in: ['THERAPIST', 'SUPER_ADMIN'] },
      isActive: true,
    },
  });

  if (!therapist) {
    throw new ApiError(400, 'Therapist not found or inactive.');
  }
}

async function ensureGamesExist(assignedGames = []) {
  if (!assignedGames.length) {
    return;
  }

  const gameIds = assignedGames.map((g) => g.gameId);

  const games = await prisma.game.findMany({
    where: {
      id: { in: gameIds },
    },
    select: { id: true },
  });

  if (games.length !== gameIds.length) {
    throw new ApiError(400, 'One or more assigned games are invalid.');
  }
}

async function listStudents(currentUser) {
  const where =
    currentUser.role === 'SUPER_ADMIN'
      ? {}
      : {
          therapistId: currentUser.userId,
        };

  const students = await prisma.student.findMany({
    where,
    include: {
      therapist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedGames: {
        orderBy: { order: 'asc' },
        include: {
          game: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return students.map(mapStudent);
}

async function createStudent(currentUser, payload) {
  const therapistId =
    currentUser.role === 'SUPER_ADMIN'
      ? payload.therapistId || currentUser.userId
      : currentUser.userId;

  await ensureTherapistExists(therapistId);
  await ensureGamesExist(payload.assignedGames || []);

  const accessCode = await generateUniqueAccessCode(payload.name);
  const student = await prisma.student.create({
    data: {
      name: payload.name,
      age: payload.age,
      diagnosis: payload.diagnosis || null,
      planName: payload.planName || null,
      currentLevel: payload.currentLevel ?? 1,
      accessCode,
      therapistId,
      assignedGames: {
        create: (payload.assignedGames || []).map((game) => ({
          gameId: game.gameId,
          order: game.order || 0,
        })),
      },
    },
    include: {
      therapist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedGames: {
        orderBy: { order: 'asc' },
        include: {
          game: true,
        },
      },
    },
  });

  return mapStudent(student);
}

async function updateStudent(currentUser, studentId, payload) {
  const existingStudent = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      assignedGames: true,
    },
  });

  if (!existingStudent) {
    throw new ApiError(404, 'Student not found.');
  }

  if (!canAccessStudent(currentUser, existingStudent)) {
    throw new ApiError(403, 'You can only manage your own students.');
  }

  const therapistId =
    currentUser.role === 'SUPER_ADMIN'
      ? payload.therapistId || existingStudent.therapistId
      : existingStudent.therapistId;

  await ensureTherapistExists(therapistId);
  await ensureGamesExist(payload.assignedGames || []);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id: studentId },
      data: {
        name: payload.name ?? existingStudent.name,
        age: payload.age ?? existingStudent.age,
        diagnosis: payload.diagnosis ?? existingStudent.diagnosis,
        planName: payload.planName !== undefined ? payload.planName : existingStudent.planName,
        currentLevel: payload.currentLevel ?? existingStudent.currentLevel,
        therapistId,
      },
    });

    if (Array.isArray(payload.assignedGames)) {
      await tx.studentGame.deleteMany({
        where: { studentId },
      });

      if (payload.assignedGames.length) {
        await tx.studentGame.createMany({
          data: payload.assignedGames.map((game) => ({
            studentId,
            gameId: game.gameId,
            order: game.order || 0,
          })),
        });
      }
    }

    return tx.student.findUnique({
      where: { id: studentId },
      include: {
        therapist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedGames: {
          orderBy: { order: 'asc' },
          include: {
            game: true,
          },
        },
      },
    });
  });

  return mapStudent(updated);
}

async function deleteStudent(currentUser, studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(404, 'Student not found.');
  }

  if (!canAccessStudent(currentUser, student)) {
    throw new ApiError(403, 'You can only delete your own students.');
  }

  await prisma.student.delete({
    where: { id: studentId },
  });
}

async function findStudentForSession(currentUser, studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(404, 'Student not found.');
  }

  if (!canAccessStudent(currentUser, student)) {
    throw new ApiError(403, 'You can only access your own students.');
  }

  return student;
}

async function regenerateAccessCode(currentUser, studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(404, 'Student not found.');
  }

  if (!canAccessStudent(currentUser, student)) {
    throw new ApiError(403, 'You can only manage your own students.');
  }

  const accessCode = await generateUniqueAccessCode(student.name);

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { accessCode },
    select: {
      id: true,
      name: true,
      accessCode: true,
      updatedAt: true,
    },
  });

  return updated;
}

module.exports = {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  findStudentForSession,
  regenerateAccessCode,
};
