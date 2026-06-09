const asyncHandler = require('../utils/asyncHandler');
const therapistService = require('../services/therapist.service');

const createTherapist = asyncHandler(async (req, res) => {
  const therapist = await therapistService.createTherapist(req.body);
  res.status(201).json({
    success: true,
    message: 'Therapist created successfully.',
    data: therapist,
  });
});

const getTherapists = asyncHandler(async (_req, res) => {
  const therapists = await therapistService.listTherapists();
  res.json({
    success: true,
    count: therapists.length,
    data: therapists,
  });
});

const updateTherapist = asyncHandler(async (req, res) => {
  const therapist = await therapistService.updateTherapist(req.params.id, req.body);
  res.json({
    success: true,
    message: 'Therapist updated successfully.',
    data: therapist,
  });
});

const deactivateTherapist = asyncHandler(async (req, res) => {
  const therapist = await therapistService.deactivateTherapist(req.params.id);
  res.json({
    success: true,
    message: 'Therapist deactivated successfully.',
    data: therapist,
  });
});

const deleteTherapist = asyncHandler(async (req, res) => {
  await therapistService.deleteTherapist(req.params.id);
  res.json({
    success: true,
    message: 'Therapist deleted successfully.',
  });
});

module.exports = {
  createTherapist,
  getTherapists,
  updateTherapist,
  deactivateTherapist,
  deleteTherapist,
};
