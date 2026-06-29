const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { normalizeGameRecord } = require('../utils/gameConfig');

function mapLibraryRecord(library) {
  const items = Array.isArray(library.items) ? library.items : [];

  return {
    id: library.id,
    name: library.name,
    description: library.description || '',
    color: library.color || '#19add6',
    createdAt: library.createdAt,
    updatedAt: library.updatedAt,
    gamesCount: items.length,
    gameIds: items.map((item) => item.gameId),
    games: items.map((item) => ({
      ...normalizeGameRecord(item.game),
      libraryOrder: item.order,
    })),
  };
}

async function ensureGamesExist(gameIds = []) {
  if (!gameIds.length) return;

  const games = await prisma.game.findMany({
    where: {
      id: { in: gameIds },
    },
    select: { id: true },
  });

  if (games.length !== gameIds.length) {
    throw new ApiError(400, 'One or more selected games do not exist.');
  }
}
async function ensureGamesAreNotUsedInOtherLibraries(gameIds = [], currentLibraryId = null) {
  if (!gameIds.length) return;

  const usedItems = await prisma.gameLibraryItem.findMany({
    where: {
      gameId: { in: gameIds },
      ...(currentLibraryId ? { libraryId: { not: currentLibraryId } } : {}),
    },
    include: {
      library: { select: { id: true, name: true } },
      game: { select: { id: true, gameCode: true, name: true, title: true, titleAr: true } },
    },
  });

  if (!usedItems.length) return;

  const firstUsed = usedItems[0];
  const gameName = firstUsed.game?.titleAr || firstUsed.game?.name || firstUsed.game?.title || firstUsed.game?.gameCode || firstUsed.gameId;
  const libraryName = firstUsed.library?.name || 'another plan';
  throw new ApiError(409, 'Game "' + gameName + '" is already assigned to plan "' + libraryName + '".');
}

async function listLibraries() {
  const libraries = await prisma.gameLibrary.findMany({
    orderBy: [{ createdAt: 'asc' }],
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: {
          game: true,
        },
      },
    },
  });

  return libraries.map(mapLibraryRecord);
}

async function getLibraryById(libraryId) {
  const library = await prisma.gameLibrary.findUnique({
    where: { id: libraryId },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: {
          game: true,
        },
      },
    },
  });

  if (!library) {
    throw new ApiError(404, 'Library not found.');
  }

  return mapLibraryRecord(library);
}

async function createLibrary(payload) {
  const gameIds = Array.isArray(payload.gameIds)
    ? [...new Set(payload.gameIds.map((id) => String(id).trim()).filter(Boolean))]
    : [];

  await ensureGamesExist(gameIds);
  await ensureGamesAreNotUsedInOtherLibraries(gameIds);

  const library = await prisma.gameLibrary.create({
    data: {
      name: payload.name,
      description: payload.description || null,
      color: payload.color || '#19add6',
      items: {
        create: gameIds.map((gameId, index) => ({
          gameId,
          order: index,
        })),
      },
    },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: {
          game: true,
        },
      },
    },
  });

  return mapLibraryRecord(library);
}

async function updateLibrary(libraryId, payload) {
  const existingLibrary = await prisma.gameLibrary.findUnique({
    where: { id: libraryId },
  });

  if (!existingLibrary) {
    throw new ApiError(404, 'Library not found.');
  }

  const gameIds = Array.isArray(payload.gameIds)
    ? [...new Set(payload.gameIds.map((id) => String(id).trim()).filter(Boolean))]
    : null;

  if (gameIds) {
    await ensureGamesExist(gameIds);
    await ensureGamesAreNotUsedInOtherLibraries(gameIds, libraryId);
  }

  const updatedLibrary = await prisma.$transaction(async (tx) => {
    await tx.gameLibrary.update({
      where: { id: libraryId },
      data: {
        name: payload.name ?? existingLibrary.name,
        description: payload.description !== undefined ? payload.description || null : existingLibrary.description,
        color: payload.color || existingLibrary.color || '#19add6',
      },
    });

    if (Array.isArray(gameIds)) {
      await tx.gameLibraryItem.deleteMany({
        where: { libraryId },
      });

      if (gameIds.length) {
        await tx.gameLibraryItem.createMany({
          data: gameIds.map((gameId, index) => ({
            libraryId,
            gameId,
            order: index,
          })),
        });
      }
    }

    return tx.gameLibrary.findUnique({
      where: { id: libraryId },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            game: true,
          },
        },
      },
    });
  });

  return mapLibraryRecord(updatedLibrary);
}

async function deleteLibrary(libraryId) {
  await getLibraryById(libraryId);

  await prisma.gameLibrary.delete({
    where: { id: libraryId },
  });
}

module.exports = {
  listLibraries,
  getLibraryById,
  createLibrary,
  updateLibrary,
  deleteLibrary,
};
