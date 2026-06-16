const asyncHandler = require('../utils/asyncHandler');
const gameLibraryService = require('../services/gameLibrary.service');

const getLibraries = asyncHandler(async (_req, res) => {
  const libraries = await gameLibraryService.listLibraries();
  res.json(libraries);
});

const getLibrary = asyncHandler(async (req, res) => {
  const library = await gameLibraryService.getLibraryById(req.params.id);
  res.json(library);
});

const createLibrary = asyncHandler(async (req, res) => {
  const library = await gameLibraryService.createLibrary(req.body);
  res.status(201).json(library);
});

const updateLibrary = asyncHandler(async (req, res) => {
  const library = await gameLibraryService.updateLibrary(req.params.id, req.body);
  res.json(library);
});

const deleteLibrary = asyncHandler(async (req, res) => {
  await gameLibraryService.deleteLibrary(req.params.id);
  res.json({
    success: true,
    message: 'Library deleted successfully.',
  });
});

module.exports = {
  getLibraries,
  getLibrary,
  createLibrary,
  updateLibrary,
  deleteLibrary,
};
