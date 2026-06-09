const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

function sanitizeTherapist(user) {
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

const MANAGED_ROLES = ['THERAPIST', 'SUPER_ADMIN'];

async function createTherapist(payload) {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ApiError(409, 'A therapist with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const nextRole = payload.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'THERAPIST';
  const therapist = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      role: nextRole,
      isActive: payload.isActive ?? true,
    },
  });

  return sanitizeTherapist(therapist);
}

async function listTherapists() {
  const therapists = await prisma.user.findMany({
    where: { role: { in: MANAGED_ROLES } },
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
  });

  return therapists.map(sanitizeTherapist);
}

async function updateTherapist(therapistId, payload) {
  const therapist = await prisma.user.findFirst({
    where: { id: therapistId, role: { in: MANAGED_ROLES } },
  });

  if (!therapist) {
    throw new ApiError(404, 'لم يتم العثور على الدكتور.');
  }

  if (payload.email && payload.email.toLowerCase() !== therapist.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiError(409, 'Another user already uses this email.');
    }
  }

  const data = {
    name: payload.name ?? therapist.name,
    email: payload.email ? payload.email.toLowerCase() : therapist.email,
    isActive: payload.isActive ?? therapist.isActive,
    role: payload.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : payload.role === 'THERAPIST' ? 'THERAPIST' : therapist.role,
  };

  if (payload.password) {
    data.password = await bcrypt.hash(payload.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: therapistId },
    data,
  });

  return sanitizeTherapist(updated);
}

async function deactivateTherapist(therapistId) {
  const therapist = await prisma.user.findFirst({
    where: { id: therapistId, role: { in: MANAGED_ROLES } },
  });

  if (!therapist) {
    throw new ApiError(404, 'لم يتم العثور على الدكتور.');
  }

  if (therapist.role === 'SUPER_ADMIN') {
    throw new ApiError(400, 'Super admin cannot be deactivated.');
  }

  const updated = await prisma.user.update({
    where: { id: therapistId },
    data: { isActive: false },
  });

  return sanitizeTherapist(updated);
}

async function deleteTherapist(therapistId) {
  const therapist = await prisma.user.findFirst({
    where: { id: therapistId, role: { in: MANAGED_ROLES } },
  });

  if (!therapist) {
    throw new ApiError(404, 'لم يتم العثور على الدكتور.');
  }

  if (therapist.role === 'SUPER_ADMIN') {
    throw new ApiError(400, 'لا يمكن حذف المسؤول الرئيسي.');
  }

  try {
    await prisma.user.delete({
      where: { id: therapistId },
    });
    return { success: true };
  } catch (error) {
    if (error.code === 'P2003') {
      throw new ApiError(
        400,
        'لا يمكن حذف هذا الدكتور لارتباطه بمرضى أو جلسات في النظام. يرجى "تعطيل الحساب" بدلاً من حذفه.'
      );
    }
    throw error;
  }
}

module.exports = {
  createTherapist,
  listTherapists,
  updateTherapist,
  deactivateTherapist,
  deleteTherapist,
};
