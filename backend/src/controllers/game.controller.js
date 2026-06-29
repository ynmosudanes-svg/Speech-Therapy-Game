const asyncHandler = require('../utils/asyncHandler');
const gameService = require('../services/game.service');

const getGames = asyncHandler(async (req, res) => {
  const games = await gameService.listGames(req.user);
  res.json(games);
});

const getGame = asyncHandler(async (req, res) => {
  const game = await gameService.getGameById(req.params.id, req.user);
  res.json(game);
});

const createGame = asyncHandler(async (req, res) => {
  const game = await gameService.createGame(req.body, req.user, req);
  res.status(201).json(game);
});

const updateGame = asyncHandler(async (req, res) => {
  const game = await gameService.updateGame(req.params.id, req.body, req.user, req);
  res.json(game);
});

const deleteGame = asyncHandler(async (req, res) => {
  const game = await gameService.deleteGame(req.params.id, req.user, req);
  res.json({
    success: true,
    message: 'Game archived successfully.',
    data: game,
  });
});

const submitGameForReview = asyncHandler(async (req, res) => {
  const game = await gameService.submitGameForReview(req.params.id, req.user, req);
  res.json({ success: true, data: game });
});

const approveGame = asyncHandler(async (req, res) => {
  const game = await gameService.approveGame(req.params.id, req.user, req);
  res.json({ success: true, data: game });
});

const rejectGame = asyncHandler(async (req, res) => {
  const game = await gameService.rejectGame(req.params.id, req.body, req.user, req);
  res.json({ success: true, data: game });
});

const publishGame = asyncHandler(async (req, res) => {
  const game = await gameService.publishGame(req.params.id, req.user, req);
  res.json({ success: true, data: game });
});

const archiveGame = asyncHandler(async (req, res) => {
  const game = await gameService.archiveGame(req.params.id, req.user, req);
  res.json({ success: true, data: game });
});

const restoreGame = asyncHandler(async (req, res) => {
  const game = await gameService.restoreGame(req.params.id, req.user, req);
  res.json({ success: true, data: game });
});

const permanentlyDeleteGame = asyncHandler(async (req, res) => {
  await gameService.permanentlyDeleteGame(req.params.id, req.user, req);
  res.json({ success: true, message: 'Game permanently deleted successfully.' });
});

const getGameVersions = asyncHandler(async (req, res) => {
  const versions = await gameService.listGameVersions(req.params.id, req.user);
  res.json({ success: true, count: versions.length, data: versions });
});

const restoreGameVersion = asyncHandler(async (req, res) => {
  const game = await gameService.restoreGameVersion(req.params.id, req.params.versionId, req.user, req);
  res.json({ success: true, data: game });
});
module.exports = {
  getGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  submitGameForReview,
  approveGame,
  rejectGame,
  publishGame,
  archiveGame,
  restoreGame,
  permanentlyDeleteGame,
  getGameVersions,
  restoreGameVersion,
};