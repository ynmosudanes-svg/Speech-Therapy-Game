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
  const game = await gameService.createGame(req.body);
  res.status(201).json(game);
});

const updateGame = asyncHandler(async (req, res) => {
  const game = await gameService.updateGame(req.params.id, req.body);
  res.json(game);
});

const deleteGame = asyncHandler(async (req, res) => {
  await gameService.deleteGame(req.params.id);
  res.json({
    success: true,
    message: 'Game deleted successfully.',
  });
});

module.exports = {
  getGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
};
