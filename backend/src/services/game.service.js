const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { buildConfigFromPayload, normalizeGameRecord } = require('../utils/gameConfig');
const { PERMISSIONS, hasPermission } = require('../utils/permissions');
const { logActivity } = require('./audit.service');

const GAME_STATUSES = new Set(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']);
const STAFF_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'DATA_ENTRY', 'THERAPIST']);

function toJsonValue(value) {
  if (value === undefined || value === null) return null;
  return JSON.parse(JSON.stringify(value));
}

function getActorId(currentUser) {
  return currentUser?.userId || currentUser?.id || currentUser?.sub || null;
}

function isStaff(currentUser) {
  return STAFF_ROLES.has(currentUser?.role);
}

function normalizeStatus(status, fallback = 'DRAFT') {
  const normalized = String(status || '').trim().toUpperCase();
  return GAME_STATUSES.has(normalized) ? normalized : fallback;
}

function canUpdateGame(currentUser, game) {
  if (hasPermission(currentUser, PERMISSIONS.GAMES_UPDATE_ANY)) {
    return true;
  }

  const actorId = getActorId(currentUser);
  if (
    hasPermission(currentUser, PERMISSIONS.GAMES_UPDATE_OWN_DRAFT) &&
    game.status === 'DRAFT' &&
    game.createdById &&
    actorId &&
    game.createdById === actorId
  ) {
    return true;
  }

  if (
    currentUser?.role === 'THERAPIST' &&
    hasPermission(currentUser, PERMISSIONS.GAMES_EDUCATIONAL_REVIEW) &&
    ['DRAFT', 'UNDER_REVIEW'].includes(game.status)
  ) {
    return true;
  }

  return false;
}

function assertCanUpdateGame(currentUser, game) {
  if (!currentUser) {
    throw new ApiError(401, 'Authentication is required.');
  }

  if (!canUpdateGame(currentUser, game)) {
    throw new ApiError(403, 'You do not have permission to update this game.');
  }
}

function assertPermission(currentUser, permission) {
  if (!currentUser) {
    throw new ApiError(401, 'Authentication is required.');
  }

  if (!hasPermission(currentUser, permission)) {
    throw new ApiError(403, 'You do not have permission to perform this action.');
  }
}

function buildGameData(payload, existingGame = null) {
  const config = buildConfigFromPayload({
    ...(existingGame || {}),
    ...payload,
  });

  return {
    gameCode: payload.gameCode ?? existingGame?.gameCode,
    name: payload.name || payload.title || payload.nameAr || config?.name || existingGame?.name,
    title: payload.title || payload.name || config?.name || existingGame?.title || null,
    titleAr: payload.titleAr || payload.nameAr || config?.nameAr || existingGame?.titleAr || null,
    type: payload.type || config?.templateType || existingGame?.type,
    level: Number(payload.level || existingGame?.level || 1),
    config,
    isActive: payload.isActive ?? existingGame?.isActive ?? true,
    questionText: payload.questionText ?? existingGame?.questionText ?? null,
    questionTextAr: payload.questionTextAr ?? existingGame?.questionTextAr ?? null,
    questionAudio: payload.questionAudio ?? existingGame?.questionAudio ?? null,
    instructionText: payload.instructionText ?? existingGame?.instructionText ?? null,
    instructionTextAr: payload.instructionTextAr ?? existingGame?.instructionTextAr ?? null,
    instructionAudio: payload.instructionAudio ?? existingGame?.instructionAudio ?? null,
    targetImage: payload.targetImage ?? existingGame?.targetImage ?? null,
    options: payload.options ?? existingGame?.options ?? null,
    items: payload.items ?? existingGame?.items ?? null,
    successSound: payload.successSound ?? existingGame?.successSound ?? null,
    failSound: payload.failSound ?? existingGame?.failSound ?? null,
  };
}

async function createGameVersion(tx, gameId, snapshot, currentUser, changeType) {
  const versionNumber = await tx.gameVersion.count({ where: { gameId } }) + 1;

  await tx.gameVersion.create({
    data: {
      gameId,
      versionNumber,
      snapshot,
      changedById: getActorId(currentUser),
      changeType,
    },
  });
}

async function listGames(currentUser = null) {
  if (currentUser?.role === 'STUDENT') {
    const assignedGames = await prisma.studentGame.findMany({
      where: { studentId: currentUser.studentId },
      orderBy: { order: 'asc' },
      include: { game: true },
    });

    return assignedGames
      .filter((assignment) => assignment.game?.status === 'PUBLISHED' && assignment.game?.isActive)
      .map((assignment) => ({
        ...normalizeGameRecord(assignment.game),
        order: assignment.order,
      }));
  }

  const actorId = getActorId(currentUser);
  const where = currentUser?.role === 'DATA_ENTRY'
    ? { createdById: actorId || '__none__' }
    : isStaff(currentUser)
      ? {}
      : { status: 'PUBLISHED', isActive: true };

  const games = await prisma.game.findMany({
    where,
    orderBy: [{ level: 'asc' }, { createdAt: 'asc' }],
  });

  return games.map(normalizeGameRecord);
}

