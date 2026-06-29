const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { logActivity } = require('./audit.service');
const { normalizeRole } = require('../utils/roles');

const MANAGED_ROLES = ['THERAPIST', 'ADMIN', 'DATA_ENTRY', 'SUPER_ADMIN'];

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

function resolveManagedRole(role, fallback = 'THERAPIST') {
  const normalized = normalizeRole(role);
  return MANAGED_ROLES.includes(normalized) ? normalized : fallback;
}

async function countActiveSuperAdmins() {
  return prisma.user.count({
    where: {
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
}

async function ensureCanMoveAwayFromSuperAdmin(existingUser, nextData) {
  const isCurrentlySuperAdmin = existingUser.role === 'SUPER_ADMIN';
  const nextRole = nextData.role ?? existingUser.role;
  const nextIsActive = nextData.isActive ?? existingUser.isActive;

  if (nextRole === 'SUPER_ADMIN' && nextIsActive === false) {
    throw new ApiError(400, 'Super admin accounts cannot be deactivated.');
  }

  if (!isCurrentlySuperAdmin) {
    return;
  }

  const willRemainActiveSuperAdmin = nextRole === 'SUPER_ADMIN' && nextIsActive !== false;
  if (willRemainActiveSuperAdmin) {
    return;
  }

  const activeSuperAdmins = await countActiveSuperAdmins();
  if (activeSuperAdmins <= 1 && existingUser.isActive) {
    throw new ApiError(400, 'Cannot remove or deactivate the last active super admin.');
  }
}

async function createTherapist(payload, currentUser = null, req = null) {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const nextRole = resolveManagedRole(payload.role, 'THERAPIST');
  if (nextRole === 'SUPER_ADMIN' && payload.isActive === false) {
    throw new ApiError(400, 'Super admin accounts cannot be created inactive.');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const therapist = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      role: nextRole,
      isActive: payload.isActive ?? true,
    },
  });

  const sanitized = sanitizeTherapist(therapist);
  await logActivity({
    req,
    actor: currentUser,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: therapist.id,
    after: sanitized,
  });

  return sanitized;
}

async function listTherapists() {
  const therapists = await prisma.user.findMany({
    where: { role: { in: MANAGED_ROLES } },
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
  });

  return therapists.map(sanitizeTherapist);
}

async function updateTherapist(therapistId, payload, currentUser = null, req = null) {
  const therapist = await prisma.user.findFirst({
    where: { id: therapistId, role: { in: MANAGED_ROLES } },
  });

  if (!therapist) {
    throw new ApiError(404, 'User was not found.');
  }

  if (payload.email && payload.email.toLowerCase() !== therapist.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiError(409, 'Another user already uses this email.');
    }
  }

  const nextRole = payload.role ? resolveManagedRole(payload.role, therapist.role) : therapist.role;
  const data = {
    name: payload.name ?? therapist.name,
    email: payload.email ? payload.email.toLowerCase() : therapist.email,
    isActive: payload.isActive ?? therapist.isActive,
    role: nextRole,
  };

  await ensureCanMoveAwayFromSuperAdmin(therapist, data);

  if (payload.password) {
    data.password = await bcrypt.hash(payload.password, 10);
  }

  const before = sanitizeTherapist(therapist);
  const updated = await prisma.user.update({
    where: { id: therapistId },
    data,
  });
  const after = sanitizeTherapist(updated);

  await logActivity({
    req,
    actor: currentUser,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: therapistId,
    before,
    after,
  });

  if (before.role !== after.role) {
    await logActivity({
      req,
      actor: currentUser,
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: therapistId,
      before: { role: before.role },
      after: { role: after.role },
    });
  }

  return after;
}

async function deactivateTherapist(therapistId, currentUser = null, req = null) {
  const therapist = await prisma.user.findFirst({
    where: { id: therapistId, role: { in: MANAGED_ROLES } },
  });

  if (!therapist) {
    throw new ApiError(404, 'User was not found.');
  }

  await ensureCanMoveAwayFromSuperAdmin(therapist, { isActive: false });

  const before = sanitizeTherapist(therapist);
  const updated = await prisma.user.update({
    where: { id: therapistId },
    data: { isActive: false },
  });
  const after = sanitizeTherapist(updated);

  await logActivity({
    req,
    actor: currentUser,
    action: 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: therapistId,
    before,
    after,
  });

  return after;
}

async function deleteTherapist(therapistId, currentUser = null, req = null) {
  const therapist = await prisma.user.findFirst({
    where: { id: therapistId, role: { in: MANAGED_ROLES } },
  });

  if (!therapist) {
    throw new ApiError(404, 'User was not found.');
  }

  if (therapist.role === 'SUPER_ADMIN') {
    throw new ApiError(400, 'Super admin accounts cannot be deleted.');
  }

  const before = sanitizeTherapist(therapist);

  try {
    await prisma.user.delete({
      where: { id: therapistId },
    });

    await logActivity({
      req,
      actor: currentUser,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: therapistId,
      before,
    });

    return { success: true };
  } catch (error) {
    if (error.code === 'P2003') {
      throw new ApiError(
        400,
        'This user cannot be deleted because it is linked to students or sessions. Deactivate the account instead.'
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
