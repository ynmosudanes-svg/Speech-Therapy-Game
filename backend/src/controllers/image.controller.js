const asyncHandler = require('../utils/asyncHandler');
const imageService = require('../services/image.service');
const { logActivity } = require('../services/audit.service');

const searchImages = asyncHandler(async (req, res) => {
  const results = await imageService.searchImages(req.query.query, req.query.provider);
  res.json(results);
});

const saveImage = asyncHandler(async (req, res) => {
  const image = await imageService.saveImage(req.body);
  await logActivity({ req, action: 'IMAGE_LIBRARY_SAVED', entityType: 'ImageLibrary', entityId: image.id, after: image });
  res.status(201).json({
    success: true,
    data: image,
  });
});

const getLibrary = asyncHandler(async (req, res) => {
  const images = await imageService.listLibrary(req.query);
  res.json({
    success: true,
    count: images.length,
    data: images,
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const image = await imageService.deleteImage(req.params.id);
  await logActivity({ req, action: 'IMAGE_LIBRARY_DELETED', entityType: 'ImageLibrary', entityId: image.id, before: image });
  res.json({
    success: true,
    data: image,
  });
});

module.exports = {
  searchImages,
  saveImage,
  getLibrary,
  deleteImage,
};