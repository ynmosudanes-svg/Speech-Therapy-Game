const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { buildConfigFromPayload, normalizeGameRecord } = require('../utils/gameConfig');

async function listGames() {
  const games = await prisma.game.findMany({
    orderBy: [{ level: 'asc' }, { createdAt: 'asc' }],
  });

  return games.map(normalizeGameRecord);
}

async function getGameById(gameId) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new ApiError(404, 'Game not found.');
  }

  return normalizeGameRecord(game);
}

async function createGame(payload) {
  const config = buildConfigFromPayload(payload);
  const createdGame = await prisma.game.create({
    data: {
      gameCode: payload.gameCode,
      name: payload.name || payload.title || config?.name || config?.nameAr,
      title: payload.title || payload.name || config?.name || null,
      titleAr: payload.titleAr || payload.nameAr || config?.nameAr || null,
      type: payload.type || config?.templateType,
      level: 1,
      config,
      isActive: payload.isActive ?? true,
      questionText: payload.questionText || null,
      questionTextAr: payload.questionTextAr || null,
      questionAudio: payload.questionAudio || null,
      instructionText: payload.instructionText || null,
      instructionTextAr: payload.instructionTextAr || null,
      instructionAudio: payload.instructionAudio || null,
      targetImage: payload.targetImage || null,
      options: payload.options || null,
      items: payload.items || null,
      successSound: payload.successSound || null,
      failSound: payload.failSound || null,
    },
  });

  return normalizeGameRecord(createdGame);
}

async function updateGame(gameId, payload) {
  const existingGame = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!existingGame) {
    throw new ApiError(404, 'Game not found.');
  }

  console.log("PAYLOAD RECEIVED:", JSON.stringify(payload.config?.levels?.[0]?.activities?.[0], null, 2));
  
  const config = buildConfigFromPayload({
    ...existingGame,
    ...payload,
  });

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      gameCode: payload.gameCode ?? existingGame.gameCode,
      name: payload.name || payload.title || payload.nameAr || config?.name || existingGame.name,
      title: payload.title || payload.name || config?.name || existingGame.title || null,
      titleAr: payload.titleAr || payload.nameAr || config?.nameAr || existingGame.titleAr || null,
      type: payload.type || config?.templateType || existingGame.type,
      level: 1,
      config,
      isActive: payload.isActive ?? true,
      questionText: payload.questionText ?? existingGame.questionText ?? null,
      questionTextAr: payload.questionTextAr ?? existingGame.questionTextAr ?? null,
      questionAudio: payload.questionAudio ?? existingGame.questionAudio ?? null,
      instructionText: payload.instructionText ?? existingGame.instructionText ?? null,
      instructionTextAr: payload.instructionTextAr ?? existingGame.instructionTextAr ?? null,
      instructionAudio: payload.instructionAudio ?? existingGame.instructionAudio ?? null,
      targetImage: payload.targetImage ?? existingGame.targetImage ?? null,
      options: payload.options ?? existingGame.options ?? null,
      items: payload.items ?? existingGame.items ?? null,
      successSound: payload.successSound ?? existingGame.successSound ?? null,
      failSound: payload.failSound ?? existingGame.failSound ?? null,
    },
  });

  return normalizeGameRecord(updatedGame);
}

async function deleteGame(gameId) {
  await getGameById(gameId);

  await prisma.game.delete({
    where: { id: gameId },
  });
}

module.exports = {
  listGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
};
