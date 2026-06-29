const prisma = require('../config/prisma');

function toJsonValue(value) {
  if (value === undefined || value === null) return null;
  return JSON.parse(JSON.stringify(value));
}

function getActorId(user) {
  return user?.userId || user?.id || user?.sub || user?.email || null;
}

function getRequestMeta(req) {
  if (!req) {
    return {};
  }

  return {
    ipAddress: req.ip || req.headers?.['x-forwarded-for'] || null,
    userAgent: req.headers?.['user-agent'] || null,
  };
}

async function logActivity({ req, actor = null, action, entityType, entityId = null, before = null, after = null }) {
  try {
    const currentActor = actor || req?.user || null;
    await prisma.auditLog.create({
      data: {
        actorId: getActorId(currentActor),
        actorRole: currentActor?.role || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        before: toJsonValue(before),
        after: toJsonValue(after),
        ...getRequestMeta(req),
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error.message || error);
  }
}

async function listActivityLogs({ limit = 100, action, entityType, actorId } = {}) {
  const take = Math.min(Math.max(Number(limit) || 100, 1), 500);

  return prisma.auditLog.findMany({
    where: {
      ...(action ? { action: String(action) } : {}),
      ...(entityType ? { entityType: String(entityType) } : {}),
      ...(actorId ? { actorId: String(actorId) } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
module.exports = {
  logActivity,
  listActivityLogs,
};