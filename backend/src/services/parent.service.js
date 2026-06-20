const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { generateUniqueAccessCode } = require('../utils/accessCode');

function normalizeRequestStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  return value === 'PENDING' ? 'PENDING' : 'APPROVED';
}

function sanitizeParent(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const MANAGED_ROLES = ['PARENT'];

async function createParent(payload) {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const parent = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      role: 'PARENT',
      isActive: payload.isActive ?? true,
    },
  });

  return sanitizeParent(parent);
}

async function listParents() {
  const parents = await prisma.user.findMany({
    where: { role: { in: MANAGED_ROLES } },
    orderBy: { createdAt: 'desc' },
    include: {
      children: {
        select: {
          id: true,
          name: true,
          age: true,
          accessCode: true,
        }
      }
    }
  });

  return parents.map(parent => ({
    ...sanitizeParent(parent),
    children: parent.children || []
  }));
}

async function updateParent(parentId, payload) {
  const parent = await prisma.user.findFirst({
    where: { id: parentId, role: { in: MANAGED_ROLES } },
  });

  if (!parent) {
    throw new ApiError(404, 'لم يتم العثور على ولي الأمر.');
  }

  if (payload.email && payload.email.toLowerCase() !== parent.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiError(409, 'Another user already uses this email.');
    }
  }

  const data = {
    name: payload.name ?? parent.name,
    email: payload.email ? payload.email.toLowerCase() : parent.email,
    isActive: payload.isActive ?? parent.isActive,
  };

  if (payload.password) {
    data.password = await bcrypt.hash(payload.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: parentId },
    data,
  });

  return sanitizeParent(updated);
}

async function deactivateParent(parentId) {
  const parent = await prisma.user.findFirst({
    where: { id: parentId, role: { in: MANAGED_ROLES } },
  });

  if (!parent) {
    throw new ApiError(404, 'لم يتم العثور على ولي الأمر.');
  }

  const updated = await prisma.user.update({
    where: { id: parentId },
    data: { isActive: false },
  });

  return sanitizeParent(updated);
}

async function deleteParent(parentId) {
  const parent = await prisma.user.findFirst({
    where: { id: parentId, role: { in: MANAGED_ROLES } },
  });

  if (!parent) {
    throw new ApiError(404, 'لم يتم العثور على ولي الأمر.');
  }

  try {
    await prisma.user.delete({
      where: { id: parentId },
    });
    return { success: true };
  } catch (error) {
    if (error.code === 'P2003') {
      throw new ApiError(
        400,
        'لا يمكن حذف ولي الأمر لارتباطه بأطفال في النظام. يرجى إزالة ارتباطه بالأطفال أولاً.'
      );
    }
    throw error;
  }
}

async function linkChildByAccessCode(currentUser, accessCode) {
  const normalizedCode = String(accessCode || '').trim().toUpperCase();

  if (!normalizedCode) {
    throw new ApiError(400, 'Access code is required.');
  }

  const student = await prisma.student.findUnique({
    where: { accessCode: normalizedCode },
    include: {
      assignedGames: {
        orderBy: { order: 'asc' },
        include: { game: true },
      },
      therapist: {
        select: { id: true, name: true, email: true },
      },
      parent: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!student) {
    throw new ApiError(404, 'Child access code was not found.');
  }

  if (student.parentId && student.parentId !== currentUser.userId) {
    throw new ApiError(409, 'This child is already linked to another parent account.');
  }

  if (student.parentId === currentUser.userId) {
    return student;
  }

  return prisma.student.update({
    where: { id: student.id },
    data: { parentId: currentUser.userId, requestStatus: 'PENDING' },
    include: {
      assignedGames: {
        orderBy: { order: 'asc' },
        include: { game: true },
      },
      therapist: {
        select: { id: true, name: true, email: true },
      },
      parent: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

async function unlinkChild(currentUser, studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      parentId: true,
    },
  });

  if (!student) {
    throw new ApiError(404, 'Child not found.');
  }

  if (student.parentId !== currentUser.userId) {
    throw new ApiError(403, 'You can only unlink your own child.');
  }

  return prisma.student.update({
    where: { id: studentId },
    data: { parentId: null },
    include: {
      assignedGames: {
        orderBy: { order: 'asc' },
        include: { game: true },
      },
      therapist: {
        select: { id: true, name: true, email: true },
      },
      parent: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

async function findDefaultTherapist() {
  const therapist = await prisma.user.findFirst({
    where: {
      role: { in: ['THERAPIST', 'SUPER_ADMIN'] },
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (!therapist) {
    throw new ApiError(400, 'No active specialist is available to receive this child request.');
  }

  return therapist.id;
}

async function requestChild(currentUser, payload) {
  const therapistId = await findDefaultTherapist();
  const accessCode = await generateUniqueAccessCode(payload.name);

  return prisma.student.create({
    data: {
      name: payload.name,
      age: Number(payload.age),
      diagnosis: payload.diagnosis || null,
      planName: payload.planName || 'طلب جديد من ولي الأمر',
      requestStatus: normalizeRequestStatus('PENDING'),
      currentLevel: 1,
      accessCode,
      therapistId,
      parentId: currentUser.userId,
    },
    include: {
      assignedGames: {
        orderBy: { order: 'asc' },
        include: { game: true },
      },
      therapist: {
        select: { id: true, name: true, email: true },
      },
      parent: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

module.exports = {
  createParent,
  listParents,
  updateParent,
  deactivateParent,
  deleteParent,
  linkChildByAccessCode,
  unlinkChild,
  requestChild,
};