async function getGameById(gameId, currentUser = null) {
  if (currentUser?.role === 'STUDENT') {
    const assignedGame = await prisma.studentGame.findUnique({
      where: {
        studentId_gameId: {
          studentId: currentUser.studentId,
          gameId,
        },
      },
      include: { game: true },
    });

    if (!assignedGame || assignedGame.game?.status !== 'PUBLISHED' || !assignedGame.game?.isActive) {
      throw new ApiError(403, 'This game is not assigned to the student.');
    }

    return {
      ...normalizeGameRecord(assignedGame.game),
      order: assignedGame.order,
    };
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new ApiError(404, 'Game not found.');
  }

  if (currentUser?.role === 'DATA_ENTRY' && game.createdById !== getActorId(currentUser)) {
    throw new ApiError(403, 'You do not have permission to view this game.');
  }

  if (!isStaff(currentUser) && (game.status !== 'PUBLISHED' || !game.isActive)) {
    throw new ApiError(404, 'Game not found.');
  }

  return normalizeGameRecord(game);
}

async function createGame(payload, currentUser, req = null) {
  assertPermission(currentUser, PERMISSIONS.GAMES_CREATE);

  const actorId = getActorId(currentUser);
  const data = buildGameData(payload);
  const requestedStatus = normalizeStatus(payload.status, currentUser?.role === 'DATA_ENTRY' ? 'DRAFT' : 'DRAFT');
  const status = currentUser?.role === 'DATA_ENTRY' ? 'DRAFT' : requestedStatus;

  const createdGame = await prisma.$transaction(async (tx) => {
    const game = await tx.game.create({
      data: {
        ...data,
        status,
        isActive: status === 'PUBLISHED' ? true : data.isActive,
        createdById: actorId,
        updatedById: actorId,
        approvedById: status === 'APPROVED' ? actorId : null,
        publishedById: status === 'PUBLISHED' ? actorId : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    await createGameVersion(tx, game.id, game, currentUser, 'CREATE');
    return game;
  });

  await logActivity({ req, action: 'GAME_CREATED', entityType: 'Game', entityId: createdGame.id, after: createdGame });
  return normalizeGameRecord(createdGame);
}

async function updateGame(gameId, payload, currentUser, req = null) {
  const existingGame = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!existingGame) {
    throw new ApiError(404, 'Game not found.');
  }

  assertCanUpdateGame(currentUser, existingGame);

  if (existingGame.status === 'ARCHIVED' && !hasPermission(currentUser, PERMISSIONS.GAMES_RESTORE)) {
    throw new ApiError(403, 'Archived games must be restored before editing.');
  }

  const actorId = getActorId(currentUser);
  const data = buildGameData(payload, existingGame);
  delete data.status;

  const updatedGame = await prisma.$transaction(async (tx) => {
    const game = await tx.game.update({
      where: { id: gameId },
      data: {
        ...data,
        updatedById: actorId,
      },
    });

    await createGameVersion(tx, game.id, game, currentUser, 'UPDATE');
    return game;
  });

  await logActivity({
    req,
    action: 'GAME_UPDATED',
    entityType: 'Game',
    entityId: updatedGame.id,
    before: existingGame,
    after: updatedGame,
  });

  return normalizeGameRecord(updatedGame);
}

async function transitionGame(gameId, currentUser, req, nextStatus, permission, action, extraData = {}) {
  assertPermission(currentUser, permission);

  const existingGame = await prisma.game.findUnique({ where: { id: gameId } });
  if (!existingGame) {
    throw new ApiError(404, 'Game not found.');
  }

  const actorId = getActorId(currentUser);
  const updatedGame = await prisma.$transaction(async (tx) => {
    const game = await tx.game.update({
      where: { id: gameId },
      data: {
        status: nextStatus,
        isActive: nextStatus === 'PUBLISHED' ? true : nextStatus === 'ARCHIVED' ? false : existingGame.isActive,
        updatedById: actorId,
        ...extraData(actorId),
      },
    });

    await createGameVersion(tx, game.id, game, currentUser, action);
    return game;
  });

  await logActivity({ req, action: `GAME_${action}`, entityType: 'Game', entityId: gameId, before: existingGame, after: updatedGame });
  return normalizeGameRecord(updatedGame);
}

async function submitGameForReview(gameId, currentUser, req = null) {
  assertPermission(currentUser, PERMISSIONS.GAMES_SUBMIT_REVIEW);

  const existingGame = await prisma.game.findUnique({ where: { id: gameId } });
  if (!existingGame) {
    throw new ApiError(404, 'Game not found.');
  }

  const actorId = getActorId(currentUser);
  const ownsDraft = existingGame.status === 'DRAFT' && existingGame.createdById === actorId;
  if (!ownsDraft && !hasPermission(currentUser, PERMISSIONS.GAMES_UPDATE_ANY)) {
    throw new ApiError(403, 'You can only submit your own draft games for review.');
  }

  return transitionGame(gameId, currentUser, req, 'UNDER_REVIEW', PERMISSIONS.GAMES_SUBMIT_REVIEW, 'SUBMITTED_FOR_REVIEW', () => ({}));
}

function approveGame(gameId, currentUser, req = null) {
  return transitionGame(gameId, currentUser, req, 'APPROVED', PERMISSIONS.GAMES_APPROVE_CONTENT, 'APPROVED', (actorId) => ({
    reviewedById: actorId,
    approvedById: actorId,
    approvedAt: new Date(),
    rejectedById: null,
    rejectedAt: null,
  }));
}

function rejectGame(gameId, payload = {}, currentUser, req = null) {
  return transitionGame(gameId, currentUser, req, 'DRAFT', PERMISSIONS.GAMES_APPROVE_CONTENT, 'REJECTED', (actorId) => ({
    reviewedById: actorId,
    rejectedById: actorId,
    rejectedAt: new Date(),
    reviewNotes: String(payload.reviewNotes || '').trim() || null,
  }));
}

function publishGame(gameId, currentUser, req = null) {
  return transitionGame(gameId, currentUser, req, 'PUBLISHED', PERMISSIONS.GAMES_PUBLISH, 'PUBLISHED', (actorId) => ({
    publishedById: actorId,
    publishedAt: new Date(),
  }));
}

async function archiveGame(gameId, currentUser, req = null) {
  return transitionGame(gameId, currentUser, req, 'ARCHIVED', PERMISSIONS.GAMES_ARCHIVE, 'ARCHIVED', (actorId) => ({
    archivedById: actorId,
    archivedAt: new Date(),
  }));
}

function restoreGame(gameId, currentUser, req = null) {
  return transitionGame(gameId, currentUser, req, 'PUBLISHED', PERMISSIONS.GAMES_RESTORE, 'RESTORED', (actorId) => ({
    restoredById: actorId,
    restoredAt: new Date(),
    archivedById: null,
    archivedAt: null,
  }));
}

async function permanentlyDeleteGame(gameId, currentUser, req = null) {
  assertPermission(currentUser, PERMISSIONS.GAMES_PERMANENT_DELETE);

  const existingGame = await prisma.game.findUnique({ where: { id: gameId } });
  if (!existingGame) {
    throw new ApiError(404, 'Game not found.');
  }

  await prisma.game.delete({ where: { id: gameId } });
  await logActivity({ req, action: 'GAME_PERMANENT_DELETED', entityType: 'Game', entityId: gameId, before: existingGame });
}

function pickRestorableGameData(snapshot) {
  const fields = [
    'gameCode', 'name', 'title', 'titleAr', 'type', 'level', 'config', 'isActive', 'status',
    'questionText', 'questionTextAr', 'questionAudio', 'instructionText', 'instructionTextAr', 'instructionAudio',
    'targetImage', 'options', 'items', 'successSound', 'failSound', 'reviewedById', 'approvedById',
    'publishedById', 'archivedById', 'restoredById', 'rejectedById', 'reviewNotes', 'approvedAt', 'publishedAt', 'archivedAt', 'restoredAt', 'rejectedAt'
  ];

  return fields.reduce((data, field) => {
    if (Object.prototype.hasOwnProperty.call(snapshot, field)) {
      data[field] = snapshot[field];
    }
    return data;
  }, {});
}

async function listGameVersions(gameId, currentUser) {
  assertPermission(currentUser, PERMISSIONS.AUDIT_VIEW);

  await getGameById(gameId, currentUser);

  return prisma.gameVersion.findMany({
    where: { gameId },
    orderBy: { versionNumber: 'desc' },
  });
}

async function restoreGameVersion(gameId, versionId, currentUser, req = null) {
  assertPermission(currentUser, PERMISSIONS.GAMES_RESTORE);

  const existingGame = await prisma.game.findUnique({ where: { id: gameId } });
  if (!existingGame) {
    throw new ApiError(404, 'Game not found.');
  }

  const version = await prisma.gameVersion.findFirst({
    where: { id: versionId, gameId },
  });

  if (!version) {
    throw new ApiError(404, 'Game version not found.');
  }

  const actorId = getActorId(currentUser);
  const restoredGame = await prisma.$transaction(async (tx) => {
    const game = await tx.game.update({
      where: { id: gameId },
      data: {
        ...pickRestorableGameData(version.snapshot),
        updatedById: actorId,
        restoredById: actorId,
        restoredAt: new Date(),
      },
    });

    await createGameVersion(tx, game.id, game, currentUser, 'VERSION_RESTORED');
    return game;
  });

  await logActivity({ req, action: 'GAME_VERSION_RESTORED', entityType: 'Game', entityId: gameId, before: existingGame, after: restoredGame });
  return normalizeGameRecord(restoredGame);
}
module.exports = {
  listGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame: archiveGame,
  archiveGame,
  restoreGame,
  submitGameForReview,
  approveGame,
  rejectGame,
  publishGame,
  permanentlyDeleteGame,
  listGameVersions,
  restoreGameVersion,
};