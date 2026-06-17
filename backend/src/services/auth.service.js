const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { signToken } = require('../utils/jwt');
const { normalizeRole } = require('../utils/roles');

async function loginWithEmail({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const role = normalizeRole(user.role);

  const token = signToken({
    sub: user.id,
    userId: user.id,
    role,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

async function registerParent({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'PARENT',
      isActive: true,
    },
  });

  const role = normalizeRole(user.role);
  const token = signToken({
    sub: user.id,
    userId: user.id,
    role,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

async function loginWithAccessCode({ accessCode }) {
  const student = await prisma.student.findUnique({
    where: { accessCode: accessCode.toUpperCase() },
    include: {
      therapist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedGames: {
        include: {
          game: true,
        },
      },
    },
  });

  if (!student) {
    throw new ApiError(401, 'Invalid access code.');
  }

  const token = signToken({
    sub: student.id,
    studentId: student.id,
    therapistId: student.therapistId,
    role: 'STUDENT',
    accessCode: student.accessCode,
  });

  return {
    token,
    student: {
      ...student,
      assignedGames: student.assignedGames.map((assignment) => assignment.game),
    },
  };
}

module.exports = {
  loginWithEmail,
  registerParent,
  loginWithAccessCode,
};
